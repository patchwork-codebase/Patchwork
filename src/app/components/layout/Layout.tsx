import { Link, useLocation, useNavigate, Outlet, useSearchParams } from "react-router";
import { useAuth } from "../auth/AuthContext";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNotifications } from "../../hooks/useNotifications";
import { getAvatarUrl } from "../../utils/helpers";

/* ─── tiny inline SVGs ─────────────────────────────────────────── */
const HammerIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.95" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 12L9 6l-6 6 1.5 1.5L9 9l4.5 4.5L15 12Z" />
    <path d="M15 12l4.5 4.5-1.5 1.5L13.5 13.5" />
    <path d="M9 6l3-3 3 3" />
  </svg>
);

const DashboardIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.95" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.95" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" />
    <path d="M16 16L21 21" />
  </svg>
);

const ActivityIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.95" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.95" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const CompassIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.95" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const LogOutIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const UserIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const ZapIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.95" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.95" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

/* ─── Layout ────────────────────────────────────────────────────── */

import { timeAgo } from "../../utils/helpers";

export default function Layout() {
  const { user, profile, signOut, loading } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const { data: notificationsData, markAllAsRead } = useNotifications(user?.id);
  const notifications = notificationsData || [];
  const unreadCount = notifications.filter(n => !n.read).length;

  const activeTab = searchParams.get('tab') || 'overview';
  const activeSection = location.pathname.startsWith('/dashboard/explore')
    ? 'explore'
    : location.pathname.startsWith('/dashboard/build-logs')
      ? 'logs'
      : location.pathname.startsWith('/dashboard/observer')
        ? 'observer'
        : activeTab;

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08070D] flex items-center justify-center">
        <div className="flex items-center gap-2.5 text-slate-400 font-mono text-[13px]">
          <div className="w-4.5 h-4.5 rounded-full border-2 border-[#6C5CE7]/20 border-t-[#6C5CE7] animate-spin" />
          Loading Patchwork…
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  const avatarUrl = getAvatarUrl(user?.id || user?.email || 'default');

  const userDisplayName = profile?.name || user?.email?.split('@')[0] || 'User';

  return (
    <div className="flex flex-col min-h-screen bg-[#08070D] text-white pb-[env(safe-area-inset-bottom)] lg:pb-0">
      
      {/* ── GLOBAL TOP HEADER ─────────────────── */}
      <header className="relative h-[60px] bg-[#08070D]/85 backdrop-blur-xl border-b border-white/[0.08] flex flex-wrap items-center justify-between px-4 sm:px-6 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-white hover:opacity-80 transition group">
            <span>patch<span className="inline-block text-[#8B7CF8] group-hover:animate-[spin_2s_linear_infinite]">·</span>work</span>
            <span className="rounded bg-[#8B7CF8]/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#8B7CF8]">Beta</span>
          </Link>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Notifications Toggle */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2.5 text-slate-300 hover:text-white transition-colors rounded-full hover:bg-white/[0.05]"
            >
              <BellIcon />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#08070D]" />
              )}
            </button>

            {/* Notifications Dropdown */}
            <AnimatePresence>
            {notificationsOpen && (
              <motion.div 
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full right-0 sm:-right-4 mt-2 w-[320px] bg-[#0A0910]/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden z-50"
              >
                <div className="p-4 border-b border-white/[0.08] flex justify-between items-center">
                  <span className="text-[14px] font-bold text-white font-display">Notifications</span>
                  {unreadCount > 0 && (
                    <button onClick={() => markAllAsRead.mutate()} className="text-[11px] font-bold text-[#8B7CF8] hover:text-white transition-colors">Mark all read</button>
                  )}
                </div>
                <div className="max-h-[340px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-[13px]">No notifications yet.</div>
                  ) : (
                    notifications.map(n => {
                      const isReaction = n.type === 'reaction';
                      const actorName = n.actor?.name || 'Someone';
                      
                      let text = '';
                      let icon = '';
                      let bg = '';
                      let color = '';
                      
                      if (isReaction) {
                        const isLike = n.metadata?.reaction_type === 'like';
                        text = isLike ? 'reacted "Like" to your update' : 'replied to your update';
                        icon = isLike ? '⚡' : '🔄';
                        bg = 'bg-[#8B7CF8]/10';
                        color = 'text-[#8B7CF8]';
                      } else {
                        const roomTitle = n.metadata?.room_title || 'your room';
                        text = `started following "${roomTitle}"`;
                        icon = '👀';
                        bg = 'bg-emerald-500/10';
                        color = 'text-emerald-400';
                      }

                      return (
                        <div key={n.id} className="p-4 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors cursor-pointer flex gap-3 relative">
                          {!n.read && <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-rose-500" />}
                          <div className={`w-9 h-9 rounded-full ${bg} flex items-center justify-center shrink-0`}>
                            <span className="text-[16px]">{icon}</span>
                          </div>
                          <div>
                            <div className="text-[13px] text-slate-300 leading-snug">
                              <strong className="text-white">{actorName}</strong> {text}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-1.5 font-mono font-medium">{timeAgo(n.created_at)}</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                <Link to="/dashboard/notifications" onClick={() => setNotificationsOpen(false)} className="block p-3 text-center text-[12px] font-bold text-slate-400 hover:text-white bg-white/[0.01] hover:bg-white/[0.04] transition-colors">
                  View all activity
                </Link>
              </motion.div>
            )}
            </AnimatePresence>
          </div>

          <button
            type="button"
            className="lg:hidden inline-flex items-center justify-center rounded-full border border-white/[0.08] p-2 text-slate-300 hover:text-white hover:border-white/[0.2] transition"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileMenuOpen(open => !open)}
          >
            <span className="sr-only">Toggle navigation</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              {mobileMenuOpen ? (
                <path d="M18 6 6 18M6 6l12 12" />
              ) : (
                <>
                  <path d="M3 7h18" />
                  <path d="M3 12h18" />
                  <path d="M3 17h18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </header>
      <AnimatePresence>
      {mobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "100vh" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="lg:hidden fixed inset-0 top-[60px] z-50 bg-[#08070D]/98 border-b border-white/[0.08] backdrop-blur-xl overflow-y-auto"
        >
          <nav className="flex flex-col gap-1 px-4 py-4 pb-[env(safe-area-inset-bottom)]">
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className={`rounded-xl px-3 py-3 text-sm font-medium ${activeSection === 'overview' ? 'bg-[#6C5CE7]/15 text-[#8B7CF8]' : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'}`}
            >
              Dashboard
            </Link>
            <Link
              to="/dashboard?tab=feed"
              onClick={() => setMobileMenuOpen(false)}
              className={`rounded-xl px-3 py-3 text-sm font-medium ${activeSection === 'feed' ? 'bg-[#6C5CE7]/15 text-[#8B7CF8]' : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'}`}
            >
              Global timeline
            </Link>
            <Link
              to="/dashboard/build-logs"
              onClick={() => setMobileMenuOpen(false)}
              className={`rounded-xl px-3 py-3 text-sm font-medium ${activeSection === 'logs' ? 'bg-[#6C5CE7]/15 text-[#8B7CF8]' : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'}`}
            >
              Build log
            </Link>
            <Link
              to="/dashboard/observer"
              onClick={() => setMobileMenuOpen(false)}
              className={`rounded-xl px-3 py-3 text-sm font-medium ${activeSection === 'observer' ? 'bg-[#6C5CE7]/15 text-[#8B7CF8]' : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'}`}
            >
              Observer hub
            </Link>
            <Link
              to="/dashboard/explore"
              onClick={() => setMobileMenuOpen(false)}
              className={`rounded-xl px-3 py-3 text-sm font-medium ${activeSection === 'explore' ? 'bg-[#6C5CE7]/15 text-[#8B7CF8]' : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'}`}
            >
              Explore
            </Link>
            
            <div className="mt-2 pt-2 border-t border-white/[0.08]">
              <div className="px-3 py-2 mb-1">
                <div className="text-[12px] font-bold text-white">{profile?.name}</div>
                <div className="text-[10px] text-slate-400 mt-0.5 font-mono truncate">
                  {profile?.email || user.email}
                </div>
              </div>
              <Link
                to={`/dashboard/profile/${user.id}`}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-3 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/[0.04] rounded-xl"
              >
                <UserIcon /> Profile
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleSignOut();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-3 text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl text-left"
              >
                <LogOutIcon /> Sign out
              </button>
            </div>
          </nav>
        </motion.div>
      )}
      </AnimatePresence>

      {/* ── MOBILE BOTTOM NAVIGATION ─────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 h-[70px] bg-[#0A0910]/90 backdrop-blur-xl border-t border-white/[0.08] flex items-center justify-center px-1 sm:px-2 z-50 lg:hidden shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <nav className="flex items-center justify-between gap-1 w-full max-w-md mx-auto px-1 pb-1">
          <Link
            to="/dashboard"
            className={`flex flex-col flex-1 items-center justify-center gap-1 rounded-2xl border px-1 sm:px-2 py-2 min-w-0 ${activeSection === 'overview' ? 'border-[#6C5CE7]/30 bg-[#6C5CE7]/10 text-[#8B7CF8]' : 'border-white/[0.08] bg-white/[0.02] text-slate-300 hover:text-white hover:bg-white/[0.05]'}`}
          >
            <div className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-2xl ${activeSection === 'overview' ? 'bg-[#6C5CE7]/20 text-[#8B7CF8]' : 'bg-white/[0.05]'}`}>
              <DashboardIcon />
            </div>
            <span className="text-[9px] sm:text-[10px] md:text-[11px] font-semibold truncate w-full text-center">Home</span>
          </Link>
          <Link
            to="/dashboard?tab=feed"
            className={`flex flex-col flex-1 items-center justify-center gap-1 rounded-2xl border px-1 sm:px-2 py-2 min-w-0 ${activeSection === 'feed' ? 'border-[#6C5CE7]/30 bg-[#6C5CE7]/10 text-[#8B7CF8]' : 'border-white/[0.08] bg-white/[0.02] text-slate-300 hover:text-white hover:bg-white/[0.05]'}`}
          >
            <div className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-2xl ${activeSection === 'feed' ? 'bg-[#6C5CE7]/20 text-[#8B7CF8]' : 'bg-white/[0.05]'}`}>
              <SearchIcon />
            </div>
            <span className="text-[9px] sm:text-[10px] md:text-[11px] font-semibold truncate w-full text-center">Feed</span>
          </Link>
          <Link
            to="/dashboard/build-logs"
            className={`flex flex-col flex-1 items-center justify-center gap-1 rounded-2xl border px-1 sm:px-2 py-2 min-w-0 ${activeSection === 'logs' ? 'border-[#6C5CE7]/30 bg-[#6C5CE7]/10 text-[#8B7CF8]' : 'border-white/[0.08] bg-white/[0.02] text-slate-300 hover:text-white hover:bg-white/[0.05]'}`}
          >
            <div className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-2xl ${activeSection === 'logs' ? 'bg-[#6C5CE7]/20 text-[#8B7CF8]' : 'bg-white/[0.05]'}`}>
              <ZapIcon />
            </div>
            <span className="text-[9px] sm:text-[10px] md:text-[11px] font-semibold truncate w-full text-center">Logs</span>
          </Link>
          <Link
            to="/dashboard/observer"
            className={`flex flex-col flex-1 items-center justify-center gap-1 rounded-2xl border px-1 sm:px-2 py-2 min-w-0 ${activeSection === 'observer' ? 'border-[#6C5CE7]/30 bg-[#6C5CE7]/10 text-[#8B7CF8]' : 'border-white/[0.08] bg-white/[0.02] text-slate-300 hover:text-white hover:bg-white/[0.05]'}`}
          >
            <div className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-2xl ${activeSection === 'observer' ? 'bg-[#6C5CE7]/20 text-[#8B7CF8]' : 'bg-white/[0.05]'}`}>
              <ZapIcon />
            </div>
            <span className="text-[9px] sm:text-[10px] md:text-[11px] font-semibold truncate w-full text-center">Observer</span>
          </Link>
          <Link
            to="/dashboard/explore"
            className={`flex flex-col flex-1 items-center justify-center gap-1 rounded-2xl border px-1 sm:px-2 py-2 min-w-0 ${activeSection === 'explore' ? 'border-[#6C5CE7]/30 bg-[#6C5CE7]/10 text-[#8B7CF8]' : 'border-white/[0.08] bg-white/[0.02] text-slate-300 hover:text-white hover:bg-white/[0.05]'}`}
          >
            <div className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-2xl ${activeSection === 'explore' ? 'bg-[#6C5CE7]/20 text-[#8B7CF8]' : 'bg-white/[0.05]'}`}>
              <HammerIcon />
            </div>
            <span className="text-[9px] sm:text-[10px] md:text-[11px] font-semibold truncate w-full text-center">Explore</span>
          </Link>
        </nav>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 pb-[70px] lg:pb-0">

        {/* ── LEFT SIDEBAR ─────────────────────────────────── */}
        <aside className="hidden lg:flex w-[210px] min-w-[210px] bg-[#0A0910] border-r border-white/[0.08] flex-col sticky top-[60px] h-[calc(100vh-60px)] z-30">

          <nav className="p-5 flex-1">
            
            {/* workspace section */}
            <div className="mb-2 px-3 text-[11px] uppercase tracking-widest text-slate-500 font-bold">
              Primary
            </div>

            <Link
              to="/dashboard"
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] transition mb-1 border ${activeSection === 'overview' ? 'bg-[#6C5CE7]/15 text-[#8B7CF8] font-bold border-[#6C5CE7]/30' : 'text-slate-400 font-medium border-transparent hover:text-white hover:bg-white/[0.04]'}`}
            >
              <DashboardIcon />
              Dashboard
            </Link>

            <Link
              to="/dashboard?tab=mine"
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] transition mb-1 border ${activeSection === 'mine' ? 'bg-[#6C5CE7]/15 text-[#8B7CF8] font-bold border-[#6C5CE7]/30' : 'text-slate-400 font-medium border-transparent hover:text-white hover:bg-white/[0.04]'}`}
            >
              <div className="flex items-center gap-2.5">
                <HammerIcon />
                My rooms
              </div>
              <span className={`text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center ${activeSection === 'mine' ? 'bg-[#6C5CE7] text-white' : 'bg-white/10 text-slate-300'}`}>
                3
              </span>
            </Link>

            <Link
              to="/dashboard/build-logs"
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] transition mb-5 border ${activeSection === 'logs' ? 'bg-[#6C5CE7]/15 text-[#8B7CF8] font-bold border-[#6C5CE7]/30' : 'text-slate-400 font-medium border-transparent hover:text-white hover:bg-white/[0.04]'}`}
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
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] transition mb-1 border ${activeSection === 'feed' ? 'bg-[#6C5CE7]/15 text-[#8B7CF8] font-bold border-[#6C5CE7]/30' : 'text-slate-400 font-medium border-transparent hover:text-white hover:bg-white/[0.04]'}`}
            >
              <div className="flex items-center gap-2.5">
                <ActivityIcon />
                Global timeline
              </div>
              <span className={`text-[9px] font-bold rounded-full px-1.5 h-4 min-w-4 flex items-center justify-center ${activeSection === 'feed' ? 'bg-emerald-500 text-white' : 'bg-white/10 text-slate-300'}`}>
                12
              </span>
            </Link>

            <Link
              to="/dashboard/observer"
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] transition mb-1 border ${activeSection === 'observer' ? 'bg-[#6C5CE7]/15 text-[#8B7CF8] font-bold border-[#6C5CE7]/30' : 'text-slate-400 font-medium border-transparent hover:text-white hover:bg-white/[0.04]'}`}
            >
              <div className="flex items-center gap-2.5">
                <EyeIcon />
                Observer hub
              </div>
              <span className={`text-[9px] font-bold rounded-full px-1.5 h-4 min-w-4 flex items-center justify-center ${activeSection === 'observer' ? 'bg-[#6C5CE7] text-white' : 'bg-white/10 text-slate-300'}`}>
                3
              </span>
            </Link>

            <Link
              to="/dashboard/explore"
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] transition border ${activeSection === 'explore' ? 'bg-[#6C5CE7]/15 text-[#8B7CF8] font-bold border-[#6C5CE7]/30' : 'text-slate-400 font-medium border-transparent hover:text-white hover:bg-white/[0.04]'}`}
            >
              <CompassIcon />
              Explore builders
            </Link>

            <div className="mt-8 px-3 flex flex-wrap items-center gap-3 text-[11px] font-medium text-slate-500">
              <Link to="/privacy" className="hover:text-white transition">Privacy Policy</Link>
              <span>·</span>
              <Link to="/terms" className="hover:text-white transition">Terms of Service</Link>
            </div>
          </nav>

          {/* Profile card at the very bottom */}
          <div className="border-t border-white/[0.08] p-4 bg-white/[0.01]">
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(o => !o)}
                className="w-full flex items-center gap-3 py-1.5 bg-transparent border-none cursor-pointer text-left group hover:opacity-80 transition"
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.08] flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover scale-110" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold text-white truncate">
                    {userDisplayName}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    product · Lagos
                  </div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-slate-500 group-hover:text-white transition">
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
                    className="absolute bottom-full left-0 right-0 mb-2 bg-[#0E0C16] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden z-20 backdrop-blur-xl"
                  >
                    <div className="p-3 border-b border-white/[0.08]">
                      <div className="text-[12px] font-bold text-white">{profile?.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-mono truncate">
                        {profile?.email || user.email}
                      </div>
                    </div>
                    <Link
                      to={`/dashboard/profile/${user.id}`}
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 text-[12px] text-slate-300 hover:bg-white/[0.04] hover:text-white transition"
                    >
                      <UserIcon /> Profile
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[12px] text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition text-left"
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

        <main className="flex-1 min-h-[calc(100vh-60px)] bg-[#08070D] pb-28">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
