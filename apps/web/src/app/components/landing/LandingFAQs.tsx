import React, { useState } from 'react';
import { ArrowRight, Plus, Sparkles } from 'lucide-react';

export function LandingFAQs() {
  const faqs = [
    {
      id: "faq-1",
      question: "Is this beginner-friendly?",
      answer: "Yes. You can start with zero experience. Create a room for a simple side-project, log your learning process, and let the community guide you. The rigor comes from building in public, not necessarily having a perfect product."
    },
    {
      id: "faq-2",
      question: "Do I need a fully coded product?",
      answer: "Not at all. Patchwork is for logging the process. You can log your PRDs, Figma designs, architecture diagrams, or even just your daily decisions as you build."
    },
    {
      id: "faq-3",
      question: "Who are the Observers?",
      answer: "Observers are verified senior builders, PMs, and engineering leaders who review public build rooms. They provide feedback, score decisions, and offer real-world validation."
    },
    {
      id: "faq-4",
      question: "How much does it cost?",
      answer: "Creating a public build room and logging your progress is completely free. We want to remove all barriers to proving your skills."
    },
    {
      id: "faq-5",
      question: "Can I use this for a private startup?",
      answer: "Yes, you can create private rooms if you need to keep your IP hidden, but the true value of Patchwork comes from the public proof of work and community validation."
    }
  ];

  const [activeFaq, setActiveFaq] = useState(faqs[0]);

  return (
    <section className="bg-[#0f0f0f] py-24 sm:py-32 border-t border-white/5">
      <div className="mx-auto max-w-7xl px-6">
        
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          
          {/* Left Column: Questions List */}
          <div>
            <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight mb-12 flex items-baseline gap-2">
              FAQs<span className="text-primary-500 text-6xl">.</span>
            </h2>

            <div className="space-y-3">
              {faqs.map((faq) => (
                <button
                  key={faq.id}
                  onClick={() => setActiveFaq(faq)}
                  className={`w-full text-left px-6 py-4 rounded-xl font-bold flex items-center justify-between transition-all duration-300 ${
                    activeFaq.id === faq.id 
                      ? 'bg-white text-slate-900' 
                      : 'bg-[#1a1a1a] text-white hover:bg-[#222222]'
                  }`}
                >
                  <span className="text-[15px]">{faq.question}</span>
                  {activeFaq.id === faq.id ? (
                    <Sparkles className="w-4 h-4 text-primary-500 shrink-0" />
                  ) : (
                    <Plus className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                </button>
              ))}
            </div>

            <div className="mt-8 flex items-center gap-2">
              <span className="text-[12px] font-medium text-slate-400">More to dig into?</span>
              <a href="#" className="text-[12px] font-bold text-primary-500 hover:text-primary-400 transition flex items-center gap-1">
                See all FAQs in the Help Center <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Right Column: Active Answer Box */}
          <div className="lg:pt-24">
            <div className="bg-primary-50 rounded-2xl p-8 sm:p-12 relative shadow-2xl">
              <Sparkles className="w-5 h-5 text-primary-500 mb-6" />
              <p className="text-slate-900 text-[15px] sm:text-base leading-relaxed font-medium">
                {activeFaq.answer}
              </p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
