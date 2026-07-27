import React from 'react';
import { motion } from 'motion/react';

export function LandingTestimonials() {
  const testimonials = [
    {
      word: "Undeniable.",
      quote: "\"I stopped tweaking my resume and started logging my architecture decisions. A week later, a hiring manager reached out because they saw my thought process on Patchwork.\"",
      initials: "JD",
      initialBg: "bg-primary-500",
      name: "James D.",
      role: "Backend Engineer"
    },
    {
      word: "Clarity.",
      quote: "\"Building in isolation creates blind spots. Getting real-time feedback from senior PMs on my PRDs changed everything. It's like having a board of advisors.\"",
      initials: "SK",
      initialBg: "bg-indigo-500",
      name: "Sarah K.",
      role: "Product Manager"
    },
    {
      word: "Accountability.",
      quote: "\"When you know observers are watching your build log, you stop cutting corners. Patchwork forced me to document trade-offs properly, and it made the product 10x better.\"",
      initials: "MK",
      initialBg: "bg-emerald-500",
      name: "Michael K.",
      role: "Indie Hacker"
    },
    {
      word: "Proof.",
      quote: "\"Anyone can say they know React or system design. On Patchwork, I don't have to say it, I just link my build room. The proof is right there in the logs.\"",
      initials: "EL",
      initialBg: "bg-primary-500",
      name: "Elena L.",
      role: "Frontend Developer"
    }
  ];

  return (
    <section className="bg-[#0f0f0f] py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-[13px] font-bold text-primary-500 tracking-wider mb-4">
            Early users · verbatim
          </p>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            What early users <span className="text-primary-500">said.</span>
          </h2>
          <p className="mt-4 text-[15px] text-slate-400 font-medium">
            We asked our first users to describe Patchwork in one word.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((t, idx) => (
            <motion.div 
              key={idx} 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-black border border-white/10 rounded-2xl p-8 flex flex-col hover:border-white/20 transition-colors"
            >
              <h3 className="text-2xl font-bold text-primary-500 mb-6">{t.word}</h3>
              <p className="text-[13px] leading-relaxed text-slate-300 font-medium flex-1 mb-10">
                {t.quote}
              </p>
              
              <div className="pt-6 border-t border-white/10 flex items-center gap-3 mt-auto">
                <div className={`w-8 h-8 rounded-full ${t.initialBg} flex items-center justify-center text-white text-[11px] font-bold shrink-0`}>
                  {t.initials}
                </div>
                <div>
                  <div className="text-[13px] font-bold text-white">{t.name}</div>
                  <div className="text-[11px] text-slate-500">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
