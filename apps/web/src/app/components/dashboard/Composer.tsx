import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Code, ImageIcon, Lock, Smile, BarChart2, Plus, Trash2, Zap, Lightbulb, AlertTriangle, Rocket, HelpCircle } from "lucide-react";
import { Suspense, lazy } from 'react';
const EmojiPicker = lazy(() => import('emoji-picker-react'));
import { useAuth } from "../auth/AuthContext";
import { usePostUpdate } from "../../hooks/usePostUpdate";
import type { Room, Profile } from "../../types";
import { UserAvatar } from "../ui/UserAvatar";

interface ComposerProps {
  user: { id: string; email?: string } | null;
  profile: Profile | null;
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

export function Composer({
  user,
  profile,
  myRooms,
  selectedRoomId,
  setSelectedRoomId,
}: ComposerProps) {
  const { withVerification } = useAuth();
  const [updateContent, setUpdateContent] = useState("");
  const [selectedUpdateType, setSelectedUpdateType] = useState("insight");
  const [codeSnippet, setCodeSnippet] = useState("");
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [pollDurationDays, setPollDurationDays] = useState(3);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

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

  const removeMedia = (index: number) => {
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handlePostUpdate = async () => {
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
          codeSnippet,
          mediaPreview: mediaPreviews[0] || null,
          mediaPreviews,
          pollData: hasPoll ? {
            question: pollQuestion.trim(),
            options: pollOptions.filter(o => o.trim().length > 0),
            durationDays: pollDurationDays
          } : null,
          userId: user.id,
          authorName: profile?.name || user.email?.split('@')[0] || 'Builder'
        });
        
        setUpdateContent("");
        setCodeSnippet("");
        setMediaPreviews([]);
        setShowCodeInput(false);
        setShowPollCreator(false);
        setPollQuestion("");
        setPollOptions(["", ""]);
      } finally {
        isPostingRef.current = false;
      }
    });
  };

  if (profile?.role !== 'builder') return null;

  return (
    <div className="hidden sm:flex bg-white/80 dark:bg-[#111111]/80 backdrop-blur-md border border-slate-100 dark:border-white/10 shadow-sm rounded-[24px] p-3 sm:p-5 gap-3 sm:gap-4 items-start mb-6 transition-all duration-300 focus-within:shadow-xl focus-within:-translate-y-0.5 focus-within:bg-white dark:focus-within:bg-[#141414] relative">
      <div className="w-10 h-10 rounded-[12px] bg-slate-100 dark:bg-white/5 border border-slate-100 dark:border-white/10 overflow-hidden shrink-0 mt-1 shadow-sm dark:shadow-none">
        <UserAvatar 
          userId={user?.id || ''} 
          name={profile?.name || user?.email} 
          avatarUrl={profile?.avatar || profile?.avatarUrl || profile?.avatar_url}
          className="w-full h-full object-cover scale-110" 
        />
      </div>

      <div className="flex-1 min-w-0">
        {/* Category / Update Type Selector Pill Strip */}
        <div className="flex items-center gap-1.5 mb-2.5 overflow-x-auto pb-1 scrollbar-none">
          {UPDATE_TYPES.map(t => {
            const Icon = t.icon;
            const isSelected = selectedUpdateType === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setSelectedUpdateType(t.key)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                  isSelected 
                    ? `${t.bg} ${t.color} font-bold shadow-xs scale-102` 
                    : 'border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/20'
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
          placeholder="What are you building right now? Share an insight, blocker, or ship..."
          aria-label="New update content"
          className="w-full bg-transparent border-none outline-none text-slate-900 dark:text-white text-[16px] sm:text-[14px] resize-none placeholder:text-slate-500 dark:text-slate-400 dark:placeholder:text-slate-500 min-h-[50px] sm:min-h-[60px] disabled:opacity-40 focus-visible:ring-0 rounded-md p-1 font-medium"
        />

        {/* Multi-Media Preview Grid (Up to 4 images) */}
        {mediaPreviews.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-3 mb-4 max-w-md">
            {mediaPreviews.map((preview, idx) => (
              <div key={idx} className="relative group/preview rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 aspect-video bg-slate-100 dark:bg-white/5">
                <img src={preview} alt="Upload preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeMedia(idx)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-rose-500 hover:bg-rose-600 rounded-full flex items-center justify-center text-white opacity-90 hover:opacity-100 transition-all shadow-md"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Code Input */}
        {showCodeInput && (
          <textarea
            value={codeSnippet}
            onChange={e => setCodeSnippet(e.target.value)}
            placeholder="Paste code or configuration here..."
            className="w-full bg-slate-50 dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-[13px] font-mono resize-none placeholder:text-slate-500 min-h-[90px] rounded-xl p-3 mt-3 focus:outline-none focus:ring-1 focus:ring-primary-500 shadow-sm dark:shadow-none"
          />
        )}

        {/* Interactive Poll Creator */}
        {showPollCreator && (
          <div className="mt-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-[#161616] border border-slate-200 dark:border-white/10 mb-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <BarChart2 className="w-3.5 h-3.5 text-primary-400" />
                Ask a Poll Question
              </span>
              <button 
                type="button" 
                onClick={() => setShowPollCreator(false)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              value={pollQuestion}
              onChange={e => setPollQuestion(e.target.value)}
              placeholder="e.g. Which architecture should we pick for real-time notifications?"
              className="w-full bg-white dark:bg-[#202020] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-500 mb-2.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            <div className="space-y-2">
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
                    <button
                      type="button"
                      onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))}
                      className="text-slate-400 hover:text-rose-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200/60 dark:border-white/10">
              {pollOptions.length < 4 ? (
                <button
                  type="button"
                  onClick={() => setPollOptions([...pollOptions, ''])}
                  className="text-xs font-semibold text-primary-400 hover:text-primary-300 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add option
                </button>
              ) : <div />}
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <span>Duration:</span>
                <select
                  value={pollDurationDays}
                  onChange={e => setPollDurationDays(Number(e.target.value))}
                  className="bg-transparent text-slate-700 dark:text-slate-300 text-xs font-semibold focus:outline-none"
                >
                  <option value={1}>1 day</option>
                  <option value={3}>3 days</option>
                  <option value={7}>7 days</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-100 dark:border-white/10 pt-3 mt-2">
          <div className="flex items-center gap-1 sm:gap-2">
            {myRooms && myRooms.length > 0 ? (
              <>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="flex items-center justify-center w-8 h-8 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white rounded-full transition-all focus-ring"
                  >
                    <Smile className="w-[18px] h-[18px]" />
                    <span className="hidden sm:inline sm:ml-1.5 text-[13px] font-semibold">Emoji</span>
                  </button>
                  <AnimatePresence>
                    {showEmojiPicker && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setShowEmojiPicker(false)} 
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute z-50 mt-2"
                        >
                          <Suspense fallback={<div className="w-[300px] h-[400px] flex items-center justify-center bg-white dark:bg-[#111111] rounded-xl shadow-lg border border-slate-100 dark:border-white/10"><div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full" /></div>}>
                            <EmojiPicker 
                              onEmojiClick={(emojiData) => {
                                setUpdateContent(prev => prev + emojiData.emoji);
                                setShowEmojiPicker(false);
                              }}
                            />
                          </Suspense>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                <label className={`flex items-center justify-center w-8 h-8 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white rounded-full cursor-pointer transition-all focus-ring ${mediaPreviews.length >= 4 ? 'opacity-40 pointer-events-none' : ''}`}>
                  <ImageIcon className="w-[18px] h-[18px]" />
                  <span className="hidden sm:inline sm:ml-1.5 text-[13px] font-semibold">
                    Media{mediaPreviews.length > 0 ? ` (${mediaPreviews.length}/4)` : ''}
                  </span>
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
                  className={`flex items-center justify-center w-8 h-8 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-all focus-ring ${showCodeInput ? 'text-primary-400 bg-primary-400/10' : 'text-slate-400 hover:text-white'}`}
                >
                  <Code className="w-[18px] h-[18px]" />
                  <span className="hidden sm:inline sm:ml-1.5 text-[13px] font-semibold">Code</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPollCreator(!showPollCreator)}
                  className={`flex items-center justify-center w-8 h-8 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-all focus-ring ${showPollCreator ? 'text-primary-400 bg-primary-400/10' : 'text-slate-400 hover:text-white'}`}
                >
                  <BarChart2 className="w-[18px] h-[18px]" />
                  <span className="hidden sm:inline sm:ml-1.5 text-[13px] font-semibold">Poll</span>
                </button>

                <div className="w-px h-5 bg-slate-200 dark:bg-white/10 mx-1 sm:mx-2"></div>

                <div className="relative inline-block text-left">
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-1.5 bg-primary-400/10 hover:bg-primary-400/20 text-primary-400 text-[12px] sm:text-[13px] font-bold rounded-full px-3 py-1.5 focus:outline-none cursor-pointer transition-all max-w-[130px] sm:max-w-[200px]"
                  >
                    <span className="truncate">{myRooms.find(r => r.id === selectedRoomId)?.title || "Select room"}</span>
                    <svg className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </button>

                  <AnimatePresence>
                    {dropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-40 cursor-default" 
                          onClick={() => setDropdownOpen(false)} 
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 4, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 4, scale: 0.95 }}
                          transition={{ duration: 0.12 }}
                          className="absolute left-0 bottom-full mb-2 min-w-[180px] w-max max-w-[280px] bg-white dark:bg-[#1a1a1a] border border-slate-100 dark:border-white/10 rounded-xl shadow-2xl p-1 z-50 overflow-hidden"
                        >
                          {myRooms.map(r => (
                            <button
                              key={r.id}
                              type="button"
                              onClick={() => {
                                setSelectedRoomId(r.id);
                                setDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3.5 py-2 rounded-lg text-[13px] font-semibold transition-all block ${
                                selectedRoomId === r.id
                                  ? 'bg-primary-400/10 text-primary-400'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
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
              </>
            ) : (
              <span className="text-slate-500 dark:text-slate-400 text-[12px] font-medium">Create a room first</span>
            )}
          </div>

          <button 
            onClick={handlePostUpdate}
            disabled={posting || (!updateContent.trim() && !codeSnippet.trim() && mediaPreviews.length === 0 && (!showPollCreator || !pollQuestion.trim())) || !selectedRoomId}
            className="bg-primary-400 hover:bg-[#7b6ce8] disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 sm:px-5 py-1.5 sm:py-2 rounded-full font-bold text-[13px] sm:text-[14px] transition-colors active:scale-95 focus-ring shrink-0 ml-2 flex items-center justify-center gap-1.5"
          >
            {(!profile || !profile.emailVerified) && <Lock className="w-3.5 h-3.5" />}
            {posting ? "Posting..." : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
}
