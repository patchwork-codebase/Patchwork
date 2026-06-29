import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Layers, MessageSquareCode, CheckCircle2, Award, Users, Lock } from "lucide-react";

function WordReveal({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.95", "start 0.4"],
  });

  const words = text.split(" ");

  return (
    <span ref={ref} className={`inline ${className}`}>
      {words.map((word, i) => {
        const wordStart = i / words.length;
        const wordEnd = (i + 1) / words.length;
        return (
          <WordToken
            key={i}
            word={word}
            progress={scrollYProgress}
            range={[wordStart, wordEnd]}
          />
        );
      })}
    </span>
  );
}

function WordToken({
  word,
  progress,
  range,
}: {
  word: string;
  progress: any;
  range: [number, number];
}) {
  const opacity = useTransform(progress, range, [0.15, 1]);
  const y = useTransform(progress, range, [8, 0]);
  const filter = useTransform(progress, range, ["blur(4px)", "blur(0px)"]);

  return (
    <motion.span
      style={{ opacity, y, filter }}
      className="inline-block mr-[0.25em]"
    >
      {word}
    </motion.span>
  );
}

const features = [
  {
    icon: <Layers className="h-6 w-6" />,
    title: "Live Build Rooms",
    desc: "Tied directly to milestones. Share updates — sketches, logic flows, links — as you build. Enable observers to follow step-by-step.",
    color: "text-primary-500",
    bg: "bg-primary-500/10",
    border: "border-primary-500/20",
    size: "lg", // spans 2 cols
  },
  {
    icon: <MessageSquareCode className="h-6 w-6" />,
    title: "Structured Reactions",
    desc: "No noise, just signal. Observers react with three precise indicators: Sharp, Push back, or Tell me more.",
    color: "text-sage-600 dark:text-sage-300",
    bg: "bg-sage-100 dark:bg-sage-950/20",
    border: "border-sage-300/30",
    size: "sm",
  },
  {
    icon: <Award className="h-6 w-6" />,
    title: "Domain Reputation",
    desc: "Accumulate reputation points based on code logic, UI iterations, and constructiveness.",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    size: "sm",
  },
  {
    icon: <CheckCircle2 className="h-6 w-6" />,
    title: "Chronological Build Log",
    desc: "Shipping a project compiles your room timeline into a permanent, beautiful portfolio piece.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    size: "sm",
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "Active Observers",
    desc: "Invite colleagues, engineers, or founders to observe your build room. Track who views your updates and how frequently.",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    size: "lg",
  },
  {
    icon: <Lock className="h-6 w-6" />,
    title: "Verified Talent Signal",
    desc: "Companies filter candidates via real build logs. Let your process prove itself.",
    color: "text-slate-300",
    bg: "bg-slate-400/10",
    border: "border-slate-400/20",
    size: "sm",
  },
];

function BentoCard({
  feature,
  index,
  isLarge,
}: {
  feature: (typeof features)[0];
  index: number;
  isLarge: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3, scale: 1.01 }}
      className={`group relative bg-[#0E0C15] border border-white/10 rounded-[28px] p-8 overflow-hidden transition-shadow duration-300 hover:shadow-xl hover:shadow-black/60 hover:border-white/20 ${
        isLarge ? "md:col-span-2" : ""
      }`}
    >
      {/* Hover glow */}
      <motion.div
        className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
        style={{
          background: `radial-gradient(circle at 30% 30%, var(--tw-gradient-from) 0%, transparent 60%)`,
        }}
      />

      {/* Top shimmer line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative z-10">
        <div className={`inline-flex w-12 h-12 rounded-2xl ${feature.bg} border ${feature.border} items-center justify-center mb-5 ${feature.color} group-hover:scale-110 transition-transform duration-300`}>
          {feature.icon}
        </div>

        <h3 className={`text-xl font-extrabold text-white mb-3 group-hover:${feature.color} transition-colors`}>
          {feature.title}
        </h3>

        <p className="text-slate-400 text-[15px] leading-relaxed font-medium">{feature.desc}</p>

        {isLarge && (
          <div className="mt-8 flex gap-2 flex-wrap">
            {["Updates", "Observers", "Reactions", "Build Logs"].map((tag) => (
              <span
                key={tag}
                className="px-3 py-1.5 bg-[#1C1A24] border border-white/10 rounded-full text-[11px] font-bold text-slate-400 uppercase tracking-wider"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function LandingFeatures() {
  return (
    <section id="features" className="relative py-24 sm:py-32 bg-[#050505] border-t border-white/5">
      <div className="absolute top-10 right-[10%] w-[30%] h-[30%] rounded-full bg-primary-500/10 blur-[80px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6">
        {/* Section Header with scroll-linked word reveal */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-5">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block text-[11px] uppercase tracking-[0.2em] font-semibold text-primary-500 bg-primary-500/10 px-3 py-1 rounded-full border border-primary-500/20"
          >
            Why Patchwork
          </motion.span>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            <WordReveal text="Built for how real builders" />
            <br />
            <span className="font-serif italic text-primary-400">
              <WordReveal text="actually ship products" />
            </span>
          </h2>

          <p className="text-slate-400 text-[15px] sm:text-base leading-relaxed max-w-xl mx-auto">
            <WordReveal text="Most platforms capture the wrong state. LinkedIn has your polished past. X has your active opinions. Patchwork has your real, raw building process." />
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Row 1: large + small */}
          <BentoCard feature={features[0]} index={0} isLarge={true} />
          <BentoCard feature={features[1]} index={1} isLarge={false} />

          {/* Row 2: small + small + large */}
          <BentoCard feature={features[2]} index={2} isLarge={false} />
          <BentoCard feature={features[3]} index={3} isLarge={false} />
          <BentoCard feature={features[4]} index={4} isLarge={true} />

          {/* Last standalone card */}
          <BentoCard feature={features[5]} index={5} isLarge={false} />
        </div>
      </div>
    </section>
  );
}
