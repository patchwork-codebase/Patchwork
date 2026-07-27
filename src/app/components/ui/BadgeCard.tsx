import * as Icons from 'lucide-react';
import { Badge, UserBadge } from '../../types/pow';

interface BadgeCardProps {
  badge: Badge;
  userBadge?: UserBadge; // If provided, shows as earned
  className?: string;
}

export function BadgeCard({ badge, userBadge, className = '' }: BadgeCardProps) {
  // Dynamically resolve the Lucide icon based on string name
  const IconComponent = (Icons as any)[badge.icon_name] || Icons.Award;
  const isEarned = !!userBadge;

  // Premium color mappings
  const themeStyles = {
    slate: 'from-slate-400 to-slate-600 border-slate-500/30 text-slate-700',
    blue: 'from-blue-400 to-blue-600 border-blue-500/30 text-blue-700',
    indigo: 'from-indigo-400 to-indigo-600 border-indigo-500/30 text-indigo-700',
    purple: 'from-primary-400 to-primary-600 border-primary-500/30 text-primary-700',
    emerald: 'from-emerald-400 to-emerald-600 border-emerald-500/30 text-emerald-700',
    amber: 'from-amber-400 to-amber-600 border-amber-500/30 text-amber-700',
    orange: 'from-orange-400 to-orange-600 border-orange-500/30 text-orange-700',
    red: 'from-red-400 to-red-600 border-red-500/30 text-red-700',
  } as Record<string, string>;

  const currentTheme = themeStyles[badge.color_theme] || themeStyles.slate;
  
  // Unearned badges are grayscale
  const activeClasses = isEarned 
    ? `bg-gradient-to-br ${currentTheme} shadow-lg ring-1 ring-white/20`
    : `bg-slate-100 border-slate-200 text-slate-400 grayscale opacity-60`;

  return (
    <div className={`relative flex flex-col items-center p-5 rounded-[24px] border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group overflow-hidden ${activeClasses} ${className}`}>
      {/* Glossy overlay for earned badges */}
      {isEarned && (
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      )}
      
      <div className={`w-14 h-14 mb-3 rounded-full flex items-center justify-center ${isEarned ? 'bg-white/20 shadow-inner backdrop-blur-sm' : 'bg-slate-200'}`}>
        <IconComponent className={`w-7 h-7 ${isEarned ? 'text-white' : 'text-slate-400'}`} />
      </div>
      
      <h4 className={`text-[14px] font-extrabold text-center leading-tight mb-1 ${isEarned ? 'text-white' : 'text-slate-500'}`}>
        {badge.title}
      </h4>
      
      <p className={`text-[11px] text-center px-1 leading-snug font-medium ${isEarned ? 'text-white/80' : 'text-slate-400'}`}>
        {badge.description}
      </p>

      {badge.badge_type === 'level' && (
        <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${isEarned ? 'bg-black/20 text-white' : 'bg-slate-200 text-slate-500'}`}>
          LVL
        </div>
      )}
      
      {isEarned && badge.badge_type !== 'level' && (
        <button className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 hover:bg-white/30 rounded-full p-1.5 text-white">
          <Icons.Share2 className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
