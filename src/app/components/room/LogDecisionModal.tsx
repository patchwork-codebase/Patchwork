import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { X, CheckCircle, Zap, Target, AlertTriangle, ImageIcon, Link as LinkIcon, Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../auth/AuthContext";
import { SmartImage } from "../ui/SmartImage";

interface LogDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  userId?: string;
  onSuccess: () => void;
  initialDecision?: any;
}

type DecisionType = 'decision' | 'scrapped' | 'blocker' | 'shipped';

const TYPE_OPTIONS: { id: DecisionType; label: string; icon: any; color: string; bg: string; border: string }[] = [
  { id: 'decision', label: 'Decision', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30' },
  { id: 'shipped', label: 'Shipped', icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30' },
  { id: 'blocker', label: 'Blocker', icon: AlertTriangle, color: 'text-primary-400', bg: 'bg-primary-400/10', border: 'border-primary-400/30' },
  { id: 'scrapped', label: 'Scrapped', icon: X, color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/30' },
];

export function LogDecisionModal({ isOpen, onClose, roomId, userId, onSuccess, initialDecision }: LogDecisionModalProps) {
  const [type, setType] = useState<DecisionType>(initialDecision?.type || 'decision');
  const [title, setTitle] = useState(initialDecision?.title || "");
  const [description, setDescription] = useState(initialDecision?.description || "");
  const [externalLink, setExternalLink] = useState(initialDecision?.external_link || "");
  const [mediaPreview, setMediaPreview] = useState<string | null>(initialDecision?.media_url || null);
  const [isPrivate, setIsPrivate] = useState<boolean>(initialDecision?.is_private || false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please provide a title for this decision.");
      return;
    }

    setIsSubmitting(true);
    try {
      let uploadedMediaUrl = null;
      if (mediaPreview && mediaPreview.startsWith('data:')) {
        const fileExt = mediaPreview.split(';')[0].split('/')[1];
        const fileName = `${userId}-${Date.now()}.${fileExt}`;
        const base64Data = mediaPreview.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
        const blob = new Blob([new Uint8Array(byteNumbers)], { type: `image/${fileExt}` });

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('updates_media')
          .upload(`public/decisions/${fileName}`, blob);
        
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage
          .from('updates_media')
          .getPublicUrl(`public/decisions/${fileName}`);
          
        uploadedMediaUrl = urlData.publicUrl;
      }

      const payload = {
        room_id: roomId,
        builder_id: userId,
        type,
        title: title.trim(),
        description: description.trim() || null,
        media_url: uploadedMediaUrl || (mediaPreview && mediaPreview.startsWith('http') ? mediaPreview : null),
        external_link: externalLink.trim() || null
      };

      let decisionId = initialDecision?.id;

      if (initialDecision?.id) {
        const { error } = await supabase.from('room_decisions').update(payload).eq('id', initialDecision.id);
        if (error) throw error;
        toast.success("Decision updated successfully!");
      } else {
        const { data: newDecision, error } = await supabase.from('room_decisions').insert(payload).select().single();
        if (error) throw error;
        decisionId = newDecision?.id;
        toast.success("Decision logged successfully!");
      }

      // Notify followers
      if (decisionId) {
        const { data: room } = await supabase.from('rooms').select('name').eq('id', roomId).single();
        const { data: followers } = await supabase.from('follows').select('follower_id').eq('following_id', userId);
        
        if (followers && followers.length > 0) {
          const notifications = followers.map(f => ({
            user_id: f.follower_id,
            actor_id: userId,
            type: initialDecision?.id ? 'decision_updated' : 'decision',
            reference_id: decisionId,
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
      
      setTitle("");
      setDescription("");
      setExternalLink("");
      setMediaPreview(null);
      setType('decision');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      toast.error(`Failed to log decision: ${(err instanceof Error ? err.message : String(err))}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-[#0D0B14] border border-white/[0.08] rounded-3xl w-full max-w-[500px] overflow-hidden relative z-10 shadow-2xl flex flex-col max-h-[90vh]"
          >
            <div className="flex items-start justify-between p-5 border-b border-white/[0.08] shrink-0">
              <div>
                <h2 className="text-[18px] font-bold text-white mb-1">{initialDecision ? 'Edit decision' : 'Log a decision'}</h2>
                <p className="text-[12px] text-slate-400 font-medium">Record structured architectural choices, pivots, or blockers. (For general progress, use 'Post an update')</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto min-h-0">
              {/* Type Selection */}
              <div>
                <label className="block text-[13px] font-bold text-slate-400 mb-3 uppercase tracking-wider">Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {TYPE_OPTIONS.map(opt => {
                    const isSelected = type === opt.id;
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setType(opt.id)}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                          isSelected 
                            ? `${opt.bg} ${opt.border} ${opt.color}` 
                            : 'bg-white/[0.02] border-white/[0.05] text-slate-400 hover:border-white/[0.1] hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isSelected ? '' : 'bg-white/[0.05]'}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className={`text-[13px] font-bold ${isSelected ? opt.color : 'text-slate-300'}`}>
                          {opt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-[13px] font-bold text-slate-400 mb-2">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Moved KYC check from step 7 → step 1"
                  className="w-full bg-[#1A1820] border border-white/[0.08] rounded-xl px-4 py-3 text-[14px] text-white placeholder-slate-500 focus:outline-none focus:border-primary-400 transition-colors"
                  autoFocus
                />
              </div>

              {/* Privacy Toggle */}
              <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl">
                <div>
                  <h4 className="text-[14px] font-bold text-white mb-1 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-slate-400" /> Private Decision
                  </h4>
                  <p className="text-[12px] text-slate-400">Only visible to you and invited builders. Observers cannot see this.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPrivate(!isPrivate)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isPrivate ? 'bg-primary-500' : 'bg-slate-700'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPrivate ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[13px] font-bold text-slate-400 mb-2">Description <span className="font-normal text-slate-600">(Optional)</span></label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Why was this decision made? What's the impact?"
                  className="w-full bg-[#1A1820] border border-white/[0.08] rounded-xl px-4 py-3 text-[14px] text-white placeholder-slate-500 focus:outline-none focus:border-primary-400 transition-colors resize-none h-24 mb-3"
                />
                {mediaPreview && (
                  <div className="relative w-[150px] mb-3 group/preview">
                    <div className="rounded-xl overflow-hidden border border-white/[0.08] bg-[#1A1820]">
                      <SmartImage src={mediaPreview} aspectRatio="auto" alt="Upload preview" className="max-h-[120px] object-cover" />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setMediaPreview(null)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-slate-800 text-white rounded-full flex items-center justify-center opacity-0 group-hover/preview:opacity-100 transition-opacity hover:bg-slate-700 shadow-sm"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <div className="flex gap-2">
                  <label className="flex items-center gap-2 px-3 py-2 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.08] text-slate-300 rounded-lg text-[12px] font-bold cursor-pointer transition-all">
                    <ImageIcon className="w-4 h-4 text-primary-400" />
                    Attach Image
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
                </div>
              </div>

              {/* External Link */}
              <div>
                <label className="block text-[13px] font-bold text-slate-400 mb-2 flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5" /> Link <span className="font-normal text-slate-600">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={externalLink}
                  onChange={e => setExternalLink(e.target.value)}
                  placeholder="e.g. Figma, Notion, GitHub PR..."
                  className="w-full bg-[#1A1820] border border-white/[0.08] rounded-xl px-4 py-3 text-[14px] text-white placeholder-slate-500 focus:outline-none focus:border-primary-400 transition-colors"
                />
              </div>
            </form>
            <div className="p-5 border-t border-white/[0.08] bg-[#0D0B14] shrink-0">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl font-bold text-[14px] text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !title.trim()}
                  className="flex-[2] py-3 rounded-xl font-bold text-[14px] text-white bg-primary-400 hover:bg-[#7a6ce0] disabled:bg-slate-700 disabled:text-slate-400 transition-colors shadow-[0_0_20px_rgba(139,124,248,0.2)] disabled:shadow-none"
                >
                  {isSubmitting ? 'Logging...' : 'Log Decision'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(modalContent, document.body);
}
