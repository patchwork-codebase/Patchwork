import { useAuth, supabase } from "../auth/AuthContext";
import { useAllGithubDrafts } from "../../hooks/useGithub";
import { Github, FileText, ArrowRight, Check } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { motion } from "motion/react";
import { timeAgo } from "../../utils/helpers";

export function PendingDraftsList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: drafts, isLoading } = useAllGithubDrafts(user?.id);

  if (isLoading || !drafts || drafts.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 mb-8">
      <div className="flex justify-between items-center mb-1 px-1">
        <div>
          <h2 className="font-extrabold text-[20px] sm:text-[24px] text-white m-0 font-display tracking-tight flex items-center gap-2">
            Pending updates to post
            <span className="bg-amber-500 text-white text-[12px] px-2 py-0.5 rounded-full">{drafts.length}</span>
          </h2>
          <p className="text-[11px] text-slate-400 font-mono font-medium mt-0.5">Drafts synced from GitHub</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {drafts.slice(0, 3).map((draft, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            key={draft.id}
          >
            <div
              onClick={() => navigate(`/dashboard/room/${draft.room_id}?tab=drafts`)}
              className="block bg-[#1a1a1a] border border-white/10 hover:bg-[#222222] hover:border-white/20 rounded-[20px] p-4 sm:p-5 active:scale-95 transition-all cursor-pointer shadow-sm relative overflow-hidden group"
            >
              <div className="flex items-start gap-4 w-full">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-sm text-white mt-0.5 group-hover:scale-105 transition-transform">
                  <Github className="w-5 h-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <p className="text-[14px] sm:text-[15px] font-extrabold text-white leading-snug line-clamp-1 group-hover:underline">
                      {draft.commit_title}
                    </p>
                    <span className="shrink-0 text-[10px] font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-500/30 font-mono">
                      Draft
                    </span>
                  </div>
                  
                  <div className="text-[13px] text-slate-400 line-clamp-1 mb-2 font-medium">
                    {draft.commit_message || "No description provided."}
                  </div>
                  
                  <div className="flex items-center gap-2 text-[11px] sm:text-[12px] text-slate-400 font-mono font-medium">
                    <span className="text-slate-300 font-bold max-w-[120px] truncate">{draft.rooms?.title || 'Unknown Room'}</span>
                    <span className="text-slate-300">·</span>
                    <span>{timeAgo(draft.created_at)}</span>
                  </div>
                </div>
                
                <div className="shrink-0 self-center">
                  <button className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[12px] font-bold transition-colors">
                    Review <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        {drafts.length > 3 && (
          <Link
            to="/dashboard/drafts"
            className="text-center py-2 text-[13px] font-bold text-primary-400 hover:text-primary-500 transition-colors"
          >
            View all {drafts.length} pending updates
          </Link>
        )}
      </div>
    </div>
  );
}
