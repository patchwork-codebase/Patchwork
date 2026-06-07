import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";

const app = new Hono();

app.use('*', logger(console.log));
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization", "x-client-info", "apikey"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
}));
app.options("/*", (c) => c.text('', 204));

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
}

function getSupabaseClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
  );
}

async function getAuthUser(c: any) {
  const token = c.req.header('Authorization')?.split(' ')[1];
  if (!token) return null;
  const supabase = getSupabaseAdmin();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

function nanoid(len = 12) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  for (const byte of arr) id += chars[byte % chars.length];
  return id;
}

function normalizeProfile(profile: any) {
  if (!profile) return null;
  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    role: profile.role,
    reputation: profile.reputation,
    bio: profile.bio,
    avatar: profile.avatar,
    interests: profile.interests || [],
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  };
}

function normalizeRoom(room: any) {
  if (!room) return null;
  return {
    id: room.id,
    builderId: room.builder_id,
    builderName: room.builder_name,
    title: room.title,
    description: room.description,
    tags: room.tags || [],
    status: room.status,
    updateCount: room.update_count,
    observerCount: room.observer_count,
    lastUpdate: room.last_update,
    createdAt: room.created_at,
    updatedAt: room.updated_at,
  };
}

function normalizeUpdate(update: any) {
  if (!update) return null;
  return {
    id: update.id,
    roomId: update.room_id,
    authorId: update.author_id,
    authorName: update.author_name,
    content: update.content,
    mediaUrl: update.media_url,
    createdAt: update.created_at,
  };
}

function normalizeReaction(reaction: any) {
  if (!reaction) return null;
  return {
    id: reaction.id,
    roomId: reaction.room_id,
    updateId: reaction.update_id,
    observerId: reaction.observer_id,
    observerName: reaction.observer_name,
    type: reaction.type,
    text: reaction.text,
    createdAt: reaction.created_at,
  };
}

// ── Health ────────────────────────────────────────────────────────────────
app.get("/make-server-30db7d9e/health", (c) => c.json({ status: "ok" }));

// ── Auth: Signup ──────────────────────────────────────────────────────────
app.post("/make-server-30db7d9e/auth/signup", async (c) => {
  try {
    const { email, password, name, role, city, domain } = await c.req.json();
    if (!email || !password || !name) {
      return c.json({ error: "email, password, and name are required" }, 400);
    }
    if (name.trim().length < 2) {
      return c.json({ error: "Name must be at least 2 characters long" }, 400);
    }
    if (role && role !== 'builder' && role !== 'observer') {
      return c.json({ error: "Role must be either builder or observer" }, 400);
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json({ error: "Invalid email format" }, 400);
    }

    const admin = getSupabaseAdmin();
    // Create auth user with email auto-confirmed
    // The DB trigger (handle_new_user) automatically creates the public.users row
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role: role || 'builder', city: city || '', domain: domain || '' },
      email_confirm: true,
    });
    if (error || !data.user) {
      return c.json({ error: `Signup error: ${error?.message || 'Unable to create user'}` }, 400);
    }

    // Return immediately — no extra DB insert needed, trigger handles it
    return c.json({
      user: data.user,
      profile: {
        id: data.user.id,
        email,
        name,
        role: role || 'builder',
        reputation: 0,
        bio: '',
        avatar: '',
        interests: [],
        city: city || '',
        domain: domain || '',
        createdAt: data.user.created_at,
      }
    });
  } catch (err) {
    console.log('Signup error:', err);
    return c.json({ error: `Signup failed: ${err}` }, 500);
  }
});

// ── Auth: Login ───────────────────────────────────────────────────────────
app.post("/make-server-30db7d9e/auth/login", async (c) => {
  try {
    const { email, password } = await c.req.json();
    if (!email || !password) {
      return c.json({ error: "email and password are required" }, 400);
    }

    const client = getSupabaseClient();
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error || !data.user) return c.json({ error: `Login error: ${error?.message || 'Unable to sign in'}` }, 400);

    const admin = getSupabaseAdmin();
    const { data: profileData, error: profileError } = await admin.from('users').select('*').eq('id', data.user.id).maybeSingle();
    if (profileError) return c.json({ error: `Profile fetch failed: ${profileError.message}` }, 500);

    return c.json({ user: data.user, session: data.session, profile: normalizeProfile(profileData) });
  } catch (err) {
    console.log('Login error:', err);
    return c.json({ error: `Login failed: ${err}` }, 500);
  }
});

