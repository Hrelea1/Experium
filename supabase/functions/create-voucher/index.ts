import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// Allowed origins for CORS (restrict in production)
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

interface CreateVoucherRequest {
  experienceId: string;
  notes?: string;
  validityMonths?: number;
}

// Input validation
function validateInput(data: unknown): CreateVoucherRequest {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid request body');
  }
  
  const { experienceId, notes, validityMonths } = data as Record<string, unknown>;
  
  // Validate experienceId - must be UUID format
  if (!experienceId || typeof experienceId !== 'string') {
    throw new Error('experienceId is required');
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(experienceId)) {
    throw new Error('experienceId must be a valid UUID');
  }
  
  // Validate notes if provided
  if (notes !== undefined && notes !== null) {
    if (typeof notes !== 'string' || notes.length > 500) {
      throw new Error('notes must be a string with max 500 characters');
    }
  }
  
  // Validate validityMonths if provided
  let validMonths = 12;
  if (validityMonths !== undefined && validityMonths !== null) {
    if (typeof validityMonths !== 'number' || validityMonths < 1 || validityMonths > 36) {
      throw new Error('validityMonths must be a number between 1 and 36');
    }
    validMonths = Math.floor(validityMonths);
  }
  
  return {
    experienceId,
    notes: notes as string | undefined,
    validityMonths: validMonths,
  };
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

    // Get the user
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

    // Validate and parse input
    const rawBody = await req.json();
    const { experienceId, notes, validityMonths } = validateInput(rawBody);

    // Get experience details to fetch the price
    const { data: experience, error: experienceError } = await supabaseClient
      .from('experiences')
      .select('price, is_active')
      .eq('id', experienceId)
      .single();

    if (experienceError || !experience) {
      return new Response(
        JSON.stringify({ error: "Experiența nu a fost găsită" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if experience is active
    if (!experience.is_active) {
      return new Response(
        JSON.stringify({ error: "Această experiență nu este disponibilă" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate unique voucher code
    const { data: codeData, error: codeError } = await supabaseClient.rpc('generate_voucher_code');

    if (codeError) {
      console.error("Error generating voucher code:", codeError);
      throw new Error("Failed to generate voucher code");
    }

    const voucherCode = codeData as string;

    // Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + (validityMonths || 12));

    // Create voucher
    const { data: voucher, error: voucherError } = await supabaseClient
      .from('vouchers')
      .insert({
        user_id: null,
        experience_id: experienceId,
        code: voucherCode,
        purchase_price: experience.price,
        expiry_date: expiryDate.toISOString(),
        qr_code_data: voucherCode,
        notes: notes || null,
      })
      .select()
      .single();

    if (voucherError) {
      console.error("Error creating voucher:", voucherError);
      throw voucherError;
    }

    // Don't log sensitive voucher data in production
    console.log("Voucher created successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        voucher,
        message: "Voucher created successfully"
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    console.error("Error in create-voucher function:", errorMessage);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
