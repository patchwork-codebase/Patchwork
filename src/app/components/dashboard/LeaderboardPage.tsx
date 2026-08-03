import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../auth/AuthContext";
import { getAvatarUrl } from "../../utils/helpers";
import { Link } from "react-router";
import { Zap, Trophy, Medal, ArrowLeft, Crown } from "lucide-react";
import { SEO } from "../seo/SEO";
import { UserAvatar } from "../ui/UserAvatar";

interface LeaderboardUser {
  id: string;
  name: string;
  avatar: string | null;
  reputation: number;
  role: string;
  isVerifiedExpert: boolean;
}

function useLeaderboard() {
  return useQuery<LeaderboardUser[]>({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, avatar, reputation, role, is_verified_expert')
        .order('reputation', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []).map(u => ({
        id: u.id,
        name: u.name || 'Anonymous',
        avatar: u.avatar,
        reputation: u.reputation || 0,
        role: u.role || 'observer',
        isVerifiedExpert: !!u.is_verified_expert,
      }));
    },
    staleTime: 60_000,
  });
}

const RANK_STYLES: Record<number, { bg: string; border: string; icon: React.ReactNode; ring: string }> = {
  0: {
    bg: 'bg-gradient-to-br from-amber-50 to-yellow-50',
    border: 'border-amber-300/60',
    ring: 'ring-amber-400/30',
    icon: <Crown className="w-5 h-5 text-amber-500" />,
  },
  1: {
    bg: 'bg-gradient-to-br from-slate-50 to-gray-50',
    border: 'border-slate-300/60',
    ring: 'ring-slate-400/20',
    icon: <Medal className="w-5 h-5 text-slate-500 dark:text-slate-400" />,
  },
  2: {
    bg: 'bg-gradient-to-br from-orange-50 to-amber-50',
    border: 'border-orange-300/60',
    ring: 'ring-orange-400/20',
    icon: <Medal className="w-5 h-5 text-orange-400" />,
  },
};

export default function LeaderboardPage() {
  const { data: users, isLoading } = useLeaderboard();

  return (
    <>
      <SEO
        title="Reputation Leaderboard | Patchwork"
        description="See the top builders and observers on Patchwork ranked by reputation score."
      />
      <div className="max-w-[720px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-[13px] font-bold text-slate-500 hover:text-slate-900 mb-6 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h1 className="text-[28px] font-extrabold text-slate-900 font-display leading-tight">Reputation Leaderboard</h1>
            <p className="text-[14px] text-slate-500 mt-0.5">Top builders ranked by community reputation score</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {(users || []).map((user, idx) => {
              const rankStyle = RANK_STYLES[idx];
              const isTop3 = idx < 3;
              return (
                <Link
                  key={user.id}
                  to={`/dashboard/profile/${user.id}`}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all hover:-translate-y-0.5 hover:shadow-md group ${
                    isTop3
                      ? `${rankStyle.bg} ${rankStyle.border} ring-1 ${rankStyle.ring}`
                      : 'bg-white border-slate-200 hover:border-primary-300/60 hover:bg-primary-50/20'
                  }`}
                >
                  {/* Rank */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-black text-[14px] ${
                    isTop3 ? 'bg-white/70 shadow-sm' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {isTop3 ? rankStyle.icon : <span className="text-slate-500">#{idx + 1}</span>}
                  </div>

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full ring-2 ring-white shadow-sm shrink-0 overflow-hidden relative">
                    <UserAvatar userId={user.id} name={user.name} avatarUrl={user.avatar || user.avatar_url || user.avatarUrl} />
                  </div>

                  {/* Name + Role */}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[14px] text-slate-900 truncate group-hover:text-primary-600 transition-colors">
                      {user.name}
                      {user.isVerifiedExpert && (
                        <span className="ml-2 text-[10px] font-bold text-primary-500 bg-primary-50 border border-primary-200/60 px-1.5 py-0.5 rounded-full">Expert</span>
                      )}
                    </div>
                    <div className="text-[12px] text-slate-500 capitalize">{user.role}</div>
                  </div>

                  {/* Reputation */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Zap className={`w-4 h-4 ${isTop3 ? 'text-amber-500' : 'text-slate-400'}`} />
                    <span className={`font-black text-[16px] ${isTop3 ? 'text-amber-600' : 'text-slate-700'}`}>
                      {user.reputation.toLocaleString()}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
