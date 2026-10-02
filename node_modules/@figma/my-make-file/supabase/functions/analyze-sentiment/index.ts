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
    const { roomId } = await req.json().catch(() => ({}));
    if (!roomId) return jsonResponse({ error: 'roomId is required' }, 400);

    // Fetch reactions for this room
    const { data: reactions, error: reactionsError } = await supabase
      .from('room_reactions')
      .select('*')
      .eq('room_id', roomId);

    if (reactionsError) {
      return jsonResponse({ error: `Database error: ${reactionsError.message}` }, 500);
    }

    if (!reactions || reactions.length === 0) {
      return jsonResponse({ success: true, insights: { themes: [], summary: "No reactions to analyze yet." } });
    }

    // Prepare data for Claude
    const textReactions = reactions
      .filter((r: any) => r.text && r.text.trim().length > 0)
      .map((r: any) => `Type: ${r.type}, Text: ${r.text}`);

    if (textReactions.length === 0) {
      return jsonResponse({ success: true, insights: { themes: [], summary: "No text reactions to analyze yet." } });
    }

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        system: `You are an AI analyzing observer feedback for a product builder. You will be given a list of reactions. 
Categorize the feedback into 1-3 themes. For each theme, provide the 'name', the 'sentiment' (positive, negative, or neutral), and a 1-sentence 'summary' of what observers are saying.
Return ONLY a JSON object in this format:
{
  "summary": "Overall 1-2 sentence summary of the feedback",
  "themes": [
    { "name": "Theme Name", "sentiment": "positive/negative/neutral", "summary": "1 sentence summary" }
  ]
}`,
        messages: [{ role: 'user', content: textReactions.join("\n") }]
      })
    });

    if (!anthropicRes.ok) {
      const errorText = await anthropicRes.text();
      return jsonResponse({ error: `Anthropic API error: ${errorText}` }, 500);
    }

    const data = await anthropicRes.json();
    let resultJson = { themes: [], summary: "Could not parse insights." };
    
    try {
      const content = data.content[0].text;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        resultJson = JSON.parse(jsonMatch[0]);
      }
    } catch(e) {
      console.error("Failed to parse JSON from AI response", e);
    }

    return jsonResponse({ success: true, insights: resultJson });
  } catch (err: any) {
    return jsonResponse({ error: err?.message || String(err) }, 500);
  }
}
