import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router";
import { getAvatarUrl } from "../../utils/helpers";
import { uploadImage } from "../../utils/uploadImage";
import { supabase } from "../auth/AuthContext";
import { toast } from "sonner";
import { Send, ImageIcon, Code, Smile, Sparkles, Hammer } from "lucide-react";
import EmojiPicker from 'emoji-picker-react';
import { AnimatePresence } from "motion/react";
import { SmartImage } from "../ui/SmartImage";

interface RoomComposerProps {
  roomId: string;
  user: any;
  profile: any;
  room: any;
  newUpdate: string;
  setNewUpdate: React.Dispatch<React.SetStateAction<string>>;
  updateTextAreaRef: React.MutableRefObject<HTMLTextAreaElement | null>;
  sendTypingEvent?: (isTyping: boolean) => void;
}

export function RoomComposer({ roomId, user, profile, room, newUpdate, setNewUpdate, updateTextAreaRef, sendTypingEvent }: RoomComposerProps) {
  const [searchParams] = useSearchParams();
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [codeSnippet, setCodeSnippet] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [postingUpdate, setPostingUpdate] = useState(false);
  const [suggestedDecision, setSuggestedDecision] = useState<{ isDecision: boolean; extractedText: string | null } | null>(null);
  const [loggingDecision, setLoggingDecision] = useState(false);
  const [updateType, setUpdateType] = useState<'general' | 'decision' | 'scrap' | 'pivot' | 'blocker' | 'insight' | 'open_question' | 'shipped' | 'crossroad'>('general');
  const [crossroadTradeoff, setCrossroadTradeoff] = useState('');
  const [crossroadOptionA, setCrossroadOptionA] = useState('');
  const [crossroadOptionB, setCrossroadOptionB] = useState('');
  
  const isPostingRef = useRef(false);
  const quickUpdateMode = searchParams.get('action') === 'post';

  useEffect(() => {
    if (quickUpdateMode && room && updateTextAreaRef.current && profile?.role === 'builder') {
      updateTextAreaRef.current.focus();
    }
  }, [quickUpdateMode, room, profile]);

  useEffect(() => {
    if (sendTypingEvent) {
      if (newUpdate.trim().length > 0) {
        sendTypingEvent(true);
      } else {
        sendTypingEvent(false);
      }
    }
  }, [newUpdate, sendTypingEvent]);

  const handlePostUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId || !user || (!newUpdate.trim() && !codeSnippet.trim() && !mediaPreview)) return;
    if (isPostingRef.current) return;
    
    isPostingRef.current = true;
    setPostingUpdate(true);
    
    try {
      let uploadedMediaUrl = null;
      if (mediaPreview && mediaPreview.startsWith('data:')) {
        toast.loading("Uploading image...", { id: "upload" });
        try {
          uploadedMediaUrl = await uploadImage(mediaPreview);
          toast.dismiss("upload");
        } catch (error) {
          toast.dismiss("upload");
          throw error;
        }
      }

      const updatePayload = {
        id: window.crypto?.randomUUID?.() || `upd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        room_id: roomId,
        author_id: user.id,
        author_name: profile?.name || user.email?.split('@')[0] || 'Builder',
        content: newUpdate.trim(),
        media_url: uploadedMediaUrl,
        code_snippet: codeSnippet.trim() || null,
        update_type: updateType,
        created_at: new Date().toISOString(),
        ...(updateType === 'crossroad' ? {
          crossroad_data: {
            context: crossroadTradeoff, // We used crossroadTradeoff for context in UI, let's fix that mapping
            tradeoff: crossroadTradeoff,
            options: [
              { title: crossroadOptionA, description: '' },
              { title: crossroadOptionB, description: '' }
            ]
          }
        } : {})
      };

      const { error: insertError } = await supabase.from('updates').insert(updatePayload);
      if (insertError) throw insertError;

      await supabase.from('rooms').update({
        update_count: (room?.updateCount || 0) + 1,
        last_update: newUpdate.trim().slice(0, 120),
        updated_at: new Date().toISOString()
      }).eq('id', roomId);

      setNewUpdate('');
      setMediaPreview(null);
      setCodeSnippet('');
      setShowCodeInput(false);
      setUpdateType('general');
      toast.success('Update posted!');

      // Analyze update for technical decisions in background
      try {
        supabase.functions.invoke('analyze-update', {
          body: { updateText: updatePayload.content }
        }).then(({ data, error }) => {
          if (!error && data?.success && data?.result?.isDecision && data?.result?.extractedText) {
            setSuggestedDecision(data.result);
          }
        }).catch(err => {
          console.error("AI Analysis background error:", err);
        });
      } catch (aiErr) {
        console.error("AI Analysis sync error:", aiErr);
      }
    } catch (err: unknown) {
      console.error("Error posting update:", err);
      const errorMessage = err instanceof Error ? err.message : (err as any)?.message || JSON.stringify(err);
      toast.error(`Failed to post update: ${errorMessage}`);
    } finally {
      isPostingRef.current = false;
      setPostingUpdate(false);
    }
  };

  const handleLogDecision = async () => {
    if (!roomId || !user || !suggestedDecision?.extractedText) return;
    setLoggingDecision(true);
    try {
      const payload = {
        room_id: roomId,
        builder_id: user.id,
        type: 'decision',
        title: suggestedDecision.extractedText.slice(0, 50) + (suggestedDecision.extractedText.length > 50 ? '...' : ''),
        description: suggestedDecision.extractedText,
        created_at: new Date().toISOString()
      };
      const { data: newDecision, error } = await supabase.from('room_decisions').insert(payload).select().single();
      if (error) throw error;
      
      // Notify followers
      if (newDecision?.id) {
        const { data: followers } = await supabase.from('follows').select('follower_id').eq('following_id', user.id);
        if (followers && followers.length > 0) {
          const notifications = followers.map(f => ({
            user_id: f.follower_id,
            actor_id: user.id,
            type: 'decision',
            reference_id: newDecision.id,
            metadata: {
              room_id: roomId,
              room_title: room?.name || 'a room',
              decision_text: payload.title
            },
            read: false,
            created_at: new Date().toISOString()
          }));
          await supabase.from('notifications').insert(notifications);
        }
      }

      toast.success('Decision automatically logged!');
      setSuggestedDecision(null);
    } catch (err: unknown) {
      toast.error(`Failed to log decision: ${(err instanceof Error ? err.message : String(err))}`);
    } finally {
      setLoggingDecision(false);
    }
  };

  return (
    <>
      {suggestedDecision && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-[24px] p-6 mb-8 flex items-start gap-4 shadow-[0_4px_20px_rgba(245,158,11,0.05)] animate-in fade-in slide-in-from-top-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 bg-amber-500/5 rounded-full blur-[40px] pointer-events-none" />
          <div className="bg-amber-500/20 p-3 rounded-2xl shrink-0">
            <Sparkles className="w-5 h-5 text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[16px] font-extrabold text-slate-900 mb-1 font-display">AI extracted a key decision</h4>
            <p className="text-[14px] font-medium text-slate-700 mb-4 bg-white/60 p-3 rounded-xl border border-amber-500/10 italic">"{suggestedDecision.extractedText}"</p>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleLogDecision}
                disabled={loggingDecision}
                className="bg-amber-500 hover:bg-amber-400 text-white text-[13px] font-bold px-5 py-2.5 rounded-full transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                {loggingDecision ? 'Logging...' : 'Add to Decision Log'}
              </button>
              <button 
                onClick={() => setSuggestedDecision(null)}
                className="text-slate-500 hover:text-slate-800 text-[13px] font-bold px-4 py-2.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
      <form onSubmit={handlePostUpdate} className="bg-white border border-slate-200 rounded-[24px] p-6 mb-8 shadow-sm relative overflow-visible group">
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-primary-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="mb-4 flex flex-col sm:flex-row sm:items-baseline gap-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-400/10 rounded-lg flex items-center justify-center">
              <Hammer className="w-4 h-4 text-primary-400" />
            </div>
            <span className="text-[14px] font-extrabold text-primary-400 font-display">Post an update</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium ml-0 sm:ml-2">For general progress and commits (Use the 'Log Decision' tab below for architectural choices)</span>
        </div>
        {/* Update type selector */}
        {(() => {
          const UPDATE_TYPES = [
            { value: 'general',       label: 'General',       color: 'bg-slate-100 text-slate-600 border-slate-200' },
            { value: 'decision',      label: '⚡ Decision',    color: 'bg-primary-400/10 text-primary-500 border-primary-400/30' },
            { value: 'scrap',         label: '🗑 Scrap',       color: 'bg-rose-50 text-rose-600 border-rose-200' },
            { value: 'pivot',         label: '🔄 Pivot',       color: 'bg-orange-50 text-orange-600 border-orange-200' },
            { value: 'blocker',       label: '🚧 Blocker',     color: 'bg-red-50 text-red-600 border-red-200' },
            { value: 'insight',       label: '💡 Insight',     color: 'bg-amber-50 text-amber-600 border-amber-200' },
            { value: 'open_question', label: '❓ Open question', color: 'bg-blue-50 text-blue-600 border-blue-200' },
            { value: 'shipped',       label: '🚀 Shipped',     color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
            { value: 'crossroad',     label: '🛤️ Crossroad',    color: 'bg-indigo-500/10 text-indigo-500 border-indigo-400/30' },
          ] as const;
          return (
            <div className="mb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Update type</p>
              <div className="flex flex-wrap gap-1.5">
                {UPDATE_TYPES.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setUpdateType(t.value as any)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${
                      updateType === t.value
                        ? t.color + ' ring-1 ring-offset-1 ring-current'
                        : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })()}
        <div className="relative">
        <textarea
          ref={updateTextAreaRef}
          value={newUpdate}
          onChange={e => setNewUpdate(e.target.value.slice(0, 500))}
          placeholder="What did you just ship, learn, or decide? Be specific — give observers something to react to."
          rows={3}
          maxLength={500}
          className="w-full px-5 py-4 bg-slate-100 border border-slate-200 rounded-xl text-[14px] focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 resize-none mb-1 text-slate-900 placeholder-slate-500 font-medium transition-all focus-ring"
        />
        <span className={`absolute bottom-3 right-3 text-[11px] font-mono font-bold transition-colors ${
          newUpdate.length >= 480 ? 'text-rose-400' : 'text-slate-400'
        }`}>{newUpdate.length}/500</span>
        </div>

        {updateType === 'crossroad' && (
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 mb-4 animate-in fade-in slide-in-from-top-2">
             <div className="mb-3">
               <label className="block text-[11px] font-bold uppercase tracking-wider text-indigo-400 mb-1">The Core Trade-off</label>
               <input
                 type="text"
                 value={crossroadTradeoff}
                 onChange={e => setCrossroadTradeoff(e.target.value)}
                 placeholder="e.g., Speed vs Scale. Do we ship faster but incur debt, or build it right?"
                 className="w-full px-4 py-2.5 bg-white border border-indigo-100 rounded-lg text-[13px] focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/50 placeholder-slate-400 transition-all"
               />
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
               <div>
                 <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Option A</label>
                 <input
                   type="text"
                   value={crossroadOptionA}
                   onChange={e => setCrossroadOptionA(e.target.value)}
                   placeholder="e.g., Build custom auth"
                   className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/50 placeholder-slate-400 transition-all"
                 />
               </div>
               <div>
                 <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Option B</label>
                 <input
                   type="text"
                   value={crossroadOptionB}
                   onChange={e => setCrossroadOptionB(e.target.value)}
                   placeholder="e.g., Use Supabase auth"
                   className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/50 placeholder-slate-400 transition-all"
                 />
               </div>
             </div>
          </div>
        )}
      
      {mediaPreview && (
        <div className="relative w-[200px] mb-4 group/preview">
          <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
            <SmartImage src={mediaPreview} aspectRatio="auto" alt="Upload preview" className="max-h-[200px] object-cover" />
          </div>
        </div>
      )}

      {showCodeInput && (
        <textarea
          value={codeSnippet}
          onChange={e => setCodeSnippet(e.target.value)}
          placeholder="Paste your code snippet here..."
          rows={5}
          className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-mono text-slate-800 focus:outline-none focus:border-primary-400/50 focus:ring-1 focus:ring-primary-400/50 resize-none mb-4 transition-all focus-ring"
        />
      )}

      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="grid grid-cols-2 sm:flex items-center gap-2">
          <label className="flex justify-center items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-full text-[12px] font-bold cursor-pointer transition-all focus-ring">
            <ImageIcon className="w-4 h-4 text-primary-400" />
            Attach visual
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (file.size > 5 * 1024 * 1024) {
                    toast.error('Image must be under 5 MB');
                    e.target.value = '';
                    return;
                  }
                  const reader = new FileReader();
                  reader.onloadend = () => setMediaPreview(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }}
            />
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`flex justify-center items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border ${showEmojiPicker ? 'border-primary-400 text-primary-400' : 'border-slate-200 text-slate-600'} rounded-full text-[12px] font-bold transition-all focus-ring`}
            >
              <Smile className="w-4 h-4" />
              Emoji
            </button>
            <AnimatePresence>
              {showEmojiPicker && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowEmojiPicker(false)} 
                  />
                  <div className="absolute z-50 mt-2 bottom-full mb-2">
                    <EmojiPicker 
                      onEmojiClick={(emojiData) => {
                        setNewUpdate(prev => prev + emojiData.emoji);
                        setShowEmojiPicker(false);
                      }}
                    />
                  </div>
                </>
              )}
            </AnimatePresence>
          </div>
          <button
            type="button"
            onClick={() => setShowCodeInput(!showCodeInput)}
            className={`flex justify-center items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border ${showCodeInput ? 'border-primary-400 text-primary-400' : 'border-slate-200 text-slate-600'} rounded-full text-[12px] font-bold transition-all focus-ring`}
          >
            <Code className="w-4 h-4" />
            Code snippet
          </button>
        </div>
        
        <button
          type="submit"
          disabled={postingUpdate || (!newUpdate.trim() && !codeSnippet.trim() && !mediaPreview)}
          className="flex justify-center items-center gap-2 px-6 py-3 w-full sm:w-auto bg-white text-slate-700 border border-slate-200 text-[13px] font-bold rounded-full hover:bg-slate-50 hover:text-slate-900 transition-all disabled:opacity-50 focus-ring"
        >
          {postingUpdate ? 'Posting...' : <><Send className="w-4 h-4" /> Post Update</>}
        </button>
      </div>
    </form>
    </>
  );
}
