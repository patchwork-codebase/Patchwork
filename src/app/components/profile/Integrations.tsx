import { useEffect, useState } from 'react';
import { supabase } from '../auth/AuthContext';
import { useGithubAccount } from '../../hooks/useGithub';
import { useLinkedinAccount } from '../../hooks/useLinkedin';
import { useLinearAccount } from '../../hooks/useLinear';
import { useNotionAccount } from '../../hooks/useNotion';
import { Link as LinkIcon, Check, Loader2, Linkedin, Zap, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function Integrations({ userId }: { userId: string }) {
  const { data: githubAccount, isLoading: githubLoading, refetch: refetchGithub } = useGithubAccount(userId);
  const { data: linkedinAccount, isLoading: linkedinLoading, refetch: refetchLinkedin } = useLinkedinAccount(userId);
  const { data: linearAccount, isLoading: linearLoading, refetch: refetchLinear } = useLinearAccount(userId);
  const { data: notionAccount, isLoading: notionLoading, refetch: refetchNotion } = useNotionAccount(userId);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [linearPAT, setLinearPAT] = useState('');

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
              access_token_encrypted: session.provider_token
            }, { onConflict: 'user_id' });
            
            toast.success("GitHub account connected successfully!");
            refetchGithub();
          } catch (err: any) {
            console.error("Failed to store github account", err);
          }
        }

        const linkedinIdentity = session.user.identities?.find(i => i.provider === 'linkedin_oidc');
        if (linkedinIdentity && !linkedinAccount) {
          try {
            await supabase.from('linkedin_accounts').upsert({
              user_id: session.user.id,
              linkedin_user_id: linkedinIdentity.id,
              access_token: session.provider_token
            }, { onConflict: 'user_id' });
            
            toast.success("LinkedIn account connected successfully!");
            refetchLinkedin();
          } catch (err: any) {
            console.error("Failed to store linkedin account", err);
          }
        }

        const notionIdentity = session.user.identities?.find(i => i.provider === 'notion');
        if (notionIdentity && !notionAccount) {
          try {
            await supabase.from('notion_accounts').upsert({
              user_id: session.user.id,
              access_token: session.provider_token,
              workspace_name: 'Notion Workspace', // Default, would ideally fetch from API
            }, { onConflict: 'user_id' });
            
            toast.success("Notion account connected successfully!");
            refetchNotion();
          } catch (err: any) {
            console.error("Failed to store notion account", err);
          }
        }
      }
    };

    handleOAuthRedirect();
  }, [githubAccount, refetchGithub, linkedinAccount, refetchLinkedin]);

  const handleConnectGithub = async () => {
    setConnecting('github');
    try {
      const { error } = await supabase.auth.linkIdentity({
        provider: 'github',
        options: {
          scopes: 'repo',
          redirectTo: `${window.location.origin}/dashboard/profile/${userId}`,
        }
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(`Failed to connect GitHub: ${err.message}`);
      setConnecting(null);
    }
  };

  const handleConnectLinkedin = async () => {
    setConnecting('linkedin');
    try {
      const { error } = await supabase.auth.linkIdentity({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: `${window.location.origin}/dashboard/profile/${userId}`,
        }
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(`Failed to connect LinkedIn: ${err.message}`);
      setConnecting(null);
    }
  };

  const handleConnectNotion = async () => {
    setConnecting('notion');
    try {
      const { error } = await supabase.auth.linkIdentity({
        provider: 'notion',
        options: {
          redirectTo: `${window.location.origin}/dashboard/profile/${userId}`,
        }
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(`Failed to connect Notion: ${err.message}`);
      setConnecting(null);
    }
  };

  const handleSaveLinear = async () => {
    if (!linearPAT.trim()) return;
    setConnecting('linear');
    try {
      const { error } = await supabase.from('linear_accounts').upsert({
        user_id: userId,
        access_token: linearPAT.trim()
      }, { onConflict: 'user_id' });
      
      if (error) throw error;
      toast.success("Linear Personal Access Token saved!");
      refetchLinear();
      setLinearPAT('');
    } catch (err: any) {
      toast.error(`Failed to save Linear token: ${err.message}`);
    } finally {
      setConnecting(null);
    }
  };

  if (githubLoading || linkedinLoading || linearLoading || notionLoading) return null;

  return (
    <div className="mb-10 bg-white/[0.02] border border-white/[0.06] rounded-[24px] p-6 backdrop-blur-sm">
      <h2 className="text-[18px] font-extrabold text-white mb-6 font-display">Integrations</h2>
      
      <div className="flex flex-col gap-4">
        {/* GitHub Integration */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] hover:bg-white/[0.04] transition-colors rounded-2xl gap-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-[#24292e] text-white rounded-xl flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(36,41,46,0.5)]">
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
            </div>
            <div className="flex flex-col">
              <h3 className="text-[15px] font-bold text-white mb-0.5">GitHub</h3>
              <p className="text-[13px] text-slate-400 font-medium leading-relaxed">Link repositories to sync commits as draft updates.</p>
              {githubAccount && (
                <span className="text-[13px] font-bold text-slate-300 mt-1.5 flex items-center gap-1.5">
                  @{githubAccount.github_username}
                </span>
              )}
            </div>
          </div>

          <div className="flex sm:shrink-0 mt-2 sm:mt-0">
            {githubAccount ? (
              <span className="flex items-center justify-center w-full sm:w-auto gap-1.5 text-[12px] font-bold text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20">
                <Check className="w-3.5 h-3.5" /> Connected
              </span>
            ) : (
              <button
                onClick={handleConnectGithub}
                disabled={connecting !== null}
                className="flex items-center justify-center w-full sm:w-auto gap-2 px-5 py-2.5 bg-white/5 text-white text-[13px] font-bold rounded-full border border-white/10 hover:bg-white/10 transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8]"
              >
                {connecting === 'github' ? <Loader2 className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
                Connect
              </button>
            )}
          </div>
        </div>

        {/* LinkedIn Integration */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] hover:bg-white/[0.04] transition-colors rounded-2xl gap-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-[#0077b5] text-white rounded-xl flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(0,119,181,0.5)]">
              <Linkedin className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-[15px] font-bold text-white mb-0.5">LinkedIn</h3>
              <p className="text-[13px] text-slate-400 font-medium leading-relaxed">Share your Build Log milestones directly to LinkedIn.</p>
            </div>
          </div>

          <div className="flex sm:shrink-0 mt-2 sm:mt-0">
            {linkedinAccount ? (
              <span className="flex items-center justify-center w-full sm:w-auto gap-1.5 text-[12px] font-bold text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20">
                <Check className="w-3.5 h-3.5" /> Connected
              </span>
            ) : (
              <button
                onClick={handleConnectLinkedin}
                disabled={connecting !== null}
                className="flex items-center justify-center w-full sm:w-auto gap-2 px-5 py-2.5 bg-white/5 text-white text-[13px] font-bold rounded-full border border-white/10 hover:bg-white/10 transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8]"
              >
                {connecting === 'linkedin' ? <Loader2 className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
                Connect
              </button>
            )}
          </div>
        </div>

        {/* Linear Integration */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] hover:bg-white/[0.04] transition-colors rounded-2xl gap-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-[#5E6AD2] text-white rounded-xl flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(94,106,210,0.5)]">
              <Zap className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-[15px] font-bold text-white mb-0.5">Linear</h3>
              <p className="text-[13px] text-slate-400 font-medium leading-relaxed mb-2">Sync your issues directly as room milestones.</p>
              
              {!linearAccount && (
                <div className="flex items-center gap-2 max-w-[300px]">
                  <input
                    type="password"
                    value={linearPAT}
                    onChange={(e) => setLinearPAT(e.target.value)}
                    placeholder="Personal Access Token"
                    className="w-full bg-[#1A1820] border border-white/[0.08] rounded-xl px-3 py-1.5 text-[13px] text-white placeholder-slate-500 focus:outline-none focus:border-[#5E6AD2] transition-colors"
                  />
                  <button
                    onClick={handleSaveLinear}
                    disabled={connecting === 'linear' || !linearPAT.trim()}
                    className="px-3 py-1.5 bg-[#5E6AD2] hover:bg-[#4d57ba] disabled:opacity-50 text-white text-[12px] font-bold rounded-xl transition-colors shrink-0"
                  >
                    {connecting === 'linear' ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex sm:shrink-0 mt-2 sm:mt-0 items-start">
            {linearAccount && (
              <span className="flex items-center justify-center w-full sm:w-auto gap-1.5 text-[12px] font-bold text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20">
                <Check className="w-3.5 h-3.5" /> Connected
              </span>
            )}
          </div>
        </div>

        {/* Notion Integration */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] hover:bg-white/[0.04] transition-colors rounded-2xl gap-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(255,255,255,0.2)]">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-[15px] font-bold text-white mb-0.5">Notion</h3>
              <p className="text-[13px] text-slate-400 font-medium leading-relaxed">Link your workspace to attach live documents to rooms.</p>
              {notionAccount && (
                <span className="text-[13px] font-bold text-slate-300 mt-1.5 flex items-center gap-1.5">
                  {notionAccount.workspace_name || 'Workspace Connected'}
                </span>
              )}
            </div>
          </div>

          <div className="flex sm:shrink-0 mt-2 sm:mt-0">
            {notionAccount ? (
              <span className="flex items-center justify-center w-full sm:w-auto gap-1.5 text-[12px] font-bold text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20">
                <Check className="w-3.5 h-3.5" /> Connected
              </span>
            ) : (
              <button
                onClick={handleConnectNotion}
                disabled={connecting !== null}
                className="flex items-center justify-center w-full sm:w-auto gap-2 px-5 py-2.5 bg-white/5 text-white text-[13px] font-bold rounded-full border border-white/10 hover:bg-white/10 transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8]"
              >
                {connecting === 'notion' ? <Loader2 className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
                Connect
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
