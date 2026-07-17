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
import { CodeSnippetBlock } from "../ui/CodeSnippetBlock";
import { SmartImage } from "../ui/SmartImage";
import { ReplyComposer } from "./ReplyComposer";
import type { Room, Profile } from "../../types";
import type { FeedUpdate } from "../../hooks/useFeedUpdates";
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
  design:      { bg: 'bg-purple-500/10', color: 'text-purple-400' },
  engineering: { bg: 'bg-emerald-500/10', color: 'text-emerald-400' },
  dev:         { bg: 'bg-blue-500/10',  color: 'text-blue-400' },
  product:     { bg: 'bg-primary-500/10', color: 'text-primary-400' },
  research:    { bg: 'bg-amber-500/10', color: 'text-amber-400' },
  writing:     { bg: 'bg-pink-500/10', color: 'text-pink-400' },
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
  optimisticToggles: Record<string, boolean>;
  expandedComments: string[];
  fullyExpandedComments: string[];
  replyingTo: string | null;
  deletingUpdateId: string | null;
  queryClient: any;
  
  toggleComments: (id: string) => void;
  setExpandedComments: React.Dispatch<React.SetStateAction<string[]>>;
  setFullyExpandedComments: React.Dispatch<React.SetStateAction<string[]>>;
  setReplyingTo: (id: string | null) => void;
  handleToggleReaction: (updateId: string, roomId: string, type: 'sharp' | 'pushback' | 'tellmemore', currentReactions: any[]) => void;
  handleFollowRoom: (roomId: string, e: React.MouseEvent) => void;
  handleUnfollowRoom: (roomId: string, e: React.MouseEvent) => void;
  handleDeleteUpdate: (updateId: string) => void;
  handleReplyClick: (e: React.MouseEvent, id: string) => void;
}

