import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action } = body;

    // Return VAPID public key
    if (action === 'get-vapid-key') {
      const publicKey = Deno.env.get('VAPID_PUBLIC_KEY');
      if (!publicKey) {
        return new Response(
          JSON.stringify({ error: 'VAPID keys not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ publicKey }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send push notification to a provider (requires service role auth)
    if (action === 'send-push') {
      // SECURITY: Only allow service role or authenticated internal calls
      const authHeader = req.headers.get('Authorization');
      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      if (!authHeader || !serviceRoleKey || authHeader !== `Bearer ${serviceRoleKey}`) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized: service role required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { provider_user_id, title, message, url } = body;

      // Input validation
      if (!provider_user_id || typeof provider_user_id !== 'string') {
        return new Response(
          JSON.stringify({ error: 'Invalid provider_user_id' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (!title || typeof title !== 'string' || title.length > 200) {
        return new Response(
          JSON.stringify({ error: 'Invalid title' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        serviceRoleKey
      );

      // Get push subscriptions for this user
      const { data: subscriptions, error: subError } = await supabaseAdmin
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', provider_user_id);

      if (subError || !subscriptions?.length) {
        return new Response(
          JSON.stringify({ sent: 0, message: 'No subscriptions found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
      const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
      const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@experium.ro';

      if (!vapidPrivateKey || !vapidPublicKey) {
        return new Response(
          JSON.stringify({ error: 'VAPID keys not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let sent = 0;
      for (const sub of subscriptions) {
        try {
          // Use web-push compatible approach with fetch
          const payload = JSON.stringify({ title, message, url, tag: 'booking' });
          
          // For simplicity, we'll use a direct web push approach
          // In production, you'd use a web-push library
          const pushResult = await sendWebPush(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
            payload,
            vapidPublicKey,
            vapidPrivateKey,
            vapidSubject
          );
          
          if (pushResult.ok) {
            sent++;
          } else if (pushResult.status === 410 || pushResult.status === 404) {
            // Subscription expired, remove it
            await supabaseAdmin
              .from('push_subscriptions')
              .delete()
              .eq('id', sub.id);
          }
        } catch (err) {
          console.error('Push send error:', err);
        }
      }

      return new Response(
        JSON.stringify({ sent }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Notify providers about a new booking (called from authenticated client)
    if (action === 'notify-booking') {
      // Verify caller is authenticated
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Verify the JWT is valid by creating a user-scoped client
      const supabaseUser = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
      if (userError || !user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      const { booking_id, experience_id } = body;

      // Get providers for this experience
      const { data: providers } = await supabaseAdmin
        .from('experience_providers')
        .select('provider_user_id')
        .eq('experience_id', experience_id)
        .eq('is_active', true);

      if (!providers?.length) {
        return new Response(
          JSON.stringify({ notified: 0 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get booking details
      const { data: booking } = await supabaseAdmin
        .from('bookings')
        .select('*, experiences(title)')
        .eq('id', booking_id)
        .single();

      const experienceTitle = (booking?.experiences as any)?.title || 'Experiență';
      const bookingDate = booking?.booking_date 
        ? new Date(booking.booking_date).toLocaleDateString('ro-RO') 
        : '';

      let notified = 0;
      for (const provider of providers) {
        // Create in-app notification
        await supabaseAdmin.from('provider_notifications').insert({
          provider_user_id: provider.provider_user_id,
          title: 'Rezervare nouă!',
          message: `${experienceTitle} - ${booking?.participants || 1} participant(i) pe ${bookingDate}`,
          type: 'booking',
          reference_id: booking_id,
        });

        // Send push notification
        try {
          const pushResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/push-notifications`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            },
            body: JSON.stringify({
              action: 'send-push',
              provider_user_id: provider.provider_user_id,
              title: 'Rezervare nouă!',
              message: `${experienceTitle} - ${booking?.participants || 1} participant(i)`,
              url: '/#/provider',
            }),
          });
        } catch (err) {
          console.error('Push notification call failed:', err);
        }

        notified++;
      }

      return new Response(
        JSON.stringify({ notified }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Notify providers about a cancellation (called from authenticated client)
    if (action === 'notify-cancellation') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const supabaseUser = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user: cancelUser }, error: cancelUserError } = await supabaseUser.auth.getUser();
      if (cancelUserError || !cancelUser) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      const { booking_id, experience_id } = body;

      const { data: providers } = await supabaseAdmin
        .from('experience_providers')
        .select('provider_user_id')
        .eq('experience_id', experience_id)
        .eq('is_active', true);

      if (!providers?.length) {
        return new Response(
          JSON.stringify({ notified: 0 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: booking } = await supabaseAdmin
        .from('bookings')
        .select('*, experiences(title)')
        .eq('id', booking_id)
        .single();

      const experienceTitle = (booking?.experiences as any)?.title || 'Experiență';
      const bookingDate = booking?.booking_date 
        ? new Date(booking.booking_date).toLocaleDateString('ro-RO') 
        : '';

      let notified = 0;
      for (const provider of providers) {
        await supabaseAdmin.from('provider_notifications').insert({
          provider_user_id: provider.provider_user_id,
          title: 'Rezervare anulată',
          message: `${experienceTitle} - ${booking?.participants || 1} participant(i) pe ${bookingDate} a fost anulată`,
          type: 'cancellation',
          reference_id: booking_id,
        });

        try {
          await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/push-notifications`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            },
            body: JSON.stringify({
              action: 'send-push',
              provider_user_id: provider.provider_user_id,
              title: 'Rezervare anulată',
              message: `${experienceTitle} a fost anulată`,
              url: '/#/provider',
            }),
          });
        } catch (err) {
          console.error('Push notification call failed:', err);
        }
        notified++;
      }

      return new Response(
        JSON.stringify({ notified }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Unknown action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Simplified Web Push sender using crypto API
async function sendWebPush(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
): Promise<Response> {
  // For Deno, we use a simpler approach - direct fetch with VAPID JWT
  const endpoint = new URL(subscription.endpoint);
  const audience = `${endpoint.protocol}//${endpoint.hostname}`;
  
  // Create VAPID JWT
  const header = { typ: 'JWT', alg: 'ES256' };
  const jwtPayload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
    sub: vapidSubject,
  };

  // Import VAPID private key
  const privateKeyBytes = base64UrlDecode(vapidPrivateKey);
  const publicKeyBytes = base64UrlDecode(vapidPublicKey);
  
  try {
    const key = await crypto.subtle.importKey(
      'pkcs8',
      privateKeyBytes,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['sign']
    );

    const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
    const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(jwtPayload)));
    const signingInput = `${headerB64}.${payloadB64}`;
    
    const signature = await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      key,
      new TextEncoder().encode(signingInput)
    );

    const token = `${signingInput}.${base64UrlEncode(new Uint8Array(signature))}`;

    // Send the push (without encryption for now - simplified)
    return await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `vapid t=${token}, k=${vapidPublicKey}`,
        'TTL': '86400',
        'Content-Length': '0',
        'Urgency': 'high',
      },
    });
  } catch (err) {
    console.error('VAPID signing failed, sending without auth:', err);
    // Fallback: try without VAPID (won't work for most providers but won't crash)
    return new Response(null, { status: 500 });
  }
}

function base64UrlDecode(str: string): Uint8Array {
  const padding = '='.repeat((4 - (str.length % 4)) % 4);
  const base64 = (str + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function base64UrlEncode(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
