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

const handler = async (req: Request): Promise<Response> => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST for scheduled cron jobs
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    // Use service role key for scheduled tasks
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    interface VoucherWithExperience {
      id: string;
      code: string;
      expiry_date: string;
      purchase_price: number;
      user_id: string;
      experiences: { title: string; location_name: string } | null;
    }

    // Fetch active vouchers expiring in 30 days
    const { data: vouchersData, error: vouchersError } = await supabaseClient
      .from("vouchers")
      .select(`
        id,
        code,
        expiry_date,
        purchase_price,
        user_id,
        experiences (
          title,
          location_name
        )
      `)
      .eq("status", "active")
      .not("user_id", "is", null)
      .gte("expiry_date", now.toISOString())
      .lte("expiry_date", in30Days.toISOString())
      .limit(100);

    if (vouchersError) {
      throw vouchersError;
    }

    const vouchers = (vouchersData || []) as unknown as VoucherWithExperience[];

    console.log(`Processing ${vouchers.length} voucher expiry alerts`);

    let successCount = 0;

    for (const voucher of vouchers || []) {
      try {
        // Fetch user profile
        const { data: profile } = await supabaseClient
          .from("profiles")
          .select("full_name, email")
          .eq("id", voucher.user_id)
          .single();

        if (!profile?.email) {
          continue;
        }

        const expiryDate = new Date(voucher.expiry_date);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const formattedExpiryDate = expiryDate.toLocaleDateString("ro-RO", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        // Sanitize user-generated content
        const safeName = escapeHtml(profile.full_name || "");
        const safeTitle = escapeHtml(voucher.experiences?.title || "Experiență");
        const safeLocation = escapeHtml(voucher.experiences?.location_name || "");
        // Note: voucher.code is system-generated and safe

        const emailHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .voucher-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #dc2626; }
                .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
                .detail-label { font-weight: 600; color: #666; }
                .countdown { background: #fee2e2; color: #991b1b; padding: 20px; border-radius: 8px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0; }
                .button { display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>⚠️ Voucherul tău expiră în curând!</h1>
                </div>
                <div class="content">
                  <p>Bună ${safeName},</p>
                  <p>Vrem să te avertizăm că voucherul tău pentru <strong>${safeTitle}</strong> va expira în curând!</p>
                  
                  <div class="countdown">
                    ⏰ ${daysUntilExpiry} ${daysUntilExpiry === 1 ? 'zi' : 'zile'} până la expirare
                  </div>

                  <div class="voucher-details">
                    <h2 style="margin-top: 0; color: #dc2626;">Detalii voucher</h2>
                    
                    <div class="detail-row">
                      <span class="detail-label">Experiență:</span>
                      <span>${safeTitle}</span>
                    </div>
                    
                    <div class="detail-row">
                      <span class="detail-label">Locație:</span>
                      <span>${safeLocation}</span>
                    </div>
                    
                    <div class="detail-row">
                      <span class="detail-label">Cod voucher:</span>
                      <span><strong>${voucher.code}</strong></span>
                    </div>
                    
                    <div class="detail-row">
                      <span class="detail-label">Valoare:</span>
                      <span><strong>${voucher.purchase_price} RON</strong></span>
                    </div>
                    
                    <div class="detail-row" style="border-bottom: none;">
                      <span class="detail-label">Data expirării:</span>
                      <span style="color: #dc2626;"><strong>${formattedExpiryDate}</strong></span>
                    </div>
                  </div>

                  <p><strong>Nu pierde această oportunitate!</strong></p>
                  <p>Folosește voucherul tău până la ${formattedExpiryDate} pentru a te bucura de această experiență unică.</p>

                  <div style="text-align: center;">
                    <a href="https://822cb615-8c38-4524-bedf-f2603ff01820.lovableproject.com/redeem-voucher" class="button">Folosește voucherul acum</a>
                  </div>

                  <p style="margin-top: 30px; color: #666; font-size: 14px;">
                    <strong>Notă:</strong> După data de expirare, voucherul nu va mai putea fi utilizat și nu va fi eligibil pentru refund.
                  </p>

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
          subject: `⚠️ Voucherul tău expiră în ${daysUntilExpiry} ${daysUntilExpiry === 1 ? 'zi' : 'zile'}!`,
          html: emailHtml,
        });

        successCount++;
      } catch (error) {
        console.error(`Error processing voucher ${voucher.id}:`, error);
      }
    }

    console.log(`Sent ${successCount} expiry alert emails`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        vouchersProcessed: vouchers?.length || 0,
        emailsSent: successCount
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    console.error("Error sending voucher expiry alerts:", errorMessage);
    
    return new Response(
      JSON.stringify({ error: "Failed to send alerts" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
