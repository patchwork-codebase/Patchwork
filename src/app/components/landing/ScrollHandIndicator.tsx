import React, { useEffect, useState } from "react";
import { motion, useScroll, useSpring, useTransform, AnimatePresence } from "motion/react";

export function ScrollHandIndicator() {
  const { scrollY } = useScroll();
  const [interacted, setInteracted] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isGrabbing, setIsGrabbing] = useState(false);

  // Smooth the scroll for physics
  const smoothY = useSpring(scrollY, { damping: 25, stiffness: 120 });

  // When scrollY goes from 0 to 400, the hand pulls UP from 0 to -150
  // meaning it retreats back into the top of the screen as you scroll down
  const handDragY = useTransform(smoothY, [0, 400], [0, -150]);

  // Rotate slightly as it pulls up
  const handRotate = useTransform(smoothY, [0, 400], [0, -5]);

  useEffect(() => {
    let idleTimer: NodeJS.Timeout;
    let grabTimer: NodeJS.Timeout;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsAtTop(currentScrollY < 50);

      // Trigger grab animation while scrolling
      setIsGrabbing(true);
      clearTimeout(grabTimer);
      grabTimer = setTimeout(() => {
        setIsGrabbing(false);
      }, 150); // Stop grabbing shortly after scroll stops

      // Once user scrolls past a threshold, mark as interacted
      if (currentScrollY > 150 && !interacted) {
        setInteracted(true);
      }

      // Reset idle timer on any activity
      setIsIdle(false);
      clearTimeout(idleTimer);

      // Set new idle timer
      idleTimer = setTimeout(() => {
        setIsIdle(true);
      }, 5000); // 5 seconds of inactivity
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    // Initial idle timer
    idleTimer = setTimeout(() => {
      setIsIdle(true);
    }, 5000);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(idleTimer);
      clearTimeout(grabTimer);
    };
  }, [interacted]);

  // Visible on initial load (!interacted) OR if at top and idle
  const isVisible = (!interacted && isAtTop) || (interacted && isAtTop && isIdle);

  return (
    <div className="fixed inset-x-0 top-0 pointer-events-none z-[100] flex justify-center items-start overflow-visible h-screen">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ y: -200, opacity: 0 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ y: -200, opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-0 flex flex-col items-center origin-top"
            style={{ 
              y: handDragY, 
              rotate: handRotate,
              // Move down a bit so it peeks out from the "dynamic island" / top edge
              paddingTop: "20px"
            }}
          >
            {/* The looping bounce animation when at the top, only if not grabbing */}
            <motion.div
              animate={isAtTop && !isGrabbing && smoothY.get() < 10 ? { y: [0, 15, 0] } : { y: 0 }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              className="relative flex flex-col items-center"
            >
              {/* Gravity Drop Line Substitute */}
              <div 
                className="relative transition-all duration-300 flex flex-col items-center justify-start h-32 origin-top drop-shadow-sm"
                style={{ transform: isGrabbing ? "scaleY(1.3) translateY(15px)" : "scaleY(1)" }}
              >
                {/* The Vertical Line */}
                <div className="w-[3px] h-full bg-gradient-to-b from-slate-300 to-transparent relative overflow-hidden rounded-full">
                  {/* The Glowing Droplet */}
                  <motion.div 
                    className="absolute top-0 left-0 w-full h-[40px] bg-gradient-to-b from-transparent via-slate-800 to-transparent"
                    style={{ filter: "drop-shadow(0 0 4px rgba(30, 41, 59, 0.8))" }}
                    animate={{ y: [-40, 150] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
                  />
                </div>
                {/* Optional Scroll Text */}
                <motion.div 
                  className="mt-4 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400"
                  animate={{ opacity: isGrabbing ? 0 : 1 }}
                  transition={{ duration: 0.2 }}
                >
                  Scroll
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


