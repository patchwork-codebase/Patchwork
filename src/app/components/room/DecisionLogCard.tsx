import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Zap, Clock, CheckCircle, MessageCircle, Send, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../auth/AuthContext";
import { timeAgo, getAvatarUrl } from "../../utils/helpers";
import { LogDecisionModal } from "./LogDecisionModal";
import { useQuery } from "@tanstack/react-query";

interface Decision {
  id: string;
  title: string;
  description?: string;
  outcome?: string;
  createdAt: string;
  reactions?: number;
  type?: 'decision' | 'scrapped' | 'blocker' | 'shipped';
}

const TYPE_STYLES = {
  decision: { text: "text-amber-400", border: "border-amber-400/30", bg: "bg-amber-400/10", label: "DECISION" },
  scrapped: { text: "text-rose-400", border: "border-rose-400/30", bg: "bg-rose-400/10", label: "SCRAPPED" },
  blocker: { text: "text-purple-400", border: "border-purple-400/30", bg: "bg-purple-400/10", label: "BLOCKER" },
  shipped: { text: "text-emerald-400", border: "border-emerald-400/30", bg: "bg-emerald-400/10", label: "SHIPPED" },
};

interface DecisionLogCardProps {
  roomId: string;
  user: any;
  reactions: any[];
  queryClient: any;
  isNested?: boolean;
}

