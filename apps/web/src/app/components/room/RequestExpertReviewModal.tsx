import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ChevronRight, ChevronLeft, Send, Search } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { supabase } from "../auth/AuthContext";
import { UserAvatar } from "../ui/UserAvatar";
import ExpertCard, { ExpertProfile } from "./ExpertCard";
import { useUserRooms } from "../../hooks/useRooms";

interface RequestExpertReviewModalProps {
  open: boolean;
  onClose: () => void;
  roomId?: string;
  initialExpert?: ExpertProfile | null;
}

export function RequestExpertReviewModal({ open, onClose, roomId, initialExpert }: RequestExpertReviewModalProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(initialExpert ? 2 : 1);
  const [selectedExpert, setSelectedExpert] = useState<ExpertProfile | null>(initialExpert || null);
  const [selectedRoomId, setSelectedRoomId] = useState<string>(roomId || "");
  const [domainFilter, setDomainFilter] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  const { data: userRoomsData } = useUserRooms(userId || undefined);
  const userRooms = userRoomsData?.pages?.flat() || [];
  
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

  // Fetch real experts
  const [experts, setExperts] = useState<ExpertProfile[]>([]);
  const [loadingExperts, setLoadingExperts] = useState(true);

  useEffect(() => {
    async function loadExperts() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setUserId(user.id);

        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('is_verified_expert', true);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          const mappedExperts: ExpertProfile[] = data.map(user => ({
            id: user.id,
            name: user.name || "Anonymous Expert",
            avatar: user.avatar || "",
            title: user.job_title || user.expert_level || "Verified Expert",
            company: user.company || "",
            domains: user.expert_domains || ["General"],
            reviewsCompleted: user.expert_reviews_completed || 0,
            rating: user.expert_review_score ? parseFloat(user.expert_review_score) : 5.0,
            activeSlots: user.expert_open_slots !== undefined ? user.expert_open_slots : 3,
            monthlySlots: 10,
            typicalResponseTime: user.expert_avg_response_hours ? `${user.expert_avg_response_hours}h` : "24h"
          }));
          setExperts(mappedExperts);
        } else {
          setExperts([]);
        }
      } catch (err) {
        console.error("Failed to load experts", err);
        setExperts([]); // Fallback on failure
      } finally {
        setLoadingExperts(false);
      }
    }
    
    if (open) {
      loadExperts();
    }
  }, [open]);

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

  const filteredExperts = experts.filter(exp => 
    domainFilter ? exp.domains.some(d => d.toLowerCase().includes(domainFilter.toLowerCase())) : true
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedExpert) return;
    if (!selectedRoomId) {
      toast.error("Please select a room for this review.");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Insert into expert_review_requests
      const { error } = await supabase.from('expert_review_requests').insert({
        builder_id: user.id,
        expert_id: selectedExpert.id,
        room_id: selectedRoomId,
        build_summary: form.buildSummary,
        specific_challenge: form.specificChallenge,
        questions: form.questions,
        priority: form.priority,
        is_public: form.isPublic,
        deadline: form.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending'
      });

      if (error) throw error;

      toast.success("Review request sent successfully!");
      onClose();
      
      // Navigate to the room that they requested the review for
      navigate(`/dashboard/room/${selectedRoomId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(`Failed to send request: ${message}`);
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
          className="fixed inset-0 bg-ink/80 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white border border-slate-100 rounded-[24px] w-full max-w-[550px] relative z-10 my-auto flex flex-col max-h-[90vh] shadow-sm dark:shadow-none"
        >
          <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              {step === 2 && (
                <button type="button" onClick={() => setStep(1)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <h2 className="text-xl font-bold text-slate-900">
                {step === 1 ? "Select an Expert" : "Request Details"}
              </h2>
            </div>
            <button type="button" onClick={onClose} className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar">
            {step === 1 ? (
              <div className="space-y-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 dark:text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by domain (e.g., UX Design, React, Growth)..."
                    value={domainFilter}
                    onChange={(e) => setDomainFilter(e.target.value)}
                    className="w-full pl-12 pr-5 py-4 bg-white border border-slate-100 rounded-xl text-[15px] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all shadow-sm dark:shadow-none"
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
                    <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400">
                      No experts found matching "{domainFilter}"
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <form id="request-review-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 mb-5 shadow-sm dark:shadow-none">
                  <UserAvatar userId={selectedExpert?.id || ''} name={selectedExpert?.name || ''} avatarUrl={selectedExpert?.avatar} className="w-10 h-10 rounded-full border border-slate-100 object-cover" />
                  <div>
                    <h4 className="text-slate-900 font-bold text-[15px]">{selectedExpert?.name}</h4>
                    <p className="text-slate-500 text-[13px] font-medium">Reviewing your build</p>
                  </div>
                </div>

                {!roomId && (
                  <div>
                    <label className="block text-[13px] font-bold text-slate-700 mb-2">Select a Room</label>
                    <select
                      required
                      value={selectedRoomId}
                      onChange={e => setSelectedRoomId(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl text-[15px] text-slate-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer shadow-sm dark:shadow-none"
                    >
                      <option value="" disabled className="text-slate-500 dark:text-slate-400">Choose the room you want reviewed...</option>
                      {userRooms?.map(room => (
                        <option key={room.id} value={room.id}>
                          {room.title || "Untitled Room"}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-2">Build Summary</label>
                  <textarea
                    required rows={2}
                    value={form.buildSummary} onChange={e => setForm(f => ({ ...f, buildSummary: e.target.value }))}
                    placeholder="Briefly describe what you've built..."
                    className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl text-[15px] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none shadow-sm dark:shadow-none"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-2">Specific Challenge</label>
                  <textarea
                    required rows={2}
                    value={form.specificChallenge} onChange={e => setForm(f => ({ ...f, specificChallenge: e.target.value }))}
                    placeholder="What specific area do you need help with?"
                    className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl text-[15px] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none shadow-sm dark:shadow-none"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-2">Questions for Expert</label>
                  <textarea
                    required rows={3}
                    value={form.questions} onChange={e => setForm(f => ({ ...f, questions: e.target.value }))}
                    placeholder="1. Is the UX intuitive?\n2. What would you do differently?"
                    className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl text-[15px] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none shadow-sm dark:shadow-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-bold text-slate-700 mb-2">Priority</label>
                    <select
                      value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                      className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl text-[15px] text-slate-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer shadow-sm dark:shadow-none"
                    >
                      <option value="low">Low - When you have time</option>
                      <option value="medium">Medium - Within a week</option>
                      <option value="high">High - Next couple of days</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-slate-700 mb-2">Target Deadline</label>
                    <input
                      type="date"
                      value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                      className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl text-[15px] text-slate-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm dark:shadow-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-4 p-5 bg-slate-50 border border-slate-100 rounded-xl mt-2 shadow-sm dark:shadow-none">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-[14px] font-bold text-slate-900">Make request public</h4>
                      <p className="text-slate-500 text-[13px] font-medium mt-0.5">Allow other builders to learn from this review on your profile.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, isPublic: !f.isPublic }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isPublic ? 'bg-primary-500' : 'bg-slate-300'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.isPublic ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>

          <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0 bg-slate-50/50 rounded-b-[24px] shadow-sm dark:shadow-none">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            
            {step === 1 ? (
              <button 
                onClick={() => setStep(2)} 
                disabled={!selectedExpert}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                form="request-review-form"
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {loading ? 'Sending...' : 'Send Request'}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
