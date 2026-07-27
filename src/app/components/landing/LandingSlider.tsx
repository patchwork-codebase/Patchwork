import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, LayoutGrid, MessageSquare, ShieldCheck, CheckCircle2 } from 'lucide-react';

const slides = [
  {
    id: "experience",
    eyebrow: "Experience",
    headline: "Real Product Experience",
    description: "Step into realistic PM simulations across industries like HealthTech, fintech, and consumer products. Write PRDs, prioritise features, and navigate the same challenges Product Managers face every day.",
    buttonText: "Browse simulations",
    gradient: "from-[#FF5B22] to-amber-500",
    theme: "orange",
  },
  {
    id: "collaboration",
    eyebrow: "Collaboration",
    headline: "Build With The Best",
    description: "Stop working in silos. Collaborate with peers and get actionable feedback from senior operators in real-time. Turn your isolated side-projects into professional team experiences.",
    buttonText: "View community",
    gradient: "from-blue-500 to-indigo-500",
    theme: "blue",
  },
  {
    id: "proof",
    eyebrow: "Proof of Work",
    headline: "Verifiable Track Record",
    description: "Generate a verified scorecard at the end of every simulation. Prove your skills to recruiters with quantifiable impact instead of relying on an empty resume.",
    buttonText: "See scorecards",
    gradient: "from-emerald-500 to-teal-500",
    theme: "emerald",
  }
];

