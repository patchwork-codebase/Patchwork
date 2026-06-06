import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, X, ChevronRight, Loader2 } from "lucide-react";
import { supabase } from "../auth/AuthContext";

/* ─── Types ─────────────────────────────────────────────── */
interface CompletionState {
  domain: boolean;
  room: boolean;
  update: boolean;
  call: boolean;
}

const EMPTY: CompletionState = { domain: false, room: false, update: false, call: false };

/* ─── Step definitions ───────────────────────────────────── */
const BUILDER_STEPS = [
  { id: 'domain', emoji: '🎯', title: 'Set your domain', description: 'What space are you building in? Product, Design, Engineering...' },
  { id: 'room', emoji: '🚪', title: 'Open your first room', description: 'Give your build a name and open it for observers to follow.' },
  { id: 'update', emoji: '📝', title: 'Post your first update', description: "What's happening right now? Share the messy truth." },
  { id: 'call', emoji: '📅', title: 'Schedule intro call', description: '20 minutes with the team to frame your build room.' },
];

const OBSERVER_STEPS = [
  { id: 'domain', emoji: '🎯', title: 'Set your interests', description: 'What domains do you want to follow — Product, Design...' },
  { id: 'room', emoji: '🚪', title: 'Follow your first room', description: 'Find a builder whose work you want to watch unfold.' },
  { id: 'update', emoji: '📡', title: 'Tune your feed', description: 'Tell us what kinds of updates matter most to you.' },
  { id: 'call', emoji: '📅', title: 'Schedule intro call', description: '20 minutes to get the most out of Patchwork as an observer.' },
];

/* ─── Load completion state from Supabase ───────────────── */
async function loadCompletion(userId: string, role: string): Promise<CompletionState> {
  const state = { ...EMPTY };
  try {
    // Check domain / interests set
    const { data: userRow } = await supabase
      .from('users')
      .select('domain, interests, onboarding_call_scheduled, signup_completed_at')
      .eq('id', userId)
      .single();

    if (role === 'builder') {
      state.domain = !!userRow?.domain;
    } else {
      state.domain = !!(userRow?.interests?.length);
    }
    state.call = !!userRow?.onboarding_call_scheduled;

    // Check room created
    const { data: rooms } = await supabase
      .from('rooms')
      .select('id')
      .eq('builder_id', userId)
      .limit(1);
    state.room = !!(rooms && rooms.length > 0);

    // Check first update posted (builder) or feed_focus set (observer)
    if (role === 'builder' && state.room && rooms?.[0]) {
      const { data: updates } = await supabase
        .from('room_updates')
        .select('id')
        .eq('author_id', userId)
        .limit(1);
      state.update = !!(updates && updates.length > 0);
    } else if (role === 'observer') {
      const { data: feedRow } = await supabase
        .from('users')
        .select('feed_focus')
        .eq('id', userId)
        .single();
      state.update = !!feedRow?.feed_focus;
    }
  } catch (e) {
    console.error('[Checklist] Error loading completion:', e);
  }
  return state;
}

/* ─── Step Modal ─────────────────────────────────────────── */
interface StepModalProps {
  stepId: string;
  emoji: string;
  title: string;
  role: 'builder' | 'observer';
  userId: string;
  userName: string;
  onComplete: (stepId: string) => void;
  onClose: () => void;
}

const DOMAINS = ['product', 'design', 'engineering', 'growth', 'writing', 'research'];

