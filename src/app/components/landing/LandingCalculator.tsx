import React from "react";
import { Award, Code } from "lucide-react";

interface LandingCalculatorProps {
  calcUpdates: number;
  setCalcUpdates: (val: number) => void;
  calcReactions: number;
  setCalcReactions: (val: number) => void;
  calcObservers: number;
  setCalcObservers: (val: number) => void;
  calculateReputation: () => number;
}

export function LandingCalculator({
  calcUpdates,
  setCalcUpdates,
  calcReactions,
  setCalcReactions,
  calcObservers,
  setCalcObservers,
  calculateReputation
}: LandingCalculatorProps) {
  return (
            <section className="relative py-24 bg-[#050505]">
              <div className="mx-auto max-w-4xl px-6">
                <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#0E0C15] p-8 md:p-12 shadow-2xl">
                  {/* Gradient background circles */}
                  <div className="absolute -top-40 -right-40 h-[300px] w-[300px] rounded-full bg-primary-500/10 blur-[80px]" />
                  <div className="absolute -bottom-40 -left-40 h-[300px] w-[300px] rounded-full bg-emerald-500/5 blur-[80px]" />

                  <div className="grid gap-8 md:grid-cols-12 items-center">

                    {/* Calculator Controls (Left) */}
                    <div className="md:col-span-7 space-y-6 relative">
                      <div className="space-y-2">
                        <span className="text-[10px] font-extrabold tracking-widest text-primary-400 uppercase">
                          BUILDER reputation estimate
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-snug">
                          Estimate your builder weight
                        </h2>
                        <p className="text-xs text-slate-400">
                          Reputation is earned. Use the sliders below to estimate your score based on updates, reactions, and observers.
                        </p>
                      </div>

                      <div className="space-y-5 pt-3">
                        {/* Control 1: Weekly updates */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="text-slate-300">Weekly Updates</span>
                            <span className="text-primary-400 font-mono font-bold">{calcUpdates} / week</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={calcUpdates}
                            onChange={(e) => setCalcUpdates(parseInt(e.target.value))}
                            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary-500"
                          />
                        </div>

                        {/* Control 2: Average Reactions */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="text-slate-300">Avg Reactions Per Update</span>
                            <span className="text-primary-400 font-mono font-bold">{calcReactions} reactions</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="50"
                            value={calcReactions}
                            onChange={(e) => setCalcReactions(parseInt(e.target.value))}
                            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary-500"
                          />
                        </div>

                        {/* Control 3: Observer follow rate */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="text-slate-300">Active Observers</span>
                            <span className="text-primary-400 font-mono font-bold">{calcObservers} observers</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="100"
                            value={calcObservers}
                            onChange={(e) => setCalcObservers(parseInt(e.target.value))}
                            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Calculator Result (Right) */}
                    <div className="md:col-span-5 text-center p-6 rounded-2xl bg-[#1C1A24] shadow-sm border border-white/5 relative flex flex-col justify-center min-h-[220px]">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        Est. Reputation Score
                      </div>
                      <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-primary-300 tracking-tight my-4">
                        {calculateReputation()}
                      </div>
                      <div className="inline-flex items-center gap-1.5 mx-auto rounded-full bg-primary-500/10 border border-primary-500/20 px-3 py-1 text-[10px] font-semibold text-primary-400">
                        <Award className="h-3.5 w-3.5" />
                        <span>Domain Rep Level 1</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-4 leading-relaxed max-w-[200px] mx-auto">
                        Tip: Explaining a scrapped feature in an update scores double reputation points!
                      </p>
                    </div>

                  </div>
                </div>
              </div>
            </section>
  );
}
