import React, { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { ArrowRight, Sparkles } from "lucide-react";

interface LandingHeroReduxProps {
  onSignup: () => void;
}

export function LandingHeroRedux({ onSignup }: LandingHeroReduxProps) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Smooth out mouse tracking for a floaty feel
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize mouse coordinates to -1 to 1 range relative to center
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  // Generate random particles for the void
  const [particles] = useState(() => 
    Array.from({ length: 40 }).map(() => ({
      x: Math.random() * 100, // percentage
      y: Math.random() * 100, // percentage
      size: Math.random() * 4 + 1,
      parallaxFactor: Math.random() * 30 + 10,
      opacity: Math.random() * 0.5 + 0.1,
    }))
  );

  return (
    <section className="relative w-full h-[100vh] sm:h-[120vh] bg-[#0A0A0A] overflow-hidden flex flex-col items-center justify-center">
      
      {/* Interactive Void Background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {particles.map((p, i) => {
          // Each particle moves slightly differently based on mouse
          const moveX = useTransform(springX, [-1, 1], [-p.parallaxFactor, p.parallaxFactor]);
          const moveY = useTransform(springY, [-1, 1], [-p.parallaxFactor, p.parallaxFactor]);
          
          return (
            <motion.div
              key={i}
              className="absolute rounded-full bg-primary-400"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                opacity: p.opacity,
                x: moveX,
                y: moveY,
                boxShadow: `0 0 ${p.size * 2}px rgba(139, 124, 248, 0.4)`
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [p.opacity, p.opacity * 2, p.opacity],
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          );
        })}
        
        {/* Giant interactive cursor glow */}
        <motion.div 
          className="absolute w-[600px] h-[600px] rounded-full bg-primary-500/10 blur-[100px] pointer-events-none -translate-x-1/2 -translate-y-1/2"
          style={{
            left: useTransform(springX, [-1, 1], ["0%", "100%"]),
            top: useTransform(springY, [-1, 1], ["0%", "100%"]),
          }}
        />
      </div>

      {/* Storytelling Text */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-[800px] pb-24">
        {/* Storytelling Text */}
        <motion.h1 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
          className="text-[36px] sm:text-[72px] leading-[1.1] font-display font-extrabold text-white mb-6"
        >
          The Operating System for <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-purple-300 to-indigo-400">
            Builders.
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="text-[15px] sm:text-[20px] text-slate-400 mb-12 max-w-[700px] leading-relaxed mx-auto font-medium"
        >
          Capture every decision, document every iteration, and collaborate with builders who help you grow. Share your journey, gather meaningful feedback, and build a living record of how you think, solve problems, and create products. All in one place.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 1.4 }}
          className="flex flex-col sm:flex-row items-center gap-4 justify-center w-full mt-4"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onSignup}
            className="px-8 py-4 bg-white text-black rounded-full font-bold text-[16px] border border-transparent shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_50px_rgba(255,255,255,0.4)] transition-all"
          >
            Start your build log
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.href = '/login'}
            className="group px-8 py-4 bg-transparent text-white rounded-full font-bold text-[16px] border border-white/20 flex items-center gap-2 hover:bg-white/5 transition-all"
          >
            Enter dashboard
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </motion.div>
      </div>

      {/* Scroll Down Indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5, duration: 1 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none"
      >
        <span className="text-[11px] text-slate-500 uppercase tracking-widest font-bold">Scroll to explore</span>
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="w-[1px] h-12 bg-gradient-to-b from-primary-500/50 to-transparent"
        />
      </motion.div>

    </section>
  );
}