// ── Profile: Get ──────────────────────────────────────────────────────────
app.get("/make-server-30db7d9e/users/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const admin = getSupabaseAdmin();
    const { data, error } = await admin.from('users').select('*').eq('id', id).maybeSingle();
    if (error) return c.json({ error: `Get user failed: ${error.message}` }, 500);
    if (!data) return c.json({ error: "User not found" }, 404);
    return c.json(normalizeProfile(data));
  } catch (err) {
    return c.json({ error: `Get user failed: ${err}` }, 500);
  }
});

// ── Profile: Update ───────────────────────────────────────────────────────
app.put("/make-server-30db7d9e/users/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const { id } = c.req.param();
    if (user.id !== id) return c.json({ error: "Forbidden" }, 403);

    const updates = await c.req.json();
    if (updates.name !== undefined && updates.name.trim().length < 2) {
      return c.json({ error: "Name must be at least 2 characters long" }, 400);
    }
    if (updates.role !== undefined && updates.role !== 'builder' && updates.role !== 'observer') {
      return c.json({ error: "Role must be either builder or observer" }, 400);
    }
    const allowed = ['name', 'bio', 'avatar', 'role', 'interests', 'domain', 'building_desc', 'feed_focus', 'city', 'signup_completed_at', 'onboarding_call_scheduled'];
    const payload: Record<string, any> = { updated_at: new Date().toISOString() };
    for (const key of allowed) {
      if (updates[key] !== undefined) payload[key] = updates[key];
    }

    const admin = getSupabaseAdmin();
    const { data, error } = await admin.from('users').update(payload).eq('id', id).select().single();
    if (error) return c.json({ error: `Update user failed: ${error.message}` }, 500);
    return c.json(normalizeProfile(data));
  } catch (err) {
    return c.json({ error: `Update user failed: ${err}` }, 500);
  }
});

// ── Rooms: List ───────────────────────────────────────────────────────────
app.get("/make-server-30db7d9e/rooms", async (c) => {
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin.from('rooms').select('*').order('updated_at', { ascending: false });
    if (error) return c.json({ error: `List rooms failed: ${error.message}` }, 500);
    return c.json((data || []).map(normalizeRoom));
  } catch (err) {
    return c.json({ error: `List rooms failed: ${err}` }, 500);
  }
});

// ── Rooms: Create ─────────────────────────────────────────────────────────
app.post("/make-server-30db7d9e/rooms", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const { title, description, tags } = await c.req.json();
    if (!title) return c.json({ error: "title is required" }, 400);

    const id = nanoid();
    const now = new Date().toISOString();
    const room = {
      id,
      builder_id: user.id,
      builder_name: user.user_metadata?.name || 'Anonymous',
      title,
      description: description || '',
      tags: tags || [],
      status: 'active',
      update_count: 0,
      observer_count: 0,
      last_update: '',
      created_at: now,
      updated_at: now,
    };

    const admin = getSupabaseAdmin();
    const { data, error } = await admin.from('rooms').insert(room).single();
    if (error) return c.json({ error: `Create room failed: ${error.message}` }, 500);
    return c.json(normalizeRoom(data), 201);
  } catch (err) {
    return c.json({ error: `Create room failed: ${err}` }, 500);
  }
});

// ── Rooms: Get ────────────────────────────────────────────────────────────
app.get("/make-server-30db7d9e/rooms/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const admin = getSupabaseAdmin();
    const { data: room, error: roomError } = await admin.from('rooms').select('*').eq('id', id).maybeSingle();
    if (roomError) return c.json({ error: `Get room failed: ${roomError.message}` }, 500);
    if (!room) return c.json({ error: "Room not found" }, 404);

    const { data: updates, error: updatesError } = await admin.from('updates').select('*').eq('room_id', id).order('created_at', { ascending: false });
    if (updatesError) return c.json({ error: `Get room updates failed: ${updatesError.message}` }, 500);

    const { data: reactions, error: reactionsError } = await admin.from('reactions').select('*').eq('room_id', id).order('created_at', { ascending: false });
    if (reactionsError) return c.json({ error: `Get room reactions failed: ${reactionsError.message}` }, 500);

    return c.json({
      ...normalizeRoom(room),
      updates: (updates || []).map(normalizeUpdate),
      reactions: (reactions || []).map(normalizeReaction),
    });
  } catch (err) {
    return c.json({ error: `Get room failed: ${err}` }, 500);
  }
});

