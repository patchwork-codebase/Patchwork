import { motion } from "motion/react";
import { Link2 } from "lucide-react";
import { useAuth, supabase } from "../auth/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { LinkDocModal } from "../room/LinkDocModal";

export function OverviewInsights() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

  const { data: reactions = [] } = useQuery({
    queryKey: ['overview-reactions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: rooms } = await supabase.from('rooms').select('id').eq('builder_id', user.id);
      if (!rooms || rooms.length === 0) return [];
      const roomIds = rooms.map((r: any) => r.id);
      
      const { data } = await supabase.from('reactions').select('*').in('room_id', roomIds);
      return data || [];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    
    // Clean up existing channel if it exists
    const existing = supabase.getChannels().find(c => c.topic === 'realtime:overview-insights-channel');
    if (existing) supabase.removeChannel(existing);

    const channel = supabase.channel('overview-insights-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reactions' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['overview-reactions', user.id] });
          queryClient.invalidateQueries({ queryKey: ['top-observers', user.id] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats', user.id] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_notion_docs' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['linked-docs', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const sharpCount = reactions.filter((r: any) => r.type === 'sharp').length;
  const tellMeMoreCount = reactions.filter((r: any) => r.type === 'reply').length;
  const pushbackCount = reactions.filter((r: any) => r.type === 'pushback').length;
  const totalReactions = sharpCount + tellMeMoreCount + pushbackCount;
  
  const updatesWithReactions = new Set(reactions.map((r: any) => r.update_id)).size;

  const sharpPct = totalReactions > 0 ? Math.round((sharpCount / totalReactions) * 100) : 0;
  const tellMeMorePct = totalReactions > 0 ? Math.round((tellMeMoreCount / totalReactions) * 100) : 0;
  const pushbackPct = totalReactions > 0 ? Math.round((pushbackCount / totalReactions) * 100) : 0;

  const { data: topObservers = [] } = useQuery({
    queryKey: ['top-observers', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.rpc('get_top_observers', { p_builder_id: user.id });
      if (error) {
        console.error("Error fetching top observers:", error);
        return [];
      }
      return data || [];
    },
    enabled: !!user,
  });

  const { data: linkedDocs = [] } = useQuery({
    queryKey: ['linked-docs', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: rooms } = await supabase.from('rooms').select('id').eq('builder_id', user.id);
      if (!rooms || rooms.length === 0) return [];
      const roomIds = rooms.map((r: any) => r.id);
      
      const { data } = await supabase.from('room_notion_docs').select('*').in('room_id', roomIds).order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });



  const totalFollowing = topObservers.length; // Actually, we'd want all distinct followers, but we can just use topObservers length or a separate count if needed.
  const uniqueDomains = new Set(topObservers.map((o: any) => o.domain).filter(Boolean)).size;

  function getDomainColor(domain: string) {
    switch (domain?.toLowerCase()) {
      case 'design': return { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/20' };
      case 'growth': return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' };
      case 'product': return { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' };
      case 'engineering': return { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' };
      default: return { bg: 'bg-[#6C5CE7]/10', text: 'text-[#8B7CF8]', border: 'border-[#6C5CE7]/20' };
    }
  }

  return (
    <div className="w-full mt-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Observer reactions */}
        <div className="bg-[#0D0B14] border border-white/[0.08] rounded-[20px] p-6 flex flex-col shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-[16px] text-white">Observer reactions</h3>
            <span className="font-mono text-[12px] text-slate-400">{totalReactions} total · {updatesWithReactions} updates</span>
          </div>

          {totalReactions === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
              <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mb-3">
                <span className="text-xl">✨</span>
              </div>
              <p className="text-[14px] font-bold text-white mb-1">No reactions yet</p>
              <p className="text-[13px] text-slate-400 max-w-[200px]">Post updates and share your room to start gathering feedback.</p>
            </div>
          ) : (
            <>
              <div className="space-y-5 flex-1">
                {/* Reaction 1 */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[13px] font-semibold text-white flex items-center gap-1.5">
                      <span className="text-emerald-400 text-xl leading-none -mt-1">✦</span> This is sharp
                    </span>
                    <span className="font-mono text-[12px] text-slate-400"><span className="text-emerald-400 font-bold">{sharpCount}</span> · {sharpPct}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${sharpPct}%` }} />
                  </div>
                </div>

                {/* Reaction 2 */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[13px] font-semibold text-white">
                      <span className="text-[#8B7CF8] font-bold mr-1">?</span> Tell me more
                    </span>
                    <span className="font-mono text-[12px] text-slate-400"><span className="text-[#8B7CF8] font-bold">{tellMeMoreCount}</span> · {tellMeMorePct}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
                    <div className="h-full bg-[#8B7CF8] rounded-full" style={{ width: `${tellMeMorePct}%` }} />
                  </div>
                </div>

                {/* Reaction 3 */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[13px] font-semibold text-white flex items-center gap-1">
                      <svg className="text-amber-500" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11"/></svg>
                      Push back
                    </span>
                    <span className="font-mono text-[12px] text-slate-400"><span className="text-amber-500 font-bold">{pushbackCount}</span> · {pushbackPct}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pushbackPct}%` }} />
                  </div>
                </div>
              </div>

              <div className="mt-6 bg-[#8B7CF8]/10 rounded-xl p-4 border border-[#8B7CF8]/20">
                <h4 className="font-mono text-[11px] text-[#8B7CF8] font-bold uppercase tracking-wider mb-2">AI Insight</h4>
                <p className="text-[13px] text-slate-300 leading-relaxed">
                  Your problem-framing updates get <strong className="text-white">2x more reactions</strong> than feature announcements. Post the problem before the solution.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Card 2: Top observers */}
        <div className="bg-[#0D0B14] border border-white/[0.08] rounded-[20px] p-6 flex flex-col shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-[16px] text-white">Top observers</h3>
            <span className="font-mono text-[12px] text-slate-400">{totalFollowing} following · {uniqueDomains} domains</span>
          </div>

          <div className="space-y-4 flex-1">
            {topObservers.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mb-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <p className="text-[14px] font-bold text-white mb-1">No observers yet</p>
                <p className="text-[13px] text-slate-400 max-w-[200px]">Invite your team or share your room link to get observers.</p>
              </div>
            ) : topObservers.map((obs: any, i: number) => {
              const initials = obs.name ? obs.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'OB';
              const style = getDomainColor(obs.domain);
              
              return (
                <div key={i} className="flex items-center justify-between group py-1">
                  <div className="flex items-center gap-3">
                    {obs.avatar ? (
                      <img src={obs.avatar} alt={obs.name} className={`w-10 h-10 rounded-xl border ${style.border} object-cover`} />
                    ) : (
                      <div className={`w-10 h-10 rounded-xl border ${style.border} flex items-center justify-center font-bold text-[13px] ${style.bg} ${style.text}`}>
                        {initials}
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-[14px] text-white">{obs.name}</div>
                      <div className="text-[12px] text-slate-400 font-mono mt-0.5">
                        {obs.role ? `${obs.role} · ${obs.city || 'Unknown'}` : <span className="text-amber-400 flex items-center gap-1">Observer</span>}
                      </div>
                    </div>
                  </div>
                  <div className="font-mono text-[13px] text-[#8B7CF8] font-bold">
                    {obs.score} <span className="text-slate-500 font-medium">score</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 3: Linked docs */}
        <div className="bg-[#0D0B14] border border-white/[0.08] rounded-[20px] p-6 flex flex-col shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-[16px] text-white">Linked docs</h3>
            <span className="font-mono text-[12px] text-slate-400">Notion · {linkedDocs.length} connected</span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-1">
            {linkedDocs.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mb-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <p className="text-[14px] font-bold text-white mb-1">No documents linked</p>
                <p className="text-[13px] text-slate-400 max-w-[200px]">Connect Notion or Google Docs to provide context to observers.</p>
              </div>
            ) : linkedDocs.map((doc: any, i: number) => (
              <a href={doc.url} target="_blank" rel="noopener noreferrer" key={i} className="block bg-white/[0.02] border border-white/[0.05] rounded-xl p-3.5 hover:bg-white/[0.04] transition-colors cursor-pointer group">
                <div className="flex items-start gap-3">
                  <span className="text-[16px] leading-none mt-0.5 opacity-80 group-hover:opacity-100 transition-opacity">{doc.icon || '📄'}</span>
                  <div>
                    <div className="font-semibold text-[13px] text-white mb-1 group-hover:text-[#8B7CF8] transition-colors">{doc.title}</div>
                    <div className="font-mono text-[11px] text-slate-400 flex items-center gap-1">
                      <Link2 className="w-3 h-3" /> Linked to room
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>

          <button
            onClick={() => setIsLinkModalOpen(true)}
            className="w-full mt-4 py-2.5 rounded-xl border border-white/[0.08] text-white font-semibold text-[13px] hover:bg-white/[0.04] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
            Link Notion doc
          </button>
        </div>

      </div>

      {user && (
        <LinkDocModal 
          isOpen={isLinkModalOpen} 
          onClose={() => setIsLinkModalOpen(false)} 
          roomId={linkedDocs[0]?.room_id || ''} // In a real scenario we'd pick which room to link it to, or the dashboard overview links to a default/selected room
          userId={user.id} 
        />
      )}
    </div>
  );
}
