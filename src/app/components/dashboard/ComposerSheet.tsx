import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Image as ImageIcon, ChevronDown, Code } from "lucide-react";
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

export function ComposerSheet({ isOpen, onClose, myRooms, selectedRoomId, setSelectedRoomId }: ComposerSheetProps) {
  const { user, profile, withVerification } = useAuth();
  const [updateContent, setUpdateContent] = useState("");
  const [codeSnippet, setCodeSnippet] = useState("");
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const isPostingRef = useRef(false);

  const postMutation = usePostUpdate();
  const posting = postMutation.isPending;

  const handlePost = async () => {
    withVerification(async () => {
      if (isPostingRef.current) return;
      if ((!updateContent.trim() && !codeSnippet.trim() && !mediaPreview) || !selectedRoomId || !user) return;
      
      isPostingRef.current = true;
      try {
        await postMutation.mutateAsync({
          selectedRoomId,
          updateContent,
          codeSnippet: showCodeInput ? codeSnippet : "",
          mediaPreview,
          userId: user.id,
          authorName: profile?.name || user.email?.split('@')[0] || 'Builder'
        });
        
        setUpdateContent("");
        setCodeSnippet("");
        setShowCodeInput(false);
        setMediaPreview(null);
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
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm sm:hidden flex flex-col justify-end"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="bg-white border-t border-slate-200 rounded-t-3xl p-5 sm:p-6 pb-[env(safe-area-inset-bottom)] max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[18px] font-bold text-slate-900">Post an Update</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <textarea 
              value={updateContent}
              onChange={(e) => setUpdateContent(e.target.value)}
              placeholder="What feature did you ship today? Or what product decision did you make?"
              className="w-full bg-white border border-slate-200 text-slate-900 text-[16px] sm:text-[15px] resize-none placeholder:text-slate-400 min-h-[100px] focus-visible:ring-2 focus-visible:ring-primary-400 rounded-xl p-4 mb-4 shadow-sm"
            />

            {mediaPreview && (
              <div className="relative w-[120px] mb-4 group mt-1">
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 relative aspect-video flex items-center justify-center">
                  <img src={mediaPreview} alt="Upload preview" className="max-h-[120px] w-full h-full object-cover rounded-xl" />
                  <button
                    type="button"
                    onClick={() => setMediaPreview(null)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {showCodeInput && (
              <textarea
                value={codeSnippet}
                onChange={(e) => setCodeSnippet(e.target.value)}
                placeholder="Paste code snippet here..."
                rows={5}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-mono text-slate-800 focus:outline-none focus:border-primary-400/50 focus:ring-1 focus:ring-primary-400/50 resize-none mb-4 transition-all"
              />
            )}

            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <div className="flex items-center gap-3">
                <label className="flex items-center justify-center w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full cursor-pointer transition-all">
                  <ImageIcon className="w-5 h-5" />
                  <input
                    type="file" accept="image/*" className="hidden"
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
                  className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                    showCodeInput ? 'bg-primary-400/20 text-primary-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  <Code className="w-5 h-5" />
                </button>
                
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-1.5 bg-primary-400/10 text-primary-400 text-[13px] font-bold rounded-full px-4 py-2 transition-all max-w-[150px]"
                  >
                    <span className="truncate">{myRooms.find(r => r.id === selectedRoomId)?.title || "Select room"}</span>
                    <ChevronDown className="w-4 h-4 shrink-0" />
                  </button>

                  <AnimatePresence>
                    {dropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 4, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 4, scale: 0.95 }}
                          className="absolute left-0 bottom-full mb-2 min-w-[200px] w-max bg-white border border-slate-200 rounded-xl shadow-xl p-1 z-50 overflow-hidden"
                        >
                          {myRooms.map(r => (
                            <button
                              key={r.id} type="button"
                              onClick={() => {
                                setSelectedRoomId(r.id);
                                setDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3.5 py-2.5 rounded-lg text-[13px] font-semibold ${
                                selectedRoomId === r.id ? 'bg-primary-400/20 text-primary-400' : 'text-slate-600 hover:bg-slate-50'
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
                disabled={posting || (!updateContent.trim() && !codeSnippet.trim() && !mediaPreview) || !selectedRoomId}
                className="bg-primary-400 hover:bg-[#7b6ce8] disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-full font-bold text-[14px] transition-colors active:scale-95"
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
