import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ArrowRight, Hammer, Rss, Compass, UserCircle } from "lucide-react";

/* ─── Slide definitions ─────────────────────────────────────────── */
interface Slide {
  icon: React.ReactNode;
  accent: string;
  tag: string;
  title: string;
  description: string;
  tip: string;
}

const SLIDES: Slide[] = [
  {
    icon: <Hammer className="w-8 h-8" />,
    accent: "#6C5CE7",
    tag: "Rooms",
    title: "Your build, out in the open",
    description:
      "A Room is your public build space. Open one for each project, product, or idea. It's where you post raw updates — decisions, pivots, blockers — for your observers to follow in real time.",
    tip: "💡 Hit 'Create Room' from the sidebar or dashboard to get started.",
  },
  {
    icon: <Rss className="w-8 h-8" />,
    accent: "#0EA5E9",
    tag: "Feed",
    title: "The messy truth from builders",
    description:
      "Your Global Timeline shows updates from every active builder on Patchwork. Switch to the 'Following' tab to see only rooms you follow. Use 'My Rooms' to track your own activity.",
    tip: "💡 React, comment, or bookmark updates to signal what resonates.",
  },
  {
    icon: <Compass className="w-8 h-8" />,
    accent: "#10B981",
    tag: "Explore",
    title: "Discover builders like you",
    description:
      "The Explore tab surfaces builders and rooms from across the community — searchable by domain, skill, or stage. Find someone building something exciting and follow their room.",
    tip: "💡 Filter by domain (Product, Design, Engineering…) to narrow results.",
  },
  {
    icon: <UserCircle className="w-8 h-8" />,
    accent: "#F59E0B",
    tag: "Your Profile",
    title: "Your reputation grows here",
    description:
      "Every update you post, every observer you earn, and every reaction you receive adds to your reputation score. Your profile is your builder identity — share it proudly.",
    tip: "💡 Complete your profile setup checklist on the dashboard to unlock the full experience.",
  },
];

/* ─── Storage key ────────────────────────────────────────────────── */
const tourSeenKey = (userId: string) => `patchwork_tour_seen_${userId}`;

/* ─── Component ─────────────────────────────────────────────────── */
interface WelcomeTourProps {
  userId: string;
  userName: string;
}

export function WelcomeTour({ userId, userName }: WelcomeTourProps) {
  const [visible, setVisible] = useState(false);
  const [slide, setSlide] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back

  useEffect(() => {
    try {
      const seen = localStorage.getItem(tourSeenKey(userId));
      if (!seen) setVisible(true);
    } catch {
      // localStorage unavailable — don't show tour
    }
  }, [userId]);

  function dismiss() {
    try {
      localStorage.setItem(tourSeenKey(userId), "true");
    } catch {}
    setVisible(false);
  }

  function goTo(next: number) {
    setDirection(next > slide ? 1 : -1);
    setSlide(next);
  }

  function next() {
    if (slide < SLIDES.length - 1) goTo(slide + 1);
    else dismiss();
  }

  function prev() {
    if (slide > 0) goTo(slide - 1);
  }

  const current = SLIDES[slide];

  const variants = {
    enter: (d: number) => ({ opacity: 0, x: d * 40 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: d * -40 }),
  };

  const firstName = userName?.split(" ")[0] || "there";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="tour-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && dismiss()}
        >
          <motion.div
            key="tour-card"
            initial={{ opacity: 0, y: 60, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="relative w-full sm:max-w-[480px] bg-[#0D0B14] border border-white/[0.1] rounded-t-[28px] sm:rounded-[28px] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.8)]"
          >
            {/* Accent gradient strip */}
            <motion.div
              animate={{ backgroundColor: current.accent + "40" }}
              transition={{ duration: 0.4 }}
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: `linear-gradient(90deg, transparent, ${current.accent}80, transparent)` }}
            />

            {/* Drag handle (mobile) */}
            <div className="flex justify-center pt-3 pb-0 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-white/10" />
            </div>

            {/* Close button */}
            <button
              onClick={dismiss}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center text-slate-500 hover:text-white transition-all z-10"
              aria-label="Close tour"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Slide content */}
            <div className="px-6 pt-5 pb-6 sm:px-8 sm:pt-7 sm:pb-8 min-h-[380px] flex flex-col">

              {/* Step counter */}
              <div className="flex items-center gap-2 mb-5">
                <span
                  className="text-[10px] font-bold font-mono uppercase tracking-[0.18em] px-2.5 py-1 rounded-full border"
                  style={{ color: current.accent, borderColor: current.accent + "40", background: current.accent + "15" }}
                >
                  {current.tag}
                </span>
                <span className="text-[11px] text-slate-600 font-mono">
                  {slide + 1} / {SLIDES.length}
                </span>
              </div>

              {/* Animated slide body */}
              <div className="flex-1 relative overflow-hidden">
                <AnimatePresence custom={direction} mode="wait">
                  <motion.div
                    key={slide}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="absolute inset-0 flex flex-col"
                  >
                    {/* Icon */}
                    <motion.div
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1, type: "spring", stiffness: 400, damping: 20 }}
                      className="w-16 h-16 rounded-[20px] flex items-center justify-center mb-5 shrink-0"
                      style={{ background: current.accent + "18", color: current.accent, border: `1.5px solid ${current.accent}30` }}
                    >
                      {current.icon}
                    </motion.div>

                    {/* Heading */}
                    {slide === 0 && (
                      <p className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-[0.15em] mb-1">
                        Hey {firstName} 👋
                      </p>
                    )}
                    <h2 className="text-[22px] sm:text-[24px] font-extrabold text-white leading-tight tracking-tight mb-3">
                      {current.title}
                    </h2>
                    <p className="text-[14px] text-slate-400 leading-relaxed mb-5">
                      {current.description}
                    </p>

                    {/* Tip */}
                    <div className="mt-auto bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
                      <p className="text-[12.5px] text-slate-400 leading-relaxed">{current.tip}</p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Navigation row */}
              <div className="flex items-center justify-between mt-6 gap-3">
                {/* Back or Skip */}
                <button
                  onClick={slide === 0 ? dismiss : prev}
                  className="text-[13px] font-bold text-slate-500 hover:text-white transition-colors px-1 py-2 min-w-[56px]"
                >
                  {slide === 0 ? "Skip" : "← Back"}
                </button>

                {/* Dot pagination */}
                <div className="flex items-center gap-1.5">
                  {SLIDES.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => goTo(i)}
                      className="transition-all duration-300 rounded-full"
                      style={{
                        width: i === slide ? 20 : 6,
                        height: 6,
                        background: i === slide ? current.accent : "rgba(255,255,255,0.12)",
                      }}
                      aria-label={`Go to slide ${i + 1}`}
                    />
                  ))}
                </div>

                {/* Next or Finish */}
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={next}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-extrabold text-white transition-all shadow-lg min-w-[90px] justify-center"
                  style={{ background: `linear-gradient(135deg, ${current.accent}, ${current.accent}cc)`, boxShadow: `0 4px 16px ${current.accent}40` }}
                >
                  {slide === SLIDES.length - 1 ? "Let's go!" : <>Next <ArrowRight className="w-3.5 h-3.5" /></>}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
