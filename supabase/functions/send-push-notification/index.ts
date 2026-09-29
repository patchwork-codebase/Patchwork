import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * send-push-notification
 *
 * Supabase Edge Function that sends a Firebase Cloud Messaging (FCM) push
 * notification to a specific user, looked up by their user_id.
 *
 * Called from:
 *  - Supabase Database Webhook on the `notifications` table (INSERT event)
 *  - Directly from server-side code for custom scenarios
 *
 * Required environment variables (set in Supabase Dashboard → Edge Functions → Secrets):
 *  - SUPABASE_URL                 (auto-injected)
 *  - SUPABASE_SERVICE_ROLE_KEY    (auto-injected)
 *  - FCM_PROJECT_ID               Your Firebase project ID (e.g. patchwork-abc12)
 *  - FCM_SERVICE_ACCOUNT_JSON     Full JSON of your Firebase service account key
 *
 * Request body (JSON):
 * {
 *   "user_id": "uuid",
 *   "title":   "Notification title",
 *   "body":    "Notification body",
 *   "data": {                   // optional — forwarded to the Flutter app
 *     "type":      "reaction",
 *     "update_id": "uuid",
 *     "room_id":   "uuid",
 *     "room_title": "Room name"
 *   }
 * }
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const {
      user_id,
      title,
      body,
      data = {},
    }: {
      user_id: string;
      title: string;
      body: string;
      data?: Record<string, string>;
    } = await req.json();

    if (!user_id || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'user_id, title, and body are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ── 1. Look up the recipient's FCM token ────────────────────────────────
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('fcm_token')
      .eq('id', user_id)
      .single();

    if (userError || !user?.fcm_token) {
      console.log(`[FCM] No token for user ${user_id} — skipping`);
      return new Response(
        JSON.stringify({ skipped: true, reason: 'no_fcm_token' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ── 2. Get a Google OAuth2 access token via service account ─────────────
    const accessToken = await getFirebaseAccessToken();

    // ── 3. Send the FCM message ─────────────────────────────────────────────
    const projectId = Deno.env.get('FCM_PROJECT_ID')!;
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

    const fcmPayload = {
      message: {
        token: user.fcm_token,
        notification: { title, body },
        // data fields must all be strings for FCM
        data: Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, String(v)]),
        ),
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            click_action: 'FLUTTER_NOTIFICATION_CLICK',
          },
        },
        apns: {
          payload: {
            aps: { sound: 'default', badge: 1 },
          },
        },
      },
    };

    const fcmRes = await fetch(fcmUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fcmPayload),
    });

    const fcmData = await fcmRes.json();

    if (!fcmRes.ok) {
      console.error('[FCM] Send failed:', fcmData);
      return new Response(JSON.stringify({ error: fcmData }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[FCM] Sent to user ${user_id}:`, fcmData.name);
    return new Response(JSON.stringify({ success: true, name: fcmData.name }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[FCM] Unexpected error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// Helper: obtain a short-lived Google access token from the service account
// key stored in FCM_SERVICE_ACCOUNT_JSON.
// ────────────────────────────────────────────────────────────────────────────
async function getFirebaseAccessToken(): Promise<string> {
  const serviceAccount = JSON.parse(Deno.env.get('FCM_SERVICE_ACCOUNT_JSON')!);

  const now = Math.floor(Date.now() / 1000);
  const claimSet = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  // Encode JWT header + payload
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify(claimSet));
  const signingInput = `${header}.${payload}`;

  // Import the private key
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToDer(serviceAccount.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  // Sign
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(signingInput),
  );

  const jwt = `${signingInput}.${btoa(String.fromCharCode(...new Uint8Array(signature)))}`;

  // Exchange JWT for access token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok) throw new Error(`Token exchange failed: ${JSON.stringify(tokenData)}`);
  return tokenData.access_token;
}

function pemToDer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
