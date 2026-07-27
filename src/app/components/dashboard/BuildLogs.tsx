import { useState } from "react";
import { Link } from "react-router";
import { Sparkles, CheckCircle2, Flame, Clock, Edit3, Share2, ArrowUpRight, TrendingUp, Archive, Compass } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth, supabase } from "../auth/AuthContext";
import { useUserRooms, useRooms } from "../../hooks/useRooms";
import { getObserverCount, timeAgo } from "../../utils/helpers";
import { ObserverAvatarStack } from "../ui/ObserverAvatarStack";
import { UserAvatar } from "../ui/UserAvatar";
import { QUERY_KEYS } from "../../constants";
import { ActiveBuildCard, ShippedBuildCard, CompletedBuildCard } from "./BuildLogCards";

function timeAgoDays(iso: string) {
  if (!iso) return 1;
  const diff = Date.now() - new Date(iso).getTime();
  return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function formatDate(iso: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function BuildLogs() {
  const [buildLogFilter, setBuildLogFilter] = useState("all");
  const { user, profile } = useAuth();
  const isObserver = profile?.role === 'observer';

  // Builders see their own rooms; observers see all public rooms
  const { data: myRoomsData, isLoading: builderLoading } = useUserRooms(!isObserver ? user?.id : undefined);
  const { data: publicRoomsData, isLoading: publicLoading } = useRooms();

  const isLoading = isObserver ? publicLoading : builderLoading;
  const myRooms = isObserver
    ? (publicRoomsData?.pages.flat() || [])
    : (myRoomsData?.pages.flat() || []);

  const queryClient = useQueryClient();
  const [archivingId, setArchivingId] = useState<string | null>(null);

  const handleArchiveRoom = async (roomId: string) => {
    setArchivingId(roomId);
    try {
      const { error } = await supabase.from('rooms').update({ status: 'archived' }).eq('id', roomId);
      if (error) throw error;
      toast.success('Room archived successfully');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userRooms(user!.id) });
    } catch (err: unknown) {
      toast.error('Failed to archive room: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setArchivingId(null);
    }
  };

  const activeRooms = myRooms.filter(r => r.status === 'active' || !r.status);
  const shippedRooms = myRooms.filter(r => r.status === 'shipped');
  const completedRooms = myRooms.filter(r => r.status === 'completed');
  const stalledRooms = myRooms.filter(r => r.status === 'paused' || r.status === 'stalled');

  if (isLoading) {
    return <div className="p-8 text-slate-400">Loading build logs...</div>;
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1100px] w-full mx-auto px-4 sm:px-6 py-8 overflow-hidden">
      {/* Header + metrics */}
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-[28px] sm:text-[32px] font-extrabold text-slate-100 m-0 mb-1 font-display tracking-tight leading-tight">
            {isObserver ? 'Build logs' : 'Build logs'}
          </h2>
          <p className="text-[13px] text-slate-400 m-0 font-medium">
            {isObserver
              ? 'Active, shipped, and completed builds across Patchwork.'
              : 'Compiled histories of your completed, in-progress, and stalled rooms.'}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:gap-3 sm:justify-end">
          {[
            { label: "Active", count: activeRooms.length, color: "text-amber-500", dot: "bg-amber-500" },
            { label: "Shipped", count: shippedRooms.length, color: "text-emerald-500", dot: "bg-emerald-500" },
            { label: "Completed", count: completedRooms.length, color: "text-primary-400", dot: "bg-primary-400" },
            { label: "Stalled", count: stalledRooms.length, color: "text-rose-500", dot: "bg-rose-500" },
          ].map(m => (
            <div key={m.label} className="bg-transparent border border-slate-800 rounded-2xl py-2.5 px-2 sm:py-3 sm:px-4 text-center shadow-sm">
              <div className={`text-[18px] sm:text-[24px] font-black font-display leading-none ${m.color}`}>{m.count}</div>
              <div className="flex items-center justify-center gap-1 sm:gap-1.5 mt-1.5 sm:mt-2">
                <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest">{m.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 mb-6 overflow-x-auto whitespace-nowrap scrollbar-hide snap-x pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
        {["all", "active", "shipped", "completed", "stalled", "product", "engineering", "design"].map(f => (
          <button
            key={f}
            onClick={() => setBuildLogFilter(f)}
            className={`px-4 sm:px-5 py-2.5 min-h-[44px] sm:min-h-auto rounded-full text-[13px] sm:text-[14px] font-bold capitalize transition-all snap-start active:scale-95 border focus-ring ${
              buildLogFilter === f
                ? 'bg-slate-800 text-white border-slate-700 shadow-sm'
                : 'bg-transparent text-slate-400 border-slate-700 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            {f === "all" ? "All logs" : f}
          </button>
        ))}
      </div>

      {/* ── ACTIVE cards ── */}
      {(buildLogFilter === "all" || buildLogFilter === "active" || activeRooms.some(r => r.tags?.[0] === buildLogFilter)) && (
        <div className="flex flex-col gap-4 sm:gap-6">
          {activeRooms.filter(r => buildLogFilter === "all" || buildLogFilter === "active" || r.tags?.[0] === buildLogFilter).map(room => (
              <ActiveBuildCard 
                key={room.id} 
                room={room} 
                isObserver={isObserver} 
                handleArchiveRoom={handleArchiveRoom} 
                archivingId={archivingId} 
              />
          ))}
        </div>
      )}

      {/* ── SHIPPED cards ── */}
      {(buildLogFilter === "all" || buildLogFilter === "shipped" || shippedRooms.some(r => r.tags?.[0] === buildLogFilter)) && shippedRooms.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 mt-6">
          {shippedRooms.filter(r => buildLogFilter === "all" || buildLogFilter === "shipped" || r.tags?.[0] === buildLogFilter).map(log => {
            return <ShippedBuildCard key={log.id} log={log} />;
          })}
        </div>
      )}

      {/* ── COMPLETED cards ── */}
      {(buildLogFilter === "all" || buildLogFilter === "completed" || completedRooms.some(r => r.tags?.[0] === buildLogFilter)) && completedRooms.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 mt-6">
          {completedRooms.filter(r => buildLogFilter === "all" || buildLogFilter === "completed" || r.tags?.[0] === buildLogFilter).map(log => {
            return <CompletedBuildCard key={log.id} log={log} />;
          })}
        </div>
      )}

      {/* ── STALLED cards + New Room placeholder ── */}
      {(buildLogFilter === "all" || buildLogFilter === "stalled" || stalledRooms.some(r => r.tags?.[0] === buildLogFilter)) && (

        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2 mt-6">
          {stalledRooms.filter(r => buildLogFilter === "all" || buildLogFilter === "stalled" || r.tags?.[0] === buildLogFilter).map(room => {
            const daysSinceUpdate = timeAgoDays(room.updatedAt);
            
            return (
              <div key={room.id} className="bg-white border border-rose-500/20 rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 flex flex-col gap-4 sm:gap-5 relative overflow-hidden shadow-sm group hover:border-rose-500/40 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500" tabIndex={0}>
                <div className="absolute top-0 right-0 p-24 bg-rose-500/5 rounded-full blur-[50px] -mr-12 -mt-12 pointer-events-none" />
                
                <div className="flex items-start gap-3 sm:gap-4 relative w-full mb-1">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0 shadow-sm">
                    <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="m-0 text-[15px] sm:text-[16px] font-extrabold text-slate-900 font-display line-clamp-2 break-words mb-1.5">{room.title}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        {room.builderAvatarUrl ? (
                          <UserAvatar userId={room.builderId || ''} name={room.builderName} avatarUrl={room.builderAvatarUrl} className="w-5 h-5 rounded-full object-cover border border-slate-200" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-500 uppercase border border-slate-200">
                            {room.builderName?.substring(0, 2) || '??'}
                          </div>
                        )}
                        <span className="text-[12px] font-bold text-slate-700">{room.builderName}</span>
                        {room.projectStage && (
                          <>
                            <span className="text-slate-300">·</span>
                            <span className="text-[10px] font-bold text-primary-500 bg-primary-50 px-1.5 py-0.5 rounded uppercase tracking-wide border border-primary-100">{room.projectStage}</span>
                          </>
                        )}
                      </div>
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span className="text-[9px] sm:text-[10px] font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full uppercase tracking-wide border border-rose-200">Stalled</span>
                    </div>
                    <p className="m-0 text-[11px] sm:text-[12px] text-slate-500 font-mono font-medium truncate">Last update {daysSinceUpdate} days ago</p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 relative shadow-inner">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={14} className="text-rose-500" />
                    <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Patchwork Nudge</span>
                  </div>
                  <p className="text-[12px] sm:text-[13px] text-slate-700 m-0 leading-relaxed font-medium">
                    {daysSinceUpdate} days without an update. Observers lose momentum when rooms go quiet — even a short note on why you paused keeps your reputation intact.
                  </p>
                </div>

                <div className="flex flex-row gap-2 relative mt-auto">
                  {!isObserver && (
                    <Link to={`/dashboard/room/${room.id}?action=post`}
                      title="Post update"
                      aria-label="Post update"
                      className="inline-flex items-center justify-center w-11 h-11 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-xl active:scale-95 transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500">
                      <Edit3 size={18} />
                    </Link>
                  )}
                  {!isObserver && (
                    <button
                      onClick={() => handleArchiveRoom(room.id)}
                      disabled={archivingId === room.id}
                      title="Archive room"
                      aria-label="Archive room"
                      className="inline-flex items-center justify-center w-11 h-11 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 rounded-xl active:scale-95 transition-all shadow-sm focus-ring disabled:opacity-50">
                      {archivingId === room.id ? <span className="w-4 h-4 border-2 border-slate-300 border-t-rose-600 rounded-full animate-spin" /> : <Archive size={18} />}
                    </button>
                  )}
                  <Link to={`/dashboard/room/${room.id}`}
                    title="View room"
                    aria-label="View room"
                    className="inline-flex items-center justify-center w-11 h-11 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl active:scale-95 transition-all shadow-sm focus-ring">
                    <ArrowUpRight size={18} />
                  </Link>
                </div>
              </div>
            );
          })}

          {/* New Room Placeholder — only for builders */}
          {!isObserver && (
            <Link to="/dashboard/create" className="bg-white border-2 border-dashed border-slate-200 hover:border-primary-500/30 hover:bg-slate-50 rounded-[20px] sm:rounded-[24px] p-6 flex flex-col items-center justify-center gap-4 min-h-[220px] sm:min-h-[260px] cursor-pointer active:scale-95 transition-all group shadow-sm focus-ring">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border-2 border-dashed border-slate-200 group-hover:border-primary-500/30 flex items-center justify-center bg-slate-50 group-hover:bg-primary-500/5 transition-colors">
                <span className="text-[24px] sm:text-[28px] text-slate-400 group-hover:text-primary-400 font-light leading-none transition-colors">+</span>
              </div>
              <div className="text-center">
                <h3 className="m-0 mb-1.5 text-[14px] sm:text-[15px] font-extrabold text-slate-900 group-hover:text-primary-500 font-display transition-colors">Open a new build room</h3>
                <p className="m-0 text-[12px] sm:text-[13px] text-slate-500 group-hover:text-slate-600 transition-colors font-medium">Start streaming your next project</p>
              </div>
            </Link>
          )}
        </div>
      )}

      {/* ── EMPTY STATE ── */}
      {(() => {
        let hasVisibleRooms = false;
        
        if (buildLogFilter === "all") {
          hasVisibleRooms = myRooms.length > 0;
        } else if (buildLogFilter === "active") {
          hasVisibleRooms = activeRooms.length > 0;
        } else if (buildLogFilter === "shipped") {
          hasVisibleRooms = shippedRooms.length > 0;
        } else if (buildLogFilter === "completed") {
          hasVisibleRooms = completedRooms.length > 0;
        } else if (buildLogFilter === "stalled") {
          hasVisibleRooms = stalledRooms.length > 0;
        } else {
          hasVisibleRooms = myRooms.some(r => r.tags?.[0] === buildLogFilter);
        }

        if (!hasVisibleRooms) {
          return (
            <div className="flex flex-col items-center justify-center py-24 px-4 text-center border-2 border-dashed border-slate-200 rounded-[24px] mt-8 bg-white/50">
              <div className="w-16 h-16 bg-white border border-slate-100 rounded-2xl flex items-center justify-center mb-5 shadow-sm">
                <Archive className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-[18px] font-extrabold text-slate-900 mb-2 font-display">No logs found</h3>
              <p className="text-[14px] text-slate-500 max-w-[280px] mb-8 font-medium">
                {isObserver
                  ? `No public ${buildLogFilter === 'all' ? '' : buildLogFilter + ' '}builds found right now.`
                  : buildLogFilter === 'all'
                    ? "You haven't opened any build rooms yet."
                    : `You don't have any ${buildLogFilter} build logs right now.`}
              </p>
              {isObserver ? (
                <Link to="/dashboard/explore" className="bg-primary-500 hover:bg-[#5b4ed6] text-white px-6 py-3 rounded-xl font-bold text-[14px] shadow-sm transition-all active:scale-95 inline-flex items-center gap-2">
                  <Compass size={16} /> Explore builders
                </Link>
              ) : (
                <Link to="/dashboard/create" className="bg-[#0F172A] hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold text-[14px] shadow-sm transition-all active:scale-95 inline-flex items-center gap-2">
                  <Sparkles size={16} /> Open a new room
                </Link>
              )}
            </div>
          );
        }
        return null;
      })()}
    </div>
  );
}
