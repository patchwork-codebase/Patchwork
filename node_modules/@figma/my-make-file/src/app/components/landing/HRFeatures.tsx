import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, FileText, CheckCircle2, GitPullRequest, Code, ArrowRight } from 'lucide-react';

export function HRFeatures() {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto mb-20">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
            The end of the <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#10b981] to-[#0ea5e9]">resume screen.</span>
          </h2>
          <p className="text-slate-500 leading-relaxed text-lg">
            Traditional recruiting is a guessing game. Patchwork gives you a pipeline built on verified proof of work, automating the technical screen.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* 3D Flip Card Interactive Element */}
          <div className="relative h-[400px] perspective-1000 group cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
            <motion.div 
              className="w-full h-full relative preserve-3d transition-transform duration-700"
              animate={{ rotateY: isFlipped ? 180 : 0 }}
            >
              {/* Front side (Traditional Resume) */}
              <div className="absolute inset-0 backface-hidden bg-white border border-slate-100 rounded-3xl shadow-xl p-8 flex flex-col justify-center">
                <div className="absolute top-4 right-4 bg-slate-100 text-slate-500 dark:text-slate-400 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest flex items-center gap-1">
                  <FileText className="w-3 h-3" /> The Past
                </div>
                <div className="w-16 h-16 bg-slate-200 rounded-full mb-6 mx-auto"></div>
                <div className="w-3/4 h-4 bg-slate-200 rounded-md mx-auto mb-2"></div>
                <div className="w-1/2 h-3 bg-slate-100 rounded-md mx-auto mb-8"></div>
                
                <div className="space-y-3">
                  <div className="w-full h-3 bg-slate-100 rounded-md"></div>
                  <div className="w-full h-3 bg-slate-100 rounded-md"></div>
                  <div className="w-4/5 h-3 bg-slate-100 rounded-md"></div>
                </div>
                
                <div className="mt-8 text-center">
                  <span className="text-[#10b981] font-bold text-sm flex items-center justify-center gap-1 group-hover:underline">
                    Click to reveal the truth <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>

              {/* Back side (Patchwork Profile) */}
              <div className="absolute inset-0 backface-hidden bg-gradient-to-b from-slate-900 to-slate-800 border border-slate-300 dark:border-slate-700 rounded-3xl shadow-2xl p-8 flex flex-col justify-center rotate-y-180">
                <div className="absolute top-4 right-4 bg-[#10b981]/20 text-[#10b981] text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest flex items-center gap-1 border border-[#10b981]/30">
                  <CheckCircle2 className="w-3 h-3" /> The Future
                </div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-tr from-[#10b981] to-[#0ea5e9] rounded-2xl flex items-center justify-center text-slate-900 dark:text-white font-bold text-xl">JD</div>
                  <div>
                    <h3 className="text-slate-900 dark:text-white font-bold text-xl">John Doe</h3>
                    <p className="text-[#10b981] text-sm font-medium">Top 5% Frontend Match</p>
                  </div>
                </div>
                
                <div className="bg-white/5 rounded-xl border border-slate-100 dark:border-white/10 p-4 mb-4 shadow-sm dark:shadow-none">
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Verified Proof of Work</div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white"><GitPullRequest className="w-4 h-4 text-[#0ea5e9]" /> 42 PRs Merged</div>
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white"><Code className="w-4 h-4 text-[#10b981]" /> 12 Bounties</div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <div className="flex-1 bg-[#10b981] text-slate-900 text-center py-2 rounded-lg font-bold text-sm">Invite to Interview</div>
                  <div className="flex-1 bg-white/10 text-slate-900 dark:text-white text-center py-2 rounded-lg font-bold text-sm border border-slate-300 dark:border-white/20">View Code</div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Feature List */}
          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <Search className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Simulation-Based Screening</h4>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Instead of algorithmic tests, put candidates in a 7-day sandbox that mirrors your actual codebase. See how they communicate, iterate, and build.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Automated Pipeline</h4>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Candidates who successfully complete bounties or simulations are automatically fast-tracked in your ATS pipeline, saving your team hundreds of screening hours.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                <Code className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Verified Skill Graph</h4>
                <p className="text-slate-500 text-sm leading-relaxed">
                  View a candidate's complete history of verified contributions across the platform. Know exactly what they are good at before the first interview.
                </p>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}
