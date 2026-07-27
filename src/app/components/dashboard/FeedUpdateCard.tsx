import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import { CheckCircle, Trash2, Heart, MessageCircle, Share2, ImageIcon, Code, Send } from "lucide-react";
import { toast } from "sonner";
import { timeAgo } from "../../utils/helpers";
import { UserAvatar } from "../ui/UserAvatar";
import { ReadMoreText } from "../ui/ReadMoreText";
import { FigmaEmbed } from "../ui/FigmaEmbed";
import { VerifiedTick } from "../ui/VerifiedTick";
import { OrganizationBadge } from "../ui/OrganizationBadge";
import { SmartImage } from "../ui/SmartImage";
import { CodeSnippetBlock } from "../ui/CodeSnippetBlock";
import { ReplyComposer } from "./ReplyComposer";
import { ReactionGroup } from "./ReactionGroup";
import { ThreadedReply } from "./ThreadedReply";
import { DecisionMatrixBlock } from "../pow/DecisionMatrixBlock";
import { CodeDiffViewer } from "../pow/CodeDiffViewer";
import { MetricImpactBadge } from "../pow/MetricImpactBadge";
import { SocialProofCardModal } from "../pow/SocialProofCardModal";
import { supabase } from "../auth/AuthContext";
import type { Room, Profile } from "../../types";
import type { FeedUpdate } from "../../hooks/useFeedUpdates";

