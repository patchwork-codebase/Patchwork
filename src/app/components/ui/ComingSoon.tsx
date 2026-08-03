import { motion } from 'motion/react';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface ComingSoonProps {
  title: string;
  subtitle: string;
  accentColor?: string;
  icon: React.ReactNode;
  features: Feature[];
}

const floatingDots = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: 2 + Math.random() * 4,
  duration: 6 + Math.random() * 8,
  delay: Math.random() * 5,
}));

export function ComingSoon({
  title,
  subtitle,
  accentColor = '#8B7CF8',
  icon,
  features,
}: ComingSoonProps) {
  return (
    <div className="relative bg-transparent flex flex-col items-center justify-center px-4 py-16" style={{ zoom: 0.9 }}>

      {/* Floating background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div
          className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-[0.06] blur-3xl"
          style={{ background: accentColor }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-[400px] h-[400px] rounded-full opacity-[0.05] blur-3xl"
          style={{ background: accentColor }}
        />

        {/* Floating particles */}
        {floatingDots.map((dot) => (
          <motion.div
            key={dot.id}
            className="absolute rounded-full"
            style={{
              left: `${dot.x}%`,
              top: `${dot.y}%`,
              width: dot.size,
              height: dot.size,
              background: accentColor,
              opacity: 0.15,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: dot.duration,
              delay: dot.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-2xl mx-auto text-center">

        {/* Pulsing icon */}
        <motion.div
          className="relative inline-flex items-center justify-center mb-8"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        >
          {/* Outer pulse rings */}
          {[1, 2, 3].map((ring) => (
            <motion.div
              key={ring}
              className="absolute rounded-full border"
              style={{ borderColor: accentColor }}
              animate={{
                scale: [1, 1.6 + ring * 0.3],
                opacity: [0.4, 0],
              }}
              transition={{
                duration: 2.5,
                delay: ring * 0.5,
                repeat: Infinity,
                ease: 'easeOut',
              }}
              // size the base div so border scales from center
              initial={{ width: 72, height: 72, x: '-50%', y: '-50%', top: '50%', left: '50%', position: 'absolute' }}
            />
          ))}

          <div
            className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center shadow-xl"
            style={{ background: `${accentColor}20`, border: `1.5px solid ${accentColor}40` }}
          >
            <div style={{ color: accentColor }}>
              {icon}
            </div>
          </div>
        </motion.div>

        {/* Badge */}
        <motion.div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest mb-5"
          style={{ background: `${accentColor}15`, color: accentColor, border: `1px solid ${accentColor}30` }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accentColor }} />
          Coming Soon
        </motion.div>

        {/* Title */}
        <motion.h1
          className="text-[32px] sm:text-[40px] font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight mb-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {title}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-[15px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto mb-14"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {subtitle}
        </motion.p>

        {/* Divider */}
        <motion.div
          className="flex items-center gap-4 mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">What to expect</span>
          <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
        </motion.div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              className="bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:bg-slate-100 dark:bg-slate-800/80 transition-all duration-200 group"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 + i * 0.1, type: 'spring', stiffness: 180, damping: 20 }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-colors duration-200"
                style={{ background: `${accentColor}15` }}
              >
                <div style={{ color: accentColor }}>
                  {feature.icon}
                </div>
              </div>
              <h3 className="text-[13px] font-bold text-slate-900 dark:text-slate-100 mb-1.5">{feature.title}</h3>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Bottom hint */}
        <motion.p
          className="mt-10 text-[12px] text-slate-500 dark:text-slate-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          We're building this in public — check your build room for updates.
        </motion.p>
      </div>
    </div>
  );
}
