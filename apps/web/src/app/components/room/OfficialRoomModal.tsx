import { motion } from "motion/react";
import { X, Building } from "lucide-react";
import { useEffect } from "react";

interface OfficialRoomModalProps {
  open: boolean;
  onClose: () => void;
}

export function OfficialRoomModal({ open, onClose }: OfficialRoomModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-white dark:bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl w-full max-w-md relative overflow-hidden shadow-2xl z-10"
      >
        <div className="p-6 pb-8">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-500 flex items-center justify-center">
              <Building className="w-6 h-6" />
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <h2 className="text-[24px] font-extrabold text-slate-900 font-display leading-tight mb-3">
            Welcome to the Patchwork Room
          </h2>
          
          <p className="text-[15px] text-slate-500 leading-relaxed font-medium mb-8">
            This room is pinned for every builder on Patchwork. It is where the Patchwork team shares product updates, decisions, experiments, and progress as we build. You can follow our journey, drop feedback, and engage directly with the team here.
          </p>

          <button
            onClick={onClose}
            className="w-full py-3.5 bg-primary-500 hover:bg-[#5b4ed6] text-white rounded-xl text-[15px] font-bold transition-all active:scale-95 shadow-md flex items-center justify-center gap-2"
          >
            Got it, thanks!
          </button>
        </div>
      </motion.div>
    </div>
  );
}
