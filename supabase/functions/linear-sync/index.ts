import { createClient } from 'https://esm.sh/@supabase/supabase-js';

const SUPABASE_URL = process.env.FUNCTION_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.FUNCTION_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

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
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return jsonResponse(null, 204);
  }

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
    if (!token) return jsonResponse({ error: 'Unauthorized' }, 401);

    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData?.user) return jsonResponse({ error: 'Unauthorized' }, 401);

    const { roomId } = await req.json().catch(() => ({}));
    if (!roomId) return jsonResponse({ error: 'roomId is required' }, 400);

    // Get the linear PAT
    const { data: linearAccount, error: accError } = await supabase
      .from('linear_accounts')
      .select('access_token')
      .eq('user_id', authData.user.id)
      .maybeSingle();

    if (accError || !linearAccount || !linearAccount.access_token) {
      return jsonResponse({ error: 'Linear account not connected' }, 400);
    }

    const linearToken = linearAccount.access_token;

    // Fetch from Linear API
    const linearRes = await fetch('https://api.linear.app/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': linearToken
      },
      body: JSON.stringify({
        query: `
          query {
            issues(first: 20, filter: { assignee: { isMe: { eq: true } } }, orderBy: updatedAt) {
              nodes {
                id
                title
                description
                url
                state {
                  name
                }
              }
            }
          }
        `
      })
    });

    if (!linearRes.ok) {
      const errorText = await linearRes.text();
      return jsonResponse({ error: `Linear API error: ${errorText}` }, 500);
    }

    const linearData = await linearRes.json();
    if (linearData.errors) {
      return jsonResponse({ error: 'Linear API returned errors', details: linearData.errors }, 500);
    }

    const issues = linearData.data?.issues?.nodes || [];

    // Map to local DB and Upsert
    const upserts = issues.map((issue: any) => ({
      room_id: roomId,
      linear_issue_id: issue.id,
      title: issue.title,
      description: issue.description || '',
      state: issue.state?.name || 'Todo',
      url: issue.url
    }));

    if (upserts.length > 0) {
      const { error: upsertError } = await supabase
        .from('linear_issues')
        .upsert(upserts, { onConflict: 'room_id,linear_issue_id' });
      
      if (upsertError) {
        return jsonResponse({ error: `Failed to save issues to db: ${upsertError.message}` }, 500);
      }
    }

    return jsonResponse({ success: true, count: upserts.length });

  } catch (err: any) {
    return jsonResponse({ error: err?.message || String(err) }, 500);
  }
}
