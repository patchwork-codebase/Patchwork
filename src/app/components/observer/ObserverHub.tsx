import { useState } from "react";
import { Link } from "react-router";
import { Zap, Eye, MessagesSquare, CheckCircle2, Flame, ArrowUpRight } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { useObservedRooms, useObserverStats } from "../../hooks/useRooms";
import { timeAgo } from "../../utils/helpers";

export default function ObserverHub() {
  const [filter, setFilter] = useState("all");
  const { user } = useAuth();
  
  const { data: roomsData, isLoading: roomsLoading } = useObservedRooms(user?.id);
  const { data: stats, isLoading: statsLoading } = useObserverStats(user?.id);
  
  const followedRooms = roomsData?.pages.flat() || [];

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-8">
      {/* ── HEADER ── */}
      <div className="mb-8">
        <h1 className="font-display font-extrabold text-[32px] text-white leading-tight tracking-tight m-0 flex items-center gap-3">
          Observer Hub <Zap className="w-6 h-6 text-[#8B7CF8]" />
        </h1>
        <p className="text-[14px] text-slate-400 mt-2 font-medium max-w-[500px]">
          Your curated feed of rooms you're watching, your reaction history, and your proof of taste across the Patchwork ecosystem.
        </p>
      </div>

      {/* ── PROOF OF TASTE STATS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Rooms followed', value: stats?.roomsFollowed || 0, icon: <Eye size={18} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Reactions given', value: stats?.totalReactions || 0, icon: <MessagesSquare size={18} />, color: 'text-[#8B7CF8]', bg: 'bg-[#6C5CE7]/10' },
          { label: 'Sharp insights', value: stats?.sharpInsights || 0, icon: <Flame size={18} />, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Shipped products', value: stats?.shippedProducts || 0, icon: <CheckCircle2 size={18} />, color: 'text-rose-400', bg: 'bg-rose-500/10' },
        ].map((stat, i) => (
          <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 relative overflow-hidden group">
            <div className={`absolute -right-4 -top-4 w-16 h-16 rounded-full ${stat.bg} blur-2xl opacity-50 group-hover:opacity-100 transition-opacity`} />
            <div className={`w-8 h-8 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4 ring-1 ring-white/5`}>
              {stat.icon}
            </div>
            <div className={`font-extrabold text-[28px] leading-none ${stat.color} font-display mb-1`}>{statsLoading ? "..." : stat.value}</div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── FOLLOWED ROOMS ── */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="font-display font-extrabold text-[20px] text-white">Your Watchlist</h2>
          
          <div className="flex bg-white/[0.03] p-1 rounded-xl border border-white/[0.06] overflow-x-auto no-scrollbar">
            {['all', 'active', 'shipped'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-[12px] font-bold capitalize transition-colors ${filter === f ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {roomsLoading ? (
            <div className="col-span-full p-8 text-center text-slate-400 font-medium">Loading your watchlist...</div>
          ) : followedRooms.filter(r => filter === 'all' || (filter === 'active' ? r.status === 'active' || !r.status : r.status === filter)).map((room, i) => (
            <Link key={room.id || i} to={`/dashboard/room/${room.id}`} className="block bg-white/[0.02] border border-white/[0.06] hover:border-[#6C5CE7]/30 rounded-[20px] p-6 hover:bg-white/[0.04] transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-2.5 h-2.5 rounded-full mt-1 ${room.status === 'active' || !room.status ? 'bg-emerald-400 animate-pulse' : room.status === 'shipped' ? 'bg-[#8B7CF8]' : 'bg-amber-400'}`} />
                <span className="text-[10px] font-mono font-bold text-slate-500 bg-white/[0.05] px-2.5 py-1 rounded-md uppercase tracking-wider">
                  {room.status || 'Active'}
                </span>
              </div>
              <h3 className="text-[16px] font-bold text-white group-hover:text-[#8B7CF8] transition-colors mb-2 leading-snug">{room.title}</h3>
              <p className="text-[12px] text-slate-400 font-medium mb-6">{room.updateCount || 0} updates</p>
              
              <div className="flex items-center justify-between border-t border-white/[0.06] pt-4">
                <span className="text-[11px] text-slate-500 font-mono">Updated {timeAgo(room.updatedAt || room.createdAt)}</span>
                <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
              </div>
            </Link>
          ))}
          
          <Link to="/dashboard/explore" className="border-2 border-dashed border-white/10 hover:border-white/20 hover:bg-white/[0.02] rounded-[20px] p-6 flex flex-col items-center justify-center text-center gap-3 transition-all min-h-[200px]">
             <div className="w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center text-slate-400">
               <Eye className="w-5 h-5" />
             </div>
             <div>
               <div className="text-[14px] font-bold text-white mb-1">Discover rooms</div>
               <div className="text-[12px] text-slate-500 font-medium">Find more builders to watch</div>
             </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
