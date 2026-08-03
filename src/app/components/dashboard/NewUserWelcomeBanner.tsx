import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { X, Hammer, Rocket, MessageCircle, Users } from "lucide-react";

interface NewUserWelcomeBannerProps {
  userName: string;
  onDismiss: () => void;
}

const STEPS = [
  {
    icon: Hammer,
    color: "text-primary-400",
    bg: "bg-primary-400/10",
    title: "Create your first Room",
    description: "A Room is your public build space. Think of it as your project page where you share progress, decisions, and updates.",
    cta: "Create a Room",
    href: "/dashboard/create",
  },
  {
    icon: MessageCircle,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    title: "Post your first update",
    description: "Share what you're working on — a screenshot, a decision, a win, or a setback. Builders who share in public grow faster.",
    cta: null,
    href: null,
  },
  {
    icon: Users,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    title: "Attract observers",
    description: "Observers are your early supporters. They react to your updates, give you feedback, and amplify your work.",
    cta: null,
    href: null,
  },
];

export function NewUserWelcomeBanner({ userName, onDismiss }: NewUserWelcomeBannerProps) {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12, height: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative mb-6 rounded-[24px] overflow-hidden bg-gradient-to-br from-[#111111] via-[#1a1a1a] to-[#111111] border border-slate-100 dark:border-white/10 shadow-sm"
    >
      {/* Dismiss */}
      <button
        onClick={onDismiss}
        className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-all shadow-sm z-10"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <div className="p-5 sm:p-7">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-primary-500 flex items-center justify-center text-white text-[20px]">
            🎉
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-primary-400 mb-0.5">Welcome to Patchwork</p>
            <h2 className="text-[16px] sm:text-[19px] font-extrabold text-slate-900 dark:text-white leading-tight pr-8">
              You're in, {userName}! Here's how to get started.
            </h2>
          </div>
        </div>

        {/* Step Pills */}
        <div className="flex items-center gap-2 mb-5 overflow-x-auto scrollbar-hide pb-1">
          {STEPS.map((step, i) => (
            <button
              key={i}
              onClick={() => setActiveStep(i)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[12px] font-bold whitespace-nowrap transition-all shrink-0 ${
                activeStep === i
                  ? "bg-primary-500 border-primary-500 text-white"
                  : "bg-slate-50 dark:bg-[#1a1a1a] border-slate-200 dark:border-white/10 text-slate-400 hover:border-slate-300 dark:border-white/20 hover:text-white"
              }`}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${activeStep === i ? "bg-white/20 text-white" : "bg-white/10 text-slate-400"}`}>
                {i + 1}
              </span>
              {step.title.split(" ").slice(0, 3).join(" ")}
            </button>
          ))}
        </div>

        {/* Active Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="flex items-start gap-4 bg-slate-50 dark:bg-[#1a1a1a] rounded-[16px] p-4 border border-slate-100 dark:border-white/10 shadow-sm"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${STEPS[activeStep].bg}`}>
              {(() => {
                const Icon = STEPS[activeStep].icon;
                return <Icon className={`w-5 h-5 ${STEPS[activeStep].color}`} />;
              })()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-slate-900 dark:text-white mb-1">{STEPS[activeStep].title}</p>
              <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed">{STEPS[activeStep].description}</p>
              {STEPS[activeStep].cta && STEPS[activeStep].href && (
                <button
                  onClick={() => navigate(STEPS[activeStep].href!)}
                  className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-[12px] font-bold rounded-xl transition-all shadow-sm"
                >
                  <Rocket className="w-3.5 h-3.5" />
                  {STEPS[activeStep].cta}
                </button>
              )}
              {activeStep < STEPS.length - 1 && (
                <button
                  onClick={() => setActiveStep(i => i + 1)}
                  className="mt-3 ml-2 text-[12px] font-bold text-slate-500 dark:text-slate-400 hover:text-primary-500 transition-colors"
                >
                  Next →
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Step Dots */}
        <div className="flex items-center justify-center gap-1.5 mt-4">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveStep(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${activeStep === i ? "w-6 bg-primary-400" : "w-1.5 bg-white/10 hover:bg-white/20"}`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

