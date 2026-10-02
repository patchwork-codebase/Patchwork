import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, TrendingUp, Building2, ChevronRight } from 'lucide-react';

export function FounderHero({ onSignup }: { onSignup: () => void }) {
  return (
    <section className="relative pt-32 pb-32 overflow-hidden bg-[#0A0A0A] min-h-[90vh] flex items-center">
      {/* Premium Boardroom Background */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.2] mix-blend-overlay"></div>
      
      {/* Subtle Glows */}
      <div className="absolute top-[0%] left-[50%] -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-[#f59e0b]/10 blur-[150px]"></div>

      {/* Animated Hockey Stick Growth Chart Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-end justify-center pb-20 opacity-30">
        <svg className="w-full h-full max-w-6xl mx-auto" viewBox="0 0 1000 400" preserveAspectRatio="none">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="1" />
            </linearGradient>
          </defs>
          
          {/* Grid lines */}
          <path d="M 0 300 L 1000 300" stroke="#333" strokeWidth="1" strokeDasharray="4 4" />
          <path d="M 0 200 L 1000 200" stroke="#333" strokeWidth="1" strokeDasharray="4 4" />
          <path d="M 0 100 L 1000 100" stroke="#333" strokeWidth="1" strokeDasharray="4 4" />

          {/* Area Fill */}
          <motion.path 
            initial={{ opacity: 0, d: "M 0 400 L 0 400 L 200 400 L 400 400 L 600 400 L 800 400 L 1000 400 L 1000 400 Z" }}
            animate={{ opacity: 1, d: "M 0 400 L 0 380 L 200 350 L 400 330 L 600 280 L 800 150 L 1000 50 L 1000 400 Z" }}
            transition={{ duration: 2, ease: "easeOut", delay: 0.5 }}
            fill="url(#chartGradient)" 
          />
          
          {/* Glowing Line */}
          <motion.path 
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2, ease: "easeOut", delay: 0.5 }}
            d="M 0 380 L 200 350 L 400 330 L 600 280 L 800 150 L 1000 50" 
            fill="transparent" 
            stroke="url(#lineGradient)" 
            strokeWidth="4" 
            className="drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]"
          />

          {/* Data Points */}
          <motion.circle initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 2.2 }} cx="800" cy="150" r="6" fill="#fbbf24" className="drop-shadow-[0_0_10px_rgba(251,191,36,1)]" />
          <motion.circle initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 2.5 }} cx="1000" cy="50" r="8" fill="#fff" className="drop-shadow-[0_0_15px_rgba(255,255,255,1)]" />
        </svg>
      </div>

      <div className="mx-auto max-w-7xl px-6 relative z-10 w-full mt-20">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto flex flex-col items-center text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-[#111111] border border-[#333333] shadow-[0_0_20px_rgba(245,158,11,0.1)] mb-8">
            <Building2 className="w-4 h-4 text-[#fbbf24]" />
            <span className="text-xs font-bold tracking-wider uppercase text-slate-600 dark:text-slate-300">For Founders & Executives</span>
          </div>
          
          <h1 className="text-6xl sm:text-7xl lg:text-[85px] font-black text-slate-900 dark:text-white leading-[0.95] tracking-tighter mb-8">
            Build the vision. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] italic">Prove the traction.</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-2xl mx-auto mb-10">
            Keep your burn rate low and your velocity high. Hire verified 10x builders, track sprint efficiency, and send irrefutable proof of progress to your investors.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
            <button
              onClick={onSignup}
              className="rounded-full bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] hover:from-[#f59e0b] hover:to-[#d97706] px-8 py-4 text-sm font-bold text-slate-950 transition flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:-translate-y-0.5"
            >
              Start Scaling <ArrowRight className="w-4 h-4" />
            </button>
            <button
              className="rounded-full bg-[#111] hover:bg-slate-50 dark:bg-[#1a1a1a] border border-[#333] px-8 py-4 text-sm font-bold text-slate-900 dark:text-white transition hover:-translate-y-0.5 flex items-center gap-2"
            >
              View Investor Update <ChevronRight className="w-4 h-4 text-[#fbbf24]" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
