import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Rocket, Box, Code2, Paintbrush2, Sparkles, CheckCircle2 } from "lucide-react";
import { getAvatarUrl } from "../../utils/helpers";

const useCases = [
  {
    id: "build",
    title: "Build Your Way",
    tagline: "Public or private rooms.",
    description: "Start building without pressure in a private space, or open your room to the public from Day 1 to build an audience and validate ideas.",
    icon: <Rocket className="w-5 h-5" />,
    color: "bg-blue-500",
    lightColor: "bg-blue-500/10",
    textColor: "text-blue-500",
    borderColor: "border-blue-500/20",
    avatar: getAvatarUrl("build-avatar"),
  },
  {
    id: "team",
    title: "Team Collaboration",
    tagline: "Invite team members.",
    description: "Bring your co-founders or teammates into your build room to collaborate, brainstorm, and align on project milestones securely.",
    icon: <Box className="w-5 h-5" />,
    color: "bg-primary-500",
    lightColor: "bg-primary-500/10",
    textColor: "text-primary-500",
    borderColor: "border-primary-500/20",
    avatar: getAvatarUrl("team-avatar"),
  },
  {
    id: "experts",
    title: "Expert Feedback",
    tagline: "Invite domain experts.",
    description: "Request high-signal reviews from verified talent to help you solve complex technical or design challenges with structured feedback.",
    icon: <Code2 className="w-5 h-5" />,
    color: "bg-emerald-500",
    lightColor: "bg-emerald-500/10",
    textColor: "text-emerald-500",
    borderColor: "border-emerald-500/20",
    avatar: getAvatarUrl("expert-avatar"),
  },
  {
    id: "ship",
    title: "Proof of Work",
    tagline: "Ship and share your log.",
    description: "Flip the switch to make your room public, exporting an interactive, chronological history of your iterations, pivots, and shipped features.",
    icon: <Paintbrush2 className="w-5 h-5" />,
    color: "bg-amber-500",
    lightColor: "bg-amber-500/10",
    textColor: "text-amber-500",
    borderColor: "border-amber-500/20",
    avatar: getAvatarUrl("ship-avatar"),
  }
];

const FounderStage = () => {
  const [count, setCount] = useState(142);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCount(prev => prev < 500 ? prev + Math.floor(Math.random() * 8) + 1 : prev);
    }, 400);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full h-full bg-white/50 rounded-2xl border border-slate-200 p-6 sm:p-8 flex flex-col justify-center items-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.15]" />
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="bg-white border border-slate-200 shadow-xl shadow-blue-500/10 rounded-3xl p-8 w-full max-w-sm z-10 text-center"
      >
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-500 shadow-sm border border-blue-100">
          <Rocket className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-extrabold text-slate-900 mb-1">MVP Waitlist</h3>
        <p className="text-sm text-slate-600 mb-8 font-medium">Early access signups for the beta launch</p>
        
        <div className="flex items-baseline justify-center gap-2 mb-8">
          <motion.span 
            key={count}
            initial={{ y: -5, opacity: 0.8 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-6xl font-black text-slate-900 tracking-tighter"
          >
            {count}
          </motion.span>
          <span className="text-lg font-bold text-slate-500">/ 500</span>
        </div>
        
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-5">
          <motion.div 
            className="h-full bg-blue-500 rounded-full"
            initial={{ width: "28%" }}
            animate={{ width: `${Math.min((count / 500) * 100, 100)}%` }}
            transition={{ type: "spring", bounce: 0 }}
          />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: count > 200 ? 1 : 0, y: count > 200 ? 0 : 10 }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-full text-xs font-bold"
        >
          <CheckCircle2 className="w-4 h-4" /> Traction Proved
        </motion.div>
      </motion.div>
    </div>
  );
};

