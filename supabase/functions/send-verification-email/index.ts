import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@3.4.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
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
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    };
  }

  try {
    const body = await req.json();
    const { user_id, email, name } = body;

    if (!user_id || !email || !name) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      };
    }

    // Generate a verification token
    const token = crypto.randomUUID();

    // Store token in database
    const { error: dbError } = await supabase
      .from("email_verification_tokens")
      .insert({ user_id, token });

    if (dbError) {
      console.error("DB error:", dbError);
      throw dbError;
    }

    const verificationLink = `https://joinpatchwork.xyz/verify-email?token=${token}`;

    // Send verification email using Resend
    const { data, error } = await resend.emails.send({
      from: "Patchwork <verify@joinpatchwork.xyz",
      to: email,
      subject: "Verify your Patchwork email",
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="font-size: 24px; font-weight: 800; color: #6C5CE7; margin-bottom: 8px;">
              patchwork
            </div>
            <h1 style="font-size: 32px; font-weight: 800; color: #1a1a1a; margin: 0;">
              Verify your email address
            </h1>
            <p style="font-size: 18px; color: #4a5568; margin-top: 8px;">
              Hi ${name}, thanks for joining Patchwork!
            </p>
          </div>

          <div style="text-align: center; margin-bottom: 32px;">
            <a href="${verificationLink}" style="display: inline-block; padding: 16px 32px; background: #6C5CE7; color: white; text-decoration: none; border-radius: 9999px; font-weight: 800; font-size: 16px;">
              Verify Email Address
            </a>
          </div>

          <p style="text-align: center; color: #718096; font-size: 14px;">
            This link expires in 1 hour.
          </p>

          <div style="text-align: center; margin-top: 32px;">
            <p style="font-size: 14px; color: #718096; margin: 0;">
              If you didn't create an account on Patchwork, you can ignore this email.
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
      throw error;
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
