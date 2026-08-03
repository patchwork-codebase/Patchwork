import React from 'react';
import { motion } from 'motion/react';
import { FileText, Link2, Users, LayoutDashboard, CornerRightDown } from 'lucide-react';

export function PMFeatures() {
  return (
    <section className="py-32 bg-[#FAFAF9] relative overflow-hidden min-h-screen flex flex-col justify-center">
      {/* Dot Grid Background for Whiteboard Feel */}
      <div 
        className="absolute inset-0 opacity-[0.5]" 
        style={{ backgroundImage: 'radial-gradient(#CBD5E1 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }}
      ></div>

      <div className="mx-auto max-w-7xl px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-24">
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-6">
            The ultimate <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#14b8a6] to-[#3b82f6]">whiteboard.</span>
          </h2>
          <p className="text-slate-600 leading-relaxed text-xl">
            Everything connects. Map out your PRDs, link them directly to engineering tickets, and track the real-time velocity of your sprints on an infinite canvas.
          </p>
        </div>

        {/* Whiteboard Canvas Area */}
        <div className="relative w-full max-w-5xl mx-auto h-[600px] bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden hidden md:block">
          {/* Canvas Background Grid */}
          <div className="absolute inset-0 opacity-[0.3]" style={{ backgroundImage: 'linear-gradient(#E2E8F0 1px, transparent 1px), linear-gradient(90deg, #E2E8F0 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
          
          {/* SVG Connecting Arrows */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <motion.path 
              initial={{ strokeDashoffset: 1000, strokeDasharray: 1000 }}
              whileInView={{ strokeDashoffset: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 2, ease: "easeInOut" }}
              d="M 250 150 Q 400 150 450 300" 
              fill="transparent" 
              stroke="#94a3b8" 
              strokeWidth="2" 
              strokeDasharray="6 6"
            />
            <motion.path 
              initial={{ strokeDashoffset: 1000, strokeDasharray: 1000 }}
              whileInView={{ strokeDashoffset: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 2, delay: 0.5, ease: "easeInOut" }}
              d="M 650 350 C 750 350, 750 150, 850 200" 
              fill="transparent" 
              stroke="#94a3b8" 
              strokeWidth="2" 
              strokeDasharray="6 6"
            />
          </svg>

          {/* Sticky Note 1: PRD */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, rotate: -15 }}
            whileInView={{ opacity: 1, scale: 1, rotate: -2 }}
            viewport={{ once: true }}
            transition={{ type: "spring" }}
            className="absolute top-[8%] left-[5%] w-64 bg-amber-100 p-5 shadow-lg border border-amber-200 z-10 cursor-grab active:cursor-grabbing hover:scale-105 transition-transform"
            drag
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.1}
          >
            <div className="flex items-center gap-2 mb-3 border-b border-amber-200 pb-2">
              <FileText className="w-5 h-5 text-amber-700" />
              <span className="font-bold text-amber-900 text-sm">Dynamic PRDs</span>
            </div>
            <p className="text-amber-800 text-sm font-medium leading-relaxed font-handwriting">
              Write requirements that automatically sync with GitHub issues. No more stale docs!
            </p>
          </motion.div>

          {/* Sticky Note 2: Agile Boards */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, rotate: 15 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 3 }}
            viewport={{ once: true }}
            transition={{ type: "spring", delay: 0.2 }}
            className="absolute top-[35%] left-[38%] w-72 bg-white p-5 shadow-xl border border-slate-100 rounded-xl z-10 cursor-grab active:cursor-grabbing hover:scale-105 transition-transform"
            drag
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.1}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                <Link2 className="w-4 h-4 text-teal-600" />
              </div>
              <span className="font-bold text-slate-800 text-sm">Two-Way GitHub Sync</span>
            </div>
            <div className="flex gap-2">
              <div className="w-1/2 h-20 bg-slate-50 rounded-lg border border-slate-100 p-2 shadow-sm dark:shadow-none">
                <div className="w-full h-2 bg-slate-200 rounded-full mb-2"></div>
                <div className="w-2/3 h-2 bg-slate-200 rounded-full"></div>
              </div>
              <div className="w-1/2 h-20 bg-teal-50 rounded-lg border border-teal-100 p-2 relative">
                <div className="w-full h-2 bg-teal-200 rounded-full mb-2"></div>
                <div className="w-1/2 h-2 bg-teal-200 rounded-full"></div>
                <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-white rounded-full border border-teal-200 flex items-center justify-center shadow-sm">
                  <span className="text-[10px]">✓</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Sticky Note 3: Velocity */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
            whileInView={{ opacity: 1, scale: 1, rotate: -4 }}
            viewport={{ once: true }}
            transition={{ type: "spring", delay: 0.4 }}
            className="absolute top-[15%] right-[5%] w-64 bg-blue-50 p-5 shadow-lg border border-blue-100 rounded-lg z-10 cursor-grab active:cursor-grabbing hover:scale-105 transition-transform"
            drag
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.1}
          >
            <div className="flex items-center gap-2 mb-3">
              <LayoutDashboard className="w-5 h-5 text-blue-600" />
              <span className="font-bold text-blue-900 text-sm">Real-time Velocity</span>
            </div>
            <div className="h-24 flex items-end gap-2 mt-4 border-b border-blue-200 pb-1">
              <div className="w-1/4 bg-blue-300 h-[40%] rounded-t-sm"></div>
              <div className="w-1/4 bg-blue-400 h-[60%] rounded-t-sm"></div>
              <div className="w-1/4 bg-blue-500 h-[80%] rounded-t-sm"></div>
              <div className="w-1/4 bg-blue-600 h-[100%] rounded-t-sm"></div>
            </div>
            <p className="text-blue-800 text-xs font-medium mt-3">
              Stop guessing. See verified proof of work from your team every sprint.
            </p>
          </motion.div>
        </div>

        {/* Mobile View (Standard Grid) */}
        <div className="grid grid-cols-1 gap-6 md:hidden">
          <div className="bg-amber-100 p-6 rounded-2xl border border-amber-200 transform rotate-1 shadow-md">
            <h3 className="font-bold text-amber-900 mb-2 flex items-center gap-2"><FileText className="w-5 h-5" /> Dynamic PRDs</h3>
            <p className="text-amber-800 text-sm">Write requirements that automatically sync with GitHub issues. No more stale docs!</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-md">
            <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><Link2 className="w-5 h-5 text-teal-500" /> Two-Way Sync</h3>
            <p className="text-slate-600 text-sm">Changes in Patchwork sync to GitHub, and vice versa. Always stay aligned.</p>
          </div>
          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 shadow-md transform -rotate-1">
            <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2"><LayoutDashboard className="w-5 h-5" /> Velocity Tracking</h3>
            <p className="text-blue-800 text-sm">Stop guessing. See verified proof of work from your team every sprint.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
