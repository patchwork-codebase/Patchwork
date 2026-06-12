import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, FileText, Search, X } from "lucide-react";
import { supabase } from "../auth/AuthContext";
import { toast } from "sonner";
import { useNotionAccount } from "../../hooks/useNotion";

interface LinkDocModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  userId: string;
}

export function LinkDocModal({ isOpen, onClose, roomId, userId }: LinkDocModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const { data: notionAccount } = useNotionAccount(userId);

  useEffect(() => {
    if (!isOpen || !notionAccount) return;
    
    const fetchDocs = async () => {
      setIsSearching(true);
      try {
        // Wait, edge function is deployed now?
        const { data, error } = await supabase.functions.invoke('notion-search', { body: { query: searchQuery }});
        
        if (error) {
          throw error;
        }

        setSearchResults(data?.data || []);
      } catch (err) {
        console.error("Failed to search Notion:", err);
        setIsSearching(false);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchDocs();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [isOpen, searchQuery, notionAccount]);

  const handleLinkDoc = async (doc: any) => {
    try {
      const { error } = await supabase.from('room_notion_docs').insert({
        room_id: roomId,
        page_id: doc.id,
        title: doc.title,
        url: doc.url,
        added_by: userId
      });
      
      if (error) throw error;
      toast.success("Document linked successfully!");
      onClose();
    } catch (err: any) {
      toast.error(`Failed to link doc: ${err.message}`);
    }
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-[#0D0B14] border border-white/[0.08] rounded-3xl w-full max-w-[500px] overflow-hidden relative z-10 shadow-2xl"
          >
            <div className="flex items-center justify-between p-5 border-b border-white/[0.08]">
              <h2 className="text-[18px] font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#8B7CF8]" />
                Link Notion Document
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {!notionAccount ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-6 h-6 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Notion Not Connected</h3>
                  <p className="text-[13px] text-slate-400 mb-6">
                    Connect your Notion workspace in profile settings to browse and link live documents.
                  </p>
                  <button onClick={onClose} className="px-5 py-2.5 bg-[#8B7CF8] hover:bg-[#7a6ce0] text-white text-[13px] font-bold rounded-xl transition-colors">
                    Go to Integrations
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search Notion pages..."
                      className="w-full bg-[#1A1820] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-[13px] text-white placeholder-slate-500 focus:outline-none focus:border-[#8B7CF8] transition-colors"
                    />
                  </div>

                  <div className="max-h-[300px] overflow-y-auto space-y-2 mt-4">
                    {isSearching ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 text-[#8B7CF8] animate-spin" />
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="text-center text-slate-500 text-[13px] py-8">No documents found.</div>
                    ) : (
                      searchResults.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] rounded-xl transition-colors group">
                          <div className="flex items-center gap-3">
                            <FileText className="w-4 h-4 text-slate-400" />
                            <span className="text-[13px] font-semibold text-white">{doc.title}</span>
                          </div>
                          <button
                            onClick={() => handleLinkDoc(doc)}
                            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-[12px] font-bold rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          >
                            Link
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
}
