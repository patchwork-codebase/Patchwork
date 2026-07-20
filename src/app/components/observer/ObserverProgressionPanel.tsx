import { useState } from "react";
import { useAuth, supabase } from "../auth/AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { 
  Hammer, Eye, ShieldCheck, Sparkles, Award, 
  ArrowRight, Check, X, Loader2, Link2, Briefcase 
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router";

// Config for builder selection tracks
const BUILDER_TRACKS = [
  { value: 'product-manager', label: 'Product Manager', emoji: '📋', desc: 'Define what gets built, align teams, and track milestones.' },
  { value: 'founder', label: 'Founder', emoji: '🚀', desc: 'Build the company, share traction, and scale operations.' },
  // { value: 'engineer', label: 'Engineer', emoji: '⚙️', desc: 'Write code, design architectures, and share technical snippets.' },
  // { value: 'product-designer', label: 'Product Designer', emoji: '🎨', desc: 'Craft customer experiences, test flows, and iterate in public.' },
  // { value: 'researcher', label: 'Researcher', emoji: '🔬', desc: 'Interview customers, formulate hypotheses, and track signals.' },
  // { value: 'growth', label: 'Growth Strategist', emoji: '📈', desc: 'Run growth experiments, track metrics, and optimize conversions.' },
];

export function ObserverProgressionPanel() {
  const { user, profile, refreshProfile } = useAuth();
  const [upgrading, setUpgrading] = useState(false);
  const [builderModalOpen, setBuilderModalOpen] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState('');

  // Leader application state
  const [leaderModalOpen, setLeaderModalOpen] = useState(false);
  const [submittingLeader, setSubmittingLeader] = useState(false);
  const [leaderLinkedin, setLeaderLinkedin] = useState('');
  const [leaderRole, setLeaderRole] = useState('');
  const [leaderExperience, setLeaderExperience] = useState('');

  // Handle Role Upgrade to Builder
  const handleUpgradeToBuilder = async () => {
    if (!user || !selectedTrack) return;
    setUpgrading(true);
    try {
      const { data: currentUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (fetchError) throw fetchError;

      const payload = {
        ...currentUser,
        role: 'builder',
        domain: selectedTrack,
        signup_completed_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('users')
        .upsert(payload, { onConflict: 'id' });

      if (error) throw error;

      await supabase.auth.updateUser({
        data: { role: 'builder' }
      });

      await refreshProfile();
      toast.success(`Success! You are now a Builder (${selectedTrack}). Dashboard updated.`);
      setBuilderModalOpen(false);
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)) || 'Failed to update role.');
    } finally {
      setUpgrading(false);
    }
  };

  // Handle Leader Verification submission
  const handleSubmitLeader = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !leaderLinkedin.trim() || !leaderExperience.trim()) return;
    setSubmittingLeader(true);
    try {
      const payload = {
        user_id: user.id,
        status: "pending",
        verification_level: "leader",
        linkedin_url: leaderLinkedin.trim(),
        headline: leaderRole.trim() || "Leader Verification Candidate",
        bio: leaderExperience.trim(),
        reason: "Applied for premium Leader Verification badge from the observer progression hub.",
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("expert_applications")
        .insert(payload);

      if (error) throw error;

      toast.success("Leader Verification request submitted! We'll review your profile soon.");
      setLeaderModalOpen(false);
      setLeaderLinkedin('');
      setLeaderRole('');
      setLeaderExperience('');
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)) || 'Failed to submit request.');
    } finally {
      setSubmittingLeader(false);
    }
  };

  // Determine which pathways to show
  const showBuilder = profile?.role !== 'builder' && profile?.role !== 'admin';
  const showExpert = !profile?.isVerifiedExpert;
  const showLeader = !profile?.isVerifiedExpert; // hide leader if they are already verified (for now)

  if (!showBuilder && !showExpert && !showLeader) {
    return null;
  }

  return (
    <>
      {/* Sleek, Compact Sidebar Card */}
      <div className="bg-white border border-slate-100 rounded-[20px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] focus-ring" tabIndex={0}>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-widest font-mono">Progression Pathways</h3>
        </div>

        <div className="space-y-4">
          {/* Pathway 1: Become a Builder */}
          {showBuilder && (
            <div className="flex items-start gap-3 pb-3.5 border-b border-slate-50 last:border-0 last:pb-0">
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-500 shrink-0 mt-0.5">
                <Hammer className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-bold text-slate-900 leading-tight">Become a Builder</span>
                  <button
                    onClick={() => setBuilderModalOpen(true)}
                    className="px-2.5 py-1 text-[11px] font-bold bg-purple-550 hover:bg-purple-650 text-white rounded-md transition-colors"
                  >
                    Upgrade
                  </button>
                </div>
                <p className="text-[11.5px] text-slate-500 leading-normal mt-0.5 font-medium">Create rooms & log build progress</p>
              </div>
            </div>
          )}

          {/* Pathway 2: Apply as an Expert */}
          {showExpert && (
            <div className="flex items-start gap-3 pb-3.5 border-b border-slate-50 last:border-0 last:pb-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-bold text-slate-900 leading-tight">Apply as an Expert</span>
                  <Link
                    to="/dashboard/expert-apply"
                    className="px-2.5 py-1 text-[11px] font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-md transition-colors inline-block text-center leading-none"
                  >
                    Apply
                  </Link>
                </div>
                <p className="text-[11.5px] text-slate-500 leading-normal mt-0.5 font-medium">Mentor builders & write reviews</p>
              </div>
            </div>
          )}

          {/* Pathway 3: Leader Verification */}
          {showLeader && (
            <div className="flex items-start gap-3 last:border-0 last:pb-0">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500 shrink-0 mt-0.5">
                <Award className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-bold text-slate-900 leading-tight">Request Leader Badge</span>
                  <button
                    onClick={() => setLeaderModalOpen(true)}
                    className="px-2.5 py-1 text-[11px] font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-md transition-colors"
                  >
                    Request
                  </button>
                </div>
                <p className="text-[11.5px] text-slate-500 leading-normal mt-0.5 font-medium">For directors, PMs & founders</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── MODAL: BECOME A BUILDER (TRACK SELECTION) ─── */}
      <AnimatePresence>
        {builderModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#15131C] border border-white/[0.08] w-full max-w-lg rounded-3xl p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setBuilderModalOpen(false)}
                className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all cursor-pointer animate-in fade-in"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="mb-6">
                <h3 className="text-xl font-extrabold text-white font-display flex items-center gap-2">
                  <Hammer className="w-5 h-5 text-purple-400" /> Upgrade to Builder
                </h3>
                <p className="text-xs text-slate-400 mt-1">Select your builder track to activate your Builder Dashboard.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {BUILDER_TRACKS.map(track => {
                  const isSelected = selectedTrack === track.value;
                  return (
                    <button
                      key={track.value}
                      onClick={() => setSelectedTrack(track.value)}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-purple-400 bg-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                          : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="text-lg mb-1">{track.emoji}</div>
                      <div className="text-[13px] font-bold text-white leading-tight">{track.label}</div>
                      <div className="text-[10px] text-slate-500 mt-1.5 leading-snug font-medium">{track.desc}</div>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3 border-t border-white/[0.06] pt-4">
                <button
                  onClick={() => setBuilderModalOpen(false)}
                  className="flex-1 py-2.5 border border-white/[0.08] hover:bg-white/5 text-slate-300 font-bold rounded-xl text-sm transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpgradeToBuilder}
                  disabled={upgrading || !selectedTrack}
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-extrabold rounded-xl text-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {upgrading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Upgrading...</>
                  ) : (
                    <><Check className="w-4 h-4" /> Activate Builder Status</>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODAL: LEADER VERIFICATION FORM ─── */}
      <AnimatePresence>
        {leaderModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#15131C] border border-white/[0.08] w-full max-w-md rounded-3xl p-6 sm:p-8 relative"
            >
              <button
                onClick={() => setLeaderModalOpen(false)}
                className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="mb-6">
                <h3 className="text-xl font-extrabold text-white font-display flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" /> Leader Verification
                </h3>
                <p className="text-xs text-slate-400 mt-1">Apply for credentialed status within the Patchwork ecosystem.</p>
              </div>

              <form onSubmit={handleSubmitLeader} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                    LinkedIn Profile URL <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Link2 className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="url"
                      required
                      value={leaderLinkedin}
                      onChange={e => setLeaderLinkedin(e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                      className="w-full pl-9 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-[13px] text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                    Current Leadership Role / Company
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={leaderRole}
                      onChange={e => setLeaderRole(e.target.value)}
                      placeholder="e.g. CPO at Paystack / Product Director"
                      className="w-full pl-9 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-[13px] text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                    Experience Summary <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    value={leaderExperience}
                    onChange={e => setLeaderExperience(e.target.value)}
                    placeholder="Briefly state your leadership achievements, previous roles, and verification credentials..."
                    rows={4}
                    className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-[13px] text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 transition-all resize-none"
                  />
                </div>

                <div className="flex gap-3 border-t border-white/[0.06] pt-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setLeaderModalOpen(false)}
                    className="flex-1 py-2.5 border border-white/[0.08] hover:bg-white/5 text-slate-300 font-bold rounded-xl text-sm transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingLeader || !leaderLinkedin.trim() || !leaderExperience.trim()}
                    className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {submittingLeader ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                    ) : (
                      <><Check className="w-4 h-4" /> Submit Application</>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