export const FeedUpdateCard = React.memo(function FeedUpdateCard({
  update,
  fullRoom,
  rooms,
  user,
  profile,
  isFollowing,
  activeTab,
  optimisticToggles,
  expandedComments,
  fullyExpandedComments,
  replyingTo,
  deletingUpdateId,
  queryClient,
  toggleComments,
  setExpandedComments,
  setFullyExpandedComments,
  setReplyingTo,
  handleToggleReaction,
  handleFollowRoom,
  handleUnfollowRoom,
  handleDeleteUpdate,
  handleReplyClick,
}: FeedUpdateCardProps) {
  const navigate = useNavigate();
  const tag = fullRoom?.tags?.[0] || update.rooms?.tags?.[0] || 'product';
  const tStyle = tagStyle(tag);
  const builderName = update.authorName;
  // updateAvatarUrl removed
  const timeString = timeAgo(update.createdAt);
  const roomTitle = fullRoom?.title || update.rooms?.title || 'Unknown Room';
  const comments = update.reactions?.filter((r: any) => r.type === 'reply') || [];
  const isLaunch = fullRoom?.updateCount === 1;

  return (
    <div
      onClick={() => toggleComments(update.id)}
      className="w-full max-w-full bg-white/60 backdrop-blur-md border border-white/40 shadow-sm rounded-[28px] mb-4 px-4 py-5 sm:p-6 sm:px-8 hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-200/20 hover:bg-white transition-all duration-200 cursor-pointer relative overflow-hidden group focus-ring"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') toggleComments(update.id);
      }}
    >
      <div className="flex items-start gap-3 sm:gap-4 mb-3">
        <div 
          onClick={(e) => {
            e.stopPropagation();
            if (update.authorId) navigate(`/dashboard/profile/${update.authorId}`);
          }}
          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center overflow-hidden shrink-0 ${isLaunch ? 'ring-2 ring-primary-400 shadow-[0_0_15px_rgba(139,124,248,0.3)]' : 'bg-slate-100 ring-1 ring-slate-200'} cursor-pointer hover:ring-2 hover:ring-primary-400 transition-all`}
        >
          <UserAvatar 
            userId={update.authorId} 
            name={builderName} 
            avatarUrl={update.authorAvatar}
            className="w-full h-full object-cover" 
          />
        </div>

        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-center gap-1.5 justify-between mb-0.5">
            <div className="flex items-center gap-1 min-w-0 flex-1" onClick={(e) => e.stopPropagation()}>
              <span className="font-bold text-[15px] sm:text-[16px] text-slate-900 truncate hover:underline cursor-pointer">
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
              <span className="text-slate-400 text-[14px] mx-1 hidden sm:inline">·</span>
              <span className="text-[14px] text-slate-400 hover:underline cursor-pointer truncate hidden sm:inline" onClick={() => navigate(`/dashboard/room/${update.roomId}`)}>
                {roomTitle}
              </span>
              {isLaunch && (
                <span className="ml-2 text-[10px] uppercase tracking-widest font-bold bg-primary-400/10 text-primary-400 px-2 py-0.5 rounded-full shrink-0 hidden sm:inline">Launched</span>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-[14px] text-slate-400 whitespace-nowrap">{timeString}</span>
              {update.authorId === user?.id && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      disabled={deletingUpdateId === update.id}
                      className="text-slate-400 hover:text-rose-400 transition-colors p-1 rounded hover:bg-rose-50 relative z-20"
                    >
                      {deletingUpdateId === update.id ? (
                        <span className="w-4 h-4 border-2 border-rose-400/30 border-t-rose-400 rounded-full animate-spin block" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent onClick={(e) => e.stopPropagation()} className="bg-white border border-slate-200 sm:rounded-[24px]">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-[20px] font-display font-bold">Delete update?</AlertDialogTitle>
                      <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
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
          
          <div className="text-[14px] text-slate-500 mb-2 sm:hidden flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <span className="truncate hover:underline cursor-pointer">{roomTitle}</span>
          </div>

          <div className="mt-1 w-full max-w-full">
            {update.content && (
              update.content.includes("figma.com/") ? (
                <div className="my-3 rounded-[20px] overflow-hidden border border-slate-200/60 shadow-sm bg-slate-50 relative group">
                   <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[11px] font-bold text-slate-700 shadow-sm z-10 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Figma Design</span>
                   </div>
                   <FigmaEmbed content={update.content} />
                </div>
              ) : (
                <ReadMoreText 
                  content={update.content} 
                  className="text-[15px] sm:text-[16px] text-slate-800 leading-relaxed whitespace-pre-wrap break-words font-medium" 
                />
              )
            )}

            {update.mediaUrl && (
              <div className="mt-3 rounded-[20px] w-full max-w-full overflow-hidden border border-slate-200/60 bg-slate-50 relative group">
                <SmartImage src={update.mediaUrl} aspectRatio="video" objectFit="cover" alt="Update media" className="hover:scale-[1.02] transition-transform duration-500" />
              </div>
            )}

            {update.codeSnippet && (
              <div className="mt-3 rounded-[20px] overflow-hidden shadow-sm border border-slate-200/60">
                 <CodeSnippetBlock code={update.codeSnippet} />
              </div>
            )}
          </div>

          <div className="mt-4">
            {/* Stacked Avatars above buttons - only if there are reactions */}
            {update.reactions && update.reactions.length > 0 && (
              <div className="flex items-center gap-1.5 mb-2">
                <div className="flex -space-x-1.5">
                  {Array.from(new Set(update.reactions.map((r: any) => r.observerId).filter(Boolean)))
                    .slice(0, 3)
                    .map((observerId: any) => (
                      <UserAvatar key={observerId} userId={observerId} className="w-5 h-5 rounded-full ring-2 ring-white bg-slate-100 object-cover" />
                    ))
                  }
                </div>
                <span className="text-[12px] text-slate-400">{update.reactions.length} reaction{update.reactions.length !== 1 ? 's' : ''}</span>
              </div>
            )}

            {/* Reaction Buttons - single row, no wrap */}
            <div className="flex items-center gap-1">
              {(['sharp', 'pushback', 'tellmemore'] as const).map((type) => {
                const icons = { sharp: '✦', pushback: '↩', tellmemore: '?' };
                const activeColors = { sharp: 'text-primary-500', pushback: 'text-rose-500', tellmemore: 'text-emerald-600' };
                const activeBg = { sharp: 'bg-primary-500/10', pushback: 'bg-rose-500/10', tellmemore: 'bg-emerald-500/10' };
                const key = `${update.id}-${type}`;
                const hasOptimistic = optimisticToggles[key] !== undefined;
                const serverActive = update.reactions?.some((r: any) => r.type === type && r.observerId === user?.id) || false;
                const isActive = hasOptimistic ? optimisticToggles[key] : serverActive;
                let count = update.reactions?.filter((r: any) => r.type === type).length || 0;
                if (hasOptimistic) { if (optimisticToggles[key] && !serverActive) count += 1; else if (!optimisticToggles[key] && serverActive) count -= 1; }
                
                return (
                  <button
                    key={type}
                    onClick={(e) => { e.stopPropagation(); handleToggleReaction(update.id, update.roomId, type, update.reactions || []); }}
                    className={`flex items-center gap-1 transition-all group px-2 py-1.5 rounded-full ${isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors shrink-0 ${isActive ? activeBg[type] : 'bg-slate-100 group-hover:bg-slate-200'}`}>
                       <span className={`text-[13px] font-bold ${isActive ? activeColors[type] : 'text-slate-500'}`}>{icons[type]}</span>
                    </div>
                    {count > 0 && <span className="text-[12px] font-bold">{count}</span>}
                  </button>
                );
              })}

              <button 
                onClick={(e) => handleReplyClick(e, update.id)}
                className="flex items-center gap-1 text-slate-500 hover:text-primary-500 transition-colors px-2 py-1.5 rounded-full hover:bg-primary-50 group"
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center bg-slate-100 group-hover:bg-primary-100 transition-colors shrink-0">
                  <MessageCircle className="w-3.5 h-3.5 group-hover:text-primary-500" />
                </div>
                {comments.length > 0 && <span className="text-[12px] font-bold">{comments.length}</span>}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {replyingTo === update.id && (
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
                  onCancel={() => setReplyingTo(null)}
                  onSuccess={() => {
                    setReplyingTo(null);
                    setExpandedComments(prev => update.id && !prev.includes(update.id) ? [...prev, update.id] : prev);
                    setFullyExpandedComments(prev => update.id && !prev.includes(update.id) ? [...prev, update.id] : prev);
                  }}
                  initialText={`@${update.authorName.toLowerCase().replace(/\s+/g, '')} `}
                />
              </motion.div>
            )}
            
            {expandedComments.includes(update.id) && comments.length > 0 && (
              <motion.div
                key="comments-list"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-4 overflow-hidden"
              >
                {comments.slice(0, fullyExpandedComments.includes(update.id) ? comments.length : 3).map((reply: any) => (
                  <div key={reply.id} className="flex gap-3">
                    <UserAvatar userId={reply.observerId} name={reply.observerName} avatarUrl={reply.observerAvatar} className="w-8 h-8 rounded-full object-cover shrink-0" />
                    <div className="flex-1 bg-slate-50 rounded-2xl p-3 px-4">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-[13px] text-slate-900">{reply.observerName}</span>
                        <span className="text-[11px] text-slate-400">{timeAgo(reply.createdAt)}</span>
                      </div>
                      <p className="text-[14px] text-slate-700 leading-relaxed">{reply.text || reply.content}</p>
                    </div>
                  </div>
                ))}
                {comments.length > 3 && !fullyExpandedComments.includes(update.id) && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setFullyExpandedComments(prev => [...prev, update.id]); }}
                    className="text-[13px] font-bold text-primary-500 hover:underline self-start ml-11"
                  >
                    View {comments.length - 3} more comments
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  if (prevProps.update.id !== nextProps.update.id) return false;
  if (prevProps.activeTab !== nextProps.activeTab) return false;
  if (prevProps.isFollowing !== nextProps.isFollowing) return false;
  if (prevProps.deletingUpdateId !== nextProps.deletingUpdateId) return false;
  if (prevProps.replyingTo !== nextProps.replyingTo) return false;
  if (prevProps.profile?.emailVerified !== nextProps.profile?.emailVerified) return false;

  const prevExp = prevProps.expandedComments.includes(prevProps.update.id);
  const nextExp = nextProps.expandedComments.includes(nextProps.update.id);
  if (prevExp !== nextExp) return false;

  const prevFull = prevProps.fullyExpandedComments.includes(prevProps.update.id);
  const nextFull = nextProps.fullyExpandedComments.includes(nextProps.update.id);
  if (prevFull !== nextFull) return false;

  const types = ['sharp', 'pushback', 'tellmemore'];
  for (const type of types) {
    const key = `${prevProps.update.id}-${type}`;
    if (prevProps.optimisticToggles[key] !== nextProps.optimisticToggles[key]) return false;
  }

  if (prevProps.update.reactions?.length !== nextProps.update.reactions?.length) return false;

  return true;
});
