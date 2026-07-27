import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle, MessageCircle, Send, Plus, Smile, Edit2, Trash2, Lock } from "lucide-react";
import { InlineEmojiPicker } from "../ui/InlineEmojiPicker";
import { toast } from "sonner";
import { supabase } from "../auth/AuthContext";
import { timeAgo } from '../../utils/helpers';
import { UserAvatar } from '../ui/UserAvatar';
import { SmartImage } from "../ui/SmartImage";
import { LogDecisionModal } from "./LogDecisionModal";
import { useQuery } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

interface Decision {
  id: string;
  title: string;
  description?: string;
  outcome?: string;
  createdAt: string;
  reactions?: number;
  type?: 'decision' | 'scrapped' | 'blocker' | 'shipped';
  media_url?: string;
  external_link?: string;
}

const TYPE_STYLES = {
  decision: { text: "text-amber-600", border: "border-amber-200", bg: "bg-amber-100", label: "DECISION" },
  scrapped: { text: "text-rose-600", border: "border-rose-200", bg: "bg-rose-100", label: "SCRAPPED" },
  blocker: { text: "text-primary-600", border: "border-primary-200", bg: "bg-primary-100", label: "BLOCKER" },
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
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDecision, setEditingDecision] = useState<any>(null);
  const [decisionToDelete, setDecisionToDelete] = useState<string | null>(null);

  const executeDelete = async () => {
    if (!decisionToDelete) return;
    try {
      const { error } = await supabase.from('room_decisions').delete().eq('id', decisionToDelete);
      if (error) throw error;
      toast.success("Decision deleted");
    } catch (e: any) {
      toast.error(e.message || "Failed to delete");
    } finally {
      setDecisionToDelete(null);
    }
  };

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
  const allDecisions = dbDecisions
  .filter(d => {
    if (d.is_private && !isBuilder) return false;
    return true;
  })
  .map(d => ({
    id: d.id,
    title: d.title,
    description: d.description,
    type: d.type,
    createdAt: d.created_at,
    media_url: d.media_url,
    external_link: d.external_link,
    is_private: d.is_private,
  }));

  const toggleReaction = async (itemId: string, type: string) => {
    if (!user) return;
    const existing = reactions.find(r => (r.update_id === itemId || r.updateId === itemId) && r.type === type && (r.observer_id === user.id || r.observerId === user.id));
    
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
      setShowEmojiPicker(false);
    } catch (err: unknown) {
      toast.error(`Failed to post reply: ${(err instanceof Error ? err.message : String(err))}`);
    }
  };

  return (
    <div className={isNested ? "flex flex-col h-full" : "bg-transparent rounded-[24px] border border-slate-800 shadow-sm overflow-hidden flex flex-col h-[500px]"}>
      {!isNested ? (
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 shrink-0">
          <div>
            <h3 className="text-[16px] font-extrabold text-slate-100 leading-tight flex items-center gap-2">
              Decision log
            </h3>
            <span className="text-[12px] text-slate-400 font-medium">12 decisions · day 1-12</span>
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
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between shrink-0 bg-transparent">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded bg-primary-400/10 text-primary-400 text-[11px] font-bold border border-primary-400/20">
              {allDecisions.length}
            </span>
            <span className="text-[12px] text-slate-400 font-medium">decisions logged</span>
          </div>
          {isBuilder && (
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsModalOpen(true)}
              className="group relative overflow-hidden bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-4 py-1.5 rounded-full font-bold text-[12px] transition-all flex items-center gap-1.5 shadow-sm"
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
              const style = (TYPE_STYLES as any)[decision.type || 'decision'];
              const itemReactions = reactions.filter(r => r.update_id === decision.id || r.updateId === decision.id);
              const itemReplies = itemReactions.filter(r => r.type === 'reply' || r.text);
              
              const sharpCount = itemReactions.filter(r => r.type === 'sharp').length;
              const pushbackCount = itemReactions.filter(r => r.type === 'pushback').length;
              
              const hasSharp = itemReactions.some(r => r.type === 'sharp' && (r.observer_id === user?.id || r.observerId === user?.id));
              const hasPushback = itemReactions.some(r => r.type === 'pushback' && (r.observer_id === user?.id || r.observerId === user?.id));

              return (
                <div key={decision.id} className={`pb-5 ${index !== allDecisions.length - 1 ? 'border-b border-slate-800' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 w-4 h-4 rounded-full border-2 ${style.border} flex items-center justify-center shrink-0`}>
                      {decision.type === 'shipped' ? <CheckCircle className={`w-2.5 h-2.5 ${style.text}`} /> : <div className={`w-1.5 h-1.5 rounded-full ${style.bg}`} />}
                    </div>
                    <div>
                      <div className={`text-[10px] font-bold ${style.text} ${style.bg} px-1.5 py-0.5 rounded uppercase tracking-widest inline-flex items-center gap-1 mb-1.5`}>
                        {style.label}
                        {decision.is_private && <Lock className="w-2.5 h-2.5 ml-1" />}
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <h4 className="text-[14px] font-bold text-slate-100 mb-1">{decision.title}</h4>
                        {isBuilder && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => { setEditingDecision(decision); setIsModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-primary-400 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setDecisionToDelete(decision.id)} className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                      {decision.description && (
                        <p className="text-[13px] text-slate-400 leading-relaxed mb-2">
                          {decision.description}
                        </p>
                      )}
                      
                      {decision.media_url && (
                        <div className="mb-3 w-fit rounded-xl overflow-hidden border border-slate-200">
                          <SmartImage src={decision.media_url} aspectRatio="auto" alt="Decision context" />
                        </div>
                      )}

                      {decision.external_link && (
                        <a 
                          href={decision.external_link.startsWith('http') ? decision.external_link : `https://${decision.external_link}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 rounded-lg text-[12px] font-bold transition-colors mb-3"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                          View External Resource
                        </a>
                      )}

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium uppercase tracking-wider mb-3">
                        <span>Day {index === 0 ? 12 : index === 1 ? 12 : index === 2 ? 8 : 10}</span>
                        <span>·</span>
                        <span>{timeAgo(decision.createdAt)}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <button 
                          onClick={() => toggleReaction(decision.id, 'sharp')}
                          className={`flex items-center whitespace-nowrap gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-bold border transition-all ${hasSharp ? 'bg-primary-400/10 text-primary-400 border-primary-400/30' : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:border-slate-600 hover:text-slate-200'}`}
                        >
                          <span>✦</span> Sharp {sharpCount > 0 && <span className="opacity-70">{sharpCount}</span>}
                        </button>
                        <button 
                          onClick={() => toggleReaction(decision.id, 'pushback')}
                          className={`flex items-center whitespace-nowrap gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-bold border transition-all ${hasPushback ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:border-slate-600 hover:text-slate-200'}`}
                        >
                          <span>↩</span> Push back {pushbackCount > 0 && <span className="opacity-70">{pushbackCount}</span>}
                        </button>
                        
                        <div className="flex-1" />
                        
                        <button 
                          onClick={() => setReplyingTo(replyingTo === decision.id ? null : decision.id)}
                          className="flex items-center gap-1.5 text-[12px] font-bold text-slate-500 hover:text-slate-200 transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5" /> 
                          {itemReplies.length} {itemReplies.length === 1 ? 'Reply' : 'Replies'}
                        </button>
                      </div>

                      {/* Replies Section */}
                      <AnimatePresence>
                        {itemReplies.length > 0 && (
                          <motion.div 
                            key="replies-list"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-4 space-y-3"
                          >
                            {itemReplies.map((reply: any) => (
                              <div key={reply.id} className="flex items-start gap-3 p-3 bg-slate-800/50 border border-slate-700 rounded-2xl">
                                <UserAvatar 
                                  userId={reply.observer_id || reply.observerId} 
                                  name={reply.observerName} 
                                  avatarUrl={reply.observerAvatar} 
                                  className="w-6 h-6 rounded-full shrink-0 cursor-pointer hover:ring-2 hover:ring-primary-400 transition-all object-cover" 
                                />
                                <div>
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-[12px] font-bold text-slate-100">Observer</span>
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
                            key="reply-composer"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="mt-4 p-3 bg-slate-800 border border-slate-700 shadow-sm rounded-2xl relative"
                          >
                            <textarea
                              ref={replyTextareaRef}
                              autoFocus
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Write your reply..."
                              className="w-full bg-transparent border-none focus:ring-0 text-[13px] text-slate-100 placeholder-slate-500 resize-none h-16 focus-visible:outline-none"
                            />
                            <InlineEmojiPicker
                              isOpen={showEmojiPicker}
                              className="px-1 py-2 bg-transparent border-t border-slate-100"
                              buttonClassName="w-8 h-8 rounded-full hover:bg-slate-100"
                              onEmojiSelect={(emoji) => {
                                setReplyText(prev => prev + emoji);
                                replyTextareaRef.current?.focus();
                              }}
                            />
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                              <button 
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
                                className={`p-1.5 rounded transition-colors ${showEmojiPicker ? 'text-primary-500 bg-primary-50' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`} 
                                title="Emoji"
                              >
                                <Smile className="w-4 h-4" />
                              </button>
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
        onClose={() => { setIsModalOpen(false); setEditingDecision(null); }} 
        roomId={roomId} 
        userId={user?.id}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['room-decisions', roomId] })}
        initialDecision={editingDecision}
      />

      <AlertDialog open={!!decisionToDelete} onOpenChange={(open) => !open && setDecisionToDelete(null)}>
        <AlertDialogContent className="bg-[#0D0B14] border border-white/[0.08] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this decision?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This action cannot be undone. This decision will be permanently removed from your log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/[0.08] text-slate-300 hover:bg-white/[0.05] hover:text-white">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-rose-500 hover:bg-rose-600 text-white border-0">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
