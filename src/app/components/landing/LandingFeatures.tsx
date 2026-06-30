import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { Layers, MessageSquareCode, CheckCircle2, Award, Users, Lock, ChevronDown } from "lucide-react";

const features = [
  {
    id: "01",
    icon: <Layers className="h-5 w-5" />,
    title: "Open a Live Build Room",
    desc: "Create a room tied directly to your current project or milestone. Frame what you're building so observers understand your goal.",
    color: "text-primary-600",
    bg: "bg-primary-50",
    border: "border-primary-200",
  },
  {
    id: "02",
    icon: <MessageSquareCode className="h-5 w-5" />,
    title: "Post Raw Updates",
    desc: "Share your process as it happens. Post sketches, logic flows, pivot decisions, and links. No need for polish, just truth.",
    color: "text-sage-600",
    bg: "bg-sage-50",
    border: "border-sage-200",
  },
  {
    id: "03",
    icon: <Users className="h-5 w-5" />,
    title: "Gather Structured Reactions",
    desc: "Observers react with three precise indicators: Sharp (valuable), Push back (disagree), or Tell me more (curious). No noise, just signal.",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  {
    id: "04",
    icon: <Award className="h-5 w-5" />,
    title: "Build Domain Reputation",
    desc: "Accumulate reputation points based on the quality of your updates and how constructively you build in your specific domain.",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  {
    id: "05",
    icon: <CheckCircle2 className="h-5 w-5" />,
    title: "Ship a Chronological Log",
    desc: "When you finish a milestone, your room timeline compiles into a permanent, beautiful portfolio piece that proves how you work.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  }
];

export function LandingFeatures() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section id="features" className="relative py-24 sm:py-32 bg-transparent border-t border-slate-200/50">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-5">
          <span className="inline-block text-[11px] uppercase tracking-[0.2em] font-bold text-primary-600 bg-primary-50 px-3 py-1 rounded-full border border-primary-200">
            How it works
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Build your portfolio in a flash.
          </h2>
          <p className="text-slate-600 text-[15px] sm:text-base leading-relaxed max-w-xl mx-auto font-medium">
            Stop waiting until launch day to share your work. Patchwork makes it effortless to capture value while you build.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-start max-w-5xl mx-auto">
          {/* Accordion List */}
          <div className="space-y-4">
            {features.map((feature, index) => {
              const isActive = index === activeIndex;
              return (
                <div 
                  key={feature.id}
                  onClick={() => setActiveIndex(index)}
                  className={`cursor-pointer rounded-2xl border transition-all duration-300 ${
                    isActive 
                      ? "border-slate-300 bg-white shadow-lg shadow-slate-200/50 p-6" 
                      : "border-transparent hover:bg-slate-50 p-4"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`text-sm font-mono font-bold ${isActive ? "text-slate-900" : "text-slate-400"}`}>
                      {feature.id}
                    </span>
                    <h3 className={`text-xl font-bold transition-colors ${isActive ? "text-slate-900" : "text-slate-600"}`}>
                      {feature.title}
                    </h3>
                  </div>
                  
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <p className="mt-4 text-slate-600 leading-relaxed pl-[3.25rem]">
                          {feature.desc}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Visual Showcase (Sticky) */}
          <div className="hidden lg:block sticky top-32">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.4 }}
                className="aspect-square rounded-[32px] border border-slate-200 bg-white shadow-xl shadow-slate-200/50 flex flex-col items-center justify-center p-12 text-center"
              >
                <div className={`w-20 h-20 rounded-3xl ${features[activeIndex].bg} border ${features[activeIndex].border} flex items-center justify-center mb-8 ${features[activeIndex].color}`}>
                  {features[activeIndex].icon}
                </div>
                <h4 className="text-2xl font-extrabold text-slate-900 mb-4">
                  {features[activeIndex].title}
                </h4>
                <p className="text-slate-500">
                  {features[activeIndex].desc}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
