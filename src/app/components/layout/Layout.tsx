import { Link, useLocation, useNavigate, Outlet, useSearchParams } from "react-router";
import { useAuth } from "../auth/AuthContext";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

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
export default function Layout() {
  const { user, profile, signOut, loading } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);

  const activeTab = searchParams.get('tab') || 'overview';
  const activeSection = location.pathname.startsWith('/dashboard/explore')
    ? 'explore'
    : location.pathname.startsWith('/dashboard/build-logs')
      ? 'logs'
      : location.pathname.startsWith('/dashboard/observer')
        ? 'observer'
        : activeTab;

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
    navigate('/login');
    return null;
  }

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  const initials = profile?.name
    ? profile.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const userDisplayName = profile?.name === 'Developer' ? 'Akinrodolu' : (profile?.name || 'Akinrodolu');

  return (
    <div className="flex flex-col min-h-screen bg-[#08070D] text-white">
      
      {/* ── GLOBAL TOP HEADER ─────────────────── */}
      <header className="relative h-[60px] bg-[#08070D]/85 backdrop-blur-xl border-b border-white/[0.06] flex flex-wrap items-center justify-between px-4 sm:px-6 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="text-lg font-extrabold tracking-tight text-white hover:opacity-80 transition">
            patch<span className="text-[#8B7CF8]">·</span>work
          </Link>
        </div>
        <div className="hidden lg:flex items-center gap-6">
          <Link to="/" className="text-[13px] font-semibold text-slate-400 hover:text-white transition">Features</Link>
          <Link to="/" className="text-[13px] font-semibold text-slate-400 hover:text-white transition">Builders</Link>
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
                <div className="p-4 border-b border-white/[0.06] flex justify-between items-center">
                  <span className="text-[14px] font-bold text-white font-display">Notifications</span>
                  <button onClick={() => setUnreadCount(0)} className="text-[11px] font-bold text-[#8B7CF8] hover:text-white transition-colors">Mark all read</button>
                </div>
                <div className="max-h-[340px] overflow-y-auto">
                  {[
                    { id: 1, text: 'reacted "Sharp" to your MoniFlow update', user: 'Tobi N.', icon: '⚡', color: 'text-[#8B7CF8]', bg: 'bg-[#8B7CF8]/10' },
                    { id: 2, text: 'started following your room', user: 'Funmi O.', icon: '👀', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                    { id: 3, text: 'reacted "Push back" on day 12 update', user: 'James', icon: '🔄', color: 'text-rose-400', bg: 'bg-rose-500/10' }
                  ].map(n => (
                    <div key={n.id} className="p-4 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors cursor-pointer flex gap-3 relative">
                      {unreadCount > 0 && n.id <= unreadCount && <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-rose-500" />}
                      <div className={`w-9 h-9 rounded-full ${n.bg} flex items-center justify-center shrink-0`}>
                        <span className="text-[16px]">{n.icon}</span>
                      </div>
                      <div>
                        <div className="text-[13px] text-slate-300 leading-snug">
                          <strong className="text-white">{n.user}</strong> {n.text}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1.5 font-mono font-medium">just now</div>
                      </div>
                    </div>
                  ))}
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
            className="lg:hidden inline-flex items-center justify-center rounded-full border border-white/[0.12] p-2 text-slate-300 hover:text-white hover:border-white/[0.2] transition"
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
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="lg:hidden absolute inset-x-0 top-[60px] z-40 bg-[#08070D]/95 border-b border-white/[0.08] backdrop-blur-xl overflow-hidden"
        >
          <nav className="flex flex-col gap-1 px-4 py-4">
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
              Live feed
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
          </nav>
        </motion.div>
      )}
      </AnimatePresence>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.08] bg-[#08070D]/95 backdrop-blur-xl shadow-[0_-2px_30px_rgba(0,0,0,0.2)]">
        <nav className="mx-auto max-w-[1100px] grid grid-cols-5 gap-2 px-3 py-3">
          <Link
            to="/dashboard"
            className={`flex flex-col items-center justify-center gap-1 rounded-2xl border px-3 py-2 ${activeSection === 'overview' ? 'border-[#6C5CE7]/30 bg-[#6C5CE7]/10 text-[#8B7CF8]' : 'border-white/[0.08] bg-white/[0.02] text-slate-300 hover:text-white hover:bg-white/[0.05]'}`}
          >
            <div className={`flex items-center justify-center w-9 h-9 rounded-2xl ${activeSection === 'overview' ? 'bg-[#6C5CE7]/20 text-[#8B7CF8]' : 'bg-white/[0.05]'}`}>
              <DashboardIcon />
            </div>
            <span className="text-[11px] font-semibold">Home</span>
          </Link>
          <Link
            to="/dashboard?tab=feed"
            className={`flex flex-col items-center justify-center gap-1 rounded-2xl border px-3 py-2 ${activeSection === 'feed' ? 'border-[#6C5CE7]/30 bg-[#6C5CE7]/10 text-[#8B7CF8]' : 'border-white/[0.08] bg-white/[0.02] text-slate-300 hover:text-white hover:bg-white/[0.05]'}`}
          >
            <div className={`flex items-center justify-center w-9 h-9 rounded-2xl ${activeSection === 'feed' ? 'bg-[#6C5CE7]/20 text-[#8B7CF8]' : 'bg-white/[0.05]'}`}>
              <SearchIcon />
            </div>
            <span className="text-[11px] font-semibold">Feed</span>
          </Link>
          <Link
            to="/dashboard/build-logs"
            className={`flex flex-col items-center justify-center gap-1 rounded-2xl border px-3 py-2 ${activeSection === 'logs' ? 'border-[#6C5CE7]/30 bg-[#6C5CE7]/10 text-[#8B7CF8]' : 'border-white/[0.08] bg-white/[0.02] text-slate-300 hover:text-white hover:bg-white/[0.05]'}`}
          >
            <div className={`flex items-center justify-center w-9 h-9 rounded-2xl ${activeSection === 'logs' ? 'bg-[#6C5CE7]/20 text-[#8B7CF8]' : 'bg-white/[0.05]'}`}>
              <ZapIcon />
            </div>
            <span className="text-[11px] font-semibold">Build log</span>
          </Link>
          <Link
            to="/dashboard/observer"
            className={`flex flex-col items-center justify-center gap-1 rounded-2xl border px-3 py-2 ${activeSection === 'observer' ? 'border-[#6C5CE7]/30 bg-[#6C5CE7]/10 text-[#8B7CF8]' : 'border-white/[0.08] bg-white/[0.02] text-slate-300 hover:text-white hover:bg-white/[0.05]'}`}
          >
            <div className={`flex items-center justify-center w-9 h-9 rounded-2xl ${activeSection === 'observer' ? 'bg-[#6C5CE7]/20 text-[#8B7CF8]' : 'bg-white/[0.05]'}`}>
              <ZapIcon />
            </div>
            <span className="text-[11px] font-semibold">Observer</span>
          </Link>
          <Link
            to="/dashboard/explore"
            className={`flex flex-col items-center justify-center gap-1 rounded-2xl border px-3 py-2 ${activeSection === 'explore' ? 'border-[#6C5CE7]/30 bg-[#6C5CE7]/10 text-[#8B7CF8]' : 'border-white/[0.08] bg-white/[0.02] text-slate-300 hover:text-white hover:bg-white/[0.05]'}`}
          >
            <div className={`flex items-center justify-center w-9 h-9 rounded-2xl ${activeSection === 'explore' ? 'bg-[#6C5CE7]/20 text-[#8B7CF8]' : 'bg-white/[0.05]'}`}>
              <HammerIcon />
            </div>
            <span className="text-[11px] font-semibold">Explore</span>
          </Link>
        </nav>
      </div>

      <div className="flex flex-col lg:flex-row flex-1">

        {/* ── LEFT SIDEBAR ─────────────────────────────────── */}
        <aside className="hidden lg:flex w-[210px] min-w-[210px] bg-[#0A0910] border-r border-white/[0.06] flex-col sticky top-[60px] h-[calc(100vh-60px)] z-30">

          <nav className="p-5 flex-1">
            
            {/* workspace section */}
            <div className="mb-2.5 px-2 text-[10px] lowercase tracking-wider text-slate-500 font-bold">
              workspace
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
            <div className="mb-2.5 px-2 text-[10px] lowercase tracking-wider text-slate-500 font-bold">
              discovery
            </div>

            <Link
              to="/dashboard?tab=feed"
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] transition mb-1 border ${activeSection === 'feed' ? 'bg-[#6C5CE7]/15 text-[#8B7CF8] font-bold border-[#6C5CE7]/30' : 'text-slate-400 font-medium border-transparent hover:text-white hover:bg-white/[0.04]'}`}
            >
              <div className="flex items-center gap-2.5">
                <SearchIcon />
                Live feed
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
                <SearchIcon />
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
              <SearchIcon />
              Explore builders
            </Link>

            {/* + Massive Post button at the bottom of navigation */}
            <div className="mt-8 px-2">
              <Link
                to="/dashboard/create"
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-[#8B7CF8] hover:bg-[#7b6ce8] text-white rounded-full text-[15px] font-bold transition shadow-[0_4px_14px_rgba(108,92,231,0.25)] active:scale-95"
              >
                <PlusIcon />
                Post Update
              </Link>
            </div>
          </nav>

          {/* Profile card at the very bottom */}
          <div className="border-t border-white/[0.06] p-4 bg-white/[0.01]">
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(o => !o)}
                className="w-full flex items-center gap-3 py-1.5 bg-transparent border-none cursor-pointer text-left group hover:opacity-80 transition"
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-lg bg-[#6C5CE7]/20 border border-[#6C5CE7]/30 text-[#8B7CF8] flex items-center justify-center text-[11px] font-bold shrink-0 font-mono">
                  {initials === 'DE' ? 'AK' : initials}
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
                    <div className="p-3 border-b border-white/[0.06]">
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

        {/* ── MAIN CONTENT ────────────────────────────── */}
        <main className="flex-1 min-h-[calc(100vh-60px)] bg-[#08070D] pb-28">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
