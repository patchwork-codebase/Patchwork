import { useEffect, useState, useRef } from "react";
import { Link, useSearchParams, useNavigate } from "react-router";
import { useAuth, supabase, sendVerificationEmailDirect } from "../auth/AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { AlertCircle, X, Image as ImageIcon, ChevronDown, Mail, ShieldAlert, RefreshCw, Bell } from "lucide-react";
import { OnboardingChecklist } from "./OnboardingChecklist";
import { EmailVerificationBanner } from "./EmailVerificationBanner";
import VerificationSuccessModal from "./VerificationSuccessModal";
import { useRooms, useUserRooms, useObservedRooms } from "../../hooks/useRooms";
import { useFeedUpdates } from "../../hooks/useFeedUpdates";
import { useQueryClient } from "@tanstack/react-query";
import { useDashboardStats, useRecentActivity, useRoomObservers, useDashboardRealtimeSync } from "../../hooks/useDashboardStats";
import { useNotifications } from "../../hooks/useNotifications";

// Subcomponents
import { StatsStrip } from "./StatsStrip";
import { ActiveRoomsList } from "./ActiveRoomsList";
import { RecentActivityList } from "./RecentActivityList";
import { TimelineFeed } from "./TimelineFeed";
import { ActiveRoomPanel } from "./ActiveRoomPanel";
import { OverviewInsights } from "./OverviewInsights";
import { PendingDraftsList } from "./PendingDraftsList";
import { RequestsAndInvites } from "./RequestsAndInvites";
import { VerifiedTick } from "../ui/VerifiedTick";
import { MobileActionSheet } from "./MobileActionSheet";
import { ComposerSheet } from "./ComposerSheet";

const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

import { timeAgo, getAvatarUrl, STORAGE_KEYS } from "../../utils/helpers";

