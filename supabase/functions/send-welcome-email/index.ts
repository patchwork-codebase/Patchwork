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
      from: "Patchwork <hello@joinpatchwork.xyz>",
      to: email,
      subject: "Welcome to Patchwork! 🎉",
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to Patchwork</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #F8FAFC; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);">
          
          <!-- Header Image / Banner -->
          <tr>
            <td style="padding: 48px 40px 32px 40px; text-align: center;">
              <div style="display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px; border-radius: 16px; background-color: #F1F5F9; margin-bottom: 24px;">
                <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/layers.svg" width="32" height="32" style="filter: invert(12%) sepia(10%) saturate(2256%) hue-rotate(185deg) brightness(97%) contrast(92%);" alt="Patchwork Logo">
              </div>
              <h1 style="margin: 0; color: #0F172A; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Welcome to Patchwork.</h1>
              <p style="margin: 12px 0 0 0; color: #64748B; font-size: 16px; line-height: 1.5;">Hi ${name}, your email is verified and your journey starts now.</p>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <div style="background-color: #F8FAFC; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 32px; border: 1px solid #F1F5F9;">
                <p style="margin: 0; color: #334155; font-size: 16px; line-height: 1.6; font-weight: 500;">
                  ${role === "observer" ? "Patchwork is where observers track live products, give sharp feedback, and earn reputation. Find a room and drop your first insight!" : "Patchwork is where builders create in public, gather feedback, and ship faster. Set up your first build room and share an update!"}
                </p>
              </div>
              
              <!-- Primary CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom: 40px;">
                <tr>
                  <td align="center">
                    <a href="https://joinpatchwork.xyz" style="display: inline-block; background-color: #0F172A; color: #FFFFFF; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.1), 0 2px 4px -1px rgba(15, 23, 42, 0.06);">
                      Go to Dashboard
                    </a>
                  </td>
                </tr>
              </table>

              <!-- What's Next Guide -->
              <div style="border-top: 1px solid #E2E8F0; padding-top: 32px;">
                <h3 style="margin: 0 0 24px 0; color: #475569; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700;">Quick Start Guide</h3>
                
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td width="36" valign="top" style="padding-bottom: 24px;">
                      <div style="width: 24px; height: 24px; border-radius: 6px; background-color: #F1F5F9; color: #0F172A; text-align: center; line-height: 24px; font-size: 12px; font-weight: 700;">1</div>
                    </td>
                    <td valign="top" style="padding-bottom: 24px; color: #475569; font-size: 15px; line-height: 1.6;">
                      <strong style="color: #0F172A;">${role === "observer" ? "Explore" : "Build"}:</strong> ${role === "observer" ? "Check the global timeline to find live updates." : "Create your first room and post an update."}
                    </td>
                  </tr>
                  <tr>
                    <td width="36" valign="top" style="padding-bottom: 24px;">
                      <div style="width: 24px; height: 24px; border-radius: 6px; background-color: #F1F5F9; color: #0F172A; text-align: center; line-height: 24px; font-size: 12px; font-weight: 700;">2</div>
                    </td>
                    <td valign="top" style="padding-bottom: 24px; color: #475569; font-size: 15px; line-height: 1.6;">
                      <strong style="color: #0F172A;">Engage:</strong> ${role === "observer" ? "React, comment, and provide valuable insights." : "Reply to feedback and iterate on your product."}
                    </td>
                  </tr>
                  <tr>
                    <td width="36" valign="top">
                      <div style="width: 24px; height: 24px; border-radius: 6px; background-color: #F1F5F9; color: #0F172A; text-align: center; line-height: 24px; font-size: 12px; font-weight: 700;">3</div>
                    </td>
                    <td valign="top" style="color: #475569; font-size: 15px; line-height: 1.6;">
                      <strong style="color: #0F172A;">Grow:</strong> ${role === "observer" ? "Earn reputation to unlock the Verified Expert badge." : "Build an audience and reach product-market fit."}
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #F8FAFC; border-top: 1px solid #E2E8F0; text-align: center;">
              <p style="margin: 0; color: #94A3B8; font-size: 13px;">You're receiving this because you joined Patchwork.</p>
            </td>
          </tr>
        </table>
        
        <table width="100%" max-width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; margin-top: 16px;">
          <tr>
            <td align="center" style="padding: 0 20px;">
              <p style="margin: 0; color: #94A3B8; font-size: 12px;">© 2024 Patchwork. All rights reserved.</p>
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
