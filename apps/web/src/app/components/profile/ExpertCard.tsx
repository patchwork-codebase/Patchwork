import React from "react";
import { motion } from "motion/react";
import { Star, CheckCircle, TrendingUp, Clock, ShieldCheck, Users, Award } from "lucide-react";
import { ExpertBadge } from "./ExpertBadge";

interface ExpertCardProps {
  profile: any;
}

export function ExpertCard({ profile }: ExpertCardProps) {
  if (!profile?.isVerifiedExpert) return null;
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative mb-8 overflow-hidden rounded-[24px] bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 shadow-xl shadow-primary-500/5 transition-all duration-300 hover:shadow-primary-500/10 hover:border-primary-500/30 group"
    >
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary-400/15 dark:bg-primary-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none transition-transform duration-700 group-hover:scale-110" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-emerald-400/10 dark:bg-emerald-500/5 rounded-full blur-[60px] translate-y-1/3 -translate-x-1/4 pointer-events-none transition-transform duration-700 group-hover:scale-110" />
      
      <div className="relative p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5">
            <ExpertBadge tier={profile.expertLevel || "bronze"} size="lg" />
            <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
            <div className="flex flex-col">
              <span className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                Top 1% of contributors <Award className="w-4 h-4 text-primary-500" />
              </span>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">
                Community Recognition
              </span>
            </div>
          </div>
          
          <div className="sm:ml-auto flex items-center gap-2 self-start sm:self-auto">
            {profile.expertAvailable ? (
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Accepting Requests
              </span>
            ) : (
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-3 py-1.5 rounded-full">
                Currently Unavailable
              </span>
            )}
          </div>
        </div>

        {profile.expertDomains?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {(profile.expertDomains as string[]).map((d: string, i: number) => (
              <motion.span 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                key={d} 
                className="px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[12px] font-semibold transition-colors hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-500/10 dark:hover:text-primary-400 dark:hover:border-primary-500/30 cursor-default shadow-sm dark:shadow-none"
              >
                {d}
              </motion.span>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { icon: Star, label: "Review Score", value: profile.expertReviewScore ? `${profile.expertReviewScore}/5.0` : "—", color: "text-amber-500" },
            { icon: CheckCircle, label: "Reviews Done", value: profile.expertReviewsCompleted || 0, color: "text-emerald-500" },
            { icon: TrendingUp, label: "Acceptance", value: profile.expertAcceptanceRate ? `${profile.expertAcceptanceRate}%` : "—", color: "text-primary-500" },
            { icon: Clock, label: "Avg Response", value: profile.expertAvgResponseHours ? `${profile.expertAvgResponseHours}h` : "—", color: "text-blue-500" },
            { icon: ShieldCheck, label: "Open Slots", value: profile.expertOpenSlots ?? 3, color: "text-indigo-500" },
            { icon: Users, label: "Followers", value: profile.followerCount || 0, color: "text-rose-500" },
          ].map(({ icon: Icon, label, value, color }, i) => (
            <motion.div 
              whileHover={{ y: -4, scale: 1.03 }} 
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              key={label} 
              className="relative overflow-hidden bg-white/50 dark:bg-slate-800/40 backdrop-blur-sm border border-slate-100/60 dark:border-slate-700/60 rounded-2xl p-4 text-center shadow-sm hover:shadow-md transition-all group/stat"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 pointer-events-none" />
              <div className={`w-8 h-8 mx-auto mb-3 rounded-full flex items-center justify-center bg-slate-50 dark:bg-slate-800/80 group-hover/stat:scale-110 transition-transform ${color}`}>
                <Icon className="w-4 h-4" strokeWidth={2.5} />
              </div>
              <div className="relative text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1">{value}</div>
              <div className="relative text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
