import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus } from 'lucide-react';

export function LandingFAQs() {
  const faqs = [
    {
      id: "faq-1",
      question: "Is this beginner-friendly?",
      answer: "Yes. You can start with zero experience. Create a room for a simple side-project, log your learning process, and let the community guide you. The rigor comes from building in public, not necessarily having a perfect product from day one."
    },
    {
      id: "faq-2",
      question: "Do I need a fully coded product?",
      answer: "Not at all. Patchwork is for logging the process. You can log your PRDs, Figma designs, architecture diagrams, or even just your daily decisions as you build."
    },
    {
      id: "faq-3",
      question: "Who are the Observers?",
      answer: "Observers are verified senior builders, PMs, and engineering leaders who review public build rooms. They provide feedback, score decisions, and offer real-world validation to your portfolio."
    },
    {
      id: "faq-4",
      question: "How much does it cost?",
      answer: "Creating a public build room and logging your progress is completely free. We want to remove all barriers to proving your skills. Premium features exist for deep portfolio analytics."
    }
  ];

  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section className="bg-[#0a0a0a] py-28 sm:py-36 border-t border-white/5">
      <div className="mx-auto max-w-4xl px-5 sm:px-8 lg:px-12">
        
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-primary-500 font-bold text-sm tracking-widest uppercase font-mono mb-6"
        >
          07 / FAQs
        </motion.div>
        
        <motion.h2 
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl sm:text-6xl font-black text-white tracking-tight mb-16"
        >
          Things you might<br />be wondering.
        </motion.h2>

        <div className="border-t border-white/10">
          {faqs.map((faq, i) => (
            <motion.div 
              key={faq.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="border-b border-white/10"
            >
              <button
                onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                className="w-full py-8 flex items-center justify-between text-left group"
              >
                <span className={`text-xl sm:text-2xl font-bold transition-colors duration-300 ${openId === faq.id ? 'text-primary-400' : 'text-white group-hover:text-primary-400'}`}>
                  {faq.question}
                </span>
                <span className={`ml-6 shrink-0 w-8 h-8 flex items-center justify-center rounded-full border transition-all duration-300 ${openId === faq.id ? 'border-primary-500 text-primary-500 rotate-180 bg-primary-500/10' : 'border-white/20 text-white group-hover:border-primary-500 group-hover:text-primary-500'}`}>
                  {openId === faq.id ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </span>
              </button>
              <AnimatePresence>
                {openId === faq.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="pb-8 pr-12 text-lg text-slate-400 font-medium leading-relaxed">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
