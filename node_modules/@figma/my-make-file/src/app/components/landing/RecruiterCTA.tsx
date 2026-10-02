import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router';

export function RecruiterCTA() {
  const navigate = useNavigate();

  return (
    <section className="relative pt-32 pb-20 overflow-hidden bg-[#FAFAF9]">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto flex flex-col items-center"
        >
          {/* Badge */}
          <div className="mb-6">
            <span className="text-[10px] font-bold text-[#FF5B22] tracking-wider uppercase">
              Early access
            </span>
          </div>

          {/* Heading */}
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight mb-6">
            Get in before the <span className="text-[#FF5B22] italic">first 20.</span>
          </h2>

          {/* Subtitle */}
          <p className="text-[15px] sm:text-base text-slate-500 font-medium leading-relaxed max-w-xl mx-auto mb-10">
            Observer seats are currently invite-only to maintain high-quality feedback and tight-knit communities. Join the waitlist to secure your spot as an early mentor or hiring partner.
          </p>

          {/* CTA Button */}
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center mt-4">
            <button
              onClick={() => navigate('/signup')}
              className="rounded-full bg-[#FF5B22] hover:bg-[#e84f1b] px-8 py-4 text-sm font-bold text-white transition flex items-center justify-center gap-2 shadow-lg shadow-[#FF5B22]/20 hover:shadow-[#FF5B22]/40 hover:-translate-y-0.5"
            >
              Become an Observer <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="mt-8 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
            Join the community of <span className="text-[#FF5B22]">Observers</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
