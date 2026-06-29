import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from "npm:resend";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  try {
    const payload = await req.json();
    // Payload should be from the Database Webhook on INSERT to notifications
    const notification = payload.record;

    if (!notification) {
      return new Response("No record found in payload", { status: 400 });
    }

    // Get the user to check their email and preferences
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('email, name, email_notifications_enabled')
      .eq('id', notification.user_id)
      .single();

    if (profileError || !profile) {
      return new Response("User not found", { status: 404 });
    }

    // Check if email notifications are enabled
    if (profile.email_notifications_enabled === false) {
      return new Response("User disabled email notifications", { status: 200 });
    }

    // Get the actor (person who triggered the notification)
    const { data: actor } = await supabase
      .from('users')
      .select('name')
      .eq('id', notification.actor_id)
      .single();

    const actorName = actor?.name || 'Someone';

    let subject = '';
    let htmlContent = '';
    const roomTitle = notification.metadata?.room_title || 'a room';
    const updateId = notification.metadata?.update_id || notification.reference_id;
    // Replace with actual production domain when live
    const actionUrl = `https://patchwork.dev/dashboard/room/${notification.metadata?.room_id}?updateId=${updateId}`;

    if (notification.type === 'reaction') {
      subject = `${actorName} replied to your update in ${roomTitle}`;
      htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #6c5ce7;">Patchwork</h2>
          <p>Hi ${profile.name || ''},</p>
          <p><strong>${actorName}</strong> replied to an update in <strong>${roomTitle}</strong>:</p>
          <blockquote style="border-left: 4px solid #e2e8f0; padding-left: 16px; margin: 24px 0; color: #475569; font-style: italic;">
            ${notification.metadata?.reaction_text}
          </blockquote>
          <p style="margin-top: 32px;">
            <a href="${actionUrl}" style="display:inline-block;padding:12px 24px;background:#6c5ce7;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">View Reply</a>
          </p>
        </div>
      `;
    } else if (notification.type === 'update_posted') {
      subject = `New update in ${roomTitle} by ${actorName}`;
      htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #6c5ce7;">Patchwork</h2>
          <p>Hi ${profile.name || ''},</p>
          <p><strong>${actorName}</strong> posted a new update in <strong>${roomTitle}</strong>:</p>
          <blockquote style="border-left: 4px solid #e2e8f0; padding-left: 16px; margin: 24px 0; color: #475569; font-style: italic;">
            ${notification.metadata?.update_text}
          </blockquote>
          <p style="margin-top: 32px;">
            <a href="${actionUrl}" style="display:inline-block;padding:12px 24px;background:#6c5ce7;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">View Update</a>
          </p>
        </div>
      `;
    } else if (notification.type === 'decision' || notification.type === 'decision_updated') {
      subject = `${actorName} published a decision in ${roomTitle}`;
      htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #6c5ce7;">Patchwork</h2>
          <p>Hi ${profile.name || ''},</p>
          <p><strong>${actorName}</strong> shared a decision in <strong>${roomTitle}</strong>:</p>
          <blockquote style="border-left: 4px solid #e2e8f0; padding-left: 16px; margin: 24px 0; color: #475569; font-style: italic;">
            ${notification.metadata?.decision_text}
          </blockquote>
          <p style="margin-top: 32px;">
            <a href="${actionUrl}" style="display:inline-block;padding:12px 24px;background:#6c5ce7;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">View Decision</a>
          </p>
        </div>
      `;
    } else {
      subject = `New notification from Patchwork`;
      htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #6c5ce7;">Patchwork</h2>
          <p>Hi ${profile.name || ''},</p>
          <p>You have a new notification.</p>
          <p style="margin-top: 32px;">
            <a href="https://patchwork.dev/dashboard" style="display:inline-block;padding:12px 24px;background:#6c5ce7;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">View Dashboard</a>
          </p>
        </div>
      `;
    }

    const { data, error } = await resend.emails.send({
      from: "Patchwork <notifications@patchwork.dev>", // Needs to be verified in Resend
      to: [profile.email],
      subject: subject,
      html: htmlContent,
    });

    if (error) {
      return new Response(JSON.stringify({ error }), { status: 400 });
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
})