// Helper components for the mockups
const SimulationMockup = () => (
  <div className="bg-[#0f0f0f] rounded-2xl border border-white/10 p-6 shadow-2xl w-full max-w-md mx-auto">
    <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
      <div>
        <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Simulation Library</div>
        <div className="text-white font-bold">Pick your room</div>
      </div>
      <div className="text-[10px] text-[#FF5B22] font-bold">24 SIMS · 6 INDUSTRIES</div>
    </div>
    <div className="space-y-3">
      {[
        { id: 'MM', title: 'Product Manager', cat: 'HEALTHTECH', days: '7 Days', color: 'bg-emerald-400' },
        { id: 'KP', title: 'Senior PM · Launch', cat: 'FINTECH', days: '5 Days', color: 'bg-[#FF5B22]' },
        { id: 'CG', title: 'Growth PM', cat: 'CONSUMER', days: '6 Days', color: 'bg-purple-500' }
      ].map((item, i) => (
        <div key={i} className="flex items-center gap-4 p-3 rounded-xl border border-white/5 bg-white/[0.02]">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold text-white ${item.color}`}>
            {item.id}
          </div>
          <div>
            <div className="text-[9px] text-slate-400 font-bold tracking-wider">{item.cat}</div>
            <div className="text-sm font-bold text-white">{item.title}</div>
          </div>
          <div className="ml-auto text-xs text-slate-500">{item.days}</div>
        </div>
      ))}
    </div>
  </div>
);

const CollaborationMockup = () => (
  <div className="bg-[#0f0f0f] rounded-2xl border border-white/10 p-6 shadow-2xl w-full max-w-md mx-auto">
    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 p-0.5">
        <div className="w-full h-full bg-[#0f0f0f] rounded-full flex items-center justify-center">
          <MessageSquare className="w-4 h-4 text-blue-400" />
        </div>
      </div>
      <div>
        <div className="text-white font-bold">Design Review</div>
        <div className="text-xs text-slate-400">3 peers online</div>
      </div>
    </div>
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="w-6 h-6 rounded-full bg-slate-800 shrink-0" />
        <div className="bg-white/5 rounded-2xl rounded-tl-sm p-3 text-sm text-slate-300">
          I think we should optimize the onboarding flow first.
        </div>
      </div>
      <div className="flex gap-3 flex-row-reverse">
        <div className="w-6 h-6 rounded-full bg-blue-500 shrink-0" />
        <div className="bg-blue-500/20 text-blue-100 rounded-2xl rounded-tr-sm p-3 text-sm border border-blue-500/30">
          Agreed. I drafted a PRD for the new funnel. Check it out!
        </div>
      </div>
      <div className="flex gap-3">
        <div className="w-6 h-6 rounded-full bg-emerald-500 shrink-0 flex items-center justify-center text-white">
          <ShieldCheck className="w-3 h-3" />
        </div>
        <div className="bg-emerald-500/10 rounded-2xl rounded-tl-sm p-3 text-sm text-emerald-200 border border-emerald-500/20">
          <span className="font-bold text-emerald-400 text-xs uppercase tracking-wider block mb-1">Mentor Note</span>
          Great initiative. Make sure you align with engineering on the API limits.
        </div>
      </div>
    </div>
  </div>
);

const ScorecardMockup = () => (
  <div className="bg-[#FAFAF9] rounded-2xl border border-white/10 p-6 shadow-2xl w-full max-w-md mx-auto text-slate-900">
    <div className="flex justify-between items-start mb-6 pb-4 border-b border-slate-200">
      <div>
        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Acme Corp · Senior PM</div>
        <div className="text-lg font-bold text-slate-900">Sarah K.</div>
      </div>
      <div className="text-right">
        <div className="text-2xl font-black text-emerald-500 leading-none">92</div>
        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">/ 100 · PASS</div>
      </div>
    </div>
    <div className="space-y-3 mb-6">
      {[
        { label: "Stakeholder comms", score: 95, width: "95%" },
        { label: "Trade-off reasoning", score: 88, width: "88%" },
        { label: "Prioritization", score: 92, width: "92%" },
        { label: "Documentation", score: 94, width: "94%" }
      ].map((skill, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-slate-600 w-28 truncate">{skill.label}</span>
          <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: skill.width }}></div>
          </div>
          <span className="text-[10px] font-bold text-slate-900 w-6 text-right">{skill.score}</span>
        </div>
      ))}
    </div>
    <div className="flex gap-3 pt-4 border-t border-slate-200">
      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
      <p className="text-xs text-slate-600 font-medium leading-relaxed">
        "Exceptional logic in handling the edge cases. Senior-ready."
      </p>
    </div>
  </div>
);


export function LandingSlider() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;
    
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 6000); // 6 seconds per slide

    return () => clearInterval(timer);
  }, [isHovered]);

  const slide = slides[activeSlide];

  return (
    <section 
      className="bg-[#111111] py-24 sm:py-32 overflow-hidden border-t border-white/5"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Text Content */}
          <div className="max-w-xl h-full flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="min-h-[280px]"
              >
                <p className={`inline-block text-[11px] font-bold bg-clip-text text-transparent bg-gradient-to-r ${slide.gradient} tracking-wider mb-4 uppercase`}>
                  {slide.eyebrow}
                </p>
                <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight leading-[1.1] mb-6">
                  {slide.headline}
                </h2>
                <p className="text-slate-400 text-sm sm:text-base leading-relaxed font-medium mb-8 max-w-md">
                  {slide.description}
                </p>
                <button className="flex items-center gap-2 text-sm font-bold text-white hover:opacity-80 transition bg-[#1a1a1a] border border-white/10 px-5 py-2.5 rounded-full shadow-lg hover:shadow-xl w-fit">
                  {slide.buttonText}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            </AnimatePresence>

            {/* Pagination Indicators (Dashes) */}
            <div className="flex items-center gap-2 mt-8">
              {slides.map((s, idx) => {
                const isActive = activeSlide === idx;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSlide(idx)}
                    className="h-1.5 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
                    style={{
                      width: isActive ? '24px' : '6px',
                      backgroundColor: isActive ? 'transparent' : 'rgba(255,255,255,0.1)'
                    }}
                    aria-label={`Go to slide ${idx + 1}`}
                  >
                    {isActive && (
                      <motion.div 
                        layoutId="activeSlideIndicator"
                        className={`absolute inset-0 w-full h-full bg-gradient-to-r ${s.gradient}`}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Visual Content */}
          <div className="relative h-[400px] w-full flex items-center justify-center rounded-2xl overflow-hidden">
            {/* Dynamic Animated Background Base */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`bg-${slide.id}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className={`absolute inset-0 bg-gradient-to-br ${slide.gradient} opacity-40`}
              />
            </AnimatePresence>

            {/* Inner texture and mockup */}
            <div className="relative z-10 w-full px-4 sm:px-12">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`mockup-${slide.id}`}
                  initial={{ opacity: 0, scale: 0.95, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 1.05, x: -20 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  {slide.id === 'experience' && <SimulationMockup />}
                  {slide.id === 'collaboration' && <CollaborationMockup />}
                  {slide.id === 'proof' && <ScorecardMockup />}
                </motion.div>
              </AnimatePresence>
            </div>
            
            {/* Blur overlay for depth */}
            <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(17,17,17,1)] pointer-events-none" />
          </div>

        </div>
      </div>
    </section>
  );
}
