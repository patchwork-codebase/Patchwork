import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle, ArrowRight, Clock, AlertCircle, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../auth/AuthContext";
import { timeAgo, getAvatarUrl } from "../../utils/helpers";
import { useQuery } from "@tanstack/react-query";

interface Milestone {
  id: string;
  title: string;
  description?: string;
  status: 'done' | 'active' | 'review' | 'planned' | 'blocked';
}

const STATUS_STYLES: Record<string, any> = {
  done: { icon: CheckCircle, iconColor: "text-emerald-400", badgeBg: "bg-emerald-500/10", badgeText: "text-emerald-400", badgeBorder: "border-emerald-500/20" },
  active: { icon: ArrowRight, iconColor: "text-amber-400", badgeBg: "bg-amber-500/10", badgeText: "text-amber-400", badgeBorder: "border-amber-500/20" },
  review: { icon: ArrowRight, iconColor: "text-amber-400", badgeBg: "bg-amber-500/10", badgeText: "text-amber-400", badgeBorder: "border-amber-500/20" },
  planned: { icon: Clock, iconColor: "text-slate-400", badgeBg: "bg-white/5", badgeText: "text-slate-400", badgeBorder: "border-white/10" },
  blocked: { icon: AlertCircle, iconColor: "text-slate-400", badgeBg: "bg-white/5", badgeText: "text-slate-400", badgeBorder: "border-white/10" },
};

function mapLinearStateToStatus(stateName: string): 'done' | 'active' | 'review' | 'planned' | 'blocked' {
  const lower = stateName.toLowerCase();
  if (lower.includes('done') || lower.includes('completed') || lower.includes('canceled')) return 'done';
  if (lower.includes('progress') || lower.includes('doing') || lower.includes('active')) return 'active';
  if (lower.includes('review')) return 'review';
  if (lower.includes('blocked') || lower.includes('stuck')) return 'blocked';
  return 'planned';
}

interface MilestoneTrackerCardProps {
  roomId: string;
  user: any;
  reactions: any[];
  queryClient: any;
  isNested?: boolean;
}

