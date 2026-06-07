import { useEffect, useState } from 'react';
import { supabase } from '../auth/AuthContext';
import { useGithubAccount } from '../../hooks/useGithub';
import { Link as LinkIcon, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Integrations({ userId }: { userId: string }) {
  const { data: githubAccount, isLoading, refetch } = useGithubAccount(userId);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    const handleOAuthRedirect = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.provider_token && session.user) {
        const githubIdentity = session.user.identities?.find(i => i.provider === 'github');
        if (githubIdentity && !githubAccount) {
          try {
            await supabase.from('github_accounts').upsert({
              user_id: session.user.id,
              github_user_id: githubIdentity.id,
              github_username: githubIdentity.identity_data?.preferred_username || githubIdentity.identity_data?.user_name || 'github_user',
              access_token_encrypted: session.provider_token // MVP: storing directly
            }, { onConflict: 'user_id' });
            
            toast.success("GitHub account connected successfully!");
            refetch();
          } catch (err: any) {
            console.error("Failed to store github account", err);
          }
        }
      }
    };

    handleOAuthRedirect();
  }, [githubAccount, refetch]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const { error } = await supabase.auth.linkIdentity({
        provider: 'github',
        options: {
          scopes: 'repo',
          redirectTo: `${window.location.origin}/dashboard/profile/${userId}`,
        }
      });
      if (error) throw error;
      // Redirects to GitHub automatically
    } catch (err: any) {
      toast.error(`Failed to connect GitHub: ${err.message}`);
      setConnecting(false);
    }
  };

  if (isLoading) return null;

  return (
    <div className="mb-10 bg-white/[0.02] border border-white/[0.06] rounded-[24px] p-6 backdrop-blur-sm">
      <h2 className="text-[18px] font-extrabold text-white mb-6 font-display">Integrations</h2>
      
      <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#24292e] text-white rounded-xl flex items-center justify-center">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-github"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-white mb-1">GitHub</h3>
            <p className="text-[13px] text-slate-400 font-medium">Link repositories to sync commits as draft updates.</p>
          </div>
        </div>

        {githubAccount ? (
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-bold text-slate-300">
              @{githubAccount.github_username}
            </span>
            <span className="flex items-center gap-1.5 text-[12px] font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
              <Check className="w-3 h-3" /> Connected
            </span>
          </div>
        ) : (
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#0A0910] text-[13px] font-bold rounded-full hover:bg-slate-200 transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8]"
          >
            {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
            Connect GitHub
          </button>
        )}
      </div>
    </div>
  );
}
