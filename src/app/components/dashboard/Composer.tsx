import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Code, ImageIcon, Lock } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { usePostUpdate } from "../../hooks/usePostUpdate";
import type { Room, Profile } from "../../types";

interface ComposerProps {
  user: { id: string; email?: string } | null;
  profile: Profile | null;
  myRooms: Room[];
  selectedRoomId: string;
  setSelectedRoomId: (id: string) => void;
  avatarUrl: string;
}

export function Composer({
  user,
  profile,
  myRooms,
  selectedRoomId,
  setSelectedRoomId,
  avatarUrl,
}: ComposerProps) {
  const { withVerification } = useAuth();
  const [updateContent, setUpdateContent] = useState("");
  const [codeSnippet, setCodeSnippet] = useState("");
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isPostingRef = useRef(false);
  const postMutation = usePostUpdate();
  const posting = postMutation.isPending;

  const handlePostUpdate = async () => {
    withVerification(async () => {
      if (isPostingRef.current) return;
      if ((!updateContent.trim() && !codeSnippet.trim() && !mediaPreview) || !selectedRoomId || !user) return;
      
      isPostingRef.current = true;
      try {
        await postMutation.mutateAsync({
          selectedRoomId,
          updateContent,
          codeSnippet,
          mediaPreview,
          userId: user.id,
          authorName: profile?.name || user.email?.split('@')[0] || 'Builder'
        });
        
        setUpdateContent("");
        setCodeSnippet("");
        setMediaPreview(null);
        setShowCodeInput(false);
      } finally {
        isPostingRef.current = false;
      }
    });
  };

  if (profile?.role !== 'builder') return null;

  return (
    <div className="hidden sm:flex bg-white border border-slate-200 shadow-sm rounded-[16px] p-3 sm:p-5 gap-3 sm:gap-4 items-start mb-6">
      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover scale-110" />
      </div>
      <div className="flex-1 min-w-0">
        <textarea 
          value={updateContent}
          onChange={(e) => setUpdateContent(e.target.value)}
          placeholder="What are you building right now?"
          aria-label="New update content"
          className="w-full bg-transparent border-none outline-none text-slate-900 text-[16px] sm:text-[14px] resize-none placeholder:text-slate-400 min-h-[50px] sm:min-h-[60px] disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-primary-400 rounded-md p-1"
        />

        {mediaPreview && (
          <div className="relative w-fit mb-4 group/preview mt-3">
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
              <img src={mediaPreview} alt="Upload preview" className="max-h-[200px] object-cover" />
            </div>
            <button
              type="button"
              onClick={() => setMediaPreview(null)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 hover:bg-rose-600 rounded-full flex items-center justify-center text-white opacity-0 group-hover/preview:opacity-100 transition-all shadow-lg focus-ring"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
        {showCodeInput && (
          <textarea
            value={codeSnippet}
            onChange={e => setCodeSnippet(e.target.value)}
            placeholder="Paste your code snippet here..."
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-[16px] sm:text-[14px] font-mono resize-none placeholder:text-slate-400 min-h-[100px] rounded-lg p-3 mt-3 focus-ring"
          />
        )}

        <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-2">
          <div className="flex items-center gap-1 sm:gap-2">
            {myRooms && myRooms.length > 0 ? (
              <>
                <label className="flex items-center justify-center w-8 h-8 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded-full cursor-pointer transition-all focus-ring">
                  <ImageIcon className="w-[18px] h-[18px]" />
                  <span className="hidden sm:inline sm:ml-1.5 text-[13px] font-semibold">Media</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setMediaPreview(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>

                <button
                  type="button"
                  onClick={() => setShowCodeInput(!showCodeInput)}
                  className={`flex items-center justify-center w-8 h-8 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 hover:bg-slate-100 rounded-full transition-all focus-ring ${showCodeInput ? 'text-primary-400 bg-primary-400/10' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  <Code className="w-[18px] h-[18px]" />
                  <span className="hidden sm:inline sm:ml-1.5 text-[13px] font-semibold">Code</span>
                </button>

                <div className="w-px h-5 bg-slate-200 mx-1 sm:mx-2"></div>

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
                          className="absolute left-0 bottom-full mb-2 min-w-[180px] w-max max-w-[280px] bg-white border border-slate-200 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.1)] p-1 z-50 overflow-hidden"
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
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
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
              <span className="text-slate-500 text-[12px] font-medium">Create a room first</span>
            )}
          </div>

          <button 
            onClick={handlePostUpdate}
            disabled={posting || (!updateContent.trim() && !codeSnippet.trim() && !mediaPreview) || !selectedRoomId}
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
