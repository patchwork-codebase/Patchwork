import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Linkedin, Loader2, Check } from 'lucide-react';
import { supabase, apiCall } from '../auth/AuthContext';
import { toast } from 'sonner';
import { useLinkedinAccount } from '../../hooks/useLinkedin';

interface LinkedInShareModalProps {
  open: boolean;
  onClose: () => void;
  roomId: string;
  userId: string;
  roomTitle: string;
}

export function LinkedInShareModal({ open, onClose, roomId, userId, roomTitle }: LinkedInShareModalProps) {
  const { data: linkedinAccount, isLoading: accountLoading } = useLinkedinAccount(userId);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [content, setContent] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open && linkedinAccount && !content && !success) {
      generateContent();
    }
  }, [open, linkedinAccount]);

  const generateContent = async () => {
    setLoading(true);
    try {
      const res = await apiCall(`/make-server-30db7d9e/linkedin/generate-post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id: roomId })
      });
      setContent(res.content);
    } catch (err: any) {
      toast.error('Failed to generate summary: ' + err.message);
      setContent(`🚀 Just wrapped another milestone on Patchwork: ${roomTitle}\n\nKey improvements:\n• [Add your points here]\n\nBuilding products means solving small problems that create better user experiences.\n\nFollow the journey:\nhttps://patchwork.com/dashboard/rooms/${roomId}\n\n#buildinpublic #product #engineering`);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!content.trim()) return;
    setPublishing(true);
    try {
      await apiCall(`/make-server-30db7d9e/linkedin/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id: roomId, content })
      });
      setSuccess(true);
      toast.success('Successfully published to LinkedIn!');
    } catch (err: any) {
      toast.error('Failed to publish: ' + err.message);
    } finally {
      setPublishing(false);
    }
  };

  if (!open) return null;

  const charCount = content.length;
  let statusColor = 'text-emerald-400';
  if (charCount > 2500) statusColor = 'text-yellow-400';
  if (charCount > 2900) statusColor = 'text-red-400';
  const isOverLimit = charCount > 3000;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-2xl bg-[#0D0B14] border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        >
          <div className="flex items-center justify-between p-6 border-b border-white/[0.04] shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#0077b5]/20 text-[#0077b5] rounded-xl flex items-center justify-center">
                <Linkedin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Share to LinkedIn</h3>
                <p className="text-sm text-slate-400">Share your milestone with your professional network.</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center text-slate-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1">
            {accountLoading || loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-[#0077b5] animate-spin mb-4" />
                <p className="text-slate-400 font-medium">Drafting your LinkedIn post...</p>
              </div>
            ) : success ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-6 border border-emerald-500/30">
                  <Check className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Published Successfully!</h3>
                <p className="text-slate-400 max-w-md mx-auto">
                  Your build log milestone has been shared to your LinkedIn feed. Keep building!
                </p>
                <button
                  onClick={onClose}
                  className="mt-8 px-6 py-3 bg-white/[0.05] hover:bg-white/[0.1] text-white rounded-xl font-bold transition-all"
                >
                  Close
                </button>
              </div>
            ) : !linkedinAccount ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-white/[0.02] border border-white/[0.05] rounded-2xl flex items-center justify-center mb-6">
                  <Linkedin className="w-8 h-8 text-slate-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">LinkedIn Not Connected</h3>
                <p className="text-slate-400 mb-8 max-w-sm">
                  You need to connect your LinkedIn account in your profile settings before you can share posts.
                </p>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-all"
                >
                  Got it
                </button>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[13px] font-bold text-slate-300">Edit Post</span>
                  <span className={`text-[12px] font-bold ${statusColor}`}>
                    {charCount} / 3000 chars
                  </span>
                </div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-[300px] bg-white/[0.02] border border-white/[0.08] rounded-2xl p-4 text-[14px] text-white placeholder-slate-500 focus:outline-none focus:border-[#0077b5]/50 focus:ring-1 focus:ring-[#0077b5]/30 transition-all resize-none"
                  placeholder="What did you build today?"
                />
                {isOverLimit && (
                  <p className="text-red-400 text-xs mt-2 font-medium">Your post exceeds the 3000 character limit. Please shorten it before publishing.</p>
                )}
              </div>
            )}
          </div>

          {!success && linkedinAccount && !loading && (
            <div className="p-6 border-t border-white/[0.04] flex justify-end gap-3 shrink-0 bg-[#0D0B14]">
              <button
                onClick={onClose}
                disabled={publishing}
                className="px-5 py-2.5 bg-white/[0.05] hover:bg-white/[0.1] text-white text-[13px] font-bold rounded-xl transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePublish}
                disabled={publishing || isOverLimit || !content.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#0077b5] hover:bg-[#006097] text-white text-[13px] font-bold rounded-xl transition-all shadow-lg disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077b5]/50"
              >
                {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Linkedin className="w-4 h-4" />}
                Publish to LinkedIn
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
