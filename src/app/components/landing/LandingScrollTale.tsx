import React, { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "motion/react";
import { PenTool, MessageSquare, Globe2 } from "lucide-react";

export function LandingScrollTale() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // Smooth the scroll progress for drawing the line
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 40, damping: 20 });
  
  // Keep the background dark to ensure white text remains readable and premium
  const backgroundColor = useTransform(
    scrollYProgress, 
    [0, 0.5, 1], 
    ["#0A0A0A", "#1e1b4b", "#0f172a"]
  );

  const steps = [
    {
      title: "Create Your Build Room",
      desc: "Document your daily progress, share live updates, and build your portfolio in public.",
      icon: <PenTool className="w-8 h-8 text-primary-400" />,
      color: "from-primary-500/20 to-purple-500/20",
      align: "left",
      scrollTrigger: [0.1, 0.3]
    },
    {
      title: "Gather Observer Feedback",
      desc: "Stop building in a silo. Let followers and stakeholders track your progress and provide sharp feedback.",
      icon: <MessageSquare className="w-8 h-8 text-blue-400" />,
      color: "from-blue-500/20 to-cyan-500/20",
      align: "right",
      scrollTrigger: [0.4, 0.6]
    },
    {
      title: "Get Expert Reviews",
      desc: "Establish true domain credibility. Request targeted reviews from verified industry experts to validate your work.",
      icon: <Globe2 className="w-8 h-8 text-emerald-400" />,
      color: "from-emerald-500/20 to-teal-500/20",
      align: "left",
      scrollTrigger: [0.7, 0.9]
    }
  ];

  return (
    <motion.section 
      ref={containerRef}
      style={{ backgroundColor }}
      className="relative min-h-[300vh] py-32 px-4 overflow-hidden transition-colors duration-700"
    >
      {/* The Connecting Thread */}
      <div className="absolute left-1/2 top-0 bottom-0 w-[2px] -translate-x-1/2 overflow-hidden bg-white/5">
        <motion.div 
          className="absolute top-0 left-0 right-0 origin-top bg-gradient-to-b from-primary-500 via-blue-500 to-emerald-500"
          style={{ height: useTransform(smoothProgress, [0, 1], ["0%", "100%"]) }}
        />
      </div>

      <div className="max-w-[1000px] mx-auto relative h-full flex flex-col justify-between" style={{ minHeight: '250vh' }}>
        
        {steps.map((step, idx) => {
          // Scale and opacity based on the specific scroll trigger window for this card
          const scale = useTransform(scrollYProgress, step.scrollTrigger, [0.8, 1]);
          const opacity = useTransform(scrollYProgress, step.scrollTrigger, [0, 1]);
          
          return (
            <motion.div 
              key={idx}
              style={{ scale, opacity }}
              className={`flex w-full ${step.align === 'left' ? 'justify-start' : 'justify-end'} relative z-10 px-2 sm:px-0`}
            >
              {/* Connecting Dot */}
              <div className="absolute left-1/2 top-1/2 w-4 h-4 rounded-full bg-white border-[4px] border-primary-500 -translate-x-1/2 -translate-y-1/2 shadow-[0_0_20px_rgba(139,124,248,0.5)] z-20" />
              
              {/* The Card */}
              <div className={`w-[75%] sm:w-[45%] bg-white/10 backdrop-blur-xl border border-white/20 p-5 sm:p-8 rounded-[24px] sm:rounded-[32px] shadow-2xl relative overflow-hidden group hover:bg-white/15 transition-colors`}>
                
                {/* Background ambient glow */}
                <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-50`} />
                
                <div className="relative z-10">
                  <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-white/10 flex items-center justify-center mb-4 sm:mb-6 ring-1 ring-white/20 backdrop-blur-md">
                    {step.icon}
                  </div>
                  <h3 className="text-[20px] sm:text-[32px] font-display font-extrabold text-white mb-2 sm:mb-4">
                    {step.title}
                  </h3>
                  <p className="text-[13px] sm:text-[18px] text-slate-300 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}

      </div>
    </motion.section>
  );
}
