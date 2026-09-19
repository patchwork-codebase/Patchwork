import React from 'react';
import { Sparkles, Repeat2, HelpCircle, MessageCircle } from 'lucide-react';

export function LandingLiveFeedMockup() {
  return (
    <section className="relative w-full py-24 sm:py-32 bg-white overflow-hidden flex flex-col items-center justify-center">
      
      {/* Header (Optional, to ground the section) */}
      <div className="relative z-20 text-center max-w-2xl mx-auto mb-16 px-6">
        <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4">
          The old way of proving your skills is broken.
        </h2>
        <p className="text-lg text-slate-500 font-medium">
          Stop waiting for someone to give you a chance. Build in public.
        </p>
      </div>

      {/* Grid Background */}
      <div 
        className="absolute inset-0 z-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 80% 50% at 50% 50%, #000 40%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 50% at 50% 50%, #000 40%, transparent 100%)'
        }}
      />

      {/* Floating Cards Container */}
      <div className="relative z-10 w-full max-w-5xl h-[500px] flex items-center justify-center">
        
        {/* Left Background Card */}
        <div className="absolute left-1/2 top-1/2 -translate-x-[90%] -translate-y-[70%] scale-[0.85] opacity-50 blur-[3px] rotate-[-2deg] transition-all duration-700 hover:blur-0 hover:opacity-100 hover:z-30 cursor-default">
          <UpdateCard 
            name="David Chen"
            role="ENGINEERING"
            roleColor="text-blue-500"
            time="1d ago"
            text="Just ripped out our entire auth system and replaced it with NextAuth. The migration was painful but..."
            metrics={[{icon: Sparkles, count: 12}, {icon: MessageCircle, count: 3}]}
            avatarColor="bg-blue-100 text-blue-600"
          />
        </div>

        {/* Right Background Card */}
        <div className="absolute left-1/2 top-1/2 translate-x-[10%] translate-y-[10%] scale-[0.85] opacity-50 blur-[3px] rotate-[3deg] transition-all duration-700 hover:blur-0 hover:opacity-100 hover:z-30 cursor-default">
           <UpdateCard 
            name="Sarah J."
            role="DESIGN"
            roleColor="text-rose-500"
            time="5h ago"
            text="Figma prototypes are finally feeling real. Added micro-interactions to the onboarding flow and tested with 5 users."
            metrics={[{icon: Sparkles, count: 24}, {icon: Repeat2, count: 2}]}
            avatarColor="bg-rose-100 text-rose-600"
          />
        </div>

        {/* Center Main Card */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 scale-100 hover:scale-[1.02] transition-transform duration-500 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.15)] rounded-[32px]">
          <div className="w-[340px] bg-white rounded-[32px] p-6 border border-slate-100">
            
            {/* Author */}
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg shrink-0">
                AI
              </div>
              <div>
                <div className="font-bold text-slate-900 text-lg leading-tight">Amaka I.</div>
                <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">PRODUCT</div>
              </div>
            </div>

            {/* Content Box */}
            <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-100">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Latest Update</span>
                <span className="text-[10px] font-medium text-slate-400">20h ago</span>
              </div>
              
              <p className="text-[15px] text-slate-700 leading-relaxed mb-5 font-medium">
                Launched beta to 50 users. First reactions are in — people love the speed, but the empty state is...
              </p>
              
              {/* Metrics */}
              <div className="flex flex-wrap gap-2">
                <MetricBadge icon={Sparkles} count={8} colorClass="bg-slate-100 text-slate-600" />
                <MetricBadge icon={Repeat2} count={6} colorClass="bg-slate-100 text-slate-600" />
                <MetricBadge icon={HelpCircle} count={2} colorClass="bg-emerald-50 text-emerald-600" />
                <MetricBadge icon={MessageCircle} count={5} colorClass="bg-indigo-50 text-indigo-600" />
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}

// --- Helper Components ---

function UpdateCard({ name, role, roleColor, time, text, metrics, avatarColor }: any) {
  const initials = name.split(' ').map((n: string) => n[0]).join('');
  return (
    <div className="w-[320px] bg-white rounded-[32px] p-5 shadow-2xl border border-slate-100">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${avatarColor}`}>
          {initials}
        </div>
        <div>
          <div className="font-bold text-slate-900">{name}</div>
          <div className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${roleColor}`}>{role}</div>
        </div>
      </div>
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Latest Update</span>
          <span className="text-[10px] text-slate-400">{time}</span>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed mb-4 line-clamp-3">
          {text}
        </p>
        <div className="flex gap-2">
          {metrics.map((m: any, i: number) => (
            <MetricBadge key={i} icon={m.icon} count={m.count} colorClass="bg-slate-100 text-slate-600" />
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricBadge({ icon: Icon, count, colorClass }: { icon: any, count: number, colorClass: string }) {
  return (
    <span className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-bold ${colorClass}`}>
      <Icon className="w-3.5 h-3.5" /> {count}
    </span>
  );
}
