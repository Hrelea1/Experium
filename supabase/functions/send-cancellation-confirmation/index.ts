import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CancellationConfirmationRequest {
  bookingId: string;
  refundEligible: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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

    const { bookingId, refundEligible }: CancellationConfirmationRequest = await req.json();

    // Fetch booking details
    const { data: booking, error: bookingError } = await supabaseClient
      .from("bookings")
      .select(`
        *,
        experiences (
          title,
          location_name
        )
      `)
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error("Booking not found");
    }

    // Fetch user profile
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("full_name, email")
      .eq("id", booking.user_id)
      .single();

    const bookingDate = new Date(booking.booking_date);
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
              <p>Bună ${profile?.full_name || ""},</p>
              <p>Rezervarea ta a fost anulată cu succes.</p>
              
              <div class="booking-details">
                <h2 style="margin-top: 0; color: #ef4444;">Detalii rezervare anulată</h2>
                
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

              ${booking.cancellation_reason ? `
                <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <strong>Motiv anulare:</strong>
                  <p style="margin: 10px 0 0 0; color: #666;">${booking.cancellation_reason}</p>
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

    const emailResponse = await resend.emails.send({
      from: "Experium <onboarding@resend.dev>",
      to: [profile?.email || ""],
      subject: `Rezervare anulată - ${booking.experiences.title}`,
      html: emailHtml,
    });

    console.log("Cancellation confirmation email sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending cancellation confirmation:", error);
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
