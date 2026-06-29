import React from "react";
import { Plus, X, ChevronDown } from "lucide-react";
import { faqs } from "../../constants/landingData";

interface LandingFAQProps {
  activeFaq: number | null;
  setActiveFaq: (index: number | null) => void;
}

export function LandingFAQ({ activeFaq, setActiveFaq }: LandingFAQProps) {
  return (
            <section id="faq" className="relative py-24 bg-[#050505] border-t border-white/5">
              <div className="mx-auto max-w-4xl px-6">

                {/* Section Header */}
                <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
                  <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-primary-400 bg-primary-500/10 px-3 py-1 rounded-full">
                    HELP & RESOURCES
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
                    Frequently Asked Questions
                  </h2>
                  <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                    Have questions about building in the open, private rooms, or reputation metrics? We've got you covered.
                  </p>
                </div>

                {/* FAQ List */}
                <div className="space-y-3">
                  {faqs.map((faq, idx) => {
                    const isOpen = activeFaq === idx;
                    return (
                      <div
                        key={idx}
                        className={`rounded-2xl border overflow-hidden transition-all duration-300 ${
                          isOpen ? "border-sage/40 bg-[#0E0C15] shadow-lg shadow-sage-950/5" : "border-white/10 bg-[#0E0C15]"
                        }`}
                      >
                        <button
                          onClick={() => setActiveFaq(isOpen ? null : idx)}
                          className="w-full flex items-center justify-between p-6 text-left transition hover:bg-white/5 shadow-sm"
                        >
                          <span className="text-sm sm:text-base font-bold text-white pr-4">
                            {faq.q}
                          </span>
                          <ChevronDown
                            className={`h-5 w-5 text-slate-400 shrink-0 transition duration-300 ${isOpen ? "rotate-180 text-white" : ""
                              }`}
                          />
                        </button>

                        {/* Dynamic Height collapse */}
                        {isOpen && (
                          <div className="border-t border-white/10 bg-sage-950/20 px-6 py-5 text-xs sm:text-sm text-slate-300 leading-relaxed font-light">
                            {faq.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

              </div>
            </section>
  );
}
