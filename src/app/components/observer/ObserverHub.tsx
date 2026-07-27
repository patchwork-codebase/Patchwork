import { useState } from "react";
import { Link } from "react-router";
import { Zap, Eye, MessagesSquare, CheckCircle2, Flame, ArrowUpRight, Compass } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { useObservedRooms, useObserverStats } from "../../hooks/useRooms";
import { timeAgo } from "../../utils/helpers";
import { UserAvatar } from "../ui/UserAvatar";
import { VerifiedTick } from "../ui/VerifiedTick";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../auth/AuthContext";
import { ObserverProgressionPanel } from "./ObserverProgressionPanel";

export default function ObserverHub() {
  const [filter, setFilter] = useState("all");
  const { user } = useAuth();

  const { data: roomsData, isLoading: roomsLoading } = useObservedRooms(user?.id);
  const { data: stats, isLoading: statsLoading } = useObserverStats(user?.id);

  const { data: trendingBuilders, isLoading: buildersLoading } = useQuery({
    queryKey: ['trending-builders'],
    queryFn: async () => {
      // Rank builders by reputation for the "Trending Builders" suggestion
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'builder')
        .order('reputation', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    }
  });

  const followedRooms = roomsData?.pages.flat() || [];

  const { data: similarRooms, isLoading: similarLoading } = useQuery({
    queryKey: ['similar-problems', user?.id, followedRooms.length],
    queryFn: async () => {
      if (!followedRooms || followedRooms.length === 0) return [];
      // Extract unique tags from followed rooms to find similar problems
      const tags = followedRooms.flatMap((r: any) => r.tags || []);
      const uniqueTags = Array.from(new Set(tags));
      if (uniqueTags.length === 0) return [];

      // Naive approach: find rooms with the most prominent tag that the user is NOT already following
      const followedIds = followedRooms.map((r: any) => r.id);
      const { data, error } = await supabase
        .from('rooms')
        .select('id, title, description, tags, builder_name, update_count, status')
        .eq('is_private', false)
        .contains('tags', [uniqueTags[0]])
        .not('id', 'in', `(${followedIds.join(',')})`)
        .order('update_count', { ascending: false })
        .limit(4);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && followedRooms.length > 0
  });

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-8">
      {/* ── HEADER ── */}
      <div className="mb-8">
        <h1 className="font-display font-extrabold text-[32px] text-slate-100 leading-tight tracking-tight m-0 flex items-center gap-3">
          Observer Hub <Zap className="w-6 h-6 text-primary-400" />
        </h1>
        <p className="text-[14px] text-slate-400 mt-2 font-medium max-w-[500px]">
          Your curated feed of rooms you're watching, your reaction history, and your proof of taste across the Patchwork ecosystem.
        </p>
      </div>

      {/* ── PROOF OF TASTE STATS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Rooms followed', value: stats?.roomsFollowed || 0, icon: <Eye size={18} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Reactions given', value: stats?.totalReactions || 0, icon: <MessagesSquare size={18} />, color: 'text-primary-400', bg: 'bg-primary-500/10' },
          { label: 'Sharp insights', value: stats?.sharpInsights || 0, icon: <Flame size={18} />, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Shipped products', value: stats?.shippedProducts || 0, icon: <CheckCircle2 size={18} />, color: 'text-rose-400', bg: 'bg-rose-500/10' },
        ].map((stat, i) => (
          <div key={i} className="bg-transparent border border-slate-800 shadow-sm rounded-2xl p-5 relative overflow-hidden group">
            <div className={`absolute -right-4 -top-4 w-16 h-16 rounded-full ${stat.bg} blur-2xl opacity-50 group-hover:opacity-100 transition-opacity`} />
            <div className={`w-8 h-8 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4 ring-1 ring-slate-800`}>
              {stat.icon}
            </div>
            <div className={`font-extrabold text-[28px] leading-none ${stat.color} font-display mb-1`}>{statsLoading ? "..." : stat.value}</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── MAIN CONTENT & SIDEBAR GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">

        {/* LEFT COLUMN: WATCHLIST & TRENDING */}
        <div className="lg:col-span-2 space-y-12">

          {/* ── FOLLOWED ROOMS ── */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="font-display font-extrabold text-[20px] text-slate-100">Your Watchlist</h2>

              <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700 overflow-x-auto no-scrollbar">
                {['all', 'active', 'shipped'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-1.5 rounded-lg text-[12px] font-bold capitalize transition-colors ${filter === f ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {roomsLoading ? (
                <div className="col-span-full p-8 text-center text-slate-400 font-medium">Loading your watchlist...</div>
              ) : followedRooms.filter(r => filter === 'all' || (filter === 'active' ? r.status === 'active' || !r.status : r.status === filter)).map((room, i) => (
                <Link key={room.id || i} to={`/dashboard/room/${room.id}`} className="block bg-transparent border border-slate-800 shadow-sm hover:shadow-md hover:border-primary-500/30 rounded-[20px] p-6 hover:bg-slate-800/50 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`w-2.5 h-2.5 rounded-full mt-1 ${room.status === 'active' || !room.status ? 'bg-emerald-400 animate-pulse' : room.status === 'shipped' ? 'bg-primary-400' : 'bg-amber-400'}`} />
                    <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-md uppercase tracking-wider">
                      {room.status || 'Active'}
                    </span>
                  </div>
                  <h3 className="text-[16px] font-bold text-slate-100 group-hover:text-primary-400 transition-colors mb-2 leading-snug">{room.title}</h3>
                  <p className="text-[12px] text-slate-400 font-medium mb-6">{room.updateCount || 0} updates</p>

                  <div className="flex items-center justify-between border-t border-slate-700 pt-4">
                    <span className="text-[11px] text-slate-400 font-mono">Updated {timeAgo(room.updatedAt || room.createdAt)}</span>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-slate-100 transition-colors" />
                  </div>
                </Link>
              ))}

              <Link to="/dashboard/explore" className="border-2 border-dashed border-slate-700 hover:border-primary-400/50 hover:bg-slate-800/50 rounded-[20px] p-6 flex flex-col items-center justify-center text-center gap-3 transition-all min-h-[200px]">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[14px] font-bold text-slate-100 mb-1">Discover rooms</div>
                  <div className="text-[12px] text-slate-400 font-medium">Find more builders to watch</div>
                </div>
              </Link>
            </div>
          </div>

          {/* ── TRENDING BUILDERS ── */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-extrabold text-[20px] text-slate-100 flex items-center gap-2">
                Trending Builders <Flame className="w-5 h-5 text-amber-500" />
              </h2>
              <Link to="/dashboard/explore" className="text-[13px] font-bold text-primary-400 hover:underline">
                View all
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {buildersLoading ? (
                <div className="col-span-full p-8 text-center text-slate-400 font-medium">Loading builders...</div>
              ) : trendingBuilders?.map((builder: any) => (
                <Link key={builder.id} to={`/dashboard/profile/${builder.id}`} className="bg-transparent border border-slate-800 shadow-sm rounded-[20px] p-5 flex items-start gap-4 hover:bg-slate-800/50 hover:border-primary-400/30 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 shrink-0 overflow-hidden">
                    <UserAvatar userId={builder.id} name={builder.name} avatarUrl={builder.avatar || builder.avatar_url || builder.avatarUrl} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[15px] text-slate-100 flex items-center gap-1">
                      <span className="truncate">{builder.name || builder.email?.split('@')[0]}</span>
                      <VerifiedTick isVerified={!!builder.is_verified_expert} className="w-4 h-4 shrink-0" />
                    </h3>
                    <p className="text-[12px] text-slate-400 font-medium capitalize truncate mb-2">{builder.domain || 'Builder'}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold bg-primary-500/10 text-primary-400 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                        Rep {builder.reputation || 0}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* ── SIMILAR PROBLEMS ── */}
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-extrabold text-[20px] text-slate-100 flex items-center gap-2">
                Similar problems <Compass className="w-5 h-5 text-emerald-500" />
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {similarLoading ? (
                <div className="col-span-full p-8 text-center text-slate-400 font-medium">Discovering similar rooms...</div>
              ) : similarRooms && similarRooms.length > 0 ? (
                similarRooms.map((room: any) => (
                  <Link key={room.id} to={`/dashboard/room/${room.id}`} className="bg-transparent border border-slate-800 shadow-sm hover:border-emerald-500/30 rounded-[20px] p-5 flex flex-col justify-between hover:bg-slate-800/50 transition-all group">
                    <div>
                      <div className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md uppercase tracking-wider mb-3 inline-block">
                        {room.tags?.[0] || 'Similar'}
                      </div>
                      <h3 className="text-[15px] font-bold text-slate-100 group-hover:text-emerald-400 transition-colors mb-1 leading-snug">{room.title}</h3>
                      <p className="text-[12px] text-slate-400 font-medium truncate mb-4">by {room.builder_name || 'Builder'}</p>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-700 pt-3">
                      <span className="text-[11px] font-bold text-slate-400">{room.update_count || 0} updates</span>
                      <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-full p-8 text-center bg-transparent border border-slate-800 rounded-[20px]">
                  <p className="text-[13px] text-slate-400 font-medium">Follow more rooms to get personalized discovery suggestions!</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: PROGRESSION PANEL */}
        <div className="lg:col-span-1">
          <ObserverProgressionPanel />
        </div>

      </div>

    </div>
  );
}
