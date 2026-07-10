import { useEffect, useState, useRef } from "react";
import { Link, useSearchParams, useNavigate } from "react-router";
import { useAuth, supabase, sendVerificationEmailDirect } from "../auth/AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { AlertCircle, X, Image as ImageIcon, ChevronDown, Mail, ShieldAlert, RefreshCw, Bell, Eye, Hammer } from "lucide-react";
import { OnboardingChecklist } from "./OnboardingChecklist";
import { EmailVerificationBanner } from "./EmailVerificationBanner";
import VerificationSuccessModal from "./VerificationSuccessModal";
import { NewUserWelcomeBanner } from "./NewUserWelcomeBanner";
import { useRooms, useUserRooms, useObservedRooms, useObserverStats, useOfficialRoom } from "../../hooks/useRooms";
import { PATCHWORK_OFFICIAL_ROOM_ID } from "../../constants/patchwork";
import { useFeedUpdates } from "../../hooks/useFeedUpdates";
import { useQueryClient } from "@tanstack/react-query";
import { useDashboardStats } from "../../hooks/useDashboardStats";
import { useNotifications } from "../../hooks/useNotifications";

// Subcomponents
import { StatsStrip } from "./StatsStrip";
import { TimelineFeed } from "./TimelineFeed";
import { DashboardOverview } from "./DashboardOverview";
import { VerifiedTick } from "../ui/VerifiedTick";
import { MobileActionSheet } from "./MobileActionSheet";
import { ComposerSheet } from "./ComposerSheet";
import { ObserverProgressionPanel } from "../observer/ObserverProgressionPanel";
import ObserverDashboardView from "../observer/ObserverDashboardView";
import { SEO } from "../seo/SEO";

const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

import { timeAgo, getAvatarUrl, STORAGE_KEYS } from "../../utils/helpers";

