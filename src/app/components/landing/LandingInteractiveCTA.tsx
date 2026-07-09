import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { ArrowRight } from "lucide-react";

interface LandingInteractiveCTAProps {
  onSignup: () => void;
}

export function LandingInteractiveCTA({ onSignup }: LandingInteractiveCTAProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end end"]
  });

  // As the user scrolls to the bottom, the orb expands from 0 to fill the background
  const orbScale = useTransform(scrollYProgress, [0.3, 1], [0.5, 20]);
  const contentOpacity = useTransform(scrollYProgress, [0.7, 1], [0, 1]);
  const contentY = useTransform(scrollYProgress, [0.7, 1], [50, 0]);

  return (
    <section ref={containerRef} className="relative h-[150vh] bg-[#fafafa] overflow-hidden">
      
      {/* Sticky container holds the animation in place while scrolling */}
      <div className="sticky top-0 h-[100vh] w-full flex items-center justify-center overflow-hidden">
        
        {/* The Expanding Orb */}
        <motion.div 
          className="absolute w-[100px] h-[100px] rounded-full bg-gradient-to-tr from-primary-600 via-indigo-500 to-purple-500"
          style={{ scale: orbScale }}
        />

        {/* Content revealed inside the expanded orb */}
        <motion.div 
          style={{ opacity: contentOpacity, y: contentY }}
          className="relative z-10 text-center flex flex-col items-center px-4"
        >
          <h2 className="text-[56px] sm:text-[84px] font-display font-extrabold text-white mb-6 leading-[1.1] tracking-tight drop-shadow-xl">
            Ready to establish <br />
            your credibility?
          </h2>
          <p className="text-[20px] text-white/80 max-w-[500px] mb-12 font-medium">
            Join the platform where fearless builders document their journey and earn expert validation.
          </p>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onSignup}
            className="px-10 py-5 bg-white text-primary-600 rounded-full font-bold text-[18px] flex items-center gap-3 shadow-[0_0_50px_rgba(255,255,255,0.3)] hover:shadow-[0_0_80px_rgba(255,255,255,0.5)] transition-all"
          >
            Create Your Patchwork
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>

      </div>
    </section>
  );
}
