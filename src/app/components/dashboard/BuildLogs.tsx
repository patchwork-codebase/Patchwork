import { useState } from "react";
import { Link } from "react-router";
import { Sparkles, CheckCircle2, Flame, Clock, Edit3, Share2, ArrowUpRight, TrendingUp, Archive } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { useUserRooms } from "../../hooks/useRooms";

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
  const { user } = useAuth();
  const { data: myRoomsData, isLoading } = useUserRooms(user?.id);
  const myRooms = myRoomsData?.pages.flat() || [];

  const activeRooms = myRooms.filter(r => r.status === 'active' || !r.status);
  const shippedRooms = myRooms.filter(r => r.status === 'shipped');
  const stalledRooms = myRooms.filter(r => r.status === 'paused' || r.status === 'stalled');

  if (isLoading) {
    return <div className="p-8 text-slate-400">Loading build logs...</div>;
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1100px] w-full mx-auto px-4 sm:px-6 py-8 overflow-hidden">
      {/* Header + metrics */}
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-[28px] sm:text-[32px] font-extrabold text-white m-0 mb-1 font-display tracking-tight leading-tight">Build logs</h2>
          <p className="text-[13px] text-slate-400 m-0 font-medium">Compiled histories of your completed, in-progress, and stalled rooms.</p>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:gap-3 sm:justify-end">
          {[
            { label: "Active", count: activeRooms.length, color: "text-amber-400", dot: "bg-amber-400" },
            { label: "Shipped", count: shippedRooms.length, color: "text-emerald-400", dot: "bg-emerald-400" },
            { label: "Stalled", count: stalledRooms.length, color: "text-rose-400", dot: "bg-rose-400" },
          ].map(m => (
            <div key={m.label} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl py-2.5 px-2 sm:py-3 sm:px-4 text-center shadow-[0_1px_3px_rgba(0,0,0,0.2)] backdrop-blur-md">
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
        {["all", "active", "shipped", "stalled", "product", "engineering", "design"].map(f => (
          <button
            key={f}
            onClick={() => setBuildLogFilter(f)}
            className={`px-4 sm:px-5 py-2.5 min-h-[44px] sm:min-h-auto rounded-full text-[13px] sm:text-[14px] font-bold capitalize transition-all snap-start active:scale-95 border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8] ${
              buildLogFilter === f
                ? 'bg-white/10 text-white border-white/20 shadow-sm'
                : 'bg-white/[0.02] text-slate-400 border-white/[0.06] hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            {f === "all" ? "All logs" : f}
          </button>
        ))}
      </div>

      {/* ── ACTIVE cards ── */}
      {(buildLogFilter === "all" || buildLogFilter === "active" || activeRooms.some(r => r.tags?.[0] === buildLogFilter)) && (
        <div className="flex flex-col gap-4 sm:gap-6">
          {activeRooms.filter(r => buildLogFilter === "all" || buildLogFilter === "active" || r.tags?.[0] === buildLogFilter).map(room => {
            const daysActive = timeAgoDays(room.createdAt);
            const tag = room.tags?.[0] || 'product';
            return (
              <div key={room.id} className="bg-amber-500/[0.02] border border-amber-500/[0.15] rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 relative overflow-hidden backdrop-blur-md shadow-xl group hover:border-amber-500/30 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500" tabIndex={0}>
                <div className="absolute top-0 right-0 p-32 bg-amber-500/5 rounded-full blur-[60px] -mr-16 -mt-16 pointer-events-none" />
                
                <div className="flex justify-between items-start mb-5 relative">
                  <div className="flex gap-3 sm:gap-4 w-full">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 shadow-sm">
                      <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="m-0 text-[15px] sm:text-[16px] font-extrabold text-white font-display truncate">{room.title}</h3>
                        <span className="text-[9px] sm:text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full uppercase tracking-wide border border-amber-500/20">Active</span>
                        <span className="text-[9px] sm:text-[10px] font-bold text-[#8B7CF8] bg-[#6C5CE7]/10 border border-[#6C5CE7]/20 px-2 py-0.5 rounded-full uppercase tracking-wider">{tag}</span>
                      </div>
                      <p className="m-0 text-[11px] sm:text-[12px] text-slate-400 font-mono font-medium truncate">Day {daysActive} of build · {room.updateCount} updates · {room.observerCount} observers</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 mb-5 relative md:grid-cols-2">
                  <div className="bg-[#0A0910]/50 border border-white/[0.06] rounded-xl p-4 flex flex-col justify-center shadow-inner">
                    <div className="flex justify-between text-[11px] sm:text-[12px] font-bold mb-2.5">
                      <span className="text-slate-400 uppercase tracking-wide">Build progress</span>
                      <span className="text-amber-400">Day {daysActive}</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full w-[60%] bg-gradient-to-r from-amber-500 to-amber-300 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                    </div>
                  </div>
                  
                  <div className="bg-[#0A0910]/50 border border-white/[0.06] rounded-xl p-4 flex flex-col justify-center shadow-inner">
                    <div className="flex items-center justify-between">
                       <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><TrendingUp size={14}/> Updates</span>
                       <div className="flex items-baseline gap-1">
                          <span className="text-[20px] sm:text-[24px] font-black text-amber-400 font-display leading-none">{room.updateCount}</span>
                          <span className="text-[10px] sm:text-[11px] text-slate-400 font-bold uppercase tracking-wide">total</span>
                       </div>
                    </div>
                  </div>
                </div>

                {room.lastUpdate && (
                  <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4 mb-5 relative">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-500" /> Latest update</div>
                    <p className="text-[13px] sm:text-[14px] text-slate-300 italic m-0 leading-relaxed font-medium line-clamp-2">
                      "{room.lastUpdate}"
                    </p>
                  </div>
                )}

                <div className="flex flex-row gap-2 relative mt-auto">
                  <Link to={`/dashboard/room/${room.id}?action=post`}
                    title="Post update"
                    aria-label="Post update"
                    className="inline-flex items-center justify-center w-11 h-11 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 rounded-xl active:scale-95 transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
                    <Edit3 size={18} />
                  </Link>
                  <Link to={`/dashboard/room/${room.id}`}
                    title="Open room"
                    aria-label="Open room"
                    className="inline-flex items-center justify-center w-11 h-11 bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] text-white rounded-xl active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                    <ArrowUpRight size={18} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── SHIPPED cards ── */}
      {(buildLogFilter === "all" || buildLogFilter === "shipped" || shippedRooms.some(r => r.tags?.[0] === buildLogFilter)) && shippedRooms.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 mt-6">
          {shippedRooms.filter(r => buildLogFilter === "all" || buildLogFilter === "shipped" || r.tags?.[0] === buildLogFilter).map(log => {
            const tag = log.tags?.[0] || 'product';
            const daysActive = timeAgoDays(log.createdAt);
            
            return (
              <div key={log.id} className="bg-emerald-500/[0.02] border border-emerald-500/[0.15] rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 flex flex-col gap-4 sm:gap-5 relative overflow-hidden backdrop-blur-md shadow-xl group hover:border-emerald-500/30 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500" tabIndex={0}>
                <div className="absolute top-0 right-0 p-24 bg-emerald-500/5 rounded-full blur-[50px] -mr-12 -mt-12 pointer-events-none" />
                
                <div className="flex justify-between items-start relative mb-1">
                  <div className="flex gap-3 sm:gap-4 w-full">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-sm">
                      <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="m-0 text-[15px] sm:text-[16px] font-extrabold text-white font-display truncate">{log.title}</h3>
                        <span className="text-[9px] sm:text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-wide border border-emerald-500/20">Shipped</span>
                      </div>
                      <p className="m-0 text-[11px] sm:text-[12px] text-slate-400 font-mono font-medium truncate">Shipped {formatDate(log.updatedAt)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 sm:gap-3 relative">
                  <div className="bg-[#0A0910]/50 border border-white/[0.06] rounded-xl py-2 px-2 text-center flex flex-col justify-center shadow-inner">
                    <div className="text-[15px] sm:text-[16px] font-black text-white font-display leading-none">{log.updateCount}</div>
                    <div className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Updates</div>
                  </div>
                  <div className="bg-[#0A0910]/50 border border-white/[0.06] rounded-xl py-2 px-2 text-center flex flex-col justify-center shadow-inner">
                    <div className="text-[15px] sm:text-[16px] font-black text-white font-display leading-none">{log.observerCount}</div>
                    <div className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Observers</div>
                  </div>
                  <div className="bg-[#0A0910]/50 border border-white/[0.06] rounded-xl py-2 px-2 text-center flex flex-col justify-center shadow-inner">
                    <div className="text-[15px] sm:text-[16px] font-black text-white font-display leading-none">{daysActive}</div>
                    <div className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Days</div>
                  </div>
                </div>

                {log.lastUpdate && (
                  <div className="bg-emerald-500/[0.03] border border-emerald-500/10 rounded-xl p-4 relative">
                    <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Builder's closing note</div>
                    <p className="text-[12px] sm:text-[13px] text-slate-300 italic m-0 font-medium leading-relaxed line-clamp-3">"{log.lastUpdate}"</p>
                  </div>
                )}

                <div className="flex flex-row gap-2 relative mt-auto">
                  <button
                    title="Share"
                    aria-label="Share"
                    className="inline-flex items-center justify-center w-11 h-11 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-xl active:scale-95 transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
                    <Share2 size={18} />
                  </button>
                  <Link to={`/dashboard/room/${log.id}`}
                    title="View log"
                    aria-label="View log"
                    className="inline-flex items-center justify-center w-11 h-11 bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] text-white rounded-xl active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                    <ArrowUpRight size={18} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── STALLED cards + New Room placeholder ── */}
      {(buildLogFilter === "all" || buildLogFilter === "stalled" || stalledRooms.some(r => r.tags?.[0] === buildLogFilter)) && (
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2 mt-6">
          {stalledRooms.filter(r => buildLogFilter === "all" || buildLogFilter === "stalled" || r.tags?.[0] === buildLogFilter).map(room => {
            const daysSinceUpdate = timeAgoDays(room.updatedAt);
            
            return (
              <div key={room.id} className="bg-rose-500/[0.02] border border-rose-500/[0.15] rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 flex flex-col gap-4 sm:gap-5 relative overflow-hidden backdrop-blur-md shadow-xl group hover:border-rose-500/30 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500" tabIndex={0}>
                <div className="absolute top-0 right-0 p-24 bg-rose-500/5 rounded-full blur-[50px] -mr-12 -mt-12 pointer-events-none" />
                
                <div className="flex items-start gap-3 sm:gap-4 relative w-full mb-1">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0 shadow-sm">
                    <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-rose-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="m-0 text-[15px] sm:text-[16px] font-extrabold text-white font-display truncate">{room.title}</h3>
                      <span className="text-[9px] sm:text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full uppercase tracking-wide border border-rose-500/20">Stalled</span>
                    </div>
                    <p className="m-0 text-[11px] sm:text-[12px] text-slate-400 font-mono font-medium truncate">Last update {daysSinceUpdate} days ago</p>
                  </div>
                </div>

                <div className="bg-[#0A0910]/50 border border-rose-500/10 rounded-xl p-4 relative shadow-inner">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={14} className="text-rose-400" />
                    <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Patchwork Nudge</span>
                  </div>
                  <p className="text-[12px] sm:text-[13px] text-slate-300 m-0 leading-relaxed font-medium">
                    {daysSinceUpdate} days without an update. Observers lose momentum when rooms go quiet — even a short note on why you paused keeps your reputation intact.
                  </p>
                </div>

                <div className="flex flex-row gap-2 relative mt-auto">
                  <Link to={`/dashboard/room/${room.id}?action=post`}
                    title="Post update"
                    aria-label="Post update"
                    className="inline-flex items-center justify-center w-11 h-11 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-xl active:scale-95 transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500">
                    <Edit3 size={18} />
                  </Link>
                  <button
                    title="Archive room"
                    aria-label="Archive room"
                    className="inline-flex items-center justify-center w-11 h-11 bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] text-white hover:text-rose-400 hover:border-rose-500/30 rounded-xl active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                    <Archive size={18} />
                  </button>
                </div>
              </div>
            );
          })}

          {/* New Room Placeholder */}
          <Link to="/dashboard/create" className="bg-[#0D0B14] border-2 border-dashed border-white/10 hover:border-white/20 hover:bg-white/[0.02] rounded-[20px] sm:rounded-[24px] p-6 flex flex-col items-center justify-center gap-4 min-h-[220px] sm:min-h-[260px] cursor-pointer active:scale-95 transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8]">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border-2 border-dashed border-white/10 group-hover:border-[#6C5CE7]/30 flex items-center justify-center bg-white/[0.01] group-hover:bg-[#6C5CE7]/5 transition-colors">
              <span className="text-[24px] sm:text-[28px] text-slate-500 group-hover:text-[#8B7CF8] font-light leading-none transition-colors">+</span>
            </div>
            <div className="text-center">
              <h3 className="m-0 mb-1.5 text-[14px] sm:text-[15px] font-extrabold text-slate-300 group-hover:text-white font-display transition-colors">Open a new build room</h3>
              <p className="m-0 text-[12px] sm:text-[13px] text-slate-500 group-hover:text-slate-400 transition-colors font-medium">Start streaming your next project</p>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
