import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Target, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../auth/AuthContext";

interface PitchBountyModalProps {
  isOpen: boolean;
  onClose: () => void;
  updateId: string;
  observerId: string;
}

export function PitchBountyModal({ isOpen, onClose, updateId, observerId }: PitchBountyModalProps) {
  const [pitch, setPitch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!pitch.trim()) {
      toast.error("Please enter your pitch");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('bounty_applications')
        .insert({
          update_id: updateId,
          builder_id: user.id,
          observer_id: observerId,
          pitch_text: pitch.trim(),
          status: 'pending'
        });

      if (error) {
        if (error.code === '23505') {
          throw new Error("You have already applied for this bounty.");
        }
        throw error;
      }

      toast.success("Pitch submitted successfully!");
      onClose();
    } catch (err: any) {
      console.error('Error submitting pitch:', err);
      toast.error(err.message || "Failed to submit pitch.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#1a1a1a] rounded-[24px] border border-white/10 shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center">
                    <Target className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">Apply to Build This</h2>
                    <p className="text-sm text-slate-400 mt-1">Pitch why you're the right builder.</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <textarea
                value={pitch}
                onChange={(e) => setPitch(e.target.value)}
                placeholder="E.g. I've built 3 Web3 wallets, I can ship the MVP in 2 weeks..."
                className="w-full h-32 bg-black/50 border border-white/10 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 resize-none mb-6 text-sm"
              />

              <div className="flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-full text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !pitch.trim()}
                  className="px-6 py-2.5 rounded-full text-sm font-bold bg-cyan-500 text-black hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>
                      Send Pitch <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
