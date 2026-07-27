import { useState, useMemo } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Eye, Flame, CheckCircle2, MessagesSquare, ArrowUpRight, Compass } from "lucide-react";
import { supabase } from "../auth/AuthContext";
import { timeAgo, getAvatarUrl } from "../../utils/helpers";
import { UserAvatar } from "../ui/UserAvatar";
import { useObservedRooms, useRooms } from "../../hooks/useRooms";
import { QUERY_KEYS } from "../../constants";
import type { FeedUpdate } from "../../hooks/useFeedUpdates";
import type { QueryClient } from "@tanstack/react-query";
import { ObserverProgressionPanel } from "./ObserverProgressionPanel";
import { VerifiedTick } from "../ui/VerifiedTick";
import { CrossroadCard } from "../room/CrossroadCard";

interface ObserverDashboardViewProps {
  user: any;
  profile: any;
  dbUpdates: FeedUpdate[];
  observerStats: any;
  refreshProfile: () => Promise<void>;
  queryClient: QueryClient;
}

const COLOR_CLASSES = [
  "bg-amber-500/10 text-amber-600",
  "bg-blue-500/10 text-blue-600",
  "bg-emerald-500/10 text-emerald-600",
  "bg-purple-500/10 text-purple-600",
  "bg-rose-500/10 text-rose-600",
  "bg-cyan-500/10 text-cyan-600",
];

function getColorClass(seed: string) {
  const hash = seed.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return COLOR_CLASSES[hash % COLOR_CLASSES.length];
}

