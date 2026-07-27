import React from 'react';
import { motion } from 'motion/react';

export function LandingWorkflowCapstone() {
  const steps = [
    {
      id: "1",
      title: "Choose a simulation",
      desc: "Work on realistic product challenges across industries. Build products that matter.",
      mockup: (
        <div className="bg-white rounded-xl shadow-xl p-5 w-full transform -translate-y-2 group-hover:-translate-y-4 transition-transform duration-500">
          <div className="flex items-center gap-2 mb-3">
             <div className="w-2 h-2 rounded-full bg-primary-500"></div>
             <span className="text-[10px] font-bold text-primary-500 tracking-wider uppercase">Patchwork</span>
          </div>
          <div className="text-sm font-bold text-slate-900 mb-4">
            MoniFlow: Fix Patient Onboarding, Your First Week as PM
          </div>
          <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500">
            <span className="px-2 py-1 bg-slate-100 rounded-md">Intermediate</span>
            <span>★ 4.8/5</span>
          </div>
          <div className="mt-4 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
             <div className="h-full bg-primary-500 w-1/3"></div>
          </div>
        </div>
      )
    },
    {
      id: "2",
      title: "Do the work",
      desc: "Write PRDs. Prioritize features. Present your thinking. Get validated by senior observers.",
      mockup: (
        <div className="bg-white rounded-xl shadow-xl p-5 w-full transform -translate-y-2 group-hover:-translate-y-4 transition-transform duration-500">
          <div className="text-xs font-bold text-slate-900 mb-2">Group Therapy PRD</div>
          <p className="text-[10px] text-slate-500 mb-4 line-clamp-2">
            Feedback from Dr. Carmen on clinical requirements just landed.
          </p>
          
          <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 mb-4">
            <div className="text-[9px] font-bold text-orange-600 uppercase tracking-wider mb-1">In-Flight Feedback</div>
            <p className="text-[10px] text-orange-900">
              "Your risk register is thin on contraindications. Revise before submission."
            </p>
          </div>

          <div className="flex items-center justify-between text-[9px] font-medium text-slate-400">
            <span>Draft v3 · Auto-saved</span>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded">3/6 dims scored</span>
          </div>
        </div>
      )
    },
    {
      id: "3",
      title: "Get your results",
      desc: "Receive a detailed performance report across six core PM competencies. Prove your skills.",
      mockup: (
        <div className="bg-white rounded-xl shadow-xl p-5 w-full transform -translate-y-2 group-hover:-translate-y-4 transition-transform duration-500">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scorecard</div>
              <div className="text-xs font-bold text-slate-900 mt-0.5">Akin R. - PM</div>
            </div>
            <div className="text-2xl font-black text-primary-500">
              83<span className="text-[10px] text-slate-400 font-medium">/100</span>
            </div>
          </div>
          
          <div className="space-y-3 mb-6">
            {[
              { label: "Stakeholder comms", score: 88, width: "88%" },
              { label: "Trade-off reasoning", score: 82, width: "82%" },
              { label: "Documentation", score: 91, width: "91%" }
            ].map((skill, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-[9px] text-slate-600 w-24 truncate">{skill.label}</span>
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-500 rounded-full" style={{ width: skill.width }}></div>
                </div>
                <span className="text-[9px] font-bold text-slate-900 w-4 text-right">{skill.score}</span>
              </div>
            ))}
          </div>

          <div className="inline-block px-2 py-1 bg-emerald-500 text-white text-[9px] font-bold tracking-wider rounded uppercase">
            Pass - Senior-Ready
          </div>
        </div>
      )
    }
  ];

  return (
    <section className="bg-[#0f0f0f] py-24 sm:py-32 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-[13px] font-bold text-primary-500 tracking-wider mb-4">
            How it works · for you
          </p>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Three steps to real PM <span className="text-primary-500">experience.</span>
          </h2>
          <p className="mt-4 text-[15px] text-slate-400 font-medium leading-relaxed max-w-xl mx-auto">
            Choose a real-world PM simulation, solve real product challenges, and leave with clear evidence of your skills.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {steps.map((step, idx) => (
            <motion.div 
              key={step.id} 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
              className="relative group rounded-[32px] overflow-hidden flex flex-col h-[550px]"
            >
              {/* Vibrant textured background */}
              <div className="absolute inset-0 bg-gradient-to-b from-orange-400 via-primary-600 to-amber-950 opacity-90 transition-opacity duration-500 group-hover:opacity-100" />
              
              {/* Optional grain overlay to match screenshot texture */}
              <div className="absolute inset-0 opacity-[0.15] mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />

              {/* Card Content - Top Mockup */}
              <div className="relative pt-12 px-8 flex justify-center h-[60%]">
                {step.mockup}
              </div>

              {/* Card Content - Bottom Text */}
              <div className="relative mt-auto p-8 pb-10 flex flex-col justify-end">
                <h3 className="text-2xl font-bold text-white mb-3">
                  {step.id}. {step.title}
                </h3>
                <p className="text-white/80 text-[13px] font-medium leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
