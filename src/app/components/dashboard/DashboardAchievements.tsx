import React from 'react';
import { Link } from 'react-router';
import { useProofOfWork } from '../../hooks/useProofOfWork';
import { Award, ArrowRight, Info } from 'lucide-react';
import { useProfile } from '../../hooks/useProfile';

interface DashboardAchievementsProps {
  user: any;
}

export function DashboardAchievements({ user }: DashboardAchievementsProps) {
  const { data: profile } = useProfile(user?.id);
  const { userBadges, allBadges, calculateLevel } = useProofOfWork(user?.id);
  
  const awardsCount = userBadges?.length || 0;
  
  const currentReputation = profile?.reputation || 0;
  const levelInfo = calculateLevel(currentReputation, allBadges);
  
  // Find the next two milestones for the UI
  const levelBadges = allBadges?.filter(b => b.badge_type === 'level').sort((a, b) => a.points_required - b.points_required) || [];
  let nextLevels = levelBadges.filter(b => b.points_required > currentReputation).slice(0, 2);
  
  // If they reached the max, show the last two levels as full
  if (nextLevels.length === 0 && levelBadges.length > 0) {
    nextLevels = levelBadges.slice(-2);
  } else if (nextLevels.length === 1 && levelBadges.length >= 2) {
    // If only one next level, show the previous one (completed) and the next one
    const prevLevel = levelBadges[levelBadges.findIndex(b => b.id === nextLevels[0].id) - 1];
    if (prevLevel) {
      nextLevels = [prevLevel, nextLevels[0]];
    }
  }

  const PremiumBadgeSVG = ({ points, colorTheme, completed }: { points: number, colorTheme: string, completed: boolean }) => {
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
    };

    const t = themes[baseTheme] || themes.blue;

    return (
      <div className={`w-[56px] h-[56px] shrink-0 rounded-[14px] bg-gradient-to-br ${t.bg} flex items-center justify-center relative overflow-hidden shadow-sm ring-1 ${t.ring} transition-all duration-300 ${!completed ? 'opacity-90' : ''}`}>
        <div className="absolute inset-0 bg-white/50 mix-blend-overlay"></div>
        <svg viewBox="0 0 100 100" className={`w-[90%] h-[90%] drop-shadow-md z-10 relative ${!completed ? 'opacity-85' : ''}`}>
          <defs>
            <linearGradient id={`g1-${baseTheme}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={t.light} />
              <stop offset="100%" stopColor={t.main} />
            </linearGradient>
            <linearGradient id={`g2-${baseTheme}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={t.main} />
              <stop offset="100%" stopColor={t.dark} />
            </linearGradient>
            <linearGradient id={`g3-${baseTheme}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="white" stopOpacity="0.8" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
            <linearGradient id={`ribbon-${baseTheme}`} x1="0%" y1="0%" x2="100%" y2="0%">
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
          <polygon points="50 8, 72 16, 88 32, 92 55, 80 75, 50 88, 20 75, 8 55, 12 32, 28 16" fill={`url(#g2-${baseTheme})`} />
          <polygon points="50 11, 70 18, 84 33, 88 54, 77 72, 50 84, 23 72, 12 54, 16 33, 30 18" fill={`url(#g1-${baseTheme})`} />

          {/* Inner Dashed Line */}
          <polygon points="50 14, 68 20, 80 34, 84 53, 74 69, 50 80, 26 69, 16 53, 20 34, 32 20" fill="none" stroke="white" strokeWidth="0.75" strokeDasharray="2,2" opacity="0.8" />

          {/* Inner Diamond/Gem */}
          <polygon points="50 20, 75 48, 50 72, 25 48" fill={`url(#g2-${baseTheme})`} opacity="0.95"/>
          {/* Gem Highlight */}
          <polygon points="50 22, 72 48, 50 68, 28 48" fill={`url(#g3-${baseTheme})`} />

          {/* Banner Ribbon Across Bottom */}
          <path d="M 16 66 Q 50 76 84 66 L 80 82 Q 50 94 20 82 Z" fill={`url(#ribbon-${baseTheme})`} />
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
    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 mb-8 flex flex-col font-sans">
      
      {/* Top Section */}
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-lg font-bold text-slate-900">Achievements</h3>
        <Link to="/dashboard/achievements" className="text-teal-600 font-bold hover:text-teal-700 text-[13px] flex items-center gap-1 group">
          View all <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      <h4 className="text-[14px] font-bold text-slate-900 mb-4 tracking-tight uppercase text-slate-400">Milestones in progress</h4>

      <div className="flex flex-col gap-3 mb-6">
        {nextLevels.map((lvl) => {
          const isCompleted = currentReputation >= lvl.points_required;
          const progress = Math.min(100, Math.max(0, (currentReputation / lvl.points_required) * 100));
          
          return (
            <div key={lvl.id} className="group flex flex-col p-4 rounded-2xl border border-slate-100 bg-white hover:border-slate-200 transition-all shadow-sm hover:shadow-md">
              <div className="flex justify-between items-center mb-4">
                 <div className="flex items-center gap-4">
                   <PremiumBadgeSVG points={lvl.points_required} colorTheme={lvl.color_theme || 'blue'} completed={isCompleted} />
                   <div className="flex items-center gap-2 relative group/tooltip">
                     <span className="font-black text-slate-900 text-[17px] tracking-tight cursor-default">{lvl.title}</span>
                     <Info className="w-4 h-4 text-slate-300 cursor-help hover:text-slate-500 transition-colors" />
                     
                     <div className="absolute bottom-full left-0 mb-2 w-56 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 bg-slate-900 text-white text-[12px] p-3 rounded-xl shadow-xl z-20 pointer-events-none translate-y-1 group-hover/tooltip:translate-y-0">
                       <div className="absolute -bottom-1 left-6 w-3 h-3 bg-slate-900 rotate-45"></div>
                       {lvl.description || `Earn ${lvl.points_required} points to unlock this milestone.`}
                     </div>
                   </div>
                 </div>
                 <div className="text-[12px] font-black text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 shadow-sm">
                   {Math.min(currentReputation, lvl.points_required)} <span className="text-indigo-400 font-bold">/ {lvl.points_required}</span>
                 </div>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ease-out relative ${isCompleted ? 'bg-emerald-400' : 'bg-gradient-to-r from-rose-400 via-purple-500 to-indigo-500 shadow-[0_0_12px_rgba(168,85,247,0.6)]'}`}
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 w-full h-full bg-white/20 animate-pulse"></div>
                </div>
              </div>
            </div>
          );
        })}
        
        {nextLevels.length === 0 && (
          <p className="text-slate-500 text-sm italic text-center py-4">You have completed all current milestones!</p>
        )}
      </div>

      <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
        <div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-slate-200 flex items-center justify-center shrink-0">
           <Award className={`w-6 h-6 ${awardsCount > 0 ? 'text-amber-500 fill-amber-100' : 'text-slate-300'}`} />
        </div>
        <div className="flex-1">
          <p className="text-slate-900 font-bold text-[15px] leading-tight mb-0.5">
            {awardsCount > 0 ? `You achieved ${awardsCount} awards` : "No awards yet"}
          </p>
          <p className="text-slate-500 text-[13px] leading-tight">Keep building to unlock more</p>
        </div>
      </div>

    </div>
  );
}

