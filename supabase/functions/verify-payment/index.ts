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

  // Service role client for creating vouchers
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: authData } = await supabaseClient.auth.getUser(token);
    const user = authData.user;
    if (!user) throw new Error("User not authenticated");

    const { session_id } = await req.json();
    if (!session_id) throw new Error("Missing session_id");

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Retrieve checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== "paid") {
      throw new Error("Payment not completed");
    }

    // Verify user matches
    if (session.metadata?.supabase_user_id !== user.id) {
      throw new Error("Session does not belong to this user");
    }

    // Parse items from metadata
    const items = JSON.parse(session.metadata?.items_json || "[]");
    const personalDetails = JSON.parse(session.metadata?.personal_details_json || "{}");

    const orderId = `ORD-${Date.now().toString(36).toUpperCase()}`;
    const vouchers: any[] = [];

    // Create vouchers for each item
    for (const item of items) {
      for (let i = 0; i < item.quantity; i++) {
        // Generate voucher code
        const { data: codeData, error: codeError } = await supabaseAdmin.rpc(
          "generate_voucher_code",
        );
        if (codeError) throw codeError;
        const voucherCode = codeData as string;

        // Calculate total price including services
        const servicesTotal =
          item.services?.reduce(
            (sum: number, s: any) => sum + s.price * s.quantity,
            0,
          ) || 0;
        const totalPrice = item.price + servicesTotal;

        // Get experience ambassador_id
        const { data: expData } = await supabaseAdmin
          .from("experiences")
          .select("ambassador_id")
          .eq("id", item.id.split("-")[0])
          .single();

        // Create voucher
        const { data: voucherData, error: voucherError } = await supabaseAdmin
          .from("vouchers")
          .insert({
            code: voucherCode,
            user_id: user.id,
            experience_id: item.id.split("-")[0],
            purchase_price: totalPrice,
            expiry_date: new Date(
              Date.now() + 365 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            status: "active",
            notes: item.isGift ? "Gift voucher" : null,
            ambassador_id: expData?.ambassador_id || null,
          })
          .select()
          .single();

        if (voucherError) throw voucherError;

        vouchers.push({
          id: voucherData.id,
          code: voucherCode,
          experienceId: item.id.split("-")[0],
          experienceTitle: item.title,
          price: totalPrice,
          image: item.image || "/placeholder.svg",
          location: item.location || "",
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderId,
        vouchers,
        stripeSessionId: session_id,
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