// ── Rooms: Update status ──────────────────────────────────────────────────
app.put("/make-server-30db7d9e/rooms/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const { id } = c.req.param();
    const admin = getSupabaseAdmin();

    const { data: room, error: roomError } = await admin.from('rooms').select('*').eq('id', id).maybeSingle();
    if (roomError) return c.json({ error: `Update room failed: ${roomError.message}` }, 500);
    if (!room) return c.json({ error: "Room not found" }, 404);
    if (room.builder_id !== user.id) return c.json({ error: "Forbidden" }, 403);

    const updates = await c.req.json();
    const allowed = ['status', 'title', 'description', 'tags'];
    const payload: Record<string, any> = { updated_at: new Date().toISOString() };
    for (const key of allowed) {
      if (updates[key] !== undefined) payload[key] = updates[key];
    }

    const { data, error } = await admin.from('rooms').update(payload).eq('id', id).single();
    if (error) return c.json({ error: `Update room failed: ${error.message}` }, 500);
    return c.json(normalizeRoom(data));
  } catch (err) {
    return c.json({ error: `Update room failed: ${err}` }, 500);
  }
});

// ── Updates: Post ─────────────────────────────────────────────────────────
app.post("/make-server-30db7d9e/rooms/:id/updates", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const { id } = c.req.param();
    const { content, mediaUrl } = await c.req.json();
    if (!content) return c.json({ error: "content is required" }, 400);

    const admin = getSupabaseAdmin();
    const { data: room, error: roomError } = await admin.from('rooms').select('*').eq('id', id).maybeSingle();
    if (roomError) return c.json({ error: `Post update failed: ${roomError.message}` }, 500);
    if (!room) return c.json({ error: "Room not found" }, 404);
    if (room.builder_id !== user.id) return c.json({ error: "Only the builder can post updates" }, 403);

    const update = {
      id: nanoid(),
      room_id: id,
      author_id: user.id,
      author_name: user.user_metadata?.name || 'Builder',
      content,
      media_url: mediaUrl || null,
      created_at: new Date().toISOString(),
    };

    const { data: inserted, error: insertError } = await admin.from('updates').insert(update).single();
    if (insertError) return c.json({ error: `Post update failed: ${insertError.message}` }, 500);

    await admin.from('rooms').update({
      update_count: room.update_count + 1,
      last_update: content.slice(0, 120),
      updated_at: new Date().toISOString(),
    }).eq('id', id);

    return c.json(normalizeUpdate(inserted), 201);
  } catch (err) {
    return c.json({ error: `Post update failed: ${err}` }, 500);
  }
});

// ── Reactions: Add ────────────────────────────────────────────────────────
app.post("/make-server-30db7d9e/rooms/:id/reactions", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const { id } = c.req.param();
    const { type, text, updateId } = await c.req.json();
    const validTypes = ['sharp', 'pushback', 'tellmemore'];
    if (!validTypes.includes(type)) return c.json({ error: "Invalid reaction type" }, 400);
    if (!text) return c.json({ error: "text is required" }, 400);

    const admin = getSupabaseAdmin();
    const { data: room, error: roomError } = await admin.from('rooms').select('*').eq('id', id).maybeSingle();
    if (roomError) return c.json({ error: `Add reaction failed: ${roomError.message}` }, 500);
    if (!room) return c.json({ error: "Room not found" }, 404);

    if (updateId) {
      const { data: updateRow, error: updateError } = await admin.from('updates').select('id').eq('id', updateId).maybeSingle();
      if (updateError) return c.json({ error: `Invalid update reference: ${updateError.message}` }, 500);
      if (!updateRow) return c.json({ error: "Update not found" }, 404);
    }

    const reaction = {
      id: nanoid(),
      room_id: id,
      update_id: updateId || null,
      observer_id: user.id,
      observer_name: user.user_metadata?.name || 'Observer',
      type,
      text,
      created_at: new Date().toISOString(),
    };

    const { data: inserted, error: insertError } = await admin.from('reactions').insert(reaction).single();
    if (insertError) return c.json({ error: `Add reaction failed: ${insertError.message}` }, 500);

    await admin.from('rooms').update({ updated_at: new Date().toISOString() }).eq('id', id);

    const { data: profileData, error: profileError } = await admin.from('users').select('reputation').eq('id', user.id).maybeSingle();
    if (!profileError && profileData) {
      const newReputation = (profileData.reputation || 0) + 1;
      await admin.from('users').update({ reputation: newReputation }).eq('id', user.id);
    }

    return c.json(normalizeReaction(inserted), 201);
  } catch (err) {
    return c.json({ error: `Add reaction failed: ${err}` }, 500);
  }
});

