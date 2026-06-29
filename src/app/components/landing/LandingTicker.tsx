import { motion } from "motion/react";
import { Hammer } from "lucide-react";
import { getAvatarUrl } from "../../utils/helpers";

const leftPositions = [
  // Top Row (curves slightly up at the edges)
  { x: -140, y: -45, scale: 0.90, seed: "sarah" },
  { x: -210, y: -42, scale: 0.95, seed: "chidi" },
  { x: -280, y: -35, scale: 1.00, seed: "amara" },
  { x: -350, y: -22, scale: 1.05, seed: "dave" },
  { x: -420, y: 5,   scale: 1.10, seed: "kofi" },
  // Bottom Row
  { x: -120, y: 55,  scale: 0.90, seed: "renata" },
  { x: -180, y: 60,  scale: 0.95, seed: "lola" },
  { x: -240, y: 65,  scale: 1.00, seed: "alex" },
  { x: -300, y: 60,  scale: 1.05, seed: "zoe" },
  { x: -360, y: 45,  scale: 1.10, seed: "ryan" },
];

const rightPositions = [
  // Top Row (curves slightly up at the edges)
  { x: 140, y: -45, scale: 0.90, seed: "emma" },
  { x: 210, y: -42, scale: 0.95, seed: "leo" },
  { x: 280, y: -35, scale: 1.00, seed: "mia" },
  { x: 350, y: -22, scale: 1.05, seed: "jack" },
  { x: 420, y: 5,   scale: 1.10, seed: "nora" },
  // Bottom Row
  { x: 120, y: 55,  scale: 0.90, seed: "sam" },
  { x: 180, y: 60,  scale: 0.95, seed: "eva" },
  { x: 240, y: 65,  scale: 1.00, seed: "maya" },
  { x: 300, y: 60,  scale: 1.05, seed: "luke" },
  { x: 360, y: 45,  scale: 1.10, seed: "ruby" },
];

const mobileSeeds = [
  "sarah", "chidi", "amara", "dave", "kofi", "renata", "lola", "alex",
  "zoe", "ryan", "emma", "leo", "mia", "jack", "nora", "sam"
];

export function LandingTicker() {
  return (
    <section 
      style={{ backgroundColor: '#a6cdba' }}
      className="relative py-20 overflow-hidden flex flex-col items-center justify-center"
    >
      <div className="flex flex-col items-center gap-12 w-full max-w-6xl mx-auto px-6">
        
        {/* Section Title */}
        <h2 className="text-[28px] sm:text-[42px] font-extrabold text-[#1B3224] tracking-tight leading-tight max-w-3xl text-center font-display">
          Trusted by builders from the AI ecosystem
        </h2>
        
        {/* Symmetrical Layout Wrapper */}
        <div className="relative w-full flex flex-col md:flex-row items-center justify-center min-h-[320px] select-none">
          
          {/* Symmetrical Curved Avatars - Desktop Only */}
          <div className="hidden md:block absolute inset-0 pointer-events-none">
            {leftPositions.map((pos, idx) => (
              <motion.div
                key={`left-${idx}`}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 0.65, scale: pos.scale }}
                whileHover={{ opacity: 1, scale: pos.scale + 0.15, zIndex: 30 }}
                transition={{ type: "spring", stiffness: 100, delay: idx * 0.04 }}
                style={{
                  position: "absolute",
                  left: `calc(50% + ${pos.x}px - 28px)`,
                  top: `calc(50% + ${pos.y}px - 28px)`,
                  width: "56px",
                  height: "56px",
                }}
                className="rounded-full overflow-hidden bg-white/40 border border-[#1B3224]/10 backdrop-blur-md flex items-center justify-center p-1 cursor-pointer transition-all duration-350 shadow-sm"
              >
                <img 
                  src={getAvatarUrl(pos.seed)} 
                  alt={`Builder ${pos.seed}`} 
                  className="w-full h-full object-cover rounded-full bg-white/20" 
                />
              </motion.div>
            ))}

            {rightPositions.map((pos, idx) => (
              <motion.div
                key={`right-${idx}`}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 0.65, scale: pos.scale }}
                whileHover={{ opacity: 1, scale: pos.scale + 0.15, zIndex: 30 }}
                transition={{ type: "spring", stiffness: 100, delay: idx * 0.04 }}
                style={{
                  position: "absolute",
                  left: `calc(50% + ${pos.x}px - 28px)`,
                  top: `calc(50% + ${pos.y}px - 28px)`,
                  width: "56px",
                  height: "56px",
                }}
                className="rounded-full overflow-hidden bg-white/40 border border-[#1B3224]/10 backdrop-blur-md flex items-center justify-center p-1 cursor-pointer transition-all duration-350 shadow-sm"
              >
                <img 
                  src={getAvatarUrl(pos.seed)} 
                  alt={`Builder ${pos.seed}`} 
                  className="w-full h-full object-cover rounded-full bg-white/20" 
                />
              </motion.div>
            ))}
          </div>

          {/* Central LinkedIn Showcase Card */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 90, damping: 20, delay: 0.2 }}
            className="relative w-[230px] bg-white border border-slate-100 rounded-[28px] p-6 shadow-[0_24px_64px_rgba(27,50,36,0.18)] flex flex-col items-center text-center z-20 hover:shadow-[0_32px_80px_rgba(27,50,36,0.25)] transition-all duration-300"
          >
            {/* LinkedIn Blue Icon */}
            <div className="absolute top-5 right-5 text-[#0A66C2] hover:scale-105 transition-transform cursor-pointer">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
            </div>

            {/* Logo container with Hammer icon */}
            <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-400 rounded-2xl flex items-center justify-center mb-4 mt-2 shadow-[0_4px_12px_rgba(108,92,231,0.25)] text-white">
              <Hammer className="w-6 h-6" />
            </div>

            <h3 className="font-bold text-[18px] text-slate-900 leading-tight">Patchwork</h3>
            <p className="text-[13px] text-slate-500 font-bold mt-1">Build in public</p>

            <button
              onClick={() => {
                window.open("https://linkedin.com", "_blank");
              }}
              className="mt-6 w-full py-2.5 bg-[#0A66C2] hover:bg-[#004b87] text-white font-extrabold rounded-full text-[13px] flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all duration-150"
            >
              + Follow
            </button>
          </motion.div>

          {/* Symmetrical Grid for Mobile viewports */}
          <div className="md:hidden flex flex-wrap justify-center gap-2 max-w-sm mt-8">
            {mobileSeeds.map((seed, idx) => (
              <div
                key={`mob-${idx}`}
                className="w-10 h-10 rounded-full overflow-hidden bg-white/40 border border-[#1B3224]/10 backdrop-blur-md flex items-center justify-center p-0.5 shadow-sm"
              >
                <img 
                  src={getAvatarUrl(seed)} 
                  alt={`Builder ${seed}`} 
                  className="w-full h-full object-cover rounded-full bg-white/20" 
                />
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
