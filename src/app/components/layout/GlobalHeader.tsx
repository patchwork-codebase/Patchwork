import React from "react";
import { Link } from "react-router";
import { Bell } from "lucide-react";

interface GlobalHeaderProps {
  unreadCount: number;
}

export function GlobalHeader({ unreadCount }: GlobalHeaderProps) {
  return (
    <>
      {/* ── GLOBAL TOP HEADER ─────────────────── */}
      <header className="relative h-[60px] bg-white/40 backdrop-blur-2xl border-b border-white/40 flex flex-wrap items-center justify-between px-4 sm:px-6 sticky top-0 z-50 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-slate-900 hover:opacity-80 transition group">
            <span>patch<span className="inline-block text-primary-400 group-hover:animate-[spin_2s_linear_infinite]">·</span>work</span>
            <span className="rounded bg-primary-400/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-400">Beta</span>
          </Link>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            to="/dashboard/notifications"
            className="flex sm:hidden relative items-center justify-center w-[36px] h-[36px] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full text-slate-600 transition-colors"
          >
            <Bell className="w-[16px] h-[16px]" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white" />
            )}
          </Link>
        </div>
      </header>
    </>
  );
}
