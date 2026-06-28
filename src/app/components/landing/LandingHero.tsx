import { motion, useScroll, useTransform } from "motion/react";
import { ArrowRight, MapPin, Clock, Flame } from "lucide-react";
import { getAvatarUrl } from "../../utils/helpers";
import React, { useRef } from "react";
import { MagneticButton } from "../ui/MagneticButton";

interface LandingHeroProps {
  showOnboarding: () => void;
  showDashboard: () => void;
  detailedRooms: any[];
  activeRoomId: string;
  setActiveRoomId: (id: string) => void;
  setActiveUpdatesIndex: (index: number) => void;
  currentRoom: any;
  userHeroReactions: Record<string, boolean>;
  getHeroReactionCount: (roomId: string, updateIndex: number, reactionType: string, defaultVal: number) => number;
  handleHeroReaction: (roomId: string, updateIndex: number, reactionType: string) => void;
}

export function LandingHero({
  showOnboarding,
  showDashboard,
  detailedRooms,
  activeRoomId,
  setActiveRoomId,
  setActiveUpdatesIndex,
  currentRoom,
  userHeroReactions,
  getHeroReactionCount,
  handleHeroReaction
}: LandingHeroProps) {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  // A subtle tilt that flattens out as you scroll down
  const rotateX = useTransform(scrollYProgress, [0, 0.5], [15, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.95, 1]);
  const translateY = useTransform(scrollYProgress, [0, 0.5], [50, 0]);

  return (
    <section ref={containerRef} id="hero" className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-32 bg-[#050505]">
      {/* Dark mode background gradients */}
      <div className="absolute top-[-10%] left-[20%] w-[60%] h-[40%] rounded-full bg-[radial-gradient(circle,rgba(108,92,231,0.15)_0%,transparent_60%)] pointer-events-none blur-3xl" />
      <div className="absolute top-[20%] right-[10%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle,rgba(139,124,248,0.1)_0%,transparent_60%)] pointer-events-none blur-3xl" />
      
      {/* Subtle grid mesh for dark mode */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_80%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6 relative z-10">
        
        {/* --- Top Centered Content --- */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center text-center max-w-4xl mx-auto space-y-8"
        >
          <h1 className="text-5xl sm:text-7xl font-extrabold leading-[1.05] tracking-[-0.04em] text-white flex flex-wrap justify-center gap-x-3 gap-y-2">
            {["Build", "in", "the", "open."].map((word, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.8, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="inline-block"
              >
                {word}
              </motion.span>
            ))}
            <div className="w-full h-0 sm:hidden" />
            {["Or", "in", "private."].map((word, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.8, delay: 0.4 + (i * 0.1), ease: [0.16, 1, 0.3, 1] }}
                className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-[#DDD8FF] inline-block"
              >
                {word}
              </motion.span>
            ))}
          </h1>

          <p className="max-w-2xl text-lg sm:text-xl text-slate-400 leading-relaxed">
            {"Patchwork helps you capture every decision, every iteration, and every milestone, so your journey becomes as valuable as what you build.".split(" ").map((word, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.5, delay: 0.8 + (i * 0.02), ease: "easeOut" }}
                className="inline-block mr-[0.25em]"
              >
                {word}
              </motion.span>
            ))}
          </p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="flex flex-col sm:flex-row items-center gap-4 pt-4"
          >
            <MagneticButton onClick={showOnboarding}>
              <button
                className="w-full sm:w-auto rounded-full bg-primary-500 hover:bg-[#5b4ed6] px-8 py-4 text-base font-bold text-white shadow-[0_0_30px_rgba(108,92,231,0.4)] transition"
              >
                Start building for free
              </button>
            </MagneticButton>
            <MagneticButton onClick={showDashboard} strength={0.3}>
              <button
                className="w-full sm:w-auto rounded-full border border-slate-700 bg-white/5 backdrop-blur-md hover:bg-white/10 px-8 py-4 text-base font-bold text-white transition flex items-center justify-center gap-2"
              >
                Enter dashboard
                <ArrowRight className="h-4 w-4" />
              </button>
            </MagneticButton>
          </motion.div>

          {/* Social Proof Line */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.5 }}
            className="flex items-center gap-4 pt-6"
          >
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-[#0A0A0A] overflow-hidden bg-slate-800 relative"
                  style={{ zIndex: 10 - i }}
                >
                  <img src={getAvatarUrl(`builder-${i + 10}`)} alt="Builder" className="w-full h-full object-cover opacity-90" />
                </div>
              ))}
            </div>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold text-slate-300">148 builders shipping right now</span>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* --- Bottom Wide Mockup --- */}
        <div style={{ perspective: "1000px" }} className="mt-20">
          <motion.div 
            style={{ 
              rotateX, 
              scale,
              y: translateY,
              transformStyle: "preserve-3d" 
            }}
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative mx-auto max-w-5xl"
          >
            {/* Outer Glow */}
            <div className="absolute -inset-1 rounded-[24px] bg-gradient-to-tr from-primary-500/40 via-purple-500/20 to-primary-400/40 blur-xl opacity-60 pointer-events-none" />

            {/* Application Window */}
            <div className="relative overflow-hidden rounded-[20px] border border-white/10 bg-[#0E0C15] shadow-2xl">
              {/* Window Header (Mac style) */}
              <div className="flex items-center justify-between border-b border-white/5 bg-[#1C1A24]/80 backdrop-blur-md px-5 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-[#FF5F57] opacity-80" />
                  <span className="h-3 w-3 rounded-full bg-[#FEBC2E] opacity-80" />
                  <span className="h-3 w-3 rounded-full bg-[#28C840] opacity-80" />
                </div>
                <div className="text-[11px] font-mono tracking-widest text-slate-400/70">PLAYGROUND.APP</div>
                <div className="h-3 w-3" />
              </div>

              {/* Application Grid */}
              <div className="grid gap-0 md:grid-cols-[260px_1fr] h-[600px] grid-rows-[200px_1fr] md:grid-rows-1">
                
                {/* Sidebar (Dark) */}
                <aside className="border-b md:border-b-0 md:border-r border-white/5 bg-[#0A0910] p-4 flex flex-col justify-between overflow-y-auto">
                  <div className="space-y-5">
                    <div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Live Rooms</div>
                    <div className="space-y-2">
                      {detailedRooms.map((room) => {
                        const isSelected = room.id === activeRoomId;
                        return (
                          <button
                            key={room.id}
                            onClick={() => {
                              setActiveRoomId(room.id);
                              setActiveUpdatesIndex(0);
                            }}
                            className={`w-full flex items-center gap-3 rounded-xl p-3 text-left transition group ${isSelected
                              ? "bg-primary-500/20 border border-primary-500/40 text-white shadow-[inset_0_0_12px_rgba(108,92,231,0.2)]"
                              : "hover:bg-white/5 border border-transparent text-slate-400 hover:text-slate-200"
                              }`}
                          >
                            <div
                              className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold font-mono transition ${isSelected
                                ? "bg-primary-500/40 text-primary-200"
                                : "bg-white/5 text-slate-500 group-hover:bg-white/10"
                                }`}
                            >
                              {room.initials}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-bold">{room.title}</div>
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">{room.domain}</div>
                            </div>
                            {room.status === "Live" && isSelected && (
                              <span className="h-2 w-2 rounded-full bg-[#00B37E] shrink-0 animate-pulse shadow-[0_0_8px_#00B37E]" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 text-[11px] text-slate-500 flex items-center gap-2 mt-4">
                    <Flame className="h-4 w-4 text-primary-400" />
                    <span>Click a room to review</span>
                  </div>
                </aside>

                {/* Main Content Area (Dark) */}
                <div className="flex flex-col bg-[#0E0C15] overflow-y-auto">
                  {/* Room Header */}
                  <div className="border-b border-white/5 p-6 bg-[#0E0C15]">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex rounded-full bg-primary-500/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-300 border border-primary-500/30">
                        {currentRoom.badge}
                      </span>
                      <span className="text-xs font-mono text-slate-500">Day {currentRoom.dayCount} of build</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mt-3 leading-tight">{currentRoom.title}</h3>
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400 font-mono">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{currentRoom.location}</span>
                    </div>
                  </div>

                  {/* Room Updates Feed */}
                  <div className="p-6 flex-1 space-y-5 bg-[#0A0910]/50">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center justify-between">
                      <span>Raw Updates</span>
                      <span>{currentRoom.updates.length} Updates</span>
                    </div>

                    {currentRoom.updates.map((update: any, idx: number) => {
                      return (
                        <div
                          key={idx}
                          className="rounded-2xl border border-white/10 bg-[#1C1A24] p-5 space-y-4 hover:border-white/20 transition-colors shadow-lg"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-primary-500 to-primary-400 flex items-center justify-center text-xs font-extrabold text-white shadow-sm">
                                {currentRoom.initials}
                              </div>
                              <span className="text-sm font-semibold text-slate-200">Builder</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                              <Clock className="h-3.5 w-3.5" />
                              <span>{update.time}</span>
                            </div>
                          </div>

                          <p className="text-sm leading-relaxed text-slate-300 font-sans">
                            {update.text}
                          </p>

                          {/* Interactive Reaction Pills */}
                          <div className="flex flex-wrap gap-2 pt-3 border-t border-white/5">
                            {[
                              { type: "sharp", label: "✦ Sharp", count: update.reactions.sharp },
                              { type: "pushback", label: "↩ Push back", count: update.reactions.pushback },
                              { type: "tellmemore", label: "? Tell me more", count: update.reactions.tellmemore }
                            ].map((react) => {
                              const reactionKey = `${currentRoom.id}-${idx}-${react.type}`;
                              const isReacted = !!userHeroReactions[reactionKey];
                              const count = getHeroReactionCount(currentRoom.id, idx, react.type, react.count);

                              return (
                                <button
                                  key={react.type}
                                  onClick={() => handleHeroReaction(currentRoom.id, idx, react.type)}
                                  className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition active:scale-95 ${isReacted
                                    ? "bg-primary-500/20 border border-primary-500/50 text-primary-300"
                                    : "bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-white/20 hover:bg-white/10"
                                    }`}
                                >
                                  <span>{react.label}</span>
                                  <span className="h-3 w-px bg-white/20 mx-0.5" />
                                  <span className="font-bold text-slate-200">{count}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
