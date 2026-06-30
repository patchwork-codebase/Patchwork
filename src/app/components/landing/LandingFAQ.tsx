import React from "react";
import { Plus, X, ChevronDown } from "lucide-react";
import { faqs } from "../../constants/landingData";

interface LandingFAQProps {
  activeFaq: number | null;
  setActiveFaq: (index: number | null) => void;
}

export function LandingFAQ({ activeFaq, setActiveFaq }: LandingFAQProps) {
  return (
            <section id="faq" className="relative py-24 bg-transparent border-t border-slate-200/50">
              <div className="mx-auto max-w-4xl px-6">

                {/* Section Header */}
                <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
                  <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-primary-600 bg-primary-50 px-3 py-1 rounded-full border border-primary-200">
                    HELP & RESOURCES
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
                    Frequently Asked Questions
                  </h2>
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-medium">
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
                          isOpen ? "border-slate-300 bg-white shadow-md shadow-slate-200/50" : "border-slate-200 bg-white"
                        }`}
                      >
                        <button
                          onClick={() => setActiveFaq(isOpen ? null : idx)}
                          className="w-full flex items-center justify-between p-6 text-left transition hover:bg-slate-50 shadow-sm"
                        >
                          <span className="text-sm sm:text-base font-bold text-slate-900 pr-4">
                            {faq.q}
                          </span>
                          <ChevronDown
                            className={`h-5 w-5 text-slate-400 shrink-0 transition duration-300 ${isOpen ? "rotate-180 text-slate-900" : ""
                              }`}
                          />
                        </button>

                        {/* Dynamic Height collapse */}
                        {isOpen && (
                          <div className="border-t border-slate-100 bg-slate-50 px-6 py-5 text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
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
