import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { encode as base64Encode } from "https://deno.land/std@0.190.0/encoding/base64.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// ---------- TWILIO SMS ----------

async function sendSms(to: string, body: string): Promise<boolean> {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const fromNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

  if (!accountSid || !authToken || !fromNumber) {
    console.warn("Twilio credentials not configured, skipping SMS");
    return false;
  }

  let normalizedTo = to.replace(/\s+/g, "");
  if (normalizedTo.startsWith("0")) normalizedTo = "+40" + normalizedTo.substring(1);
  if (!normalizedTo.startsWith("+")) normalizedTo = "+" + normalizedTo;

  if (!/^\+[1-9]\d{6,14}$/.test(normalizedTo)) {
    console.warn(`Invalid phone number format: ${normalizedTo}`);
    return false;
  }

  try {
    const credentials = base64Encode(`${accountSid}:${authToken}`);
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: normalizedTo, From: fromNumber, Body: body }),
      }
    );
    if (!response.ok) {
      console.error(`Twilio SMS failed [${response.status}]: ${await response.text()}`);
      return false;
    }
    console.log(`SMS sent to ${normalizedTo}`);
    return true;
  } catch (err) {
    console.error("Twilio SMS error:", err);
    return false;
  }
}

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  "https://822cb615-8c38-4524-bedf-f2603ff01820.lovableproject.com",
  "http://localhost:5173",
  "http://localhost:3000"
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) 
    ? origin 
    : ALLOWED_ORIGINS[0];
  
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

// Escape HTML to prevent XSS in emails
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text || '').replace(/[&<>"']/g, (m) => map[m]);
}

const handler = async (req: Request): Promise<Response> => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST for scheduled cron jobs or admin calls
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  // Validate authorization token for cron job security
  const authHeader = req.headers.get("Authorization");
  const expectedToken = Deno.env.get("CRON_SECRET_TOKEN");
  
  if (!expectedToken) {
    console.error("CRON_SECRET_TOKEN not configured");
    return new Response(
      JSON.stringify({ error: "Server configuration error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
  
  if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
    console.warn("Unauthorized access attempt to send-booking-reminders");
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    // Use service role key for scheduled tasks (no user context)
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    // Fetch bookings happening in 24-48 hours
    const { data: bookings, error: bookingsError } = await supabaseClient
      .from("bookings")
      .select(`
        id,
        booking_date,
        participants,
        user_id,
        experiences (
          title,
          location_name
        )
      `)
      .eq("status", "confirmed")
      .gte("booking_date", in24Hours.toISOString())
      .lte("booking_date", in48Hours.toISOString())
      .limit(100);

    if (bookingsError) {
      throw bookingsError;
    }

    console.log(`Processing ${bookings?.length || 0} booking reminders`);

    interface BookingWithExperience {
      id: string;
      booking_date: string;
      participants: number;
      user_id: string;
      experiences: { title: string; location_name: string } | null;
    }

    let successCount = 0;

    for (const booking of (bookings || []) as unknown as BookingWithExperience[]) {
      try {
        // Fetch user profile
        const { data: profile } = await supabaseClient
          .from("profiles")
          .select("full_name, email, phone")
          .eq("id", booking.user_id)
          .single();

        if (!profile?.email) {
          continue;
        }

        // Check SMS preferences
        const { data: prefs } = await supabaseClient
          .from("notification_preferences")
          .select("sms_booking_reminder, email_booking_reminder")
          .eq("user_id", booking.user_id)
          .single();

        const bookingDate = new Date(booking.booking_date);
        const hoursUntil = Math.round((bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60));
        const formattedDate = bookingDate.toLocaleDateString("ro-RO", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        // Sanitize user-generated content
        const safeName = escapeHtml(profile.full_name || "");
        const safeTitle = escapeHtml(booking.experiences?.title || "Experiență");
        const safeLocation = escapeHtml(booking.experiences?.location_name || "");

        const emailHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
                .detail-label { font-weight: 600; color: #666; }
                .countdown { background: #fef3c7; color: #92400e; padding: 20px; border-radius: 8px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0; }
                .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>⏰ Reminder: Experiența ta se apropie!</h1>
                </div>
                <div class="content">
                  <p>Bună ${safeName},</p>
                  <p>Doar un reminder prietenos că experiența ta este foarte aproape!</p>
                  
                  <div class="countdown">
                    🕐 ${hoursUntil} ore până la experiență
                  </div>

                  <div class="booking-details">
                    <h2 style="margin-top: 0; color: #f59e0b;">Detalii experiență</h2>
                    
                    <div class="detail-row">
                      <span class="detail-label">Experiență:</span>
                      <span>${safeTitle}</span>
                    </div>
                    
                    <div class="detail-row">
                      <span class="detail-label">Locație:</span>
                      <span>${safeLocation}</span>
                    </div>
                    
                    <div class="detail-row">
                      <span class="detail-label">Data și ora:</span>
                      <span>${formattedDate}</span>
                    </div>
                    
                    <div class="detail-row" style="border-bottom: none;">
                      <span class="detail-label">Număr participanți:</span>
                      <span>${booking.participants}</span>
                    </div>
                  </div>

                  <p><strong>Pregătește-te:</strong></p>
                  <ul>
                    <li>Verifică locația și planifică ruta</li>
                    <li>Ajunge cu 10-15 minute înainte</li>
                    <li>Asigură-te că ai tot ce ai nevoie pentru experiență</li>
                  </ul>

                  <div style="text-align: center;">
                    <a href="https://822cb615-8c38-4524-bedf-f2603ff01820.lovableproject.com/my-bookings" class="button">Vezi detalii rezervare</a>
                  </div>

                  <p style="margin-top: 30px; color: #666;">Ne vedem în curând!</p>

                  <div class="footer">
                    <p>Ai întrebări? Contactează-ne oricând!</p>
                    <p>© ${new Date().getFullYear()} Experium. Toate drepturile rezervate.</p>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `;

        // Send email if preference allows
        const shouldSendEmail = !prefs || prefs.email_booking_reminder !== false;
        if (shouldSendEmail) {
          await resend.emails.send({
            from: "Experium <onboarding@resend.dev>",
            to: [profile.email],
            subject: `Reminder: ${safeTitle} - peste ${hoursUntil} ore!`,
            html: emailHtml,
          });
        }

        // Send SMS reminder
        const shouldSendSms = profile.phone && (!prefs || prefs.sms_booking_reminder !== false);
        if (shouldSendSms && profile.phone) {
          const smsBody = `Experium: Reminder - experiența ${safeTitle} la ${safeLocation} este mâine, ${formattedDate}. Ajunge cu 10-15 min înainte!`;
          await sendSms(profile.phone, smsBody);
        }

        successCount++;
      } catch (error) {
        console.error(`Error processing booking ${booking.id}:`, error);
      }
    }

    console.log(`Sent ${successCount} reminder emails`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        bookingsProcessed: bookings?.length || 0,
        emailsSent: successCount
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    console.error("Error sending booking reminders:", errorMessage);
    
    return new Response(
      JSON.stringify({ error: "Failed to send reminders" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
