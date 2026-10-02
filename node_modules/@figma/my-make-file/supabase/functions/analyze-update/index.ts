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
    const { updateText } = await req.json().catch(() => ({}));
    if (!updateText) return jsonResponse({ error: 'updateText is required' }, 400);

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
        system: "You are an AI assistant analyzing product builder updates. Does the following text indicate that the builder made a significant technical or product decision, pivoted, or learned something critical? If yes, extract it concisely (max 1 sentence) so it can be added to a 'Decision Log'. Return JSON in the format: { \"isDecision\": true/false, \"extractedText\": \"string or null\" }. ONLY RETURN JSON.",
        messages: [{ role: 'user', content: updateText }]
      })
    });

    if (!anthropicRes.ok) {
      const errorText = await anthropicRes.text();
      return jsonResponse({ error: `Anthropic API error: ${errorText}` }, 500);
    }

    const data = await anthropicRes.json();
    let resultJson = { isDecision: false, extractedText: null };
    
    try {
      const content = data.content[0].text;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        resultJson = JSON.parse(jsonMatch[0]);
      }
    } catch(e) {
      console.error("Failed to parse JSON from AI response", e);
    }

    return jsonResponse({ success: true, result: resultJson });
  } catch (err: any) {
    return jsonResponse({ error: err?.message || String(err) }, 500);
  }
}
