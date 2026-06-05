import React from "react";
import { Check, CalendarCheck, Loader2 } from "lucide-react";
import { motion } from "motion/react";

interface Step5OnboardingProps {
  role: 'builder' | 'observer';
  loading: boolean;
  callScheduled: boolean;
  setCallScheduled: (val: boolean) => void;
  onSubmit: () => void;
  onBack: () => void;
}

export function Step5Onboarding({
  role, loading, callScheduled, setCallScheduled, onSubmit, onBack
}: Step5OnboardingProps) {
  return (
    <div className="space-y-6 bg-white/[0.02] border border-white/[0.06] rounded-[32px] p-8 md:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-50" />
      <div>
        <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-widest">Final Step · 5 of 5</span>
        <h2 className="text-[32px] font-extrabold text-white tracking-tight mt-2 font-display">White-glove onboarding</h2>
        <p className="text-[14px] text-slate-400 mt-2 font-medium">As part of the founding cohort, we want to personally welcome you to Patchwork and help frame your first build room.</p>
      </div>

      <div className="bg-[#0A0910] border border-white/[0.08] rounded-2xl p-8 text-center mt-6 shadow-inner relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(16,185,129,0.05)_0%,transparent_70%)] pointer-events-none" />
        <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 relative z-10">
           <Check className="w-8 h-8 text-emerald-400" />
        </div>
        <h3 className="text-[18px] font-extrabold text-white font-display mb-2 relative z-10">Schedule your 20-min intro call</h3>
        <p className="text-[13px] text-slate-500 font-medium max-w-sm mx-auto mb-6 relative z-10">Choose a time that works for you. We'll chat about what you're building and how to get the best feedback.</p>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={() => setCallScheduled(true)}
          className={`px-6 py-3 border rounded-full text-[13px] font-bold transition-all relative z-10 flex items-center gap-2 mx-auto ${
            callScheduled
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-white/[0.05] border-white/[0.1] text-white hover:bg-white/[0.1]'
          }`}
        >
          {callScheduled ? (
            <><CalendarCheck className="w-4 h-4" /> Call Scheduled ✓</>
          ) : (
            <>Open Scheduling Calendar ↗</>
          )}
        </motion.button>
      </div>

      <div className="flex gap-4 pt-6">
        <motion.button
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          onClick={onSubmit}
          disabled={loading}
          className="flex-1 py-4 bg-gradient-to-r from-[#6C5CE7] to-[#8B7CF8] text-white text-[15px] font-extrabold rounded-full hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_0_20px_rgba(108,92,231,0.3)]"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {role === 'observer' ? 'Creating observer account...' : 'Publishing room...'}
            </>
          ) : (
            role === 'observer' ? 'Finish observer onboarding 🚀' : 'Publish & Enter Patchwork 🚀'
          )}
        </motion.button>
      </div>
      <div className="text-center">
        <button
          onClick={onBack}
          className="text-[12px] font-bold text-slate-500 hover:text-white transition-colors"
        >
          Wait, go back
        </button>
      </div>
    </div>
  );
}
