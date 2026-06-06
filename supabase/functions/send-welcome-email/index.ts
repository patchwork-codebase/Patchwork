import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@3.4.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") || "re_bxj3KLqG_nh6hxq34aHSK7UbWhLZA9FPr");

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
    const { email, name, role } = body;

    if (!email || !name) {
      return new Response(JSON.stringify({ error: "Email and name are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Send welcome email using Resend
    const { data, error } = await resend.emails.send({
      from: "Patchwork <welcome@joinpatchwork.xyz>",
      to: email,
      subject: "Welcome to Patchwork! 🎉",
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="font-size: 24px; font-weight: 800; color: #6C5CE7; margin-bottom: 8px;">
              patchwork
            </div>
            <h1 style="font-size: 32px; font-weight: 800; color: #1a1a1a; margin: 0;">
              Welcome to Patchwork!
            </h1>
            <p style="font-size: 18px; color: #4a5568; margin-top: 8px;">
              Hi ${name}, thanks for joining!
            </p>
          </div>

          <div style="background: linear-gradient(135deg, #6C5CE7 0%, #8B7CF8 100%); border-radius: 16px; padding: 24px; color: white; margin-bottom: 32px;">
            <h2 style="font-size: 20px; font-weight: 700; margin: 0 0 8px 0;">
              You're part of the founding cohort!
            </h2>
            <p style="font-size: 16px; margin: 0; opacity: 0.9;">
              As a ${role === "observer" ? "observer" : "builder"}, you're helping us build the future of transparent, collaborative product development.
            </p>
          </div>

          <div style="background: #f7fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <h3 style="font-size: 16px; font-weight: 600; color: #1a1a1a; margin-top: 0;">
              What's next?
            </h3>
            <ul style="margin: 16px 0 0 0; padding-left: 20px; color: #4a5568;">
              <li style="margin-bottom: 8px;">${role === "observer" ? "Explore live rooms and give feedback" : "Create your first build room"}</li>
              <li style="margin-bottom: 8px;">Join the community</li>
              <li>Start sharing your work!</li>
            </ul>
          </div>

          <div style="text-align: center; margin-top: 32px;">
            <p style="font-size: 14px; color: #718096; margin: 0;">
              Check out <a href="https://joinpatchwork.xyz" style="color: #6C5CE7; text-decoration: none;">joinpatchwork.xyz</a> to get started!
            </p>
            <p style="font-size: 14px; color: #718096; margin: 8px 0 0 0;">
              If you have any questions, reply to this email!
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
      return new Response(JSON.stringify({ error: "Failed to send email" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, data }), {
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
