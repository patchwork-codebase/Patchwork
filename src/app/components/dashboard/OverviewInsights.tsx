import { motion } from "motion/react";
import { Link2 } from "lucide-react";
import { useAuth, supabase } from "../auth/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { LinkDocModal } from "../room/LinkDocModal";
import { getAvatarUrl } from "../../utils/helpers";

function getDomainColor(domain: string) {
  switch (domain?.toLowerCase()) {
    case 'design': return { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/20' };
    case 'growth': return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' };
    case 'product': return { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' };
    case 'engineering': return { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' };
    default: return { bg: 'bg-primary-500/10', text: 'text-primary-400', border: 'border-primary-500/20' };
  }
}

export function ObserverReactions() {
  const { user } = useAuth();
  const { data: reactions = [] } = useQuery({
    queryKey: ['overview-reactions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('reactions')
        .select('*, rooms!inner(builder_id)')
        .eq('rooms.builder_id', user.id);
      
      if (error) return [];
      return data || [];
    },
    enabled: !!user,
  });

  const sharpCount = reactions.filter((r: any) => r.type === 'sharp').length;
  const tellMeMoreCount = reactions.filter((r: any) => r.type === 'reply').length;
  const pushbackCount = reactions.filter((r: any) => r.type === 'pushback').length;
  const totalReactions = sharpCount + tellMeMoreCount + pushbackCount;
  
  const updatesWithReactions = new Set(reactions.map((r: any) => r.update_id)).size;

  const sharpPct = totalReactions > 0 ? Math.round((sharpCount / totalReactions) * 100) : 0;
  const tellMeMorePct = totalReactions > 0 ? Math.round((tellMeMoreCount / totalReactions) * 100) : 0;
  const pushbackPct = totalReactions > 0 ? Math.round((pushbackCount / totalReactions) * 100) : 0;

  return (
    <div className="bg-white border border-slate-200 rounded-[24px] p-6 sm:p-8 flex flex-col shadow-sm focus-ring w-full">
      <div className="flex flex-col gap-1.5 mb-6">
        <h3 className="font-bold text-[16px] text-slate-900 leading-tight">Observer reactions</h3>
        <span className="font-mono text-[12px] text-slate-500 leading-tight">{totalReactions} total · {updatesWithReactions} updates</span>
      </div>

      {totalReactions === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
          <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mb-3">
            <span className="text-xl">✨</span>
          </div>
          <p className="text-[14px] font-bold text-slate-900 mb-1">No reactions yet</p>
          <p className="text-[13px] text-slate-500 max-w-[200px]">Post updates and share your room to start gathering feedback.</p>
        </div>
      ) : (
        <>
          <div className="space-y-5 flex-1">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[13px] font-semibold text-slate-900 flex items-center gap-1.5">
                  <span className="text-emerald-500 text-xl leading-none -mt-1">✦</span> This is sharp
                </span>
                <span className="font-mono text-[12px] text-slate-500"><span className="text-emerald-500 font-bold">{sharpCount}</span> · {sharpPct}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${sharpPct}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[13px] font-semibold text-slate-900">
                  <span className="text-primary-400 font-bold mr-1">?</span> Tell me more
                </span>
                <span className="font-mono text-[12px] text-slate-500"><span className="text-primary-400 font-bold">{tellMeMoreCount}</span> · {tellMeMorePct}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary-400 rounded-full" style={{ width: `${tellMeMorePct}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[13px] font-semibold text-slate-900 flex items-center gap-1">
                  <svg className="text-amber-500" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11"/></svg>
                  Push back
                </span>
                <span className="font-mono text-[12px] text-slate-500"><span className="text-amber-500 font-bold">{pushbackCount}</span> · {pushbackPct}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pushbackPct}%` }} />
              </div>
            </div>
          </div>

          <div className="mt-6 bg-primary-400/10 rounded-xl p-4 border border-primary-400/20">
            <h4 className="font-mono text-[11px] text-primary-400 font-bold uppercase tracking-wider mb-2">AI Insight</h4>
            <p className="text-[13px] text-slate-600 leading-relaxed">
              Your problem-framing updates get <strong className="text-slate-900">2x more reactions</strong> than feature announcements. Post the problem before the solution.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export function TopObservers() {
  const { user } = useAuth();
  const { data: topObservers = [] } = useQuery({
    queryKey: ['top-observers', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.rpc('get_top_observers', { p_builder_id: user.id });
      if (error || !data) return [];
      
      const observerIds = data.map((o: any) => o.observer_id);
      if (observerIds.length > 0) {
        const { data: usersData } = await supabase.from('users').select('id, avatar_url').in('id', observerIds);
        if (usersData) {
          return data.map((obs: any) => {
            const match = usersData.find((u: any) => u.id === obs.observer_id);
            return { ...obs, avatar_url: match?.avatar_url || obs.avatar };
          });
        }
      }
      return data;
    },
    enabled: !!user,
  });

  const totalFollowing = topObservers.length;
  const uniqueDomains = new Set(topObservers.map((o: any) => o.domain).filter(Boolean)).size;

  return (
    <div className="bg-white border border-slate-200 rounded-[24px] p-6 sm:p-8 flex flex-col shadow-sm focus-ring w-full">
      <div className="flex flex-col gap-1.5 mb-6">
        <h3 className="font-bold text-[16px] text-slate-900 leading-tight">Top observers</h3>
        <span className="font-mono text-[12px] text-slate-500 leading-tight">{totalFollowing} following · {uniqueDomains} domains</span>
      </div>

      <div className="space-y-4 flex-1">
        {topObservers.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
            <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <p className="text-[14px] font-bold text-slate-900 mb-1">No observers yet</p>
            <p className="text-[13px] text-slate-500 max-w-[200px]">Invite your team or share your room link to get observers.</p>
          </div>
        ) : topObservers.map((obs: any, i: number) => {
          const initials = obs.name ? obs.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'OB';
          const style = getDomainColor(obs.domain);
          
          return (
            <div key={i} className="flex items-center justify-between group py-1">
              <div className="flex items-center gap-3 min-w-0">
                <img src={obs.avatar || obs.avatar_url || getAvatarUrl(obs.observer_id)} alt={obs.name} className={`w-10 h-10 rounded-xl border ${style.border} object-cover shrink-0`} />
                <div className="min-w-0 flex-1 pr-2">
                  <div className="font-semibold text-[14px] text-slate-900 truncate">{obs.name}</div>
                  <div className="text-[12px] text-slate-500 font-mono mt-0.5 truncate">
                    {obs.role ? `${obs.role} · ${obs.city || 'Unknown'}` : <span className="text-amber-500 flex items-center gap-1">Observer</span>}
                  </div>
                </div>
              </div>
              <div className="font-mono text-[13px] text-primary-400 font-bold shrink-0 text-right">
                {obs.score} <span className="text-slate-500 font-medium">score</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function LinkedDocsPanel() {
  const { user } = useAuth();
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const { data: linkedDocs = [] } = useQuery({
    queryKey: ['linked-docs', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('room_notion_docs')
        .select('*, rooms!inner(builder_id)')
        .eq('rooms.builder_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) return [];
      return data || [];
    },
    enabled: !!user,
  });

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Card 3: Linked docs */}
      <div className="bg-white border border-slate-200 rounded-[24px] p-6 sm:p-8 flex flex-col shadow-sm focus-ring flex-1">
        <div className="flex flex-col gap-1.5 mb-6">
          <h3 className="font-bold text-[16px] text-slate-900 leading-tight">Linked docs</h3>
          <span className="font-mono text-[12px] text-slate-500 leading-tight">Notion · {linkedDocs.length} connected</span>
        </div>

        <div className="space-y-3 flex-1 overflow-y-auto max-h-[250px] pr-1">
          {linkedDocs.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
              <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <p className="text-[14px] font-bold text-slate-900 mb-1">No documents linked</p>
              <p className="text-[13px] text-slate-500 max-w-[200px]">Connect Notion or Google Docs to provide context to observers.</p>
            </div>
          ) : linkedDocs.map((doc: any, i: number) => (
            <a href={doc.url} target="_blank" rel="noopener noreferrer" key={i} className="block bg-slate-50 border border-slate-100 rounded-xl p-3.5 hover:bg-slate-100 transition-colors cursor-pointer group">
              <div className="flex items-start gap-3 min-w-0">
                <span className="text-[16px] leading-none mt-0.5 opacity-80 group-hover:opacity-100 transition-opacity shrink-0">{doc.icon || '📄'}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-[13px] text-slate-900 mb-1 group-hover:text-primary-400 transition-colors truncate">{doc.title}</div>
                  <div className="font-mono text-[11px] text-slate-500 flex items-center gap-1">
                    <Link2 className="w-3 h-3 shrink-0" /> <span className="truncate">Linked to room</span>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>

        <button
          onClick={() => setIsLinkModalOpen(true)}
          className="w-full mt-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-[13px] hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
          Link Notion doc
        </button>
      </div>

      {/* Card 4: Advanced Analytics */}
      <div className="bg-white border border-slate-200 rounded-[24px] p-6 sm:p-8 flex flex-col shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center">
          <div className="px-3 py-1 bg-primary-400/10 border border-primary-400/20 text-primary-400 text-[10px] font-bold uppercase tracking-wider rounded-full mb-3">
            Coming Soon
          </div>
          <span className="text-[15px] font-semibold text-slate-900">Advanced Analytics</span>
          <p className="text-[12px] text-slate-500 mt-2 px-6">
            Track profile views, conversion rates, and build streaks.
          </p>
        </div>
        <div className="opacity-20 pointer-events-none mt-auto w-full">
          <div className="flex flex-col gap-1.5 mb-6 text-left w-full">
            <h3 className="font-bold text-[16px] text-slate-900 leading-tight">Advanced Analytics</h3>
          </div>
          <div className="space-y-4">
            <div className="h-12 bg-slate-200 rounded-xl"></div>
            <div className="h-12 bg-slate-200 rounded-xl"></div>
          </div>
        </div>
      </div>

      {user && (
        <LinkDocModal 
          isOpen={isLinkModalOpen} 
          onClose={() => setIsLinkModalOpen(false)} 
          roomId={linkedDocs[0]?.room_id || ''} 
          userId={user.id} 
        />
      )}
    </div>
  );
}
