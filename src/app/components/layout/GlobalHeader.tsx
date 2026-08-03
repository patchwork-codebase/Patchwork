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
      <header className="relative h-[60px] bg-white dark:bg-[#0a0a0a]/90 backdrop-blur-md border-b border-slate-100 dark:border-white/5 flex flex-wrap items-center justify-between px-4 sm:px-6 sticky top-0 z-50 shadow-sm dark:shadow-none">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-slate-900 dark:text-white hover:opacity-80 transition group">
            <div className="flex h-7 w-7 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#6C5CE7] to-[#8B7CF8] text-slate-900 dark:text-white">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 12-8.373 8.373a1 1 0 1 1-1.414-1.414L13.586 10.586"/>
                <path d="m18 13.4-9-9"/>
                <path d="M12 4.4 14.6 2l3.4 3.4L15.6 8z"/>
                <path d="M18.4 10.6 21 8l-3.4-3.4L15 7.2"/>
              </svg>
            </div>
            <span className="font-black tracking-tight text-[19px]">patchwork</span>
            <span className="rounded bg-primary-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-primary-500 ml-1">Beta</span>
          </Link>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            to="/dashboard/notifications"
            className="flex sm:hidden relative items-center justify-center w-[36px] h-[36px] bg-white dark:bg-[#111111] hover:bg-white/5 border border-slate-100 dark:border-white/10 rounded-full text-slate-500 dark:text-slate-400 transition-colors shadow-sm dark:shadow-none"
          >
            <Bell className="w-[16px] h-[16px]" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-primary-500 rounded-full ring-2 ring-[#0a0a0a]" />
            )}
          </Link>
        </div>
      </header>
    </>
  );
}
