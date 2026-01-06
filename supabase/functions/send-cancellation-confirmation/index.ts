import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

// Escape HTML to prevent XSS
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

interface CancellationConfirmationRequest {
  bookingId: string;
  refundEligible: boolean;
}

// Input validation
function validateInput(data: unknown): CancellationConfirmationRequest {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid request body');
  }
  
  const { bookingId, refundEligible } = data as Record<string, unknown>;
  
  // Validate bookingId - must be UUID format
  if (!bookingId || typeof bookingId !== 'string') {
    throw new Error('bookingId is required');
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(bookingId)) {
    throw new Error('bookingId must be a valid UUID');
  }
  
  if (typeof refundEligible !== 'boolean') {
    throw new Error('refundEligible must be a boolean');
  }
  
  return { bookingId, refundEligible };
}

const handler = async (req: Request): Promise<Response> => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Verify user authentication
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate input
    const rawBody = await req.json();
    const { bookingId, refundEligible } = validateInput(rawBody);

    interface BookingWithExperience {
      id: string;
      booking_date: string;
      participants: number;
      total_price: number;
      cancellation_reason: string | null;
      user_id: string;
      experiences: { title: string; location_name: string } | null;
    }

    // Fetch booking details - only for user's own bookings
    const { data: bookingData, error: bookingError } = await supabaseClient
      .from("bookings")
      .select(`
        id,
        booking_date,
        participants,
        total_price,
        cancellation_reason,
        user_id,
        experiences (
          title,
          location_name
        )
      `)
      .eq("id", bookingId)
      .eq("user_id", user.id)
      .single();

    if (bookingError || !bookingData) {
      return new Response(
        JSON.stringify({ error: "Booking not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const booking = bookingData as unknown as BookingWithExperience;

    // Fetch user profile
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("full_name, email")
      .eq("id", booking.user_id)
      .single();

    if (!profile?.email) {
      return new Response(
        JSON.stringify({ error: "User email not found" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const bookingDate = new Date(booking.booking_date);
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
    const safeCancellationReason = escapeHtml(booking.cancellation_reason || "");

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .detail-label { font-weight: 600; color: #666; }
            .refund-notice { background: ${refundEligible ? "#dcfce7" : "#fee2e2"}; color: ${refundEligible ? "#166534" : "#991b1b"}; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${refundEligible ? "#22c55e" : "#ef4444"}; }
            .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>❌ Rezervare anulată</h1>
            </div>
            <div class="content">
              <p>Bună ${safeName},</p>
              <p>Rezervarea ta a fost anulată cu succes.</p>
              
              <div class="booking-details">
                <h2 style="margin-top: 0; color: #ef4444;">Detalii rezervare anulată</h2>
                
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
                
                <div class="detail-row">
                  <span class="detail-label">Număr participanți:</span>
                  <span>${booking.participants}</span>
                </div>
                
                <div class="detail-row" style="border-bottom: none;">
                  <span class="detail-label">Preț total:</span>
                  <span><strong>${booking.total_price} RON</strong></span>
                </div>
              </div>

              <div class="refund-notice">
                <strong>${refundEligible ? "✅ Eligibil pentru refund" : "⚠️ Nu ești eligibil pentru refund"}</strong>
                <p style="margin: 10px 0 0 0;">
                  ${refundEligible 
                    ? "Ai anulat cu mai mult de 48 de ore înainte. Vei primi un refund complet în 5-7 zile lucrătoare." 
                    : "Ai anulat cu mai puțin de 48 de ore înainte de experiență. Conform politicii noastre de anulare, nu poți primi un refund."}
                </p>
              </div>

              ${safeCancellationReason ? `
                <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <strong>Motiv anulare:</strong>
                  <p style="margin: 10px 0 0 0; color: #666;">${safeCancellationReason}</p>
                </div>
              ` : ""}

              <p>Îți mulțumim pentru înțelegere și sperăm să te revedem curând!</p>

              <div class="footer">
                <p>Ai întrebări? Contactează-ne oricând!</p>
                <p>© ${new Date().getFullYear()} Experium. Toate drepturile rezervate.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    await resend.emails.send({
      from: "Experium <onboarding@resend.dev>",
      to: [profile.email],
      subject: `Rezervare anulată - ${safeTitle}`,
      html: emailHtml,
    });

    console.log("Cancellation confirmation email sent successfully");

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    console.error("Error sending cancellation confirmation:", errorMessage);
    
    return new Response(
      JSON.stringify({ error: "Failed to send confirmation" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
