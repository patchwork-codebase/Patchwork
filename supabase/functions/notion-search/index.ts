import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query } = await req.json()
    
    // In a real implementation, you would use the Notion token stored in `notion_accounts` to query the Notion Search API
    // fetch('https://api.notion.com/v1/search', { ... })
    // See: https://developers.notion.com/reference/post-search
    
    // Mock response for now
    const results = [
      { id: "mock-1", title: "Product Requirements Document", url: "https://notion.so/mock-1" },
      { id: "mock-2", title: "Technical Architecture spec", url: "https://notion.so/mock-2" },
      { id: "mock-3", title: "Q3 Roadmap", url: "https://notion.so/mock-3" },
    ].filter(r => r.title.toLowerCase().includes((query || '').toLowerCase()));

    return new Response(
      JSON.stringify({ data: results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    )
  }
})
