import React from 'react';
import { motion } from 'motion/react';

export function LandingTargetAudience() {
  const audiences = [
    {
      id: "01",
      tag: "Career switcher",
      title: "You know you'd be good at this.",
      desc: "You have the adjacent skills, but you can't get past \"What have you shipped?\". Patchwork gives you a public portfolio of real product decisions before you get the job title."
    },
    {
      id: "02",
      tag: "First-Time Founder",
      title: "You're building, but nobody sees the struggle.",
      desc: "You're writing code and launching features in the dark. Open a live room, log your progress, and build an audience of observers who can become your first users."
    },
    {
      id: "03",
      tag: "Junior Builder",
      title: "You're shipping, but nobody's coaching you.",
      desc: "You're making decisions but aren't sure if they're right. Log your architecture and product choices on Patchwork, and get validated by senior engineers and PMs."
    },
    {
      id: "04",
      tag: "Senior Leader",
      title: "You've shipped. Now pay it forward.",
      desc: "You have the experience. Join as an Observer to review build logs, validate junior talent, and scout the absolute best builders for your next team."
    }
  ];

  return (
    <section className="bg-[#0a0a0a] py-28 sm:py-36 border-t border-white/5">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        
        <div className="mb-24 max-w-4xl">
          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="text-primary-500 font-bold text-sm tracking-widest mb-6 uppercase font-mono"
          >
            05 / Who it's for
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
            className="text-4xl sm:text-5xl lg:text-7xl font-black text-white tracking-tight leading-[1.05]"
          >
            Whether you're <span className="text-primary-500 italic">building, leading,</span> designing, or learning.
          </motion.h2>
        </div>

        <div className="grid md:grid-cols-2 gap-x-16 gap-y-16 lg:gap-y-24">
          {audiences.map((aud, idx) => (
            <motion.div 
              key={idx} 
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: idx * 0.1 }}
              className="relative"
            >
              <div className="flex items-center gap-3 mb-6">
                <span className="text-xs font-bold text-primary-500 uppercase tracking-widest font-mono">{aud.id}</span>
                <span className="text-slate-700 font-bold">—</span>
                <span className="text-xs font-bold text-white uppercase tracking-widest">{aud.tag}</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white mb-4 leading-tight">
                {aud.title}
              </h3>
              <p className="text-lg text-slate-400 leading-relaxed font-medium">
                {aud.desc}
              </p>
              
              {/* Animated top border */}
              <motion.div 
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: idx * 0.1 }}
                className="absolute -top-8 left-0 right-0 h-px bg-white/15 origin-left"
              />
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
