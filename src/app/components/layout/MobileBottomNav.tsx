import React from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { User as UserIcon, Compass as CompassIcon, LogOut as LogOutIcon, Lightbulb as LightbulbIcon, FileText as FileTextIcon } from "lucide-react";


interface MobileBottomNavProps {
  activeSection: string;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (val: boolean) => void;
  unreadCount: number;
  avatarUrl: string;
  userDisplayName: string;
  user: any;
  profile: any;
  setForceShowTour: (val: boolean) => void;
  handleSignOut: () => void;
}

export function MobileBottomNav({
  activeSection,
  mobileMenuOpen,
  setMobileMenuOpen,
  unreadCount,
  avatarUrl,
  userDisplayName,
  user,
  profile,
  setForceShowTour,
  handleSignOut
}: MobileBottomNavProps) {
  return (
    <>
      {/* ── MOBILE BOTTOM NAV ─────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
        {/* Safe-area spacer + glass bar */}
        <div className="bg-white/95 backdrop-blur-2xl border-t border-slate-200/60 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] pb-[env(safe-area-inset-bottom)]">
          <nav className="flex items-stretch justify-around px-1 pt-1 pb-1">

            {/* Home */}
            <Link
              to="/dashboard"
              preventScrollReset={true}
              className="relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] rounded-xl active:scale-95 transition-transform duration-100 select-none touch-manipulation"
            >
              {activeSection === 'overview' && (
                <div className="absolute inset-0 bg-primary-500/10 rounded-xl" />
              )}
              <div className={`relative z-10 transition-all duration-200 ${activeSection === 'overview' ? 'text-primary-500 scale-110' : 'text-slate-400'}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill={activeSection === 'overview' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <span className={`relative z-10 text-[10px] font-bold tracking-wide transition-colors duration-200 ${activeSection === 'overview' ? 'text-primary-500' : 'text-slate-400'}`}>
                Home
              </span>
            </Link>

            {/* Feed */}
            <Link
              to="/dashboard?tab=feed"
              preventScrollReset={true}
              className="relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] rounded-xl active:scale-95 transition-transform duration-100 select-none touch-manipulation"
            >
              {activeSection === 'feed' && (
                <div className="absolute inset-0 bg-primary-500/10 rounded-xl" />
              )}
              <div className={`relative z-10 transition-all duration-200 ${activeSection === 'feed' ? 'text-primary-500 scale-110' : 'text-slate-400'}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeWidth={activeSection === 'feed' ? '2.5' : '2'} />
                </svg>
              </div>
              <span className={`relative z-10 text-[10px] font-bold tracking-wide transition-colors duration-200 ${activeSection === 'feed' ? 'text-primary-500' : 'text-slate-400'}`}>
                Feed
              </span>
            </Link>

            {/* My Rooms */}
            <Link
              to="/dashboard/rooms"
              preventScrollReset={true}
              className="relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] rounded-xl active:scale-95 transition-transform duration-100 select-none touch-manipulation"
            >
              {activeSection === 'rooms' && (
                <div className="absolute inset-0 bg-primary-500/10 rounded-xl" />
              )}
              <div className={`relative z-10 transition-all duration-200 ${activeSection === 'rooms' ? 'text-primary-500 scale-110' : 'text-slate-400'}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 12L9 6l-6 6 1.5 1.5L9 9l4.5 4.5L15 12Z" strokeWidth={activeSection === 'rooms' ? '2.5' : '2'} />
                  <path d="M15 12l4.5 4.5-1.5 1.5L13.5 13.5" />
                  <path d="M9 6l3-3 3 3" />
                </svg>
              </div>
              <span className={`relative z-10 text-[10px] font-bold tracking-wide transition-colors duration-200 ${activeSection === 'rooms' ? 'text-primary-500' : 'text-slate-400'}`}>
                Rooms
              </span>
            </Link>

            {/* Explore */}
            <Link
              to="/dashboard/explore"
              preventScrollReset={true}
              className="relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] rounded-xl active:scale-95 transition-transform duration-100 select-none touch-manipulation"
            >
              {activeSection === 'explore' && (
                <div className="absolute inset-0 bg-primary-500/10 rounded-xl" />
              )}
              <div className={`relative z-10 transition-all duration-200 ${activeSection === 'explore' ? 'text-primary-500 scale-110' : 'text-slate-400'}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </div>
              <span className={`relative z-10 text-[10px] font-bold tracking-wide transition-colors duration-200 ${activeSection === 'explore' ? 'text-primary-500' : 'text-slate-400'}`}>
                Explore
              </span>
            </Link>

            {/* Profile */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] rounded-xl active:scale-95 transition-transform duration-100 select-none touch-manipulation"
            >
              {mobileMenuOpen && (
                <div className="absolute inset-0 bg-primary-500/10 rounded-xl" />
              )}
              <div className="relative z-10">
                <div className={`w-7 h-7 rounded-full overflow-hidden transition-all duration-200 ${mobileMenuOpen ? 'ring-2 ring-primary-500 ring-offset-1 ring-offset-white' : 'ring-1 ring-slate-200'}`}>
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                </div>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-1 ring-white" />
                )}
              </div>
              <span className={`relative z-10 text-[10px] font-bold tracking-wide transition-colors duration-200 ${mobileMenuOpen ? 'text-primary-500' : 'text-slate-400'}`}>
                Profile
              </span>
            </button>

          </nav>
        </div>
      </div>

      {/* MOBILE PROFILE BOTTOM SHEET */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[60] lg:hidden backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white z-[70] lg:hidden rounded-t-3xl border-t border-slate-200 pb-[env(safe-area-inset-bottom)]"
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-3 mb-5" />

              <div className="px-5 pb-5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-200 shrink-0">
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-base font-bold text-slate-900 truncate">{userDisplayName}</div>
                    <div className="text-xs text-slate-500 font-mono truncate">{profile?.email || user.email}</div>
                  </div>
                </div>

                <div className="space-y-1 mb-6">
                  <Link
                    to={`/dashboard/profile/${user.id}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition"
                  >
                    <UserIcon /> My Profile
                  </Link>
                  <Link
                    to="/dashboard/build-logs"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition"
                  >
                    <FileTextIcon /> Build Logs
                  </Link>
                  <Link
                    to="/dashboard/discovery"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition"
                  >
                    <LightbulbIcon /> Discovery Mode
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setForceShowTour(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left"
                  >
                    <CompassIcon /> Replay Tour
                  </button>
                  {/* <Link 
                    to="/learning-hub"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeSection === 'learning-hub' ? 'bg-primary-400/10 text-primary-400' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                  >
                    <CompassIcon /> Learning Hub
                  </Link> */}
                </div>

                <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 px-4 mb-4">
                  <Link to="/privacy" onClick={() => setMobileMenuOpen(false)} className="hover:text-slate-900">Privacy Policy</Link>
                  <Link to="/terms" onClick={() => setMobileMenuOpen(false)} className="hover:text-slate-900">Terms of Service</Link>
                </div>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl transition"
                >
                  <LogOutIcon /> Sign out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
