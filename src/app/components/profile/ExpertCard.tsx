import React from "react";
import { Star, CheckCircle, TrendingUp, Clock, ShieldCheck, Users } from "lucide-react";
import { ExpertBadge } from "./ExpertBadge";

interface ExpertCardProps {
  profile: any;
}

export function ExpertCard({ profile }: ExpertCardProps) {
  if (!profile?.isVerifiedExpert) return null;
  return (
    <div className="mb-8 bg-gradient-to-br from-primary-500/10 to-primary-400/5 border border-primary-500/20 rounded-[24px] p-6">
      <div className="flex items-center gap-3 mb-5">
        <ExpertBadge tier={(profile as any).expertLevel || "bronze"} size="lg" />
        <div className="ml-auto flex items-center gap-2">
          {(profile as any).expertAvailable ? (
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Available
            </span>
          ) : (
            <span className="text-[11px] font-bold text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full">Unavailable</span>
          )}
        </div>
      </div>
      {(profile as any).expertDomains?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          {((profile as any).expertDomains as string[]).map((d: string) => (
            <span key={d} className="px-2.5 py-1 rounded-full bg-primary-400/10 border border-primary-400/20 text-primary-400 text-[11px] font-bold">{d}</span>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { icon: Star, label: "Review score", value: (profile as any).expertReviewScore ? `${(profile as any).expertReviewScore}/5.0` : "—" },
          { icon: CheckCircle, label: "Reviews done", value: (profile as any).expertReviewsCompleted || 0 },
          { icon: TrendingUp, label: "Acceptance rate", value: (profile as any).expertAcceptanceRate ? `${(profile as any).expertAcceptanceRate}%` : "—" },
          { icon: Clock, label: "Avg. response", value: (profile as any).expertAvgResponseHours ? `${(profile as any).expertAvgResponseHours}h` : "—" },
          { icon: ShieldCheck, label: "Open slots", value: (profile as any).expertOpenSlots ?? 3 },
          { icon: Users, label: "Followers", value: profile.followerCount || 0 },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-sm">
            <Icon className="w-4 h-4 text-primary-400 mx-auto mb-1" />
            <div className="text-[16px] font-extrabold text-slate-900">{value}</div>
            <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mt-0.5">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