export default function Dashboard() {
  const { user, profile, withVerification, refreshProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: notificationsData } = useNotifications(user?.id);
  const unreadCount = notificationsData?.filter(n => !n.read).length || 0;

  const {
    data: roomsData,
    isLoading: roomsLoading,
  } = useRooms();
  const { data: myRoomsData, isLoading: myRoomsLoading } = useUserRooms(user?.id || undefined);
  const { data: observedRoomsData, isLoading: observedRoomsLoading } = useObservedRooms(user?.id || undefined);

  const {
    data: dbUpdatesData,
    isLoading: dbUpdatesLoading,
    fetchNextPage: fetchNextUpdates,
    hasNextPage: hasNextUpdates,
    isFetchingNextPage: isFetchingNextUpdates
  } = useFeedUpdates();

  const rooms = roomsData?.pages.flat() || [];
  const myRooms = myRoomsData?.pages.flat() || [];
  const observedRooms = observedRoomsData?.pages.flat() || [];
  const dbUpdates = dbUpdatesData?.pages.flat() || [];

  const allMyRooms = [...myRooms, ...observedRooms].reduce((acc, current) => {
    if (!acc.find(item => item.id === current.id)) {
      acc.push(current);
    }
    return acc;
  }, [] as any[]);

  const [selectedRoomId, setSelectedRoomId] = useState("");

  const { data: statsData, isLoading: statsLoading } = useDashboardStats(user?.id);
  const reactions = statsData?.reactions || [];
  const observers = statsData?.observers || [];
  const reactionsLoading = statsLoading;
  const observersLoading = statsLoading;

  const [fabActionSheetOpen, setFabActionSheetOpen] = useState(false);
  const [composerSheetOpen, setComposerSheetOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { data: recentEventsData } = useRecentActivity(user?.id);
  const recentEvents = recentEventsData || [];

  const { data: roomObserversData } = useRoomObservers(selectedRoomId);
  const roomObservers = roomObserversData || [];

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

  // Initialize real-time sync for dashboard stats and activities
  useDashboardRealtimeSync(user?.id);

  const selectedRoom = allMyRooms.find(r => r.id === selectedRoomId);
  const selectedRoomTitle = selectedRoom?.title || 'Active Room';

  function setTab(tab: 'overview' | 'feed' | 'mine') {
    setSearchParams({ tab });
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
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

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 mb-6 sm:gap-6 sm:mb-8">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] shrink-0">
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover scale-110" />
          </div>
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <h1 className="font-bold text-[20px] sm:text-[28px] text-slate-900 leading-tight tracking-tight m-0 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>{greeting},</span>
                <span className="text-primary-400 inline-flex items-center gap-1.5 sm:gap-2">
                  <span className="truncate max-w-[150px] sm:max-w-none">{firstName}</span>
                  <VerifiedTick isVerified={!!(profile as any)?.isVerifiedExpert} className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
                  <span className="shrink-0">👋</span>
                </span>
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                {profile?.domain && (
                  <span className={`px-2.5 py-1 rounded-full border ${domainStyle.border} ${domainStyle.bg} ${domainStyle.text} text-[11px] font-mono font-bold uppercase`}>
                    {profile.domain}
                  </span>
                )}
                <span className="px-2.5 py-1 rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-400 text-[11px] font-mono font-bold uppercase">
                  Free
                </span>
                <span className="px-2.5 py-1 rounded-full border border-primary-400/20 bg-primary-400/10 text-primary-400 text-[11px] font-mono font-bold uppercase">
                  Rep {profile?.reputation || 0}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 sm:mt-2 text-[12px] sm:text-[13px] text-slate-500 font-medium">
              <span>{handle}</span>
              {profile?.city && (
                <>
                  <span className="text-slate-600">·</span>
                  <span>{profile.city}</span>
                </>
              )}
              <span className="text-slate-600 hidden sm:inline-block">·</span>
              <span className="hidden sm:inline-block">Joined {joinDate}</span>
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3 w-full sm:w-auto">
          <Link
            to="/dashboard/notifications"
            className="relative flex items-center justify-center w-[46px] h-[46px] bg-white hover:bg-slate-50 border border-slate-100 rounded-full text-slate-600 hover:text-slate-900 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)] focus-ring"
          >
            <Bell className="w-[18px] h-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-[#0E0C15]" />
            )}
          </Link>
          <Link
            to="/dashboard/create"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-5 py-3 bg-primary-500 hover:bg-[#5b4ed6] text-white rounded-full text-[13px] font-bold shadow-[0_4px_14px_rgba(108,92,231,0.25)] transition-all focus-ring"
          >
            <IconPlus /> New room
          </Link>
        </div>
      </div>

      {/* PROFILE CARD & STATS */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Profile Card - hidden on mobile to prevent redundancy with header */}
        <div className="hidden md:block xl:col-span-2 bg-white border border-slate-100 rounded-[20px] p-6 focus-ring shadow-[0_2px_8px_rgba(0,0,0,0.04)]" tabIndex={0}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover scale-110" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-900 text-[16px] truncate flex items-center gap-1.5">
                {profile?.name}
                <VerifiedTick isVerified={!!(profile as any)?.isVerifiedExpert} className="w-4 h-4" />
              </h3>
              <p className="text-[13px] text-slate-500 mt-0.5">{handle}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] text-slate-500 uppercase font-mono font-bold">Reputation</p>
              <p className="text-[20px] font-bold text-primary-400 mt-1">{profile?.reputation || 0}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500 uppercase font-mono font-bold">Member since</p>
              <p className="text-[16px] font-semibold text-slate-900 mt-1">{joinDate}</p>
            </div>
          </div>
        </div>

        {/* Stats Strip */}
        <StatsStrip
          myRooms={allMyRooms}
          reactions={reactions}
          observers={observers}
          myRoomsLoading={myRoomsLoading}
          reactionsLoading={reactionsLoading}
          observersLoading={observersLoading}
        />
      </div>

      {/* INLINE TEXT TABS */}
      <div className="relative">
        <div className="flex items-center gap-2 sm:gap-6 mb-6 sm:mb-8 border-b border-slate-200 relative overflow-x-auto scrollbar-hide snap-x -mx-4 px-4 sm:mx-0 sm:px-0">
          {[
            { key: 'overview' as const, label: 'Overview' },
            { key: 'mine' as const, label: 'My rooms' },
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
      {activeTab === 'mine' ? (
        <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_0.95fr] gap-8">
          {/* LEFT COLUMN: ACTIVE WORK LIST */}
          <ActiveRoomsList
            rooms={allMyRooms}
            loading={myRoomsLoading || observedRoomsLoading}
            setTab={setTab}
          />

          {/* RIGHT COLUMN: RECENT ACTIVITY & WATCHERS */}
          <RecentActivityList
            recentEvents={recentEvents}
            roomObservers={roomObservers}
            selectedRoomTitle={selectedRoomTitle}
          />
        </div>
      ) : activeTab === 'overview' ? (
        <div>
          <RequestsAndInvites />
          <PendingDraftsList />
          <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.55fr] gap-8 xl:gap-12">
            <ActiveRoomsList
              rooms={allMyRooms}
              loading={myRoomsLoading || observedRoomsLoading}
              setTab={setTab}
              selectedRoomId={selectedRoomId}
              setSelectedRoomId={setSelectedRoomId}
            />
            <ActiveRoomPanel
              user={user}
              room={allMyRooms.find(r => r.id === selectedRoomId) || allMyRooms[0]}
              reactions={reactions}
              queryClient={queryClient}
            />
          </div>
          <OverviewInsights />
        </div>
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
  );
}
