import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Rocket, FileText, GitBranch, Ticket, ShieldCheck, ChevronRight, ChevronLeft, X, Sparkles, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface BuilderTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
}

const TOUR_STEPS = [
  {
    icon: Rocket,
    title: 'Welcome to your Build Room',
    badge: 'Step 1 of 5',
    color: 'from-primary-500 to-indigo-600',
    description: 'Your Build Room is your transparent development hub. Broadcast real-time progress updates, gain early observer feedback, and prove your build velocity.',
    tips: [
      'Observers can follow your room to receive update alerts',
      'Proof-of-work timestamps are cryptographically generated',
      'All updates stream live to observers in real-time'
    ]
  },
  {
    icon: FileText,
    title: 'Composer & Auto-Draft Persistence',
    badge: 'Step 2 of 5',
    color: 'from-emerald-500 to-teal-600',
    description: 'Never lose your thought flow. The room composer automatically saves unsaved drafts to local storage, ensuring your writing is safe during tab switches.',
    tips: [
      'Attach code snippets, media, and decision logs',
      'Drafts persist automatically per room',
      'Supports markdown formatting out of the box'
    ]
  },
  {
    icon: GitBranch,
    title: 'GitHub & Linear Webhook Sync',
    badge: 'Step 3 of 5',
    color: 'from-primary-500 to-pink-600',
    description: 'Automate your update feed. Connect GitHub repositories or Linear teams via 1-click webhook URLs to stream live commits and shipped issue updates.',
    tips: [
      'Click Webhooks in the room header to copy your payload URL',
      'Trigger 1-click test events to verify your integration',
      'Commits and issue closes auto-post to the feed'
    ]
  },
  {
    icon: Ticket,
    title: 'Roadmap & Granular Team Permissions',
    badge: 'Step 4 of 5',
    color: 'from-blue-500 to-cyan-600',
    description: 'Collaborate with full control. Assign tickets to co-builders and grant custom permissions (Manage Tickets, Edit Docs, Invite Team) per member.',
    tips: [
      'Drag and drop tickets across Kanban columns',
      'Customize member permissions in the Team tab',
      'Observers remain read-only for security'
    ]
  },
  {
    icon: ShieldCheck,
    title: 'SHA-256 Proof of Work & AI Digests',
    badge: 'Step 5 of 5',
    color: 'from-amber-500 to-orange-600',
    description: 'Showcase your build credential. Generate 1-click AI executive digests with Claude and display your SHA-256 chain verified proof-of-work badge.',
    tips: [
      'Click AI Weekly Digest in Overview to generate summaries',
      'Share your verified proof-of-work portfolio link',
      'All milestone timestamps are cryptographically anchored'
    ]
  }
];

export function BuilderTourModal({ isOpen, onClose, roomId }: BuilderTourModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[currentStepIndex];
  const StepIcon = currentStep.icon;
  const isLastStep = currentStepIndex === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      localStorage.setItem(`patchwork_tour_completed_${roomId}`, 'true');
      toast.success('Tour completed! You are ready to build.');
      onClose();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-xl bg-ink border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden relative"
      >
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 blur-3xl rounded-full pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-white/10 text-slate-300 border border-white/10 font-mono">
              {currentStep.badge}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStepIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${currentStep.color} flex items-center justify-center shadow-lg text-white shrink-0`}>
                <StepIcon className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white font-display">
                  {currentStep.title}
                </h3>
              </div>
            </div>

            <p className="text-[14px] sm:text-[15px] text-slate-300 font-medium leading-relaxed">
              {currentStep.description}
            </p>

            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 space-y-2.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block font-mono">
                Key Highlights:
              </span>
              {currentStep.tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === currentStepIndex ? 'w-6 bg-primary-400' : 'w-2 bg-white/20'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            {currentStepIndex > 0 && (
              <button
                onClick={handlePrev}
                className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-5 py-2.5 text-xs font-extrabold text-ink bg-white hover:bg-slate-100 rounded-full transition-all flex items-center gap-1.5 shadow-lg cursor-pointer hover:scale-105"
            >
              {isLastStep ? 'Complete Tour' : 'Next Step'} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
