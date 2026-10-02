import React from 'react';
import { motion } from 'motion/react';
import { Palette, Eye, ArrowRightLeft, CheckCircle2 } from 'lucide-react';

export function DesignerFeatures() {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
            Where design meets <span className="text-[#ec4899] italic">execution.</span>
          </h2>
          <p className="text-slate-500 leading-relaxed text-lg">
            Stop losing fidelity in translation. Patchwork gives designers the tools to verify implementation, review PRs visually, and build a verified portfolio of shipped products.
          </p>
        </div>

        {/* Bento Box Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
          
          {/* Box 1: Design to Code */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="md:col-span-2 bg-slate-50 rounded-3xl border border-slate-100 p-8 flex flex-col justify-between overflow-hidden relative group shadow-sm dark:shadow-none"
          >
            <div className="relative z-10 max-w-md">
              <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center mb-6">
                <ArrowRightLeft className="w-6 h-6 text-[#ec4899]" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Perfect Handoff</h3>
              <p className="text-slate-500">Link your design system tokens directly to Tailwind config. Developers see exactly what classes to use, automatically.</p>
            </div>
            
            {/* Visual element */}
            <div className="absolute right-[-20%] bottom-[-20%] w-[80%] h-[120%] bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 rotate-[-5deg] group-hover:rotate-0 transition-transform duration-500">
              <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-100">
                <div className="w-8 h-8 rounded-full bg-pink-500"></div>
                <div>
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Token</div>
                  <div className="font-mono text-sm font-bold text-slate-800">colors.primary.500</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white font-mono text-xs">Tw</div>
                <div>
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Class</div>
                  <div className="font-mono text-sm font-bold text-[#0ea5e9]">text-pink-500</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Box 2: Visual QA */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 flex flex-col justify-between overflow-hidden relative group shadow-sm dark:shadow-none"
          >
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-6">
                <Eye className="w-6 h-6 text-slate-900 dark:text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Visual QA</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Approve or reject PRs based on visual implementation directly from the browser.</p>
            </div>
            <div className="mt-8 flex justify-end">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-slate-100 dark:border-white/10 flex items-center gap-3 shadow-sm dark:shadow-none">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="text-slate-900 dark:text-white text-sm font-bold">Pixel Perfect</span>
              </div>
            </div>
          </motion.div>

          {/* Box 3: Proof of Design */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="md:col-span-3 bg-gradient-to-r from-violet-100 to-pink-100 rounded-3xl border border-white p-8 flex flex-col md:flex-row items-center gap-8 overflow-hidden relative"
          >
            <div className="flex-1">
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center mb-6 shadow-sm">
                <Palette className="w-6 h-6 text-violet-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Verified Design Portfolio</h3>
              <p className="text-slate-600 max-w-lg">
                Just like developers build GitHub graphs, designers build verified proof of shipped UI. Get recognized for your specific contributions to live projects and showcase your real-world impact.
              </p>
            </div>
            <div className="flex-1 w-full relative h-[200px]">
              <div className="absolute inset-0 bg-white/50 backdrop-blur-sm border border-white rounded-2xl shadow-xl p-6 flex flex-col justify-center">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#ec4899] to-[#8b5cf6]"></div>
                  <div>
                    <div className="font-bold text-slate-900">Alex Designer</div>
                    <div className="text-xs font-medium text-slate-500">Shipped 42 Components</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className={`h-8 flex-1 rounded-md ${i % 3 === 0 ? 'bg-pink-400' : i % 2 === 0 ? 'bg-violet-400' : 'bg-slate-200'}`}></div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
