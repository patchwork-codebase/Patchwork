import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Image as ImageIcon, ChevronDown, Code, BarChart2, Plus, Trash2, Lightbulb, Zap, AlertTriangle, Rocket, HelpCircle } from "lucide-react";
import { usePostUpdate } from "../../hooks/usePostUpdate";
import { useAuth } from "../auth/AuthContext";
import type { Room } from "../../types";

interface ComposerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  myRooms: Room[];
  selectedRoomId: string;
  setSelectedRoomId: (id: string) => void;
}

const UPDATE_TYPES = [
  { key: 'insight', label: 'Insight', icon: Lightbulb, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/30' },
  { key: 'decision', label: 'Decision', icon: Zap, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/30' },
  { key: 'blocker', label: 'Blocker', icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-500/10 border-rose-500/30' },
  { key: 'shipped', label: 'Shipped', icon: Rocket, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  { key: 'open_question', label: 'Question', icon: HelpCircle, color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/30' },
];

export function ComposerSheet({ isOpen, onClose, myRooms, selectedRoomId, setSelectedRoomId }: ComposerSheetProps) {
  const { user, profile, withVerification } = useAuth();
  const [updateContent, setUpdateContent] = useState("");
  const [selectedUpdateType, setSelectedUpdateType] = useState("insight");
  const [codeSnippet, setCodeSnippet] = useState("");
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [pollDurationDays, setPollDurationDays] = useState(3);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const isPostingRef = useRef(false);

  const postMutation = usePostUpdate();
  const posting = postMutation.isPending;

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const remainingSlots = 4 - mediaPreviews.length;
    if (remainingSlots <= 0) return;

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    filesToProcess.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setMediaPreviews(prev => [...prev, reader.result as string].slice(0, 4));
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handlePost = async () => {
    withVerification(async () => {
      if (isPostingRef.current) return;
      const hasPoll = showPollCreator && pollQuestion.trim().length > 0 && pollOptions.filter(o => o.trim().length > 0).length >= 2;
      if ((!updateContent.trim() && !codeSnippet.trim() && mediaPreviews.length === 0 && !hasPoll) || !selectedRoomId || !user) return;
      
      isPostingRef.current = true;
      try {
        await postMutation.mutateAsync({
          selectedRoomId,
          updateContent,
          updateType: selectedUpdateType,
          codeSnippet: showCodeInput ? codeSnippet : "",
          mediaPreview: mediaPreviews[0] || null,
          mediaPreviews,
          pollData: hasPoll ? {
            question: pollQuestion.trim(),
            options: pollOptions.filter(o => o.trim().length > 0),
            durationDays: pollDurationDays,
          } : null,
          userId: user.id,
          authorName: profile?.name || user.email?.split('@')[0] || 'Builder'
        });
        
        setUpdateContent("");
        setCodeSnippet("");
        setShowCodeInput(false);
        setMediaPreviews([]);
        setShowPollCreator(false);
        setPollQuestion("");
        setPollOptions(["", ""]);
        onClose();
      } finally {
        isPostingRef.current = false;
      }
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm sm:hidden flex flex-col justify-end"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="bg-white dark:bg-[#111111] border-t border-slate-100 dark:border-white/10 rounded-t-3xl p-5 sm:p-6 pb-[env(safe-area-inset-bottom)] max-h-[85vh] overflow-y-auto shadow-sm dark:shadow-none"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[18px] font-bold text-slate-900 dark:text-white">Post an Update</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Category / Update Type Selector */}
            <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1 scrollbar-none">
              {UPDATE_TYPES.map(t => {
                const Icon = t.icon;
                const isSelected = selectedUpdateType === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setSelectedUpdateType(t.key)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shrink-0 transition-all ${
                      isSelected 
                        ? `${t.bg} ${t.color} font-bold shadow-xs` 
                        : 'border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            <textarea 
              value={updateContent}
              onChange={(e) => setUpdateContent(e.target.value)}
              placeholder="What did you build today? Share an insight, blocker, or poll..."
              className="w-full bg-transparent border border-slate-100 dark:border-white/10 text-slate-900 dark:text-white text-[16px] sm:text-[15px] resize-none placeholder:text-slate-500 min-h-[90px] focus-visible:ring-1 focus-visible:ring-primary-400 rounded-xl p-3.5 mb-3 shadow-sm"
            />

            {/* Media previews */}
            {mediaPreviews.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-3">
                {mediaPreviews.map((preview, idx) => (
                  <div key={idx} className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 aspect-video bg-slate-100 dark:bg-white/5">
                    <img loading="lazy" src={preview} alt="Upload preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setMediaPreviews(prev => prev.filter((_, i) => i !== idx))}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {showCodeInput && (
              <textarea
                value={codeSnippet}
                onChange={(e) => setCodeSnippet(e.target.value)}
                placeholder="Paste code snippet here..."
                rows={4}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1a1a1a] border border-slate-100 dark:border-white/10 rounded-xl text-[13px] font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-400/50 resize-none mb-3 transition-all"
              />
            )}

            {/* Poll creator */}
            {showPollCreator && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#161616] border border-slate-200 dark:border-white/10 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <BarChart2 className="w-3.5 h-3.5 text-primary-400" />
                    Poll Question
                  </span>
                  <button type="button" onClick={() => setShowPollCreator(false)} className="text-slate-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <input
                  type="text"
                  value={pollQuestion}
                  onChange={e => setPollQuestion(e.target.value)}
                  placeholder="Ask a question..."
                  className="w-full bg-white dark:bg-[#202020] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-500 mb-2 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                <div className="space-y-1.5">
                  {pollOptions.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={opt}
                        onChange={e => {
                          const updated = [...pollOptions];
                          updated[i] = e.target.value;
                          setPollOptions(updated);
                        }}
                        placeholder={`Option ${i + 1}`}
                        className="flex-1 bg-white dark:bg-[#202020] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                      {pollOptions.length > 2 && (
                        <button type="button" onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))} className="text-slate-400">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-200/60 dark:border-white/10">
                  {pollOptions.length < 4 ? (
                    <button
                      type="button"
                      onClick={() => setPollOptions([...pollOptions, ''])}
                      className="text-xs font-semibold text-primary-400 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add option
                    </button>
                  ) : <div />}
                  <select
                    value={pollDurationDays}
                    onChange={e => setPollDurationDays(Number(e.target.value))}
                    className="bg-transparent text-slate-600 dark:text-slate-300 text-xs font-semibold focus:outline-none"
                  >
                    <option value={1}>1 day</option>
                    <option value={3}>3 days</option>
                    <option value={7}>7 days</option>
                  </select>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-slate-100 dark:border-white/10 pt-4">
              <div className="flex items-center gap-2">
                <label className={`flex items-center justify-center w-10 h-10 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 rounded-full cursor-pointer transition-all ${mediaPreviews.length >= 4 ? 'opacity-40 pointer-events-none' : ''}`}>
                  <ImageIcon className="w-5 h-5" />
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleMediaUpload}
                  />
                </label>

                <button
                  type="button"
                  onClick={() => setShowCodeInput(!showCodeInput)}
                  className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                    showCodeInput ? 'bg-primary-400/20 text-primary-400' : 'bg-slate-100 dark:bg-white/5 text-slate-400'
                  }`}
                >
                  <Code className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowPollCreator(!showPollCreator)}
                  className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                    showPollCreator ? 'bg-primary-400/20 text-primary-400' : 'bg-slate-100 dark:bg-white/5 text-slate-400'
                  }`}
                >
                  <BarChart2 className="w-5 h-5" />
                </button>
                
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-1.5 bg-primary-400/10 text-primary-400 text-[12px] font-bold rounded-full px-3 py-2 transition-all max-w-[130px]"
                  >
                    <span className="truncate">{myRooms.find(r => r.id === selectedRoomId)?.title || "Select room"}</span>
                    <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                  </button>

                  <AnimatePresence>
                    {dropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 4, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 4, scale: 0.95 }}
                          className="absolute left-0 bottom-full mb-2 min-w-[200px] w-max bg-slate-50 dark:bg-[#1a1a1a] border border-slate-100 dark:border-white/10 rounded-xl shadow-xl p-1 z-50 overflow-hidden"
                        >
                          {myRooms.map(r => (
                            <button
                              key={r.id}
                              type="button"
                              onClick={() => {
                                setSelectedRoomId(r.id);
                                setDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3.5 py-2.5 rounded-lg text-[13px] font-semibold ${
                                selectedRoomId === r.id ? 'bg-primary-400/20 text-primary-400' : 'text-slate-400 hover:bg-white/5'
                              }`}
                            >
                              {r.title}
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <button
                onClick={handlePost}
                disabled={posting || (!updateContent.trim() && !codeSnippet.trim() && mediaPreviews.length === 0 && (!showPollCreator || !pollQuestion.trim())) || !selectedRoomId}
                className="bg-primary-400 hover:bg-[#7b6ce8] disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-full text-[14px] transition-all"
              >
                {posting ? "Posting..." : "Post"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
