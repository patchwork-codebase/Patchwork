import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, MessageSquare } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { UserAvatar } from '../ui/UserAvatar';

interface Props {
  onSignup: () => void;
  audience?: string;
}

// QuickFleet-style: each word animates in with a stagger
const WordReveal = ({ text, className = "", delay = 0 }: { text: string; className?: string; delay?: number }) => {
  const words = text.split(' ');
  return (
    <span className={className}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden">
          <motion.span
            className="inline-block"
            initial={{ y: '110%', opacity: 0 }}
            animate={{ y: '0%', opacity: 1 }}
            transition={{
              duration: 0.75,
              ease: [0.16, 1, 0.3, 1],
              delay: delay + i * 0.08,
            }}
          >
            {word}{i < words.length - 1 ? '\u00a0' : ''}
          </motion.span>
        </span>
      ))}
    </span>
  );
};

export function LandingHeroCapstone({ onSignup, audience = "builders" }: Props) {
  const { user, profile } = useAuth();
  const metadata = user?.user_metadata || {};
  const builderName = profile?.name || metadata.full_name || metadata.name || user?.email?.split('@')[0] || 'Akin Rodolu';
  const avatarUrl = profile?.avatar || profile?.avatarUrl || profile?.avatar_url || metadata.avatar_url || metadata.avatar;

  // Dynamic copy based on audience
  const getCopy = () => {
    switch (audience) {
      case 'designers': return { w1: "Design.", w2: "Validate.", w3: "Grow.", desc: "Designers use Patchwork to document UX decisions, collaborate with PMs, and build a verified portfolio of shipped products." };
      case 'pms': return { w1: "Strategize.", w2: "Align.", w3: "Grow.", desc: "Product Managers use Patchwork to write PRDs in public, get feedback from senior operators, and prove their product sense." };
      case 'founders': return { w1: "Launch.", w2: "Validate.", w3: "Grow.", desc: "Founders use Patchwork to log their startup journey, build an early audience, and prove traction to investors." };
      case 'hrs': return { w1: "Scout.", w2: "Verify.", w3: "Hire.", desc: "Recruiters use Patchwork to find talent with verified proof of work, moving beyond resumes to actual product decisions." };
      case 'observers': return { w1: "Review.", w2: "Validate.", w3: "Coach.", desc: "Senior leaders use Patchwork to mentor rising talent, review architecture, and scout the best builders for their teams." };
      default: return { w1: "Build.", w2: "Collaborate.", w3: "Grow.", desc: "Patchwork is where builders document their work, collaborate with teams, receive expert feedback, and create a verified record of their impact." };
    }
  };
  const copy = getCopy();

  return (
    <section className="relative min-h-[92vh] flex flex-col justify-end pb-20 sm:pb-28 overflow-hidden bg-[#0F172A] px-5 sm:px-8 lg:px-12 pt-36">
      {/* Subtle background texture */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-30%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary-500/8 blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-violet-500/6 blur-[100px]" />
      </div>

      <div className="mx-auto max-w-7xl w-full relative z-10">
        {/* QuickFleet-style: massive, bold, viewport-spanning headline */}
        <div className="mb-10">
          {/* Label — like QuickFleet's "Abuja first · Launching 2026" tag */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-bold uppercase tracking-[0.18em] text-primary-400 mb-8 border border-primary-500/25 bg-primary-500/8 px-3 py-1.5 rounded-full"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse" />
            Build in public · For real
          </motion.div>

          {/* Giant headline - QuickFleet uses 8–12vw type that bleeds off screen */}
          <h1 className="font-black tracking-tighter leading-[0.92] text-white">
            <span className="block text-[13vw] sm:text-[9vw] lg:text-[8vw]">
              <WordReveal text={copy.w1} delay={0.1} />
            </span>
            <span className="block text-[13vw] sm:text-[9vw] lg:text-[8vw]">
              <WordReveal text={copy.w2} delay={0.25} />
            </span>
            <span className="block text-[13vw] sm:text-[9vw] lg:text-[8vw] text-primary-400">
              <WordReveal text={copy.w3} delay={0.4} />
            </span>
          </h1>
        </div>

        {/* QuickFleet bottom separator: a horizontal rule that animates in, with copy left + CTA right */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="border-t border-white/10 pt-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6"
        >
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl text-lg sm:text-xl text-slate-400 leading-relaxed font-medium"
          >
            {copy.desc}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0"
          >
            <button
              onClick={onSignup}
              className="group flex items-center gap-2.5 text-base sm:text-lg font-bold text-white hover:text-primary-400 transition-colors duration-200"
            >
              Start building now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
            </button>
            <button
              onClick={onSignup}
              className="px-6 py-3 rounded-full bg-primary-500 hover:bg-primary-600 text-white font-bold text-sm transition-all duration-200 shadow-[0_8px_30px_rgba(255,91,34,0.3)] hover:shadow-[0_8px_40px_rgba(255,91,34,0.45)] hover:-translate-y-0.5"
            >
              Join for free
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* Floating mockup — anchored bottom-right, QuickFleet style */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.7, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="absolute right-4 sm:right-10 lg:right-12 top-28 sm:top-24 w-72 sm:w-80 lg:w-96 hidden lg:block"
      >
        {/* Glow */}
        <div className="absolute -inset-4 bg-primary-500/10 rounded-[40px] blur-2xl pointer-events-none" />

        <div className="relative bg-[#0d0d0d] border border-white/8 rounded-2xl shadow-2xl overflow-hidden">
          {/* Bar */}
          <div className="h-10 border-b border-white/8 bg-[#111] flex items-center px-4 gap-2 shrink-0">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-white/15" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/15" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/15" />
            </div>
            <div className="flex-1 text-center text-[10px] font-bold text-slate-500 font-mono">patchwork / moniflow-dashboard</div>
          </div>

          <div className="p-4 space-y-3">
            {/* Mockup card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="bg-[#111] border border-white/5 rounded-xl p-4"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-[#1a1a1a] ring-1 ring-white/10 flex items-center justify-center font-bold text-white shrink-0 overflow-hidden">
                  <UserAvatar userId={user?.id || ''} name={builderName} avatarUrl={avatarUrl} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-bold text-white">{builderName}</div>
                  <div className="text-[10px] text-slate-400 font-medium">MoniFlow Dashboard</div>
                </div>
              </div>
              <p className="text-[12px] text-slate-300 leading-relaxed font-medium">
                Scrapped v1 onboarding — drop-off on KYC was too high. Moving verification post-first listing.
              </p>
              <div className="mt-3 flex items-center gap-3 text-slate-500 text-[10px] font-bold">
                <span>🔥 5</span>
                <span>👀 2</span>
                <span>💬 1</span>
                <span className="ml-auto text-[9px] font-bold border border-primary-500/25 text-primary-400 bg-primary-500/8 px-2 py-0.5 rounded-full">⚡ Decision</span>
              </div>
            </motion.div>

            {/* Observer reply */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: 10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ delay: 1.4, type: 'spring', stiffness: 200 }}
              className="bg-[#0f1a0f] border border-emerald-500/15 rounded-xl p-3 flex items-start gap-2"
            >
              <div className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0 ring-1 ring-emerald-500/25">S</div>
              <div>
                <div className="text-[10px] font-bold text-emerald-400 mb-0.5">Sarah (Observer)</div>
                <p className="text-[10px] text-slate-400 leading-relaxed">Great call. Matches what Stripe saw. Consider a soft listing limit until KYC passes?</p>
              </div>
            </motion.div>

            {/* Notification badge */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.0 }}
              className="bg-[#1C1A24] border border-white/8 rounded-xl p-3 flex items-start gap-2.5"
            >
              <div className="w-7 h-7 rounded-full bg-primary-500/15 flex items-center justify-center shrink-0 text-primary-400 border border-primary-500/25">
                <MessageSquare className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-white">Insight Validated</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Your KYC decision earned +5 reputation.</p>
              </div>
            </motion.div>
          </div>

          {/* Fake input */}
          <div className="p-3 bg-[#0a0a0a] border-t border-white/5">
            <div className="h-8 bg-[#1a1a1a] rounded-lg flex items-center px-3 justify-between border border-white/5">
              <span className="text-[11px] text-slate-500">Log a new decision...</span>
              <div className="w-5 h-5 rounded-md bg-primary-500 text-white flex items-center justify-center">
                <ArrowRight className="w-2.5 h-2.5" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
