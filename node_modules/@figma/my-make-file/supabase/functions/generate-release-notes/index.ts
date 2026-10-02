import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { room_id } = await req.json();

    if (!room_id) {
      return new Response(JSON.stringify({ error: "room_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Missing Auth token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch room data
    const { data: roomData, error: roomError } = await supabaseClient
      .from("rooms")
      .select("title, description")
      .eq("id", room_id)
      .single();

    if (roomError || !roomData) {
      throw new Error("Failed to fetch room details");
    }

    // Fetch recent updates
    const { data: updates } = await supabaseClient
      .from("updates")
      .select("content, created_at")
      .eq("room_id", room_id)
      .order("created_at", { ascending: false })
      .limit(10);

    // Fetch recent decisions
    const { data: decisions } = await supabaseClient
      .from("room_decisions")
      .select("title, description, created_at")
      .eq("room_id", room_id)
      .order("created_at", { ascending: false })
      .limit(5);

    // Format context for AI
    const updatesText = updates?.map(u => `- ${new Date(u.created_at).toLocaleDateString()}: ${u.content}`).join('\n') || "No recent updates.";
    const decisionsText = decisions?.map(d => `- ${new Date(d.created_at).toLocaleDateString()}: ${d.title} - ${d.description}`).join('\n') || "No recent decisions.";

    const prompt = `You are an AI assistant helping a product builder write a Release Note / Changelog.
Context about the project:
Project Title: ${roomData.title}
Description: ${roomData.description || "N/A"}

Recent Updates:
${updatesText}

Recent Decisions:
${decisionsText}

Task: Write a highly engaging, professional, and well-structured Markdown release note summarizing the progress. 
Include sections like "🚀 What's New", "🧠 Key Decisions", and "🔮 What's Next" (if applicable). Keep it concise but exciting.`;

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      }),
    });

    const aiData = await res.json();
    if (!res.ok) {
      throw new Error(`AI API Error: ${JSON.stringify(aiData)}`);
    }

    const releaseNote = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "Failed to generate note.";

    return new Response(JSON.stringify({ releaseNote }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
