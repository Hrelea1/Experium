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

interface BookingConfirmationRequest {
  bookingId: string;
}

// Input validation
function validateInput(data: unknown): BookingConfirmationRequest {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid request body');
  }
  
  const { bookingId } = data as Record<string, unknown>;
  
  // Validate bookingId - must be UUID format
  if (!bookingId || typeof bookingId !== 'string') {
    throw new Error('bookingId is required');
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(bookingId)) {
    throw new Error('bookingId must be a valid UUID');
  }
  
  return { bookingId };
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
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

const handler = async (req: Request): Promise<Response> => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST
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

    // Get the user first - only authenticated users can send confirmations
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
    const { bookingId } = validateInput(rawBody);

    // Fetch booking details - only allow user to access their own bookings
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
      .eq("user_id", user.id)  // Security: only user's own bookings
      .single();

    if (bookingError || !booking) {
      return new Response(
        JSON.stringify({ error: "Booking not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

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

    // Escape user-generated content to prevent XSS
    const safeName = escapeHtml(profile?.full_name || "");
    const safeTitle = escapeHtml(booking.experiences.title);
    const safeLocation = escapeHtml(booking.experiences.location_name);

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
              <p>Bună ${safeName},</p>
              <p>Rezervarea ta a fost confirmată cu succes! Ne bucurăm să te avem alături la această experiență!</p>
              
              <div class="booking-details">
                <h2 style="margin-top: 0; color: #667eea;">Detalii rezervare</h2>
                
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

              <p><strong>Important:</strong> Anularea gratuită este posibilă cu minimum 48 de ore înainte de experiență. Poți reprograma o singură dată, tot cu 48 de ore înainte.</p>

              <div style="text-align: center;">
                <a href="https://822cb615-8c38-4524-bedf-f2603ff01820.lovableproject.com/my-bookings" class="button">Vezi detalii rezervare</a>
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
      to: [profile.email],
      subject: `Rezervare confirmată - ${safeTitle}`,
      html: emailHtml,
    });

    // Don't log sensitive email details
    console.log("Booking confirmation email sent successfully");

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    console.error("Error sending booking confirmation:", errorMessage);
    
    return new Response(
      JSON.stringify({ error: "Failed to send confirmation email" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
