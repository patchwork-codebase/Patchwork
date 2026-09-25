import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Hammer, LayoutGrid, Zap, ArrowRight, X } from "lucide-react";

const SLIDES = [
  {
    icon: Hammer,
    title: "Welcome to Patchwork",
    description: "The home for world-class creators to build in public, share real updates, and get direct community feedback.",
    color: "text-amber-500",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  {
    icon: LayoutGrid,
    title: "Your Builder Room",
    description: "Create a Room for your product or idea. Post updates, launch polls, embed code & design files, and track your milestone roadmap.",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10 border-indigo-500/20",
  },
  {
    icon: Zap,
    title: "Earn Reputation & Proof-of-Work",
    description: "Engage with other builders, give sharp feedback, vote on product decisions, and build an on-chain/cryptographic credential.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
];

export function WelcomeWalkthroughModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const hasSeen = localStorage.getItem("patchwork_welcome_walkthrough_seen");
    if (!hasSeen) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("patchwork_welcome_walkthrough_seen", "true");
    setIsOpen(false);
  };

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      handleClose();
    }
  };

  if (!isOpen) return null;

  const slide = SLIDES[currentSlide];
  const Icon = slide.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md bg-white dark:bg-[#121214] border border-slate-200 dark:border-white/10 rounded-[32px] p-6 sm:p-8 shadow-2xl overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Slide Content */}
          <div className="flex flex-col items-center text-center mt-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border mb-6 ${slide.bg}`}>
              <Icon className={`w-8 h-8 ${slide.color}`} />
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-display mb-3">
              {slide.title}
            </h3>

            <p className="text-sm sm:text-[15px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed mb-8 max-w-sm">
              {slide.description}
            </p>

            {/* Pagination dots & Next button */}
            <div className="w-full flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-1.5">
                {SLIDES.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      currentSlide === i 
                        ? 'w-6 bg-primary-500' 
                        : 'w-1.5 bg-slate-200 dark:bg-white/20'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={handleNext}
                className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 active:scale-95 text-white font-bold text-sm px-5 py-2.5 rounded-full transition-all shadow-md cursor-pointer"
              >
                <span>{currentSlide === SLIDES.length - 1 ? "Get Started" : "Continue"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
