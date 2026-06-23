import { useState, useMemo, useRef } from "react";
import { Link, useNavigate } from 'react-router';
import { Virtuoso } from "react-virtuoso";
import { useAuth } from '../auth/AuthContext';
import { apiCall } from '../../../utils/api';
import { motion, AnimatePresence } from "motion/react";
import { CodeSnippetBlock } from '../ui/CodeSnippetBlock';
import { 
  Heart, MessageCircle, Share2, ShieldAlert, Sparkles, X, 
  Send, Hammer, ArrowRight, BookOpen, ImageIcon, Code, CheckCircle, Trash2,
  Bold, Italic, ListOrdered, List, Link as LinkIcon, Quote, AtSign, Lock
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../auth/AuthContext";
import { getAvatarUrl, timeAgo } from "../../utils/helpers";
import { ReadMoreText } from "../ui/ReadMoreText";
import { FigmaEmbed } from "../ui/FigmaEmbed";
import { VerifiedTick } from "../ui/VerifiedTick";
import { OrganizationBadge } from "../ui/OrganizationBadge";
import { Composer } from "./Composer";
import { ReplyComposer } from "./ReplyComposer";
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
import type { Room, Profile } from "../../types";
import type { FeedUpdate } from "../../hooks/useFeedUpdates";
import { QUERY_KEYS } from "../../constants";
import type { QueryClient } from "@tanstack/react-query";

interface TimelineFeedProps {
  user: { id: string; email?: string } | null;
  profile: Profile | null;
  myRooms: Room[];
  observedRooms: Room[];
  dbUpdates: FeedUpdate[];
  selectedRoomId: string;
  setSelectedRoomId: (id: string) => void;
  hasNextUpdates: boolean;
  fetchNextUpdates: () => void;
  isFetchingNextUpdates: boolean;
  rooms: Room[];
  activeTab: 'overview' | 'feed' | 'mine';
  queryClient: QueryClient;
  loading?: boolean;
}

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



export function TimelineFeed({
  user,
  profile,
  myRooms,
  observedRooms,
  dbUpdates,
  selectedRoomId,
  setSelectedRoomId,
  hasNextUpdates,
  fetchNextUpdates,
  isFetchingNextUpdates,
  rooms,
  activeTab,
  queryClient,
  loading,
}: TimelineFeedProps) {
  const { session, withVerification } = useAuth();
  
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<string[]>([]);
  const [fullyExpandedComments, setFullyExpandedComments] = useState<string[]>([]);
  const [optimisticToggles, setOptimisticToggles] = useState<Record<string, boolean>>({});
  const [activeDomainFilter, setActiveDomainFilter] = useState('All');
  const [feedSort, setFeedSort] = useState<'latest' | 'trending'>('latest');

  const avatarUrl = getAvatarUrl(user?.id || user?.email || 'default');
  const navigate = useNavigate();

  const handleOverlayClick = () => {
    setReplyingTo(null);
  };

  const [deletingUpdateId, setDeletingUpdateId] = useState<string | null>(null);

  const handleDeleteUpdate = async (updateId: string) => {
    setDeletingUpdateId(updateId);
    try {
      const { error, count } = await supabase.from('updates').delete({ count: 'exact' }).eq('id', updateId).eq('author_id', user!.id);
      if (error) throw error;
      if (count === 0) throw new Error("Update not found or you don't have permission to delete it.");
      
      toast.success("Update deleted");
      
      queryClient.setQueryData(QUERY_KEYS.feedUpdates, (oldData: { pages: FeedUpdate[][] } | undefined) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: FeedUpdate[]) => 
            page.filter((u: FeedUpdate) => u.id !== updateId)
          )
        };
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.feedUpdates });
    } catch (error: unknown) {
      console.error("Error deleting update:", error);
      toast.error((error instanceof Error ? error.message : String(error)) || "Failed to delete update");
    } finally {
      setDeletingUpdateId(null);
    }
  };

  const toggleComments = (id: string) => {
    setExpandedComments(prev => 
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  const handleReplyClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    withVerification(() => {
      setReplyingTo(id);
    });
  };

  const handleFollowRoom = async (roomId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    try {
      const { error } = await supabase.from('room_observers').upsert({ room_id: roomId, observer_id: user.id });
      if (error) throw error;
      toast.success("You are now observing this room!");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.observedRooms(user.id) });
    } catch (err: unknown) {
      toast.error(`Failed to follow room: ${(err instanceof Error ? err.message : String(err))}`);
    }
  };

  const handleUnfollowRoom = async (roomId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    try {
      const { error } = await supabase.from('room_observers').delete().eq('room_id', roomId).eq('observer_id', user.id);
      if (error) throw error;
      toast.success("You are no longer observing this room.");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.observedRooms(user.id) });
    } catch (err: unknown) {
      toast.error(`Failed to unfollow room: ${(err instanceof Error ? err.message : String(err))}`);
    }
  };

  const handleToggleReaction = async (
    updateId: string,
    roomId: string,
    type: 'sharp' | 'pushback' | 'tellmemore',
    currentReactions: any[]
  ) => {
    withVerification(async () => {
      if (!user) return;
      const key = `${updateId}-${type}`;
      const existing = currentReactions?.find(r => r.type === type && r.observerId === user.id);
      
      // Optimistic state toggle
      setOptimisticToggles(prev => ({
        ...prev,
        [key]: !existing
      }));

      try {
        if (existing) {
          const { error } = await supabase.from('reactions').delete().eq('id', existing.id);
          if (error) throw error;
          toast.success(`Removed ${type === 'tellmemore' ? 'More' : type} reaction`);
        } else {
          const payload = {
            id: `${roomId}-reaction-${type}-${user.id}-${Date.now()}`,
            room_id: roomId,
            update_id: updateId,
            observer_id: user.id,
            observer_name: profile?.name || user.email?.split('@')[0] || 'Observer',
            type,
            text: type, // Schema requires text NOT NULL
            created_at: new Date().toISOString(),
          };
          const { error } = await supabase.from('reactions').insert(payload);
          if (error) throw error;
          toast.success(`Added ${type === 'tellmemore' ? 'More' : type} reaction`);
        }
        await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.feedUpdates });
      } catch (err: unknown) {
        // Revert optimistic toggle on failure
        setOptimisticToggles(prev => ({
          ...prev,
          [key]: !!existing
        }));
        toast.error(`Failed to update reaction: ${(err instanceof Error ? err.message : String(err))}`);
      }
    });
  };

  const renderReactionButton = (
    updateId: string,
    roomId: string,
    type: 'sharp' | 'pushback' | 'tellmemore',
    label: string,
    icon: string,
    activeClass: string,
    serverReactions: any[]
  ) => {
    const key = `${updateId}-${type}`;
    const hasOptimisticOverride = optimisticToggles[key] !== undefined;
    
    const existingInServer = serverReactions?.some(r => r.type === type && r.observerId === user?.id) || false;
    const isActive = hasOptimisticOverride ? optimisticToggles[key] : existingInServer;
    
    let count = serverReactions?.filter(r => r.type === type).length || 0;
    if (hasOptimisticOverride) {
      if (optimisticToggles[key] && !existingInServer) {
        count += 1;
      } else if (!optimisticToggles[key] && existingInServer) {
        count -= 1;
      }
    }

    return (
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.95 }}
        onClick={(e) => {
          e.stopPropagation();
          handleToggleReaction(updateId, roomId, type, serverReactions);
        }}
        className={`px-3 sm:px-4 py-1.5 sm:py-1.5 min-h-[44px] sm:min-h-auto rounded-full text-[11px] sm:text-[12px] font-bold transition-colors border flex items-center gap-1 sm:gap-1.5 focus-ring ${
          isActive 
            ? activeClass
            : "bg-white shadow-sm border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300"
        }`}
      >
        <span>{icon}</span>
        <span>{label}</span>
        {(!profile || !profile.emailVerified) && <Lock className="w-3 h-3 opacity-60 ml-0.5" />}
        <span className="opacity-40">·</span>
        <span>{count}</span>
      </motion.button>
    );
  };

  const filteredUpdates = useMemo(() => {
    let result = dbUpdates;
    
    // 1. Base filter by tab
    if (activeTab === 'overview') {
      result = result.filter(u => myRooms.some(r => r.id === u.roomId));
    }

    // 2. Domain filter (only on Global feed)
    if (activeTab === 'feed' && activeDomainFilter !== 'All') {
      result = result.filter(u => {
        const room = rooms?.find(r => r.id === u.roomId) || u.rooms;
        return room?.tags?.includes(activeDomainFilter.toLowerCase());
      });
    }

    // 3. Sorting (Trending vs Latest)
    if (activeTab === 'feed' && feedSort === 'trending') {
      result = [...result].sort((a, b) => {
        const aInteractions = (a.reactions?.length || 0);
        const bInteractions = (b.reactions?.length || 0);
        return bInteractions - aInteractions;
      });
    }
    
    return result;
  }, [dbUpdates, myRooms, activeTab, activeDomainFilter, feedSort, rooms]);

  return (
    <div className="max-w-[700px] w-full mx-auto">
      <Composer 
        user={user}
        profile={profile}
        myRooms={myRooms}
        selectedRoomId={selectedRoomId}
        setSelectedRoomId={setSelectedRoomId}
        avatarUrl={avatarUrl}
      />

      {/* TIMELINE HEADER */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="text-[11px] uppercase tracking-widest text-slate-500 font-bold">
            {activeTab === 'overview' ? 'Overview — active updates' : 'Global timeline'}
          </div>
          <div className="h-px bg-slate-200 flex-1 ml-4" />
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{rooms.length} live rooms</span>
          </div>
        </div>
        {activeTab === 'feed' && (
          <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
            <div className="flex overflow-x-auto custom-scrollbar items-center gap-2 pb-2 sm:pb-0 snap-x">
              {['All', 'Product', 'Engineering', 'Design'].map(domain => (
                <button
                  key={domain}
                  onClick={() => setActiveDomainFilter(domain)}
                  className={`px-3 py-1.5 rounded-full text-[12px] font-bold transition-all border focus-ring ${
                    activeDomainFilter === domain
                      ? 'bg-primary-500 border-primary-500 text-white shadow-[0_0_10px_rgba(108,92,231,0.3)]'
                      : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {domain}
                </button>
              ))}
            </div>
            <div className="flex bg-white border border-slate-200 rounded-full p-1 self-start sm:self-auto shadow-sm">
              <button
                onClick={() => setFeedSort('latest')}
                className={`px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${
                  feedSort === 'latest' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Latest
              </button>
              <button
                onClick={() => setFeedSort('trending')}
                className={`px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${
                  feedSort === 'trending' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Trending
              </button>
            </div>
          </div>
        )}
      </div>

      {/* TIMELINE FEED */}
      <div className="flex flex-col gap-4 mb-12">
        {loading ? (
          <>
            {[1, 2, 3].map(i => (
              <div key={`skeleton-${i}`} className="bg-white border border-slate-200 rounded-[20px] sm:rounded-[24px] p-3 sm:p-6 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-start gap-2.5 sm:gap-3 mb-3 sm:mb-4">
                  <div className="flex items-center gap-2.5 sm:gap-4 flex-1">
                    <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-[10px] sm:rounded-2xl bg-slate-100 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
                      <div className="h-3 w-48 bg-slate-100 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="h-4 w-full bg-slate-100 rounded animate-pulse" />
                  <div className="h-4 w-5/6 bg-slate-100 rounded animate-pulse" />
                  <div className="h-4 w-4/6 bg-slate-100 rounded animate-pulse" />
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <div className="h-8 w-20 bg-slate-100 rounded-full animate-pulse" />
                  <div className="h-8 w-24 bg-slate-100 rounded-full animate-pulse" />
                </div>
              </div>
            ))}
          </>
        ) : filteredUpdates.length === 0 ? (
          <motion.div layout className="p-8 sm:p-12 text-center text-slate-500 text-[14px] font-medium bg-white border border-slate-200 rounded-[24px] shadow-sm">
            No updates posted yet.
          </motion.div>
        ) : (
          <Virtuoso
            useWindowScroll
            data={filteredUpdates}
            itemContent={(idx, update) => {
            const fullRoom = rooms?.find(r => r.id === update.roomId);
            const tag = fullRoom?.tags?.[0] || update.rooms?.tags?.[0] || 'product';
            const tStyle = tagStyle(tag);
            const builderName = update.authorName;
            const updateAvatarUrl = getAvatarUrl(update.authorId || builderName);
            const timeString = timeAgo(update.createdAt);
            const roomTitle = fullRoom?.title || update.rooms?.title || 'Unknown Room';
            const comments = update.reactions?.filter((r: any) => r.type === 'reply') || [];
            
            const isFollowing = observedRooms.some(r => r.id === update.roomId);
            const isLaunch = fullRoom?.updateCount === 1;

            return (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                key={update.id} 
                onClick={() => toggleComments(update.id)}
                className={`bg-white border ${isLaunch ? 'border-primary-400/40 shadow-[0_0_20px_rgba(139,124,248,0.1)]' : 'border-slate-200 shadow-sm'} rounded-[20px] sm:rounded-[24px] p-3 sm:p-6 hover:bg-slate-50/50 transition-all cursor-pointer relative overflow-hidden focus-ring`}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    toggleComments(update.id);
                  }
                }}
              >
                {/* Header */}
                <div className="flex justify-between items-start gap-2.5 sm:gap-3 mb-3 sm:mb-4">
                  <div className="flex items-center gap-2.5 sm:gap-4 flex-1 min-w-0">
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (update.authorId) {
                          navigate(`/dashboard/profile/${update.authorId}`);
                        }
                      }}
                      className={`w-8 h-8 sm:w-11 sm:h-11 rounded-[10px] sm:rounded-2xl flex items-center justify-center overflow-hidden shrink-0 ${isLaunch ? 'ring-2 ring-primary-400 shadow-[0_0_15px_rgba(139,124,248,0.3)]' : 'bg-slate-50 border border-slate-200'} cursor-pointer hover:ring-2 hover:ring-primary-400 transition-all`}
                    >
                      <img src={updateAvatarUrl} alt="Avatar" className="w-full h-full object-cover scale-110" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <div className="font-extrabold text-[13px] sm:text-[16px] text-slate-900 leading-tight font-display hover:underline truncate max-w-full flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          {builderName}
                          {(!(update as any).authorOrgName) && <VerifiedTick isVerified={!!(update as any).authorIsVerifiedExpert} className="w-4 h-4 shrink-0" />}
                        </div>
                        <OrganizationBadge 
                          orgName={(update as any).authorOrgName} 
                          orgLogo={(update as any).authorOrgLogo} 
                          isVerified={!!(update as any).authorIsVerifiedExpert} 
                        />
                        {isLaunch && (
                          <span className="text-[9px] sm:text-[10px] uppercase tracking-widest font-bold bg-primary-400/10 text-primary-400 px-2 py-0.5 rounded-full shrink-0">Launched</span>
                        )}
                      </div>
                      <div className="text-[12px] sm:text-[13px] text-slate-500 mt-1 font-medium flex items-center flex-wrap gap-x-1.5">
                        <span className="text-slate-900 font-semibold hover:underline truncate max-w-full" onClick={(e) => e.stopPropagation()}>{roomTitle}</span>
                        <span className="text-slate-600 hidden sm:inline">·</span>
                        <span className="capitalize">{tag}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col-reverse items-end gap-1.5">
                    <div className="flex items-center gap-2">
                      <div className="text-[12px] text-slate-500 font-medium whitespace-nowrap">
                        {timeString}
                      </div>
                      {update.authorId === user?.id && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button
                                onClick={(e) => e.stopPropagation()}
                                disabled={deletingUpdateId === update.id}
                                className="text-slate-500 hover:text-rose-400 transition-colors p-2.5 sm:p-2 -m-2 sm:-m-1 rounded-lg hover:bg-rose-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 relative z-20 flex items-center justify-center min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0"
                                title="Delete update"
                              >
                                {deletingUpdateId === update.id ? (
                                   <span className="w-3.5 h-3.5 border-2 border-rose-400/30 border-t-rose-400 rounded-full animate-spin block" />
                                ) : (
                                   <Trash2 className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent 
                              onClick={(e) => e.stopPropagation()}
                              className="bg-white border border-slate-200 shadow-xl sm:rounded-[24px]"
                            >
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-[20px] font-display font-extrabold text-slate-900">Delete this update?</AlertDialogTitle>
                                <AlertDialogDescription className="text-slate-500 text-[14px] font-medium leading-relaxed mt-2">
                                  This action cannot be undone. This will permanently remove your update from the timeline.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="mt-6 border-t border-slate-100 pt-4">
                                <AlertDialogCancel className="bg-slate-50 hover:bg-slate-100 text-slate-600 border-0 font-semibold transition-all">Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteUpdate(update.id);
                                  }}
                                  className="bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/20 font-bold transition-all"
                                >
                                  Delete Update
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                      )}
                    </div>
                    {activeTab === 'feed' && update.authorId !== user?.id && (
                      isFollowing ? (
                        <button 
                          onClick={(e) => handleUnfollowRoom(update.roomId, e)}
                          className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all group"
                        >
                          <CheckCircle className="w-3 h-3 group-hover:hidden" />
                          <span className="group-hover:hidden">Following</span>
                          <span className="hidden group-hover:inline">Unfollow</span>
                        </button>
                      ) : (
                        <button 
                          onClick={(e) => handleFollowRoom(update.roomId, e)}
                          className="text-[11px] font-bold text-primary-400 bg-primary-400/10 border border-primary-400/20 hover:bg-primary-400/20 px-2.5 py-1 rounded-full transition-all focus-ring"
                        >
                          + Follow
                        </button>
                      )
                    )}
                  </div>
                </div>

                {update.content && (
                  update.content.includes("figma.com/") ? (
                    <FigmaEmbed content={update.content} />
                  ) : (
                    <ReadMoreText 
                      content={update.content} 
                      className="text-[14px] sm:text-[15px] text-slate-700 leading-relaxed mb-4 whitespace-pre-wrap break-words" 
                    />
                  )
                )}

                {update.mediaUrl && (
                  <div className="mb-6 relative z-10 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm">
                    <img src={update.mediaUrl} alt="Update media" className="w-full object-cover max-h-[500px]" />
                  </div>
                )}

                {update.codeSnippet && <CodeSnippetBlock code={update.codeSnippet} />}

                <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-slate-100">
                  {renderReactionButton(update.id, update.roomId, 'sharp', 'Sharp', '✦', 'bg-primary-400/10 border-primary-400/30 text-primary-400', update.reactions || [])}
                  {renderReactionButton(update.id, update.roomId, 'pushback', 'Push back', '↩', 'bg-rose-50 border-rose-200 text-rose-500', update.reactions || [])}
                  {renderReactionButton(update.id, update.roomId, 'tellmemore', 'More', '?', 'bg-emerald-50 border-emerald-200 text-emerald-600', update.reactions || [])}
                  
                  {comments.length > 0 ? (
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleComments(update.id); }}
                      className="ml-auto text-[12px] font-bold text-primary-400 hover:underline focus-ring rounded px-1"
                    >
                      {comments.length} {comments.length === 1 ? 'reply' : 'replies'}
                    </button>
                  ) : (
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleComments(update.id); }}
                      className="ml-auto text-[12px] font-bold text-slate-500 hover:text-slate-900 transition-colors focus-ring rounded px-1"
                    >
                      Reply
                    </button>
                  )}
                </div>

                {/* Comments section */}
                {expandedComments.includes(update.id) && (() => {
                  const isFullyExpanded = fullyExpandedComments.includes(update.id);
                  const visibleComments = isFullyExpanded ? comments : comments.slice(0, 3);
                  const hiddenCount = comments.length - visibleComments.length;

                  return (
                    <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-3 relative">
                      {/* Thread Trail */}
                      <div className="absolute top-8 bottom-12 left-[15px] w-px bg-slate-200 z-0 hidden sm:block" />
                      
                      {hiddenCount > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFullyExpandedComments(prev => [...prev, update.id]);
                          }}
                          className="text-[12px] font-bold text-primary-400 hover:text-slate-900 transition-colors self-start mb-2 relative z-10 bg-white pr-2"
                        >
                          View {hiddenCount} previous {hiddenCount === 1 ? 'reply' : 'replies'}...
                        </button>
                      )}
                      
                      {visibleComments.map((comment: any) => {
                        const commentAvatarUrl = getAvatarUrl(comment.observerId || comment.observerName);
                        const commentHandle = `@${comment.observerName.toLowerCase().replace(/\s+/g, '')}`;
                        const commentTime = timeAgo(comment.createdAt);
                        return (
                          <div key={comment.id} className="flex gap-3 relative z-10" onClick={(e) => e.stopPropagation()}>
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (comment.observerId) {
                                navigate(`/dashboard/profile/${comment.observerId}`);
                              }
                            }}
                            className="w-8 h-8 rounded-[10px] bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:ring-2 hover:ring-primary-400 transition-all"
                          >
                            <img src={commentAvatarUrl} alt="Avatar" className="w-full h-full object-cover scale-110" />
                          </div>
                          <div className="flex-1 bg-slate-50 rounded-xl p-3 border border-slate-100">
                            <div className="flex items-center flex-wrap gap-x-1.5 gap-y-0.5 mb-1">
                              <span className="font-bold text-[13px] text-slate-900 hover:underline whitespace-nowrap truncate max-w-[150px] sm:max-w-[250px] flex items-center gap-1">
                                {comment.observerName}
                                <VerifiedTick userId={comment.observerId} className="w-3 h-3" />
                              </span>
                              <span className="text-[12px] text-slate-500 truncate max-w-[100px] sm:max-w-[180px]">{commentHandle}</span>
                              <span className="text-[12px] text-slate-500 shrink-0">·</span>
                              <span className="text-[12px] text-slate-500 shrink-0">{commentTime}</span>
                            </div>
                            <p className="text-[13.5px] text-slate-700 leading-relaxed m-0">
                              {comment.text.split(/(@\w+)/g).map((part: string, i: number) => 
                                part.startsWith('@') ? (
                                  <span key={i} className="text-[#E75C5C] font-semibold">{part}</span>
                                ) : (
                                  <span key={i}>{part}</span>
                                )
                              )}
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReplyClick(e, update.id);
                                }}
                                className="flex items-center gap-1.5 text-[12px] font-bold text-slate-400 hover:text-primary-400 transition-colors"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                                Reply
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {replyingTo === update.id ? (
                      <ReplyComposer
                        update={update}
                        user={user}
                        profile={profile}
                        queryClient={queryClient}
                        onCancel={() => setReplyingTo(null)}
                        onSuccess={(replyId) => {
                          setReplyingTo(null);
                          setExpandedComments(prev => update.id && !prev.includes(update.id) ? [...prev, update.id] : prev);
                          setFullyExpandedComments(prev => update.id && !prev.includes(update.id) ? [...prev, update.id] : prev);
                        }}
                        initialText={`@${update.authorName.toLowerCase().replace(/\s+/g, '')} `}
                      />
                    ) : (
                      <div className="flex items-center gap-3 mt-1 relative z-10 pl-2" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={(e) => handleReplyClick(e, update.id)}
                          className="text-[13px] font-bold text-primary-400 hover:text-[#7b6ce8] transition-colors bg-transparent border-none cursor-pointer flex items-center gap-1.5 focus-ring rounded px-1"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                          Add a reply
                          {(!profile || !profile.emailVerified) && <Lock className="w-3 h-3 ml-0.5 opacity-70" />}
                        </button>
                      </div>
                    )}
                  </div>
                );})()}
              </motion.div>
            );
          }}
        />
        )}

        {hasNextUpdates && (
          <div className="flex justify-center p-6 border-t border-slate-200 bg-slate-50">
            <button
              onClick={() => fetchNextUpdates()}
              disabled={isFetchingNextUpdates}
              className="px-6 py-2.5 bg-primary-400/10 hover:bg-primary-400/20 active:scale-95 border border-primary-400/20 text-primary-400 hover:text-white rounded-full text-[13px] font-bold transition-all disabled:opacity-50 flex items-center gap-2 focus-ring"
            >
              {isFetchingNextUpdates ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Loading...
                </>
              ) : (
                "Load More Updates"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
