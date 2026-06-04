import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";

const app = new Hono();

app.use('*', logger(console.log));
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
}));

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

// ── Health ────────────────────────────────────────────────────────────────
app.get("/make-server-30db7d9e/health", (c) => c.json({ status: "ok" }));

// ── Auth: Signup ──────────────────────────────────────────────────────────
app.post("/make-server-30db7d9e/auth/signup", async (c) => {
  try {
    const { email, password, name, role } = await c.req.json();
    if (!email || !password || !name) {
      return c.json({ error: "email, password, and name are required" }, 400);
    }
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role: role || 'observer' },
      email_confirm: true,
    });
    if (error) return c.json({ error: `Signup error: ${error.message}` }, 400);

    const profile = {
      id: data.user.id,
      name,
      email,
      role: role || 'observer',
      reputation: 0,
      bio: '',
      avatar: '',
      createdAt: new Date().toISOString(),
    };
    await kv.set(`user:${data.user.id}`, JSON.stringify(profile));

    return c.json({ user: data.user, profile });
  } catch (err) {
    console.log('Signup error:', err);
    return c.json({ error: `Signup failed: ${err}` }, 500);
  }
});

// ── Profile: Get ──────────────────────────────────────────────────────────
app.get("/make-server-30db7d9e/users/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const raw = await kv.get(`user:${id}`);
    if (!raw) return c.json({ error: "User not found" }, 404);
    return c.json(JSON.parse(raw));
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

    const raw = await kv.get(`user:${id}`);
    if (!raw) return c.json({ error: "User not found" }, 404);
    const profile = JSON.parse(raw);
    const updates = await c.req.json();
    const allowed = ['name', 'bio', 'avatar', 'role'];
    for (const key of allowed) {
      if (updates[key] !== undefined) profile[key] = updates[key];
    }
    await kv.set(`user:${id}`, JSON.stringify(profile));
    return c.json(profile);
  } catch (err) {
    return c.json({ error: `Update user failed: ${err}` }, 500);
  }
});

// ── Rooms: List ───────────────────────────────────────────────────────────
app.get("/make-server-30db7d9e/rooms", async (c) => {
  try {
    const rawIds = await kv.get('rooms:all');
    const ids: string[] = rawIds ? JSON.parse(rawIds) : [];
    if (ids.length === 0) return c.json([]);
    const roomRaws = await kv.mget(ids.map(id => `room:${id}`));
    const rooms = roomRaws
      .filter((r): r is string => r !== null && r !== undefined)
      .map(r => JSON.parse(r));
    rooms.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return c.json(rooms);
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
      title,
      description: description || '',
      tags: tags || [],
      builderId: user.id,
      builderName: user.user_metadata?.name || 'Anonymous',
      status: 'active',
      updateCount: 0,
      observerCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    await kv.set(`room:${id}`, JSON.stringify(room));

    const rawIds = await kv.get('rooms:all');
    const ids: string[] = rawIds ? JSON.parse(rawIds) : [];
    ids.unshift(id);
    await kv.set('rooms:all', JSON.stringify(ids));

    const rawUserRooms = await kv.get(`user:${user.id}:rooms`);
    const userRooms: string[] = rawUserRooms ? JSON.parse(rawUserRooms) : [];
    userRooms.unshift(id);
    await kv.set(`user:${user.id}:rooms`, JSON.stringify(userRooms));

    return c.json(room, 201);
  } catch (err) {
    return c.json({ error: `Create room failed: ${err}` }, 500);
  }
});