function classifyUpdate(content: string) {
  const txt = content.toLowerCase();
  if (txt.includes("shipped") || txt.includes("launched") || txt.includes("live"))
    return { tag: "Shipped", tagClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" };
  if (txt.includes("scrapped") || txt.includes("deleted") || txt.includes("cut"))
    return { tag: "Scrapped", tagClass: "bg-rose-500/10 text-rose-500 border-rose-500/20" };
  if (txt.includes("?") || txt.includes("question") || txt.includes("issue"))
    return { tag: "Open question", tagClass: "bg-amber-500/10 text-amber-600 border-amber-500/20" };
  return { tag: "Decision", tagClass: "bg-primary-500/10 text-primary-400 border-primary-500/20" };
}

export default function ObserverDashboardView({
  user,
  profile,
  dbUpdates,
  observerStats,
  queryClient,
}: ObserverDashboardViewProps) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [optimisticReactions, setOptimisticReactions] = useState<Record<string, 'sharp' | 'pushback' | 'tellmemore' | null>>({});
  const [followedRoomIds, setFollowedRoomIds] = useState<Record<string, boolean>>({});

  // ── Real data: observed rooms for "Watching now" ──────────────────
  const { data: observedRoomsData } = useObservedRooms(user?.id);
  const observedRooms = useMemo(() => observedRoomsData?.pages.flat() || [], [observedRoomsData]);

  // ── Real data: public rooms for "Suggested for you" ───────────────
  const { data: publicRoomsData } = useRooms();
  const allPublicRooms = useMemo(() => publicRoomsData?.pages.flat() || [], [publicRoomsData]);

  // Suggested = public rooms not yet followed by this observer
  const observedRoomIds = useMemo(() => new Set(observedRooms.map((r: any) => r.id)), [observedRooms]);
  const suggestedRooms = useMemo(
    () => allPublicRooms.filter((r: any) => !observedRoomIds.has(r.id) && !followedRoomIds[r.id]).slice(0, 3),
    [allPublicRooms, observedRoomIds, followedRoomIds]
  );

  const firstName = profile?.name?.split(" ")[0] || user?.email?.split("@")[0] || "Observer";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  // avatarUrl removed

  // ── Classify + filter real feed updates ──────────────────────────
  const classifiedUpdates = useMemo(() => {
    return dbUpdates.map((u) => ({
      ...u,
      colorClass: getColorClass(u.authorName),
      initials: u.authorName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2),
      domain: u.rooms?.tags?.[0] || "product",
      ...classifyUpdate(u.content),
    }));
  }, [dbUpdates]);

  const filteredUpdates = useMemo(() => {
    if (activeFilter === "all") return classifiedUpdates;
    return classifiedUpdates.filter((u) =>
      u.domain.toLowerCase() === activeFilter.toLowerCase()
    );
  }, [classifiedUpdates, activeFilter]);

  // ── Reactions ────────────────────────────────────────────────────
  const handleToggleReaction = async (
    updateId: string,
    roomId: string,
    type: "sharp" | "pushback" | "tellmemore",
    currentReactions: any[]
  ) => {
    if (!user) return;
    const existing = currentReactions?.find((r) => r.type === type && r.observerId === user.id);
    const key = `${updateId}-${type}`;

    setOptimisticReactions((prev) => ({ ...prev, [key]: existing ? null : type }));

    try {
      if (existing) {
        const { error } = await supabase.from("reactions").delete().eq("id", existing.id);
        if (error) throw error;
      } else {
        // Remove other reactions on this update by this user first
        const others = currentReactions?.filter((r) => r.observerId === user.id && r.type !== type);
        for (const o of others) await supabase.from("reactions").delete().eq("id", o.id);

        const { error } = await supabase.from("reactions").insert({
          id: `${roomId}-reaction-${type}-${user.id}-${Date.now()}`,
          room_id: roomId,
          update_id: updateId,
          observer_id: user.id,
          observer_name: profile?.name || user.email?.split("@")[0] || "Observer",
          type,
          text: type,
          created_at: new Date().toISOString(),
        });
        if (error) throw error;
        toast.success("Taste signal recorded!");
      }
      queryClient.invalidateQueries({ queryKey: ["feed-updates-v2"] });
      queryClient.invalidateQueries({ queryKey: ["observer-stats", user.id] });
    } catch (err: any) {
      setOptimisticReactions((prev) => ({ ...prev, [key]: existing ? type : null }));
      toast.error(`Failed to update reaction: ${err.message || err}`);
    }
  };

  const handleFollowRoom = async (roomId: string) => {
    if (!user) return;
    setFollowedRoomIds((prev) => ({ ...prev, [roomId]: true }));
    try {
      const { error } = await supabase
        .from("room_observers")
        .upsert({ room_id: roomId, observer_id: user.id });
      if (error) throw error;
      toast.success("Now watching this build!");
      queryClient.invalidateQueries({ queryKey: ["observer-stats", user.id] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.observedRooms(user.id) });
    } catch (err: any) {
      setFollowedRoomIds((prev) => ({ ...prev, [roomId]: false }));
      toast.error(`Failed: ${err.message}`);
    }
  };

  const handleUnfollowRoom = async (roomId: string) => {
    if (!user) return;
    setFollowedRoomIds((prev) => ({ ...prev, [roomId]: false }));
    try {
      const { error } = await supabase
        .from("room_observers")
        .delete()
        .eq("room_id", roomId)
        .eq("observer_id", user.id);
      if (error) throw error;
      toast.success("Stopped watching this build.");
      queryClient.invalidateQueries({ queryKey: ["observer-stats", user.id] });
      queryClient.invalidateQueries({ queryKey: ["observed-rooms", user.id] });
    } catch (err: any) {
      setFollowedRoomIds((prev) => ({ ...prev, [roomId]: true }));
      toast.error(`Failed: ${err.message}`);
    }
  };

  const statsCards = [
    { label: "Followed rooms", value: observerStats?.roomsFollowed ?? 0, icon: <Eye className="w-3.5 h-3.5" />, color: "text-primary-400", bg: "bg-primary-500/10", delta: "tracking progress", deltaColor: "text-primary-400" },
    { label: "Reactions given", value: observerStats?.totalReactions ?? 0, icon: <MessagesSquare className="w-3.5 h-3.5" />, color: "text-amber-500", bg: "bg-amber-500/10", delta: "insights shared", deltaColor: "text-amber-500" },
    { label: "Sharp critiques", value: observerStats?.sharpInsights ?? 0, icon: <Flame className="w-3.5 h-3.5" />, color: "text-purple-500", bg: "bg-purple-500/10", delta: "⚡ high signal", deltaColor: "text-purple-500" },
    { label: "Shipped products", value: observerStats?.shippedProducts ?? 0, icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: "text-emerald-500", bg: "bg-emerald-500/10", delta: "witnessed", deltaColor: "text-emerald-500" },
  ];

  return (
    <div className="w-full max-w-[1180px] mx-auto px-4 sm:px-6 py-4 sm:py-8">

      {/* ── HEADER — compact on mobile ── */}
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-[#111111] border border-white/10 flex items-center justify-center overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] shrink-0">
          <UserAvatar userId={user?.id || ''} name={profile?.name || user?.email} avatarUrl={profile?.avatar || profile?.avatarUrl || profile?.avatar_url} className="w-full h-full object-cover scale-110" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-[18px] sm:text-[26px] text-white leading-tight tracking-tight m-0 truncate">
            {greeting}, <span className="text-primary-400">{firstName} 👋</span>
          </h1>
          {/* Badges + CTA on same row */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-purple-500/20 bg-purple-500/10 text-purple-400 text-[10px] font-mono font-bold uppercase">
              <Eye className="w-3 h-3" /> Observer
            </span>
            {profile?.domain && (
              <span className="px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-slate-500 text-[10px] font-mono font-bold uppercase hidden sm:inline-flex">
                {profile.domain}
              </span>
            )}
            <span className="px-2 py-0.5 rounded-full border border-primary-400/20 bg-primary-400/10 text-primary-400 text-[10px] font-mono font-bold uppercase">
              Rep {profile?.reputation || 0}
            </span>
            <div className="ml-auto flex items-center gap-2">
              <Link
                to="/dashboard/followed-rooms"
                className="inline-flex sm:hidden items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-full text-[11px] font-bold shadow-sm transition-all shrink-0"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Following</span>
              </Link>
              <Link
                to="/dashboard/explore"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-500 hover:bg-[#5b4ed6] text-white rounded-full text-[11px] sm:text-[13px] font-bold shadow-[0_2px_8px_rgba(108,92,231,0.2)] transition-all focus-ring shrink-0"
              >
                <Compass className="w-3.5 h-3.5" />
                <span className="hidden xs:inline sm:inline">Explore builders</span>
                <span className="inline sm:hidden xs:hidden">Explore</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── STATS — horizontal scroll on mobile, 4-col on desktop ── */}
      <div className="flex overflow-x-auto gap-3 sm:gap-4 pb-2 sm:pb-0 mb-5 sm:mb-8 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-4">
        {statsCards.map((s, i) => {
          const innerContent = (
            <>
              <div className={`w-8 h-8 rounded-xl ${s.bg} ${s.color} flex items-center justify-center shrink-0`}>
                {s.icon}
              </div>
              <div className="min-w-0">
                <div className={`font-bold text-[22px] sm:text-[28px] tracking-tight leading-none ${s.color}`}>{s.value}</div>
                <div className="text-[10px] sm:text-[11px] text-slate-400 lowercase mt-0.5 font-mono font-medium leading-tight">{s.label}</div>
                <div className={`text-[10px] font-bold mt-0.5 hidden sm:block ${s.deltaColor}`}>{s.delta}</div>
              </div>
            </>
          );

          const baseClasses = "bg-transparent border border-slate-800 rounded-[14px] p-4 flex items-center gap-3 shadow-sm shrink-0 snap-start w-[160px] sm:w-auto sm:flex-col sm:items-start sm:justify-between sm:min-h-[110px] sm:p-5";
          
          if (s.label === "Followed rooms") {
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="shrink-0 snap-start w-[160px] sm:w-auto"
              >
                <Link 
                  to="/dashboard/followed-rooms" 
                  className={`${baseClasses} h-full hover:border-primary-400 hover:shadow-md transition-all cursor-pointer`}
                >
                  {innerContent}
                </Link>
              </motion.div>
            );
          }

          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className={baseClasses}
            >
              {innerContent}
            </motion.div>
          );
        })}
      </div>

      {/* ── MAIN GRID ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-8">

        {/* ── CENTER: LIVE FEED ── */}
        <div>
          <div className="flex items-center gap-2 mb-5">
            <div className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">Live feed</div>
            <div className="h-px bg-white/10 flex-1 ml-2" />
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{observerStats?.roomsFollowed ?? 0} rooms followed</span>
            </div>
          </div>

          {/* Filter chips — horizontal scroll on mobile */}
          <div className="flex gap-2 mb-4 sm:mb-5 overflow-x-auto pb-1 snap-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {["all", "product", "design", "engineering"].map((chip) => (
              <button
                key={chip}
                onClick={() => setActiveFilter(chip)}
                className={`px-3 py-1.5 min-h-[36px] rounded-full text-[12px] font-bold capitalize transition-all border focus-ring shrink-0 snap-start ${
                  activeFilter === chip
                    ? "bg-primary-500 border-primary-500 text-white shadow-[0_0_10px_rgba(108,92,231,0.3)]"
                    : "bg-[#111111] border-white/10 text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Feed */}
          <div className="flex flex-col gap-4 mb-12">
            {dbUpdates.length === 0 && filteredUpdates.length === 0 ? (
              <div className="p-8 sm:p-12 text-center text-slate-400 text-[14px] font-medium bg-[#0a0a0a] border border-white/5 rounded-[24px] shadow-sm">
                <div className="text-3xl mb-3">☕</div>
                <p className="font-semibold text-slate-300 mb-1">No builds in your feed yet</p>
                <p className="text-[13px]">Follow some builders or rooms to see their updates here.</p>
                <Link
                  to="/dashboard/explore"
                  className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-primary-500 text-white rounded-full text-[12px] font-bold hover:bg-[#5b4ed6] transition-all"
                >
                  <Compass className="w-3.5 h-3.5" /> Explore builders
                </Link>
              </div>
            ) : filteredUpdates.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-[14px] font-medium bg-[#0a0a0a] border border-white/5 rounded-[24px] shadow-sm">
                No builds matching this filter.
              </div>
            ) : (
              filteredUpdates.map((upd) => {
                const reactions = upd.reactions || [];
                const userActiveType = reactions.find((r: any) => r.observerId === user?.id)?.type || null;

                const getCount = (type: string) => {
                  const key = `${upd.id}-${type}`;
                  const serverCount = reactions.filter((r: any) => r.type === type).length;
                  if (optimisticReactions[key] !== undefined) {
                    const wasActive = reactions.some((r: any) => r.type === type && r.observerId === user?.id);
                    return serverCount + (optimisticReactions[key] === type && !wasActive ? 1 : (!optimisticReactions[key] && wasActive ? -1 : 0));
                  }
                  return serverCount;
                };

                if (upd.updateType === 'crossroad') {
                  return (
                    <motion.div
                      key={upd.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mb-6"
                    >
                      <CrossroadCard update={upd} />
                    </motion.div>
                  );
                }

                return (
                  <motion.div
                    key={upd.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-[#0a0a0a] border border-white/5 shadow-2xl rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] hover:border-white/10 hover:bg-[#111] transition-all duration-300 relative group overflow-hidden"
                  >
                    {/* Subtle background glow on hover */}
                    <div className="absolute -inset-24 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-500 pointer-events-none" />
                    
                    <div className="relative z-10">
                      {/* Header */}
                      <div className="flex justify-between items-start gap-3 mb-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl shrink-0 border border-white/10 overflow-hidden bg-[#1a1a1a]">
                            <UserAvatar userId={upd.authorId} name={upd.authorName} avatarUrl={upd.authorAvatar} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                              <span className="font-extrabold text-[14px] sm:text-[15px] text-white flex items-center gap-1.5 min-w-0 max-w-full">
                                <span className="truncate block leading-tight">{upd.authorName}</span>
                                <VerifiedTick isVerified={!!upd.authorIsVerifiedExpert} className="w-3.5 h-3.5 shrink-0" />
                              </span>
                              <span className="text-[12px] text-slate-400 font-medium truncate leading-tight">
                                in {upd.rooms?.title || "Build Room"}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              {timeAgo(upd.createdAt)}
                            </div>
                          </div>
                        </div>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border shrink-0 ${classifyUpdate(upd.content).tagClass}`}>
                          {classifyUpdate(upd.content).tag}
                        </span>
                      </div>
  
                      {/* Content */}
                      <p className="text-[14px] sm:text-[15px] text-slate-300 leading-relaxed mb-4 whitespace-pre-wrap break-words">
                        {upd.content}
                      </p>
  
                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-3 border-t border-white/5 flex-wrap">
                      {(
                        [
                          { type: "sharp" as const, label: "✦ Sharp", activeClass: "bg-primary-500/10 border-primary-500/20 text-primary-400" },
                          { type: "pushback" as const, label: "↩ Push back", activeClass: "bg-rose-500/10 border-rose-500/20 text-rose-500" },
                          { type: "tellmemore" as const, label: "? Tell me more", activeClass: "bg-blue-500/10 border-blue-500/20 text-blue-500" },
                        ] as const
                      ).map((rxn) => {
                        const key = `${upd.id}-${rxn.type}`;
                        const isActive = optimisticReactions[key] !== undefined
                          ? optimisticReactions[key] === rxn.type
                          : userActiveType === rxn.type;

                        return (
                          <motion.button
                            key={rxn.type}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleToggleReaction(upd.id, upd.roomId, rxn.type, reactions)}
                            className={`px-3 py-1.5 rounded-full text-[11px] sm:text-[12px] font-bold transition-colors border flex items-center gap-1.5 focus-ring ${
                              isActive
                                ? rxn.activeClass
                                : "bg-white/5 shadow-sm border-white/10 text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/20"
                            }`}
                          >
                            <span>{rxn.label}</span>
                            <span className="opacity-40">·</span>
                            <span>{getCount(rxn.type)}</span>
                          </motion.button>
                        );
                      })}

                      {/* Follow / Unfollow */}
                      {(() => {
                        const isFollowing = observedRoomIds.has(upd.roomId) || !!followedRoomIds[upd.roomId];
                        return isFollowing ? (
                          <button
                            onClick={() => handleUnfollowRoom(upd.roomId)}
                            className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-full flex items-center gap-1 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20 transition-all group/fw min-h-[36px]"
                          >
                            <CheckCircle2 className="w-3 h-3 group-hover/fw:hidden" />
                            <span className="group-hover/fw:hidden">Following</span>
                            <span className="hidden group-hover/fw:inline">Unfollow</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleFollowRoom(upd.roomId)}
                            className="text-[11px] font-bold text-slate-300 bg-white/5 border border-white/10 hover:bg-primary-500/10 hover:text-primary-400 hover:border-primary-500/20 px-2.5 py-1.5 rounded-full transition-all focus-ring min-h-[36px]"
                          >
                            + Follow
                          </button>
                        );
                      })()}

                      <div className="flex items-center w-full mt-2 sm:mt-0 sm:w-auto sm:ml-auto justify-end">
                        <Link
                          to={`/dashboard/room/${upd.roomId}`}
                          className="text-[12px] font-bold text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-1 shrink-0 bg-primary-500/5 hover:bg-primary-500/10 px-3 py-1.5 rounded-full"
                        >
                          View room <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* ── RIGHT RAIL ── */}
        <div className="flex flex-col gap-6">

          {/* Watching now — real followed rooms */}
          <div className="bg-[#111111]/80 backdrop-blur-xl border border-white/10 shadow-2xl rounded-[20px] p-5">
            <div className="text-[11px] uppercase tracking-widest text-slate-400 font-bold mb-4">Watching now</div>
            {observedRooms.length === 0 ? (
              <div className="text-[13px] text-slate-500 font-medium text-center py-4">
                No rooms followed yet.<br />
                <Link to="/dashboard/explore" className="text-primary-400 hover:text-white transition-colors font-bold">Explore builders →</Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {observedRooms.slice(0, 5).map((room: any) => {
                  const initials = (room.builderName || room.title || "?")
                    .split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
                  const colorClass = getColorClass(room.builderId || room.title);
                  const latestUpdateDate = room.latestUpdate?.createdAt ? new Date(room.latestUpdate.createdAt) : null;
                  const isActive = latestUpdateDate ? (Date.now() - latestUpdateDate.getTime() < 6 * 60 * 60 * 1000) : false;
                  return (
                    <Link
                      key={room.id}
                      to={`/dashboard/room/${room.id}`}
                      className="flex items-center gap-3 group"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[11px] shrink-0 relative ${colorClass}`}>
                        {initials}
                        {isActive && (
                          <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 border-white/10"></span>
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-bold text-white truncate group-hover:text-primary-400 transition-colors">
                          {room.title}
                        </div>
                        <div className={`text-[11px] font-mono ${isActive ? "text-emerald-500 font-bold" : "text-slate-400"}`}>
                          {isActive ? `Live · Updated ${timeAgo(room.latestUpdate.createdAt)}` : `Day ${room.updateCount ?? 0}`}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Suggested for you — real public rooms */}
          <div className="bg-[#111111]/80 backdrop-blur-xl border border-white/10 shadow-2xl rounded-[20px] p-5">
            <div className="text-[11px] uppercase tracking-widest text-slate-400 font-bold mb-4">Suggested for you</div>
            {suggestedRooms.length === 0 ? (
              <div className="text-[13px] text-slate-500 font-medium text-center py-4">
                You're following all active rooms!
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {suggestedRooms.map((room: any) => (
                  <div key={room.id} className="border border-white/10 rounded-[14px] p-4 hover:border-primary-400/30 bg-white/5 hover:bg-white/10 transition-all group">
                    <div className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-wider mb-1">
                      {room.tags?.[0] || "Product"}
                    </div>
                    <div className="text-[13px] font-bold text-white mb-1 group-hover:text-primary-400 transition-colors truncate">
                      {room.title}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mb-3">
                      {room.updateCount ?? 0} updates · {room.observerCount ?? 0} observers
                    </div>
                    <button
                      onClick={() => handleFollowRoom(room.id)}
                      disabled={!!followedRoomIds[room.id]}
                      className={`w-full py-1.5 rounded-full text-[12px] font-bold transition-all focus-ring border ${
                        followedRoomIds[room.id]
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : "bg-primary-500 border-primary-500 text-white hover:bg-[#5b4ed6]"
                      }`}
                    >
                      {followedRoomIds[room.id] ? "Following ✓" : "+ Follow room"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Your activity */}
          <div className="bg-[#111111]/80 backdrop-blur-xl border border-white/10 shadow-2xl rounded-[20px] p-5">
            <div className="text-[11px] uppercase tracking-widest text-slate-400 font-bold mb-4">Your activity this week</div>
            {[
              { label: "Reactions given", value: observerStats?.totalReactions ?? 0, color: "text-white" },
              { label: "Rooms followed", value: observerStats?.roomsFollowed ?? 0, color: "text-white" },
              { label: "Sharp critiques", value: observerStats?.sharpInsights ?? 0, color: "text-primary-400" },
              { label: "Domain reputation", value: profile?.reputation ? `${profile.reputation} ★` : "0 ★", color: "text-amber-500" },
            ].map((row, i, arr) => (
              <div key={i} className={`flex justify-between items-center py-2.5 ${i < arr.length - 1 ? "border-b border-white/10" : ""}`}>
                <span className="text-[13px] text-slate-400 font-medium">{row.label}</span>
                <span className={`text-[13px] font-bold font-mono ${row.color}`}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Weekly digest */}
          <div className="bg-slate-900 rounded-[20px] p-5 text-white">
            <div className="text-[15px] font-bold italic mb-2">This week's best builds</div>
            <div className="text-[12px] text-slate-400 leading-relaxed mb-4">
              Top build logs picked by the community this week. Follow more builders to see their progress.
            </div>
            <Link
              to="/dashboard/build-logs"
              className="text-[11px] font-mono font-bold text-amber-400 hover:text-amber-300 transition-colors"
            >
              Read the digest →
            </Link>
          </div>

          {/* Progression panel */}
          <ObserverProgressionPanel />
        </div>
      </div>
    </div>
  );
}
