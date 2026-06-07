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
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to Patchwork</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0D0B14; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #0D0B14; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; background-color: #12101C; border: 1px solid #ffffff10; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.4);">
          <!-- Header Image / Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #2E1A65 0%, #0D0B14 100%); padding: 40px 32px; text-align: center; border-bottom: 1px solid #ffffff10;">
              <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/layers.svg" width="48" height="48" style="filter: invert(61%) sepia(85%) saturate(3011%) hue-rotate(222deg) brightness(101%) contrast(97%); margin-bottom: 16px;" alt="Patchwork Logo">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 900; letter-spacing: -1px;">Welcome to Patchwork.</h1>
              <p style="margin: 12px 0 0 0; color: #A0AEC0; font-size: 18px; line-height: 1.5;">Hi \${name}, your email is verified and your journey starts now.</p>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 32px;">
              <h2 style="margin: 0 0 16px 0; color: #ffffff; font-size: 20px; font-weight: 700;">Start building in public. For real.</h2>
              <p style="margin: 0 0 24px 0; color: #CBD5E1; font-size: 16px; line-height: 1.6;">
                \${role === "observer" ? "Patchwork is where observers track live products, give sharp feedback, and earn reputation. Find a room and drop your first insight!" : "Patchwork is where builders create in public, gather feedback, and ship faster. Set up your first build room and share an update!"}
              </p>
              
              <!-- Primary CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom: 32px;">
                <tr>
                  <td align="center">
                    <a href="https://joinpatchwork.xyz/dashboard" style="display: inline-block; background: linear-gradient(135deg, #6C5CE7 0%, #8B7CF8 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 9999px; font-weight: 700; font-size: 16px; letter-spacing: 0.5px; box-shadow: 0 8px 20px rgba(108, 92, 231, 0.3);">
                      Go to Dashboard
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Quick Start Guide -->
              <div style="background-color: #ffffff05; border: 1px solid #ffffff10; border-radius: 16px; padding: 24px;">
                <h3 style="margin: 0 0 16px 0; color: #ffffff; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; font-weight: 800;">Quick Start Guide</h3>
                
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td width="32" valign="top" style="padding-bottom: 16px;">
                      <div style="width: 24px; height: 24px; border-radius: 50%; background-color: #6C5CE730; color: #8B7CF8; text-align: center; line-height: 24px; font-size: 12px; font-weight: bold;">1</div>
                    </td>
                    <td valign="top" style="padding-bottom: 16px; color: #CBD5E1; font-size: 15px; line-height: 1.5;">
                      <strong style="color: #ffffff;">\${role === "observer" ? "Explore" : "Build"}:</strong> \${role === "observer" ? "Check the global timeline to find live updates." : "Create your first room and post an update."}
                    </td>
                  </tr>
                  <tr>
                    <td width="32" valign="top" style="padding-bottom: 16px;">
                      <div style="width: 24px; height: 24px; border-radius: 50%; background-color: #6C5CE730; color: #8B7CF8; text-align: center; line-height: 24px; font-size: 12px; font-weight: bold;">2</div>
                    </td>
                    <td valign="top" style="padding-bottom: 16px; color: #CBD5E1; font-size: 15px; line-height: 1.5;">
                      <strong style="color: #ffffff;">React:</strong> Leave a 'Sharp', 'Pushback', or 'Tell me more' reaction to earn REP points.
                    </td>
                  </tr>
                  <tr>
                    <td width="32" valign="top">
                      <div style="width: 24px; height: 24px; border-radius: 50%; background-color: #10B98130; color: #10B981; text-align: center; line-height: 24px; font-size: 12px; font-weight: bold;">✓</div>
                    </td>
                    <td valign="top" style="color: #CBD5E1; font-size: 15px; line-height: 1.5;">
                      <strong style="color: #ffffff;">Verify:</strong> You've already completed this step! Account unlocked.
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #0A0910; border-top: 1px solid #ffffff10; text-align: center;">
              <p style="margin: 0 0 8px 0; color: #64748B; font-size: 14px;">If you have any questions, simply reply to this email.</p>
              <p style="margin: 0; color: #64748B; font-size: 14px; font-weight: bold;">— The Patchwork Team</p>
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
