import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createClient, User, Session } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "/utils/supabase/info";

const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

export { supabase };

// Temporary development flag to bypass auth gate. Set to false to restore normal behavior.
export const DEV_AUTH_BYPASS = true;

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-30db7d9e`;

export async function apiCall(path: string, opts: RequestInit = {}, token?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token || publicAnonKey}`,
    ...(opts.headers as Record<string, string> || {}),
  };
  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
  reputation: number;
  bio: string;
  avatar: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  token: string | null;
  signIn: (email: string, password: string) => Promise<void>;
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

  async function loadProfile(userId: string) {
    try {
      const p = await apiCall(`/users/${userId}`);
      setProfile(p);
      return p as Profile;
    } catch (err) {
      console.log("Could not load profile:", err);
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
      } else if (DEV_AUTH_BYPASS) {
        const mockUser = { id: 'dev-user-1', email: 'dev@local' } as unknown as User;
        setUser(mockUser);
        setProfile({
          id: mockUser.id,
          name: 'Developer',
          email: mockUser.email || 'dev@local',
          role: 'builder',
          reputation: 999,
          bio: 'Bypassed auth for development',
          avatar: '',
          createdAt: new Date().toISOString(),
        });
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      else {
        if (DEV_AUTH_BYPASS) {
          const mockUser = { id: 'dev-user-1', email: 'dev@local' } as unknown as User;
          setUser(mockUser);
          setProfile({
            id: mockUser.id,
            name: 'Developer',
            email: mockUser.email || 'dev@local',
            role: 'builder',
            reputation: 999,
            bio: 'Bypassed auth for development',
            avatar: '',
            createdAt: new Date().toISOString(),
          });
        } else {
          setProfile(null);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.user) {
      const profile = await loadProfile(data.user.id);
      return profile;
    }
    return null;
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
  }

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, token, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
