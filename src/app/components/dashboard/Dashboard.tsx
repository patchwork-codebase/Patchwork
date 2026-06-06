import { useEffect, useState, useRef } from "react";
import { Link, useSearchParams } from "react-router";
import { useAuth, supabase, sendVerificationEmailDirect } from "../auth/AuthContext";
import { motion } from "motion/react";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { OnboardingChecklist } from "./OnboardingChecklist";
import { useRooms, useUserRooms } from "../../hooks/useRooms";
import { useFeedUpdates } from "../../hooks/useFeedUpdates";
import { useQueryClient } from "@tanstack/react-query";

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

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const { 
    data: roomsData, 
    isLoading: roomsLoading,
  } = useRooms();
  const { data: myRoomsData, isLoading: myRoomsLoading } = useUserRooms(user?.id || undefined);
  
  const { 
    data: dbUpdatesData, 
    isLoading: dbUpdatesLoading,
    fetchNextPage: fetchNextUpdates,
    hasNextPage: hasNextUpdates,
    isFetchingNextPage: isFetchingNextUpdates
  } = useFeedUpdates();
  
  const rooms = roomsData?.pages.flat() || [];
  const myRooms = myRoomsData?.pages.flat() || [];
  const dbUpdates = dbUpdatesData?.pages.flat() || [];
  
  const [updateContent, setUpdateContent] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [posting, setPosting] = useState(false);

  const [reactions, setReactions] = useState<any[]>([]);
  const [observers, setObservers] = useState<any[]>([]);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [roomObservers, setRoomObservers] = useState<any[]>([]);

  const [reactionsLoading, setReactionsLoading] = useState(true);
  const [observersLoading, setObserversLoading] = useState(true);

  // Email resend countdown cooldown state
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  const loading = roomsLoading || myRoomsLoading || dbUpdatesLoading;

  useEffect(() => {
    if (myRooms && myRooms.length > 0 && !selectedRoomId) {
      setSelectedRoomId(myRooms[0].id);
    }
  }, [myRooms, selectedRoomId]);

  const handlePostUpdate = async () => {
    if (!updateContent.trim() || !selectedRoomId || !user) return;
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

      const updateId = crypto.randomUUID();
      const payload = {
        id: updateId,
        room_id: selectedRoomId,
        author_id: user.id,
        author_name: profile?.name || user.email?.split('@')[0] || 'Builder',
        content: updateContent.trim(),
        media_url: null,
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
      queryClient.invalidateQueries({ queryKey: ['feed-updates'] });
      toast.success("Update posted successfully!");
    } catch (err: any) {
      toast.error(`Failed to post update: ${err.message}`);
    } finally {
      setPosting(false);
    }
  };

  const activeTab = (searchParams.get('tab') as 'overview' | 'feed' | 'mine') || 'overview';
  const firstName = profile?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'User';
  const initials = profile?.name
    ? profile.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.substring(0, 2).toUpperCase() || 'U';
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

  async function loadReactions() {
    if (user) {
      setReactionsLoading(true);
      try {
        const { data } = await supabase
          .from('reactions')
          .select('id, created_at, rooms!inner(builder_id)')
          .eq('rooms.builder_id', user.id);
        setReactions(data || []);
      } catch (err) {
        console.log('Reactions count error:', err);
      } finally {
        setReactionsLoading(false);
      }
    } else {
      setReactions([]);
      setReactionsLoading(false);
    }
  }

  async function loadObservers() {
    if (user) {
      setObserversLoading(true);
      try {
        const { data } = await supabase
          .from('room_observers')
          .select('id, created_at, rooms!inner(builder_id)')
          .eq('rooms.builder_id', user.id);
        setObservers(data || []);
      } catch (err) {
        console.log('Observers count error:', err);
      } finally {
        setObserversLoading(false);
      }
    } else {
      setObservers([]);
      setObserversLoading(false);
    }
  }

  async function loadRecentActivity() {
    if (!user) return;
    try {
      const { data: reactionsData } = await supabase
        .from('reactions')
        .select('created_at, type, observer_id, update_id, users(name), rooms!inner(builder_id)')
        .eq('rooms.builder_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: observersData } = await supabase
        .from('room_observers')
        .select('created_at, observer_id, room_id, rooms!inner(title, builder_id), users(name)')
        .eq('rooms.builder_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      const mergedEvents: any[] = [];

      if (reactionsData) {
        reactionsData.forEach((re: any) => {
          const name = re.users?.name || 'Someone';
          const text = re.type === 'like' ? 'reacted "Like" to your update' : `replied to your update`;
          mergedEvents.push({
            name,
            text,
            time: timeAgo(re.created_at),
            color: 'bg-[#6C5CE7]',
            date: new Date(re.created_at)
          });
        });
      }

      if (observersData) {
        observersData.forEach((ob: any) => {
          const name = ob.users?.name || 'Someone';
          const roomTitle = ob.rooms?.title || 'your room';
          mergedEvents.push({
            name,
            text: `started following your "${roomTitle}" room`,
            time: timeAgo(ob.created_at),
            color: 'bg-emerald-500',
            date: new Date(ob.created_at)
          });
        });
      }

      const sorted = mergedEvents.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);
      setRecentEvents(sorted);
    } catch (err) {
      console.log('Error loading recent activity:', err);
    }
  }

  async function loadRoomObservers() {
    if (!selectedRoomId) return;
    try {
      const { data } = await supabase
        .from('room_observers')
        .select('id, created_at, observer_id, users(name)')
        .eq('room_id', selectedRoomId);

      const mapped = (data || []).map((ob: any) => {
        const name = ob.users?.name || 'Observer';
        const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
        return {
          initials,
          name,
          visits: 'Active',
          bg: 'bg-[#6C5CE7]/20',
          color: 'text-[#8B7CF8]'
        };
      });
      setRoomObservers(mapped);
    } catch (err) {
      console.log('Error loading room observers list:', err);
    }
  }

  useEffect(() => {
    loadReactions();
    loadObservers();
    loadRecentActivity();
  }, [user]);

  useEffect(() => {
    loadRoomObservers();
  }, [selectedRoomId]);

  // Real-time Postgres subscriptions
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('dashboard-stats-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reactions' },
        () => {
          loadReactions();
          loadRecentActivity();
          queryClient.invalidateQueries({ queryKey: ['feed-updates'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_observers' },
        () => {
          loadObservers();
          loadRoomObservers();
          loadRecentActivity();
          queryClient.invalidateQueries({ queryKey: ['user-rooms', user.id] });
          queryClient.invalidateQueries({ queryKey: ['rooms'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'updates' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['feed-updates'] });
          queryClient.invalidateQueries({ queryKey: ['user-rooms', user.id] });
          queryClient.invalidateQueries({ queryKey: ['rooms'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['user-rooms', user.id] });
          queryClient.invalidateQueries({ queryKey: ['rooms'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedRoomId, queryClient]);

  // Handle countdown timer
  useEffect(() => {
    if (cooldownSeconds > 0) {
      cooldownTimerRef.current = setInterval(() => {
        setCooldownSeconds(prev => prev - 1);
      }, 1000);
    } else if (cooldownSeconds === 0 && cooldownTimerRef.current) {
      clearInterval(cooldownTimerRef.current);
    }

    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, [cooldownSeconds]);

  const handleResendVerification = async () => {
    if (cooldownSeconds > 0) return;
    try {
      await sendVerificationEmailDirect(
        user?.id || '',
        profile?.email || user?.email || '',
        profile?.name || ''
      );
      toast.success("Verification email resent! Check your inbox.");
      setCooldownSeconds(60);
    } catch (err: any) {
      toast.error("Failed to resend verification email");
    }
  };

  const selectedRoom = myRooms.find(r => r.id === selectedRoomId);
  const selectedRoomTitle = selectedRoom?.title || 'Active Room';

  function setTab(tab: 'overview' | 'feed' | 'mine') {
    setSearchParams({ tab });
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-[1180px] mx-auto px-5 sm:px-6 py-8"
    >

      {/* Email Verification Banner */}
      {!profile?.emailVerified && (
        <div className="mb-6 bg-amber-500/10 border border-amber-500/20 rounded-[16px] p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-[14px] font-bold text-amber-100">Verify your email address</h3>
            <p className="text-[13px] text-amber-200/70 mt-1">We sent a verification link to your email. Please verify to unlock all features.</p>
          </div>
          <button 
            onClick={handleResendVerification}
            disabled={cooldownSeconds > 0}
            className="px-4 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/20 rounded-full text-[12px] font-bold text-amber-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            {cooldownSeconds > 0 ? `Resend in ${cooldownSeconds}s` : "Resend"}
          </button>
        </div>
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
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6C5CE7] to-[#8B7CF8] flex items-center justify-center text-white font-extrabold text-xl shadow-[0_0_20px_rgba(108,92,231,0.3)]">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-bold text-2xl sm:text-[28px] text-white leading-tight tracking-tight m-0">
                {profile?.name || firstName}
              </h1>
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
            <div className="flex items-center gap-2 mt-2 text-[13px] text-slate-400 font-medium">
              <span>{handle}</span>
              {profile?.city && (
                <>
                  <span className="text-slate-600">·</span>
                  <span>{profile.city}</span>
                </>
              )}
              <span className="text-slate-600">·</span>
              <span>Joined {joinDate}</span>
            </div>
          </div>
        </div>

        <Link
          to="/dashboard/create"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#6C5CE7] hover:bg-[#5b4ed6] text-white rounded-full text-[13px] font-bold shadow-[0_4px_14px_rgba(108,92,231,0.25)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8]"
        >
          <IconPlus /> New room
        </Link>
      </div>

      {/* PROFILE CARD & STATS */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 mb-8">
        {/* Profile Card - hidden on mobile to prevent redundancy with header */}
        <div className="hidden md:block xl:col-span-2 bg-[#0D0B14] border border-white/[0.08] rounded-[20px] p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8]" tabIndex={0}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6C5CE7] to-[#8B7CF8] flex items-center justify-center text-white font-bold text-lg">
              {initials}
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
      <div className="flex flex-wrap items-center gap-6 mb-8 border-b border-white/[0.08] relative">
        {[
          { key: 'overview' as const, label: 'Overview' },
          { key: 'mine' as const, label: 'My rooms' },
          { key: 'feed' as const, label: 'Live feed' },
        ].map(tab => {
          const isCurrent = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setTab(tab.key)}
              className={`relative px-3 py-3 text-[14px] sm:text-[15px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8] ${
                isCurrent 
                  ? 'text-white' 
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.03] rounded-t-md'
              }`}
            >
              {tab.label}
              {isCurrent && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-[#8B7CF8] rounded-t-full"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* MAIN COLUMNS GRID */}
      {activeTab === 'overview' ? (
        <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_0.95fr] gap-8">
          {/* LEFT COLUMN: ACTIVE WORK LIST */}
          <ActiveRoomsList
            rooms={rooms}
            loading={loading}
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
          dbUpdates={dbUpdates}
          selectedRoomId={selectedRoomId}
          setSelectedRoomId={setSelectedRoomId}
          updateContent={updateContent}
          setUpdateContent={setUpdateContent}
          posting={posting}
          handlePostUpdate={handlePostUpdate}
          hasNextUpdates={hasNextUpdates}
          fetchNextUpdates={fetchNextUpdates}
          isFetchingNextUpdates={isFetchingNextUpdates}
          rooms={rooms}
          activeTab={activeTab}
          queryClient={queryClient}
        />
      )}
    </motion.div>
  );
}
