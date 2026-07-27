import React from 'react';

export function LandingTargetAudience() {
  const audiences = [
    {
      id: "01",
      tag: "Career switcher",
      title: "You know you'd be good at this.",
      desc: "You have the adjacent skills, but you can't get past \"What have you shipped?\". Patchwork gives you a public portfolio of real product decisions before you get the job title."
    },
    {
      id: "02",
      tag: "First-Time Founder",
      title: "You're building, but nobody sees the struggle.",
      desc: "You're writing code and launching features in the dark. Open a live room, log your progress, and build an audience of observers who can become your first users."
    },
    {
      id: "03",
      tag: "Junior Builder",
      title: "You're shipping, but nobody's coaching you.",
      desc: "You're making decisions but aren't sure if they're right. Log your architecture and product choices on Patchwork, and get validated by senior engineers and PMs."
    },
    {
      id: "04",
      tag: "Senior Leader",
      title: "You've shipped. Now pay it forward.",
      desc: "You have the experience. Join as an Observer to review build logs, validate junior talent, and scout the absolute best builders for your next team."
    }
  ];

  return (
    <section className="bg-[#0f0f0f] py-24 sm:py-32 border-t border-white/5">
      <div className="mx-auto max-w-7xl px-6">
        
        <div className="mb-20 max-w-3xl">
          <p className="text-[11px] font-bold text-primary-500 tracking-wider mb-4 uppercase">
            Who it's for
          </p>
          <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight leading-[1.2]">
            Whether you're <span className="text-primary-500 italic">building, leading, designing, or learning</span>, this is your workspace.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-x-12 gap-y-16">
          {audiences.map((aud, idx) => (
            <div key={idx} className="relative">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] font-bold text-primary-500 uppercase tracking-widest">{aud.id}</span>
                <span className="text-slate-600">·</span>
                <span className="text-[10px] font-bold text-primary-500 uppercase tracking-widest">{aud.tag}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
                {aud.title}
              </h3>
              <p className="text-[14px] text-slate-400 leading-relaxed font-medium">
                {aud.desc}
              </p>
              
              {/* Subtle top border like the screenshot */}
              <div className="absolute -top-6 left-0 right-0 h-px bg-white/5"></div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