// ── Rooms: Join as observer ───────────────────────────────────────────────
app.post("/make-server-30db7d9e/rooms/:id/join", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const { id } = c.req.param();

    const admin = getSupabaseAdmin();
    const { data: room, error: roomError } = await admin.from('rooms').select('*').eq('id', id).maybeSingle();
    if (roomError) return c.json({ error: `Join room failed: ${roomError.message}` }, 500);
    if (!room) return c.json({ error: "Room not found" }, 404);

    const { error: upsertError } = await admin.from('room_observers').upsert({ room_id: id, observer_id: user.id }, { onConflict: ['room_id', 'observer_id'] });
    if (upsertError) return c.json({ error: `Join room failed: ${upsertError.message}` }, 500);

    const { count, error: countError } = await admin.from('room_observers').select('*', { count: 'exact', head: true }).eq('room_id', id);
    if (countError) return c.json({ error: `Join room failed: ${countError.message}` }, 500);

    await admin.from('rooms').update({ observer_count: count, updated_at: new Date().toISOString() }).eq('id', id);

    return c.json({ joined: true, observerCount: count });
  } catch (err) {
    return c.json({ error: `Join room failed: ${err}` }, 500);
  }
});

// ── Build Log: Get ────────────────────────────────────────────────────────
app.get("/make-server-30db7d9e/log/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const admin = getSupabaseAdmin();
    const { data: room, error: roomError } = await admin.from('rooms').select('*').eq('id', id).maybeSingle();
    if (roomError) return c.json({ error: `Get log failed: ${roomError.message}` }, 500);
    if (!room) return c.json({ error: "Room not found" }, 404);

    const { data: updates, error: updatesError } = await admin.from('updates').select('*').eq('room_id', id).order('created_at', { ascending: false });
    if (updatesError) return c.json({ error: `Get log failed: ${updatesError.message}` }, 500);

    const { data: reactions, error: reactionsError } = await admin.from('reactions').select('*').eq('room_id', id).order('created_at', { ascending: false });
    if (reactionsError) return c.json({ error: `Get log failed: ${reactionsError.message}` }, 500);

    const { data: builder, error: builderError } = await admin.from('users').select('*').eq('id', room.builder_id).maybeSingle();
    if (builderError) return c.json({ error: `Get log failed: ${builderError.message}` }, 500);

    return c.json({
      room: normalizeRoom(room),
      updates: (updates || []).map(normalizeUpdate),
      reactions: (reactions || []).map(normalizeReaction),
      builder: normalizeProfile(builder),
    });
  } catch (err) {
    return c.json({ error: `Get log failed: ${err}` }, 500);
  }
});

// ── User: Get rooms ───────────────────────────────────────────────────────
app.get("/make-server-30db7d9e/users/:id/rooms", async (c) => {
  try {
    const { id } = c.req.param();
    const admin = getSupabaseAdmin();
    const { data, error } = await admin.from('rooms').select('*').eq('builder_id', id).order('updated_at', { ascending: false });
    if (error) return c.json({ error: `Get user rooms failed: ${error.message}` }, 500);
    return c.json((data || []).map(normalizeRoom));
  } catch (err) {
    return c.json({ error: `Get user rooms failed: ${err}` }, 500);
  }
});

