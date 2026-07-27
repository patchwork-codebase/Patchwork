import React from 'react';
import { motion } from 'motion/react';

export function RecruiterArtifact() {
  return (
    <section className="bg-[#111111] py-24 sm:py-32 overflow-hidden border-t border-white/5">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Text */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
            className="max-w-xl"
          >
            <p className="text-[10px] font-bold text-[#FF5B22] tracking-wider mb-4 uppercase">
              The artifact
            </p>
            <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-[1.1] mb-6">
              Verified skills. <br />
              <span className="text-[#FF5B22] italic">Quantifiable impact.</span>
            </h2>
            <p className="text-slate-400 text-sm sm:text-[15px] leading-relaxed font-medium">
              Every build log ends with a verifiable scorecard. Whether you are a hiring manager evaluating a candidate, or a mentor tracking a peer's growth, you get calibrated competency bars, observer notes, and direct links to the raw work.
            </p>
          </motion.div>

          {/* Right Mockup */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, x: 30 }}
            whileInView={{ opacity: 1, scale: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="bg-[#FAFAF9] rounded-2xl shadow-2xl p-6 sm:p-8 relative z-10 overflow-hidden border border-white/10">
              
              <div className="flex justify-between items-start mb-8 pb-6 border-b border-slate-200">
                <div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Acme Corp · Senior SWE · Infrastructure</div>
                  <div className="text-xl font-bold text-slate-900">Sarah K.</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-1">Senior-level · 5y experience · 6d 14h in sim</div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-[#FF5B22] leading-none">83</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">/ 100 · PASS</div>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                {[
                  { label: "System Design", score: 92, width: "92%" },
                  { label: "Code Quality", score: 88, width: "88%" },
                  { label: "Debugging & Root Cause", score: 95, width: "95%" },
                  { label: "API Architecture", score: 84, width: "84%" },
                  { label: "Performance Tuning", score: 78, width: "78%" },
                  { label: "Team Communication", score: 86, width: "86%" },
                ].map((skill, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <span className="text-[11px] font-semibold text-slate-600 w-32 truncate">{skill.label}</span>
                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-[#FF5B22] rounded-full" style={{ width: skill.width }}></div>
                    </div>
                    <span className="text-[11px] font-bold text-slate-900 w-6 text-right">{skill.score}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 pt-6 border-t border-slate-200">
                <span className="text-[9px] font-bold text-[#FF5B22] uppercase tracking-widest shrink-0 mt-1">Observer<br/>Note</span>
                <p className="text-xs text-slate-700 font-medium italic leading-relaxed">
                  "Navigated the legacy codebase flawlessly and identified a critical memory leak on Day 2. Her API architecture proposal was highly scalable. Tended to over-engineer the caching layer slightly, but course-corrected after feedback. A rock-solid senior engineer."
                </p>
              </div>

            </div>
            
            {/* Background decorative blur */}
            <div className="absolute inset-0 bg-[#FF5B22] opacity-10 blur-[100px] rounded-full transform translate-x-10 translate-y-10 -z-10" />
          </motion.div>

        </div>
      </div>
    </section>
  );
}
