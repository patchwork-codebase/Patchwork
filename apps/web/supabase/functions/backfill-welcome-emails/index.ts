import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization" } });
  }

  try {
    // 1. Fetch all users
    const { data: users, error: fetchError } = await supabase.from('users').select('*');
    
    if (fetchError) throw fetchError;

    const results = [];
    
    for (const user of users) {
      // Use the existing send-welcome-email function to keep idempotency logic
      const { data, error } = await supabase.functions.invoke('send-welcome-email', {
        body: { userId: user.id, email: user.email, name: user.name, role: user.role }
      });
      
      if (error) {
        results.push({ email: user.email, status: 'failed', error: error.message });
      } else {
        results.push({ email: user.email, status: 'success', data });
      }
    }

    return new Response(JSON.stringify({ success: true, processed: results.length, results }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (err: any) {
    console.error("Error backfilling:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
