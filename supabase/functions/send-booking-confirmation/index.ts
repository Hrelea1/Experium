import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingConfirmationRequest {
  bookingId: string;
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

    const { bookingId }: BookingConfirmationRequest = await req.json();

    // Fetch booking details
    const { data: booking, error: bookingError } = await supabaseClient
      .from("bookings")
      .select(`
        *,
        experiences (
          title,
          location_name,
          description
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
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .detail-label { font-weight: 600; color: #666; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Rezervare confirmată!</h1>
            </div>
            <div class="content">
              <p>Bună ${profile?.full_name || ""},</p>
              <p>Rezervarea ta a fost confirmată cu succes! Ne bucurăm să te avem alături la această experiență!</p>
              
              <div class="booking-details">
                <h2 style="margin-top: 0; color: #667eea;">Detalii rezervare</h2>
                
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

              <p><strong>Important:</strong> Anularea gratuită este posibilă cu minimum 48 de ore înainte de experiență. Poți reprograma o singură dată, tot cu 48 de ore înainte.</p>

              <div style="text-align: center;">
                <a href="${Deno.env.get("SUPABASE_URL")?.replace("https://", "https://822cb615-8c38-4524-bedf-f2603ff01820.lovableproject.com/")}" class="button">Vezi detalii rezervare</a>
              </div>

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
      subject: `Rezervare confirmată - ${booking.experiences.title}`,
      html: emailHtml,
    });

    console.log("Booking confirmation email sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending booking confirmation:", error);
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
