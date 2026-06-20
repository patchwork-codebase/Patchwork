import React from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { DashboardIcon, HammerIcon, ZapIcon, ActivityIcon, EyeIcon, CompassIcon, RoadmapIcon, MilestonesIcon, AnalyticsIcon, UserIcon, LogOutIcon } from "./LayoutIcons";

interface DesktopSidebarProps {
  activeSection: string;
  avatarUrl: string;
  userDisplayName: string;
  profile: any;
  user: any;
  profileMenuOpen: boolean;
  setProfileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setForceShowTour: (val: boolean) => void;
  handleSignOut: () => void;
}

export function DesktopSidebar({
  activeSection,
  avatarUrl,
  userDisplayName,
  profile,
  user,
  profileMenuOpen,
  setProfileMenuOpen,
  setForceShowTour,
  handleSignOut
}: DesktopSidebarProps) {
  return (
        <aside className="hidden lg:flex w-[210px] min-w-[210px] bg-white border-r border-slate-200 flex-col sticky top-[60px] h-[calc(100vh-60px)] z-30">

          <nav className="p-5 flex-1 overflow-y-auto">

            {/* workspace section */}
            <div className="mb-2 px-3 text-[11px] uppercase tracking-widest text-slate-500 font-bold">
              Primary
            </div>

            <Link
              to="/dashboard"
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] transition mb-1 border ${activeSection === 'overview' ? 'bg-primary-500/15 text-primary-400 font-bold border-primary-500/30' : 'text-slate-600 font-medium border-transparent hover:text-slate-900 hover:bg-slate-50'}`}
            >
              <DashboardIcon />
              Dashboard
            </Link>

            <Link
              to="/dashboard/rooms"
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] transition mb-1 border ${activeSection === 'rooms' ? 'bg-primary-500/15 text-primary-400 font-bold border-primary-500/30' : 'text-slate-600 font-medium border-transparent hover:text-slate-900 hover:bg-slate-50'}`}
            >
              <div className="flex items-center gap-2.5">
                <HammerIcon />
                My rooms
              </div>
            </Link>

            <Link
              to="/dashboard/build-logs"
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] transition mb-5 border ${activeSection === 'logs' ? 'bg-primary-500/15 text-primary-400 font-bold border-primary-500/30' : 'text-slate-600 font-medium border-transparent hover:text-slate-900 hover:bg-slate-50'}`}
            >
              <ZapIcon />
              Build logs
            </Link>

            {/* discovery section */}
            <div className="mb-2 mt-6 px-3 text-[11px] uppercase tracking-widest text-slate-500 font-bold">
              Secondary
            </div>

            <Link
              to="/dashboard?tab=feed"
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] transition mb-1 border ${activeSection === 'feed' ? 'bg-primary-500/15 text-primary-400 font-bold border-primary-500/30' : 'text-slate-600 font-medium border-transparent hover:text-slate-900 hover:bg-slate-50'}`}
            >
              <ActivityIcon />
              Global timeline
            </Link>

            <Link
              to="/dashboard/observer"
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] transition mb-1 border ${activeSection === 'observer' ? 'bg-primary-500/15 text-primary-400 font-bold border-primary-500/30' : 'text-slate-600 font-medium border-transparent hover:text-slate-900 hover:bg-slate-50'}`}
            >
              <EyeIcon />
              Observer hub
            </Link>

            <Link
              to="/dashboard/explore"
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] transition border ${activeSection === 'explore' ? 'bg-primary-500/15 text-primary-400 font-bold border-primary-500/30' : 'text-slate-600 font-medium border-transparent hover:text-slate-900 hover:bg-slate-50'}`}
            >
              <CompassIcon />
              Explore builders
            </Link>

            {/* <Link
              to="/learning-hub"
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] transition border ${activeSection === 'learning-hub' ? 'bg-primary-500/15 text-primary-400 font-bold border-primary-500/30' : 'text-slate-600 font-medium border-transparent hover:text-slate-900 hover:bg-slate-50'}`}
            >
              <CompassIcon />
              Learning Hub
            </Link> */}

            {/* product ops section */}
            <div className="mb-2 mt-6 px-3 text-[11px] uppercase tracking-widest text-slate-500 font-bold">
              Product Ops
            </div>

            <Link
              to="/dashboard/roadmap"
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] transition mb-1 border ${activeSection === 'roadmap' ? 'bg-primary-500/15 text-primary-400 font-bold border-primary-500/30' : 'text-slate-600 font-medium border-transparent hover:text-slate-900 hover:bg-slate-50'}`}
            >
              <RoadmapIcon />
              Roadmap view
            </Link>

            <Link
              to="/dashboard/milestones"
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] transition mb-1 border ${activeSection === 'milestones' ? 'bg-primary-500/15 text-primary-400 font-bold border-primary-500/30' : 'text-slate-600 font-medium border-transparent hover:text-slate-900 hover:bg-slate-50'}`}
            >
              <MilestonesIcon />
              Milestones
            </Link>

            <Link
              to="/dashboard/analytics"
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] transition border ${activeSection === 'analytics' ? 'bg-primary-500/15 text-primary-400 font-bold border-primary-500/30' : 'text-slate-600 font-medium border-transparent hover:text-slate-900 hover:bg-slate-50'}`}
            >
              <AnalyticsIcon />
              Analytics
            </Link>

            <div className="mt-8 px-3 flex flex-wrap items-center gap-3 text-[11px] font-medium text-slate-500">
              <Link to="/privacy" className="hover:text-slate-900 transition">Privacy Policy</Link>
              <span>·</span>
              <Link to="/terms" className="hover:text-slate-900 transition">Terms of Service</Link>
            </div>
          </nav>

          {/* Profile card at the very bottom */}
          <div className="border-t border-slate-200 p-4 bg-slate-50/50">
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(o => !o)}
                className="w-full flex items-center gap-3 py-1.5 bg-transparent border-none cursor-pointer text-left group hover:opacity-80 transition"
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover scale-110" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold text-slate-900 truncate">
                    {userDisplayName}
                  </div>
                <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                    {[profile?.domain, profile?.city].filter(Boolean).join(' · ') || profile?.role || 'Builder'}
                  </div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-slate-400 group-hover:text-slate-700 transition">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {/* Profile dropdown menu */}
              <AnimatePresence>
                {profileMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setProfileMenuOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden z-20 backdrop-blur-xl"
                    >
                      <div className="p-3 border-b border-slate-100">
                        <div className="text-[12px] font-bold text-slate-900">{profile?.name}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5 font-mono truncate">
                          {profile?.email || user.email}
                        </div>
                      </div>
                      <Link
                        to={`/dashboard/profile/${user.id}`}
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 text-[12px] text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
                      >
                        <UserIcon /> Profile
                      </Link>
                      <button
                        onClick={() => {
                          setProfileMenuOpen(false);
                          setForceShowTour(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[12px] text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition text-left"
                      >
                        <CompassIcon /> Replay Tour
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[12px] text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition text-left"
                      >
                        <LogOutIcon /> Sign out
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </aside>
  );
}