const PMStage = () => {
  return (
    <div className="w-full h-full bg-white/50 rounded-2xl border border-slate-200 p-4 sm:p-6 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(#8b7cf8_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.15]" />
      
      <div className="w-full max-w-lg grid grid-cols-2 gap-4 z-10">
        {/* Column 1 */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 min-h-[340px]">
          <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-4 flex items-center justify-between">
            In Progress
            <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md text-[10px]">3</span>
          </h4>
          
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm mb-3 opacity-60">
            <div className="w-24 h-2.5 bg-slate-200 rounded-full mb-3" />
            <div className="w-16 h-2 bg-slate-100 rounded-full" />
          </div>
          
          <motion.div 
            initial={{ x: 0, y: 0, scale: 1, rotate: 0 }}
            animate={{ x: "110%", y: 30, scale: 1.02, rotate: 2 }}
            transition={{ delay: 0.8, duration: 0.8, ease: "easeInOut" }}
            className="bg-white border-2 border-primary-200 shadow-xl shadow-primary-500/10 rounded-xl p-4 z-20 relative cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="px-2 py-1 bg-primary-50 text-primary-600 text-[10px] font-bold uppercase rounded-md tracking-wide">Critical</span>
              <img loading="lazy" src={getAvatarUrl("pm-user")} className="w-6 h-6 rounded-full bg-slate-100" alt="avatar" />
            </div>
            <h5 className="text-[15px] font-bold text-slate-900 mb-2 leading-snug">Revamp Checkout Flow</h5>
            <p className="text-[13px] text-slate-600 leading-relaxed mb-4">Based on user interviews, moving KYC to step 1.</p>
            <div className="flex items-center justify-between mt-auto">
              <div className="flex -space-x-1">
                <div className="w-5 h-5 rounded-full border border-white bg-blue-100" />
                <div className="w-5 h-5 rounded-full border border-white bg-amber-100" />
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
          </motion.div>
        </div>
        
        {/* Column 2 */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 min-h-[340px]">
          <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-4 flex justify-between items-center">
            Shipped
            <motion.span 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }} 
              transition={{ delay: 1.6 }}
              className="bg-emerald-500 w-2 h-2 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
            />
          </h4>
          
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm mb-3 opacity-60">
            <div className="w-32 h-2.5 bg-slate-200 rounded-full mb-3" />
            <div className="w-20 h-2 bg-slate-100 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

const EngineerStage = () => {
  const [lines, setLines] = useState<number>(0);
  
  const logs = [
    "git push origin main",
    "Deploying Patchwork v2.4.1...",
    "Building static assets (24.5s)",
    "Uploading to edge network...",
    "Running database migrations...",
    "SUCCESS: Migration 2026_06_22_init.sql applied",
    "Deploy successful! ⚡️",
    "Live at: https://patchwork.run"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setLines(prev => prev < logs.length ? prev + 1 : prev);
    }, 500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full h-full bg-[#0D0B14] rounded-2xl border border-slate-800 p-6 sm:p-8 flex flex-col relative overflow-hidden shadow-2xl font-mono text-[13px] sm:text-[14px]">
      <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
        <div className="w-3 h-3 rounded-full bg-red-500/80" />
        <div className="w-3 h-3 rounded-full bg-amber-500/80" />
        <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
        <span className="ml-4 text-xs text-slate-500 font-sans font-medium">build-log.sh</span>
      </div>
      
      <div className="flex-1 space-y-2.5">
        <AnimatePresence>
          {logs.slice(0, lines).map((log, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex gap-3 ${i === logs.length - 2 ? 'text-emerald-400 font-bold' : i === logs.length - 1 ? 'text-cyan-400' : 'text-slate-300'}`}
            >
              <span className="text-slate-600 shrink-0 select-none">➜</span>
              <span>{log}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {lines < logs.length && (
          <motion.div 
            animate={{ opacity: [1, 0] }} 
            transition={{ repeat: Infinity, duration: 0.8 }}
            className="w-2.5 h-4 bg-emerald-500 inline-block ml-6 align-middle"
          />
        )}
      </div>
    </div>
  );
};

const DesignerStage = () => {
  return (
    <div className="w-full h-full bg-white/50 rounded-2xl border border-slate-200 p-6 sm:p-8 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.15]" />
      
      <div className="relative w-full max-w-sm aspect-[4/3] rounded-2xl overflow-hidden shadow-xl shadow-amber-500/5 border border-slate-200 bg-white">
        
        {/* Wireframe Layer (Bottom) */}
        <div className="absolute inset-0 p-6 flex flex-col bg-white">
          <div className="flex justify-between items-center mb-6">
            <div className="w-8 h-8 rounded-full border-2 border-slate-200" />
            <div className="w-24 h-4 rounded-full bg-slate-100" />
          </div>
          <div className="w-3/4 h-8 rounded-lg bg-slate-100 mb-4" />
          <div className="w-1/2 h-4 rounded-full bg-slate-50 mb-8" />
          
          <div className="grid grid-cols-2 gap-4 flex-1">
            <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50" />
            <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50" />
          </div>
        </div>

        {/* High-Fi Layer (Top, animated width) */}
        <motion.div 
          className="absolute inset-y-0 left-0 bg-white border-r border-amber-500 overflow-hidden"
          initial={{ width: "15%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 4, ease: "easeInOut", repeat: Infinity, repeatType: "reverse", repeatDelay: 1 }}
        >
          <div className="absolute inset-0 p-6 flex flex-col w-[380px] bg-white">
            <div className="flex justify-between items-center mb-6">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-orange-400 shadow-lg shadow-amber-500/20" />
              <div className="flex gap-2">
                <div className="w-8 h-4 rounded-full bg-slate-100" />
                <div className="px-2 h-4 rounded-full bg-amber-50 text-[9px] text-amber-600 font-extrabold tracking-wider flex items-center justify-center uppercase">New</div>
              </div>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Stunning UI</h2>
            <p className="text-sm text-slate-600 mb-8 max-w-[200px] leading-snug">Beautiful, glassmorphic interfaces that convert.</p>
            
            <div className="grid grid-cols-2 gap-4 flex-1">
              <div className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 shadow-xl shadow-slate-900/10 border border-slate-700 p-4 relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-amber-500/20 blur-xl rounded-full" />
              </div>
              <div className="rounded-xl bg-gradient-to-br from-amber-500 to-orange-400 shadow-xl shadow-amber-500/20 p-4 relative overflow-hidden">
                 <div className="absolute inset-0 bg-white/20 blur-sm transform -skew-x-12 translate-x-full group-hover:translate-x-0 transition-transform" />
              </div>
            </div>
          </div>
          
          {/* Slider Handle */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-1 h-12 bg-amber-500 rounded-full flex items-center justify-center z-20">
            <div className="w-6 h-6 rounded-full bg-white border border-amber-200 shadow-md flex items-center justify-center">
              <div className="w-0.5 h-3 bg-amber-300 rounded-full" />
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export function LandingUseCases() {
  const [activeTab, setActiveTab] = useState(useCases[0].id);

  return (
    <section id="use-cases" className="relative py-24 sm:py-32 bg-transparent overflow-hidden border-y border-slate-200/50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
        
        <div className="mb-16 md:text-center max-w-2xl md:mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-500/10 text-primary-500 text-sm font-bold tracking-wide uppercase mb-4">
              <Sparkles className="w-4 h-4" /> How it works
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
              Build the way you want to.
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-xl md:mx-auto font-medium">
              From a private room to a live public build log — Patchwork gives you the tools to build openly, collaborate closely, and ship with proof.
            </p>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-[400px_1fr] gap-8 lg:gap-12 items-center">
          
          {/* Left Sidebar: Navigation Tabs */}
          <div className="flex flex-col gap-3">
            {useCases.map((useCase) => {
              const isActive = activeTab === useCase.id;
              
              return (
                <button
                  key={useCase.id}
                  onClick={() => setActiveTab(useCase.id)}
                  className={`text-left p-5 rounded-2xl transition-all duration-300 relative overflow-hidden group ${
                    isActive 
                      ? `bg-white border border-slate-200 shadow-md shadow-slate-200/50` 
                      : `hover:bg-slate-50 hover:border-slate-200 border border-transparent`
                  }`}
                >
                  {/* Active Indicator Line */}
                  {isActive && (
                    <motion.div 
                      layoutId="active-indicator"
                      className={`absolute left-0 top-0 bottom-0 w-1 ${useCase.color}`}
                    />
                  )}
                  
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center transition-colors duration-300 ${isActive ? useCase.lightColor + " " + useCase.textColor : "bg-slate-100 text-slate-400 group-hover:text-slate-600"}`}>
                      {useCase.icon}
                    </div>
                    <div>
                      <h3 className={`text-lg font-extrabold transition-colors duration-300 ${isActive ? "text-slate-900" : "text-slate-500"}`}>
                        {useCase.title}
                      </h3>
                      <p className={`text-[13px] font-bold uppercase tracking-wider mt-0.5 transition-colors duration-300 ${isActive ? useCase.textColor : "text-slate-500"}`}>
                        {useCase.tagline}
                      </p>
                      
                      <AnimatePresence>
                        {isActive && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <p className="text-[15px] text-slate-600 leading-relaxed mt-3 font-medium">
                              {useCase.description}
                            </p>
                            <div className="mt-4 flex items-center gap-2">
                              <img loading="lazy" src={useCase.avatar} alt="Avatar" className="w-6 h-6 rounded-full bg-slate-200 border border-slate-300" />
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Live Demo &rarr;</span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Stage: Interactive Showcase */}
          <div className="relative h-[400px] sm:h-[500px] rounded-[32px] bg-slate-100 border border-slate-200 shadow-inner overflow-hidden">
            <AnimatePresence mode="wait">
              {activeTab === "build" && (
                <motion.div
                  key="build"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0"
                >
                  <FounderStage />
                </motion.div>
              )}
              {activeTab === "team" && (
                <motion.div
                  key="team"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0"
                >
                  <PMStage />
                </motion.div>
              )}
              {activeTab === "experts" && (
                <motion.div
                  key="experts"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0"
                >
                  <EngineerStage />
                </motion.div>
              )}
              {activeTab === "ship" && (
                <motion.div
                  key="ship"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0"
                >
                  <DesignerStage />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </section>
  );
}
