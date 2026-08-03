import { Link, useLocation, useNavigate, useOutlet, useSearchParams, ScrollRestoration, useNavigation } from "react-router";
import { Suspense } from "react";
import { useAuth } from "../auth/AuthContext";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell } from "lucide-react";
import { useNotifications } from "../../hooks/useNotifications";

// avatarUrl removed

import { HammerIcon, DashboardIcon, SearchIcon, ActivityIcon, EyeIcon, CompassIcon, PlusIcon, LogOutIcon, UserIcon, ZapIcon, RoadmapIcon, MilestonesIcon, AnalyticsIcon, LightbulbIcon } from "./LayoutIcons";


/* ─── Layout ────────────────────────────────────────────────────── */


import VerificationRequiredModal from '../ui/VerificationRequiredModal';
import VerificationSuccessModal from '../dashboard/VerificationSuccessModal';
import { WelcomeTour } from '../dashboard/WelcomeTour';

import { MobileBottomNav } from "./MobileBottomNav";
import { DesktopSidebar } from "./DesktopSidebar";

import { GlobalHeader } from "./GlobalHeader";
import { PwaInstallPrompt } from "./PwaInstallPrompt";

export default function Layout() {
  const outlet = useOutlet();
  const { user, profile, signOut, loading, refreshProfile } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: notificationsData } = useNotifications(user?.id);
  const unreadCount = notificationsData?.filter(n => !n.read).length || 0;

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [forceShowTour, setForceShowTour] = useState(false);
  const [isNavExpanded, setIsNavExpanded] = useState(true);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    // Check for verification success in URL
    const hash = window.location.hash;
    const query = window.location.search;
    if (hash.includes('type=signup') || hash.includes('type=recovery') || query.includes('verified=true')) {
      if (user?.id) localStorage.setItem(`email_verified_failsafe_${user.id}`, 'true');
      setShowSuccessModal(true);
      refreshProfile(); // refresh to get the latest emailVerified status

      // Clean up URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [refreshProfile]);





  const activeTab = searchParams.get('tab') || 'overview';
  const activeSection = location.pathname.startsWith('/dashboard/explore')
    ? 'explore'
    : location.pathname.startsWith('/learning-hub')
      ? 'learning-hub'
    : location.pathname.startsWith('/dashboard/experts')
      ? 'experts'
    : location.pathname.startsWith('/dashboard/rooms')
      ? 'rooms'
    : location.pathname.startsWith('/dashboard/build-logs')
      ? 'logs'
    : location.pathname.startsWith('/dashboard/observer')
      ? 'observer'
    : location.pathname.startsWith('/dashboard/roadmap')
      ? 'roadmap'
    : location.pathname.startsWith('/dashboard/milestones')
      ? 'milestones'
    : location.pathname.startsWith('/dashboard/analytics')
      ? 'analytics'
    : location.pathname.startsWith('/dashboard/achievements')
      ? 'achievements'
    : location.pathname.startsWith('/dashboard/discovery')
      ? 'discovery'
      : activeTab;

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 font-mono text-[13px]">
          <div className="w-4.5 h-4.5 rounded-full border-2 border-primary-500/20 border-t-primary-500 animate-spin" />
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

  // avatarUrl removed

  const isObserver = profile?.role === 'observer';
  const userDisplayName = profile?.name || user?.email?.split('@')[0] || 'User';

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#0a0a0a] text-slate-900 dark:text-slate-300 pb-[env(safe-area-inset-bottom)] lg:pb-0 transition-colors duration-300">
      {/* Global Navigation Progress Bar */}
      {navigation.state === 'loading' && (
        <div className="fixed top-0 left-0 w-full h-1 z-[100] bg-primary-400/20 overflow-hidden">
          <div className="h-full bg-primary-500 animate-[shimmer_1.5s_infinite] w-1/3" />
        </div>
      )}
      <VerificationRequiredModal />
      <VerificationSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        role={profile?.role || 'builder'}
      />
      {user && profile && (
        <WelcomeTour
          userId={user.id}
          userName={profile.name}
          forceShow={forceShowTour}
          onClose={() => setForceShowTour(false)}
        />
      )}

      <GlobalHeader unreadCount={unreadCount} />

      {/* ── UNVERIFIED EMAIL BANNER ───────────────────────── */}
      {profile && !profile.emailVerified && (
        <div className="w-full bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex items-center justify-between gap-3 z-40">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-amber-400 shrink-0" aria-hidden>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
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

      <MobileBottomNav 
          activeSection={activeSection}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          unreadCount={unreadCount}
          // avatarUrl removed
          userDisplayName={userDisplayName}
          user={user}
          profile={profile}
          setForceShowTour={setForceShowTour}
          handleSignOut={handleSignOut}
        />

      <div className="flex flex-col lg:flex-row flex-1 lg:pb-0">

        {/* ── LEFT SIDEBAR ─────────────────────────────────── */}
        <DesktopSidebar 
          activeSection={activeSection}
          // avatarUrl removed
          userDisplayName={userDisplayName}
          profile={profile}
          user={user}
          profileMenuOpen={profileMenuOpen}
          setProfileMenuOpen={setProfileMenuOpen}
          setForceShowTour={setForceShowTour}
          handleSignOut={handleSignOut}
        />

        <main className="flex-1 min-w-0 min-h-[calc(100vh-60px)] bg-slate-50 dark:bg-[#0a0a0a] pb-28 transition-colors duration-300">
          <div className="h-full">

            <Suspense fallback={
              <div className="w-full max-w-[1180px] mx-auto px-4 sm:px-6 py-8">
                {/* Page skeleton */}
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-slate-200 animate-pulse shrink-0" />
                  <div className="flex flex-col gap-2">
                    <div className="h-5 w-48 bg-slate-200 animate-pulse rounded-lg" />
                    <div className="h-4 w-32 bg-slate-100 animate-pulse rounded-lg" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white border border-slate-100 rounded-[28px] overflow-hidden shadow-sm dark:shadow-none" style={{ animationDelay: `${i * 60}ms` }}>
                      <div className="h-[140px] bg-slate-100 animate-pulse" />
                      <div className="p-6">
                        <div className="h-5 w-3/4 bg-slate-200 animate-pulse rounded-lg mb-3" />
                        <div className="h-4 w-1/2 bg-slate-100 animate-pulse rounded-lg mb-6" />
                        <div className="h-3 w-full bg-slate-100 animate-pulse rounded-lg mb-2" />
                        <div className="h-3 w-4/5 bg-slate-100 animate-pulse rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            }>
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  {outlet}
                </motion.div>
              </AnimatePresence>
            </Suspense>
          </div>
        </main>
      </div>
      <PwaInstallPrompt />
      <ScrollRestoration getKey={(location) => location.pathname} />
    </div>
  );
}
