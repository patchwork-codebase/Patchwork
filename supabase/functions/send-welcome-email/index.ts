import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@3.4.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") || "re_bxj3KLqG_nh6hxq34aHSK7UbWhLZA9FPr");

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
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
    const { email, name, role, userId } = body;

    if (!email || !name || !userId) {
      return new Response(JSON.stringify({ error: "Email, name, and userId are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 1. Check idempotency: Have we already sent or attempted to send this user an email?
    const { data: existingLog, error: logError } = await supabase
      .from('welcome_emails_log')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existingLog) {
      // If a log exists (whether pending, sent, or failed), we abort to prevent spamming
      return new Response(JSON.stringify({ message: "Welcome email already processed for this user", existingLog }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // 2. Insert 'pending' record
    const { error: insertError } = await supabase
      .from('welcome_emails_log')
      .insert({ user_id: userId, email, status: 'pending' });

    if (insertError) {
      console.error("Failed to insert pending log:", insertError);
      return new Response(JSON.stringify({ error: "Database error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. Send welcome email using Resend
    // NOTE: If using a free Resend tier without domain verification, you must use onboarding@resend.dev
    const { data, error } = await resend.emails.send({
      from: "Patchwork <onboarding@resend.dev>",
      to: email,
      subject: "Welcome to Patchwork! 🎉",
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #08070D; color: #ffffff;">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="font-size: 24px; font-weight: 800; color: #8B7CF8; margin-bottom: 8px;">
              patchwork
            </div>
            <h1 style="font-size: 32px; font-weight: 800; color: #ffffff; margin: 0;">
              Welcome to Patchwork!
            </h1>
            <p style="font-size: 18px; color: #A0AEC0; margin-top: 8px;">
              Hi ${name}, your email is verified and you're good to go!
            </p>
          </div>

          <div style="background: linear-gradient(135deg, #6C5CE7 0%, #8B7CF8 100%); border-radius: 16px; padding: 24px; color: white; margin-bottom: 32px; text-align: center;">
            <h2 style="font-size: 22px; font-weight: 800; margin: 0 0 8px 0;">
              Start your journey today
            </h2>
            <p style="font-size: 16px; margin: 0 0 24px 0; opacity: 0.9;">
              ${role === "observer" ? "Patchwork is where observers track live products, give sharp feedback, and earn reputation. Find a room and drop your first insight!" : "Patchwork is where builders create in public, gather feedback, and ship faster. Set up your first build room and share an update!"}
            </p>
            <a href="https://joinpatchwork.xyz/dashboard" style="display: inline-block; background-color: #ffffff; color: #08070D; text-decoration: none; padding: 12px 24px; border-radius: 9999px; font-weight: bold; font-size: 16px;">
              Go to Dashboard
            </a>
          </div>

          <div style="background: #ffffff05; border: 1px solid #ffffff10; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <h3 style="font-size: 16px; font-weight: 600; color: #ffffff; margin-top: 0;">
              Quick Start Guide
            </h3>
            <ul style="margin: 16px 0 0 0; padding-left: 20px; color: #A0AEC0;">
              <li style="margin-bottom: 8px;"><strong>${role === "observer" ? "Explore" : "Build"}:</strong> ${role === "observer" ? "Check the global timeline for live updates." : "Create your first room and post an update."}</li>
              <li style="margin-bottom: 8px;"><strong>React:</strong> Leave a 'Sharp', 'Pushback', or 'Tell me more' reaction to earn REP points.</li>
              <li><strong>Verify:</strong> You've already completed this step! Your account is fully unlocked.</li>
            </ul>
          </div>

          <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #ffffff10;">
            <p style="font-size: 14px; color: #718096; margin: 8px 0 0 0;">
              If you have any questions, simply reply to this email!
            </p>
            <p style="font-size: 14px; color: #718096; margin: 8px 0 0 0;">
              — The Patchwork Team
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      // Update log to failed
      await supabase.from('welcome_emails_log').update({ status: 'failed', error_message: error.message }).eq('user_id', userId);

      return new Response(JSON.stringify({ error: "Failed to send email" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. Update log to sent
    await supabase.from('welcome_emails_log').update({ status: 'sent' }).eq('user_id', userId);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: any) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
