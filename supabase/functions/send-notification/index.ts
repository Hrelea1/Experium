import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Escape HTML to prevent XSS in emails
function escapeHtml(text: string): string {
  const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(text || '').replace(/[&<>"']/g, (m) => map[m]);
}

type EventType =
  | "booking_confirmed"
  | "booking_cancelled"
  | "booking_reminder"
  | "provider_new_booking"
  | "provider_booking_cancelled";

interface NotificationRequest {
  event_type: EventType;
  booking_id?: string;
  voucher_id?: string;
}

function validateInput(data: unknown): NotificationRequest {
  if (!data || typeof data !== "object") throw new Error("Invalid request body");
  const { event_type, booking_id, voucher_id } = data as Record<string, unknown>;

  const validEvents: EventType[] = [
    "booking_confirmed", "booking_cancelled", "booking_reminder",
    "provider_new_booking", "provider_booking_cancelled",
  ];
  if (!event_type || !validEvents.includes(event_type as EventType)) {
    throw new Error("Invalid event_type");
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (booking_id && (typeof booking_id !== "string" || !uuidRegex.test(booking_id))) {
    throw new Error("Invalid booking_id");
  }

  return { event_type: event_type as EventType, booking_id: booking_id as string | undefined, voucher_id: voucher_id as string | undefined };
}

// ---------- EMAIL TEMPLATES ----------

function bookingConfirmedClient(vars: Record<string, string>): { subject: string; html: string } {
  return {
    subject: `Rezervare confirmată - ${vars.title}`,
    html: `<!DOCTYPE html><html><head><style>
      body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Roboto',sans-serif;line-height:1.6;color:#333}
      .container{max-width:600px;margin:0 auto;padding:20px}
      .header{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;padding:30px;text-align:center;border-radius:10px 10px 0 0}
      .content{background:#f9f9f9;padding:30px;border-radius:0 0 10px 10px}
      .details{background:#fff;padding:20px;border-radius:8px;margin:20px 0}
      .row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #eee}
      .label{font-weight:600;color:#666}
      .btn{display:inline-block;background:#667eea;color:#fff;padding:12px 30px;text-decoration:none;border-radius:5px;margin:20px 0}
      .footer{text-align:center;color:#999;font-size:12px;margin-top:30px}
    </style></head><body><div class="container">
      <div class="header"><h1>✅ Rezervare confirmată!</h1></div>
      <div class="content">
        <p>Bună ${vars.clientName},</p>
        <p>Rezervarea ta a fost confirmată cu succes!</p>
        <div class="details">
          <h2 style="margin-top:0;color:#667eea">Detalii rezervare</h2>
          <div class="row"><span class="label">Experiență:</span><span>${vars.title}</span></div>
          <div class="row"><span class="label">Locație:</span><span>${vars.location}</span></div>
          <div class="row"><span class="label">Data și ora:</span><span>${vars.date}</span></div>
          <div class="row"><span class="label">Participanți:</span><span>${vars.participants}</span></div>
          <div class="row"><span class="label">Furnizor:</span><span>${vars.providerName || 'N/A'}</span></div>
          <div class="row" style="border-bottom:none"><span class="label">Total:</span><span><strong>${vars.totalPrice} RON</strong></span></div>
        </div>
        ${vars.cancellationPolicy ? `<p><strong>Politică anulare:</strong> ${vars.cancellationPolicy}</p>` : ''}
        <p><strong>Important:</strong> Anularea gratuită e posibilă cu min. 48h înainte.</p>
        <p>ID Rezervare: <code>${vars.bookingId}</code></p>
        <div class="footer">
          <p>Ai întrebări? Contactează-ne oricând!</p>
          <p>© ${new Date().getFullYear()} Experium. Toate drepturile rezervate.</p>
        </div>
      </div>
    </div></body></html>`,
  };
}

function bookingCancelledClient(vars: Record<string, string>): { subject: string; html: string } {
  const refundText = vars.refundEligible === 'true'
    ? '<p style="color:#16a34a;font-weight:bold">✅ Ești eligibil pentru rambursare completă.</p>'
    : '<p style="color:#dc2626">Rambursarea nu este disponibilă (anulare în mai puțin de 48h).</p>';
  return {
    subject: `Rezervare anulată - ${vars.title}`,
    html: `<!DOCTYPE html><html><head><style>
      body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Roboto',sans-serif;line-height:1.6;color:#333}
      .container{max-width:600px;margin:0 auto;padding:20px}
      .header{background:linear-gradient(135deg,#ef4444 0%,#dc2626 100%);color:#fff;padding:30px;text-align:center;border-radius:10px 10px 0 0}
      .content{background:#f9f9f9;padding:30px;border-radius:0 0 10px 10px}
      .details{background:#fff;padding:20px;border-radius:8px;margin:20px 0}
      .row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #eee}
      .label{font-weight:600;color:#666}
      .footer{text-align:center;color:#999;font-size:12px;margin-top:30px}
    </style></head><body><div class="container">
      <div class="header"><h1>❌ Rezervare anulată</h1></div>
      <div class="content">
        <p>Bună ${vars.clientName},</p>
        <p>Rezervarea ta a fost anulată.</p>
        <div class="details">
          <div class="row"><span class="label">Experiență:</span><span>${vars.title}</span></div>
          <div class="row"><span class="label">Data:</span><span>${vars.date}</span></div>
          <div class="row"><span class="label">Motiv:</span><span>${vars.reason || 'Nespecificat'}</span></div>
        </div>
        ${refundText}
        <div class="footer"><p>© ${new Date().getFullYear()} Experium.</p></div>
      </div>
    </div></body></html>`,
  };
}

function providerNewBooking(vars: Record<string, string>): { subject: string; html: string } {
  return {
    subject: `📋 Rezervare nouă - ${vars.title}`,
    html: `<!DOCTYPE html><html><head><style>
      body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Roboto',sans-serif;line-height:1.6;color:#333}
      .container{max-width:600px;margin:0 auto;padding:20px}
      .header{background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:#fff;padding:30px;text-align:center;border-radius:10px 10px 0 0}
      .content{background:#f9f9f9;padding:30px;border-radius:0 0 10px 10px}
      .details{background:#fff;padding:20px;border-radius:8px;margin:20px 0}
      .row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #eee}
      .label{font-weight:600;color:#666}
      .footer{text-align:center;color:#999;font-size:12px;margin-top:30px}
    </style></head><body><div class="container">
      <div class="header"><h1>📋 Rezervare nouă!</h1></div>
      <div class="content">
        <p>Bună ${vars.providerName},</p>
        <p>Ai primit o rezervare nouă!</p>
        <div class="details">
          <h2 style="margin-top:0;color:#10b981">Detalii</h2>
          <div class="row"><span class="label">Client:</span><span>${vars.clientName}</span></div>
          <div class="row"><span class="label">Experiență:</span><span>${vars.title}</span></div>
          <div class="row"><span class="label">Data și ora:</span><span>${vars.date}</span></div>
          <div class="row"><span class="label">Durată:</span><span>${vars.duration || 'N/A'}</span></div>
          <div class="row"><span class="label">Participanți:</span><span>${vars.participants}</span></div>
          <div class="row" style="border-bottom:none"><span class="label">Sumă:</span><span><strong>${vars.totalPrice} RON</strong></span></div>
        </div>
        <p>ID Rezervare: <code>${vars.bookingId}</code></p>
        <div class="footer"><p>© ${new Date().getFullYear()} Experium.</p></div>
      </div>
    </div></body></html>`,
  };
}

function providerBookingCancelled(vars: Record<string, string>): { subject: string; html: string } {
  return {
    subject: `⚠️ Rezervare anulată - ${vars.title}`,
    html: `<!DOCTYPE html><html><head><style>
      body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Roboto',sans-serif;line-height:1.6;color:#333}
      .container{max-width:600px;margin:0 auto;padding:20px}
      .header{background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);color:#fff;padding:30px;text-align:center;border-radius:10px 10px 0 0}
      .content{background:#f9f9f9;padding:30px;border-radius:0 0 10px 10px}
      .details{background:#fff;padding:20px;border-radius:8px;margin:20px 0}
      .row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #eee}
      .label{font-weight:600;color:#666}
      .footer{text-align:center;color:#999;font-size:12px;margin-top:30px}
    </style></head><body><div class="container">
      <div class="header"><h1>⚠️ Rezervare anulată de client</h1></div>
      <div class="content">
        <p>Bună ${vars.providerName},</p>
        <p>O rezervare a fost anulată de client.</p>
        <div class="details">
          <div class="row"><span class="label">Client:</span><span>${vars.clientName}</span></div>
          <div class="row"><span class="label">Experiență:</span><span>${vars.title}</span></div>
          <div class="row"><span class="label">Data:</span><span>${vars.date}</span></div>
          <div class="row"><span class="label">Motiv:</span><span>${vars.reason || 'Nespecificat'}</span></div>
        </div>
        <div class="footer"><p>© ${new Date().getFullYear()} Experium.</p></div>
      </div>
    </div></body></html>`,
  };
}

// ---------- HANDLER ----------

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    // Create admin client for logging + provider lookups
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // User client for auth check
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const rawBody = await req.json();
    const { event_type, booking_id } = validateInput(rawBody);

    if (!booking_id) {
      return new Response(JSON.stringify({ error: "booking_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch booking with experience details
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .select(`*, experiences (title, location_name, duration_minutes, cancellation_policy)`)
      .eq("id", booking_id)
      .single();

    if (bookingError || !booking) {
      return new Response(JSON.stringify({ error: "Booking not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch client profile
    const { data: clientProfile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, email, phone")
      .eq("id", booking.user_id)
      .single();

    if (!clientProfile?.email) {
      return new Response(JSON.stringify({ error: "Client email not found" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch provider(s) for this experience
    const { data: providers } = await supabaseAdmin
      .from("experience_providers")
      .select("provider_user_id")
      .eq("experience_id", booking.experience_id)
      .eq("is_active", true);

    let providerProfiles: Array<{ full_name: string | null; email: string; id: string }> = [];
    if (providers && providers.length > 0) {
      const providerIds = providers.map((p: { provider_user_id: string }) => p.provider_user_id);
      const { data: pProfiles } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, email")
        .in("id", providerIds);
      providerProfiles = pProfiles || [];
    }

    const bookingDate = new Date(booking.booking_date);
    const formattedDate = bookingDate.toLocaleDateString("ro-RO", {
      weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
    });

    const vars: Record<string, string> = {
      clientName: escapeHtml(clientProfile.full_name || "Client"),
      title: escapeHtml(booking.experiences?.title || "Experiență"),
      location: escapeHtml(booking.experiences?.location_name || ""),
      date: formattedDate,
      participants: String(booking.participants),
      totalPrice: String(booking.total_price),
      bookingId: booking.id,
      duration: booking.experiences?.duration_minutes ? `${booking.experiences.duration_minutes} min` : "",
      providerName: providerProfiles.length > 0 ? escapeHtml(providerProfiles[0].full_name || "Furnizor") : "",
      cancellationPolicy: escapeHtml(booking.experiences?.cancellation_policy || ""),
      reason: escapeHtml(booking.cancellation_reason || ""),
      refundEligible: String(rawBody.refund_eligible ?? false),
    };

    const emailsSent: string[] = [];

    // Check notification preferences
    const { data: clientPrefs } = await supabaseAdmin
      .from("notification_preferences")
      .select("*")
      .eq("user_id", booking.user_id)
      .single();

    // Send client email
    let clientTemplate: { subject: string; html: string } | null = null;
    let shouldSendClient = true;

    if (event_type === "booking_confirmed") {
      if (clientPrefs && !clientPrefs.email_booking_confirmation) shouldSendClient = false;
      clientTemplate = bookingConfirmedClient(vars);
    } else if (event_type === "booking_cancelled") {
      if (clientPrefs && !clientPrefs.email_booking_cancellation) shouldSendClient = false;
      clientTemplate = bookingCancelledClient(vars);
    }

    if (clientTemplate && shouldSendClient) {
      try {
        await resend.emails.send({
          from: "Experium <onboarding@resend.dev>",
          to: [clientProfile.email],
          subject: clientTemplate.subject,
          html: clientTemplate.html,
        });
        emailsSent.push(`client:${clientProfile.email}`);

        // Log notification
        await supabaseAdmin.from("notification_logs").insert({
          user_id: booking.user_id,
          notification_type: "email",
          event_type,
          recipient_email: clientProfile.email,
          recipient_role: "client",
          subject: clientTemplate.subject,
          status: "sent",
          booking_id,
          sent_at: new Date().toISOString(),
          metadata: { booking_id },
        });
      } catch (err) {
        console.error("Failed to send client email:", err);
        await supabaseAdmin.from("notification_logs").insert({
          user_id: booking.user_id,
          notification_type: "email",
          event_type,
          recipient_email: clientProfile.email,
          recipient_role: "client",
          subject: clientTemplate.subject,
          status: "failed",
          error_message: err instanceof Error ? err.message : "Unknown error",
          booking_id,
          metadata: { booking_id },
        });
      }
    }

    // Send provider emails
    for (const provider of providerProfiles) {
      let providerTemplate: { subject: string; html: string } | null = null;
      const providerVars = { ...vars, providerName: escapeHtml(provider.full_name || "Furnizor") };

      if (event_type === "booking_confirmed" || event_type === "provider_new_booking") {
        providerTemplate = providerNewBooking(providerVars);
      } else if (event_type === "booking_cancelled" || event_type === "provider_booking_cancelled") {
        providerTemplate = providerBookingCancelled(providerVars);
      }

      if (providerTemplate) {
        try {
          await resend.emails.send({
            from: "Experium <onboarding@resend.dev>",
            to: [provider.email],
            subject: providerTemplate.subject,
            html: providerTemplate.html,
          });
          emailsSent.push(`provider:${provider.email}`);

          await supabaseAdmin.from("notification_logs").insert({
            user_id: provider.id,
            notification_type: "email",
            event_type: event_type.startsWith("provider_") ? event_type : `provider_${event_type.replace("booking_", "booking_")}`,
            recipient_email: provider.email,
            recipient_role: "provider",
            subject: providerTemplate.subject,
            status: "sent",
            booking_id,
            sent_at: new Date().toISOString(),
            metadata: { booking_id },
          });
        } catch (err) {
          console.error(`Failed to send provider email to ${provider.email}:`, err);
          await supabaseAdmin.from("notification_logs").insert({
            user_id: provider.id,
            notification_type: "email",
            event_type: `provider_${event_type}`,
            recipient_email: provider.email,
            recipient_role: "provider",
            subject: providerTemplate.subject,
            status: "failed",
            error_message: err instanceof Error ? err.message : "Unknown error",
            booking_id,
            metadata: { booking_id },
          });
        }
      }
    }

    console.log(`Notification [${event_type}] processed. Emails sent: ${emailsSent.length}`);

    return new Response(
      JSON.stringify({ success: true, emails_sent: emailsSent.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    console.error("Notification error:", msg);
    return new Response(
      JSON.stringify({ error: "Failed to send notifications" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
