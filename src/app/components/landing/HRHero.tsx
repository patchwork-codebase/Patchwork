import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Radar, ScanSearch, CheckCircle2 } from 'lucide-react';

export function HRHero({ onSignup }: { onSignup: () => void }) {
  return (
    <section className="relative pt-32 pb-32 overflow-hidden bg-[#F8FAFC] min-h-[90vh] flex items-center">
      {/* Talent Radar Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center opacity-40">
        <div className="relative w-[800px] h-[800px]">
          {/* Radar Circles */}
          <div className="absolute inset-0 rounded-full border border-slate-100"></div>
          <div className="absolute inset-[150px] rounded-full border border-slate-100"></div>
          <div className="absolute inset-[300px] rounded-full border border-slate-100"></div>
          
          {/* Radar Sweep */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute top-0 right-1/2 bottom-1/2 left-0 origin-bottom-right"
          >
            <div className="w-full h-full bg-gradient-to-tr from-transparent via-[#10b981]/10 to-[#10b981]/30 border-r-2 border-[#10b981] rounded-tl-full"></div>
          </motion.div>

          {/* Dots (Candidates) */}
          <div className="absolute top-[20%] left-[30%] w-2 h-2 rounded-full bg-slate-300"></div>
          <div className="absolute top-[40%] right-[20%] w-2 h-2 rounded-full bg-slate-300"></div>
          <div className="absolute bottom-[30%] left-[25%] w-2 h-2 rounded-full bg-slate-300"></div>
          
          {/* Highlighted Top 1% Dots */}
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute top-[35%] left-[45%] w-3 h-3 rounded-full bg-[#10b981] shadow-[0_0_15px_rgba(16,185,129,0.8)]"
          ></motion.div>
          
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            className="absolute bottom-[40%] right-[35%] w-3 h-3 rounded-full bg-[#0ea5e9] shadow-[0_0_15px_rgba(14,165,233,0.8)]"
          ></motion.div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 relative z-10 w-full mt-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto flex flex-col items-center text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-100 shadow-sm mb-8">
            <ScanSearch className="w-4 h-4 text-[#10b981]" />
            <span className="text-xs font-bold tracking-wider uppercase text-slate-600">For HR & Tech Recruiters</span>
          </div>
          
          <h1 className="text-6xl sm:text-7xl lg:text-[85px] font-black text-slate-900 leading-[0.95] tracking-tighter mb-8">
            Stop reading resumes. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#10b981] to-[#0ea5e9]">Watch them build.</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto mb-10">
            Find the signal in the noise. Source, screen, and hire candidates based on verified proof of work from 7-day real-world simulations, not embellished PDFs.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
            <button
              onClick={onSignup}
              className="rounded-full bg-[#10b981] hover:bg-[#059669] px-8 py-4 text-sm font-bold text-slate-900 dark:text-white transition flex items-center justify-center gap-2 shadow-xl shadow-[#10b981]/20 hover:-translate-y-0.5"
            >
              Start Sourcing <ArrowRight className="w-4 h-4" />
            </button>
            <button
              className="rounded-full bg-white hover:bg-slate-50 border border-slate-100 px-8 py-4 text-sm font-bold text-slate-700 transition shadow-sm hover:-translate-y-0.5 flex items-center gap-2"
            >
              <Radar className="w-4 h-4" /> View Talent Radar
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
