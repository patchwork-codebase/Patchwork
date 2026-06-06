import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createClient, User, Session } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "/utils/supabase/info";

const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

export { supabase };

// Temporary development flag to bypass auth gate. Set to false to restore normal behavior.
export const DEV_AUTH_BYPASS = false;

const API_BASE = window.location.origin + "/api/v1";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function toCamelCase(key: string) {
  if (key === 'onboarding_call_scheduled' || key === 'signup_completed_at') return key;
  return key.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}

function normalizeRow(row: any): any {
  if (!row || typeof row !== 'object') return row;
  return Object.entries(row).reduce((result: any, [key, value]) => {
    const camelKey = toCamelCase(key);
    if (Array.isArray(value)) {
      result[camelKey] = value.map(item => (typeof item === 'object' && item !== null ? normalizeRow(item) : item));
    } else if (value && typeof value === 'object') {
      result[camelKey] = normalizeRow(value);
    } else {
      result[camelKey] = value;
    }
    return result;
  }, {});
}

export async function apiCall(path: string, opts: RequestInit = {}, token?: string) {
  try {
    // Intercept database-related user paths to bypass the broken edge function
    const cleanPath = path.split('?')[0];
    const parts = cleanPath.split('/').filter(Boolean);

    if (parts[0] === 'users') {
      // 1. GET /users/:id/rooms -> rooms table
      if (parts[2] === 'rooms') {
        const userId = parts[1];
        const { data, error } = await supabase
          .from('rooms')
          .select('*')
          .eq('builder_id', userId)
          .order('created_at', { ascending: false });
        if (error) throw new ApiError(error.message, 500);
        return (data || []).map(normalizeRow);
      }

      // 2. GET /users/:id -> users table
      if (opts.method === 'GET' || !opts.method) {
        if (parts.length === 2) {
          const userId = parts[1];
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .maybeSingle();
          if (error) throw new ApiError(error.message, 500);
          return data ? normalizeRow(data) : null;
        }
      }

      // 3. POST /users -> users table upsert
      if (opts.method === 'POST') {
        const body = opts.body ? JSON.parse(opts.body as string) : {};
        const { data, error } = await supabase
          .from('users')
          .upsert(body, { onConflict: 'id' })
          .select()
          .maybeSingle();
        if (error) throw new ApiError(error.message, 500);
        return data ? normalizeRow(data) : null;
      }

      // 4. PUT /users/:id -> users table update
      if (opts.method === 'PUT') {
        const targetUserId = parts[1];
        const body = opts.body ? JSON.parse(opts.body as string) : {};
        const updates: Record<string, any> = {};
        ['name', 'bio', 'role', 'city', 'domain'].forEach(key => {
          if (body[key] !== undefined) updates[key] = body[key];
        });
        if (body.interests !== undefined) updates.interests = body.interests;

        const { data, error } = await supabase
          .from('users')
          .update(updates)
          .eq('id', targetUserId)
          .select()
          .maybeSingle();
        if (error) throw new ApiError(error.message, 500);
        return data ? normalizeRow(data) : null;
      }
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token || publicAnonKey}`,
      ...(opts.headers as Record<string, string> || {}),
    };
    const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
    
    let data;
    try {
      data = await res.json();
    } catch (parseError) {
      data = { error: `Failed to parse response (HTTP ${res.status})` };
    }

    if (!res.ok) {
      const errorMessage = data.error || data.message || `Request failed (HTTP ${res.status})`;
      throw new ApiError(errorMessage, res.status);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : "An unexpected error occurred",
      500
    );
  }
}


interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
  reputation: number;
  bio: string;
  avatar: string;
  interests?: string[];
  createdAt: string;
  city?: string;
  domain?: string;
  emailVerified?: boolean;
  onboarding_call_scheduled?: boolean;
  signup_completed_at?: string | null;
}

interface SignInResult {
  profile: Profile | null;
  token: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  token: string | null;
  signUp: (email: string, password: string, name: string, role: string, city: string, domain: string) => Promise<SignInResult>;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  ensureValidSession: () => Promise<Session>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const token = session?.access_token || null;

  async function ensureProfileRow(user: User, authToken: string | null) {
    const metadata = (user as any).user_metadata || {};
    const payload = {
      id: user.id,
      email: user.email || '',
      name: metadata.name || metadata.full_name || user.email?.split('@')[0] || 'Anonymous Builder',
      role: metadata.role || 'builder',
      city: metadata.city || '',
      domain: metadata.domain || '',
      interests: metadata.interests || [],
      bio: '',
      avatar: '',
    };

    try {
      await apiCall('/users', {
        method: 'POST',
        body: JSON.stringify(payload),
      }, authToken || undefined);
    } catch (err) {
      console.log('Could not create or update profile row:', err);
    }
  }

  async function loadProfile(userId: string) {
    try {
      const p = await apiCall(`/users/${userId}`);
      
      // Query server directly to get fresh email confirmation status
      let isConfirmed = false;
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        isConfirmed = !!authUser?.email_confirmed_at;
      } catch (e) {
        console.error("Failed to query auth status:", e);
        isConfirmed = !!session?.user?.email_confirmed_at;
      }

      if (!p || !p.name || p.name === 'Anonymous Builder') {
        if (session?.user?.id === userId && session.user) {
          await ensureProfileRow(session.user, token);
          const retry = await apiCall(`/users/${userId}`);
          if (retry) {
            const profile = { ...(retry as Profile), emailVerified: isConfirmed };
            setProfile(profile);
            return profile;
          }
        }
        if (!p) return null;
      }
      const profile = { ...(p as Profile), emailVerified: isConfirmed };
      setProfile(profile);
      return profile;
    } catch (err) {
      console.log('Could not load profile:', err);
      return null;
    }
  }

  async function refreshProfile() {
    if (user) await loadProfile(user.id);
  }

  useEffect(() => {
    const channel = new BroadcastChannel('patchwork_auth_sync');

    channel.onmessage = (event) => {
      if (event.data === 'SESSION_LOGOUT') {
        setSession(null);
        setUser(null);
        setProfile(null);
      } else if (event.data === 'SESSION_LOGIN' || event.data === 'SESSION_REFRESH') {
        supabase.auth.getSession().then(({ data: { session } }) => {
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) {
            loadProfile(session.user.id);
          }
        });
      }
    };

    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      let currentSession = initialSession;
      if (initialSession) {
        try {
          const { data: { user: freshUser } } = await supabase.auth.getUser();
          if (freshUser) {
            currentSession = {
              ...initialSession,
              user: freshUser
            };
          }
        } catch (e) {
          console.error("Failed to fetch fresh user session on load:", e);
        }
      }
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
      if (currentSession?.user) {
        loadProfile(currentSession.user.id);
      }
    });

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        try {
          const { data: { user: refreshedUser } } = await supabase.auth.getUser();
          const { data: { session: refreshedSession } } = await supabase.auth.getSession();
          if (refreshedSession) {
            setSession(refreshedSession);
            setUser(refreshedUser ?? refreshedSession.user);
          }
        } catch (e) {
          console.error("Failed to refresh session on page visibility change:", e);
        }
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (event === 'SIGNED_OUT') {
        channel.postMessage('SESSION_LOGOUT');
        setProfile(null);
      } else if (event === 'SIGNED_IN') {
        channel.postMessage('SESSION_LOGIN');
        if (session?.user) loadProfile(session.user.id);
      } else if (event === 'TOKEN_REFRESHED') {
        channel.postMessage('SESSION_REFRESH');
        if (session?.user) loadProfile(session.user.id);
      } else {
        if (session?.user) {
          loadProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
      channel.close();
      window.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  async function ensureValidSession(): Promise<Session> {
    const { data: { session: activeSession }, error } = await supabase.auth.getSession();
    if (error || !activeSession) {
      throw new Error("Your session has expired. Please log in again to continue.");
    }
    const expiresAt = activeSession.expires_at ? activeSession.expires_at * 1000 : 0;
    if (expiresAt && Date.now() >= expiresAt - 10000) {
      const { data: { session: refreshedSession }, error: refreshErr } = await supabase.auth.refreshSession();
      if (refreshErr || !refreshedSession) {
        throw new Error("Your session has expired. Please log in again to continue.");
      }
      setSession(refreshedSession);
      setUser(refreshedSession.user);
      return refreshedSession;
    }
    setSession(activeSession);
    setUser(activeSession.user);
    return activeSession;
  }

  async function signUp(email: string, password: string, name: string, role: string, city: string, domain: string) {
    // ── Direct Supabase auth signup — no edge function, no cold start ──
    // The DB trigger (handle_new_user) auto-creates the public.users row.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role, city, domain },
      },
    });
    if (error) throw error;
    if (!data.user) throw new Error('Account creation failed. Please try again.');

    // Send welcome + verification emails (fire and forget — never blocks signup)
    Promise.all([
      sendWelcomeEmailDirect(email, name, role),
      sendVerificationEmailDirect(data.user.id, email, name),
    ]).catch(err => console.error('Failed to send emails:', err));

    const authToken = data.session?.access_token || null;

    // Ensure profile row is created in users table immediately
    await ensureProfileRow(data.user, authToken);

    // Build profile immediately from known data — no extra API call needed
    const profile: Profile = {
      id: data.user.id,
      email,
      name,
      role,
      reputation: 0,
      bio: '',
      avatar: '',
      createdAt: new Date().toISOString(),
      city,
      domain,
      emailVerified: !!data.user.email_confirmed_at,
    };
    setProfile(profile);

    // Sync full profile from DB in background once trigger fires
    setTimeout(() => loadProfile(data.user!.id).catch(() => {}), 1500);

    return { profile, token: authToken };
  }


  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.user) {
      await ensureProfileRow(data.user, data.session?.access_token || null);
      const profile = await loadProfile(data.user.id);
      return { profile, token: data.session?.access_token || null };
    }
    return { profile: null, token: data.session?.access_token || null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
  }

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, token, signUp, signIn, signOut, refreshProfile, ensureValidSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export async function sendVerificationEmailDirect(userId: string, email: string, name: string) {
  const { data, error } = await supabase.functions.invoke('send-verification-email', {
    body: { user_id: userId, email, name }
  });

  if (error) {
    console.error('Failed to call send-verification-email edge function:', error);
    throw new Error('Failed to dispatch verification email via Edge Function.');
  }
}

export async function sendWelcomeEmailDirect(email: string, name: string, role: string) {
  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer re_bxj3KLqG_nh6hxq34aHSK7UbWhLZA9FPr',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Patchwork <welcome@joinpatchwork.xyz>',
      to: email,
      subject: 'Welcome to Patchwork! 🎉',
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="font-size: 24px; font-weight: 800; color: #6C5CE7; margin-bottom: 8px;">
              patchwork
            </div>
            <h1 style="font-size: 32px; font-weight: 800; color: #1a1a1a; margin: 0;">
              Welcome to Patchwork!
            </h1>
            <p style="font-size: 18px; color: #4a5568; margin-top: 8px;">
              Hi ${name}, thanks for joining!
            </p>
          </div>

          <div style="background: linear-gradient(135deg, #6C5CE7 0%, #8B7CF8 100%); border-radius: 16px; padding: 24px; color: white; margin-bottom: 32px;">
            <h2 style="font-size: 20px; font-weight: 700; margin: 0 0 8px 0;">
              You're part of the founding cohort!
            </h2>
            <p style="font-size: 16px; margin: 0; opacity: 0.9;">
              As a ${role === 'observer' ? 'observer' : 'builder'}, you're helping us build the future of transparent, collaborative product development.
            </p>
          </div>

          <div style="background: #f7fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <h3 style="font-size: 16px; font-weight: 600; color: #1a1a1a; margin-top: 0;">
              What's next?
            </h3>
            <ul style="margin: 16px 0 0 0; padding-left: 20px; color: #4a5568;">
              <li style="margin-bottom: 8px;">${role === 'observer' ? 'Explore live rooms and give feedback' : 'Create your first build room'}</li>
              <li style="margin-bottom: 8px;">Join the community</li>
              <li>Start sharing your work!</li>
            </ul>
          </div>

          <div style="text-align: center; margin-top: 32px;">
            <p style="font-size: 14px; color: #718096; margin: 0;">
              Check out <a href="https://joinpatchwork.xyz" style="color: #6C5CE7; text-decoration: none;">joinpatchwork.xyz</a> to get started!
            </p>
            <p style="font-size: 14px; color: #718096; margin: 8px 0 0 0;">
              If you have any questions, reply to this email!
            </p>
            <p style="font-size: 14px; color: #718096; margin: 8px 0 0 0;">
              — The Patchwork Team
            </p>
          </div>
        </div>
      `
    })
  });

  if (!resendRes.ok) {
    const errorText = await resendRes.text();
    console.error('Resend direct welcome call failed:', errorText);
  }
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
