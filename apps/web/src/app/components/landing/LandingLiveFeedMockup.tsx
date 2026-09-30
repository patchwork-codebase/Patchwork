import React, { useRef } from 'react';
import { Sparkles, Repeat2, HelpCircle, MessageCircle } from 'lucide-react';
import { motion, useScroll, useTransform } from 'motion/react';

export function LandingLiveFeedMockup() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // Parallax transforms for the cards
  const yLeft = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const yRight = useTransform(scrollYProgress, [0, 1], [-100, 100]);
  const yCenter = useTransform(scrollYProgress, [0, 1], [50, -50]);

  return (
    <section ref={containerRef} className="relative w-full py-28 sm:py-36 bg-[#0a0a0a] overflow-hidden flex flex-col items-center justify-center border-t border-white/5">
      
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-20 text-center max-w-3xl mx-auto mb-20 px-6"
      >
        <div className="text-primary-500 font-bold text-sm tracking-widest uppercase font-mono mb-6">
          04 / The Public Feed
        </div>
        <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.05] mb-6">
          The old way of proving your skills is broken.
        </h2>
        <p className="text-xl text-slate-400 font-medium max-w-2xl mx-auto">
          Stop waiting for someone to give you a chance. Build in public and let the work speak for itself.
        </p>
      </motion.div>

      {/* Grid Background */}
      <div 
        className="absolute inset-0 z-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(to right, #334155 1px, transparent 1px), linear-gradient(to bottom, #334155 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 80% 50% at 50% 50%, #000 40%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 50% at 50% 50%, #000 40%, transparent 100%)'
        }}
      />

      {/* Floating Cards Container */}
      <div className="relative z-10 w-full max-w-5xl h-[500px] flex items-center justify-center mt-10">
        
        {/* Left Background Card (Parallax) */}
        <motion.div 
          style={{ y: yLeft }}
          className="absolute left-1/2 top-1/2 -translate-x-[90%] -translate-y-[70%] scale-[0.85] opacity-50 blur-[3px] rotate-[-2deg] transition-all duration-700 hover:blur-0 hover:opacity-100 hover:z-30 cursor-default"
        >
          <UpdateCard 
            name="David Chen"
            role="ENGINEERING"
            roleColor="text-blue-400"
            time="1d ago"
            text="Just ripped out our entire auth system and replaced it with NextAuth. The migration was painful but..."
            metrics={[{icon: Sparkles, count: 12}, {icon: MessageCircle, count: 3}]}
            avatarColor="bg-blue-500/20 text-blue-400 border border-blue-500/30"
          />
        </motion.div>

        {/* Right Background Card (Parallax) */}
        <motion.div 
          style={{ y: yRight }}
          className="absolute left-1/2 top-1/2 translate-x-[10%] translate-y-[10%] scale-[0.85] opacity-50 blur-[3px] rotate-[3deg] transition-all duration-700 hover:blur-0 hover:opacity-100 hover:z-30 cursor-default"
        >
           <UpdateCard 
            name="Sarah J."
            role="DESIGN"
            roleColor="text-rose-400"
            time="5h ago"
            text="Figma prototypes are finally feeling real. Added micro-interactions to the onboarding flow and tested with 5 users."
            metrics={[{icon: Sparkles, count: 24}, {icon: Repeat2, count: 2}]}
            avatarColor="bg-rose-500/20 text-rose-400 border border-rose-500/30"
          />
        </motion.div>

        {/* Center Main Card (Parallax) */}
        <motion.div 
          style={{ y: yCenter, x: "-50%" }}
          className="absolute left-1/2 top-1/2 -translate-y-1/2 z-20 scale-100 hover:scale-[1.02] transition-transform duration-500 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)] rounded-[32px]"
        >
          <div className="w-[340px] sm:w-[380px] bg-[#111] rounded-[32px] p-6 sm:p-8 border border-white/10 relative overflow-hidden">
            {/* Subtle glow inside card */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl" />
            
            {/* Author */}
            <div className="flex items-center gap-4 mb-6 relative">
              <div className="w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-lg shrink-0">
                AI
              </div>
              <div>
                <div className="font-bold text-white text-lg leading-tight">Amaka I.</div>
                <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-0.5">PRODUCT</div>
              </div>
            </div>

            {/* Content Box */}
            <div className="bg-[#0a0a0a] rounded-2xl p-5 border border-white/5 relative">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Latest Update</span>
                <span className="text-[10px] font-medium text-slate-500">20h ago</span>
              </div>
              
              <p className="text-[15px] text-slate-300 leading-relaxed mb-6 font-medium">
                Launched beta to 50 users. First reactions are in — people love the speed, but the empty state is...
              </p>
              
              {/* Metrics */}
              <div className="flex flex-wrap gap-2.5">
                <MetricBadge icon={Sparkles} count={8} colorClass="bg-white/5 text-slate-300 border border-white/10" />
                <MetricBadge icon={Repeat2} count={6} colorClass="bg-white/5 text-slate-300 border border-white/10" />
                <MetricBadge icon={HelpCircle} count={2} colorClass="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" />
                <MetricBadge icon={MessageCircle} count={5} colorClass="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" />
              </div>
            </div>

          </div>
        </motion.div>

      </div>
    </section>
  );
}

// --- Helper Components ---

function UpdateCard({ name, role, roleColor, time, text, metrics, avatarColor }: any) {
  const initials = name.split(' ').map((n: string) => n[0]).join('');
  return (
    <div className="w-[320px] bg-[#111] rounded-[32px] p-6 shadow-2xl border border-white/10 relative overflow-hidden">
      <div className="flex items-center gap-3 mb-5 relative">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${avatarColor}`}>
          {initials}
        </div>
        <div>
          <div className="font-bold text-white">{name}</div>
          <div className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${roleColor}`}>{role}</div>
        </div>
      </div>
      <div className="bg-[#0a0a0a] rounded-2xl p-4 border border-white/5 relative">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Latest Update</span>
          <span className="text-[10px] text-slate-500">{time}</span>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed mb-5 line-clamp-3">
          {text}
        </p>
        <div className="flex gap-2">
          {metrics.map((m: any, i: number) => (
            <MetricBadge key={i} icon={m.icon} count={m.count} colorClass="bg-white/5 text-slate-300 border border-white/10" />
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricBadge({ icon: Icon, count, colorClass }: { icon: any, count: number, colorClass: string }) {
  return (
    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold ${colorClass}`}>
      <Icon className="w-3.5 h-3.5" /> {count}
    </span>
  );
}
