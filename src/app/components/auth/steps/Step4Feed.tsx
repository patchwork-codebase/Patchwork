import React from "react";
import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { motion } from "motion/react";

interface Step4FeedProps {
  role: 'builder' | 'observer';
  firstUpdate: string;
  setFirstUpdate: (val: string) => void;
  feedFocus: string;
  setFeedFocus: (val: string) => void;
  onNext: () => void;
  onBack: () => void;
  loading?: boolean;
  loadingMessage?: string;
}

export function Step4Feed({
  role, firstUpdate, setFirstUpdate, feedFocus, setFeedFocus, onNext, onBack, loading, loadingMessage
}: Step4FeedProps) {
  const value = role === 'observer' ? feedFocus : firstUpdate;
  const setValue = role === 'observer' ? setFeedFocus : setFirstUpdate;

  return (
    <div className="space-y-6 bg-white/[0.02] border border-white/[0.06] rounded-[32px] p-8 md:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#8B7CF8]/50 to-transparent opacity-50" />
      <div>
        <span className="text-[11px] font-mono text-[#8B7CF8] font-bold uppercase tracking-widest">Step 4 of 5</span>
        <h2 className="text-[32px] font-extrabold text-white tracking-tight mt-2 font-display">
          {role === 'observer' ? 'What updates matter most to you?' : 'Post your first update'}
        </h2>
        <p className="text-[14px] text-slate-400 mt-2 font-medium">
          {role === 'observer'
            ? 'Tell us the kinds of signals you want to see in your feed so we can make your observer experience more relevant.'
            : "Write what's actually happening with your build right now — a decision you just made, something you scrapped, a question you're stuck on."}
        </p>
      </div>

      <div className="bg-[#6C5CE7]/10 border border-[#6C5CE7]/20 rounded-2xl p-5 mt-6">
        <p className="text-[13px] text-[#8B7CF8] leading-relaxed font-medium">
          {role === 'observer'
            ? '💡 Good observer notes: the decisions you care about · the updates you want to react to · the types of builders you want to follow.'
            : '💡 Good first updates: a decision you just made and why · something you thought would work but did not · the hardest open question in your build right now.'}
        </p>
      </div>

      <div className="pt-2">
        <label className="text-[12px] font-bold text-slate-300 mb-2 block uppercase tracking-widest">
          {role === 'observer' ? 'Observer feed focus' : 'Your first update'}
        </label>
        <textarea
          rows={5}
          placeholder={role === 'observer'
            ? 'e.g. I want updates about product decisions, launch cadence, and user research learnings.'
            : 'e.g. Just scrapped the full merchant onboarding flow — it was 9 steps and promoters were dropping off at step 4. Moving KYC check to step 1 and cutting everything else down to 4 steps.'}
          value={value}
          onChange={e => setValue(e.target.value)}
          className="w-full px-5 py-4 bg-[#0A0910]/50 border border-white/[0.08] rounded-xl text-[14px] focus:outline-none focus:border-transparent focus:ring-2 focus:ring-[#8B7CF8]/50 text-white font-medium resize-none transition-all placeholder-slate-600"
        />
      </div>

      <div className="flex gap-4 pt-6">
        <motion.button
          whileHover={{ scale: (loading || !value) ? 1 : 1.02 }}
          whileTap={{ scale: (loading || !value) ? 1 : 0.98 }}
          onClick={onNext}
          disabled={loading || !value}
          className="px-8 py-3.5 bg-white text-[#0A0910] text-[14px] font-extrabold rounded-full transition-all flex items-center gap-2 disabled:opacity-50 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" />{loadingMessage || 'Saving...'}</>
          ) : (
            <>Continue <ArrowRight className="w-4 h-4" /></>
          )}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onBack}
          className="px-8 py-3.5 border border-white/[0.08] rounded-full text-[14px] font-bold hover:bg-white/[0.05] text-white transition-all flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </motion.button>
      </div>
    </div>
  );
}
