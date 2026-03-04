import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
  );

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: authData } = await supabaseClient.auth.getUser(token);
    const user = authData.user;
    if (!user) throw new Error("User not authenticated");

    const { session_id } = await req.json();
    if (!session_id) throw new Error("Missing session_id");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== "paid") {
      throw new Error("Payment not completed");
    }

    if (session.metadata?.supabase_user_id !== user.id) {
      throw new Error("Session does not belong to this user");
    }

    const experienceId = session.metadata?.experience_id;
    const slotId = session.metadata?.slot_id;
    const participants = parseInt(session.metadata?.participants || "1");
    const totalPrice = parseFloat(session.metadata?.total_price || "0");

    if (!experienceId || !slotId) {
      throw new Error("Missing booking metadata");
    }

    // Confirm the slot booking using the RPC (uses service role to bypass RLS)
    const { data: bookingResult, error: bookingError } = await supabaseAdmin.rpc(
      "confirm_slot_booking",
      {
        p_slot_id: slotId,
        p_user_id: user.id,
        p_participants: participants,
        p_total_price: totalPrice,
        p_payment_method: "stripe",
      },
    );

    if (bookingError) throw bookingError;

    const result = bookingResult?.[0];
    if (!result?.success) {
      throw new Error(result?.error_message || "Failed to confirm booking");
    }

    // Get experience details for the response
    const { data: expData } = await supabaseAdmin
      .from("experiences")
      .select("title, location_name")
      .eq("id", experienceId)
      .single();

    // Send booking confirmation notification
    try {
      await supabaseAdmin.functions.invoke("send-notification", {
        body: { event_type: "booking_confirmed", booking_id: result.booking_id },
      });
    } catch (notifErr) {
      console.error("Notification error (non-fatal):", notifErr);
    }

    // Notify provider
    try {
      await supabaseAdmin.functions.invoke("push-notifications", {
        body: { action: "notify-booking", booking_id: result.booking_id, experience_id: experienceId },
      });
    } catch (notifErr) {
      console.error("Provider notification error (non-fatal):", notifErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        bookingId: result.booking_id,
        experienceTitle: expData?.title || "",
        experienceLocation: expData?.location_name || "",
        totalPrice,
        participants,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Payment verification error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
