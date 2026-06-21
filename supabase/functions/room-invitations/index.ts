import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@3.4.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") || "");

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    // Expected to be triggered by Supabase Webhook on insert to room_invitations
    const { record } = body;

    if (!record || !record.email || !record.room_id || !record.token) {
      return new Response(JSON.stringify({ error: "Invalid webhook payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { email, role, token, room_id, inviter_id, origin } = record;

    // Fetch Room and Inviter details for the email
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('title, builder_name')
      .eq('id', room_id)
      .single();

    if (roomError || !room) {
      throw new Error("Room not found");
    }

    const baseUrl = origin || "https://joinpatchwork.xyz";
    const inviteUrl = `${baseUrl}/room/${room_id}?invite_token=${token}`;

    const { data, error } = await resend.emails.send({
      from: "Patchwork <hello@joinpatchwork.xyz>",
      to: email,
      subject: `You've been invited to join ${room.title} on Patchwork`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invitation to Patchwork</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: 'Inter', sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <tr>
            <td style="padding: 48px 40px 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #0F172A; font-size: 24px; font-weight: 800;">You've been invited!</h1>
              <p style="margin: 12px 0 0 0; color: #64748B; font-size: 16px; line-height: 1.5;">
                <strong>${room.builder_name}</strong> has invited you to collaborate on their Build Room: <strong>${room.title}</strong> as a ${role}.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px 40px; text-align: center;">
              <a href="${inviteUrl}" style="display: inline-block; background-color: #6C5CE7; color: #FFFFFF; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">
                Accept Invitation
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; background-color: #F8FAFC; border-top: 1px solid #E2E8F0; text-align: center;">
              <p style="margin: 0; color: #94A3B8; font-size: 13px;">This invitation link will securely log you in or help you create an account to join the room.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return new Response(JSON.stringify({ error: "Failed to send email" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (err: unknown) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
