import { useEffect, useState, useRef } from 'react';
import { supabase } from '../auth/AuthContext';
import { useGithubAccount } from '../../hooks/useGithub';
import { useLinkedinAccount } from '../../hooks/useLinkedin';
import { useLinearAccount } from '../../hooks/useLinear';
import { useNotionAccount } from '../../hooks/useNotion';
import { useClickupAccount } from '../../hooks/useClickup';
import { useJiraAccount } from '../../hooks/useJira';
import { Check, Loader2, ExternalLink, Unlink } from 'lucide-react';
import { toast } from 'sonner';

interface IntegrationCardProps {
  icon: React.ReactNode;
  name: string;
  description: string;
  connectedLabel?: string;
  isConnected: boolean;
  isLoading: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  accentColor: string;
  bgColor: string;
  children?: React.ReactNode;
}

function IntegrationCard({
  icon,
  name,
  description,
  connectedLabel,
  isConnected,
  isLoading,
  onConnect,
  onDisconnect,
  accentColor,
  bgColor,
  children,
}: IntegrationCardProps) {
  return (
    <div
      className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5 p-5 rounded-2xl border transition-all duration-200"
      style={{
        background: isConnected ? `${bgColor}18` : '#fff',
        borderColor: isConnected ? `${accentColor}40` : '#e2e8f0',
        boxShadow: isConnected ? `0 0 0 1px ${accentColor}20` : 'none',
      }}
    >
      {/* Status dot */}
      <span
        className="absolute top-4 right-4 w-2 h-2 rounded-full"
        style={{ background: isConnected ? '#22c55e' : '#cbd5e1' }}
      />

      <div className="flex items-start gap-4 flex-1 min-w-0">
        {/* Icon */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
          style={{ background: bgColor }}
        >
          {icon}
        </div>

        {/* Text */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-[14px] font-bold text-slate-900">{name}</h3>
            {isConnected && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: `${accentColor}18`, color: accentColor }}
              >
                Connected
              </span>
            )}
          </div>
          <p className="text-[12.5px] text-slate-500 font-medium leading-relaxed">{description}</p>
          {isConnected && connectedLabel && (
            <span className="mt-1.5 text-[12px] font-semibold text-slate-600 flex items-center gap-1.5">
              <span
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{ background: accentColor }}
              />
              {connectedLabel}
            </span>
          )}
          {children}
        </div>
      </div>

      {/* Action button */}
      <div className="sm:shrink-0">
        {isConnected ? (
          <button
            onClick={onDisconnect}
            disabled={isLoading}
            className="group flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold transition-all duration-150 border disabled:opacity-50"
            style={{
              color: '#64748b',
              background: '#f8fafc',
              borderColor: '#e2e8f0',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.color = '#dc2626';
              (e.currentTarget as HTMLButtonElement).style.background = '#fef2f2';
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#fecaca';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.color = '#64748b';
              (e.currentTarget as HTMLButtonElement).style.background = '#f8fafc';
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#e2e8f0';
            }}
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <Unlink className="w-3.5 h-3.5" />
                Disconnect
              </>
            )}
          </button>
        ) : (
          <button
            onClick={onConnect}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold transition-all duration-150 border disabled:opacity-50"
            style={{
              color: accentColor,
              background: `${accentColor}10`,
              borderColor: `${accentColor}30`,
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = `${accentColor}20`;
              (e.currentTarget as HTMLButtonElement).style.borderColor = `${accentColor}50`;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = `${accentColor}10`;
              (e.currentTarget as HTMLButtonElement).style.borderColor = `${accentColor}30`;
            }}
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <ExternalLink className="w-3.5 h-3.5" />
                Connect
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default function Integrations({ userId }: { userId: string }) {
  const { data: githubAccount, isLoading: githubLoading, refetch: refetchGithub } = useGithubAccount(userId);
  const { data: linkedinAccount, isLoading: linkedinLoading, refetch: refetchLinkedin } = useLinkedinAccount(userId);
  const { data: linearAccount, isLoading: linearLoading, refetch: refetchLinear } = useLinearAccount(userId);
  const { data: notionAccount, isLoading: notionLoading, refetch: refetchNotion } = useNotionAccount(userId);
  const { data: clickupAccount, isLoading: clickupLoading, refetch: refetchClickup } = useClickupAccount(userId);
  const { data: jiraAccount, isLoading: jiraLoading, refetch: refetchJira } = useJiraAccount(userId);
  
  const [connecting, setConnecting] = useState<string | null>(null);
  const [linearPAT, setLinearPAT] = useState('');
  const [notionSecret, setNotionSecret] = useState('');
  const [clickupPAT, setClickupPAT] = useState('');
  const [jiraPAT, setJiraPAT] = useState('');
  const [jiraDomain, setJiraDomain] = useState('');
  const [jiraEmail, setJiraEmail] = useState('');
  const hasProcessedOAuth = useRef(false);

  useEffect(() => {
    const handleOAuthRedirect = async () => {
      if (hasProcessedOAuth.current) return;
      hasProcessedOAuth.current = true;

      const { data: { session } } = await supabase.auth.getSession();
      const storedToken = sessionStorage.getItem('oauth_provider_token');
      const intendedUserId = sessionStorage.getItem('oauth_intended_user_id');
      const providerToken = session?.provider_token || storedToken;

      if (!providerToken || !session?.user) return;

      // Detect account mismatch: OAuth brought back a different user
      if (intendedUserId && session.user.id !== intendedUserId) {
        sessionStorage.setItem(`oauth_provider_token_for_${intendedUserId}`, providerToken);
        sessionStorage.removeItem('oauth_provider_token');
        sessionStorage.removeItem('oauth_intended_user_id');
        await supabase.auth.signOut();
        toast.error('A different account was returned. Please log back in — your connection token has been saved and will apply automatically.');
        return;
      }

      const savedToken = sessionStorage.getItem(`oauth_provider_token_for_${session.user.id}`);
      const effectiveToken = savedToken || providerToken;
      if (savedToken) sessionStorage.removeItem(`oauth_provider_token_for_${session.user.id}`);
      if (storedToken) sessionStorage.removeItem('oauth_provider_token');
      if (intendedUserId) sessionStorage.removeItem('oauth_intended_user_id');

      const githubIdentity = session.user.identities?.find(i => i.provider === 'github');
      if (githubIdentity && !githubAccount) {
        try {
          await supabase.from('github_accounts').upsert({
            user_id: session.user.id,
            github_user_id: githubIdentity.id,
            github_username: githubIdentity.identity_data?.preferred_username || githubIdentity.identity_data?.user_name || 'github_user',
            access_token_encrypted: effectiveToken,
          }, { onConflict: 'user_id' });
          toast.success('GitHub connected!');
          refetchGithub();
        } catch (err: unknown) {
          console.error('Failed to store github account', err);
        }
      }

      const linkedinIdentity = session.user.identities?.find(i => i.provider === 'linkedin_oidc');
      if (linkedinIdentity && !linkedinAccount) {
        try {
          await supabase.from('linkedin_accounts').upsert({
            user_id: session.user.id,
            linkedin_user_id: linkedinIdentity.id,
            access_token: effectiveToken,
          }, { onConflict: 'user_id' });
          toast.success('LinkedIn connected!');
          refetchLinkedin();
        } catch (err: unknown) {
          console.error('Failed to store linkedin account', err);
        }
      }

      const notionIdentity = session.user.identities?.find(i => i.provider === 'notion');
      if (notionIdentity && !notionAccount) {
        try {
          await supabase.from('notion_accounts').upsert({
            user_id: session.user.id,
            access_token: effectiveToken,
            workspace_name: 'Notion Workspace',
          }, { onConflict: 'user_id' });
          toast.success('Notion connected!');
          refetchNotion();
        } catch (err: unknown) {
          console.error('Failed to store notion account', err);
        }
      }
    };

    handleOAuthRedirect();
  }, [githubAccount, refetchGithub, linkedinAccount, refetchLinkedin, notionAccount, refetchNotion]);

  const handleConnectOAuth = async (provider: 'github' | 'linkedin_oidc' | 'notion', scopes?: string) => {
    setConnecting(provider === 'linkedin_oidc' ? 'linkedin' : provider);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not logged in');

      sessionStorage.setItem('oauth_intended_user_id', session.user.id);
      sessionStorage.setItem('oauth_return_to', window.location.pathname);

      const options: any = { redirectTo: window.location.origin };
      if (scopes) options.scopes = scopes;

      const { error } = await supabase.auth.signInWithOAuth({ provider, options });
      if (error) throw error;
    } catch (err: unknown) {
      const name = provider === 'linkedin_oidc' ? 'LinkedIn' : provider.charAt(0).toUpperCase() + provider.slice(1);
      toast.error(`Could not connect ${name}. Please try again.`);
      setConnecting(null);
    }
  };

  const handleDisconnect = async (provider: 'github' | 'linkedin' | 'linear' | 'notion' | 'clickup' | 'jira') => {
    setConnecting(provider);
    try {
      const tableMap: Record<string, string> = {
        github: 'github_accounts',
        linkedin: 'linkedin_accounts',
        linear: 'linear_accounts',
        notion: 'notion_accounts',
        clickup: 'clickup_accounts',
        jira: 'jira_accounts',
      };
      const { error, data } = await supabase.from(tableMap[provider]).delete().eq('user_id', userId).select();
      if (error) throw error;
      if (!data || data.length === 0) throw new Error('Record not found.');

      toast.success(`${provider.charAt(0).toUpperCase() + provider.slice(1)} disconnected.`);
      if (provider === 'github') refetchGithub();
      else if (provider === 'linkedin') refetchLinkedin();
      else if (provider === 'linear') refetchLinear();
      else if (provider === 'notion') refetchNotion();
      else if (provider === 'clickup') refetchClickup();
      else if (provider === 'jira') refetchJira();
    } catch (err: unknown) {
      toast.error(`Failed to disconnect: ${(err instanceof Error ? err.message : String(err))}`);
    } finally {
      setConnecting(null);
    }
  };

  const handleSaveLinear = async () => {
    if (!linearPAT.trim()) return;
    setConnecting('linear');
    try {
      const { error } = await supabase.from('linear_accounts').upsert({
        user_id: userId,
        access_token: linearPAT.trim(),
      }, { onConflict: 'user_id' });
      if (error) throw error;
      toast.success('Linear token saved!');
      refetchLinear();
      setLinearPAT('');
    } catch (err: unknown) {
      toast.error(`Failed to save: ${(err instanceof Error ? err.message : String(err))}`);
    } finally {
      setConnecting(null);
    }
  };

  const handleSaveNotion = async () => {
    if (!notionSecret.trim()) return;
    setConnecting('notion');
    try {
      const { error } = await supabase.from('notion_accounts').upsert({
        user_id: userId,
        access_token: notionSecret.trim(),
        workspace_name: 'Notion Workspace',
      }, { onConflict: 'user_id' });
      if (error) throw error;
      toast.success('Notion integration saved!');
      refetchNotion();
      setNotionSecret('');
    } catch (err: unknown) {
      toast.error(`Failed to save: ${(err instanceof Error ? err.message : String(err))}`);
    } finally {
      setConnecting(null);
    }
  };

  const handleSaveClickup = async () => {
    if (!clickupPAT.trim()) return;
    setConnecting('clickup');
    try {
      const { error } = await supabase.from('clickup_accounts').upsert({
        user_id: userId,
        access_token: clickupPAT.trim(),
      }, { onConflict: 'user_id' });
      if (error) throw error;
      toast.success('ClickUp connected!');
      refetchClickup();
      setClickupPAT('');
    } catch (err: unknown) {
      toast.error(`Failed to save: ${(err instanceof Error ? err.message : String(err))}`);
    } finally {
      setConnecting(null);
    }
  };

  const handleSaveJira = async () => {
    if (!jiraPAT.trim() || !jiraDomain.trim() || !jiraEmail.trim()) {
      toast.error('Please fill in all Jira fields');
      return;
    }
    setConnecting('jira');
    try {
      const { error } = await supabase.from('jira_accounts').upsert({
        user_id: userId,
        access_token: jiraPAT.trim(),
        jira_domain: jiraDomain.trim(),
        email: jiraEmail.trim(),
      }, { onConflict: 'user_id' });
      if (error) throw error;
      toast.success('Jira connected!');
      refetchJira();
      setJiraPAT('');
      setJiraDomain('');
      setJiraEmail('');
    } catch (err: unknown) {
      toast.error(`Failed to save: ${(err instanceof Error ? err.message : String(err))}`);
    } finally {
      setConnecting(null);
    }
  };

  if (githubLoading || linkedinLoading || linearLoading || notionLoading || clickupLoading || jiraLoading) return null;

  const connectedCount = [githubAccount, linkedinAccount, linearAccount, notionAccount, clickupAccount, jiraAccount].filter(Boolean).length;

  return (
    <div className="mb-10 bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[17px] font-extrabold text-slate-900 font-display">Integrations</h2>
          <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-0.5">
            {connectedCount} of 4 connected
          </p>
        </div>
        {/* Progress bar */}
        <div className="flex items-center gap-1.5">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              className="h-1.5 w-6 rounded-full transition-all duration-300"
              style={{ background: i < connectedCount ? '#8B7CF8' : '#e2e8f0' }}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {/* GitHub */}
        <IntegrationCard
          name="GitHub"
          description="Sync commits and repositories as draft updates."
          connectedLabel={githubAccount ? `@${githubAccount.github_username}` : undefined}
          isConnected={!!githubAccount}
          isLoading={connecting === 'github'}
          onConnect={() => handleConnectOAuth('github', 'repo')}
          onDisconnect={() => handleDisconnect('github')}
          accentColor="#24292e"
          bgColor="#24292e"
          icon={
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
              <path d="M9 18c-4.51 2-5-2-7-2"/>
            </svg>
          }
        />

        {/* LinkedIn */}
        <IntegrationCard
          name="LinkedIn"
          description="Share your Build Log milestones to your network."
          isConnected={!!linkedinAccount}
          isLoading={connecting === 'linkedin'}
          onConnect={() => handleConnectOAuth('linkedin_oidc')}
          onDisconnect={() => handleDisconnect('linkedin')}
          accentColor="#0077b5"
          bgColor="#0077b5"
          icon={
            <svg viewBox="0 0 24 24" width="18" height="18" fill="white">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
              <rect width="4" height="12" x="2" y="9"/>
              <circle cx="4" cy="4" r="2"/>
            </svg>
          }
        />

        {/* Linear */}
        <IntegrationCard
          name="Linear"
          description="Sync issues directly as room milestones."
          isConnected={!!linearAccount}
          isLoading={connecting === 'linear'}
          onConnect={() => {}}
          onDisconnect={() => handleDisconnect('linear')}
          accentColor="#5E6AD2"
          bgColor="#5E6AD2"
          icon={
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          }
        >
          {!linearAccount && (
            <div className="flex items-center gap-2 mt-2 max-w-[280px]">
              <input
                type="password"
                value={linearPAT}
                onChange={e => setLinearPAT(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveLinear()}
                placeholder="Personal Access Token"
                className="flex-1 bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 text-[12px] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#5E6AD2] focus:ring-1 focus:ring-[#5E6AD2] transition-all shadow-sm dark:shadow-none"
              />
              <button
                onClick={handleSaveLinear}
                disabled={connecting === 'linear' || !linearPAT.trim()}
                className="px-3 py-1.5 bg-[#5E6AD2] hover:bg-[#4d57ba] disabled:opacity-40 text-slate-900 dark:text-white text-[11px] font-bold rounded-lg transition-colors shrink-0"
              >
                {connecting === 'linear' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
              </button>
            </div>
          )}
        </IntegrationCard>

        {/* Notion */}
        <IntegrationCard
          name="Notion"
          description="Attach live workspace documents to your rooms."
          connectedLabel={notionAccount?.workspace_name || 'Workspace connected'}
          isConnected={!!notionAccount}
          isLoading={connecting === 'notion'}
          onConnect={() => {}}
          onDisconnect={() => handleDisconnect('notion')}
          accentColor="#6B6B6B"
          bgColor="#1a1a1a"
          icon={
            <svg viewBox="0 0 24 24" width="18" height="18" fill="white">
              <path d="M4 4h16v2H4zM4 11h10v2H4zM4 18h10v2H4zM16 11l4 3.5L16 18v-7z"/>
            </svg>
          }
        >
          {!notionAccount && (
            <div className="flex items-center gap-2 mt-2 max-w-[280px]">
              <input
                type="password"
                value={notionSecret}
                onChange={e => setNotionSecret(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveNotion()}
                placeholder="Integration Secret"
                className="flex-1 bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 text-[12px] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all shadow-sm dark:shadow-none"
              />
              <button
                onClick={handleSaveNotion}
                disabled={connecting === 'notion' || !notionSecret.trim()}
                className="px-3 py-1.5 bg-slate-50 dark:bg-[#1a1a1a] hover:bg-[#333333] disabled:opacity-40 text-slate-900 dark:text-white text-[11px] font-bold rounded-lg transition-colors shrink-0"
              >
                {connecting === 'notion' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
              </button>
            </div>
          )}
        </IntegrationCard>

        {/* ClickUp */}
        <IntegrationCard
          name="ClickUp"
          description="Sync ClickUp tasks directly as room milestones."
          isConnected={!!clickupAccount}
          isLoading={connecting === 'clickup'}
          onConnect={() => {}}
          onDisconnect={() => handleDisconnect('clickup')}
          accentColor="#7B68EE"
          bgColor="#7B68EE"
          icon={
            <svg viewBox="0 0 24 24" width="18" height="18" fill="white">
              <path d="M12.062 1.488L21.43 6.906a1.182 1.182 0 0 1 .562.973v10.828a1.182 1.182 0 0 1-.562.973l-9.368 5.418a1.182 1.182 0 0 1-1.124 0l-9.368-5.418a1.182 1.182 0 0 1-.562-.973V7.88a1.182 1.182 0 0 1 .562-.973l9.368-5.418a1.182 1.182 0 0 1 1.124 0zM12 5L5 9v8l7 4 7-4V9l-7-4z"/>
            </svg>
          }
        >
          {!clickupAccount && (
            <div className="flex items-center gap-2 mt-2 max-w-[280px]">
              <input
                type="password"
                value={clickupPAT}
                onChange={e => setClickupPAT(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveClickup()}
                placeholder="Personal Access Token"
                className="flex-1 bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 text-[12px] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#7B68EE] focus:ring-1 focus:ring-[#7B68EE] transition-all shadow-sm dark:shadow-none"
              />
              <button
                onClick={handleSaveClickup}
                disabled={connecting === 'clickup' || !clickupPAT.trim()}
                className="px-3 py-1.5 bg-[#7B68EE] hover:bg-[#6A5AE0] disabled:opacity-40 text-slate-900 dark:text-white text-[11px] font-bold rounded-lg transition-colors shrink-0"
              >
                {connecting === 'clickup' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
              </button>
            </div>
          )}
        </IntegrationCard>

        {/* Jira */}
        <IntegrationCard
          name="Jira"
          description="Sync Jira issues directly as room milestones."
          isConnected={!!jiraAccount}
          isLoading={connecting === 'jira'}
          onConnect={() => {}}
          onDisconnect={() => handleDisconnect('jira')}
          accentColor="#0052CC"
          bgColor="#0052CC"
          icon={
            <svg viewBox="0 0 24 24" width="18" height="18" fill="white">
              <path d="M11.5 13.5v-10l5 5-5 5zm-7 7v-10l5 5-5 5zM22 13.5l-5-5-5 5 5 5 5-5z"/>
            </svg>
          }
        >
          {!jiraAccount && (
            <div className="flex flex-col gap-2 mt-2 max-w-[320px]">
              <input
                type="text"
                value={jiraDomain}
                onChange={e => setJiraDomain(e.target.value)}
                placeholder="Domain (e.g. your-company.atlassian.net)"
                className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 text-[12px] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC] transition-all shadow-sm dark:shadow-none"
              />
              <input
                type="email"
                value={jiraEmail}
                onChange={e => setJiraEmail(e.target.value)}
                placeholder="Jira Email"
                className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 text-[12px] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC] transition-all shadow-sm dark:shadow-none"
              />
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={jiraPAT}
                  onChange={e => setJiraPAT(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveJira()}
                  placeholder="Personal Access Token"
                  className="flex-1 bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 text-[12px] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC] transition-all shadow-sm dark:shadow-none"
                />
                <button
                  onClick={handleSaveJira}
                  disabled={connecting === 'jira' || !jiraPAT.trim() || !jiraDomain.trim() || !jiraEmail.trim()}
                  className="px-3 py-1.5 bg-[#0052CC] hover:bg-[#0043A6] disabled:opacity-40 text-slate-900 dark:text-white text-[11px] font-bold rounded-lg transition-colors shrink-0"
                >
                  {connecting === 'jira' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                </button>
              </div>
            </div>
          )}
        </IntegrationCard>
      </div>
    </div>
  );
}
