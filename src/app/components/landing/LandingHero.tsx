import { motion } from "motion/react";
import { ArrowRight, MapPin, Clock, Flame } from "lucide-react";
import { getAvatarUrl } from "../../utils/helpers";
import React from "react";

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
  return (
            <section id="hero" className="relative overflow-hidden pt-24 pb-20 sm:pt-28 sm:pb-24 md:pt-40 md:pb-36 bg-[#FAFAF9]">
              {/* Radial gradient background effects */}
              <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle,rgba(108,92,231,0.15)_0%,transparent_65%)] pointer-events-none" />
              <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle,rgba(139,124,248,0.1)_0%,transparent_70%)] pointer-events-none" />
              {/* Glowing mesh overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

              <div className="mx-auto max-w-7xl px-6">
                <div className="grid gap-12 lg:grid-cols-12 lg:items-center">

                  {/* Hero Left Content */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="lg:col-span-6 text-left space-y-6"
                  >
                    <h1 className="text-4xl sm:text-6xl font-extrabold leading-[1.08] tracking-[-0.04em] text-slate-900">
                      Build in the open.<br />
                      <span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-[#DDD8FF]">
                        Or in private.
                      </span>
                    </h1>

                    <p className="max-w-xl text-base sm:text-lg text-slate-600 leading-relaxed">
                      Stream your work-in-progress publicly or securely to your team. Gather structured peer reviews, and automatically generate a Build Log as living proof-of-work.
                    </p>

                    <div className="pt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                      <button
                        onClick={showOnboarding}
                        className="w-full rounded-full bg-primary-500 hover:bg-[#5b4ed6] px-5 sm:px-6 py-3.5 sm:py-4 text-[14px] sm:text-base font-bold text-white shadow-[0_8px_20px_rgba(108,92,231,0.2)] transition hover:-translate-y-0.5 active:translate-y-0 sm:w-auto"
                      >
                        Start building for free
                      </button>
                      <button
                        onClick={showDashboard}
                        className="w-full rounded-full border border-slate-200 bg-white shadow-sm hover:border-slate-300 hover:bg-white shadow-sm px-5 sm:px-6 py-3.5 sm:py-4 text-[14px] sm:text-base font-bold text-slate-900 transition flex items-center justify-center gap-2 sm:w-auto"
                      >
                        Enter dashboard
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="pt-8 mt-2 border-t border-slate-200/60">
                      <div className="flex items-center gap-4">
                        <div className="flex -space-x-3">
                          {[1, 2, 3, 4].map((i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.5, delay: 0.4 + (i * 0.1) }}
                              className="w-10 h-10 rounded-full border-2 border-[#FAFAF9] overflow-hidden bg-slate-200 relative"
                              style={{ zIndex: 10 - i }}
                            >
                              <img src={getAvatarUrl(`builder-${i + 10}`)} alt="Builder" className="w-full h-full object-cover" />
                            </motion.div>
                          ))}
                        </div>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.5, delay: 1 }}
                          className="flex flex-col"
                        >
                          <div className="flex items-center gap-2">
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                            <span className="text-sm font-bold text-slate-900">148 builders shipping right now</span>
                          </div>
                          <span className="text-xs text-slate-500">Join the live ecosystem</span>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Hero Right Content: INTERACTIVE ROOM PLAYGROUND */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    className="lg:col-span-6 relative mt-6 lg:mt-0"
                  >
                    <div className="absolute -inset-0.5 rounded-[28px] bg-gradient-to-tr from-primary-500/30 to-primary-400/10 blur opacity-45 pointer-events-none" />

                    {/* Live Playground Frame */}
                    <div className="relative overflow-hidden rounded-[20px] sm:rounded-[24px] border border-slate-200 bg-white shadow-xl">
                      {/* Window header */}
                      <div className="flex items-center justify-between border-b border-slate-200 bg-white shadow-sm px-3 sm:px-5 py-3 sm:py-4">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-[#FF5F57]" />
                          <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-[#FEBC2E]" />
                          <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-[#28C840]" />
                        </div>
                        <div className="text-[9px] sm:text-[11px] font-mono tracking-widest text-slate-500">PLAYGROUND DEMO</div>
                        <div className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      </div>

                      {/* Playground main grid */}
                      <div className="grid gap-0 md:grid-cols-[200px_1fr] h-[550px] sm:h-[480px] grid-rows-[160px_1fr] md:grid-rows-1">

                        {/* Sidebar */}
                        <aside className="border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50 p-3 sm:p-4 flex flex-col justify-between overflow-y-auto">
                          <div className="space-y-4">
                            <div className="text-[9px] font-bold tracking-wider text-slate-600 uppercase">Live Rooms</div>
                            <div className="space-y-1.5">
                              {detailedRooms.map((room) => {
                                const isSelected = room.id === activeRoomId;
                                return (
                                  <button
                                    key={room.id}
                                    onClick={() => {
                                      setActiveRoomId(room.id);
                                      setActiveUpdatesIndex(0);
                                    }}
                                    className={`w-full flex items-center gap-3 rounded-xl p-2.5 text-left transition group ${isSelected
                                      ? "bg-primary-500/15 border border-primary-500/30 text-white"
                                      : "hover:bg-white shadow-sm border border-transparent text-slate-600 hover:text-slate-900"
                                      }`}
                                  >
                                    <div
                                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold font-mono transition ${isSelected
                                        ? "bg-primary-500/30 text-primary-400"
                                        : "bg-slate-50 text-slate-700 group-hover:bg-slate-100"
                                        }`}
                                    >
                                      {room.initials}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="truncate text-xs font-bold">{room.title}</div>
                                      <div className="text-[9px] text-slate-500 font-mono mt-0.5">{room.domain}</div>
                                    </div>
                                    {room.status === "Live" && isSelected && (
                                      <span className="h-1.5 w-1.5 rounded-full bg-[#00B37E] shrink-0 animate-pulse" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="pt-4 border-t border-slate-200 text-[10px] text-slate-500 flex items-center gap-2">
                            <Flame className="h-3.5 w-3.5 text-primary-400" />
                            <span>Click a room to review updates</span>
                          </div>
                        </aside>

                        {/* Room Panel */}
                        <div className="flex flex-col bg-white overflow-y-auto">

                          {/* Room Header */}
                          <div className="border-b border-slate-200 p-5 bg-white shadow-sm">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex rounded-full bg-primary-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary-400 border border-primary-500/20">
                                {currentRoom.badge}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500">Day {currentRoom.dayCount} of build</span>
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 mt-1.5 leading-tight">{currentRoom.title}</h3>
                            <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-500 font-mono">
                              <MapPin className="h-3 w-3 text-slate-600" />
                              <span>{currentRoom.location}</span>
                            </div>
                          </div>

                          {/* Room Updates Feed */}
                          <div className="p-5 flex-1 space-y-4">
                            <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest flex items-center justify-between">
                              <span>Raw Updates</span>
                              <span>{currentRoom.updates.length} Updates</span>
                            </div>

                            {currentRoom.updates.map((update: any, idx: number) => {
                              return (
                                <div
                                  key={idx}
                                  className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 space-y-3 transition hover:bg-white shadow-sm"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="h-5 w-5 rounded-full bg-gradient-to-tr from-primary-500 to-primary-400 flex items-center justify-center text-[9px] font-extrabold text-white">
                                        {currentRoom.initials}
                                      </div>
                                      <span className="text-xs font-semibold text-slate-700">Builder</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                                      <Clock className="h-3 w-3" />
                                      <span>{update.time}</span>
                                    </div>
                                  </div>

                                  <p className="text-xs leading-relaxed text-slate-700 font-sans">
                                    {update.text}
                                  </p>

                                  {/* Interactive Reaction Pills */}
                                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
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
                                          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium transition active:scale-95 ${isReacted
                                            ? "bg-primary-500/20 border border-primary-500 text-primary-500"
                                            : "bg-white shadow-sm border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-200"
                                            }`}
                                        >
                                          <span>{react.label}</span>
                                          <span className="h-3 w-px bg-white/10 mx-0.5" />
                                          <span className="font-bold text-slate-700">{count}</span>
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
