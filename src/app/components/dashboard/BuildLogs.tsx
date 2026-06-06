import { useState } from "react";
import { Link } from "react-router";
import { Sparkles, CheckCircle2, Flame, Clock, Edit3, Share2, ArrowUpRight, TrendingUp } from "lucide-react";
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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-2">
        <div>
          <h2 className="text-[32px] font-extrabold text-white m-0 mb-1 font-display tracking-tight leading-tight">Build logs</h2>
          <p className="text-[13px] text-slate-400 m-0 font-medium">Compiled histories of your completed, in-progress, and stalled rooms.</p>
        </div>
        <div className="flex flex-wrap gap-3 justify-end">
          {[
            { label: "Active", count: activeRooms.length, color: "text-amber-400", dot: "bg-amber-400" },
            { label: "Shipped", count: shippedRooms.length, color: "text-emerald-400", dot: "bg-emerald-400" },
            { label: "Stalled", count: stalledRooms.length, color: "text-rose-400", dot: "bg-rose-400" },
          ].map(m => (
            <div key={m.label} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl py-3 px-4 min-w-[72px] text-center shadow-[0_1px_3px_rgba(0,0,0,0.2)] backdrop-blur-md">
              <div className={`text-[20px] sm:text-[24px] font-black font-display leading-none ${m.color}`}>{m.count}</div>
              <div className="flex items-center justify-center gap-1.5 mt-2">
                <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{m.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 mb-2 bg-white/[0.02] p-1 rounded-xl w-full max-w-[100%] border border-white/[0.06]">
        {["all", "active", "shipped", "stalled", "product", "engineering", "design"].map(f => (
          <button
            key={f}
            onClick={() => setBuildLogFilter(f)}
            className={`px-4 py-2 rounded-lg text-[13px] sm:text-[14px] font-bold font-display capitalize transition-all ${
              buildLogFilter === f
                ? 'bg-white/10 text-white shadow-sm'
                : 'bg-transparent text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            {f === "all" ? "All logs" : f}
          </button>
        ))}
      </div>

      {/* ── ACTIVE cards ── */}
      {(buildLogFilter === "all" || buildLogFilter === "active" || activeRooms.some(r => r.tags?.[0] === buildLogFilter)) && (
        <div className="flex flex-col gap-6">
          {activeRooms.filter(r => buildLogFilter === "all" || buildLogFilter === "active" || r.tags?.[0] === buildLogFilter).map(room => {
            const daysActive = timeAgoDays(room.createdAt);
            const tag = room.tags?.[0] || 'product';
            return (
              <div key={room.id} className="bg-amber-500/[0.02] border border-amber-500/[0.15] rounded-3xl p-5 sm:p-6 relative overflow-hidden backdrop-blur-md shadow-lg group hover:border-amber-500/30 transition-colors">
                <div className="absolute top-0 right-0 p-32 bg-amber-500/5 rounded-full blur-[60px] -mr-16 -mt-16 pointer-events-none" />
                
                <div className="flex justify-between items-start mb-6 relative">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                      <Flame size={24} className="text-amber-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="m-0 text-[16px] font-extrabold text-white font-display">{room.title}</h3>
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full uppercase tracking-wide">Active</span>
                      </div>
                      <p className="m-0 text-[12px] text-slate-400 font-mono font-medium">Day {daysActive} of build · {room.updateCount} updates · {room.observerCount} observers</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-[#8B7CF8] bg-[#6C5CE7]/10 border border-[#6C5CE7]/20 px-3 py-1 rounded-full uppercase tracking-wider">{tag}</span>
                </div>

                <div className="grid grid-cols-1 gap-4 mb-6 relative md:grid-cols-2">
                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 flex flex-col justify-center">
                    <div className="flex justify-between text-[12px] font-bold mb-3">
                      <span className="text-slate-400">Build progress</span>
                      <span className="text-amber-400">Day {daysActive}</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-1">
                      <div className="h-full w-[60%] bg-gradient-to-r from-amber-500 to-amber-300 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                    </div>
                  </div>
                  
                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-col gap-2">
                       <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1"><TrendingUp size={14}/> Updates</span>
                       <div>
                          <span className="text-[22px] sm:text-[24px] font-black text-amber-400 font-display leading-none">{room.updateCount}</span>
                          <span className="text-[11px] text-slate-400 font-bold ml-1.5 uppercase tracking-wide">total</span>
                       </div>
                    </div>
                  </div>
                </div>

                {room.lastUpdate && (
                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 mb-6 relative">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Latest update</div>
                    <p className="text-[14px] text-slate-300 italic m-0 mb-4 leading-relaxed font-medium">
                      "{room.lastUpdate}"
                    </p>
                  </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row relative">
                  <Link to={`/dashboard/room/${room.id}?action=post`} className="inline-flex w-full sm:w-auto items-center gap-2 justify-center px-5 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 rounded-full text-[13px] sm:text-[14px] font-bold transition-all shadow-[0_4px_14px_rgba(245,158,11,0.1)]">
                    <Edit3 size={16} /> Post update
                  </Link>
                  <Link to={`/dashboard/room/${room.id}`} className="inline-flex w-full sm:w-auto items-center gap-2 justify-center px-5 py-2.5 bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] text-white rounded-full text-[13px] sm:text-[14px] font-bold transition-all">
                    <ArrowUpRight size={16} /> Open room
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── SHIPPED cards ── */}
      {(buildLogFilter === "all" || buildLogFilter === "shipped" || shippedRooms.some(r => r.tags?.[0] === buildLogFilter)) && shippedRooms.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-2 mt-6">
          {shippedRooms.filter(r => buildLogFilter === "all" || buildLogFilter === "shipped" || r.tags?.[0] === buildLogFilter).map(log => {
            const tag = log.tags?.[0] || 'product';
            const daysActive = timeAgoDays(log.createdAt);
            
            return (
              <div key={log.id} className="bg-emerald-500/[0.02] border border-emerald-500/[0.15] rounded-2xl p-6 flex flex-col gap-5 relative overflow-hidden backdrop-blur-md shadow-lg group hover:border-emerald-500/30 transition-colors">
                <div className="absolute top-0 right-0 p-24 bg-emerald-500/5 rounded-full blur-[50px] -mr-12 -mt-12 pointer-events-none" />
                
                <div className="flex justify-between items-start relative">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={24} className="text-emerald-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="m-0 text-[16px] font-extrabold text-white font-display">{log.title}</h3>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full uppercase tracking-wide">Shipped</span>
                      </div>
                      <p className="m-0 text-[12px] text-slate-400 font-mono font-medium">Shipped {formatDate(log.updatedAt)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-3 relative h-auto md:grid-cols-3">
                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg py-2 px-4 text-center flex-1 flex flex-col justify-center min-w-[80px] group-hover:bg-white/[0.04] transition-colors">
                    <div className="text-[14px] font-black text-white font-display leading-none">{log.updateCount}</div>
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Updates</div>
                  </div>
                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg py-2 px-4 text-center flex-1 flex flex-col justify-center min-w-[80px] group-hover:bg-white/[0.04] transition-colors">
                    <div className="text-[14px] font-black text-white font-display leading-none">{log.observerCount}</div>
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Observers</div>
                  </div>
                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg py-2 px-4 text-center flex-1 flex flex-col justify-center min-w-[80px] group-hover:bg-white/[0.04] transition-colors">
                    <div className="text-[14px] font-black text-white font-display leading-none">{daysActive}</div>
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Days</div>
                  </div>
                </div>

                {log.lastUpdate && (
                  <div className="bg-emerald-500/[0.03] border border-emerald-500/10 rounded-xl p-4 relative">
                    <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2">Builder's closing note</div>
                    <p className="text-[13px] text-slate-300 italic m-0 font-medium leading-relaxed">"{log.lastUpdate}"</p>
                  </div>
                )}

                <div className="flex gap-3 relative mt-auto">
                  <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-full text-[13px] font-bold cursor-pointer transition-all shadow-[0_4px_14px_rgba(16,185,129,0.1)]">
                    <Share2 size={16} /> Share
                  </button>
                  <Link to={`/dashboard/room/${log.id}`} className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] text-white rounded-full text-[13px] font-bold cursor-pointer transition-all">
                    <ArrowUpRight size={16} /> View log
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── STALLED cards + New Room placeholder ── */}
      {(buildLogFilter === "all" || buildLogFilter === "stalled" || stalledRooms.some(r => r.tags?.[0] === buildLogFilter)) && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mt-6">
          {stalledRooms.filter(r => buildLogFilter === "all" || buildLogFilter === "stalled" || r.tags?.[0] === buildLogFilter).map(room => {
            const daysSinceUpdate = timeAgoDays(room.updatedAt);
            
            return (
              <div key={room.id} className="bg-rose-500/[0.02] border border-rose-500/[0.15] rounded-2xl p-6 flex flex-col gap-5 relative overflow-hidden backdrop-blur-md shadow-lg group hover:border-rose-500/30 transition-colors">
                <div className="absolute top-0 right-0 p-24 bg-rose-500/5 rounded-full blur-[50px] -mr-12 -mt-12 pointer-events-none" />
                
                <div className="flex items-start gap-4 relative">
                  <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                    <Clock size={24} className="text-rose-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="m-0 text-[16px] font-extrabold text-white font-display">{room.title}</h3>
                      <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full uppercase tracking-wide">Stalled</span>
                    </div>
                    <p className="m-0 text-[12px] text-slate-400 font-mono font-medium">Last update {daysSinceUpdate} days ago</p>
                  </div>
                </div>

                <div className="bg-rose-500/[0.05] border border-rose-500/10 rounded-xl p-4 relative">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={14} className="text-rose-400" />
                    <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Patchwork Nudge</span>
                  </div>
                  <p className="text-[13px] text-slate-300 m-0 leading-relaxed font-medium">
                    {daysSinceUpdate} days without an update. Observers lose momentum when rooms go quiet — even a short note on why you paused keeps your reputation intact.
                  </p>
                </div>

                <div className="flex flex-col gap-3 relative mt-auto sm:flex-row">
                  <Link to={`/dashboard/room/${room.id}?action=post`} className="inline-flex w-full sm:w-auto items-center gap-2 justify-center px-5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-full text-[13px] sm:text-[14px] font-bold cursor-pointer transition-all shadow-[0_4px_14px_rgba(239,68,68,0.1)]">
                    <Edit3 size={16} /> Post update
                  </Link>
                  <button className="inline-flex w-full sm:w-auto items-center gap-2 justify-center px-5 py-2.5 bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] text-white rounded-full text-[13px] sm:text-[14px] font-bold cursor-pointer transition-all hover:text-rose-400 hover:border-rose-500/30">
                    Archive room
                  </button>
                </div>
              </div>
            );
          })}

          {/* New Room Placeholder */}
          <Link to="/dashboard/create" className="border-2 border-dashed border-white/10 hover:border-white/20 hover:bg-white/[0.02] rounded-2xl p-6 flex flex-col items-center justify-center gap-4 min-h-[260px] cursor-pointer transition-all group">
            <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-white/10 group-hover:border-[#6C5CE7]/30 flex items-center justify-center bg-white/[0.01] group-hover:bg-[#6C5CE7]/5 transition-colors">
              <span className="text-[28px] text-slate-500 group-hover:text-[#8B7CF8] font-light leading-none transition-colors">+</span>
            </div>
            <div className="text-center">
              <h3 className="m-0 mb-1.5 text-[15px] font-extrabold text-slate-300 group-hover:text-white font-display transition-colors">Open a new build room</h3>
              <p className="m-0 text-[13px] text-slate-500 group-hover:text-slate-400 transition-colors font-medium">Start streaming your next project</p>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
