import React from 'react';
import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export function LandingFeaturesCapstone() {
  const rooms = [
    { title: "Spotify", role: "Recommendation Engine", time: "Day 14", color: "bg-emerald-500", init: "SP" },
    { title: "Stripe", role: "Checkout Flow Redesign", time: "Day 3", color: "bg-indigo-500", init: "ST" },
    { title: "Airbnb", role: "Host Dashboard", time: "Day 8", color: "bg-orange-500", init: "AB" },
    { title: "Slack", role: "Threading Architecture", time: "Day 5", color: "bg-rose-500", init: "SL" },
  ];

  return (
    <section className="bg-[#0f0f0f] py-20 sm:py-24 overflow-hidden border-t border-white/5">
      <div className="mx-auto max-w-7xl px-6">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <p className="text-[11px] font-bold text-primary-500 tracking-wider mb-3 uppercase">
            What you get
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.1]">
            Everything you need to prove your skills.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-400 font-medium leading-relaxed max-w-xl mx-auto">
            Build in public, capture your thought process in real-time, and let senior observers validate your decisions to build an undeniable portfolio.
          </p>
        </motion.div>

        {/* Feature Split 1 */}
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          
          {/* Left: Copy */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="max-w-lg order-2 lg:order-1"
          >
            <p className="text-[11px] font-bold text-primary-500 tracking-wider mb-2 uppercase">
              Build Logs
            </p>
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Live Build Rooms
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Stop hiding your work in private repos. Open a dedicated room for your project, log your pivots, draft PRDs, and document architecture choices exactly as they happen.
            </p>
            
            <button className="px-5 py-2.5 bg-black border border-white/10 hover:border-white/30 text-white rounded-lg font-bold text-xs transition flex items-center gap-2">
              Explore live rooms <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>

          {/* Right: Mockup */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, x: 30 }}
            whileInView={{ opacity: 1, scale: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, type: "spring", bounce: 0.3 }}
            className="relative order-1 lg:order-2"
          >
            {/* Background glowing container */}
            <div className="relative rounded-[1.5rem] p-6 sm:p-8 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-orange-600 to-amber-900 opacity-90 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 opacity-[0.15] mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
              
              {/* Inner Dark Dashboard Mockup */}
              <div className="relative bg-[#0a0a0a] rounded-xl border border-white/10 shadow-2xl overflow-hidden">
                <div className="p-5">
                  <div className="flex justify-between items-end mb-5">
                    <div>
                      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Live Feed</div>
                      <div className="text-base font-bold text-white">Active Rooms</div>
                    </div>
                    <div className="text-[9px] font-bold text-primary-500 uppercase tracking-widest">
                      142 Active Builds
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {rooms.map((room, idx) => (
                      <div key={idx} className="border border-white/5 rounded-lg p-2.5 flex items-start gap-2.5 bg-white/[0.02]">
                        <div className={`w-6 h-6 rounded-md ${room.color} flex items-center justify-center text-white text-[9px] font-bold shrink-0`}>
                          {room.init}
                        </div>
                        <div>
                          <div className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">{room.title}</div>
                          <div className="text-[11px] font-bold text-white mt-0.5">{room.role}</div>
                          <div className="text-[9px] text-slate-400 mt-0.5">{room.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 pt-3 border-t border-white/5 flex justify-between items-center">
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest">More rooms created daily</span>
                    <span className="text-[9px] font-bold text-primary-500 flex items-center gap-1 cursor-pointer">
                      Browse all <ArrowRight className="w-2.5 h-2.5" />
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
