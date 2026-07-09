import React, { useState } from "react";
import { motion } from "motion/react";
import { getAvatarUrl } from "../../utils/helpers";
import { showcaseBuilders } from "../../constants/landingData";

export function LandingNetworkShowcase() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // We will display a subset of builders for the honeycomb to keep it clean
  const builders = showcaseBuilders.slice(0, 6);

  return (
    <section className="relative py-32 bg-[#fafafa] overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-4 relative z-10">
        
        <div className="text-center mb-20">
          <h2 className="text-[42px] sm:text-[56px] font-display font-extrabold text-slate-900 leading-[1.1] mb-6">
            The Living Network
          </h2>
          <p className="text-[18px] text-slate-500 max-w-[600px] mx-auto">
            Explore active builders right now. They aren't waiting for a launch day; they are building in public, today.
          </p>
        </div>

        {/* Dynamic Drifting Grid */}
        <div className="relative w-full h-[600px] flex items-center justify-center">
          
          {/* Background subtle grid lines to ground it */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />

          {builders.map((builder, idx) => {
            // Calculate a pseudo-random starting position around the center
            const angle = (idx / builders.length) * Math.PI * 2;
            const radius = 200 + (idx % 2 === 0 ? 50 : 0);
            const startX = Math.cos(angle) * radius;
            const startY = Math.sin(angle) * radius;

            const isHovered = hoveredIndex === idx;
            const isBlurry = hoveredIndex !== null && !isHovered;

            return (
              <motion.div
                key={builder.id}
                initial={{ x: startX, y: startY, opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                animate={{
                  x: isHovered ? 0 : startX, // Snaps to center on hover!
                  y: isHovered ? 0 : startY,
                  scale: isHovered ? 1.2 : 1,
                  zIndex: isHovered ? 50 : 10,
                  filter: isBlurry ? "blur(8px)" : "blur(0px)",
                  opacity: isBlurry ? 0.4 : 1,
                }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 20,
                  mass: 0.8
                }}
                className={`absolute w-[280px] bg-white rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-slate-100 p-5 cursor-pointer`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <img 
                    src={getAvatarUrl(builder.name)} 
                    alt={builder.name} 
                    className="w-12 h-12 rounded-full ring-4 ring-primary-50"
                  />
                  <div>
                    <h4 className="font-bold text-slate-900 text-[15px]">{builder.name}</h4>
                    <span className="text-[12px] font-medium text-primary-500 uppercase tracking-wider">{builder.domain}</span>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-[16px] p-4 border border-slate-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Latest Update</span>
                    <span className="text-[11px] text-slate-400">2h ago</span>
                  </div>
                  <p className="text-[13px] text-slate-700 leading-relaxed line-clamp-3">
                    {builder.updates?.[0]?.content || "No updates yet."}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
