import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@3.4.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") || "re_bxj3KLqG_nh6hxq34aHSK7UbWhLZA9FPr");
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") as string,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string
);

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
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
    const { email } = body;

    if (!email) {
      return new Response(JSON.stringify({ error: "Missing email field" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const origin = req.headers.get("origin") || "http://localhost:5174";

    // Use Supabase Admin to generate a secure recovery link
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${origin}/reset-password`,
      }
    });

    if (linkError) {
      // If user doesn't exist, Supabase might throw an error or just return.
      // To prevent email enumeration, we should probably still return success 
      // even if generating the link fails for a non-existent user.
      console.error("Failed to generate link:", linkError);
      return new Response(JSON.stringify({ success: true, note: "If account exists, email sent" }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const recoveryLink = linkData.properties.action_link;

    // Send the password reset email using Resend
    const { data, error } = await resend.emails.send({
      from: "Patchwork <verify@joinpatchwork.xyz>",
      to: email,
      subject: "Reset your Patchwork password",
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="font-size: 24px; font-weight: 800; color: #6C5CE7; margin-bottom: 8px;">
              patchwork
            </div>
            <h1 style="font-size: 32px; font-weight: 800; color: #1a1a1a; margin: 0;">
              Reset your password
            </h1>
            <p style="font-size: 18px; color: #4a5568; margin-top: 8px;">
              We received a request to reset your Patchwork password.
            </p>
          </div>

          <div style="text-align: center; margin-bottom: 32px;">
            <a href="${recoveryLink}" style="display: inline-block; padding: 16px 32px; background: #6C5CE7; color: white; text-decoration: none; border-radius: 9999px; font-weight: 800; font-size: 16px;">
              Reset Password
            </a>
          </div>

          <p style="text-align: center; color: #718096; font-size: 14px;">
            If you didn't request a password reset, you can safely ignore this email.
          </p>

          <div style="text-align: center; margin-top: 32px;">
            <p style="font-size: 14px; color: #718096; margin: 0;">
              — The Patchwork Team
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      throw error;
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (error: any) {
    console.error("Edge function error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
