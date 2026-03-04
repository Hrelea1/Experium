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

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: authData } = await supabaseClient.auth.getUser(token);
    const user = authData.user;
    if (!user?.email) throw new Error("User not authenticated");

    const { items, deliveryType, personalDetails, deliveryAddress } = await req.json();

    if (!items || items.length === 0) {
      throw new Error("No items in cart");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Find or create Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        name: personalDetails?.fullName || user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
    }

    // Build line items from cart
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    for (const item of items) {
      const servicesTotal = item.services?.reduce(
        (sum: number, s: any) => sum + s.price * s.quantity,
        0,
      ) || 0;
      const unitAmount = Math.round((item.price + servicesTotal) * 100); // Convert to bani (cents)

      for (let i = 0; i < item.quantity; i++) {
        lineItems.push({
          price_data: {
            currency: "ron",
            product_data: {
              name: item.title,
              description: item.location || undefined,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        });
      }
    }

    const origin = req.headers.get("origin") || "https://id-preview--822cb615-8c38-4524-bedf-f2603ff01820.lovable.app";

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/#/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#/cart`,
      metadata: {
        supabase_user_id: user.id,
        delivery_type: deliveryType || "digital",
        items_json: JSON.stringify(
          items.map((item: any) => ({
            id: item.id,
            title: item.title,
            price: item.price,
            quantity: item.quantity,
            isGift: item.isGift,
            services: item.services,
            image: item.image,
            location: item.location,
          })),
        ),
        personal_details_json: JSON.stringify(personalDetails || {}),
        delivery_address_json: deliveryAddress ? JSON.stringify(deliveryAddress) : "",
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
