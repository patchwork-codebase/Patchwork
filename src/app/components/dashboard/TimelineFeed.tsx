import React, { useState, useMemo, useRef } from "react";
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
import { timeAgo } from "../../utils/helpers";
import { ReadMoreText } from "../ui/ReadMoreText";
import { FigmaEmbed } from "../ui/FigmaEmbed";
import { VerifiedTick } from "../ui/VerifiedTick";
import { OrganizationBadge } from "../ui/OrganizationBadge";
import { Composer } from "./Composer";
import { ReplyComposer } from "./ReplyComposer";
import { SuggestedBuilders } from "./SuggestedBuilders";
import { ActivityFeedCard } from "./ActivityFeedCard";
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
import { FeedUpdateCard } from "./FeedUpdateCard";
import { TimelineFilters } from "./TimelineFilters";
import { TrendingTopics } from "./TrendingTopics";

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
  feedSortOrder: 'desc' | 'asc';
  setFeedSortOrder: (order: 'desc' | 'asc') => void;
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
  feedSortOrder,
  setFeedSortOrder,
}: TimelineFeedProps) {
  const { session, withVerification } = useAuth();
  
  const [activeDomainFilter, setActiveDomainFilter] = useState('All');
  const [activeViewToggle, setActiveViewToggle] = useState<'all' | 'media' | 'launches'>('all');

  const navigate = useNavigate();

  const handleFollowRoom = React.useCallback(async (roomId: string, e: React.MouseEvent) => {
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
  }, [user, queryClient]);

  const handleUnfollowRoom = React.useCallback(async (roomId: string, e: React.MouseEvent) => {
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
  }, [user, queryClient]);

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

    // 3. View Toggles (Media / Launches)
    if (activeViewToggle === 'media') {
      result = result.filter(u => !!u.mediaUrl || !!u.figmaUrl || (u.content && u.content.includes("figma.com/")));
    } else if (activeViewToggle === 'launches') {
      result = result.filter(u => {
        const fullRoom = rooms?.find(r => r.id === u.roomId);
        return fullRoom?.updateCount === 1; // "Launched" logic
      });
    }

    // 4. Sorting
    // dbUpdates is already sorted by the useFeedUpdates hook (either desc or asc).
    // If we wanted local sorting fallback:
    /* if (feedSortOrder === 'asc') {
         result = [...result].reverse();
       } */
    
    return result;
  }, [dbUpdates, myRooms, activeTab, activeDomainFilter, feedSortOrder, rooms, activeViewToggle]);

  return (
    <div className="w-full max-w-[1050px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
      <div className="max-w-[700px] w-full mx-auto lg:mx-0">
      <Composer 
        user={user}
        profile={profile}
        myRooms={myRooms}
        selectedRoomId={selectedRoomId}
        setSelectedRoomId={setSelectedRoomId}
        // no longer passing avatarUrl string
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
          <TimelineFilters
            activeDomainFilter={activeDomainFilter}
            setActiveDomainFilter={setActiveDomainFilter}
            activeViewToggle={activeViewToggle}
            setActiveViewToggle={setActiveViewToggle}
            feedSort={feedSortOrder}
            setFeedSort={setFeedSortOrder as any}
          />
        )}
      </div>

      {/* TIMELINE FEED */}
      <div className="flex flex-col mb-12 bg-white sm:border sm:border-slate-200 sm:rounded-[24px] overflow-hidden sm:shadow-sm">
        {loading ? (
          <>
            {[1, 2, 3].map(i => (
              <div key={`skeleton-${i}`} className="bg-white sm:border sm:border-slate-200 sm:rounded-[24px] px-4 py-5 sm:p-6 sm:shadow-sm relative overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent z-10" />
                <div className="flex justify-between items-start gap-2.5 sm:gap-3 mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full sm:rounded-2xl bg-slate-200 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-28 bg-slate-200 rounded animate-pulse" />
                        <div className="h-3 w-16 bg-slate-100 rounded-full animate-pulse" />
                      </div>
                      <div className="h-3 w-32 bg-slate-100 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
                <div className="space-y-3 mb-5">
                  <div className="h-4 w-full bg-slate-100 rounded animate-pulse" />
                  <div className="h-4 w-[90%] bg-slate-100 rounded animate-pulse" />
                  <div className="h-4 w-[60%] bg-slate-100 rounded animate-pulse" />
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <div className="h-8 w-20 bg-slate-100 rounded-full animate-pulse hidden sm:block" />
                  <div className="h-8 w-20 bg-slate-100 rounded-full animate-pulse hidden sm:block" />
                  <div className="h-8 w-20 bg-slate-100 rounded-full animate-pulse hidden sm:block" />
                  <div className="h-6 w-12 bg-slate-100 rounded animate-pulse sm:hidden" />
                  <div className="h-6 w-12 bg-slate-100 rounded animate-pulse sm:hidden" />
                  <div className="h-6 w-12 bg-slate-100 rounded animate-pulse sm:hidden" />
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
            const isFollowing = observedRooms.some(r => r.id === update.roomId);

            return (
              <>
                {update._isActivity ? (
                  <ActivityFeedCard
                    activity={update}
                    rooms={rooms}
                    user={user}
                    profile={profile}
                    queryClient={queryClient}
                  />
                ) : (
                  <FeedUpdateCard
                    update={update}
                    fullRoom={fullRoom}
                    rooms={rooms}
                    user={user}
                    profile={profile}
                    isFollowing={isFollowing}
                    activeTab={activeTab}
                    queryClient={queryClient}
                    handleFollowRoom={handleFollowRoom}
                    handleUnfollowRoom={handleUnfollowRoom}
                  />
                )}
              {idx === 1 && (
                <div className="block lg:hidden mb-6">
                  <SuggestedBuilders currentUserId={user?.id} />
                </div>
              )}
            </>
            );
          }}
          components={{
            Footer: () => (
                <>
                  {hasNextUpdates ? (
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
                  ) : !loading && filteredUpdates.length > 0 ? (
                    <div className="mt-8 mb-12 p-8 sm:p-12 text-center bg-white border border-slate-200 rounded-[24px] shadow-sm flex flex-col items-center">
                      <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center mb-4 text-primary-500">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <h3 className="text-[18px] font-display font-extrabold text-slate-900 mb-2">You're all caught up!</h3>
                      <p className="text-[14px] text-slate-500 max-w-md mx-auto mb-6">
                        You've seen all the latest updates. Why not discover more rooms or post an update of your own?
                      </p>
                      <div className="flex items-center gap-3">
                        <Link to="/dashboard/explore" className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-full text-[13px] font-bold transition-all shadow-sm">
                          Explore Rooms
                        </Link>
                        <button 
                          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                          className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-[13px] font-bold transition-all"
                        >
                          Back to top
                        </button>
                      </div>
                    </div>
                  ) : null}
                </>
              )
            }}
          />
        )}
      </div>
      </div>

      {/* RIGHT SIDEBAR (Desktop Only) */}
      <div className="hidden lg:flex flex-col gap-6 sticky top-24">
        <TrendingTopics updates={dbUpdates} rooms={rooms} />
        <SuggestedBuilders currentUserId={user?.id} />
      </div>
    </div>
  );
}
