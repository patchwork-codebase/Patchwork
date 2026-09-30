import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

// QuickFleet-style: a single feature "chapter" — numbered label, sticky left heading, scrolling right content
function FeatureChapter({
  num,
  label,
  heading,
  description,
  bullets,
  visual,
  bgClass = 'bg-[#0f0f0f]',
  textClass = 'text-white',
}: {
  num: string;
  label: string;
  heading: React.ReactNode;
  description: string;
  bullets: string[];
  visual: React.ReactNode;
  bgClass?: string;
  textClass?: string;
}) {
  return (
    <div className={`${bgClass} py-28 sm:py-36 px-5 sm:px-8 lg:px-12 border-t border-white/5`}>
      <div className="mx-auto max-w-7xl grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">
        {/* Left: sticky heading */}
        <div className="lg:sticky lg:top-32 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="text-primary-500 font-bold text-sm tracking-widest uppercase font-mono"
          >
            {num} / {label}
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: 0.06 }}
            className={`text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] ${textClass}`}
          >
            {heading}
          </motion.h2>
        </div>

        {/* Right: scrolling content */}
        <div className="space-y-12">
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="text-xl sm:text-2xl text-slate-400 font-medium leading-relaxed"
          >
            {description}
          </motion.p>

          {/* Animated border-top bullet list — QuickFleet style */}
          <motion.ul
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="border-t border-white/8 pt-8 space-y-5"
          >
            {bullets.map((b, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: i * 0.08 }}
                className="flex items-start gap-4 text-base sm:text-lg text-slate-400 font-medium"
              >
                <span className="text-primary-500 font-black shrink-0 mt-0.5">—</span>
                {b}
              </motion.li>
            ))}
          </motion.ul>

          {/* Visual block */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
          >
            {visual}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// QuickFleet-style: 3-col "things you notice" section with staggered columns
function ThreeColTakeaways() {
  const items = [
    {
      title: 'The Proof',
      sub: 'A portfolio you can trust.',
      body: 'CVs move with buzzwords and exaggerations. A verified update on Patchwork costs the same effort on Friday as it did on Monday — and it actually means something.',
    },
    {
      title: 'The Builder',
      sub: 'Less time formatting.',
      body: 'Fewer moving parts and less routine reformatting, so more days actually building instead of documenting in silos.',
    },
    {
      title: 'The Network',
      sub: 'Quieter, cleaner signal.',
      body: 'No noise in the feed, and far more visibility when a builder ships something real. Observers who matter find you.',
    },
  ];

  return (
    <div className="bg-[#0a0a0a] py-28 sm:py-36 px-5 sm:px-8 lg:px-12 border-t border-white/5">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="text-primary-500 font-bold text-sm tracking-widest uppercase font-mono mb-6"
        >
          03 / Why Patchwork
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: 0.07 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] text-white max-w-3xl mb-20"
        >
          Three things you notice after a month with us.
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-12 border-t border-white/8 pt-16">
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: i * 0.1 }}
              className="space-y-4"
            >
              <h3 className="text-xl sm:text-2xl font-black text-white">{item.title}</h3>
              <h4 className="text-primary-400 font-bold text-base">{item.sub}</h4>
              <p className="text-slate-400 font-medium text-base leading-relaxed">{item.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LandingFeaturesCapstone() {
  // Feature 01: Live Build Rooms
  const roomsVisual = (
    <div className="bg-[#0a0a0a] rounded-[28px] p-6 sm:p-8 border border-white/5 shadow-2xl font-mono text-sm">
      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Active Rooms · 142 live builds</div>
      <div className="space-y-3">
        {[
          { init: 'SP', color: 'bg-emerald-500', co: 'Spotify', role: 'Recommendation Engine', day: 'Day 14' },
          { init: 'ST', color: 'bg-indigo-500', co: 'Stripe', role: 'Checkout Flow Redesign', day: 'Day 3' },
          { init: 'AB', color: 'bg-orange-500', co: 'Airbnb', role: 'Host Dashboard', day: 'Day 8' },
        ].map((r, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-3 border border-white/5 bg-white/[0.02] rounded-xl p-3"
          >
            <div className={`w-8 h-8 rounded-lg ${r.color} flex items-center justify-center text-white text-[10px] font-black shrink-0`}>{r.init}</div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">{r.co}</div>
              <div className="text-xs font-bold text-white truncate">{r.role}</div>
            </div>
            <div className="text-[10px] text-slate-400 shrink-0">{r.day}</div>
          </motion.div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center">
        <span className="text-[9px] text-slate-500 uppercase tracking-widest">New rooms daily</span>
        <span className="text-[9px] font-bold text-primary-500 flex items-center gap-1 cursor-pointer">Browse all <ArrowRight className="w-2.5 h-2.5" /></span>
      </div>
    </div>
  );

  // Feature 02: Observer Network
  const observerVisual = (
    <div className="bg-[#0a0a0a] rounded-[28px] p-6 sm:p-8 border border-white/5 shadow-2xl space-y-4">
      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Observer Feedback · Live</div>
      {[
        { name: 'Sarah K.', role: 'Sr. PM @ Stripe', comment: 'Great call moving KYC post-onboarding. Matches what we saw at Stripe in 2019.', time: '9:28 AM', color: 'bg-emerald-500' },
        { name: 'David M.', role: 'Eng Lead @ Linear', comment: 'Architecture looks solid. Would consider caching the feed at the edge layer.', time: '9:41 AM', color: 'bg-indigo-500' },
      ].map((o, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="border border-white/5 bg-white/[0.02] rounded-xl p-4 flex items-start gap-3"
        >
          <div className={`w-8 h-8 rounded-full ${o.color} flex items-center justify-center text-white text-xs font-black shrink-0`}>
            {o.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-1.5">
              <span className="text-xs font-bold text-white">{o.name}</span>
              <span className="text-[10px] text-slate-400 font-medium">{o.role}</span>
              <span className="text-[10px] text-slate-500 ml-auto">{o.time}</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{o.comment}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );

  return (
    <>
      <FeatureChapter
        num="01"
        label="Build Rooms"
        heading={<>From booking<br />to proof.</>}
        description="Anyone can claim they built a feature. What makes a portfolio useful is everything around it: rooms that document the work, observers who verify it, and a platform that puts every contribution on record."
        bullets={[
          'Built for delivery, with a timeline that updates live.',
          'A predictable, transparent proof of work.',
          'All verified, from day one.',
        ]}
        visual={roomsVisual}
      />

      <FeatureChapter
        num="02"
        label="Observer Network"
        heading={<>Every room<br />has its experts.</>}
        description="Before a single decision is logged, a room is open. Each one has a wall of verified senior observers — PMs, engineers, founders — who give real-time, structured feedback."
        bullets={[
          'Feedback arrives in minutes, not weeks.',
          "From observers who've shipped at scale.",
          'Walk-in validation, any day of the week.',
        ]}
        visual={observerVisual}
        bgClass="bg-[#070707]"
      />

      <ThreeColTakeaways />
    </>
  );
}
