import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ChevronRight, ChevronLeft, Send, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../auth/AuthContext";
import ExpertCard, { ExpertProfile } from "./ExpertCard";

interface RequestExpertReviewModalProps {
  open: boolean;
  onClose: () => void;
  roomId: string;
}

// Mock data for experts
const MOCK_EXPERTS: ExpertProfile[] = [
  {
    id: "exp-1",
    name: "Sarah Chen",
    avatar: "https://i.pravatar.cc/150?u=1",
    title: "Senior Product Designer",
    company: "Figma",
    domains: ["UX Design", "Prototyping", "Design Systems"],
    reviewsCompleted: 42,
    rating: 4.9,
    activeSlots: 2,
    monthlySlots: 10,
    typicalResponseTime: "24h"
  },
  {
    id: "exp-2",
    name: "Alex Rivera",
    avatar: "https://i.pravatar.cc/150?u=2",
    title: "Staff Engineer",
    company: "Vercel",
    domains: ["React", "Performance", "Architecture"],
    reviewsCompleted: 89,
    rating: 4.95,
    activeSlots: 0,
    monthlySlots: 20,
    typicalResponseTime: "48h"
  },
  {
    id: "exp-3",
    name: "Jamie Doe",
    avatar: "https://i.pravatar.cc/150?u=3",
    title: "Product Manager",
    company: "Stripe",
    domains: ["Growth", "Monetization", "Strategy"],
    reviewsCompleted: 15,
    rating: 4.7,
    activeSlots: 5,
    monthlySlots: 5,
    typicalResponseTime: "12h"
  }
];

