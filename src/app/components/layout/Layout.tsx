import { Link, useLocation, useNavigate, Outlet, useSearchParams } from "react-router";
import { useAuth } from "../auth/AuthContext";
import { useState, useEffect, useRef } from "react";
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
  const [isNavExpanded, setIsNavExpanded] = useState(true);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const scrollDiff = currentScrollY - lastScrollYRef.current;
          
          if (scrollDiff > 5 && currentScrollY > 80) {
            // Scrolling down significantly
            setIsNavExpanded(false);
          } else if (scrollDiff < -5) {
            // Scrolling up significantly
            setIsNavExpanded(true);
          }
          
          lastScrollYRef.current = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

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
        </div>
      </header>

      {/* ── UNVERIFIED EMAIL BANNER ───────────────────────── */}
      {profile && !profile.emailVerified && (
        <div className="w-full bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex items-center justify-between gap-3 z-40">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-amber-400 shrink-0" aria-hidden>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </span>
            <p className="text-[12px] sm:text-[13px] text-amber-300 font-medium leading-snug truncate">
              <strong className="font-bold">Verify your email</strong> to post updates, create rooms, and react to builds.
            </p>
          </div>
          <a
            href="/verify-email"
            className="shrink-0 text-[11px] sm:text-[12px] font-bold text-amber-400 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap"
          >
            Verify now →
          </a>
        </div>
      )}

      <motion.div
        className="fixed bottom-0 left-0 right-0 flex items-center justify-center px-4 py-3 z-50 lg:hidden pb-[calc(12px+env(safe-area-inset-bottom))]"
        animate={{ scale: isNavExpanded ? 1 : 0.92, y: isNavExpanded ? 0 : 8 }}
        transition={{ type: "tween", duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <motion.div
          className="w-full max-w-md bg-black/80 backdrop-blur-2xl rounded-full border border-white/10 shadow-2xl"
          animate={{ padding: isNavExpanded ? "12px" : "10px" }}
          transition={{ type: "tween", duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <nav className="flex items-center justify-between gap-1">
            <Link
              to="/dashboard"
              className="relative flex-1 flex items-center justify-center py-2"
            >
              <AnimatePresence mode="wait">
                {activeSection === 'overview' ? (
                  <motion.div
                    key="active-home"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="absolute inset-x-1 inset-y-0 bg-white/20 rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  />
                ) : null}
              </AnimatePresence>
              <motion.div
                animate={{ 
                  color: activeSection === 'overview' ? '#fff' : '#94a3b8',
                  scale: activeSection === 'overview' ? 1.1 : 1
                }}
                transition={{ duration: 0.2 }}
                className="relative z-10"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </motion.div>
            </Link>
            <Link
              to="/dashboard?tab=feed"
              className="relative flex-1 flex items-center justify-center py-2"
            >
              <AnimatePresence mode="wait">
                {activeSection === 'feed' ? (
                  <motion.div
                    key="active-feed"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="absolute inset-x-1 inset-y-0 bg-white/10 rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  />
                ) : null}
              </AnimatePresence>
              <motion.div
                animate={{ 
                  color: activeSection === 'feed' ? '#fff' : '#94a3b8',
                  scale: activeSection === 'feed' ? 1.1 : 1
                }}
                transition={{ duration: 0.2 }}
                className="relative z-10"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                  <circle cx="9" cy="9" r="2"/>
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                </svg>
              </motion.div>
            </Link>
            <Link
              to="/dashboard/build-logs"
              className="relative flex-1 flex items-center justify-center py-2"
            >
              <AnimatePresence mode="wait">
                {activeSection === 'logs' ? (
                  <motion.div
                    key="active-logs"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="absolute inset-x-1 inset-y-0 bg-white/10 rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  />
                ) : null}
              </AnimatePresence>
              <motion.div
                animate={{ 
                  color: activeSection === 'logs' ? '#fff' : '#94a3b8',
                  scale: activeSection === 'logs' ? 1.1 : 1
                }}
                transition={{ duration: 0.2 }}
                className="relative z-10"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
                {activeSection === 'logs' && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-0.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full"
                  />
                )}
              </motion.div>
            </Link>
            <Link
              to="/dashboard/explore"
              className="relative flex-1 flex items-center justify-center py-2"
            >
              <AnimatePresence mode="wait">
                {activeSection === 'explore' ? (
                  <motion.div
                    key="active-explore"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="absolute inset-x-1 inset-y-0 bg-white/10 rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  />
                ) : null}
              </AnimatePresence>
              <motion.div
                animate={{ 
                  color: activeSection === 'explore' ? '#fff' : '#94a3b8',
                  scale: activeSection === 'explore' ? 1.1 : 1
                }}
                transition={{ duration: 0.2 }}
                className="relative z-10"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
              </motion.div>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="relative flex-1 flex items-center justify-center py-2"
            >
              <motion.div
                className="w-9 h-9 rounded-full overflow-hidden border border-white/20"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              </motion.div>
            </button>
          </nav>
        </motion.div>
      </motion.div>

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
            className="fixed bottom-0 left-0 right-0 bg-[#0E0C16] z-[70] lg:hidden rounded-t-3xl border-t border-white/[0.08] pb-[env(safe-area-inset-bottom)]"
          >
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-3 mb-5" />
            
            <div className="px-5 pb-5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 shrink-0">
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <div className="text-base font-bold text-white truncate">{userDisplayName}</div>
                  <div className="text-xs text-slate-400 font-mono truncate">{profile?.email || user.email}</div>
                </div>
              </div>

              <div className="space-y-1 mb-6">
                <Link
                  to={`/dashboard/profile/${user.id}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-slate-200 hover:bg-white/[0.04] rounded-xl transition"
                >
                  <UserIcon /> My Profile
                </Link>
                <Link
                  to="/dashboard/explore"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-slate-200 hover:bg-white/[0.04] rounded-xl transition"
                >
                  <CompassIcon /> Explore Builders
                </Link>
              </div>

              <div className="pt-2 border-t border-white/10 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 px-4 mb-4">
                <Link to="/privacy" onClick={() => setMobileMenuOpen(false)} className="hover:text-white">Privacy Policy</Link>
                <Link to="/terms" onClick={() => setMobileMenuOpen(false)} className="hover:text-white">Terms of Service</Link>
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