// ── Rooms: Get ────────────────────────────────────────────────────────────
app.get("/make-server-30db7d9e/rooms/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const raw = await kv.get(`room:${id}`);
    if (!raw) return c.json({ error: "Room not found" }, 404);
    const room = JSON.parse(raw);

    const updatesRaw = await kv.get(`room:${id}:updates`);
    const updates: any[] = updatesRaw ? JSON.parse(updatesRaw) : [];

    const reactionsRaw = await kv.get(`room:${id}:reactions`);
    const reactions: any[] = reactionsRaw ? JSON.parse(reactionsRaw) : [];

    return c.json({ ...room, updates, reactions });
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
    const raw = await kv.get(`room:${id}`);
    if (!raw) return c.json({ error: "Room not found" }, 404);
    const room = JSON.parse(raw);
    if (room.builderId !== user.id) return c.json({ error: "Forbidden" }, 403);

    const updates = await c.req.json();
    const allowed = ['status', 'title', 'description', 'tags'];
    for (const key of allowed) {
      if (updates[key] !== undefined) room[key] = updates[key];
    }
    room.updatedAt = new Date().toISOString();
    await kv.set(`room:${id}`, JSON.stringify(room));
    return c.json(room);
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
    const raw = await kv.get(`room:${id}`);
    if (!raw) return c.json({ error: "Room not found" }, 404);
    const room = JSON.parse(raw);
    if (room.builderId !== user.id) return c.json({ error: "Only the builder can post updates" }, 403);

    const { content, mediaUrl } = await c.req.json();
    if (!content) return c.json({ error: "content is required" }, 400);

    const updateId = nanoid();
    const now = new Date().toISOString();
    const update = { id: updateId, content, mediaUrl: mediaUrl || null, authorId: user.id, authorName: user.user_metadata?.name || 'Builder', createdAt: now };

    const updatesRaw = await kv.get(`room:${id}:updates`);
    const updates: any[] = updatesRaw ? JSON.parse(updatesRaw) : [];
    updates.push(update);
    await kv.set(`room:${id}:updates`, JSON.stringify(updates));

    room.updateCount = updates.length;
    room.updatedAt = now;
    room.lastUpdate = content.slice(0, 120);
    await kv.set(`room:${id}`, JSON.stringify(room));

    return c.json(update, 201);
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
    const raw = await kv.get(`room:${id}`);
    if (!raw) return c.json({ error: "Room not found" }, 404);

    const { type, text, updateId } = await c.req.json();
    const validTypes = ['sharp', 'pushback', 'tellmemore'];
    if (!validTypes.includes(type)) return c.json({ error: "Invalid reaction type" }, 400);
    if (!text) return c.json({ error: "text is required" }, 400);

    const reactionId = nanoid();
    const now = new Date().toISOString();
    const reaction = {
      id: reactionId, type, text, updateId: updateId || null,
      observerId: user.id, observerName: user.user_metadata?.name || 'Observer',
      createdAt: now,
    };

    const reactionsRaw = await kv.get(`room:${id}:reactions`);
    const reactions: any[] = reactionsRaw ? JSON.parse(reactionsRaw) : [];
    reactions.push(reaction);
    await kv.set(`room:${id}:reactions`, JSON.stringify(reactions));

    const room = JSON.parse(raw);
    room.updatedAt = now;
    await kv.set(`room:${id}`, JSON.stringify(room));

    // Bump reputation for observer
    const userRaw = await kv.get(`user:${user.id}`);
    if (userRaw) {
      const profile = JSON.parse(userRaw);
      profile.reputation = (profile.reputation || 0) + 1;
      await kv.set(`user:${user.id}`, JSON.stringify(profile));
    }

    return c.json(reaction, 201);
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
    const raw = await kv.get(`room:${id}`);
    if (!raw) return c.json({ error: "Room not found" }, 404);

    const observersRaw = await kv.get(`room:${id}:observers`);
    const observers: string[] = observersRaw ? JSON.parse(observersRaw) : [];
    if (!observers.includes(user.id)) {
      observers.push(user.id);
      await kv.set(`room:${id}:observers`, JSON.stringify(observers));

      const room = JSON.parse(raw);
      room.observerCount = observers.length;
      room.updatedAt = new Date().toISOString();
      await kv.set(`room:${id}`, JSON.stringify(room));

      const userObservingRaw = await kv.get(`user:${user.id}:observing`);
      const userObserving: string[] = userObservingRaw ? JSON.parse(userObservingRaw) : [];
      if (!userObserving.includes(id)) {
        userObserving.unshift(id);
        await kv.set(`user:${user.id}:observing`, JSON.stringify(userObserving));
      }
    }
    return c.json({ joined: true, observerCount: observers.length });
  } catch (err) {
    return c.json({ error: `Join room failed: ${err}` }, 500);
  }
});

// ── Build Log: Get ────────────────────────────────────────────────────────
app.get("/make-server-30db7d9e/log/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const raw = await kv.get(`room:${id}`);
    if (!raw) return c.json({ error: "Room not found" }, 404);
    const room = JSON.parse(raw);

    const updatesRaw = await kv.get(`room:${id}:updates`);
    const updates: any[] = updatesRaw ? JSON.parse(updatesRaw) : [];

    const reactionsRaw = await kv.get(`room:${id}:reactions`);
    const reactions: any[] = reactionsRaw ? JSON.parse(reactionsRaw) : [];

    const builderRaw = await kv.get(`user:${room.builderId}`);
    const builder = builderRaw ? JSON.parse(builderRaw) : null;

    return c.json({ room, updates, reactions, builder });
  } catch (err) {
    return c.json({ error: `Get log failed: ${err}` }, 500);
  }
});

// ── User: Get rooms ───────────────────────────────────────────────────────
app.get("/make-server-30db7d9e/users/:id/rooms", async (c) => {
  try {
    const { id } = c.req.param();
    const rawIds = await kv.get(`user:${id}:rooms`);
    const ids: string[] = rawIds ? JSON.parse(rawIds) : [];
    if (ids.length === 0) return c.json([]);
    const roomRaws = await kv.mget(ids.map(rid => `room:${rid}`));
    const rooms = roomRaws.filter((r): r is string => r !== null && r !== undefined).map(r => JSON.parse(r));
    return c.json(rooms);
  } catch (err) {
    return c.json({ error: `Get user rooms failed: ${err}` }, 500);
  }
});

// ── User: Get observing ───────────────────────────────────────────────────
app.get("/make-server-30db7d9e/users/:id/observing", async (c) => {
  try {
    const { id } = c.req.param();
    const rawIds = await kv.get(`user:${id}:observing`);
    const ids: string[] = rawIds ? JSON.parse(rawIds) : [];
    if (ids.length === 0) return c.json([]);
    const roomRaws = await kv.mget(ids.map(rid => `room:${rid}`));
    const rooms = roomRaws.filter((r): r is string => r !== null && r !== undefined).map(r => JSON.parse(r));
    return c.json(rooms);
  } catch (err) {
    return c.json({ error: `Get user observing failed: ${err}` }, 500);
  }
});

Deno.serve(app.fetch);
