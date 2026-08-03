import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { SYSTEM_PROMPT } from './prompt.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { scenarioId, responseText } = await req.json();

    // 1. Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Get the user making the request
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    // 2. Fetch the scenario context from DB
    const { data: scenario, error: dbError } = await supabaseClient
      .from('pm_decision_scenarios')
      .select('title, context')
      .eq('id', scenarioId)
      .single();

    if (dbError || !scenario) throw new Error('Scenario not found');

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      // For MVP/Demo if API key is not set, return a high-quality mocked response 
      // instead of failing, to keep the UI demo working.
      console.warn("No OPENAI_API_KEY found, returning fallback evaluation.");
      return new Response(JSON.stringify({
        overallScore: 82,
        strengths: ['Addressed the critical infrastructure risk immediately.', 'Clear communication of trade-offs to stakeholders.'],
        weaknesses: ['Did not offer a mitigation plan for the delayed sales features.', 'Underestimated the short-term revenue impact.'],
        skillScores: { prioritization: 85, strategy: 78, customerFocus: 75, communication: 90 }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Call OpenAI for Evaluation
    const openAiRequest = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // or gpt-4o
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `SCENARIO: ${scenario.title}\nCONTEXT: ${scenario.context}\n\nPM'S DECISION: ${responseText}` }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      }),
    });

    const aiResponse = await openAiRequest.json();
    const evaluation = JSON.parse(aiResponse.choices[0].message.content);

    // 4. Save the attempt & scores to the DB
    await supabaseClient.from('pm_decision_attempts').insert({
      scenario_id: scenarioId,
      user_id: user.id,
      user_reasoning: responseText,
      ai_evaluation: evaluation,
      overall_score: evaluation.overallScore
    });

    // We'd also update the pm_scores and pm_profile here in a full production setting.

    return new Response(JSON.stringify(evaluation), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in evaluate-decision:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
