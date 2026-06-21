import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
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
  decision: { text: "text-amber-600", border: "border-amber-200", bg: "bg-amber-100", label: "DECISION" },
  scrapped: { text: "text-rose-600", border: "border-rose-200", bg: "bg-rose-100", label: "SCRAPPED" },
  blocker: { text: "text-purple-600", border: "border-purple-200", bg: "bg-purple-100", label: "BLOCKER" },
  shipped: { text: "text-emerald-600", border: "border-emerald-200", bg: "bg-emerald-100", label: "SHIPPED" },
};

interface DecisionLogCardProps {
  roomId: string;
  user: any;
  reactions: any[];
  queryClient: any;
  isNested?: boolean;
  isBuilder?: boolean;
}

export function DecisionLogCard({ roomId, user, reactions = [], queryClient, isNested = false, isBuilder = false }: DecisionLogCardProps) {
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const navigate = useNavigate();
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
    } catch (err: unknown) {
      toast.error(`Reaction failed: ${(err instanceof Error ? err.message : String(err))}`);
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
    } catch (err: unknown) {
      toast.error(`Failed to post reply: ${(err instanceof Error ? err.message : String(err))}`);
    }
  };

  return (
    <div className={isNested ? "flex flex-col h-full" : "bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[500px]"}>
      {!isNested ? (
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 shrink-0">
          <div>
            <h3 className="text-[16px] font-extrabold text-slate-900 leading-tight flex items-center gap-2">
              Decision log
            </h3>
            <span className="text-[12px] text-slate-500 font-medium">12 decisions · day 1-12</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {isBuilder && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-primary-400 hover:bg-[#7b6ce8] text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold text-[12px] sm:text-[13px] transition-colors flex items-center gap-1.5 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <span>+</span> <span className="hidden sm:inline">Log a decision</span><span className="sm:hidden">Log</span>
              </button>
            )}
            <button className="text-[11px] sm:text-[12px] font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-wider shrink-0 whitespace-nowrap">
              View All
            </button>
          </div>
        </div>
      ) : (
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-100">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded bg-primary-400/10 text-primary-400 text-[11px] font-bold border border-primary-400/20">
              {allDecisions.length}
            </span>
            <span className="text-[12px] text-slate-500 font-medium">decisions logged</span>
          </div>
          {isBuilder && (
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsModalOpen(true)}
              className="group relative overflow-hidden bg-slate-900 hover:bg-slate-800 border border-transparent text-white px-4 py-1.5 rounded-full font-bold text-[12px] transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-primary-400" />
              <span className="relative z-10">Log a decision</span>
            </motion.button>
          )}
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
                <div key={decision.id} className={`pb-5 ${index !== allDecisions.length - 1 ? 'border-b border-slate-200' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 w-4 h-4 rounded-full border-2 ${style.border} flex items-center justify-center shrink-0`}>
                      {decision.type === 'shipped' ? <CheckCircle className={`w-2.5 h-2.5 ${style.text}`} /> : <div className={`w-1.5 h-1.5 rounded-full ${style.bg}`} />}
                    </div>
                    <div>
                      <div className={`text-[10px] font-bold ${style.text} ${style.bg} px-1.5 py-0.5 rounded uppercase tracking-widest inline-block mb-1.5`}>
                        {style.label}
                      </div>
                      <h4 className="text-[14px] font-bold text-slate-900 mb-1">{decision.title}</h4>
                      {decision.description && (
                        <p className="text-[13px] text-slate-600 leading-relaxed mb-2">
                          {decision.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium uppercase tracking-wider mb-3">
                        <span>Day {index === 0 ? 12 : index === 1 ? 12 : index === 2 ? 8 : 10}</span>
                        <span>·</span>
                        <span>{timeAgo(decision.createdAt)}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <button 
                          onClick={() => toggleReaction(decision.id, 'sharp')}
                          className={`flex items-center whitespace-nowrap gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-bold border transition-all ${hasSharp ? 'bg-primary-400/10 text-primary-400 border-primary-400/30' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-900'}`}
                        >
                          <span>✦</span> Sharp {sharpCount > 0 && <span className="opacity-70">{sharpCount}</span>}
                        </button>
                        <button 
                          onClick={() => toggleReaction(decision.id, 'pushback')}
                          className={`flex items-center whitespace-nowrap gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-bold border transition-all ${hasPushback ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-900'}`}
                        >
                          <span>↩</span> Push back {pushbackCount > 0 && <span className="opacity-70">{pushbackCount}</span>}
                        </button>
                        
                        <div className="flex-1" />
                        
                        <button 
                          onClick={() => setReplyingTo(replyingTo === decision.id ? null : decision.id)}
                          className="flex items-center gap-1.5 text-[12px] font-bold text-slate-500 hover:text-slate-900 transition-colors"
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
                              <div key={reply.id} className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                                <img 
                                  src={getAvatarUrl(reply.observer_id || reply.observerId)} 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const uid = reply.observer_id || reply.observerId;
                                    if (uid) navigate(`/dashboard/profile/${uid}`);
                                  }}
                                  className="w-6 h-6 rounded-full shrink-0 cursor-pointer hover:ring-2 hover:ring-primary-400 transition-all" 
                                  alt="avatar" 
                                />
                                <div>
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-[12px] font-bold text-slate-900">Observer</span>
                                    <span className="text-[10px] text-slate-500">{timeAgo(reply.created_at || reply.createdAt)}</span>
                                  </div>
                                  <p className="text-[13px] text-slate-700">{reply.text}</p>
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
                            className="mt-4 p-3 bg-white border border-slate-200 shadow-sm rounded-2xl relative"
                          >
                            <textarea
                              autoFocus
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Write your reply..."
                              className="w-full bg-transparent border-none focus:ring-0 text-[13px] text-slate-900 placeholder-slate-500 resize-none h-16 focus-visible:outline-none"
                            />
                            <div className="flex justify-end mt-2">
                              <button
                                onClick={() => submitReply(decision.id)}
                                disabled={!replyText.trim()}
                                className="px-4 py-1.5 bg-primary-400 hover:bg-[#7a6ce0] disabled:bg-slate-700 disabled:text-slate-400 text-white text-[12px] font-bold rounded-full transition-colors flex items-center gap-1.5 focus-ring"
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
