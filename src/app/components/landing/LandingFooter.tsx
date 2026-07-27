import React from "react";
import { ArrowRight, Mail, Send, Check, Twitter } from "lucide-react";
import { useNavigate } from "react-router";

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
    <footer className="bg-white py-16 text-slate-500 border-t border-slate-200">
              <div className="mx-auto max-w-7xl px-6">
                <div className="grid gap-10 md:grid-cols-12">

                  {/* Footer Left Column: Logo & Newsletter */}
                  <div className="md:col-span-5 space-y-6">
                    <div className="flex items-center gap-3 text-lg font-bold tracking-tight text-slate-900">
                      <div className="flex h-8 w-8 items-center justify-center rounded-[12px] bg-gradient-to-br from-[#6C5CE7] to-[#8B7CF8] text-white">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m15 12-8.373 8.373a1 1 0 1 1-1.414-1.414L13.586 10.586"/>
                          <path d="m18 13.4-9-9"/>
                          <path d="M12 4.4 14.6 2l3.4 3.4L15.6 8z"/>
                          <path d="M18.4 10.6 21 8l-3.4-3.4L15 7.2"/>
                        </svg>
                      </div>
                      <span className="font-black tracking-tight text-xl text-[#0f172a]">patchwork</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
                      Every great product begins with an idea, but every great builder is shaped by the journey. Patchwork exists to help builders document their thinking, collaborate with experts, earn trust through proof of work, and leave behind a record of how meaningful products are built.
                    </p>

                    {/* Newsletter Form */}
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Get weekly building digests
                      </div>
                      <form onSubmit={handleNewsletterSubmit} className="flex gap-2 max-w-sm">
                        <input
                          type="email"
                          required
                          value={newsletterEmail}
                          onChange={(e) => setNewsletterEmail(e.target.value)}
                          placeholder="you@builder.com"
                          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-primary-500 transition"
                        />
                        <button
                          type="submit"
                          className="rounded-xl bg-primary-500 hover:bg-primary-600 px-4 py-2.5 text-xs font-bold text-white transition flex items-center justify-center gap-1.5 shrink-0"
                        >
                          {newsletterSent ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <>
                              <span>Subscribe</span>
                              <Send className="h-3 w-3" />
                            </>
                          )}
                        </button>
                      </form>
                      {newsletterSent && (
                        <p className="text-[10px] text-emerald-400 font-semibold animate-pulse mt-1">
                          ✓ Successfully subscribed to building digests!
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Footer Right Columns */}
                  <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-6 pt-8 md:pt-0">
                    <div className="space-y-4">
                      <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">Product</div>
                      <ul className="space-y-2 text-xs">
                        <li><a href="#features" className="hover:text-slate-900 transition">Build Rooms</a></li>
                        <li><a href="#features" className="hover:text-slate-900 transition">Structured Reactions</a></li>
                        <li><a href="#features" className="hover:text-slate-900 transition">Build Logs</a></li>
                        <li><a href="#workflow" className="hover:text-slate-900 transition">Reputation Engine</a></li>
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">Resources</div>
                      <ul className="space-y-2 text-xs">
                        <li><a href="#faq" className="hover:text-slate-900 transition">FAQs</a></li>
                        <li><a href="#showcase" className="hover:text-slate-900 transition">Showcase Feed</a></li>
                        <li><span className="text-slate-400 cursor-not-allowed">Talent Directory (soon)</span></li>
                        <li><span className="text-slate-400 cursor-not-allowed">API docs</span></li>
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">Legal & Social</div>
                      <ul className="space-y-2 text-xs">
                        <li><span onClick={() => navigate('/ip-framework')} className="hover:text-slate-900 transition cursor-pointer text-emerald-600">IP Protection Framework</span></li>
                        <li><span onClick={() => navigate('/privacy')} className="hover:text-slate-900 transition cursor-pointer">Privacy Policy</span></li>
                        <li><span onClick={() => navigate('/terms')} className="hover:text-slate-900 transition cursor-pointer">Terms of Service</span></li>
                        <li><a href="https://twitter.com/patchwork" target="_blank" rel="noreferrer" className="hover:text-slate-900 transition flex items-center gap-1.5"><Twitter className="w-3 h-3" /> Twitter / X</a></li>
                      </ul>
                    </div>
                  </div>

                </div>

                <div className="border-t border-slate-200 mt-12 pt-8 text-center text-[11px] text-slate-400 font-mono">
                  © 2026 Patchwork Platform. Built for developers by developers. All rights reserved.
                </div>
              </div>
            </footer>
  );
}
