import React from "react";
import { motion } from "motion/react";
import { ChevronDown, MapPin, ArrowUpRight, Flame } from "lucide-react";
import { getAvatarUrl } from "../../utils/helpers";

interface LandingShowcaseProps {
  domainOptions: any[];
  selectedShowcaseDomain: string;
  setSelectedShowcaseDomain: (domain: string) => void;
  filteredShowcaseBuilders: any[];
  getShowcaseReactionCount: (builderId: string, reactionType: string, defaultVal: number) => number;
  handleShowcaseReaction: (builderId: string, reactionType: string) => void;
  userShowcaseReactions: Record<string, boolean>;
}

export function LandingShowcase({
  domainOptions,
  selectedShowcaseDomain,
  setSelectedShowcaseDomain,
  filteredShowcaseBuilders,
  getShowcaseReactionCount,
  handleShowcaseReaction,
  userShowcaseReactions
}: LandingShowcaseProps) {
  return (
            <section id="showcase" className="relative py-24 bg-[#FAFAF9] border-y border-slate-200/50">
              <div className="absolute top-[20%] left-[-5%] w-[40%] h-[40%] rounded-full bg-primary-400/10 blur-[120px] pointer-events-none" />
              <div className="mx-auto max-w-7xl px-6">

                {/* Section Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                  <div className="space-y-3">
                    <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-primary-600 bg-primary-50 px-3 py-1 rounded-full border border-primary-200">
                      showcase feed
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
                      Explore live proof-of-work
                    </h2>
                    <p className="text-slate-600 text-sm sm:text-base max-w-xl font-medium">
                      Read what actual mock builders are coding and designing across Patchwork. Toggle domains below to filter activity.
                    </p>
                  </div>

                  {/* Domain filters */}
                  <div className="flex flex-wrap gap-1.5 bg-white border border-slate-200 p-1.5 rounded-full shrink-0 shadow-sm">
                    {["all", "product", "design", "engineering", "writing", "growth"].map((dom) => (
                      <button
                        key={dom}
                        onClick={() => setSelectedShowcaseDomain(dom)}
                        className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition ${selectedShowcaseDomain === dom
                          ? "bg-slate-900 text-white shadow-md"
                          : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                          }`}
                      >
                        {dom}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Builders Showcase Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredShowcaseBuilders.map((builder) => {
                    return (
                      <div
                        key={builder.id}
                        className="rounded-[24px] border border-slate-200 bg-white shadow-sm p-7 space-y-4 hover:border-slate-300 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex flex-col justify-between backdrop-blur-sm relative overflow-hidden group"
                      >
                        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        
                        <div className="space-y-4 relative z-10">
                          {/* Card Top: Builder Profile */}
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-0">
                            <div className="flex items-center gap-3 sm:gap-4">
                              <img 
                                src={getAvatarUrl(builder.id)}
                                alt={builder.name}
                                className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 rounded-2xl object-cover shadow-sm bg-slate-100"
                              />
                              <div className="min-w-0">
                                <div className="text-[15px] sm:text-[16px] font-extrabold text-slate-900 flex flex-wrap items-center gap-1.5 sm:gap-2 font-display group-hover:text-primary-600 transition-colors">
                                  <span className="whitespace-nowrap truncate">{builder.name}</span>
                                  <span className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-amber-50 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-amber-600 uppercase tracking-widest ring-1 ring-amber-200">
                                    ★ {builder.rep} rep
                                  </span>
                                </div>
                                <div className="text-[11px] sm:text-[12px] text-slate-500 font-medium capitalize mt-0.5 truncate">{builder.title} · {builder.location}</div>
                              </div>
                            </div>
                            <span className="self-start sm:self-auto rounded-md bg-slate-50 shadow-sm px-2 sm:px-2.5 py-1 text-[9px] sm:text-[10px] font-bold font-mono uppercase text-primary-600 ring-1 ring-slate-200 tracking-widest">
                              {builder.domain}
                            </span>
                          </div>

                          <p className="text-[14px] text-slate-600 leading-relaxed font-medium border-b border-slate-100 pb-4">
                            {builder.bio}
                          </p>

                          {/* Latest Update */}
                          <div className="space-y-3 pt-1">
                            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono font-medium">
                              <span className="text-slate-500 truncate pr-4">Room: <span className="text-slate-900 font-bold">{builder.projectTitle}</span></span>
                              <span className="shrink-0 text-slate-400">{builder.updateTime}</span>
                            </div>
                            <div className="rounded-xl bg-slate-50 shadow-sm border border-slate-100 p-5 text-[13px] text-slate-700 leading-relaxed font-medium italic">
                              "{builder.updateText}"
                            </div>
                          </div>
                        </div>

                        {/* Structured reactions */}
                        <div className="flex gap-1.5 pt-3 border-t border-slate-100 mt-3">
                          {[
                            { type: "sharp", label: "✦", count: builder.reactions.sharp },
                            { type: "pushback", label: "↩", count: builder.reactions.pushback },
                            { type: "tellmemore", label: "?", count: builder.reactions.tellmemore }
                          ].map((react) => {
                            const reactKey = `${builder.id}-${react.type}`;
                            const isReacted = !!userShowcaseReactions[reactKey];
                            const count = getShowcaseReactionCount(builder.id, react.type, react.count);
                            return (
                              <button
                                key={react.type}
                                onClick={() => handleShowcaseReaction(builder.id, react.type)}
                                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-semibold transition active:scale-95 ${isReacted
                                  ? "bg-primary-50 border border-primary-200 text-primary-600"
                                  : "bg-slate-50 shadow-sm border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                                  }`}
                              >
                                <span>{react.label}</span>
                                <span className="font-bold">{count}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            </section>
  );
}
