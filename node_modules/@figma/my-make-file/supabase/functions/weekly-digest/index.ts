import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Set up Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || authHeader !== `Bearer ${Deno.env.get("API_SECRET_KEY")}`) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { data: observers, error: observerError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('role', 'observer');

    if (observerError) throw observerError;

    // Get the timestamp for 7 days ago
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const dateString = oneWeekAgo.toISOString();

    const results = [];

    for (const observer of observers) {
      // Find rooms this observer follows
      const { data: followedRooms } = await supabase
        .from('room_observers')
        .select('room_id')
        .eq('observer_id', observer.id);

      if (!followedRooms || followedRooms.length === 0) continue;
      const roomIds = followedRooms.map(r => r.room_id);

      // Find updates in these rooms from the last 7 days
      const { data: recentUpdates } = await supabase
        .from('updates')
        .select('id, room_id, content, created_at, rooms(title, builder_name)')
        .in('room_id', roomIds)
        .gte('created_at', dateString)
        .order('created_at', { ascending: false });

      if (recentUpdates && recentUpdates.length > 0) {
        // Here we format the digest, explicitly avoiding any leaderboard/ranking of builders.
        // We highlight "presence" and "activity" - who was active and what they discussed.
        
        const builderActivity = recentUpdates.reduce((acc: Record<string, number>, update: any) => {
          const builderName = update.rooms?.builder_name || 'A builder';
          acc[builderName] = (acc[builderName] || 0) + 1;
          return acc;
        }, {});

        const digestMarkdown = `
# Your Weekly Patchwork Digest 🧵

Hello ${observer.name || 'Observer'},

Here is a summary of the builders you follow and their progress over the last week.

### Active Builders in your network:
${Object.entries(builderActivity).map(([name, count]) => `- **${name}** posted ${count} updates.`).join('\n')}

### Notable discussions:
${recentUpdates.slice(0, 3).map((u: any) => `- In **${u.rooms?.title}**, ${u.rooms?.builder_name} shared an update: "${u.content.substring(0, 100)}..."`).join('\n')}

Stay close to the process!

- The Patchwork Team
        `;
        
        results.push({
          observer_email: observer.email,
          digest: digestMarkdown
        });
      }
    }

    return new Response(JSON.stringify({ success: true, processed: results.length }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
