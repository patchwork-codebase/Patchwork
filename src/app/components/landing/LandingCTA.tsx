import React from "react";

interface LandingCTAProps {
  showOnboarding: () => void;
}

export function LandingCTA({ showOnboarding }: LandingCTAProps) {
  return (
    <section className="relative py-24 bg-[#FAFAF9]">
      <div className="mx-auto max-w-4xl px-6">
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-tr from-primary-500 to-[#4A3DB8] px-8 py-16 md:px-12 md:py-24 text-center shadow-xl">
          {/* Grid background on card */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_50%)] pointer-events-none" />

          <div className="max-w-2xl mx-auto space-y-6 relative">
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Ready to build<br />
              <span className="font-serif italic text-purple-200">in the open or private?</span>
            </h2>
            <p className="text-sm sm:text-base text-purple-100/80 max-w-md mx-auto leading-relaxed">
              Join 47 founding builders sharing their live journey. Establish your domain credibility today.
            </p>
            <div className="pt-2">
              <button
                onClick={showOnboarding}
                className="rounded-full bg-white hover:bg-slate-50 px-10 py-4 text-base font-extrabold text-primary-500 shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition"
              >
                Claim your build room →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
