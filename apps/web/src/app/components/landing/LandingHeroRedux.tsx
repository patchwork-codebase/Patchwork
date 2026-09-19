import React, { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { ArrowRight, Sparkles } from "lucide-react";

interface LandingHeroReduxProps {
  onSignup: () => void;
}

export function LandingHeroRedux({ onSignup }: LandingHeroReduxProps) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Smooth out mouse tracking for a floaty feel
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize mouse coordinates to -1 to 1 range relative to center
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  // Generate random particles for the void
  const [particles] = useState(() => 
    Array.from({ length: 40 }).map(() => ({
      x: Math.random() * 100, // percentage
      y: Math.random() * 100, // percentage
      size: Math.random() * 4 + 1,
      parallaxFactor: Math.random() * 30 + 10,
      opacity: Math.random() * 0.5 + 0.1,
    }))
  );

  return (
    <section className="relative w-full min-h-screen pt-28 sm:pt-36 pb-20 bg-white overflow-x-hidden flex flex-col items-center justify-start">
      
      {/* Interactive Void Background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {particles.map((p, i) => {
          // Each particle moves slightly differently based on mouse
          const moveX = useTransform(springX, [-1, 1], [-p.parallaxFactor, p.parallaxFactor]);
          const moveY = useTransform(springY, [-1, 1], [-p.parallaxFactor, p.parallaxFactor]);
          
          return (
            <motion.div
              key={i}
              className="absolute rounded-full bg-primary-400"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                opacity: p.opacity,
                x: moveX,
                y: moveY,
                boxShadow: `0 0 ${p.size * 2}px rgba(139, 124, 248, 0.4)`
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [p.opacity, p.opacity * 2, p.opacity],
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          );
        })}
        
        {/* Giant interactive cursor glow */}
        <motion.div 
          className="absolute w-[600px] h-[600px] rounded-full bg-primary-500/10 blur-[100px] pointer-events-none -translate-x-1/2 -translate-y-1/2"
          style={{
            left: useTransform(springX, [-1, 1], ["0%", "100%"]),
            top: useTransform(springY, [-1, 1], ["0%", "100%"]),
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-5 w-full max-w-[1100px] pb-12">
        <motion.h1 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
          className="text-[32px] sm:text-[56px] md:text-[72px] leading-[1.1] font-display font-extrabold text-slate-900 mb-6 tracking-tight w-full"
        >
          The Operating System for{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 via-primary-600 to-indigo-600 whitespace-nowrap">
            Builders.
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="text-[15px] sm:text-[20px] text-slate-600 mb-10 max-w-[720px] leading-relaxed mx-auto font-medium"
        >
          Capture every decision, document every iteration, and collaborate with builders who help you grow. Share your journey, gather meaningful feedback, and build a living record of how you think, solve problems, and create products. All in one place.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-col sm:flex-row items-center gap-4 justify-center w-full mb-12"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onSignup}
            className="px-8 py-4 bg-slate-900 text-white hover:bg-slate-800 rounded-full font-bold text-[16px] border border-transparent shadow-xl shadow-slate-900/10 transition-all cursor-pointer"
          >
            Start your build log
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.href = '/login'}
            className="group px-8 py-4 bg-white/90 backdrop-blur-md text-slate-900 rounded-full font-bold text-[16px] border border-slate-200 flex items-center gap-2 hover:bg-slate-50 shadow-sm transition-all cursor-pointer"
          >
            Enter dashboard
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-slate-700" />
          </motion.button>
        </motion.div>

        {/* Interactive Build Room Sandbox Widget */}
        <HeroSandboxWidget />
      </div>

      {/* Scroll Down Indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none"
      >
        <span className="text-[11px] text-slate-400 uppercase tracking-widest font-bold">Scroll to explore</span>
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="w-[1px] h-10 bg-gradient-to-b from-primary-500/50 to-transparent"
        />
      </motion.div>

    </section>
  );
}

// --- Interactive Hero Sandbox Component ---
function HeroSandboxWidget() {
  const [activeTab, setActiveTab] = useState<'updates' | 'roadmap' | 'crossroads' | 'proof'>('updates');

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: 1 }}
      className="w-full max-w-[900px] bg-white/90 backdrop-blur-2xl rounded-3xl border border-slate-200/80 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] overflow-hidden text-left relative z-20 group"
    >
      {/* Sandbox Header Bar */}
      <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-rose-400/80" />
          <div className="w-3 h-3 rounded-full bg-amber-400/80" />
          <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
          <span className="ml-2 text-xs font-mono text-slate-400 font-semibold hidden sm:inline">patchwork.build/room/demo-build</span>
        </div>
        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[11px] font-bold border border-emerald-200/60">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Live Room Sandbox
        </div>
      </div>

      {/* Interactive Tabs */}
      <div className="flex items-center gap-2 px-4 pt-3 border-b border-slate-100 bg-white overflow-x-auto scrollbar-hide">
        {[
          { id: 'updates', label: '⚡ Live Updates' },
          { id: 'roadmap', label: '🗺️ Roadmap' },
          { id: 'crossroads', label: '🔀 Crossroads' },
          { id: 'proof', label: '🛡️ Proof of Work' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dynamic Tab Sandbox Content */}
      <div className="p-5 sm:p-6 min-h-[220px] bg-slate-50/40">
        {activeTab === 'updates' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <div className="p-4 bg-white rounded-2xl border border-slate-200/70 shadow-sm flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-primary-500 text-white font-bold text-xs flex items-center justify-center shrink-0">AO</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Akinrodolu Oluwaseun</span>
                  <span className="text-[10px] text-slate-400">Just now</span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Shipped ticket notifications & Edge function webhooks! Auto-invites non-room members to collaborate effortlessly. 🚀
                </p>
                <div className="mt-2.5 flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md">#feature</span>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md">v1.3 Released</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'roadmap' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-emerald-50/60 border border-emerald-200/60 rounded-2xl">
              <span className="text-[10px] font-bold uppercase text-emerald-700 tracking-wider">Now</span>
              <div className="mt-2 p-2.5 bg-white rounded-xl text-xs font-bold text-slate-800 shadow-sm">
                Interactive Hero Sandbox
              </div>
            </div>
            <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-2xl">
              <span className="text-[10px] font-bold uppercase text-amber-700 tracking-wider">Next</span>
              <div className="mt-2 p-2.5 bg-white rounded-xl text-xs font-bold text-slate-800 shadow-sm">
                Realtime Node Graph
              </div>
            </div>
            <div className="p-3 bg-primary-50/60 border border-primary-200/60 rounded-2xl">
              <span className="text-[10px] font-bold uppercase text-primary-700 tracking-wider">Completed</span>
              <div className="mt-2 p-2.5 bg-white rounded-xl text-xs font-bold text-slate-800 shadow-sm">
                Ticket Invitations
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'crossroads' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-white rounded-2xl border border-slate-200/70 shadow-sm">
            <span className="text-[10px] font-bold uppercase text-primary-600 tracking-wider">Community Crossroads Decision</span>
            <h4 className="text-xs font-bold text-slate-900 mt-1">Should we prioritize AI auto-summaries for build logs?</h4>
            <div className="mt-3 flex items-center gap-2">
              <button className="px-3 py-1.5 bg-primary-50 text-primary-700 text-xs font-bold rounded-lg border border-primary-200">
                Option A: Yes, auto-generate (78%)
              </button>
              <button className="px-3 py-1.5 bg-slate-50 text-slate-600 text-xs font-bold rounded-lg border border-slate-200">
                Option B: Manual only (22%)
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === 'proof' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-white rounded-2xl border border-slate-200/70 shadow-sm flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">Verified Builder Badge</span>
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-md">100% On-Chain Verifiable</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">12 Build Logs • 5 Crossroads Solved • 48 Staked Rationales</p>
            </div>
            <div className="px-3 py-1.5 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200">
              Verified ✓
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
