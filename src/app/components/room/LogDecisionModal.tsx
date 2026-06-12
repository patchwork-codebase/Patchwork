import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { X, CheckCircle, Zap, Target, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../auth/AuthContext";

interface LogDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  userId: string;
  onSuccess: () => void;
}

type DecisionType = 'decision' | 'scrapped' | 'blocker' | 'shipped';

const TYPE_OPTIONS: { id: DecisionType; label: string; icon: any; color: string; bg: string; border: string }[] = [
  { id: 'decision', label: 'Decision', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30' },
  { id: 'shipped', label: 'Shipped', icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30' },
  { id: 'blocker', label: 'Blocker', icon: AlertTriangle, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/30' },
  { id: 'scrapped', label: 'Scrapped', icon: X, color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/30' },
];

export function LogDecisionModal({ isOpen, onClose, roomId, userId, onSuccess }: LogDecisionModalProps) {
  const [type, setType] = useState<DecisionType>('decision');
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please provide a title for this decision.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('room_decisions').insert({
        room_id: roomId,
        builder_id: userId,
        type,
        title: title.trim(),
        description: description.trim() || null
      });

      if (error) throw error;

      toast.success("Decision logged successfully!");
      setTitle("");
      setDescription("");
      setType('decision');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(`Failed to log decision: ${err.message}`);
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
            className="bg-[#0D0B14] border border-white/[0.08] rounded-3xl w-full max-w-[500px] overflow-hidden relative z-10 shadow-2xl"
          >
            <div className="flex items-center justify-between p-5 border-b border-white/[0.08]">
              <h2 className="text-[18px] font-bold text-white">Log a decision</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                  className="w-full bg-[#1A1820] border border-white/[0.08] rounded-xl px-4 py-3 text-[14px] text-white placeholder-slate-500 focus:outline-none focus:border-[#8B7CF8] transition-colors"
                  autoFocus
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[13px] font-bold text-slate-400 mb-2">Description <span className="font-normal text-slate-600">(Optional)</span></label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Why was this decision made? What's the impact?"
                  className="w-full bg-[#1A1820] border border-white/[0.08] rounded-xl px-4 py-3 text-[14px] text-white placeholder-slate-500 focus:outline-none focus:border-[#8B7CF8] transition-colors resize-none h-24"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl font-bold text-[14px] text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !title.trim()}
                  className="flex-[2] py-3 rounded-xl font-bold text-[14px] text-white bg-[#8B7CF8] hover:bg-[#7a6ce0] disabled:bg-slate-700 disabled:text-slate-400 transition-colors shadow-[0_0_20px_rgba(139,124,248,0.2)] disabled:shadow-none"
                >
                  {isSubmitting ? 'Logging...' : 'Log Decision'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(modalContent, document.body);
}