export function RequestExpertReviewModal({ open, onClose, roomId }: RequestExpertReviewModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedExpert, setSelectedExpert] = useState<ExpertProfile | null>(null);
  const [domainFilter, setDomainFilter] = useState("");
  
  const [form, setForm] = useState({
    buildSummary: "",
    specificChallenge: "",
    questions: "",
    priority: "medium",
    isPublic: true,
    deadline: "",
    attachments: "" // simple text link for now
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep(1);
        setSelectedExpert(null);
        setForm({
          buildSummary: "",
          specificChallenge: "",
          questions: "",
          priority: "medium",
          isPublic: true,
          deadline: "",
          attachments: ""
        });
      }, 300);
    }
  }, [open]);

  if (!open) return null;

  const filteredExperts = MOCK_EXPERTS.filter(exp => 
    domainFilter ? exp.domains.some(d => d.toLowerCase().includes(domainFilter.toLowerCase())) : true
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedExpert) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // We'll mock the insertion since the DB schema might not be fully migrated for the mock experts
      // In a real scenario, we would insert into `expert_review_requests`
      
      // const payload = {
      //   builder_id: user.id,
      //   expert_id: selectedExpert.id,
      //   room_id: roomId,
      //   build_summary: form.buildSummary,
      //   specific_challenge: form.specificChallenge,
      //   questions: form.questions,
      //   priority: form.priority,
      //   is_public: form.isPublic,
      //   deadline: form.deadline ? new Date(form.deadline).toISOString() : new Date().toISOString()
      // };
      
      // const { error } = await supabase.from('expert_review_requests').insert(payload);
      // if (error) throw error;
      
      // Mocking network delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast.success("Review request sent successfully!");
      onClose();
    } catch (err: unknown) {
      toast.error(`Failed to send request: ${(err instanceof Error ? err.message : String(err))}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-[#0A0910]/80 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-[#1A1825] border border-white/[0.08] rounded-[24px] w-full max-w-[800px] shadow-2xl relative z-10 my-auto flex flex-col max-h-[90vh]"
        >
          <div className="p-6 border-b border-white/[0.08] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              {step === 2 && (
                <button onClick={() => setStep(1)} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <h2 className="text-xl font-bold text-white">
                {step === 1 ? "Select an Expert" : "Request Details"}
              </h2>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/5 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar">
            {step === 1 ? (
              <div className="space-y-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search by domain (e.g., UX Design, React, Growth)..."
                    value={domainFilter}
                    onChange={(e) => setDomainFilter(e.target.value)}
                    className="w-full pl-12 pr-5 py-4 bg-[#0A0910]/50 border border-white/[0.08] rounded-xl text-[15px] text-white placeholder-slate-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 transition-all"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredExperts.map(expert => (
                    <ExpertCard 
                      key={expert.id} 
                      expert={expert} 
                      selected={selectedExpert?.id === expert.id}
                      onSelect={(e) => setSelectedExpert(e)}
                    />
                  ))}
                  {filteredExperts.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-400">
                      No experts found matching "{domainFilter}"
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <form id="request-review-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 mb-6">
                  <img src={selectedExpert?.avatar} className="w-12 h-12 rounded-full" alt="" />
                  <div>
                    <h4 className="text-white font-bold">{selectedExpert?.name}</h4>
                    <p className="text-slate-400 text-sm">Reviewing your build</p>
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-slate-300 mb-2">Build Summary</label>
                  <textarea
                    required rows={2}
                    value={form.buildSummary} onChange={e => setForm(f => ({ ...f, buildSummary: e.target.value }))}
                    placeholder="Briefly describe what you've built..."
                    className="w-full px-5 py-4 bg-[#0A0910]/50 border border-white/[0.08] rounded-xl text-[15px] text-white placeholder-slate-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-slate-300 mb-2">Specific Challenge</label>
                  <textarea
                    required rows={3}
                    value={form.specificChallenge} onChange={e => setForm(f => ({ ...f, specificChallenge: e.target.value }))}
                    placeholder="What specific part are you struggling with?"
                    className="w-full px-5 py-4 bg-[#0A0910]/50 border border-white/[0.08] rounded-xl text-[15px] text-white placeholder-slate-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-slate-300 mb-2">Questions for Expert</label>
                  <textarea
                    required rows={3}
                    value={form.questions} onChange={e => setForm(f => ({ ...f, questions: e.target.value }))}
                    placeholder="1. Is the UX intuitive?\n2. What would you do differently?"
                    className="w-full px-5 py-4 bg-[#0A0910]/50 border border-white/[0.08] rounded-xl text-[15px] text-white placeholder-slate-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[13px] font-bold text-slate-300 mb-2">Priority</label>
                    <select
                      value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                      className="w-full px-5 py-4 bg-[#0A0910]/50 border border-white/[0.08] rounded-xl text-[15px] text-white focus:outline-none focus:border-primary transition-all appearance-none"
                    >
                      <option value="low">Low - When you have time</option>
                      <option value="medium">Medium - Within a week</option>
                      <option value="high">High - Next couple of days</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-slate-300 mb-2">Target Deadline</label>
                    <input
                      type="date"
                      value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                      className="w-full px-5 py-4 bg-[#0A0910]/50 border border-white/[0.08] rounded-xl text-[15px] text-white focus:outline-none focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#0A0910]/50 rounded-xl border border-white/[0.08]">
                  <div>
                    <h4 className="text-white font-bold text-sm">Public Review</h4>
                    <p className="text-slate-400 text-xs">Allow this review to be shown on your profile.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={form.isPublic} onChange={e => setForm(f => ({ ...f, isPublic: e.target.checked }))} className="sr-only peer" />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </form>
            )}
          </div>

          <div className="p-6 border-t border-white/[0.08] flex justify-end gap-3 shrink-0">
            <button onClick={onClose} className="px-5 py-2.5 text-slate-400 hover:text-white rounded-xl text-[14px] font-bold transition-colors">
              Cancel
            </button>
            {step === 1 ? (
              <button 
                onClick={() => setStep(2)} 
                disabled={!selectedExpert}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-[14px] font-bold transition-all disabled:opacity-50"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button 
                form="request-review-form" type="submit" disabled={loading} 
                className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-[14px] font-bold transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" /> {loading ? 'Sending Request...' : 'Send Request'}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
