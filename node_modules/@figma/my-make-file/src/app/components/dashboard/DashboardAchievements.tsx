import React from 'react';
import { Link } from 'react-router';
import { useProofOfWork } from '../../hooks/useProofOfWork';
import { Award, ArrowRight, Info, TrendingUp, Sparkles } from 'lucide-react';
import { useProfile } from '../../hooks/useProfile';
import { useGamification } from '../../context/GamificationContext';

interface DashboardAchievementsProps {
  user: any;
}

export function DashboardAchievements({ user }: DashboardAchievementsProps) {
  const { data: profile } = useProfile(user?.id);
  const { userBadges, allBadges, calculateLevel } = useProofOfWork(user?.id);
  // Only count actual achievements/recognitions, not level progression badges
  const awardsCount = userBadges?.filter(b => b.badge?.badge_type !== 'level').length || 0;
  
  const currentReputation = profile?.reputation || 0;
  const levelInfo = calculateLevel(currentReputation, allBadges);
  
  // Find current and next milestones
  const levelBadges = allBadges?.filter(b => b.badge_type === 'level').sort((a, b) => a.points_required - b.points_required) || [];
  
  // The highest level achieved
  const currentLevel = levelBadges.reverse().find(b => currentReputation >= b.points_required) || levelBadges[levelBadges.length - 1];
  
  // The immediate next level to achieve
  const nextLevel = levelBadges.reverse().find(b => b.points_required > currentReputation);

  const { triggerKeepBuildingReminder } = useGamification();

  React.useEffect(() => {
    if (nextLevel && currentReputation > 0) {
      triggerKeepBuildingReminder(nextLevel, currentReputation);
    }
  }, [nextLevel?.id, currentReputation, triggerKeepBuildingReminder]);

  const PremiumBadgeSVG = ({ points, colorTheme, size = 56 }: { points: number, colorTheme: string, size?: number }) => {
    let baseTheme = colorTheme || 'blue';

    const themes: Record<string, { main: string, light: string, dark: string, bg: string, ring: string }> = {
      slate: { main: "#94a3b8", light: "#cbd5e1", dark: "#64748b", bg: "from-slate-50 to-slate-100", ring: "ring-slate-200" },
      rose: { main: "#fb7185", light: "#fecdd3", dark: "#e11d48", bg: "from-rose-50 to-rose-100", ring: "ring-rose-200" },
      pink: { main: "#f472b6", light: "#fbcfe8", dark: "#db2777", bg: "from-pink-50 to-pink-100", ring: "ring-pink-200" },
      indigo: { main: "#818cf8", light: "#c7d2fe", dark: "#4f46e5", bg: "from-indigo-50 to-indigo-100", ring: "ring-indigo-200" },
      purple: { main: "#a855f7", light: "#e9d5ff", dark: "#7e22ce", bg: "from-purple-50 to-purple-100", ring: "ring-purple-200" },
      emerald: { main: "#34d399", light: "#a7f3d0", dark: "#059669", bg: "from-emerald-50 to-emerald-100", ring: "ring-emerald-200" },
      amber: { main: "#fbbf24", light: "#fde68a", dark: "#d97706", bg: "from-amber-50 to-amber-100", ring: "ring-amber-200" },
      blue: { main: "#60a5fa", light: "#bfdbfe", dark: "#2563eb", bg: "from-blue-50 to-blue-100", ring: "ring-blue-200" },
      orange: { main: "#f97316", light: "#fdba74", dark: "#c2410c", bg: "from-orange-50 to-orange-100", ring: "ring-orange-200" },
      red: { main: "#ef4444", light: "#fca5a5", dark: "#b91c1c", bg: "from-red-50 to-red-100", ring: "ring-red-200" },
    };

    const t = themes[baseTheme] || themes.blue;

    return (
      <div 
        style={{ width: size, height: size }}
        className={`shrink-0 rounded-[14px] bg-gradient-to-br ${t.bg} flex items-center justify-center relative overflow-hidden shadow-sm ring-1 ${t.ring} transition-all duration-300`}
      >
        <div className="absolute inset-0 bg-white/50 mix-blend-overlay"></div>
        <svg viewBox="0 0 100 100" className={`w-[90%] h-[90%] drop-shadow-md z-10 relative`}>
          <defs>
            <linearGradient id={`g1-${baseTheme}-${size}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={t.light} />
              <stop offset="100%" stopColor={t.main} />
            </linearGradient>
            <linearGradient id={`g2-${baseTheme}-${size}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={t.main} />
              <stop offset="100%" stopColor={t.dark} />
            </linearGradient>
            <linearGradient id={`g3-${baseTheme}-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="white" stopOpacity="0.8" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
            <linearGradient id={`ribbon-${baseTheme}-${size}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={t.dark} />
              <stop offset="20%" stopColor={t.main} />
              <stop offset="80%" stopColor={t.main} />
              <stop offset="100%" stopColor={t.dark} />
            </linearGradient>
          </defs>

          {/* Left / Right background ribbon tails */}
          <path d="M 12 55 L 2 68 L 18 78 L 25 65 Z" fill={t.dark} opacity="0.9" />
          <path d="M 88 55 L 98 68 L 82 78 L 75 65 Z" fill={t.dark} opacity="0.9" />

          {/* Outer Multifaceted Polygon */}
          <polygon points="50 8, 72 16, 88 32, 92 55, 80 75, 50 88, 20 75, 8 55, 12 32, 28 16" fill={`url(#g2-${baseTheme}-${size})`} />
          <polygon points="50 11, 70 18, 84 33, 88 54, 77 72, 50 84, 23 72, 12 54, 16 33, 30 18" fill={`url(#g1-${baseTheme}-${size})`} />

          {/* Inner Dashed Line */}
          <polygon points="50 14, 68 20, 80 34, 84 53, 74 69, 50 80, 26 69, 16 53, 20 34, 32 20" fill="none" stroke="white" strokeWidth="0.75" strokeDasharray="2,2" opacity="0.8" />

          {/* Inner Diamond/Gem */}
          <polygon points="50 20, 75 48, 50 72, 25 48" fill={`url(#g2-${baseTheme}-${size})`} opacity="0.95"/>
          {/* Gem Highlight */}
          <polygon points="50 22, 72 48, 50 68, 28 48" fill={`url(#g3-${baseTheme}-${size})`} />

          {/* Banner Ribbon Across Bottom */}
          <path d="M 16 66 Q 50 76 84 66 L 80 82 Q 50 94 20 82 Z" fill={`url(#ribbon-${baseTheme}-${size})`} />
          <path d="M 22 70 Q 50 80 78 70" fill="none" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.7" />

          {/* Points Text */}
          <text x="50" y="55" textAnchor="middle" fill="white" fontSize="22" fontWeight="900" style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.5))', fontFamily: 'system-ui, sans-serif' }}>
            {points}
          </text>
        </svg>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-[#111111] border border-slate-100 dark:border-white/10 rounded-3xl shadow-sm p-6 mb-8 flex flex-col font-sans">
      
      {/* 1. HERO SECTION: Current Unlocked Achievements */}
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Proof of Work</h3>
      
      <Link 
        to="/dashboard/achievements" 
        className="group relative flex items-center justify-between p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-500/20 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-500/40 transition-all duration-300 mb-6 overflow-hidden"
      >
        {/* Decorative background flair */}
        <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
        <div className="absolute left-0 bottom-0 w-24 h-24 bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>

        <div className="flex items-center gap-5 relative z-10">
          {currentLevel ? (
             <PremiumBadgeSVG points={currentLevel.points_required} colorTheme={currentLevel.color_theme || 'indigo'} size={64} />
          ) : (
            <div className="w-16 h-16 rounded-[14px] bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center shadow-inner">
               <Award className="w-8 h-8 text-slate-400" />
            </div>
          )}
          
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[12px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Current Level</span>
              {currentLevel && <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
            </div>
            <h4 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-none mb-2">
              {currentLevel ? currentLevel.title : 'Beginner'}
            </h4>
            <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400">
               <Award className="w-4 h-4 text-amber-500" /> 
               {awardsCount > 0 ? (
                 <span><strong className="text-slate-900 dark:text-white">{awardsCount}</strong> Verified Awards</span>
               ) : (
                 "No awards earned yet"
               )}
            </div>
          </div>
        </div>

        <div className="w-10 h-10 rounded-full bg-white dark:bg-white/10 border border-slate-100 dark:border-white/5 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white group-hover:border-indigo-500 transition-all duration-300 shadow-sm relative z-10">
           <ArrowRight className="w-5 h-5" />
        </div>
      </Link>

      {/* 2. SECONDARY SECTION: Next Milestone Progress */}
      {nextLevel && (
        <>
          <div className="flex items-center gap-2 mb-3">
             <TrendingUp className="w-4 h-4 text-slate-400" />
             <h4 className="text-[13px] font-bold text-slate-500 dark:text-slate-400 tracking-tight uppercase">Next Milestone</h4>
          </div>
          
          <Link 
            to="/dashboard/achievements?tab=how-to-earn"
            className="group flex flex-col p-4 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#1a1a1a] hover:bg-slate-100 dark:hover:bg-[#222] transition-colors cursor-pointer"
            title="Click to learn how to earn Reputation points"
          >
            <div className="flex justify-between items-end mb-3">
               <div>
                 <div className="flex items-center gap-2 mb-1">
                   <span className="font-bold text-slate-900 dark:text-white text-lg tracking-tight">{nextLevel.title}</span>
                   <Info className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                 </div>
                 <p className="text-[12px] text-slate-500 dark:text-slate-400 m-0 leading-tight">
                   {nextLevel.description || `Earn ${nextLevel.points_required} XP to unlock`}
                 </p>
               </div>
               
               <div className="text-right">
                 <div className="text-[14px] font-black text-slate-900 dark:text-white tracking-tight mb-1">
                   {currentReputation} <span className="text-slate-400 font-bold text-[12px]">/ {nextLevel.points_required} XP</span>
                 </div>
               </div>
            </div>
            
            {/* Progress Bar bridging current to next */}
            <div className="w-full h-2.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden shadow-inner">
              <div 
                className="h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-indigo-400 to-indigo-600 relative"
                style={{ width: `${Math.min(100, Math.max(0, (currentReputation / nextLevel.points_required) * 100))}%` }}
              >
                <div className="absolute inset-0 w-full h-full bg-white/20 animate-pulse"></div>
              </div>
            </div>
          </Link>
        </>
      )}

      {/* State for max level achieved */}
      {!nextLevel && currentLevel && (
        <div className="mt-2 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 text-center">
          <p className="text-emerald-700 dark:text-emerald-400 font-bold text-sm">
            🎉 You have reached the highest current milestone!
          </p>
        </div>
      )}
    </div>
  );
}
