import React from "react";
import { Zap, Home, Hammer } from "lucide-react";
import { Link } from "react-router";

interface ProfileStatsProps {
  profile: any;
  roomsCount: number;
}

export function ProfileStats({ profile, roomsCount }: ProfileStatsProps) {
  const stats = [
    {
      label: 'Reputation',
      value: profile.reputation || 0,
      icon: Zap,
      color: 'text-amber-500',
      bg: 'bg-amber-50',
      border: 'border-amber-200/60',
      valueCls: 'text-amber-600',
      linkTo: '/dashboard/leaderboard',
    },
    {
      label: 'Rooms',
      value: roomsCount,
      icon: Home,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200/60',
      valueCls: 'text-emerald-600',
      linkTo: null,
    },
    {
      label: 'Role',
      value: profile.role || '—',
      icon: Hammer,
      color: 'text-primary-500',
      bg: 'bg-primary-50',
      border: 'border-primary-200/60',
      valueCls: 'text-primary-600',
      capitalize: true,
      linkTo: null,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8">
      {stats.map((s) => {
        const content = (
          <div className={`${s.bg} border ${s.border} rounded-[20px] p-4 md:p-5 text-center transition-all hover:shadow-md hover:-translate-y-0.5 cursor-${s.linkTo ? 'pointer' : 'default'}`}>
            <div className={`w-9 h-9 rounded-full ${s.bg} border ${s.border} flex items-center justify-center mx-auto mb-3`}>
              <s.icon className={`w-4 h-4 ${s.color}`} strokeWidth={2.5} />
            </div>
            <div className={`text-[22px] md:text-[26px] font-black ${s.valueCls} leading-none mb-1.5 ${s.capitalize ? 'capitalize' : ''} font-display`}>
              {s.value}
            </div>
            <div className="text-[10px] md:text-[11px] font-bold text-slate-500 uppercase tracking-widest">{s.label}</div>
          </div>
        );

        return s.linkTo ? (
          <Link key={s.label} to={s.linkTo} className="block">{content}</Link>
        ) : (
          <div key={s.label}>{content}</div>
        );
      })}
    </div>
  );
}
