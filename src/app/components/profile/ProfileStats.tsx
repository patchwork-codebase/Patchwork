import React from "react";

interface ProfileStatsProps {
  profile: any;
  roomsCount: number;
}

export function ProfileStats({ profile, roomsCount }: ProfileStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-10">
      {[
        { label: 'Rooms', value: roomsCount, color: 'text-emerald-400', bg: 'bg-emerald-400/5', border: 'border-emerald-400/10' },
        { label: 'Reputation', value: profile.reputation, color: 'text-amber-400', bg: 'bg-amber-400/5', border: 'border-amber-400/10' },
        { label: 'Role', value: profile.role, color: 'text-primary-400', bg: 'bg-primary-500/5', border: 'border-primary-500/10', capitalize: true },
      ].map((s, idx) => (
        <div key={s.label} className={`border ${s.border} ${s.bg} rounded-[16px] md:rounded-[20px] p-4 md:p-6 text-center backdrop-blur-sm ${idx === 2 ? 'col-span-2 md:col-span-1' : ''}`}>
          <div className={`text-[28px] md:text-[32px] font-black ${s.color} capitalize font-display leading-none mb-2`}>{s.value}</div>
          <div className="text-[10px] md:text-[11px] font-bold text-slate-600 uppercase tracking-widest">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