// ── User: Get observing ───────────────────────────────────────────────────
app.get("/make-server-30db7d9e/users/:id/observing", async (c) => {
  try {
    const { id } = c.req.param();
    const admin = getSupabaseAdmin();
    const { data: observerRows, error: observerError } = await admin.from('room_observers').select('room_id').eq('observer_id', id);
    if (observerError) return c.json({ error: `Get user observing failed: ${observerError.message}` }, 500);
    const roomIds = observerRows?.map((row: any) => row.room_id) || [];
    if (roomIds.length === 0) return c.json([]);

    const { data: rooms, error: roomsError } = await admin.from('rooms').select('*').in('id', roomIds).order('updated_at', { ascending: false });
    if (roomsError) return c.json({ error: `Get user observing failed: ${roomsError.message}` }, 500);
    return c.json((rooms || []).map(normalizeRoom));
  } catch (err) {
    return c.json({ error: `Get user observing failed: ${err}` }, 500);
  }
});

// ── LinkedIn: Generate Post ────────────────────────────────────────────────
app.post("/make-server-30db7d9e/linkedin/generate-post", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const { room_id } = await c.req.json();
    if (!room_id) return c.json({ error: "room_id is required" }, 400);

    const admin = getSupabaseAdmin();
    const { data: room } = await admin.from('rooms').select('*').eq('id', room_id).maybeSingle();
    if (!room) return c.json({ error: "Room not found" }, 404);

    const { data: updates } = await admin.from('updates').select('*').eq('room_id', room_id).order('created_at', { ascending: false }).limit(5);
    const latestUpdate = updates && updates.length > 0 ? updates[0].content : "Built some amazing features and polished the UI.";

    // Generate formatted content based on latest log
    const content = `🚀 Just wrapped another milestone on Patchwork: ${room.title}\n\nKey updates:\n• ${latestUpdate.slice(0, 150).replace(/\n/g, '\n• ')}\n\nBuilding products means solving small problems that create better user experiences.\n\nFollow the journey:\nhttps://patchwork.com/dashboard/rooms/${room.id}\n\n#buildinpublic #product #engineering`;

    return c.json({ content });
  } catch (err) {
    return c.json({ error: `Generate post failed: ${err}` }, 500);
  }
});

// ── LinkedIn: Publish Post ────────────────────────────────────────────────
app.post("/make-server-30db7d9e/linkedin/publish", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const { room_id, content } = await c.req.json();
    if (!content) return c.json({ error: "content is required" }, 400);

    const admin = getSupabaseAdmin();
    
    // Check rate limits (max 10 per day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count } = await admin.from('linkedin_posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('published_at', today.toISOString());
    
    if (count !== null && count >= 10) {
      return c.json({ error: "Daily LinkedIn post limit (10) reached." }, 429);
    }

    // Get LinkedIn Account token
    const { data: linkedInAcc, error: accError } = await admin.from('linkedin_accounts').select('*').eq('user_id', user.id).maybeSingle();
    if (!linkedInAcc || !linkedInAcc.access_token) {
      return c.json({ error: "LinkedIn account not connected" }, 400);
    }

    // Post to LinkedIn UGC API
    const urn = linkedInAcc.linkedin_user_id; // "urn:li:person:XXXX" or just the ID. Supabase linkedin_oidc provider returns the URN or sub.
    // Ensure it's prefixed properly if not already
    const authorUrn = urn.startsWith('urn:li:person:') ? urn : `urn:li:person:${urn}`;

    const linkedinResponse = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${linkedInAcc.access_token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify({
        author: authorUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: content },
            shareMediaCategory: 'NONE'
          }
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
      })
    });

    if (!linkedinResponse.ok) {
      const errorData = await linkedinResponse.text();
      // Record failed post
      await admin.from('linkedin_posts').insert({
        user_id: user.id, build_log_id: room_id, content, status: 'failed'
      });
      return c.json({ error: `LinkedIn API error: ${errorData}` }, 502);
    }

    const responseData = await linkedinResponse.json();
    
    // Record successful post
    await admin.from('linkedin_posts').insert({
      user_id: user.id, build_log_id: room_id, content, status: 'published',
      linkedin_post_id: responseData.id, published_at: new Date().toISOString()
    });

    return c.json({ success: true, id: responseData.id });
  } catch (err) {
    return c.json({ error: `Publish post failed: ${err}` }, 500);
  }
});

Deno.serve(app.fetch);