export function MilestoneTrackerCard({ roomId, user, reactions = [], queryClient, isNested = false }: MilestoneTrackerCardProps) {
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const { data: dbMilestones = [] } = useQuery({
    queryKey: ['linear-issues', roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('linear_issues')
        .select('*')
        .eq('room_id', roomId)
        .order('updated_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching linear issues:", error);
        return [];
      }
      return data || [];
    },
    enabled: !!roomId,
  });

  // Real-time listener for linear issues
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`linear-issues-${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'linear_issues', filter: `room_id=eq.${roomId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['linear-issues', roomId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, queryClient]);

  const allMilestones = dbMilestones.map(issue => ({
    id: issue.id,
    title: issue.title,
    description: issue.description || '',
    status: mapLinearStateToStatus(issue.state),
    originalState: issue.state,
    url: issue.url
  }));

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('linear-sync', {
        body: { roomId }
      });

      if (error) throw new Error(error.message || 'Failed to sync');
      
      toast.success(`Successfully synced ${data.count} issues from Linear!`);
      queryClient.invalidateQueries({ queryKey: ['linear-issues', roomId] });
    } catch (err: any) {
      toast.error(`Linear sync failed: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleReaction = async (itemId: string, type: string) => {
    if (!user) return;
    const existing = reactions.find(r => r.update_id === itemId && r.type === type && r.observer_id === user.id);
    
    try {
      if (existing) {
        await supabase.from('reactions').delete().eq('id', existing.id);
      } else {
        await supabase.from('reactions').insert({
          id: `${roomId}-reaction-${type}-${user.id}-${Date.now()}`,
          room_id: roomId,
          update_id: itemId,
          observer_id: user.id,
          observer_name: user?.user_metadata?.name || user?.email?.split('@')[0] || 'Observer',
          type: type,
          text: '',
          created_at: new Date().toISOString()
        });
      }
      queryClient.invalidateQueries({ queryKey: ["room-details", roomId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    } catch (err: any) {
      toast.error(`Reaction failed: ${err.message}`);
    }
  };

  const submitReply = async (itemId: string) => {
    if (!replyText.trim() || !user) return;
    
    try {
      const { error } = await supabase.from('reactions').insert({
        id: `${roomId}-reply-${itemId}-${user.id}-${Date.now()}`,
        room_id: roomId,
        update_id: itemId,
        observer_id: user.id,
        observer_name: user?.user_metadata?.name || user?.email?.split('@')[0] || 'Observer',
        type: 'reply',
        text: replyText.trim(),
        created_at: new Date().toISOString()
      });

      if (error) throw error;
      
      toast.success("Reply posted!");
      await queryClient.invalidateQueries({ queryKey: ["room-details", roomId] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setReplyText('');
      setReplyingTo(null);
    } catch (err: any) {
      toast.error(`Failed to post reply: ${err.message}`);
    }
  };

  return (
    <div className={isNested ? "flex flex-col h-full" : "bg-white/[0.02] backdrop-blur-sm rounded-[24px] border border-white/[0.08] overflow-hidden flex flex-col h-[500px]"}>
      {!isNested && (
        <div className="p-4 sm:p-5 border-b border-white/[0.08] flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 shrink-0">
          <div>
            <h3 className="text-[16px] font-extrabold text-white leading-tight">
              Milestone tracker
            </h3>
            <span className="text-[12px] text-slate-400 font-medium">Synced with Linear</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-white px-3 sm:px-3.5 py-1.5 rounded-full font-bold text-[11px] sm:text-[12px] transition-colors flex items-center gap-1.5 active:scale-95 disabled:opacity-50 whitespace-nowrap"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} strokeWidth="2"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg>
              <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync Linear'}</span>
              <span className="sm:hidden">{isSyncing ? 'Syncing...' : 'Sync'}</span>
            </button>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="hidden sm:inline">Linear Sync</span>
              <span className="sm:hidden">Synced</span>
            </div>
          </div>
        </div>
      )}

      <div className={`flex-1 overflow-y-auto scrollbar-hide ${isNested ? 'p-1 space-y-0' : 'p-5 space-y-0'}`}>
        <div className="space-y-4">
          {allMilestones.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 text-[13px] font-medium">No milestones tracked yet.</p>
            </div>
          ) : (
            allMilestones.map((milestone, index) => {
              const style = STATUS_STYLES[milestone.status] || STATUS_STYLES.planned;
              const Icon = style.icon;
              const itemReactions = reactions.filter(r => r.update_id === milestone.id || r.updateId === milestone.id);
              const itemReplies = itemReactions.filter(r => r.type === 'reply' || r.text);
              
              const sharpCount = itemReactions.filter(r => r.type === 'sharp').length;
              const pushbackCount = itemReactions.filter(r => r.type === 'pushback').length;
              
              const hasSharp = itemReactions.some(r => r.type === 'sharp' && (r.observer_id === user?.id || r.observerId === user?.id));
              const hasPushback = itemReactions.some(r => r.type === 'pushback' && (r.observer_id === user?.id || r.observerId === user?.id));

              return (
                <div key={milestone.id} className={`pb-5 ${index !== allMilestones.length - 1 ? 'border-b border-white/[0.08] mb-5' : ''}`}>
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <div className="flex items-center gap-4">
                      <div className={`w-6 h-6 rounded-full border border-white/[0.08] bg-[#0A0910] flex items-center justify-center shrink-0`}>
                        <Icon className={`w-3.5 h-3.5 ${style.iconColor}`} />
                      </div>
                      <div>
                        <h4 className="text-[14px] font-bold text-white leading-tight">{milestone.title}</h4>
                        {milestone.description && (
                          <p className="text-[12px] text-slate-400 mt-0.5">{milestone.description}</p>
                        )}
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${style.badgeBg} ${style.badgeText} ${style.badgeBorder} whitespace-nowrap`}>
                      {milestone.originalState || milestone.status}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 px-2">
                    <button 
                      onClick={() => toggleReaction(milestone.id, 'sharp')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-bold border transition-all ${hasSharp ? 'bg-[#8B7CF8]/10 text-[#8B7CF8] border-[#8B7CF8]/30' : 'bg-transparent text-slate-400 border-white/10 hover:border-white/20 hover:text-white'}`}
                    >
                      <span>✦</span> Sharp {sharpCount > 0 && <span className="opacity-70">{sharpCount}</span>}
                    </button>
                    <button 
                      onClick={() => toggleReaction(milestone.id, 'pushback')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-bold border transition-all ${hasPushback ? 'bg-rose-500/10 text-rose-500 border-rose-500/30' : 'bg-transparent text-slate-400 border-white/10 hover:border-white/20 hover:text-white'}`}
                    >
                      <span>↩</span> Push back {pushbackCount > 0 && <span className="opacity-70">{pushbackCount}</span>}
                    </button>
                    
                    <div className="flex-1" />
                    
                    <button 
                      onClick={() => setReplyingTo(replyingTo === milestone.id ? null : milestone.id)}
                      className="flex items-center gap-1.5 text-[12px] font-bold text-slate-400 hover:text-white transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> 
                      {itemReplies.length} {itemReplies.length === 1 ? 'Reply' : 'Replies'}
                    </button>
                  </div>

                  <AnimatePresence>
                    {itemReplies.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 space-y-3 px-2"
                      >
                        {itemReplies.map((reply: any) => (
                          <div key={reply.id} className="flex items-start gap-3 p-3 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
                            <img src={getAvatarUrl(reply.observer_id || reply.observerId)} className="w-6 h-6 rounded-full shrink-0" alt="avatar" />
                            <div>
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[12px] font-bold text-white">Observer</span>
                                <span className="text-[10px] text-slate-500">{timeAgo(reply.created_at || reply.createdAt)}</span>
                              </div>
                              <p className="text-[13px] text-slate-300">{reply.text}</p>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}

                    {replyingTo === milestone.id && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="mt-4 p-3 bg-[#110F1A] border border-[#8B7CF8]/30 rounded-2xl relative mx-2"
                      >
                        <textarea
                          autoFocus
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write your reply..."
                          className="w-full bg-transparent border-none focus:ring-0 text-[13px] text-white placeholder-slate-500 resize-none h-16 focus-visible:outline-none"
                        />
                        <div className="flex justify-end mt-2">
                          <button
                            onClick={() => submitReply(milestone.id)}
                            disabled={!replyText.trim()}
                            className="px-4 py-1.5 bg-[#8B7CF8] hover:bg-[#7a6ce0] disabled:bg-slate-700 disabled:text-slate-400 text-white text-[12px] font-bold rounded-full transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8]"
                          >
                            <Send className="w-3.5 h-3.5" /> Send
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
