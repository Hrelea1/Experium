import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
        *,
        experiences (
          title,
          location_name,
          description
        )
      `)
      .eq("status", "confirmed")
      .gte("booking_date", in24Hours.toISOString())
      .lte("booking_date", in48Hours.toISOString());

    if (bookingsError) {
      throw bookingsError;
    }

    console.log(`Found ${bookings?.length || 0} bookings to send reminders for`);

    const emailPromises = (bookings || []).map(async (booking) => {
      // Fetch user profile
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("full_name, email")
        .eq("id", booking.user_id)
        .single();

      if (!profile?.email) {
        console.log(`No email found for booking ${booking.id}`);
        return null;
      }

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
                <p>Bună ${profile.full_name || ""},</p>
                <p>Doar un reminder prietenos că experiența ta este foarte aproape!</p>
                
                <div class="countdown">
                  🕐 ${hoursUntil} ore până la experiență
                </div>

                <div class="booking-details">
                  <h2 style="margin-top: 0; color: #f59e0b;">Detalii experiență</h2>
                  
                  <div class="detail-row">
                    <span class="detail-label">Experiență:</span>
                    <span>${booking.experiences.title}</span>
                  </div>
                  
                  <div class="detail-row">
                    <span class="detail-label">Locație:</span>
                    <span>${booking.experiences.location_name}</span>
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
                  <a href="${Deno.env.get("SUPABASE_URL")?.replace("https://", "https://822cb615-8c38-4524-bedf-f2603ff01820.lovableproject.com/")}" class="button">Vezi detalii rezervare</a>
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

      try {
        const emailResponse = await resend.emails.send({
          from: "Experium <onboarding@resend.dev>",
          to: [profile.email],
          subject: `Reminder: ${booking.experiences.title} - peste ${hoursUntil} ore!`,
          html: emailHtml,
        });

        console.log(`Reminder sent for booking ${booking.id}:`, emailResponse);
        return emailResponse;
      } catch (error) {
        console.error(`Error sending reminder for booking ${booking.id}:`, error);
        return null;
      }
    });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter(r => r !== null).length;

    return new Response(
      JSON.stringify({ 
        success: true, 
        bookingsProcessed: bookings?.length || 0,
        emailsSent: successCount
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending booking reminders:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
