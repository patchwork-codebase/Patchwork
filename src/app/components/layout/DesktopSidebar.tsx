import React from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { DashboardIcon, HammerIcon, ZapIcon, ActivityIcon, EyeIcon, CompassIcon, RoadmapIcon, MilestonesIcon, AnalyticsIcon, UserIcon, LogOutIcon, LightbulbIcon, AwardIcon } from "./LayoutIcons";
import { useObserverStats } from "../../hooks/useRooms";
import { UserAvatar } from "../ui/UserAvatar";
import { useTheme } from "../ui/ThemeProvider";
import { Moon, Sun } from "lucide-react";
const NavItem = ({ to, icon, label, active, badge }: any) => (
  <Link
    to={to}
    className={`relative flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-[13px] transition mb-1 border border-transparent focus-ring ${
      active ? 'text-primary-500 font-bold' : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
    }`}
  >
    {active && (
      <motion.div
        layoutId="desktopSidebarActive"
        className="absolute inset-0 bg-primary-500/15 border border-primary-500/30 rounded-xl z-0"
        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
      />
    )}
    <div className="flex items-center gap-2.5 relative z-10">
      {icon}
      {label}
    </div>
    {badge !== undefined && (
      <span className="relative z-10 text-[10px] font-mono font-bold bg-slate-50 dark:bg-[#1a1a1a] shadow-sm border border-slate-100 dark:border-white/10 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded-full">
        {badge}
      </span>
    )}
  </Link>
);

const ThemeToggleBtn = () => {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="flex items-center justify-center p-2.5 w-10 h-10 rounded-[12px] transition-all group text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-white/5 font-medium mb-4 ml-1"
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
};

