import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Map, Compass, GitMerge } from 'lucide-react';

export function PMHero({ onSignup }: { onSignup: () => void }) {
  return (
    <section className="relative pt-32 pb-32 overflow-hidden bg-[#0B1121] min-h-[90vh] flex items-center">
      {/* Deep Space / Command Center Background */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] mix-blend-overlay"></div>
      <div className="absolute top-[10%] left-[20%] w-[600px] h-[600px] rounded-full bg-[#14b8a6]/20 blur-[150px]"></div>
      <div className="absolute bottom-[10%] right-[20%] w-[600px] h-[600px] rounded-full bg-[#3b82f6]/20 blur-[150px]"></div>
      
      {/* Animated Timeline / Gantt Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden hidden lg:block">
        {/* Horizontal Timeline Track */}
        <div className="absolute top-[30%] left-[-10%] w-[120%] h-px bg-slate-100 dark:bg-slate-800/50"></div>
        <div className="absolute top-[50%] left-[-10%] w-[120%] h-px bg-slate-100 dark:bg-slate-800/50"></div>
        <div className="absolute top-[70%] left-[-10%] w-[120%] h-px bg-slate-100 dark:bg-slate-800/50"></div>

        {/* Floating Gantt Blocks */}
        <motion.div 
          animate={{ x: [0, 50, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[28%] left-[15%] h-8 w-48 bg-[#14b8a6]/20 border border-[#14b8a6]/50 rounded-md backdrop-blur-md flex items-center px-3"
        >
          <span className="text-[#14b8a6] text-xs font-bold font-mono">EPIC-101: Core Auth</span>
        </motion.div>

        <motion.div 
          animate={{ x: [0, -30, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-[48%] left-[45%] h-8 w-64 bg-[#3b82f6]/20 border border-[#3b82f6]/50 rounded-md backdrop-blur-md flex items-center px-3"
        >
          <span className="text-[#3b82f6] text-xs font-bold font-mono">Q3 Deliverables</span>
        </motion.div>

        <motion.div 
          animate={{ x: [0, 60, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-[68%] left-[65%] h-8 w-32 bg-[#8b5cf6]/20 border border-[#8b5cf6]/50 rounded-md backdrop-blur-md flex items-center px-3"
        >
          <span className="text-[#8b5cf6] text-xs font-bold font-mono">User Testing</span>
        </motion.div>

        {/* Connecting Lines */}
        <svg className="absolute inset-0 w-full h-full">
          <motion.path 
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.5 }}
            transition={{ duration: 3, delay: 1, ease: "easeInOut" }}
            d="M 350 250 Q 450 250 450 400 T 650 450" 
            fill="transparent" 
            stroke="#14b8a6" 
            strokeWidth="2" 
            strokeDasharray="4 4"
          />
        </svg>
      </div>

      <div className="mx-auto max-w-7xl px-6 relative z-10 w-full">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto flex flex-col items-center text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm mb-8">
            <Compass className="w-4 h-4 text-[#14b8a6]" />
            <span className="text-xs font-bold tracking-wider uppercase text-slate-600 dark:text-slate-300">For Product Managers</span>
          </div>
          
          <h1 className="text-6xl sm:text-7xl lg:text-[85px] font-black text-slate-900 dark:text-white leading-[0.95] tracking-tighter mb-8">
            Don't just manage. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#14b8a6] to-[#3b82f6]">Orchestrate.</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-2xl mx-auto mb-10">
            Step into the command center. Connect PRDs to pull requests, align engineering velocity with business goals, and map out the future with verifiable timelines.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
            <button
              onClick={onSignup}
              className="rounded-full bg-[#14b8a6] hover:bg-[#0d9488] px-8 py-4 text-sm font-bold text-slate-900 transition flex items-center justify-center gap-2 shadow-xl shadow-[#14b8a6]/20 hover:-translate-y-0.5"
            >
              Enter Command Center <ArrowRight className="w-4 h-4" />
            </button>
            <button
              className="rounded-full bg-white/5 hover:bg-white/10 border border-slate-100 dark:border-white/10 px-8 py-4 text-sm font-bold text-slate-900 dark:text-white transition shadow-sm hover:-translate-y-0.5 flex items-center gap-2"
            >
              <GitMerge className="w-4 h-4" /> Connect Repository
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
