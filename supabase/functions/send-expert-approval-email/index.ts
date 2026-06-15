import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@3.4.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
    const { email, name, tier = "Bronze" } = body;

    if (!email || !name) {
      return new Response(JSON.stringify({ error: "Email and name are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. Send email using Resend
    const { data, error } = await resend.emails.send({
      from: "Patchwork <hello@joinpatchwork.xyz>",
      to: email,
      subject: "Congratulations! You are now a Verified Expert 🏆",
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Verified Expert Approval</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0D0B14; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #0D0B14; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; background-color: #12101C; border: 1px solid #ffffff10; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.4);">
          <!-- Header Image / Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f766e 0%, #064e3b 100%); padding: 40px 32px; text-align: center; border-bottom: 1px solid #ffffff10;">
              <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/shield-check.svg" width="48" height="48" style="filter: invert(100%) sepia(0%) saturate(0%) hue-rotate(93deg) brightness(103%) contrast(103%); margin-bottom: 16px;" alt="Verified Expert">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 900; letter-spacing: -1px;">Congratulations, ${name}!</h1>
              <p style="margin: 12px 0 0 0; color: #A0AEC0; font-size: 18px; line-height: 1.5;">Your Verified Expert application has been officially approved.</p>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 32px;">
              <h2 style="margin: 0 0 16px 0; color: #ffffff; font-size: 20px; font-weight: 700;">Welcome to the inner circle.</h2>
              <p style="margin: 0 0 24px 0; color: #CBD5E1; font-size: 16px; line-height: 1.6;">
                Our team was incredibly impressed with your application and background. As a newly minted <strong>${tier} Tier</strong> Verified Expert, your badge is now active across the platform. Builders will see your verification checkmark whenever you drop an insight in a room.
              </p>
              
              <!-- Primary CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom: 32px;">
                <tr>
                  <td align="center">
                    <a href="https://joinpatchwork.xyz/explore" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 9999px; font-weight: 700; font-size: 16px; letter-spacing: 0.5px; box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);">
                      Find a Room to Review
                    </a>
                  </td>
                </tr>
              </table>

              <!-- What's Next Guide -->
              <div style="background-color: #ffffff05; border: 1px solid #ffffff10; border-radius: 16px; padding: 24px;">
                <h3 style="margin: 0 0 16px 0; color: #ffffff; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; font-weight: 800;">What's next?</h3>
                
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td width="32" valign="top" style="padding-bottom: 16px;">
                      <div style="width: 24px; height: 24px; border-radius: 50%; background-color: #10b98130; color: #10b981; text-align: center; line-height: 24px; font-size: 12px; font-weight: bold;">1</div>
                    </td>
                    <td valign="top" style="padding-bottom: 16px; color: #CBD5E1; font-size: 15px; line-height: 1.5;">
                      <strong style="color: #ffffff;">Stand Out:</strong> Your insights now carry the verified checkmark, instantly commanding more trust from builders.
                    </td>
                  </tr>
                  <tr>
                    <td width="32" valign="top" style="padding-bottom: 16px;">
                      <div style="width: 24px; height: 24px; border-radius: 50%; background-color: #10b98130; color: #10b981; text-align: center; line-height: 24px; font-size: 12px; font-weight: bold;">2</div>
                    </td>
                    <td valign="top" style="padding-bottom: 16px; color: #CBD5E1; font-size: 15px; line-height: 1.5;">
                      <strong style="color: #ffffff;">Earn More REP:</strong> As an expert, your reactions carry a heavier weight, meaning you earn more reputation points for your contributions.
                    </td>
                  </tr>
                  <tr>
                    <td width="32" valign="top">
                      <div style="width: 24px; height: 24px; border-radius: 50%; background-color: #10b98130; color: #10b981; text-align: center; line-height: 24px; font-size: 12px; font-weight: bold;">3</div>
                    </td>
                    <td valign="top" style="color: #CBD5E1; font-size: 15px; line-height: 1.5;">
                      <strong style="color: #ffffff;">Level Up:</strong> Keep reviewing actively to qualify for Silver and Gold tiers in the future!
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
  } catch (err: any) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
