import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  try {
    const eventType = req.headers.get('x-github-event');
    const signature = req.headers.get('x-hub-signature-256');

    // In a real implementation, we would validate `signature` using a secret stored in Deno.env.
    // For MVP, we proceed to parse the payload.
    
    const payload = await req.json();

    if (eventType !== 'push') {
      return new Response(JSON.stringify({ message: `Ignored event: ${eventType}` }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const githubRepoId = payload.repository?.id?.toString();
    if (!githubRepoId) {
       return new Response(JSON.stringify({ error: "No repository ID" }), { status: 400 });
    }

    // Find the linked repository in our DB
    const { data: repo, error: repoError } = await supabase
      .from('repositories')
      .select('id, linked_room_id')
      .eq('github_repo_id', githubRepoId)
      .single();

    if (repoError || !repo) {
       return new Response(JSON.stringify({ error: "Repository not linked to any room" }), { status: 404 });
    }

    // Log the webhook event
    await supabase.from('github_webhook_events').insert({
      github_event_id: req.headers.get('x-github-delivery'),
      repo_id: repo.id,
      event_type: eventType,
      payload: payload,
      processed: true
    });

    // Generate drafts for each commit
    const commits = payload.commits || [];
    const drafts = commits.map((commit: any) => ({
      room_id: repo.linked_room_id,
      repo_id: repo.id,
      commit_hash: commit.id,
      commit_title: commit.message.split('\n')[0],
      commit_message: commit.message,
      commit_url: commit.url,
      diff_preview: `Author: ${commit.author.name}\nModified: ${commit.modified?.length || 0} files\nAdded: ${commit.added?.length || 0} files\nRemoved: ${commit.removed?.length || 0} files`,
      status: 'draft'
    }));

    if (drafts.length > 0) {
       const { error: draftError } = await supabase.from('github_drafts').insert(drafts);
       if (draftError) {
         console.error("Draft error", draftError);
         return new Response(JSON.stringify({ error: draftError.message }), { status: 500 });
       }
    }

    return new Response(
      JSON.stringify({ message: `Processed ${commits.length} commits` }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
