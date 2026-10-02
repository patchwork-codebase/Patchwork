import { createClient } from 'https://esm.sh/@supabase/supabase-js';

const SUPABASE_URL = process.env.FUNCTION_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.FUNCTION_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

const supabase = createClient(SUPABASE_URL || '', SUPABASE_SERVICE_ROLE_KEY || '', {
  global: { headers: { 'x-edge-runtime': '1' } },
});

function jsonResponse(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization,Content-Type',
    },
  });
}

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') return jsonResponse(null, 204);

  try {
    const { url, contextText } = await req.json().catch(() => ({}));
    if (!url) return jsonResponse({ error: 'url is required' }, 400);

    // In a full implementation, we'd fetch the github PR diff or linear issue details using their APIs.
    // Since we don't have their tokens here, we rely on `contextText` passed from the client, or we just generate a plausible summary from the URL and context.
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 300,
        system: "You are an AI assistant analyzing artifact URLs (GitHub PRs, Linear issues, etc.) included in product builder updates. Generate a 2-sentence 'Plain English' summary of what this artifact likely represents based on the URL and any context text provided. Keep it professional, concise, and focused on the value delivered.",
        messages: [{ role: 'user', content: `URL: ${url}\nContext: ${contextText || 'None'}` }]
      })
    });

    if (!anthropicRes.ok) {
      const errorText = await anthropicRes.text();
      return jsonResponse({ error: `Anthropic API error: ${errorText}` }, 500);
    }

    const data = await anthropicRes.json();
    const summary = data.content?.[0]?.text || "Summary unavailable.";

    return jsonResponse({ success: true, summary });
  } catch (err: any) {
    return jsonResponse({ error: err?.message || String(err) }, 500);
  }
}
