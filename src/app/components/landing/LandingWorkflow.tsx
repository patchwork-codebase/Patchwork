import React from "react";
import { Check, Users, Lock, ShieldCheck, Globe } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { workflowSteps } from "../../constants/landingData";
import { getAvatarUrl } from "../../utils/helpers";

interface LandingWorkflowProps {
  selectedWorkflowStep: number;
  setSelectedWorkflowStep: (step: number) => void;
}

export function LandingWorkflow({
  selectedWorkflowStep,
  setSelectedWorkflowStep
}: LandingWorkflowProps) {
  
  const renderAvatars = (step: number) => {
    let count = 1;
    let extra = null;
    if (step === 1) count = 1; // Just builder
    if (step === 2) count = 3; // Builder + team
    if (step === 3) { count = 4; extra = "expert"; } // Builder + team + expert
    if (step === 4) count = 8; // Public
    
    return (
      <div className="flex -space-x-2">
        {Array.from({ length: count }).map((_, i) => (
          <motion.div
            key={`avatar-${step}-${i}`}
            initial={{ opacity: 0, scale: 0.5, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ delay: i * 0.1, duration: 0.3 }}
            className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 overflow-hidden relative shadow-sm"
            style={{ zIndex: 20 - i }}
          >
            <img src={getAvatarUrl(`wf-user-${i}`)} className="w-full h-full object-cover" alt="User" />
            {extra === "expert" && i === 3 && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary-400 rounded-full border border-white flex items-center justify-center">
                <ShieldCheck className="w-2 h-2 text-white" />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    );
  };

  const getStepIcon = (step: number) => {
    switch (step) {
      case 1: return <Lock className="w-5 h-5" />;
      case 2: return <Users className="w-5 h-5" />;
      case 3: return <ShieldCheck className="w-5 h-5" />;
      case 4: return <Globe className="w-5 h-5" />;
      default: return null;
    }
  };

  return (
    <section id="workflow" className="relative py-24 bg-transparent border-y border-slate-200/50">
      <div className="mx-auto max-w-7xl px-6">

        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
          <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-primary-600 bg-primary-50 px-3 py-1 rounded-full border border-primary-200">
            HOW IT WORKS
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
            From private idea to public proof-of-work
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-medium">
            Click through the steps below to explore how a raw idea transforms into a verified, permanent portfolio piece.
          </p>
        </div>

        {/* Workflow Selector & Panel */}
        <div className="grid gap-8 lg:grid-cols-12 items-center">

          {/* Left Column: Selector Buttons */}
          <div className="lg:col-span-5 space-y-4">
            {workflowSteps.map((step) => {
              const isActive = step.step === selectedWorkflowStep;
              return (
                <button
                  key={step.step}
                  onClick={() => setSelectedWorkflowStep(step.step)}
                  className={`w-full flex items-start gap-4 rounded-2xl p-5 text-left transition border ${isActive
                    ? "bg-white border-slate-200 shadow-sm"
                    : "hover:bg-slate-50 hover:border-slate-200 border-transparent"
                    }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold transition text-sm ${isActive
                      ? "bg-primary-500 text-white shadow-md"
                      : "bg-slate-50 text-slate-400 border border-slate-200"
                      }`}
                  >
                    {getStepIcon(step.step)}
                  </div>
                  <div className="space-y-1">
                    <h3 className={`text-base font-bold transition ${isActive ? "text-slate-900" : "text-slate-500 hover:text-slate-900"}`}>
                      {step.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Visual Mockup for Step */}
          <div className="lg:col-span-7 relative h-[500px]">
            <div className="absolute -inset-0.5 rounded-[24px] bg-gradient-to-tr from-primary-500/20 to-primary-400/5 blur opacity-30 pointer-events-none" />

            <AnimatePresence mode="wait">
              <motion.div
                key={selectedWorkflowStep}
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 rounded-[20px] border border-slate-200 bg-white p-6 space-y-6 shadow-xl shadow-slate-200/50"
              >
                {/* Workflow Card Mockup Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4 sm:gap-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">
                      Patchwork Room Simulator
                    </span>
                    <span className="h-1.5 w-1.5 rounded-full bg-[#00B37E] animate-pulse" />
                  </div>
                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                    {renderAvatars(selectedWorkflowStep)}
                    <div className="text-[10px] text-slate-600 font-mono font-bold bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
                      Step {selectedWorkflowStep} / 4
                    </div>
                  </div>
                </div>

                {/* Dynamic Mockup Body */}
                <div className="space-y-5 h-[340px] overflow-y-auto pr-2 custom-scrollbar">
                  <div className="flex items-center justify-between">
                    <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${
                      selectedWorkflowStep === 1 ? 'bg-slate-50 text-slate-600 border border-slate-200' :
                      selectedWorkflowStep === 2 ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' :
                      selectedWorkflowStep === 3 ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                      'bg-sage-50 text-sage-600 border border-sage-200'
                    }`}>
                      {workflowSteps[selectedWorkflowStep - 1].mockup.tag}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 font-bold">
                      {workflowSteps[selectedWorkflowStep - 1].mockup.status}
                    </span>
                  </div>

                  <h4 className="text-lg font-bold text-slate-900 leading-tight">
                    {workflowSteps[selectedWorkflowStep - 1].mockup.title}
                  </h4>

                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="rounded-xl bg-slate-50 border border-slate-200 p-5 text-sm font-serif italic text-slate-700 leading-relaxed relative"
                  >
                    <div className="absolute -left-1.5 top-5 w-3 h-3 bg-slate-50 border-t border-l border-slate-200 rotate-[-45deg]" />
                    "{workflowSteps[selectedWorkflowStep - 1].mockup.content}"
                  </motion.div>

                  {/* Interactive pills mock */}
                  {workflowSteps[selectedWorkflowStep - 1].mockup.pillActions && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="flex flex-wrap gap-2 pt-2"
                    >
                      <span className="rounded-full bg-primary-50 border border-primary-200 px-3 py-1.5 text-[11px] text-primary-600 font-bold hover:bg-primary-100 cursor-pointer transition">✦ Sharp · 12</span>
                      <span className="rounded-full bg-slate-50 shadow-sm border border-slate-200 px-3 py-1.5 text-[11px] text-slate-600 font-medium hover:bg-slate-100 hover:text-slate-900 cursor-pointer transition">↩ Push back · 2</span>
                      <span className="rounded-full bg-slate-50 shadow-sm border border-slate-200 px-3 py-1.5 text-[11px] text-slate-600 font-medium hover:bg-slate-100 hover:text-slate-900 cursor-pointer transition">? Tell me more · 5</span>
                    </motion.div>
                  )}

                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-3 pt-4 border-t border-slate-200"
                  >
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Key Features at this Step</div>
                    <ul className="space-y-2.5">
                      {workflowSteps[selectedWorkflowStep - 1].points.map((point, index) => (
                        <li key={index} className="flex items-start gap-3 text-sm text-slate-600 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100 shadow-sm">
                          <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="text-slate-700 font-medium">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                </div>

              </motion.div>
            </AnimatePresence>
          </div>

        </div>

      </div>
    </section>
  );
}
