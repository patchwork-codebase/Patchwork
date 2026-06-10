import { useEffect, useState, useRef } from "react";
import { Link, useSearchParams } from "react-router";
import { useAuth, supabase, sendVerificationEmailDirect } from "../auth/AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { AlertCircle, X, Image as ImageIcon, ChevronDown, Mail, ShieldAlert, RefreshCw } from "lucide-react";
import { OnboardingChecklist } from "./OnboardingChecklist";
import { WelcomeTour } from "./WelcomeTour";
import VerificationSuccessModal from "./VerificationSuccessModal";
import { useRooms, useUserRooms, useObservedRooms } from "../../hooks/useRooms";
import { useFeedUpdates } from "../../hooks/useFeedUpdates";
import { useQueryClient } from "@tanstack/react-query";
import { useDashboardStats, useRecentActivity, useRoomObservers } from "../../hooks/useDashboardStats";

// Subcomponents
import { StatsStrip } from "./StatsStrip";
import { ActiveRoomsList } from "./ActiveRoomsList";
import { RecentActivityList } from "./RecentActivityList";
import { TimelineFeed } from "./TimelineFeed";

const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

import { timeAgo, getAvatarUrl, STORAGE_KEYS } from "../../utils/helpers";

export default function Dashboard() {
  const { user, profile, withVerification, refreshProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

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

  const [updateContent, setUpdateContent] = useState("");
  const [codeSnippet, setCodeSnippet] = useState("");
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [posting, setPosting] = useState(false);

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

  // Email resend countdown cooldown state
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [showVerificationSuccess, setShowVerificationSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  async function handleResendVerification() {
    if (resendCooldown > 0 || resending || !user) return;
    setResending(true);
    try {
      await sendVerificationEmailDirect(
        user.id,
        profile?.email || user.email || '',
        profile?.name || ''
      );
      toast.success('Verification email sent! Check your inbox.');
      setResendCooldown(60);
      localStorage.setItem(STORAGE_KEYS.lastVerificationSent, Date.now().toString());
    } catch (err: any) {
      toast.error('Failed to send email. Please try again.');
    } finally {
      setResending(false);
    }
  }

  // Restore cooldown on mount from localStorage
  useEffect(() => {
    const lastSent = localStorage.getItem(STORAGE_KEYS.lastVerificationSent);
    if (lastSent) {
      const elapsed = Math.floor((Date.now() - parseInt(lastSent)) / 1000);
      if (elapsed < 60) setResendCooldown(60 - elapsed);
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (searchParams.get("verified") === "true") {
      setShowVerificationSuccess(true);
      setSearchParams(params => {
        params.delete("verified");
        return params;
      }, { replace: true });
      // Immediately re-load the profile from DB so the verification banner
      // disappears without needing a manual page refresh.
      refreshProfile();
    }
  }, [searchParams, setSearchParams]);




  const loading = roomsLoading || myRoomsLoading || dbUpdatesLoading;

  useEffect(() => {
    if (myRooms && myRooms.length > 0 && !selectedRoomId) {
      setSelectedRoomId(myRooms[0].id);
    }
  }, [myRooms, selectedRoomId]);

  const isPostingRef = useRef(false);

  const handlePostUpdate = async () => {
    withVerification(async () => {
      if (isPostingRef.current) return;
      if ((!updateContent.trim() && !codeSnippet.trim() && !mediaPreview) || !selectedRoomId || !user) return;
      
      isPostingRef.current = true;
      setPosting(true);
      try {
        const { data: room, error: roomError } = await supabase
          .from('rooms')
          .select('*')
          .eq('id', selectedRoomId)
          .single();

        if (roomError || !room) {
          throw new Error(roomError?.message || "Room not found");
        }

        const updateId = window.crypto.randomUUID();

        let uploadedMediaUrl = null;
        if (mediaPreview) {
          toast.loading("Uploading image...", { id: "upload" });
          const { data, error } = await supabase.functions.invoke('upload-image', {
            body: { image: mediaPreview }
          });
          if (error) throw error;
          uploadedMediaUrl = data?.secure_url || null;
          toast.dismiss("upload");
        }

        const payload = {
          id: updateId,
          room_id: selectedRoomId,
          author_id: user.id,
          author_name: profile?.name || user.email?.split('@')[0] || 'Builder',
          content: updateContent.trim(),
          media_url: uploadedMediaUrl,
          code_snippet: codeSnippet.trim() || null,
          created_at: new Date().toISOString(),
        };

        const { error: insertError } = await supabase
          .from('updates')
          .insert(payload);

        if (insertError) throw insertError;

        await supabase
          .from('rooms')
          .update({
            update_count: (room.update_count || 0) + 1,
            last_update: updateContent.trim().slice(0, 120),
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedRoomId);

        setUpdateContent("");
        setCodeSnippet("");
        setMediaPreview(null);
        queryClient.invalidateQueries({ queryKey: ['feed-updates'] });
        toast.success("Update posted successfully!");
      } catch (err: any) {
        toast.error(`Failed to post update: ${err.message}`);
      } finally {
        isPostingRef.current = false;
        setPosting(false);
      }
    });
  };

  const activeTab = (searchParams.get('tab') as 'overview' | 'feed' | 'mine') || 'overview';
  const firstName = profile?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'User';
  const avatarUrl = getAvatarUrl(user?.id || user?.email || 'default');
  const handle = `@${firstName.toLowerCase()}`;
  const joinDate = profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : '';

  function getDomainStyle(domain?: string) {
    switch (domain?.toLowerCase()) {
      case 'design': return { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' };
      case 'engineering': return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' };
      case 'growth': return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' };
      case 'writing': return { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/20' };
      case 'research': return { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' };
      default: return { bg: 'bg-[#6C5CE7]/10', text: 'text-[#8B7CF8]', border: 'border-[#6C5CE7]/20' };
    }
  }
  const domainStyle = getDomainStyle(profile?.domain);

  // Real-time Postgres subscriptions
  useEffect(() => {
    if (!user) return;

    const channelName = 'dashboard-stats-sync';

    // Remove any stale channel with the same name before subscribing.
    const existing = supabase.getChannels().find(c => c.topic === `realtime:${channelName}`);
    if (existing) supabase.removeChannel(existing);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reactions' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats', user.id] });
          queryClient.invalidateQueries({ queryKey: ['recent-activity', user.id] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_observers' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats', user.id] });
          queryClient.invalidateQueries({ queryKey: ['room-observers'] });
          queryClient.invalidateQueries({ queryKey: ['recent-activity', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const selectedRoom = myRooms.find(r => r.id === selectedRoomId);
  const selectedRoomTitle = selectedRoom?.title || 'Active Room';

  function setTab(tab: 'overview' | 'feed' | 'mine') {
    setSearchParams({ tab });
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-[1180px] mx-auto px-4 sm:px-6 py-4 sm:py-8"
    >

      {/* ── EMAIL VERIFICATION BANNER ─── shown until email is verified */}
      {profile && !profile.emailVerified && (
        <div className="mb-6 rounded-[20px] border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/5 overflow-hidden">
          <div className="p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-extrabold text-white mb-1">Verify your email to unlock Patchwork</h3>
                <p className="text-[13px] text-slate-400 leading-relaxed mb-4">
                  You won't be able to <strong className="text-slate-200">post updates</strong>, <strong className="text-slate-200">create rooms</strong>, or <strong className="text-slate-200">react to builds</strong> until your email is confirmed.
                  We sent a link to <span className="text-amber-300 font-semibold">{profile?.email || user?.email}</span>.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleResendVerification}
                    disabled={resendCooldown > 0 || resending}
                    className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/40 disabled:cursor-not-allowed text-black disabled:text-black/50 rounded-xl text-[13px] font-bold transition-all active:scale-95"
                  >
                    {resending
                      ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Sending...</>
                      : resendCooldown > 0
                        ? <><Mail className="w-3.5 h-3.5" /> Resend in {resendCooldown}s</>
                        : <><Mail className="w-3.5 h-3.5" /> Resend verification email</>
                    }
                  </button>
                  <p className="text-[12px] text-slate-500">Check your spam folder if you don't see it.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="h-1 bg-gradient-to-r from-amber-500/50 via-orange-400/50 to-amber-500/50" />
        </div>
      )}

      {/* Welcome Tour — shown once to new users */}
      {user && profile && (
        <WelcomeTour userId={user.id} userName={profile.name} />
      )}

      {/* Onboarding Checklist */}
      {user && profile && !profile.signup_completed_at && (
        <OnboardingChecklist
          role={(profile.role as 'builder' | 'observer') || 'builder'}
          userId={user.id}
          userName={profile.name}
        />
      )}

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 mb-6 sm:gap-6 sm:mb-8">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center overflow-hidden shadow-xl shrink-0">
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover scale-110" />
          </div>
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <h1 className="font-bold text-[20px] sm:text-[28px] text-white leading-tight tracking-tight m-0">
                {greeting}, <span className="text-[#8B7CF8] whitespace-nowrap">{firstName} 👋</span>
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
                <span className="px-2.5 py-1 rounded-full border border-[#8B7CF8]/20 bg-[#8B7CF8]/10 text-[#8B7CF8] text-[11px] font-mono font-bold uppercase">
                  Rep {profile?.reputation || 0}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 sm:mt-2 text-[12px] sm:text-[13px] text-slate-400 font-medium">
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

        <Link
          to="/dashboard/create"
          className="hidden sm:inline-flex w-full sm:w-auto items-center justify-center gap-2 px-5 py-3 bg-[#6C5CE7] hover:bg-[#5b4ed6] text-white rounded-full text-[13px] font-bold shadow-[0_4px_14px_rgba(108,92,231,0.25)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8]"
        >
          <IconPlus /> New room
        </Link>
      </div>

      {/* PROFILE CARD & STATS */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Profile Card - hidden on mobile to prevent redundancy with header */}
        <div className="hidden md:block xl:col-span-2 bg-[#0D0B14] border border-white/[0.08] rounded-[20px] p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8]" tabIndex={0}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center overflow-hidden shrink-0">
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover scale-110" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white text-[16px] truncate">{profile?.name}</h3>
              <p className="text-[13px] text-slate-400 mt-0.5">{handle}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/[0.05] grid grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] text-slate-500 uppercase font-mono font-bold">Reputation</p>
              <p className="text-[20px] font-bold text-[#8B7CF8] mt-1">{profile?.reputation || 0}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500 uppercase font-mono font-bold">Member since</p>
              <p className="text-[16px] font-semibold text-white mt-1">{joinDate}</p>
            </div>
          </div>
        </div>

        {/* Stats Strip */}
        <StatsStrip
          myRooms={myRooms}
          reactions={reactions}
          observers={observers}
          myRoomsLoading={myRoomsLoading}
          reactionsLoading={reactionsLoading}
          observersLoading={observersLoading}
        />
      </div>

      {/* INLINE TEXT TABS */}
      <div className="relative">
        <div className="flex items-center gap-2 sm:gap-6 mb-6 sm:mb-8 border-b border-white/[0.08] relative overflow-x-auto scrollbar-hide snap-x -mx-4 px-4 sm:mx-0 sm:px-0">
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
                className={`relative px-4 py-3 min-h-[44px] text-[14px] sm:text-[15px] font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8] whitespace-nowrap snap-start active:scale-95 ${isCurrent
                    ? 'text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.03] rounded-t-lg'
                  }`}
              >
                {tab.label}
                {isCurrent && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-[#8B7CF8] rounded-t-full shadow-[0_0_8px_rgba(139,124,248,0.5)]"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
        <div className="absolute right-0 top-0 bottom-8 w-12 bg-gradient-to-l from-[#0E0C15] to-transparent pointer-events-none sm:hidden" />
      </div>

      {/* MAIN COLUMNS GRID */}
      {activeTab === 'mine' ? (
        <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_0.95fr] gap-8">
          {/* LEFT COLUMN: ACTIVE WORK LIST */}
          <ActiveRoomsList
            rooms={myRooms}
            loading={myRoomsLoading}
            setTab={setTab}
          />

          {/* RIGHT COLUMN: RECENT ACTIVITY & WATCHERS */}
          <RecentActivityList
            recentEvents={recentEvents}
            roomObservers={roomObservers}
            selectedRoomTitle={selectedRoomTitle}
          />
        </div>
      ) : (
        /* TIMELINE FEED FOR MY ROOMS / LIVE FEED TABS */
        <TimelineFeed
          user={user}
          profile={profile}
          myRooms={myRooms}
          observedRooms={observedRooms}
          dbUpdates={dbUpdates}
          selectedRoomId={selectedRoomId}
          setSelectedRoomId={setSelectedRoomId}
          updateContent={updateContent}
          setUpdateContent={setUpdateContent}
          codeSnippet={codeSnippet}
          setCodeSnippet={setCodeSnippet}
          mediaPreview={mediaPreview}
          setMediaPreview={setMediaPreview}
          posting={posting}
          handlePostUpdate={handlePostUpdate}
          hasNextUpdates={hasNextUpdates}
          fetchNextUpdates={fetchNextUpdates}
          isFetchingNextUpdates={isFetchingNextUpdates}
          rooms={rooms}
          activeTab={activeTab}
          queryClient={queryClient}
          loading={loading}
        />
      )}

      {/* MOBILE FAB */}
      <div className="fixed bottom-[86px] right-4 z-[40] sm:hidden">
        <button
          onClick={() => {
            if (!profile?.emailVerified) {
              toast.error("Please verify your email to post.");
              return;
            }
            setFabActionSheetOpen(true);
          }}
          className="w-14 h-14 bg-[#6C5CE7] hover:bg-[#5b4ed6] text-white rounded-full flex items-center justify-center shadow-[0_8px_32px_rgba(108,92,231,0.4)] active:scale-95 transition-transform"
        >
          <IconPlus />
        </button>
      </div>

      {/* FAB ACTION SHEET */}
      <AnimatePresence>
        {fabActionSheetOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-[#08070D]/80 backdrop-blur-sm sm:hidden flex flex-col justify-end"
            onClick={() => setFabActionSheetOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-[#0A0910] border-t border-white/[0.08] rounded-t-3xl p-6 pb-[env(safe-area-inset-bottom)]"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6" />
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setFabActionSheetOpen(false);
                    setComposerSheetOpen(true);
                  }}
                  className="w-full flex items-center gap-3 p-4 bg-white/[0.03] active:bg-white/[0.06] rounded-2xl text-left border border-white/[0.05] active:scale-95 transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-[#8B7CF8]/20 flex items-center justify-center text-[#8B7CF8]">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                  </div>
                  <div>
                    <div className="text-[15px] font-bold text-white">Post an update</div>
                    <div className="text-[12px] font-medium text-slate-400">Share what you're working on</div>
                  </div>
                </button>
                <Link
                  to="/dashboard/create"
                  className="w-full flex items-center gap-3 p-4 bg-white/[0.03] active:bg-white/[0.06] rounded-2xl text-left border border-white/[0.05] active:scale-95 transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-[#6C5CE7]/20 flex items-center justify-center text-[#6C5CE7]">
                    <IconPlus />
                  </div>
                  <div>
                    <div className="text-[15px] font-bold text-white">Create new room</div>
                    <div className="text-[12px] font-medium text-slate-400">Initialize a new project space</div>
                  </div>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* POST UPDATE BOTTOM SHEET */}
      <AnimatePresence>
        {composerSheetOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-[#08070D]/80 backdrop-blur-sm sm:hidden flex flex-col justify-end"
            onClick={() => setComposerSheetOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-[#0A0910] border-t border-white/[0.08] rounded-t-3xl p-6 pb-[env(safe-area-inset-bottom)]"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-[18px] font-bold text-white">Post an Update</h2>
                <button
                  onClick={() => setComposerSheetOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/[0.05] flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <textarea 
                value={updateContent}
                onChange={(e) => setUpdateContent(e.target.value)}
                placeholder="What are you building right now?"
                className="w-full bg-white/[0.03] border border-white/[0.08] text-white text-[16px] sm:text-[15px] resize-none placeholder:text-slate-500 min-h-[100px] focus-visible:ring-2 focus-visible:ring-[#8B7CF8] rounded-xl p-4 mb-4"
              />

              {/* Action row similar to desktop inline composer */}
              <div className="flex items-center justify-between border-t border-white/[0.06] pt-4">
                <div className="flex items-center gap-3">
                  <label className="flex items-center justify-center w-10 h-10 bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 rounded-full cursor-pointer transition-all">
                    <ImageIcon className="w-5 h-5" />
                    <input
                      type="file" accept="image/*" className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setMediaPreview(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                  
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="flex items-center gap-1.5 bg-[#8B7CF8]/10 text-[#8B7CF8] text-[13px] font-bold rounded-full px-4 py-2 transition-all max-w-[150px]"
                    >
                      <span className="truncate">{myRooms.find(r => r.id === selectedRoomId)?.title || "Select room"}</span>
                      <ChevronDown className="w-4 h-4 shrink-0" />
                    </button>

                    <AnimatePresence>
                      {dropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: 4, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 4, scale: 0.95 }}
                            className="absolute left-0 bottom-full mb-2 min-w-[200px] w-max bg-[#0E0C16] border border-white/[0.08] rounded-xl shadow-2xl p-1 z-50 overflow-hidden"
                          >
                            {myRooms.map(r => (
                              <button
                                key={r.id} type="button"
                                onClick={() => {
                                  setSelectedRoomId(r.id);
                                  setDropdownOpen(false);
                                }}
                                className={`w-full text-left px-3.5 py-2.5 rounded-lg text-[13px] font-semibold ${
                                  selectedRoomId === r.id ? 'bg-[#8B7CF8]/20 text-[#8B7CF8]' : 'text-slate-300 hover:bg-white/[0.04]'
                                }`}
                              >
                                {r.title}
                              </button>
                            ))}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    handlePostUpdate();
                    setComposerSheetOpen(false);
                  }}
                  disabled={posting || (!updateContent.trim() && !codeSnippet.trim() && !mediaPreview) || !selectedRoomId}
                  className="bg-[#8B7CF8] hover:bg-[#7b6ce8] disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-full font-bold text-[14px] transition-colors active:scale-95"
                >
                  {posting ? "Posting..." : "Post"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <VerificationSuccessModal 
        isOpen={showVerificationSuccess} 
        onClose={() => setShowVerificationSuccess(false)} 
        role={profile?.role || 'builder'}
      />
    </motion.div>
  );
}
