import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createClient, User, Session } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { toast } from "sonner";

const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

export { supabase };

// Temporary development flag to bypass auth gate. Set to false to restore normal behavior.
export const DEV_AUTH_BYPASS = false;

const API_BASE = window.location.origin + "/api/v1";

import { normalizeRow, registerAvatarUrl } from "../../utils/helpers";

import { Profile } from "../../types";

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
  signUp: (email: string, password: string, name: string, role: string, city: string, domain: string, gender: string, phone_country_code?: string, phone_number?: string) => Promise<SignInResult>;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithLinkedin: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  ensureValidSession: () => Promise<Session>;
  withVerification: (action: () => void) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const token = session?.access_token || null;

  const withVerification = (action: () => void) => {
    if (profile && !profile.emailVerified) {
      toast.error("Please verify your email address to perform this action.");
    } else {
      action();
    }
  };

  async function ensureProfileRow(user: User, authToken: string | null) {
    try {
      // Fetch existing profile to prevent overwriting onboarding preferences
      let existing: any = null;
      try {
        const res = await supabase.from('users').select('*').eq('id', user.id).maybeSingle();
        existing = res.data;
      } catch (e) {
        // Ignore fetch error
      }

      const metadata = (user as any).user_metadata || {};
      const payload = {
        id: user.id,
        email: user.email || '',
        name: existing?.name || metadata.name || metadata.full_name || user.email?.split('@')[0] || 'Anonymous Builder',
        role: existing?.role || metadata.role || 'builder',
        city: existing?.city || metadata.city || '',
        domain: existing?.domain || metadata.domain || '',
        interests: existing?.interests?.length ? existing.interests : (metadata.interests || []),
        gender: existing?.gender || metadata.gender || '',
        phone_country_code: existing?.phone_country_code || metadata.phone_country_code || '',
        phone_number: existing?.phone_number || metadata.phone_number || '',
        bio: existing?.bio || '',
        avatar: existing?.avatar || existing?.avatarUrl || existing?.avatar_url || '',
        avatar_url: existing?.avatar_url || existing?.avatarUrl || existing?.avatar || '',
      };

      const { error } = await supabase
        .from('users')
        .upsert(payload, { onConflict: 'id' });
      if (error) throw error;
    } catch (err) {
      console.error('Could not create or update profile row:', err);
    }
  }

  async function loadProfile(userId: string, providedAuthUser?: any) {
    try {
      const { data, error: fetchErr } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
      if (fetchErr) throw fetchErr;
      const p = data ? normalizeRow(data) : null;

      // Determine verification status.
      // Strategy: try our custom column first; if it doesn't exist (400/column error)
      // fall back to Supabase's built-in email_confirmed_at. Either being true = verified.
      let isConfirmed = false;
      try {
        let authUser = providedAuthUser;
        
        // If not provided, reliably fallback to fetching the auth user, but handle errors gracefully
        if (!authUser) {
          const { data, error: authError } = await supabase.auth.getUser();
          if (!authError) {
            authUser = data.user;
          }
        }

        // Try our custom column (only exists after the SQL migration is run)
        const { data: userRow, error: colError } = await supabase
          .from('users')
          .select('email_verified')
          .eq('id', userId)
          .maybeSingle();

        if (colError) {
          // Column doesn't exist yet — use Supabase's native signal only
          isConfirmed = !!authUser?.email_confirmed_at;
        } else {
          // Column exists — either signal being true counts
          isConfirmed = !!userRow?.email_verified || !!authUser?.email_confirmed_at;
        }
      } catch (e) {
        console.error('Failed to check email verification status:', e);
      }

      if (!p || !p.name || p.name === 'Anonymous Builder') {
        if (session?.user?.id === userId && session.user) {
          await ensureProfileRow(session.user, token);
          const { data: retryData } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
          const retry = retryData ? normalizeRow(retryData) : null;
          if (retry) {
            const profile = { ...(retry as Profile), emailVerified: isConfirmed };
            setProfile(profile);
            return profile;
          }
        }
        if (!p) return null;
      }
      const profile = { ...(p as Profile), emailVerified: isConfirmed };
      // Register this user's avatar so every getAvatarUrl(userId) call returns the real photo
      const avatarUrl = (data as any)?.avatar_url || (data as any)?.avatar;
      registerAvatarUrl(userId, avatarUrl);
      setProfile(profile);
      return profile;
    } catch (err) {
      console.error('Could not load profile:', err);
      return null;
    }
  }

  async function refreshProfile() {
    if (user) await loadProfile(user.id, user);
  }

  useEffect(() => {
    // Just to handle URL parameters for magic links/resets if needed
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const queryParams = new URLSearchParams(window.location.search);
    
    if (hashParams.has('error') || queryParams.has('error')) {
      const errorMsg = hashParams.get('error_description') || queryParams.get('error_description') || 'Authentication failed';
      console.error("[AuthContext] OAuth Error detected:", errorMsg);
            // Handle the "Multiple accounts with the same email" error specifically
        if (errorMsg.includes('Multiple accounts with the same email')) {
          toast.error("An account with this email already exists. Please sign in with your password or ensure 'Account Linking' is enabled in Supabase.");
        } else if (errorMsg.includes('Identity is already linked to another user') || errorMsg.includes('already+linked')) {
          toast.error("This account is already connected to a different Patchwork profile. Please use a different account.");
        } else {
          toast.error(decodeURIComponent(errorMsg).replace(/\+/g, ' '));
        }
    }

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
            loadProfile(session.user.id, session.user);
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
      if (currentSession?.user) {
        // Load profile for user
        await loadProfile(currentSession.user.id, currentSession.user);
      }

      setLoading(false);
    });

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        try {
          const { data: { user: refreshedUser } } = await supabase.auth.getUser();
          const { data: { session: refreshedSession } } = await supabase.auth.getSession();
          if (refreshedSession) {
            setSession(refreshedSession);
            setUser(refreshedUser ?? refreshedSession.user);
            if (refreshedUser?.id || refreshedSession.user?.id) {
              await loadProfile(refreshedUser?.id || refreshedSession.user.id, refreshedUser || refreshedSession.user);
            }
          }
        } catch (e) {
          console.error("Failed to refresh session on page visibility change:", e);
        }
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      
      if (session?.provider_token) {
        sessionStorage.setItem('oauth_provider_token', session.provider_token);
      }

      setSession(session);
      setUser(session?.user ?? null);
      
      if (event === 'SIGNED_OUT') {
        channel.postMessage('SESSION_LOGOUT');
        setProfile(null);
      } else if (event === 'SIGNED_IN') {
        channel.postMessage('SESSION_LOGIN');
        if (session?.user) {
          await loadProfile(session.user.id, session.user);
        }
      } else if (event === 'TOKEN_REFRESHED') {
        channel.postMessage('SESSION_REFRESH');
        if (session?.user) loadProfile(session.user.id, session.user);
      } else {
        if (session?.user) {
          loadProfile(session.user.id, session.user);
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

  async function signUp(email: string, password: string, name: string, role: string, city: string, domain: string, gender: string, phone_country_code?: string, phone_number?: string): Promise<SignInResult> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
          city,
          domain,
          gender,
          phone_country_code: phone_country_code || '',
          phone_number: phone_number || ''
        }
      }
    });
    if (error) throw error;
    if (!data.user) throw new Error('Account creation failed. Please try again.');

    // Send verification email (fire and forget — never blocks signup)
    sendVerificationEmailDirect(data.user.id, email, name)
      .catch(err => console.error('Failed to send verification email:', err));

    const authToken = data.session?.access_token || null;

    // Set user and session immediately to prevent router redirect loops
    setUser(data.user);
    if (data.session) setSession(data.session);

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
      gender,
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
      setUser(data.user);
      setSession(data.session);
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

  async function signInWithGoogle() {

    const redirectUrl = window.location.origin;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      }
    });
    if (error) throw error;
  }

  async function signInWithLinkedin() {

    const redirectUrl = window.location.origin;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'linkedin_oidc',
      options: {
        redirectTo: redirectUrl,
        scopes: 'openid profile email w_member_social',
      }
    });
    if (error) throw error;
  }

  async function resetPassword(email: string) {
    const { data, error } = await supabase.functions.invoke('send-password-reset-email', {
      body: { email }
    });

    if (error) {
      console.error('Failed to call send-password-reset-email edge function:', error);
      throw new Error('Failed to dispatch password reset email.');
    }
    
    if (data && data.error) {
      throw new Error(data.error);
    }
  }

  async function updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  }

  return (
    <AuthContext.Provider value={{ 
      user, session, profile, loading, token, 
      signUp, signIn, signOut, refreshProfile, ensureValidSession,
      withVerification,
      signInWithGoogle,
      signInWithLinkedin,
      resetPassword,
      updatePassword
    }}>
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
  const { error } = await supabase.functions.invoke('send-welcome-email', {
    body: { email, name, role }
  });

  if (error) {
    console.error('Failed to call send-welcome-email edge function:', error);
  }
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
