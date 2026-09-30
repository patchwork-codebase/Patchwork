import React from 'react';
import { motion } from 'motion/react';

export function LandingSlider() {
  const partners = [
    "Spotify", "Stripe", "Linear", "Vercel", "Airbnb", "Netflix", "Ramp", "Coinbase", "Notion", "Figma"
  ];

  // We duplicate the list to create a seamless infinite loop
  const marqueeItems = [...partners, ...partners, ...partners];

  return (
    <section className="bg-[#0a0a0a] py-24 sm:py-32 border-t border-white/5 overflow-hidden relative">
      <div className="absolute inset-0 z-0 opacity-30 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary-500/10 via-[#0a0a0a] to-[#0a0a0a]" />

      <div className="relative z-10 text-center mb-16 px-6 max-w-2xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-primary-500 font-bold text-sm tracking-widest uppercase font-mono mb-6"
        >
          06 / The Network
        </motion.div>
        <motion.h2 
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-5xl font-black text-white tracking-tight"
        >
          Scouted by the best.
        </motion.h2>
      </div>

      {/* Infinite Marquee */}
      <div className="relative w-full flex overflow-hidden group">
        {/* Left/Right fading masks */}
        <div className="absolute inset-y-0 left-0 w-24 sm:w-48 bg-gradient-to-r from-[#0a0a0a] to-transparent z-20 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-24 sm:w-48 bg-gradient-to-l from-[#0a0a0a] to-transparent z-20 pointer-events-none" />

        <motion.div
          animate={{ x: ["0%", "-33.333333%"] }}
          transition={{
            ease: "linear",
            duration: 20,
            repeat: Infinity,
          }}
          className="flex whitespace-nowrap gap-8 sm:gap-16 px-4 items-center"
        >
          {marqueeItems.map((partner, i) => (
            <div 
              key={i} 
              className="text-3xl sm:text-5xl font-black text-slate-800 uppercase tracking-tighter hover:text-white transition-colors duration-300 cursor-default"
            >
              {partner}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
