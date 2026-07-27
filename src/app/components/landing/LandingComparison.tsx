import React from 'react';
import { X, Check } from 'lucide-react';

export function LandingComparison() {
  const comparisons = [
    {
      feature: "Proof of work",
      old: "Static resumes & hidden repos",
      new: "Live, verifiable build logs",
      oldIcon: <X className="w-4 h-4 text-slate-500" />,
      newIcon: <Check className="w-4 h-4 text-primary-400" />
    },
    {
      feature: "Reputation",
      old: "Self-proclaimed on LinkedIn",
      new: "Validated by peers & observers",
      oldIcon: <X className="w-4 h-4 text-slate-500" />,
      newIcon: <Check className="w-4 h-4 text-primary-400" />
    },
    {
      feature: "Interview prep",
      old: "Memorizing frameworks",
      new: "Walking in with real decisions made",
      oldIcon: <X className="w-4 h-4 text-slate-500" />,
      newIcon: <Check className="w-4 h-4 text-primary-400" />
    },
    {
      feature: "Feedback loop",
      old: "Weeks later (or never)",
      new: "Real-time from senior observers",
      oldIcon: <X className="w-4 h-4 text-slate-500" />,
      newIcon: <Check className="w-4 h-4 text-primary-400" />
    }
  ];

  return (
    <section className="bg-slate-900 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl text-center mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            The old way of proving your skills is broken.
          </h2>
          <p className="mt-4 text-lg text-slate-400 font-medium">
            Stop waiting for someone to give you a chance to build.
          </p>
        </div>

        <div className="max-w-4xl mx-auto bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden shadow-2xl">
          {/* Header Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-slate-700/50 bg-slate-800/80">
            <div className="p-6 hidden sm:block"></div>
            <div className="p-6 border-b sm:border-b-0 sm:border-l border-slate-700/50 text-center">
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">The Old Way</span>
            </div>
            <div className="p-6 sm:border-l border-slate-700/50 text-center bg-primary-500/10">
              <span className="text-sm font-bold text-primary-400 uppercase tracking-widest">Patchwork</span>
            </div>
          </div>

          {/* Comparison Rows */}
          {comparisons.map((item, index) => (
            <div key={index} className="grid grid-cols-1 sm:grid-cols-3 border-b border-slate-700/50 last:border-b-0 transition-colors hover:bg-slate-800/30">
              <div className="p-6 flex items-center justify-center sm:justify-start font-bold text-white text-lg">
                {item.feature}
              </div>
              <div className="p-6 sm:border-l border-slate-700/50 flex flex-col items-center justify-center gap-2 text-center border-b sm:border-b-0">
                {item.oldIcon}
                <span className="text-sm text-slate-400 font-medium">{item.old}</span>
              </div>
              <div className="p-6 sm:border-l border-slate-700/50 flex flex-col items-center justify-center gap-2 text-center bg-primary-500/5 relative overflow-hidden">
                {/* Subtle highlight glow on the "Patchwork" side */}
                <div className="absolute inset-0 bg-primary-500/5 blur-xl pointer-events-none" />
                
                <div className="relative z-10 flex flex-col items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary-500/10 flex items-center justify-center">
                    {item.newIcon}
                  </div>
                  <span className="text-sm font-bold text-slate-200">{item.new}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
