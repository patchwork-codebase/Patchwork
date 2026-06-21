import React from "react";
import { CheckCircle2, TrendingUp, Layers, Code, MessageSquareCode, Award, Users, Lock } from "lucide-react";

export function LandingFeatures() {
  return (
            <section id="features" className="relative py-24 bg-[#FAFAF9] border-y border-slate-200">
              <div className="absolute top-10 right-[10%] w-[30%] h-[30%] rounded-full bg-primary-500/5 blur-[80px] pointer-events-none" />
              <div className="mx-auto max-w-7xl px-6">

                {/* Section Header */}
                <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
                  <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-primary-400 bg-primary-500/10 px-3 py-1 rounded-full">
                    why patchwork
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
                    Built for how real builders<br />
                    <span className="font-serif italic text-primary-400">actually ship products</span>
                  </h2>
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                    Most platforms capture the wrong state. LinkedIn has your polished past. X has your active opinions. Patchwork has your real, raw building process.
                  </p>
                </div>

                {/* Features Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {[
                    {
                      icon: <Layers className="h-6 w-6 text-primary-400" />,
                      title: "Live Build Rooms",
                      desc: "Tied directly to milestones. Share your updates — sketches, logic flows, links — as you build. Enable observers to follow step-by-step."
                    },
                    {
                      icon: <MessageSquareCode className="h-6 w-6 text-emerald-400" />,
                      title: "Structured Reactions",
                      desc: "No noise, just signal. Observers react with three precise indicators: Sharp (execution), Push back (warnings), or Tell me more (curiosity)."
                    },
                    {
                      icon: <CheckCircle2 className="h-6 w-6 text-amber-400" />,
                      title: "Chronological Build Log",
                      desc: "Shipping a project compiles your room timeline into a permanent, beautiful portfolio. Let your journey prove your expertise."
                    },
                    {
                      icon: <Award className="h-6 w-6 text-primary-400" />,
                      title: "Domain Reputation",
                      desc: "Accumulate reputation points based on code logic, UI iterations, and constructiveness. Your reputational weight reflects what you build."
                    },
                    {
                      icon: <Users className="h-6 w-6 text-purple-400" />,
                      title: "Active Observers Widget",
                      desc: "Invite colleagues, engineers, or founders to observe your building room. Track who views your updates and how frequently they check in."
                    },
                    {
                      icon: <Lock className="h-6 w-6 text-slate-600" />,
                      title: "Verified Talent Signal",
                      desc: "Companies filter candidates by checking real build logs over time. Cut out technical interviews by letting your process prove itself."
                    }
                  ].map((card, i) => (
                    <div
                      key={i}
                      className="group relative rounded-[24px] border border-slate-200 bg-white shadow-sm p-8 space-y-4 hover:bg-white shadow-sm transition-all duration-300 hover:border-slate-200 hover:-translate-y-1 hover:shadow-xl backdrop-blur-sm overflow-hidden"
                    >
                      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="inline-flex rounded-2xl bg-white shadow-sm border border-slate-200 p-4 group-hover:scale-110 group-hover:bg-primary-500/10 transition duration-300">
                        {card.icon}
                      </div>
                      <h3 className="text-[20px] font-extrabold text-slate-900 font-display group-hover:text-primary-400 transition-colors">{card.title}</h3>
                      <p className="text-slate-600 text-[14px] leading-relaxed font-medium">{card.desc}</p>
                    </div>
                  ))}
                </div>

              </div>
            </section>
  );
}
