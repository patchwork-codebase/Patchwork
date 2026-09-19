import { createClient } from 'https://esm.sh/@supabase/supabase-js';

// This function uses the Supabase service role key to read/write DB records.
// Set the following environment variables for the function before deploying:
// - FUNCTION_SUPABASE_URL
// - FUNCTION_SERVICE_ROLE_KEY

const SUPABASE_URL = process.env.FUNCTION_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.FUNCTION_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  // eslint-disable-next-line no-console
  console.warn('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
}

const supabase = createClient(SUPABASE_URL || '', SUPABASE_SERVICE_ROLE_KEY || '', {
  global: { headers: { 'x-edge-runtime': '1' } },
});

function jsonResponse(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function toCamelCase(key: string) {
  return key.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}

function normalizeRow(row: Record<string, any>) {
  if (!row || typeof row !== 'object') return row;
  return Object.entries(row).reduce((result, [key, value]) => {
    const camelKey = toCamelCase(key);
    if (Array.isArray(value)) {
      result[camelKey] = value.map(item => (typeof item === 'object' && item !== null ? normalizeRow(item) : item));
    } else if (value && typeof value === 'object') {
      result[camelKey] = normalizeRow(value as Record<string, any>);
    } else {
      result[camelKey] = value;
    }
    return result;
  }, {} as Record<string, any>);
}

async function getAuthUser(req: Request) {
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
  if (!token) return null;

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const route = url.pathname.replace(/\/functions\/v1\/[^/]+/, '');
  const parts = route.split('/').filter(Boolean);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization,Content-Type,x-client-info,apikey',
      },
    });
  }

  try {
    const authUser = await getAuthUser(req);

    // Public routes
    if (req.method === 'GET' && route === '/rooms') {
      const { data, error } = await supabase.from('rooms').select('*').order('created_at', { ascending: false });
      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse(data?.map(normalizeRow) || []);
    }

    if (req.method === 'GET' && parts[0] === 'users' && parts.length === 2) {
      const userId = parts[1];
      const { data, error } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
      if (error) return jsonResponse({ error: error.message }, 500);
      
      // Fetch follower/following counts
      const [{ count: followerCount }, { count: followingCount }] = await Promise.all([
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId)
      ]);
      
      let isFollowing = false;
      if (authUser) {
        const { data: followData } = await supabase.from('follows').select('follower_id').eq('follower_id', authUser.id).eq('following_id', userId).maybeSingle();
        isFollowing = !!followData;
      }
      
      const responseData = data ? normalizeRow(data) : null;
      if (responseData) {
        responseData.followerCount = followerCount || 0;
        responseData.followingCount = followingCount || 0;
        responseData.isFollowing = isFollowing;
      }
      return jsonResponse(responseData);
    }

    if (req.method === 'GET' && parts[0] === 'users' && parts[2] === 'rooms') {
      const userId = parts[1];
      const { data, error } = await supabase.from('rooms').select('*').eq('builder_id', userId).order('created_at', { ascending: false });
      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse(data?.map(normalizeRow) || []);
    }

    // Auth-aware routes
    if (req.method === 'POST' && route === '/users') {
      if (!authUser) return jsonResponse({ error: 'Unauthorized' }, 401);
      const body = await req.json().catch(() => ({}));
      if (body.name !== undefined && body.name.trim().length < 2) {
        return jsonResponse({ error: 'Name must be at least 2 characters long' }, 400);
      }
      if (body.role !== undefined && body.role !== 'builder' && body.role !== 'observer') {
        return jsonResponse({ error: 'Role must be either builder or observer' }, 400);
      }
      const payload = {
        id: authUser.id,
        email: body.email || authUser.email || '',
        name: body.name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Anonymous Builder',
        role: body.role || authUser.user_metadata?.role || 'builder',
        city: body.city || authUser.user_metadata?.city || '',
        domain: body.domain || authUser.user_metadata?.domain || '',
        interests: body.interests || [],
        bio: body.bio || '',
        avatar: body.avatar || '',
      };
      const { data, error } = await supabase.from('users').upsert(payload, { onConflict: 'id' }).select().maybeSingle();
      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse(data ? normalizeRow(data) : null, 201);
    }

    if (req.method === 'PUT' && parts[0] === 'users' && parts.length === 2) {
      if (!authUser) return jsonResponse({ error: 'Unauthorized' }, 401);
      const targetUserId = parts[1];
      if (authUser.id !== targetUserId) return jsonResponse({ error: 'Forbidden' }, 403);
      const body = await req.json().catch(() => ({}));
      if (body.name !== undefined && body.name.trim().length < 2) {
        return jsonResponse({ error: 'Name must be at least 2 characters long' }, 400);
      }
      if (body.role !== undefined && body.role !== 'builder' && body.role !== 'observer') {
        return jsonResponse({ error: 'Role must be either builder or observer' }, 400);
      }
      const updates: Record<string, any> = {};
      ['name', 'bio', 'role', 'city', 'domain', 'website', 'twitter', 'github_url', 'linkedin_url'].forEach(key => {
        if (body[key] !== undefined) updates[key] = body[key];
      });
      if (body.interests !== undefined) updates.interests = body.interests;
      if (body.skills !== undefined) updates.skills = body.skills;
      if (!Object.keys(updates).length) return jsonResponse({ error: 'Nothing to update' }, 400);
      const { data, error } = await supabase.from('users').update(updates).eq('id', targetUserId).select().maybeSingle();
      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse(data ? normalizeRow(data) : null);
    }

    // Follows
    if (req.method === 'POST' && parts[0] === 'users' && parts[2] === 'follow') {
      if (!authUser) return jsonResponse({ error: 'Unauthorized' }, 401);
      const targetUserId = parts[1];
      if (authUser.id === targetUserId) return jsonResponse({ error: 'Cannot follow yourself' }, 400);
      
      const { error } = await supabase.from('follows').upsert({ follower_id: authUser.id, following_id: targetUserId });
      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse({ success: true }, 201);
    }

    if (req.method === 'DELETE' && parts[0] === 'users' && parts[2] === 'follow') {
      if (!authUser) return jsonResponse({ error: 'Unauthorized' }, 401);
      const targetUserId = parts[1];
      
      const { error } = await supabase.from('follows').delete().eq('follower_id', authUser.id).eq('following_id', targetUserId);
      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse({ success: true });
    }

    if (req.method === 'POST' && route === '/auth/signup') {
      const body = await req.json().catch(() => ({}));
      if (!body.email || !body.password) return jsonResponse({ error: 'Email and password are required' }, 400);
      if (!body.name || body.name.trim().length < 2) {
        return jsonResponse({ error: 'Name must be at least 2 characters long' }, 400);
      }
      if (body.role && body.role !== 'builder' && body.role !== 'observer') {
        return jsonResponse({ error: 'Role must be either builder or observer' }, 400);
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        return jsonResponse({ error: 'Invalid email format' }, 400);
      }
      const { data, error } = await supabase.auth.admin.createUser({
        email: body.email,
        password: body.password,
        email_confirm: false,
        user_metadata: {
          full_name: body.name,
          role: body.role,
          city: body.city,
          domain: body.domain,
        },
      });
      if (error) return jsonResponse({ error: error.message }, 500);
      if (!data.user) return jsonResponse({ error: 'Failed to create user' }, 500);
      const profilePayload = {
        id: data.user.id,
        email: data.user.email || body.email,
        name: body.name || data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Anonymous Builder',
        role: body.role || 'builder',
        city: body.city || body.city || '',
        domain: body.domain || body.domain || '',
        interests: body.interests || [],
        bio: '',
        avatar: '',
      };
      const { data: profileData, error: profileError } = await supabase.from('users').upsert(profilePayload, { onConflict: 'id' }).select().maybeSingle();
      if (profileError) return jsonResponse({ error: profileError.message }, 500);
      
      return jsonResponse({ userId: data.user.id, profile: profileData ? normalizeRow(profileData) : null }, 201);
    }

    if (req.method === 'POST' && route === '/rooms') {
      if (!authUser) return jsonResponse({ error: 'Unauthorized' }, 401);
      const body = await req.json().catch(() => ({}));
      const payload = {
        title: body.title || 'Untitled room',
        description: body.description || '',
        tags: body.tags || [],
        builder_id: authUser.id,
        builder_name: authUser.user_metadata?.full_name || authUser.email || 'Anonymous Builder',
        status: body.status || 'active',
        update_count: 0,
        observer_count: 0,
        last_update: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await supabase.from('rooms').insert(payload).select().maybeSingle();
      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse(data ? normalizeRow(data) : null, 201);
    }

    if (req.method === 'GET' && parts[0] === 'rooms' && parts.length === 2) {
      const roomId = parts[1];
      const { data, error } = await supabase.from('rooms').select('*, updates(*), reactions(*)').eq('id', roomId).maybeSingle();
      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse(data ? normalizeRow(data) : null);
    }

    if (req.method === 'PUT' && parts[0] === 'rooms' && parts.length === 2) {
      if (!authUser) return jsonResponse({ error: 'Unauthorized' }, 401);
      const roomId = parts[1];
      const body = await req.json().catch(() => ({}));
      const updates: Record<string, any> = {};
      ['status', 'title', 'description', 'tags', 'last_update'].forEach(key => {
        if (body[key] !== undefined) updates[key] = body[key];
      });
      if (!Object.keys(updates).length) return jsonResponse({ error: 'Nothing to update' }, 400);
      updates.updated_at = new Date().toISOString();
      const { data: room, error } = await supabase.from('rooms').update(updates).eq('id', roomId).select().maybeSingle();
      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse(room ? normalizeRow(room) : null);
    }

    if (req.method === 'POST' && parts[0] === 'rooms' && parts[2] === 'updates') {
      if (!authUser) return jsonResponse({ error: 'Unauthorized' }, 401);
      const roomId = parts[1];
      const body = await req.json().catch(() => ({}));
      const payload = {
        id: body.id || `${roomId}-${Date.now()}`,
        room_id: roomId,
        author_id: authUser.id,
        author_name: authUser.user_metadata?.full_name || authUser.email || 'Anonymous Builder',
        content: body.content || '',
        media_url: body.mediaUrl || null,
        code_snippet: body.codeSnippet || null,
        created_at: new Date().toISOString(),
      };
      const { data, error } = await supabase.from('updates').insert(payload).select().maybeSingle();
      if (error) return jsonResponse({ error: error.message }, 500);
      if (data) {
        const { data: roomData, error: roomError } = await supabase.from('rooms').select('update_count').eq('id', roomId).maybeSingle();
        if (!roomError && roomData) {
          await supabase.from('rooms').update({ update_count: (roomData.update_count || 0) + 1, last_update: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', roomId);
        }
      }
      return jsonResponse(data ? normalizeRow(data) : null, 201);
    }

    if (req.method === 'POST' && parts[0] === 'rooms' && parts[2] === 'reactions') {
      if (!authUser) return jsonResponse({ error: 'Unauthorized' }, 401);
      const roomId = parts[1];
      const body = await req.json().catch(() => ({}));
      const payload = {
        id: body.id || `${roomId}-reaction-${Date.now()}`,
        room_id: roomId,
        update_id: body.updateId || null,
        observer_id: authUser.id,
        observer_name: authUser.user_metadata?.full_name || authUser.email || 'Observer',
        type: body.type || 'tellmemore',
        text: body.text || '',
        created_at: new Date().toISOString(),
      };
      const { data, error } = await supabase.from('reactions').insert(payload).select().maybeSingle();
      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse(data ? normalizeRow(data) : null, 201);
    }

    if (req.method === 'POST' && parts[0] === 'rooms' && parts[2] === 'join') {
      if (!authUser) return jsonResponse({ error: 'Unauthorized' }, 401);
      const roomId = parts[1];
      const { data: existing, error: existingError } = await supabase.from('room_observers').select('*').eq('room_id', roomId).eq('observer_id', authUser.id).maybeSingle();
      if (existingError) return jsonResponse({ error: existingError.message }, 500);
      let observerCount = 0;
      if (!existing) {
        const { error: insertError } = await supabase.from('room_observers').insert({ room_id: roomId, observer_id: authUser.id }).select();
        if (insertError) return jsonResponse({ error: insertError.message }, 500);
        const { data: roomData, error: roomError } = await supabase.from('rooms').select('observer_count').eq('id', roomId).maybeSingle();
        if (roomError) return jsonResponse({ error: roomError.message }, 500);
        if (roomData) {
          observerCount = (roomData.observer_count || 0) + 1;
          await supabase.from('rooms').update({ observer_count: observerCount, updated_at: new Date().toISOString() }).eq('id', roomId);
        }
      } else {
        const { data: roomData, error: roomError } = await supabase.from('rooms').select('observer_count').eq('id', roomId).maybeSingle();
        if (roomError) return jsonResponse({ error: roomError.message }, 500);
        observerCount = roomData?.observer_count || 0;
      }
      return jsonResponse({ observerCount });
    }

    return jsonResponse({ error: 'Not found' }, 404);
  } catch (err: any) {
    return jsonResponse({ error: err?.message || String(err) }, 500);
  }
}