interface DesktopSidebarProps {
  activeSection: string;
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
  userDisplayName,
  profile,
  user,
  profileMenuOpen,
  setProfileMenuOpen,
  setForceShowTour,
  handleSignOut
}: DesktopSidebarProps) {
  const isObserver = profile?.role === 'observer';
  const { data: stats } = useObserverStats(isObserver ? user?.id : undefined);

  const initials = profile?.name 
    ? profile.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) 
    : user?.email?.slice(0, 2).toUpperCase() || 'US';

  const userRoleText = profile?.title 
    || [profile?.domain, profile?.city].filter(Boolean).join(' · ') 
    || 'Observer';

  // Observer sidebar uses the same white sidebar shell as builders, with observer-specific nav items
  if (isObserver) {
    return (
      <aside className="hidden lg:flex w-[210px] min-w-[210px] bg-slate-50/90 dark:bg-[#0a0a0a]/90 backdrop-blur-md border-r border-slate-100 dark:border-white/5 flex-col sticky top-[60px] h-[calc(100vh-60px)] self-start z-30 shadow-[4px_0_24px_rgba(0,0,0,0.05)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.2)] transition-colors duration-300">

        <nav className="p-5 flex-1 overflow-y-auto custom-scrollbar">

          <div className="mb-2 px-3 text-[11px] uppercase tracking-widest text-slate-500 font-bold">
            Discover
          </div>

          <NavItem to="/dashboard" icon={<DashboardIcon />} label="Live feed" active={activeSection === 'overview' || activeSection === 'feed'} />
          <NavItem to="/dashboard/explore" icon={<CompassIcon />} label="Explore builders" active={activeSection === 'explore'} />
          {import.meta.env.DEV && (
            <NavItem to="/dashboard/experts" icon={<AwardIcon />} label="Expert directory" active={activeSection === 'experts'} />
          )}
          <NavItem to="/dashboard/build-logs" icon={<ZapIcon />} label="Best builds" active={activeSection === 'logs'} />

          <div className="mb-2 mt-6 px-3 text-[11px] uppercase tracking-widest text-slate-500 font-bold">
            Your activity
          </div>

          <NavItem to="/dashboard/rooms" icon={<EyeIcon />} label="Following" active={activeSection === 'rooms'} badge={stats?.roomsFollowed ?? 0} />
          <NavItem to="/dashboard/observer" icon={<ActivityIcon />} label="My reactions" active={activeSection === 'observer'} badge={stats?.totalReactions ?? 0} />

          <div className="mt-8 px-3 flex flex-wrap items-center gap-3 text-[11px] font-medium text-slate-500">
            <Link to="/privacy" className="hover:text-slate-900 dark:text-white transition">Privacy Policy</Link>
            <span>·</span>
            <Link to="/terms" className="hover:text-slate-900 dark:text-white transition">Terms of Service</Link>
          </div>
        </nav>

        <div className="px-4 mt-auto">
          <ThemeToggleBtn />
        </div>
        {/* Profile card at the very bottom */}
        <div className="border-t border-slate-100 dark:border-white/5 p-4 bg-slate-50 dark:bg-[#111111] shadow-sm dark:shadow-none">
          <div className="relative z-50">
            <button
              onClick={() => setProfileMenuOpen(o => !o)}
              className="w-full flex items-center gap-3 py-1.5 bg-transparent border-none cursor-pointer text-left group hover:opacity-80 transition"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-[#1a1a1a] border border-slate-100 dark:border-white/10 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                <UserAvatar userId={user?.id || ''} name={userDisplayName} avatarUrl={profile?.avatar || profile?.avatarUrl || profile?.avatar_url} className="w-full h-full object-cover scale-110" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold text-slate-900 dark:text-white truncate">{userDisplayName}</div>
                <div className="text-[10px] text-primary-500 mt-0.5 font-mono font-bold truncate uppercase">Observer</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:text-white transition">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            <AnimatePresence>
              {profileMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setProfileMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute bottom-full left-0 right-0 mb-2 border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden z-[100] bg-white dark:bg-[#1a1a1a]"
                  >
                    <div className="p-3 border-b border-slate-100 dark:border-white/5">
                      <div className="text-[12px] font-bold text-slate-900 dark:text-white">{profile?.name}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono truncate">
                        {profile?.email || user.email}
                      </div>
                    </div>
                    <Link
                      to={`/dashboard/profile/${user.id}`}
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 text-[12px] text-slate-600 dark:text-slate-300 hover:bg-white/5 hover:text-slate-900 dark:text-white transition"
                    >
                      <UserIcon /> Profile
                    </Link>
                    <Link
                      to="/dashboard/discovery"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 text-[12px] text-slate-600 dark:text-slate-300 hover:bg-white/5 hover:text-slate-900 dark:text-white transition"
                    >
                      <LightbulbIcon /> Discovery Mode
                    </Link>
                    <button
                      onClick={() => { setProfileMenuOpen(false); setForceShowTour(true); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[12px] text-slate-600 dark:text-slate-300 hover:bg-white/5 hover:text-slate-900 dark:text-white transition text-left"
                    >
                      <CompassIcon /> Replay Tour
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[12px] text-rose-500 hover:bg-rose-500/10 hover:text-rose-400 transition text-left"
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

  return (
        <aside className="hidden lg:flex w-[210px] min-w-[210px] bg-slate-50/90 dark:bg-[#0a0a0a]/90 backdrop-blur-md border-r border-slate-100 dark:border-white/5 flex-col sticky top-[60px] h-[calc(100vh-60px)] self-start z-30 shadow-[4px_0_24px_rgba(0,0,0,0.05)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.2)] transition-colors duration-300">

          <nav className="p-5 flex-1 overflow-y-auto custom-scrollbar">

            {/* workspace section */}
            <div className="mb-2 px-3 text-[11px] uppercase tracking-widest text-slate-500 font-bold">
              Primary
            </div>

            <NavItem to="/dashboard" icon={<DashboardIcon />} label="Dashboard" active={activeSection === 'overview'} />
            <NavItem to="/dashboard/rooms" icon={<HammerIcon />} label="My rooms" active={activeSection === 'rooms'} />
            <NavItem to="/dashboard/build-logs" icon={<ZapIcon />} label="Build logs" active={activeSection === 'logs'} />

            {/* discovery section */}
            <div className="mb-2 mt-6 px-3 text-[11px] uppercase tracking-widest text-slate-500 font-bold">
              Secondary
            </div>

            <NavItem to="/dashboard?tab=feed" icon={<ActivityIcon />} label="Global timeline" active={activeSection === 'feed'} />
            <NavItem to="/dashboard/observer" icon={<EyeIcon />} label="Observer hub" active={activeSection === 'observer'} />
            <NavItem to="/dashboard/explore" icon={<CompassIcon />} label="Explore builders" active={activeSection === 'explore'} />
            {import.meta.env.DEV && (
              <NavItem to="/dashboard/experts" icon={<AwardIcon />} label="Expert directory" active={activeSection === 'experts'} />
            )}
            <NavItem to="/pm-studio" icon={<LightbulbIcon />} label="PM Studio" active={false} />
            <NavItem to="/dashboard/achievements" icon={<AwardIcon />} label="Achievements" active={activeSection === 'achievements'} />
            
            <Link
              to="/dashboard/discovery"
              className={`relative flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-[13px] transition mb-1 mt-1 border-transparent focus-ring ${
                activeSection === 'discovery' ? 'text-amber-600 font-bold' : 'text-slate-600 font-medium hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {activeSection === 'discovery' && (
                <motion.div
                  layoutId="desktopSidebarActive"
                  className="absolute inset-0 bg-amber-500/15 border border-amber-500/30 rounded-xl z-0"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <div className="flex items-center gap-2.5 relative z-10">
                <LightbulbIcon />
                Discovery mode
              </div>
            </Link>

            {/* product ops section */}
            <div className="mb-2 mt-6 px-3 text-[11px] uppercase tracking-widest text-slate-500 font-bold">
              Product Ops
            </div>

            <NavItem to="/dashboard/roadmap" icon={<RoadmapIcon />} label="Roadmap view" active={activeSection === 'roadmap'} />
            <NavItem to="/dashboard/milestones" icon={<MilestonesIcon />} label="Milestones" active={activeSection === 'milestones'} />
            <NavItem to="/dashboard/analytics" icon={<AnalyticsIcon />} label="Analytics" active={activeSection === 'analytics'} />

            <div className="mt-8 px-3 flex flex-wrap items-center gap-3 text-[11px] font-medium text-slate-500">
              <Link to="/privacy" className="hover:text-slate-900 transition">Privacy Policy</Link>
              <span>·</span>
              <Link to="/terms" className="hover:text-slate-900 transition">Terms of Service</Link>
            </div>
          </nav>

          <div className="px-4 mt-auto">
            <ThemeToggleBtn />
          </div>
          {/* Profile card at the very bottom */}
          <div className="border-t border-slate-100 dark:border-white/5 p-4 bg-slate-50 dark:bg-[#111111] shadow-sm dark:shadow-none">
            <div className="relative z-50">
              <button
                onClick={() => setProfileMenuOpen(o => !o)}
                className="w-full flex items-center gap-3 py-1.5 bg-transparent border-none cursor-pointer text-left group hover:opacity-80 transition"
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-[#1a1a1a] border border-slate-100 dark:border-white/10 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                  <UserAvatar userId={user?.id || ''} name={userDisplayName} avatarUrl={profile?.avatar || profile?.avatarUrl || profile?.avatar_url} className="w-full h-full object-cover scale-110" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold text-slate-900 dark:text-white truncate">
                    {userDisplayName}
                  </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    {[profile?.domain, profile?.city].filter(Boolean).join(' · ') || profile?.role || 'Builder'}
                  </div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:text-white transition">
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
                      className="absolute bottom-full left-0 right-0 mb-2 border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden z-[100] bg-white dark:bg-[#1a1a1a]"
                    >
                      <div className="p-3 border-b border-slate-100 dark:border-white/5">
                        <div className="text-[12px] font-bold text-slate-900 dark:text-white">{profile?.name}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono truncate">
                          {profile?.email || user.email}
                        </div>
                      </div>
                      <Link
                        to={`/dashboard/profile/${user.id}`}
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 text-[12px] text-slate-600 dark:text-slate-300 hover:bg-white/5 hover:text-slate-900 dark:text-white transition"
                      >
                        <UserIcon /> Profile
                      </Link>
                      <Link
                        to="/dashboard/discovery"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 text-[12px] text-slate-600 dark:text-slate-300 hover:bg-white/5 hover:text-slate-900 dark:text-white transition"
                      >
                        <LightbulbIcon /> Discovery Mode
                      </Link>
                      <button
                        onClick={() => {
                          setProfileMenuOpen(false);
                          setForceShowTour(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[12px] text-slate-600 dark:text-slate-300 hover:bg-white/5 hover:text-slate-900 dark:text-white transition text-left"
                      >
                        <CompassIcon /> Replay Tour
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[12px] text-rose-500 hover:bg-rose-500/10 hover:text-rose-400 transition text-left"
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
