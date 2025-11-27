import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CreateVoucherRequest {
  experienceId: string;
  purchasePrice: number;
  notes?: string;
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

    // Get the user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { experienceId, purchasePrice, notes }: CreateVoucherRequest = await req.json();

    // Generate unique voucher code
    const { data: codeData, error: codeError } = await supabaseClient
      .rpc('generate_voucher_code');

    if (codeError) {
      console.error("Error generating voucher code:", codeError);
      throw new Error("Failed to generate voucher code");
    }

    const voucherCode = codeData as string;

    // Calculate expiry date (12 months from now)
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 12);

    // Create voucher
    const { data: voucher, error: voucherError } = await supabaseClient
      .from('vouchers')
      .insert({
        user_id: user.id,
        experience_id: experienceId,
        code: voucherCode,
        purchase_price: purchasePrice,
        expiry_date: expiryDate.toISOString(),
        qr_code_data: voucherCode, // Store code for QR generation
        notes: notes || null,
      })
      .select()
      .single();

    if (voucherError) {
      console.error("Error creating voucher:", voucherError);
      throw voucherError;
    }

    console.log("Voucher created successfully:", voucher);

    return new Response(
      JSON.stringify({ 
        success: true, 
        voucher,
        message: "Voucher created successfully"
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in create-voucher function:", error);
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
