import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Eye } from 'lucide-react';
import { useNavigate } from 'react-router';

export function RecruiterHero() {
  const navigate = useNavigate();

  return (
    <section className="relative pt-32 pb-20 overflow-hidden bg-[#FAFAF9]">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto flex flex-col items-center"
        >
          {/* Badge */}
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-[#FF5B22]"></div>
            <span className="text-[10px] font-bold text-[#FF5B22] tracking-wider uppercase">
              For Mentors, Peers & Hiring Teams
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-5xl sm:text-6xl lg:text-[72px] font-black text-slate-900 leading-[1.05] tracking-tight mb-6">
            A new way to <br />
            <span className="text-[#FF5B22] italic">discover talent.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-[15px] sm:text-base text-slate-500 font-medium leading-relaxed max-w-xl mx-auto mb-10">
            Stop guessing from static profiles. Watch builders solve real problems in 7-day simulations. Provide feedback, see how they iterate, and discover verifiable proof of their skills.
          </p>

          {/* CTA Button */}
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center mt-4">
            <button
              onClick={() => navigate('/signup')}
              className="rounded-full bg-[#FF5B22] hover:bg-[#e84f1b] px-8 py-4 text-sm font-bold text-white transition flex items-center justify-center gap-2 shadow-lg shadow-[#FF5B22]/20 hover:shadow-[#FF5B22]/40 hover:-translate-y-0.5"
            >
              Become an Observer <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="rounded-full bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 px-8 py-4 text-sm font-bold text-slate-700 transition flex items-center justify-center gap-2"
            >
              Sign In to Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
