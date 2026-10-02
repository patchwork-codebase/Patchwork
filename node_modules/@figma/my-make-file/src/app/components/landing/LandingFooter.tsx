import React from "react";
import { ArrowRight, Mail, Send, Check, Twitter } from "lucide-react";
import { useNavigate } from "react-router";
import { motion } from 'motion/react';
import { AppleStoreButton, GooglePlayButton } from './StoreButtons';

interface LandingFooterProps {
  newsletterEmail: string;
  setNewsletterEmail: (email: string) => void;
  newsletterSent: boolean;
  handleNewsletterSubmit: (e: React.FormEvent) => void;
}

export function LandingFooter({
  newsletterEmail,
  setNewsletterEmail,
  newsletterSent,
  handleNewsletterSubmit
}: LandingFooterProps) {
  const navigate = useNavigate();
  return (
    <footer className="bg-[#0a0a0a] text-slate-500 overflow-hidden">
      
      {/* Massive CTA Section */}
      <section className="relative py-32 sm:py-48 border-t border-white/5 flex flex-col items-center justify-center text-center px-6">
        {/* Subtle glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-500/10 rounded-full blur-[120px] pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10"
        >
          <h2 className="text-5xl sm:text-7xl lg:text-[110px] font-black text-white tracking-tighter leading-[0.9] mb-8">
            Ready to build <br/>
            <span className="text-primary-500">in public?</span>
          </h2>
          <p className="text-lg sm:text-xl text-slate-400 font-medium max-w-xl mx-auto mb-10">
            Stop hiding your work. Open a room, log your decisions, and prove your skills to the world.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <AppleStoreButton />
            <GooglePlayButton />
          </div>
        </motion.div>
      </section>

      {/* Actual Footer Links */}
      <div className="border-t border-white/10 py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-10 md:grid-cols-12">

            {/* Footer Left Column: Logo & Newsletter */}
            <div className="md:col-span-5 space-y-6">
              <div className="flex items-center gap-3 text-lg font-bold tracking-tight text-white">
                <div className="flex h-8 w-8 items-center justify-center rounded-[12px] bg-gradient-to-br from-primary-500 to-amber-500 text-white">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m15 12-8.373 8.373a1 1 0 1 1-1.414-1.414L13.586 10.586"/>
                    <path d="m18 13.4-9-9"/>
                    <path d="M12 4.4 14.6 2l3.4 3.4L15.6 8z"/>
                    <path d="M18.4 10.6 21 8l-3.4-3.4L15 7.2"/>
                  </svg>
                </div>
                <span className="font-black tracking-tight text-xl text-white">patchwork</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs font-medium">
                Every great product begins with an idea, but every great builder is shaped by the journey. Patchwork exists to help builders document their thinking and earn trust through proof of work.
              </p>

              {/* Newsletter Form */}
              <div className="space-y-3 pt-4">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Get weekly building digests
                </div>
                <form onSubmit={handleNewsletterSubmit} className="flex gap-2 max-w-sm">
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="you@builder.com"
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white placeholder-slate-500 outline-none focus:border-primary-500 transition"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-primary-500 hover:bg-primary-600 px-5 py-3 text-xs font-bold text-white transition flex items-center justify-center gap-2 shrink-0"
                  >
                    {newsletterSent ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <>
                        <span>Subscribe</span>
                        <Send className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </form>
                {newsletterSent && (
                  <p className="text-[10px] text-primary-400 font-bold animate-pulse mt-2">
                    ✓ Successfully subscribed!
                  </p>
                )}
              </div>
            </div>

            {/* Footer Right Columns */}
            <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-6 pt-8 md:pt-0">
              <div className="space-y-5">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Product</div>
                <ul className="space-y-3 text-xs font-medium">
                  <li><a href="#features" className="text-slate-400 hover:text-white transition">Build Rooms</a></li>
                  <li><a href="#features" className="text-slate-400 hover:text-white transition">Structured Reactions</a></li>
                  <li><a href="#features" className="text-slate-400 hover:text-white transition">Build Logs</a></li>
                  <li><a href="#workflow" className="text-slate-400 hover:text-white transition">Reputation Engine</a></li>
                </ul>
              </div>

              <div className="space-y-5">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Resources</div>
                <ul className="space-y-3 text-xs font-medium">
                  <li><a href="#faq" className="text-slate-400 hover:text-white transition">FAQs</a></li>
                  <li><a href="#showcase" className="text-slate-400 hover:text-white transition">Showcase Feed</a></li>
                  <li><span className="text-slate-600 cursor-not-allowed">Talent Directory (soon)</span></li>
                  <li><span className="text-slate-600 cursor-not-allowed">API docs</span></li>
                </ul>
              </div>

              <div className="space-y-5">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Legal & Social</div>
                <ul className="space-y-3 text-xs font-medium">
                  <li><a href="#" className="text-slate-400 hover:text-white transition">Privacy Policy</a></li>
                  <li><a href="#" className="text-slate-400 hover:text-white transition">Terms of Service</a></li>
                  <li>
                    <a href="#" className="text-slate-400 hover:text-white transition flex items-center gap-2">
                      <Twitter className="h-3.5 w-3.5" /> Twitter
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-slate-400 hover:text-white transition flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5" /> Contact
                    </a>
                  </li>
                </ul>
              </div>
            </div>

          </div>

          <div className="mt-16 border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[11px] font-medium text-slate-600">
              © {new Date().getFullYear()} Patchwork. Build in public.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
              <span>Crafted with</span>
              <span className="text-primary-500">♥</span>
              <span>for builders</span>
            </div>
          </div>
        </div>
      </div>

      {/* Massive Static Hollow Text (QuickFleet Style) */}
      <div className="relative w-full overflow-hidden bg-[#070707] flex justify-center items-center pt-10 pb-4 border-t border-white/5">
        <div
          className="text-[15vw] sm:text-[18vw] leading-[0.8] font-black tracking-tighter select-none px-4"
          style={{
            WebkitTextFillColor: "transparent",
            WebkitTextStroke: "2px rgba(255, 255, 255, 0.15)",
          }}
        >
          patchwork
        </div>
      </div>
    </footer>
  );
}
