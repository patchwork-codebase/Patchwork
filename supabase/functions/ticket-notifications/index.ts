import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@3.4.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resendApiKey = Deno.env.get("RESEND_API_KEY") || Deno.env.get("VITE_RESEND_API_KEY") || Deno.env.get("REACT_APP_RESEND_API_KEY") || "";
const resend = new Resend(resendApiKey);
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

  try {
    const body = await req.json();
    const { record, type } = body;

    if (!record || !record.user_id) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get assigned user email and details
    const { data: user } = await supabase
      .from('users')
      .select('name, email, email_notifications_enabled')
      .eq('id', record.user_id)
      .single();

    if (!user || !user.email || user.email_notifications_enabled === false) {
      return new Response(JSON.stringify({ message: "Email notifications disabled or user not found" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const itemTitle = record.metadata?.ticket_title || "Assigned Ticket";
    const roomTitle = record.metadata?.room_title || "Build Room";
    const isRoomMember = record.metadata?.is_room_member !== false;
    const roomId = record.metadata?.room_id;
    const baseUrl = record.origin || "https://joinpatchwork.xyz";
    const ticketUrl = roomId ? `${baseUrl}/room/${roomId}` : baseUrl;

    let emailSubject = `You were assigned to ticket: "${itemTitle}" on Patchwork`;
    let emailHeading = "New Ticket Assignment";
    let emailBody = `You have been assigned to <strong>${itemTitle}</strong> in <strong>${roomTitle}</strong>.`;
    let buttonText = "View Ticket";

    if (!isRoomMember) {
      emailSubject = `Invitation & Ticket Assignment: "${itemTitle}" on Patchwork`;
      emailHeading = "You've been assigned to a ticket & invited to join the Build Room";
      emailBody = `You have been assigned to <strong>${itemTitle}</strong> in <strong>${roomTitle}</strong>. To view and edit this ticket and its associated documents, please accept your invitation to join the Build Room.`;
      buttonText = "Accept Invitation & View Ticket";
    } else if (type === 'ticket_updated') {
      emailSubject = `Ticket Updated: "${itemTitle}"`;
      emailHeading = "Ticket Details Updated";
      emailBody = `The ticket <strong>${itemTitle}</strong> in <strong>${roomTitle}</strong> has been updated.`;
    } else if (type === 'ticket_comment') {
      emailSubject = `New Comment on Ticket: "${itemTitle}"`;
      emailHeading = "New Comment Posted";
      emailBody = `A new comment was added to <strong>${itemTitle}</strong> in <strong>${roomTitle}</strong>: <br/><br/><em>"${record.metadata?.comment_text || ''}"</em>`;
    }

    const { data, error } = await resend.emails.send({
      from: "Patchwork <notifications@joinpatchwork.xyz>",
      to: user.email,
      subject: emailSubject,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${emailSubject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: 'Inter', sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <tr>
            <td style="padding: 48px 40px 32px 40px; text-align: left;">
              <h1 style="margin: 0; color: #0F172A; font-size: 22px; font-weight: 800;">${emailHeading}</h1>
              <p style="margin: 16px 0 0 0; color: #475569; font-size: 15px; line-height: 1.6;">
                ${emailBody}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px 40px; text-align: left;">
              <a href="${ticketUrl}" style="display: inline-block; background-color: #6C5CE7; color: #FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                ${buttonText}
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; background-color: #F8FAFC; border-top: 1px solid #E2E8F0; text-align: center;">
              <p style="margin: 0; color: #94A3B8; font-size: 12px;">Patchwork Notifications — Collaborate & Build in Public</p>
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
      return new Response(JSON.stringify({ error: "Failed to send email" }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, data }), { status: 200 });
  } catch (err: unknown) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
});
