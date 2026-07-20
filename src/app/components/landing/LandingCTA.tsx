import React from "react";
import { MagneticButton } from "../ui/MagneticButton";
import { motion } from "motion/react";

interface LandingCTAProps {
  showOnboarding: () => void;
}

export function LandingCTA({ showOnboarding }: LandingCTAProps) {
  return (
    <section className="relative py-24 bg-transparent">
      <div className="mx-auto max-w-4xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-[32px] bg-slate-50 border border-slate-200 px-8 py-16 md:px-12 md:py-24 text-center shadow-xl"
        >
          {/* Animated background glow orbs */}
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-primary-500/10 blur-3xl pointer-events-none"
          />
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-sage-400/10 blur-3xl pointer-events-none"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(0,0,0,0.02),transparent_50%)] pointer-events-none" />

          <div className="max-w-2xl mx-auto space-y-6 relative">
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Ready to build<br />
              <span className="font-serif italic text-primary-500">in the open or private?</span>
            </h2>
            <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto leading-relaxed font-medium">
              Join 47 founding builders sharing their live journey. Establish your domain credibility today.
            </p>
            <div className="pt-2 flex justify-center">
              <MagneticButton onClick={showOnboarding} strength={0.25}>
                <button className="rounded-full bg-slate-900 hover:bg-slate-800 px-10 py-4 text-base font-extrabold text-white shadow-lg transition">
                  Claim your build room →
                </button>
              </MagneticButton>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
