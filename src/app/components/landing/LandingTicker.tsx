import { useRef, useState } from "react";
import { motion, useAnimationFrame, useMotionValue, useTransform, wrap } from "motion/react";
import { getAvatarUrl } from "../../utils/helpers";

const tickerItems = [
  { avatar: "builder-chidi", name: "Chidi K.", update: "Migrated from polling to WebSockets. Redis Pub/Sub handles broadcasting.", reactions: "41 Sharp" },
  { avatar: "builder-amara", name: "Amara O.", update: "Ditching bottom nav for a floating dock. Task completion up 25%.", reactions: "24 Sharp" },
  { avatar: "builder-kofi", name: "Kofi M.", update: "Double-sided reward popups. Share rate up 3x after first transfer.", reactions: "31 Sharp" },
  { avatar: "builder-sarah", name: "Sarah J.", update: "'Check Eligibility in 2 Mins' beats 'Submit Application'. Conversion +18.4%.", reactions: "18 Sharp" },
  { avatar: "builder-renata", name: "Renata S.", update: "4/5 shop owners keep phones face down. Audio cues > notifications.", reactions: "56 Sharp" },
  { avatar: "builder-dave", name: "Dave B.", update: "Compound indexes cut query time from 450ms to 12ms. Throughput +40%.", reactions: "31 Sharp" },
];

// Duplicate for seamless infinite scroll
const allItems = [...tickerItems, ...tickerItems];

function ParallaxTicker({ items, speed = 30 }: { items: typeof allItems; speed?: number }) {
  const baseX = useMotionValue(0);
  const directionFactor = useRef(1);
  const [isHovered, setIsHovered] = useState(false);

  useAnimationFrame((_, delta) => {
    if (isHovered) return; // Pause on hover
    let moveBy = directionFactor.current * speed * (delta / 1000);
    baseX.set(baseX.get() + moveBy);
  });

  const x = useTransform(baseX, (v) => `${wrap(-50, 0, v)}%`);

  return (
    <div 
      className="overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        style={{ x }}
        className="flex gap-4 w-max"
      >
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-3 bg-[#1C1A24] border border-white/10 rounded-2xl px-5 py-3.5 shadow-sm whitespace-nowrap hover:border-primary-500/30 hover:shadow-lg transition-all duration-200 cursor-default group"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden bg-[#2A2635] border border-white/10 shrink-0">
              <img src={getAvatarUrl(item.avatar)} alt={item.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-white">{item.name}</span>
              <span className="text-[12px] text-slate-400 max-w-[280px] truncate">{item.update}</span>
            </div>
            <div className="ml-2 flex items-center gap-1.5 px-2.5 py-1 bg-primary-500/10 rounded-full border border-primary-500/20">
              <span className="text-primary-500 text-[10px] font-extrabold">✦ {item.reactions}</span>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export function LandingTicker() {
  return (
    <section className="relative py-8 bg-[#050505] border-b border-white/5 overflow-hidden">
      {/* Fade masks left and right */}
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#050505] to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#050505] to-transparent z-10 pointer-events-none" />

      <div className="flex items-center gap-4 mb-4 px-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Live Builder Activity</span>
        </div>
      </div>

      <ParallaxTicker items={allItems} speed={40} />
    </section>
  );
}