const UPDATE_TYPE_UI: Record<string, { label: string; color: string; icon: string }> = {
  decision: { label: 'Decision', color: 'bg-primary-500/10 text-primary-400 border-primary-500/20', icon: '⚡' },
  scrap: { label: 'Scrap', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20', icon: '🗑' },
  pivot: { label: 'Pivot', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20', icon: '🔄' },
  blocker: { label: 'Blocker', color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: '🚧' },
  insight: { label: 'Insight', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: '💡' },
  open_question: { label: 'Open question', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: '❓' },
  shipped: { label: 'Shipped', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: '🚀' },
  crossroad: { label: 'Crossroad', color: 'bg-primary-500/10 text-primary-400 border-primary-500/20', icon: '🔀' },
};
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";

const TAG_PALETTE: Record<string, { bg: string; color: string }> = {
  design: { bg: 'bg-primary-500/10', color: 'text-primary-400' },
  engineering: { bg: 'bg-emerald-500/10', color: 'text-emerald-400' },
  dev: { bg: 'bg-blue-500/10', color: 'text-blue-400' },
  product: { bg: 'bg-primary-500/10', color: 'text-primary-400' },
  research: { bg: 'bg-amber-500/10', color: 'text-amber-400' },
  writing: { bg: 'bg-pink-500/10', color: 'text-pink-400' },
};

function tagStyle(tag: string) {
  return TAG_PALETTE[tag.toLowerCase()] || { bg: 'bg-white/5', color: 'text-slate-400' };
}

interface FeedUpdateCardProps {
  update: FeedUpdate;
  fullRoom?: Room;
  rooms?: Room[];
  user: { id: string; email?: string } | null;
  profile: Profile | null;
  isFollowing: boolean;
  activeTab: 'overview' | 'feed' | 'mine';
  queryClient: any;
  handleFollowRoom: (roomId: string, e: React.MouseEvent) => void;
  handleUnfollowRoom: (roomId: string, e: React.MouseEvent) => void;
}

export const FeedUpdateCard = React.memo(function FeedUpdateCard({
  update,
  fullRoom,
  rooms,
  user,
  profile,
  isFollowing,
  activeTab,
  queryClient,
  handleFollowRoom,
  handleUnfollowRoom,
}: FeedUpdateCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isFullyExpanded, setIsFullyExpanded] = React.useState(false);
  const [isReplying, setIsReplying] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const toggleComments = () => setIsExpanded(prev => !prev);
  const handleReplyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsReplying(prev => !prev);
  };

  const handleDeleteUpdate = async (updateId: string) => {
    setIsDeleting(true);
    try {
      const { error, count } = await supabase.from('updates').delete({ count: 'exact' }).eq('id', updateId).eq('author_id', user!.id);
      if (error) throw error;
      if (count === 0) throw new Error("Update not found or you don't have permission to delete it.");

      toast.success("Update deleted");
      queryClient.invalidateQueries({ queryKey: ['feed-updates-v2'] });
    } catch (error: unknown) {
      toast.error((error instanceof Error ? error.message : String(error)) || "Failed to delete update");
      setIsDeleting(false); // only reset on fail, if success it unmounts
    }
  };
  const navigate = useNavigate();
  const tag = fullRoom?.tags?.[0] || update.rooms?.tags?.[0] || 'product';
  const tStyle = tagStyle(tag);
  const builderName = update.authorName;
  const timeString = timeAgo(update.createdAt);
  const roomTitle = fullRoom?.title || update.rooms?.title || 'Unknown Room';

  const allReactions = update.reactions || [];
  const replies = allReactions
    .filter((r: any) => r.type === 'reply')
    .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const emojiReactions = allReactions.filter((r: any) => r.type !== 'reply');

  const [showAllReplies, setShowAllReplies] = React.useState(false);
  const visibleReplies = showAllReplies ? replies : replies.slice(-1);

  const isLaunch = fullRoom?.updateCount === 1;

  return (
    <div
      onClick={toggleComments}
      className="w-full max-w-full bg-[#111111] border border-white/5 shadow-2xl rounded-[24px] mb-4 px-4 py-5 sm:p-6 sm:px-8 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 cursor-pointer relative overflow-hidden group focus-ring"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') toggleComments();
      }}
    >
      <div className="flex items-start gap-3 sm:gap-4 mb-3">
        <div
          onClick={(e) => {
            e.stopPropagation();
            if (update.authorId) navigate(`/dashboard/profile/${update.authorId}`);
          }}
          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center overflow-hidden shrink-0 ${isLaunch ? 'ring-2 ring-primary-500 shadow-[0_0_15px_rgba(139,124,248,0.3)]' : 'bg-[#1a1a1a] ring-1 ring-white/10'} cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all`}
        >
          <UserAvatar
            userId={update.authorId}
            name={builderName}
            avatarUrl={update.authorAvatar}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center">
          {/* Clean Header: Builder Name · Room Title */}
          <div className="flex items-center gap-1.5 min-w-0 flex-1 flex-wrap mb-1" onClick={(e) => e.stopPropagation()}>
            <span className="font-bold text-[15px] sm:text-[16px] text-white hover:underline cursor-pointer">
              {builderName}
            </span>
            {!update.authorOrgName && <VerifiedTick isVerified={!!update.authorIsVerifiedExpert} className="w-4 h-4 shrink-0" />}
            {update.authorOrgName && (
              <OrganizationBadge 
                orgName={update.authorOrgName} 
                orgLogo={update.authorOrgLogo} 
                isVerified={!!update.authorIsVerifiedExpert} 
              />
            )}
            <span className="text-slate-600 text-[14px]">·</span>
            <span 
              className="text-[13px] sm:text-[14px] text-slate-400 hover:underline cursor-pointer font-medium truncate max-w-[180px] sm:max-w-none"
              onClick={() => navigate(`/dashboard/room/${update.roomId}`)}
            >
              {roomTitle}
            </span>
            {isLaunch && (
              <span className="text-[10px] uppercase tracking-widest font-bold bg-primary-500/10 text-primary-500 px-2 py-0.5 rounded-full shrink-0">Launched</span>
            )}
          </div>

          <div className="mt-1 w-full max-w-full">
            {update.content && (
              update.content.includes("figma.com/") ? (
                <div className="my-3 rounded-[20px] overflow-hidden border border-white/10 shadow-sm bg-[#1a1a1a] relative group">
                  <div className="absolute top-3 left-3 bg-[#0a0a0a]/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[11px] font-bold text-slate-300 shadow-sm z-10 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Figma Design</span>
                  </div>
                  <FigmaEmbed content={update.content} />
                </div>
              ) : (
                <ReadMoreText
                  content={update.content}
                  className="text-[15px] sm:text-[16px] text-slate-300 leading-relaxed whitespace-pre-wrap break-words font-medium"
                />
              )
            )}

            {update.mediaUrl && (
              <div className="mt-3 rounded-[20px] w-full max-w-full overflow-hidden border border-white/10 bg-[#1a1a1a] relative group">
                <SmartImage src={update.mediaUrl} aspectRatio="video" objectFit="cover" alt="Update media" className="hover:scale-[1.02] transition-transform duration-500" />
              </div>
            )}

            {update.decisionMatrix && (
              <DecisionMatrixBlock data={update.decisionMatrix} />
            )}

            {update.diffData && (
              <CodeDiffViewer data={update.diffData} />
            )}

            {update.metricWin && (
              <MetricImpactBadge data={update.metricWin} />
            )}

            {update.codeSnippet && !update.diffData && (
              <div className="mt-3 rounded-[20px] overflow-hidden shadow-sm border border-white/10">
                <CodeSnippetBlock code={update.codeSnippet} />
              </div>
            )}
          </div>

          <div className="mt-4 flex items-end justify-between gap-3 flex-wrap">
            <ReactionGroup
              targetUpdate={update}
              onReplyClick={(e) => handleReplyClick(e)}
            />

            <div className="flex items-center gap-3 shrink-0 ml-auto pt-2">
              {update.updateType && update.updateType !== 'general' && UPDATE_TYPE_UI[update.updateType.toLowerCase()] && (
                <span className={`text-[11px] font-bold border ${UPDATE_TYPE_UI[update.updateType.toLowerCase()]?.color || 'bg-white/5 text-slate-300 border-white/10'} px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1.5 shadow-sm`}>
                  <span>{UPDATE_TYPE_UI[update.updateType.toLowerCase()]?.icon || '📌'}</span>
                  {UPDATE_TYPE_UI[update.updateType.toLowerCase()]?.label || update.updateType}
                </span>
              )}
              <span className="text-[12px] sm:text-[13px] text-slate-400 font-medium whitespace-nowrap">{timeString}</span>
              {update.authorId === user?.id && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      disabled={isDeleting}
                      className="text-slate-500 hover:text-rose-400 transition-colors p-1 rounded hover:bg-rose-500/10 relative z-20"
                      title="Delete update"
                    >
                      {isDeleting ? (
                        <span className="w-4 h-4 border-2 border-rose-400/30 border-t-rose-400 rounded-full animate-spin block" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent onClick={(e) => e.stopPropagation()} className="bg-[#111111] border border-white/10 sm:rounded-[24px] text-white">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-[20px] font-display font-bold">Delete update?</AlertDialogTitle>
                      <AlertDialogDescription className="text-slate-400">This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={(e) => { e.stopPropagation(); handleDeleteUpdate(update.id); }} className="bg-rose-500 text-white hover:bg-rose-600">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>

          <AnimatePresence>
            {isReplying && (
              <motion.div
                key="reply-composer"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 overflow-hidden"
              >
                <ReplyComposer
                  update={update}
                  user={user}
                  profile={profile}
                  queryClient={queryClient}
                  onCancel={() => setIsReplying(false)}
                  onSubmit={async (text) => {
                    const newReply = {
                      update_id: update.id,
                      observer_id: user!.id,
                      observer_name: profile?.name || user!.email?.split('@')[0] || 'Observer',
                      type: 'reply',
                      text: text,
                      created_at: new Date().toISOString(),
                    };
                    const { error } = await supabase.from('reactions').insert(newReply);
                    if (error) throw error;
                    queryClient.invalidateQueries({ queryKey: ['feed-updates-v2'] });
                    queryClient.invalidateQueries({ queryKey: ['room-reactions', update.roomId] });
                    setIsReplying(false);
                    setShowAllReplies(true);
                  }}
                  initialText={`@${update.authorName.toLowerCase().replace(/\s+/g, '')} `}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Threaded Replies Section */}
          {replies.length > 0 && (
            <div className="mt-3 relative pl-2">
              <div className="absolute left-6 top-0 bottom-6 w-[2px] bg-white/10 -z-10" />

              {replies.length > 1 && !showAllReplies && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAllReplies(true);
                  }}
                  className="relative ml-2 flex items-center gap-2 text-[13px] font-medium text-slate-400 hover:text-primary-400 transition-colors py-2 group"
                >
                  <div className="w-4 h-[2px] bg-white/10 group-hover:bg-primary-500 transition-colors" />
                  View {replies.length - 1} earlier repl{replies.length - 1 === 1 ? 'y' : 'ies'}...
                </button>
              )}

              {visibleReplies.map((reply: any) => (
                <ThreadedReply key={reply.id} reply={reply} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  if (prevProps.update.id !== nextProps.update.id) return false;
  if (prevProps.activeTab !== nextProps.activeTab) return false;
  if (prevProps.isFollowing !== nextProps.isFollowing) return false;
  if (prevProps.profile?.emailVerified !== nextProps.profile?.emailVerified) return false;
  if (prevProps.update.reactions?.length !== nextProps.update.reactions?.length) return false;

  return true;
});
