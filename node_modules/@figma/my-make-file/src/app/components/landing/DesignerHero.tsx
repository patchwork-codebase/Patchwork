import React from 'react';
import { motion } from 'motion/react';
import { MousePointer2, Frame, ArrowRight } from 'lucide-react';

export function DesignerHero({ onSignup }: { onSignup: () => void }) {
  return (
    <section className="relative pt-32 pb-32 overflow-hidden bg-[#F3F4F6] min-h-[90vh] flex items-center">
      {/* Figma-like Grid Background */}
      <div 
        className="absolute inset-0 opacity-[0.4]" 
        style={{ backgroundImage: 'radial-gradient(#9CA3AF 1px, transparent 1px)', backgroundSize: '24px 24px' }}
      ></div>
      
      {/* Floating Canvas UI Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Bounding Box 1 */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="absolute top-[15%] left-[10%] border border-[#0ea5e9] bg-white/50 backdrop-blur-md p-4 w-48 shadow-sm hidden md:block"
        >
          <div className="absolute -top-2 -left-2 w-1.5 h-1.5 border border-[#0ea5e9] bg-white"></div>
          <div className="absolute -bottom-2 -right-2 w-1.5 h-1.5 border border-[#0ea5e9] bg-white"></div>
          <div className="absolute -top-[22px] left-[-1px] bg-[#0ea5e9] text-slate-900 dark:text-white text-[10px] font-bold px-1.5 py-0.5 rounded-[2px]">Nav Component</div>
          <div className="h-2 bg-slate-200 rounded-full w-3/4 mb-2"></div>
          <div className="h-2 bg-slate-100 rounded-full w-1/2"></div>
        </motion.div>

        {/* Bounding Box 2 */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="absolute bottom-[20%] right-[15%] border border-[#ec4899] bg-white/50 backdrop-blur-md p-6 w-64 shadow-sm hidden md:block"
        >
          <div className="absolute -top-2 -left-2 w-1.5 h-1.5 border border-[#ec4899] bg-white"></div>
          <div className="absolute -bottom-2 -right-2 w-1.5 h-1.5 border border-[#ec4899] bg-white"></div>
          <div className="absolute -top-[22px] left-[-1px] bg-[#ec4899] text-slate-900 dark:text-white text-[10px] font-bold px-1.5 py-0.5 rounded-[2px]">Primary CTA</div>
          <div className="w-full bg-[#ec4899] h-10 rounded-lg flex items-center justify-center">
            <div className="w-16 h-2 bg-white/50 rounded-full"></div>
          </div>
          <div className="absolute right-[-40px] top-[20px] text-[#ec4899] text-[10px] font-mono font-bold tracking-wider">H: 40px</div>
        </motion.div>

        {/* Fake Cursor */}
        <motion.div
          initial={{ x: '100vw', y: '100vh' }}
          animate={{ x: '60vw', y: '40vh' }}
          transition={{ 
            duration: 3, 
            type: "spring", 
            stiffness: 40,
            damping: 15,
            repeat: Infinity,
            repeatType: 'reverse',
            repeatDelay: 1
          }}
          className="absolute z-50 flex items-center hidden lg:flex"
        >
          <MousePointer2 className="w-6 h-6 text-[#ec4899] fill-[#ec4899] rotate-[-20deg]" />
          <div className="bg-[#ec4899] text-slate-900 dark:text-white text-[10px] font-bold px-2 py-1 rounded-full ml-1 shadow-md">Alex (Designer)</div>
        </motion.div>
      </div>

      <div className="mx-auto max-w-7xl px-6 relative z-10 w-full">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto flex flex-col items-center text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-100 shadow-sm mb-8">
            <Frame className="w-4 h-4 text-[#ec4899]" />
            <span className="text-xs font-bold tracking-wider uppercase text-slate-700">For UI/UX Designers</span>
          </div>
          
          <h1 className="text-6xl sm:text-7xl lg:text-[90px] font-black text-slate-900 leading-[0.95] tracking-tighter mb-8 mix-blend-multiply">
            Don't just hand off. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ec4899] to-[#8b5cf6]">Build together.</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto mb-10">
            Bridge the gap between design tokens and tailwind classes. Review visual implementations, approve UI tickets, and get verified credit for your design contributions.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
            <button
              onClick={onSignup}
              className="rounded-full bg-[#ec4899] hover:bg-[#d946ef] px-8 py-4 text-sm font-bold text-slate-900 dark:text-white transition flex items-center justify-center gap-2 shadow-xl shadow-[#ec4899]/20 hover:-translate-y-0.5"
            >
              Start Designing <ArrowRight className="w-4 h-4" />
            </button>
            <button
              className="rounded-full bg-white hover:bg-slate-50 border border-slate-100 px-8 py-4 text-sm font-bold text-slate-700 transition shadow-sm hover:-translate-y-0.5"
            >
              View Developer Handoff
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