function StepModal({ stepId, emoji, title, role, userId, userName, onComplete, onClose }: StepModalProps) {
  const [saving, setSaving] = useState(false);
  const [text, setText] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('product');
  const [error, setError] = useState('');

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      if (stepId === 'domain') {
        if (role === 'builder') {
          const { error: e } = await supabase.from('users').update({ domain: selectedDomain }).eq('id', userId);
          if (e) throw e;
        } else {
          const interests = text.split(',').map(s => s.trim()).filter(Boolean);
          if (!interests.length) { setError('Enter at least one interest'); setSaving(false); return; }
          const { error: e } = await supabase.from('users').update({ interests }).eq('id', userId);
          if (e) throw e;
        }
      } else if (stepId === 'room' && role === 'builder') {
        if (!text.trim()) { setError('Room name is required'); setSaving(false); return; }
        const { error: e } = await supabase.from('rooms').insert({
          id: crypto.randomUUID(),
          builder_id: userId,
          builder_name: userName || 'Builder',
          title: text.trim(),
          description: 'Building live',
          tags: [selectedDomain],
        });
        if (e) throw e;
      } else if (stepId === 'update' && role === 'builder') {
        // Find the user's first room to post update
        const { data: rooms } = await supabase.from('rooms').select('id').eq('builder_id', userId).limit(1);
        if (rooms && rooms.length > 0) {
          const { error: e } = await supabase.from('room_updates').insert({
            room_id: rooms[0].id,
            author_id: userId,
            content: text.trim() || 'Just got started.',
          });
          if (e) throw e;
        }
      } else if (stepId === 'update' && role === 'observer') {
        const { error: e } = await supabase.from('users').update({ feed_focus: text.trim() }).eq('id', userId);
        if (e) throw e;
      } else if (stepId === 'call') {
        const { error: e } = await supabase.from('users').update({ onboarding_call_scheduled: true }).eq('id', userId);
        if (e) throw e;
        window.open('https://cal.com/patchwork/intro', '_blank');
      }
      onComplete(stepId);
    } catch (err: any) {
      setError(err.message || 'Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="w-full max-w-md bg-[#0D0B14] border border-white/[0.1] rounded-[24px] p-8 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center text-slate-400 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-4xl mb-4">{emoji}</div>
        <h3 className="text-[22px] font-extrabold text-white mb-2">{title}</h3>

        {error && (
          <div className="mb-4 text-[13px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
            {error}
          </div>
        )}

        {/* Domain selector for domain/interests step */}
        {stepId === 'domain' && role === 'builder' && (
          <div className="flex flex-wrap gap-2 mb-6">
            {DOMAINS.map(d => (
              <button
                key={d}
                type="button"
                onClick={() => setSelectedDomain(d)}
                className={`px-4 py-2 rounded-full text-[13px] font-bold capitalize transition-all border ${selectedDomain === d
                    ? 'bg-[#6C5CE7] border-[#6C5CE7] text-white'
                    : 'bg-white/[0.04] border-white/[0.08] text-slate-400 hover:text-white'
                  }`}
              >
                {d}
              </button>
            ))}
          </div>
        )}

        {/* Text inputs */}
        {((stepId === 'domain' && role === 'observer') ||
          (stepId === 'room' && role === 'builder') ||
          (stepId === 'update' && role === 'builder') ||
          (stepId === 'update' && role === 'observer')) && (
            <textarea
              rows={stepId === 'update' ? 4 : 2}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={
                stepId === 'domain' ? 'e.g. Product, Design, Growth' :
                  stepId === 'room' ? 'e.g. MoniFlow — Fintech redesign' :
                    stepId === 'update' && role === 'builder' ? 'e.g. Just decided to drop the mobile-first approach...' :
                      'e.g. I want updates about early-stage product decisions and launch pivots.'
              }
              className="w-full px-4 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-[14px] text-white placeholder-slate-600 focus:outline-none focus:border-[#8B7CF8]/50 focus:ring-1 focus:ring-[#8B7CF8]/30 transition-all mb-6 resize-none"
            />
          )}

        {stepId === 'room' && role === 'observer' && (
          <p className="text-[13px] text-slate-400 mb-6 bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            Explore the Live Feed tab to find rooms you want to follow. Click "Follow" on any room.
          </p>
        )}

        {stepId === 'call' && (
          <p className="text-[13px] text-emerald-300 mb-6 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
            📞 Clicking below opens the scheduling calendar in a new tab. Book your 20-min intro call.
          </p>
        )}

        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: saving ? 1 : 1.02 }}
            whileTap={{ scale: saving ? 1 : 0.98 }}
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3.5 bg-gradient-to-r from-[#6C5CE7] to-[#8B7CF8] text-white text-[14px] font-extrabold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_4px_16px_rgba(108,92,231,0.3)]"
          >
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              : stepId === 'call' ? '📅 Open calendar'
                : stepId === 'room' && role === 'observer' ? 'Got it'
                  : 'Save & continue'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Main Checklist Component ───────────────────────────── */
interface OnboardingChecklistProps {
  role: 'builder' | 'observer';
  userId: string;
  userName: string;
}

export function OnboardingChecklist({ role, userId, userName }: OnboardingChecklistProps) {
  const steps = role === 'builder' ? BUILDER_STEPS : OBSERVER_STEPS;
  const [completion, setCompletion] = useState<CompletionState>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState<typeof steps[0] | null>(null);
  const [dismissed, setDismissed] = useState(false);

  // Sync dismissed state from localStorage on mount/userId change
  useEffect(() => {
    try {
      const isDismissed = localStorage.getItem(`checklist_dismissed_${userId}`) === "true";
      setDismissed(isDismissed);
    } catch (e) {
      console.error('[Checklist] Error reading from localStorage:', e);
    }
  }, [userId]);

  function handleDismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(`checklist_dismissed_${userId}`, "true");
    } catch (e) {
      console.error('[Checklist] Error saving to localStorage:', e);
    }
  }

  // Load real completion state from DB on mount
  useEffect(() => {
    let cancelled = false;
    loadCompletion(userId, role).then(state => {
      if (!cancelled) {
        setCompletion(state);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [userId, role]);

  // Mark a step done + re-check from DB to stay accurate
  async function handleComplete(stepId: string) {
    setCompletion(prev => ({ ...prev, [stepId]: true }));
    setActiveStep(null);
    // Re-sync from DB after a short delay (to let writes settle)
    setTimeout(async () => {
      const fresh = await loadCompletion(userId, role);
      setCompletion(fresh);
      // If all done, mark signup_completed_at
      if (fresh.domain && fresh.room && fresh.update && fresh.call) {
        supabase.from('users').update({
          signup_completed_at: new Date().toISOString()
        }).eq('id', userId).catch(() => { });
      }
    }, 800);
  }

  const completedCount = Object.values(completion).filter(Boolean).length;
  const allDone = completedCount === steps.length;

  if (loading) return null; // Don't flash an empty checklist

  if (dismissed || allDone) {
    if (allDone && !dismissed) {
      return (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-emerald-500/10 border border-emerald-500/20 rounded-[20px] p-5 flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <Check className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-bold text-emerald-300">You're all set! 🎉</p>
            <p className="text-[13px] text-emerald-400/70 mt-0.5">Your Patchwork profile is complete. Time to build.</p>
          </div>
          <button onClick={handleDismiss} className="text-emerald-400/50 hover:text-emerald-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      );
    }
    return null;
  }

  return (
    <>
      <AnimatePresence>
        {activeStep && (
          <StepModal
            stepId={activeStep.id}
            emoji={activeStep.emoji}
            title={activeStep.title}
            role={role}
            userId={userId}
            userName={userName}
            onComplete={handleComplete}
            onClose={() => setActiveStep(null)}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 bg-[#0D0B14] border border-white/[0.08] rounded-[20px] p-5 relative overflow-hidden"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[2px] bg-gradient-to-r from-transparent via-[#8B7CF8]/50 to-transparent" />

        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="text-[15px] font-extrabold text-white">
              Complete your setup{' '}
              <span className="text-[#8B7CF8]">({completedCount}/{steps.length})</span>
            </h3>
            <p className="text-[12px] text-slate-500 mt-0.5">
              Fills your profile, creates your room, and syncs to your account
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-white/[0.06] rounded-full mb-5 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(completedCount / steps.length) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-[#6C5CE7] to-[#8B7CF8] rounded-full"
          />
        </div>

        {/* Step list */}
        <div className="flex flex-col gap-2">
          {steps.map((step, idx) => {
            const done = completion[step.id as keyof CompletionState];
            return (
              <motion.button
                key={step.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.06 }}
                onClick={() => !done && setActiveStep(step)}
                disabled={done}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left ${done ? 'opacity-50 cursor-default' : 'hover:bg-white/[0.04] cursor-pointer'
                  }`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border transition-all ${done
                    ? 'bg-emerald-500/20 border-emerald-500/30'
                    : 'bg-white/[0.04] border-white/[0.1] group-hover:border-[#8B7CF8]/40'
                  }`}>
                  {done
                    ? <Check className="w-3.5 h-3.5 text-emerald-400" />
                    : <span className="text-[11px] font-bold text-slate-500">{idx + 1}</span>
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] font-bold truncate ${done ? 'line-through text-slate-500' : 'text-white'}`}>
                    {step.emoji} {step.title}
                  </p>
                  {!done && (
                    <p className="text-[12px] text-slate-500 mt-0.5 truncate">{step.description}</p>
                  )}
                </div>

                {!done && <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />}
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </>
  );
}
