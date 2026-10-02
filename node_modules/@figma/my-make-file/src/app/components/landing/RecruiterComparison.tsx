import React from 'react';
import { motion } from 'motion/react';

export function RecruiterComparison() {
  return (
    <section className="bg-white py-24 sm:py-32 border-t border-slate-100">
      <div className="mx-auto max-w-5xl px-6">
        
        {/* Top Badges */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center mb-16"
        >
          <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-6">
            <span>How you evaluate talent today</span>
            <div className="flex gap-2">
              <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full border border-slate-200">Static</span>
              <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full border border-slate-200">Polished</span>
              <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full border border-slate-200">Unverified</span>
            </div>
          </div>
          
          <div className="text-left w-full max-w-4xl">
            <span className="text-[10px] font-bold text-[#FF5B22] tracking-wider uppercase mb-3 block">
              The shift
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
              Profiles tell you what they did. <br />
              <span className="text-[#FF5B22] italic">Build logs prove it.</span>
            </h2>
          </div>
        </motion.div>

        {/* Comparison Table */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <div className="rounded-2xl border border-slate-200 bg-[#FAFAF9] overflow-hidden">
            <div className="grid grid-cols-3 border-b border-slate-200 text-[10px] font-bold uppercase tracking-widest">
              <div className="p-6 text-slate-400"></div>
              <div className="p-6 text-slate-500">Hiring Today</div>
              <div className="p-6 text-[#FF5B22]">The Patchwork Way</div>
            </div>

            <div className="grid grid-cols-3 border-b border-slate-200 items-center">
              <div className="p-6 text-[10px] font-bold uppercase tracking-widest text-slate-500">You judge by</div>
              <div className="p-6 text-sm text-slate-600 font-medium">A polished portfolio or résumé.</div>
              <div className="p-6 text-sm text-slate-900 font-bold">The messy middle of a real build.</div>
            </div>

            <div className="grid grid-cols-3 border-b border-slate-200 items-center bg-white">
              <div className="p-6 text-[10px] font-bold uppercase tracking-widest text-slate-500">You see</div>
              <div className="p-6 text-sm text-slate-600 font-medium">The final, sanitized result.</div>
              <div className="p-6 text-sm text-slate-900 font-bold">How they handle setbacks and pivots.</div>
            </div>

            <div className="grid grid-cols-3 items-center">
              <div className="p-6 text-[10px] font-bold uppercase tracking-widest text-slate-500">You interact via</div>
              <div className="p-6 text-sm text-slate-600 font-medium">Cold outreach and scheduled interviews.</div>
              <div className="p-6 text-sm text-slate-900 font-bold">In-context feedback and reactions.</div>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