export default function Dashboard() {
  const { user, profile, withVerification, refreshProfile } = useAuth();
  const isObserver = profile?.role === 'observer';
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: notificationsData } = useNotifications(user?.id);
  const unreadCount = notificationsData?.filter(n => !n.read).length || 0;

  // Welcome banner state — shown once after onboarding
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(() => searchParams.get('welcome') === 'true');

  const {
    data: roomsData,
    isLoading: roomsLoading,
  } = useRooms();
  const { data: myRoomsData, isLoading: myRoomsLoading } = useUserRooms(user?.id || undefined);
  const { data: observedRoomsData, isLoading: observedRoomsLoading } = useObservedRooms(user?.id || undefined);

  const [feedSortOrder, setFeedSortOrder] = useState<'desc' | 'asc'>('desc');

  const {
    data: dbUpdatesData,
    isLoading: dbUpdatesLoading,
    fetchNextPage: fetchNextUpdates,
    hasNextPage: hasNextUpdates,
    isFetchingNextPage: isFetchingNextUpdates
  } = useFeedUpdates(feedSortOrder);

  const { data: officialRoomData } = useOfficialRoom();

  const rooms = roomsData?.pages.flat() || [];
  const myRooms = myRoomsData?.pages.flat() || [];
  const observedRooms = observedRoomsData?.pages.flat() || [];
  const dbUpdates = dbUpdatesData?.pages.flat() || [];

  const allMyRoomsRaw = [...myRooms, ...observedRooms].reduce((acc, current) => {
    if (!acc.find(item => item.id === current.id)) {
      acc.push(current);
    }
    return acc;
  }, [] as any[]);

  const allMyRooms = [
    ...(officialRoomData ? [officialRoomData] : []),
    ...allMyRoomsRaw.filter(r => r.id !== PATCHWORK_OFFICIAL_ROOM_ID)
  ];

  const [selectedRoomId, setSelectedRoomId] = useState("");

  const { data: statsData, isLoading: statsLoading } = useDashboardStats(user?.id);
  const reactions = statsData?.reactions || [];
  const observers = statsData?.observers || [];
  const reactionsLoading = statsLoading;
  const observersLoading = statsLoading;

  const { data: observerStats, isLoading: observerStatsLoading } = useObserverStats(isObserver ? user?.id : undefined);

  const [fabActionSheetOpen, setFabActionSheetOpen] = useState(false);
  const [composerSheetOpen, setComposerSheetOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [showVerificationSuccess, setShowVerificationSuccess] = useState(false);

  useEffect(() => {
    const isVerified = searchParams.get("verified") === "true";
    const returnTo = localStorage.getItem('authRedirectUrl');

    if (isVerified) {
      setShowVerificationSuccess(true);
      setSearchParams(params => {
        params.delete("verified");
        return params;
      }, { replace: true });
      // Immediately re-load the profile from DB so the verification banner
      // disappears without needing a manual page refresh.
      refreshProfile();
    } else if (returnTo) {
      localStorage.removeItem('authRedirectUrl');
      navigate(returnTo, { replace: true });
    }
  }, [searchParams, setSearchParams, navigate, refreshProfile]);

  const handleCloseVerificationModal = () => {
    setShowVerificationSuccess(false);
    const returnTo = localStorage.getItem('authRedirectUrl');
    if (returnTo) {
      localStorage.removeItem('authRedirectUrl');
      navigate(returnTo, { replace: true });
    }
  };




  const loading = roomsLoading || myRoomsLoading || dbUpdatesLoading;

  useEffect(() => {
    if (allMyRooms && allMyRooms.length > 0 && !selectedRoomId) {
      setSelectedRoomId(allMyRooms[0].id);
    }
  }, [allMyRooms, selectedRoomId]);

  const activeTab = (searchParams.get('tab') as 'overview' | 'feed' | 'mine') || 'overview';
  const firstName = profile?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'User';
  const avatarUrl = getAvatarUrl(user?.id || user?.email || 'default');
  const handle = `@${firstName.toLowerCase()}`;
  const joinDate = profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : '';

  function getDomainStyle(domain?: string) {
    switch (domain?.toLowerCase()) {
      case 'product-designer':
      case 'design': return { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/20' };
      case 'engineer':
      case 'engineering': return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' };
      case 'growth': return { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' };
      case 'writer':
      case 'writing': return { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' };
      case 'research': return { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' };
      case 'founder': return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' };
      case 'product-manager': return { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20' };
      default: return { bg: 'bg-primary-500/10', text: 'text-primary-400', border: 'border-primary-500/20' };
    }
  }
  const domainStyle = getDomainStyle(profile?.domain);

  const selectedRoom = allMyRooms.find(r => r.id === selectedRoomId);
  const selectedRoomTitle = selectedRoom?.title || 'Active Room';

  function setTab(tab: 'overview' | 'feed' | 'mine') {
    setSearchParams({ tab });
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  if (isObserver) {
    return (
      <>
        <SEO title={`Dashboard | ${firstName} - Patchwork`} />
        <ObserverDashboardView
          user={user}
          profile={profile}
          dbUpdates={dbUpdates}
          observerStats={observerStats}
          refreshProfile={refreshProfile}
          queryClient={queryClient}
        />
      </>
    );
  }

  return (
    <>
      <SEO title={`Dashboard | ${firstName} - Patchwork`} />
      <div className="w-full max-w-[1180px] mx-auto px-4 sm:px-6 py-4 sm:py-8">

      {/* ── EMAIL VERIFICATION BANNER ─── shown until email is verified */}
      <EmailVerificationBanner />

      {/* Onboarding Checklist */}
      {user && profile && !profile.signup_completed_at && !(profile as any).signupCompletedAt && localStorage.getItem(STORAGE_KEYS.checklistDismissed(user.id)) !== 'true' && (
        <OnboardingChecklist
          role={(profile.role as 'builder' | 'observer') || 'builder'}
          userId={user.id}
          userName={profile.name}
        />
      )}

      {/* WELCOME BANNER - shown after onboarding */}
      <AnimatePresence>
        {showWelcomeBanner && !isObserver && (
          <NewUserWelcomeBanner
            userName={profile?.name?.split(' ')[0] || 'Builder'}
            onDismiss={() => {
              setShowWelcomeBanner(false);
              setSearchParams(prev => { const next = new URLSearchParams(prev); next.delete('welcome'); return next; });
            }}
          />
        )}
      </AnimatePresence>

      {/* HEADER */}
      <div className="flex items-center justify-between gap-3 mb-5 sm:mb-8">
        {/* Left: avatar + identity */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 sm:w-13 sm:h-13 rounded-2xl bg-white border border-slate-100 flex items-center justify-center overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] shrink-0">
            <img loading="lazy" src={avatarUrl} alt="Avatar" className="w-full h-full object-cover scale-110" />
          </div>
          <div className="min-w-0 flex-1">
            {/* Greeting + name — single truncating line */}
            <h1 className="font-bold text-[16px] sm:text-[24px] text-slate-900 leading-snug tracking-tight m-0 flex items-center gap-2">
              <span className="truncate">{greeting}, <span className="text-primary-400">{firstName}</span></span>
              <VerifiedTick isVerified={!!(profile as any)?.isVerifiedExpert} className="w-3.5 h-3.5 sm:w-5 sm:h-5 shrink-0" />
              <motion.span 
                className="shrink-0 text-[20px] sm:text-[28px] inline-block origin-bottom-right cursor-pointer"
                initial={{ scale: 0, rotate: 0 }}
                animate={{ 
                  scale: [0, 1.8, 1.8, 1.8, 1],
                  rotate: [0, 15, -15, 15, -15, 0] 
                }}
                transition={{
                  duration: 1.5,
                  ease: "easeInOut",
                  times: [0, 0.2, 0.4, 0.6, 0.8, 1]
                }}
                whileHover={{ 
                  scale: 1.3, 
                  rotate: [0, 15, -15, 15, -15, 0], 
                  transition: { duration: 0.6 } 
                }}
                whileTap={{ scale: 0.9 }}
              >
                👋
              </motion.span>
            </h1>
            {/* Handle + badges — flex wrap on desktop */}
            <div className="flex sm:flex-wrap items-center gap-1.5 mt-1 overflow-x-auto sm:overflow-visible [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium shrink-0">{handle}</span>
              {profile?.city && (
                <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium shrink-0 hidden sm:inline">· {profile.city}</span>
              )}
              <span className="text-slate-300 shrink-0">·</span>
              {profile?.domain && (
                <span className={`px-2 py-0.5 rounded-full border ${domainStyle.border} ${domainStyle.bg} ${domainStyle.text} text-[9px] sm:text-[10px] font-mono font-bold uppercase shrink-0`}>
                  {profile.domain}
                </span>
              )}
              {isObserver ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-purple-500/20 bg-purple-500/10 text-purple-400 text-[9px] sm:text-[10px] font-mono font-bold uppercase shrink-0">
                  <Eye className="w-2.5 h-2.5" /> Observer
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400 text-[9px] sm:text-[10px] font-mono font-bold uppercase shrink-0">
                  <Hammer className="w-2.5 h-2.5" /> Builder
                </span>
              )}
              <span className="px-2 py-0.5 rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-400 text-[9px] sm:text-[10px] font-mono font-bold uppercase shrink-0">Joined {joinDate}</span>
              <span className="px-2 py-0.5 rounded-full border border-primary-400/20 bg-primary-400/10 text-primary-400 text-[9px] sm:text-[10px] font-mono font-bold uppercase shrink-0">Rep {profile?.reputation || 0}</span>
            </div>
          </div>
        </div>

        {/* Right: bell + new room — always visible */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/dashboard/notifications"
            className="relative hidden sm:flex items-center justify-center w-[36px] h-[36px] sm:w-[44px] sm:h-[44px] bg-white hover:bg-slate-50 border border-slate-100 rounded-full text-slate-600 transition-all shadow-sm focus-ring"
          >
            <Bell className="w-[15px] h-[15px] sm:w-[18px] sm:h-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
            )}
          </Link>
          {!isObserver && (
            <Link
              to="/dashboard/create"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5 bg-primary-500 hover:bg-[#5b4ed6] text-white rounded-full text-[11px] sm:text-[13px] font-bold shadow-[0_4px_14px_rgba(108,92,231,0.25)] transition-all focus-ring whitespace-nowrap"
            >
              <IconPlus /> + room
            </Link>
          )}
        </div>
      </div>

      {/* STATS */}
      <div className="mb-6 sm:mb-8">
        {/* Stats Strip */}
        <StatsStrip
          myRooms={allMyRooms}
          reactions={reactions}
          observers={observers}
          myRoomsLoading={myRoomsLoading}
          reactionsLoading={reactionsLoading}
          observersLoading={observersLoading}
          isObserver={isObserver}
          observerStats={observerStats}
          observerStatsLoading={observerStatsLoading}
        />
      </div>

      {/* INLINE TEXT TABS */}
      <div className="relative">
        <div className="flex items-center gap-2 sm:gap-6 mb-6 sm:mb-8 border-b border-slate-200 relative overflow-x-auto scrollbar-hide snap-x -mx-4 px-4 sm:mx-0 sm:px-0">
          {[
            { key: 'overview' as const, label: 'Overview' },
            { key: 'feed' as const, label: 'Global timeline' },
          ].map(tab => {
            const isCurrent = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setTab(tab.key)}
                className={`relative px-4 py-3 min-h-[44px] text-[14px] sm:text-[15px] font-bold transition-all focus-ring whitespace-nowrap snap-start active:scale-95 ${isCurrent
                    ? 'text-slate-900'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-t-lg'
                  }`}
              >
                {tab.label}
                {isCurrent && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-primary-400 rounded-t-full shadow-[0_0_8px_rgba(139,124,248,0.5)]"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
        <div className="absolute right-0 top-0 bottom-8 w-12 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none sm:hidden" />
      </div>

      {/* MAIN COLUMNS GRID */}
      {activeTab === 'overview' ? (
        <DashboardOverview
          user={user}
          allMyRooms={allMyRooms}
          myRoomsLoading={myRoomsLoading}
          observedRoomsLoading={observedRoomsLoading}
          setTab={setTab}
          selectedRoomId={selectedRoomId}
          setSelectedRoomId={setSelectedRoomId}
          reactions={reactions}
          queryClient={queryClient}
        />
      ) : (
        /* TIMELINE FEED FOR MY ROOMS / LIVE FEED TABS */
        <TimelineFeed
          user={user}
          profile={profile}
          myRooms={allMyRooms}
          observedRooms={observedRooms}
          dbUpdates={dbUpdates}
          selectedRoomId={selectedRoomId}
          setSelectedRoomId={setSelectedRoomId}
          hasNextUpdates={hasNextUpdates}
          fetchNextUpdates={fetchNextUpdates}
          isFetchingNextUpdates={isFetchingNextUpdates}
          rooms={rooms}
          activeTab={activeTab}
          queryClient={queryClient}
          loading={loading}
          feedSortOrder={feedSortOrder}
          setFeedSortOrder={setFeedSortOrder}
        />
      )}

      {/* MOBILE FAB & POST SHEETS */}
      <MobileActionSheet
        fabActionSheetOpen={fabActionSheetOpen}
        setFabActionSheetOpen={setFabActionSheetOpen}
        setComposerSheetOpen={setComposerSheetOpen}
      />
      <ComposerSheet
        isOpen={composerSheetOpen}
        onClose={() => setComposerSheetOpen(false)}
        myRooms={allMyRooms}
        selectedRoomId={selectedRoomId}
        setSelectedRoomId={setSelectedRoomId}
      />

      <VerificationSuccessModal 
        isOpen={showVerificationSuccess} 
        onClose={handleCloseVerificationModal} 
        role={profile?.role || 'builder'}
      />
    </div>
    </>
  );
}
