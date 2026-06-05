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

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-30db7d9e`;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiCall(path: string, opts: RequestInit = {}, token?: string) {
  try {
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
      name: metadata.full_name || user.email?.split('@')[0] || 'Anonymous Builder',
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
      if (!p) {
        if (session?.user?.id === userId && session.user) {
          await ensureProfileRow(session.user, token);
          const retry = await apiCall(`/users/${userId}`);
          if (retry) {
            const profile = { ...(retry as Profile), emailVerified: !!session.user.email_confirmed_at };
            setProfile(profile);
            return profile;
          }
        }
        return null;
      }
      const profile = { ...(p as Profile), emailVerified: !!session?.user?.email_confirmed_at };
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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
      fetch(`https://${projectId}.supabase.co/functions/v1/send-welcome-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, role }),
      }),
      fetch(`https://${projectId}.supabase.co/functions/v1/send-verification-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: data.user.id, email, name }),
      }),
    ]).catch(err => console.error('Failed to send emails:', err));

    const authToken = data.session?.access_token || null;

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
    <AuthContext.Provider value={{ user, session, profile, loading, token, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