export function DecisionLogCard({ roomId, user, reactions = [], queryClient, isNested = false }: DecisionLogCardProps) {
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch real decisions from the database
  const { data: dbDecisions = [] } = useQuery({
    queryKey: ['room-decisions', roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('room_decisions')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching decisions:", error);
        return [];
      }
      return data || [];
    },
    enabled: !!roomId,
  });

  // Real-time listener for decisions
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`room-decisions-${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_decisions', filter: `room_id=eq.${roomId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['room-decisions', roomId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, queryClient]);

  // Use real decisions from the database
  const allDecisions = dbDecisions.map(d => ({
    id: d.id,
    title: d.title,
    description: d.description,
    type: d.type,
    createdAt: d.created_at,
  }));

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
      {!isNested ? (
        <div className="p-4 sm:p-5 border-b border-white/[0.08] flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 shrink-0">
          <div>
            <h3 className="text-[16px] font-extrabold text-white leading-tight flex items-center gap-2">
              Decision log
            </h3>
            <span className="text-[12px] text-slate-400 font-medium">12 decisions · day 1-12</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-[#8B7CF8] hover:bg-[#7b6ce8] text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold text-[12px] sm:text-[13px] transition-colors flex items-center gap-1.5 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <span>+</span> <span className="hidden sm:inline">Log a decision</span><span className="sm:hidden">Log</span>
            </button>
            <button className="text-[11px] sm:text-[12px] font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-wider shrink-0 whitespace-nowrap">
              View All
            </button>
          </div>
        </div>
      ) : (
        <div className="px-5 py-3 border-b border-white/[0.05] flex items-center justify-between shrink-0 bg-black/20">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded bg-[#8B7CF8]/10 text-[#8B7CF8] text-[11px] font-bold border border-[#8B7CF8]/20">
              {allDecisions.length}
            </span>
            <span className="text-[12px] text-slate-400 font-medium">decisions logged</span>
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsModalOpen(true)}
            className="group relative overflow-hidden bg-[#0A0910] hover:bg-[#8B7CF8]/10 border border-white/[0.08] hover:border-[#8B7CF8]/30 text-white px-4 py-1.5 rounded-full font-bold text-[12px] transition-all flex items-center gap-1.5 shadow-sm"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            <Plus className="w-3.5 h-3.5 text-[#8B7CF8]" />
            <span className="relative z-10">Log a decision</span>
          </motion.button>
        </div>
      )}

      <div className={`flex-1 overflow-y-auto scrollbar-hide ${isNested ? 'p-1 space-y-4' : 'p-5 space-y-5'}`}>
        <div className="relative">
          {allDecisions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 text-[13px] font-medium">No decisions logged yet.</p>
            </div>
          ) : (
            allDecisions.map((decision, index) => {
              const style = TYPE_STYLES[decision.type || 'decision'];
              const itemReactions = reactions.filter(r => r.update_id === decision.id || r.updateId === decision.id);
              const itemReplies = itemReactions.filter(r => r.type === 'reply' || r.text);
              
              const sharpCount = itemReactions.filter(r => r.type === 'sharp').length;
              const pushbackCount = itemReactions.filter(r => r.type === 'pushback').length;
              
              const hasSharp = itemReactions.some(r => r.type === 'sharp' && (r.observer_id === user?.id || r.observerId === user?.id));
              const hasPushback = itemReactions.some(r => r.type === 'pushback' && (r.observer_id === user?.id || r.observerId === user?.id));

              return (
                <div key={decision.id} className={`pb-5 ${index !== allDecisions.length - 1 ? 'border-b border-white/[0.08]' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 w-4 h-4 rounded-full border-2 ${style.border} flex items-center justify-center shrink-0`}>
                      {decision.type === 'shipped' ? <CheckCircle className={`w-2.5 h-2.5 ${style.text}`} /> : <div className={`w-1.5 h-1.5 rounded-full ${style.bg}`} />}
                    </div>
                    <div>
                      <div className={`text-[10px] font-bold ${style.text} ${style.bg} px-1.5 py-0.5 rounded uppercase tracking-widest inline-block mb-1.5`}>
                        {style.label}
                      </div>
                      <h4 className="text-[14px] font-bold text-white mb-1">{decision.title}</h4>
                      {decision.description && (
                        <p className="text-[13px] text-slate-300 leading-relaxed mb-2">
                          {decision.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium uppercase tracking-wider mb-3">
                        <span>Day {index === 0 ? 12 : index === 1 ? 12 : index === 2 ? 8 : 10}</span>
                        <span>·</span>
                        <span>{timeAgo(decision.createdAt)}</span>
                      </div>

                      {/* Reaction & Reply Actions */}
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <button 
                          onClick={() => toggleReaction(decision.id, 'sharp')}
                          className={`flex items-center whitespace-nowrap gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-bold border transition-all ${hasSharp ? 'bg-[#8B7CF8]/10 text-[#8B7CF8] border-[#8B7CF8]/30' : 'bg-transparent text-slate-400 border-white/10 hover:border-white/20 hover:text-white'}`}
                        >
                          <span>✦</span> Sharp {sharpCount > 0 && <span className="opacity-70">{sharpCount}</span>}
                        </button>
                        <button 
                          onClick={() => toggleReaction(decision.id, 'pushback')}
                          className={`flex items-center whitespace-nowrap gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-bold border transition-all ${hasPushback ? 'bg-rose-500/10 text-rose-500 border-rose-500/30' : 'bg-transparent text-slate-400 border-white/10 hover:border-white/20 hover:text-white'}`}
                        >
                          <span>↩</span> Push back {pushbackCount > 0 && <span className="opacity-70">{pushbackCount}</span>}
                        </button>
                        
                        <div className="flex-1" />
                        
                        <button 
                          onClick={() => setReplyingTo(replyingTo === decision.id ? null : decision.id)}
                          className="flex items-center gap-1.5 text-[12px] font-bold text-slate-400 hover:text-white transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5" /> 
                          {itemReplies.length} {itemReplies.length === 1 ? 'Reply' : 'Replies'}
                        </button>
                      </div>

                      {/* Replies Section */}
                      <AnimatePresence>
                        {itemReplies.length > 0 && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-4 space-y-3"
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

                        {/* Composer for Reply */}
                        {replyingTo === decision.id && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="mt-4 p-3 bg-[#110F1A] border border-[#8B7CF8]/30 rounded-2xl relative"
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
                                onClick={() => submitReply(decision.id)}
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
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <LogDecisionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        roomId={roomId}
        userId={user?.id || ''}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['room-decisions', roomId] });
        }}
      />
    </div>
  );
}
