import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useAuth, apiCall, supabase } from "../auth/AuthContext";
import { projectId } from "/utils/supabase/info";
import { motion, AnimatePresence } from "motion/react";
import { SocialActionRow } from "../ui/social-actions";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { OnboardingChecklist } from "./OnboardingChecklist";


/* ─────────────────────────────────────────────────────── types */
interface Room {
  id: string;
  title: string;
  description: string;
  tags: string[];
  builderId: string;
  builderName: string;
  status: string;
  updateCount: number;
  observerCount: number;
  lastUpdate?: string;
  createdAt: string;
  updatedAt: string;
}

/* ─────────────────────────────────────────────── tag colour map */
const TAG_PALETTE: Record<string, { bg: string; color: string }> = {
  design:   { bg: 'bg-purple-500/10', color: 'text-purple-400' },
  engineering: { bg: 'bg-emerald-500/10', color: 'text-emerald-400' },
  dev:      { bg: 'bg-blue-500/10',  color: 'text-blue-400' },
  product:  { bg: 'bg-[#6C5CE7]/10', color: 'text-[#8B7CF8]' },
  research: { bg: 'bg-amber-500/10', color: 'text-amber-400' },
  writing:  { bg: 'bg-pink-500/10', color: 'text-pink-400' },
};

function tagStyle(tag: string) {
  return TAG_PALETTE[tag.toLowerCase()] || { bg: 'bg-white/5', color: 'text-slate-400' };
}

/* ───────────────────────────────────────────────── time helper */
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/* ───────────────────────────────────────── inline SVG helpers */
const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const recentActivity = [
  { name: 'Tobi', text: 'reacted "Sharp" to your MoniFlow update', time: '8 min ago', color: 'bg-[#6C5CE7]' },
  { name: 'Funmi', text: 'started following your MoniFlow room', time: '41 min ago', color: 'bg-emerald-500' },
  { name: 'Ade', text: 'reacted "Tell me more" to your PalmPay update', time: '2 hr ago', color: 'bg-amber-500' },
  { name: 'James', text: 'reacted "Push back" to MoniFlow — update 6', time: '5 hr ago', color: 'bg-[#6C5CE7]' },
  { name: '3 new observers', text: 'from your Build Log share', time: 'Yesterday', color: 'bg-emerald-500' },
];

const observersList = [
  { initials: 'TN', name: 'Tobi N.', visits: '8 visits', bg: 'bg-[#6C5CE7]/20', color: 'text-[#8B7CF8]' },
  { initials: 'FO', name: 'Funmi O.', visits: '5 visits', bg: 'bg-emerald-500/20', color: 'text-emerald-400' },
  { initials: 'AI', name: 'Ade I.', visits: '3 visits', bg: 'bg-amber-500/20', color: 'text-amber-400' },
  { initials: 'PM', name: 'Priya M.', visits: '2 visits', bg: 'bg-pink-500/20', color: 'text-pink-400' },
];

const HeartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
  </svg>
);

const ReplyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
);

const ShareIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3"></circle>
    <circle cx="6" cy="12" r="3"></circle>
    <circle cx="18" cy="19" r="3"></circle>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
  </svg>
);

const mockFeedUpdates = [
  {
    id: 1,
    builder: 'Akinrodolu',
    handle: '@akin_dev',
    avatar: 'AK',
    time: '2h',
    room: 'MoniFlow Redesign',
    tag: 'design',
    content: 'Just finalized the new component library for the core transaction flow. We managed to reduce the visual noise by 30% without sacrificing information density. What do you think of this spacing?',
    likes: 12,
    replies: 4,
    comments: [
      { id: 'c1', name: 'Funmi O.', handle: '@funmi_o', text: 'Looks really clean! The spacing gives the primary actions much more breathing room.', time: '1h' }
    ]
  },
  {
    id: 2,
    builder: 'Funmi O.',
    handle: '@funmi_o',
    avatar: 'FO',
    time: '5h',
    room: 'User Research Q3',
    tag: 'research',
    content: 'Completed 15 user interviews this week. The overarching theme: users want fewer clicks to reach their payout history. Drafting the synthesis doc now, will share here tomorrow.',
    likes: 8,
    replies: 1,
    comments: []
  },
  {
    id: 3,
    builder: 'Tobi N.',
    handle: '@tobi_n',
    avatar: 'TN',
    time: '1d',
    room: 'API Gateway Scaling',
    tag: 'engineering',
    content: 'Deployed the new Redis caching layer to staging. We are seeing a 40ms drop in p95 latency on the main feed endpoint. If this holds during load testing tomorrow, we push to prod by Friday. 🚀',
    likes: 24,
    replies: 6,
    isLiked: false,
    comments: [
      { id: 'c2', name: 'Amara O.', handle: '@amara_design', text: 'This is huge! Will make the feed feel so much snappier on mobile.', time: '12h' },
      { id: 'c3', name: 'Akinrodolu', handle: '@akin_dev', text: 'Amazing work! Let me know if you need help analyzing the load test metrics.', time: '2h' }
    ]
  }
];

function RoomCard({ room, showBuilder }: { room: Room; showBuilder: boolean }) {
  const isActive = room.status === 'active';

  return (
    <Link
      to={`/dashboard/room/${room.id}`}
      className="block h-full group"
    >
      <div className="bg-[#0D0B14] border border-white/[0.08] rounded-[16px] p-5 h-full flex flex-col transition-all duration-200 hover:bg-white/[0.03] active:scale-[0.98] relative overflow-hidden group">
        <div className="flex justify-between items-start mb-3">
          <div className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1.5 ${isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-slate-400'}`}>
            {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
            {room.status}
          </div>
          <span className="text-[12px] font-medium text-slate-500">{timeAgo(room.updatedAt)}</span>
        </div>

        <h3 className="font-bold text-[16px] text-white leading-snug mb-2 group-hover:text-[#8B7CF8] transition-colors">
          {room.title}
        </h3>

        <p className="text-[14px] text-slate-400 leading-relaxed mb-6 flex-1 font-medium">
          {room.description}
        </p>

        <div className="border-t border-white/[0.06] pt-4 flex justify-between items-center mt-auto">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Activity
            </span>
            <span className="text-[12px] font-medium text-slate-300">
              {room.updateCount} updates · <span className="text-white">{room.observerCount} observers</span>
            </span>
          </div>
          <div className="flex gap-1.5">
            {room.tags.slice(0, 1).map(tag => {
              const s = tagStyle(tag);
              return (
                <span key={tag} className={`text-[10px] px-2.5 py-1 rounded-md font-mono font-bold uppercase tracking-wide ${s.bg} ${s.color}`}>
                  {tag}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ isBuilder, tab }: { isBuilder: boolean; tab: 'overview' | 'feed' | 'mine' }) {
  return (
    <div className="col-span-full relative overflow-hidden bg-white/[0.01] border border-white/[0.05] rounded-[32px] py-24 px-8 text-center flex flex-col items-center justify-center">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#6C5CE7]/10 rounded-full blur-[80px] pointer-events-none" />
      
      <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mb-6 relative">
        <span className="text-2xl opacity-50">👀</span>
      </div>

      <p className="font-display font-extrabold text-[20px] text-white mb-3 relative">
        No rooms found
      </p>
      <p className="text-[14px] text-slate-400 max-w-[380px] mx-auto leading-relaxed font-medium relative">
        {tab === 'mine' 
          ? 'You have not created any rooms yet. Create a room to start building in the open and gather observers.' 
          : 'There are no active rooms in the live feed right now. Check back later to see what others are building!'}
      </p>

      {tab === 'mine' && (
        <Link
          to="/dashboard/create"
          className="mt-8 relative inline-flex items-center justify-center px-6 py-3 bg-white text-[#0A0910] rounded-full text-[14px] font-bold shadow-[0_4px_20px_rgba(255,255,255,0.15)] transition-transform hover:-translate-y-0.5"
        >
          Create your first room
        </Link>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user, profile, token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [myRooms, setMyRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedUpdates, setFeedUpdates] = useState(mockFeedUpdates);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [expandedComments, setExpandedComments] = useState<number[]>([]);
  const [isResending, setIsResending] = useState(false);

  const activeTab = (searchParams.get('tab') as 'overview' | 'feed' | 'mine') || 'overview';
  const isBuilder = profile?.role === 'builder';
  const firstName = profile?.name?.split(' ')[0] || 'Akin';
  const lastName = profile?.name?.split(' ').slice(1).join(' ') || '';
  const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
  const handle = `@${firstName.toLowerCase()}`;
  const joinDate = profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : '';

  // Helper to get domain badge color
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

  useEffect(() => {
    async function load() {
      try {
        const allRooms = await apiCall('/rooms', {}, token || undefined);
        setRooms(allRooms);
        if (user) {
          const mine = await apiCall(`/users/${user.id}/rooms`, {}, token || undefined);
          setMyRooms(mine);
        }
      } catch (err) {
        console.log('Dashboard load error:', err);
        setRooms([]);
        setMyRooms([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user, token]);

  const activeRoomsCount = rooms.filter(r => r.status === 'active').length || 3;
  const totalReactions = rooms.reduce((sum, r) => sum + ((r.updateCount || 0) * 4), 0) || 47;
  const totalObservers = rooms.reduce((sum, r) => sum + (r.observerCount || 0), 0) || 28;

  const displayRooms = activeTab === 'mine' ? myRooms : rooms;

  function setTab(tab: 'overview' | 'feed' | 'mine') {
    setSearchParams({ tab });
  }

  function formatDate() {
    const date = new Date();
    // Wednesday, 3 June 2026 format
    return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  const handleLike = (id: number) => {
    setFeedUpdates(prev => prev.map(update => {
      if (update.id === id) {
        const isLiked = !update.isLiked;
        if (isLiked) toast.success("Liked update!");
        return {
          ...update,
          isLiked,
          likes: isLiked ? update.likes + 1 : update.likes - 1
        };
      }
      return update;
    }));
  };

  const handleReply = (id: number) => {
    setReplyingTo(id);
  };

  const toggleComments = (id: number) => {
    setExpandedComments(prev => 
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  const submitReply = () => {
    if (!replyText.trim()) return;
    setFeedUpdates(prev => prev.map(update => {
      if (update.id === replyingTo) {
        const newComment = { id: Date.now().toString(), name: firstName, handle: `@${firstName.toLowerCase()}`, text: replyText, time: 'just now' };
        return { ...update, replies: update.replies + 1, comments: [...(update.comments || []), newComment] };
      }
      return update;
    }));
    toast.success("Reply posted successfully!");
    setExpandedComments(prev => replyingTo && !prev.includes(replyingTo) ? [...prev, replyingTo] : prev);
    setReplyingTo(null);
    setReplyText("");
  };

  const handleResendVerification = async () => {
    if (isResending) return;
    setIsResending(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/send-verification-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id,
          email: profile?.email || user?.email || '',
          name: profile?.name || ''
        }),
      });
      
      if (!response.ok) throw new Error('Failed to resend email');
      toast.success("Verification email resent! Check your inbox.");
    } catch (err: any) {
      let errorMessage = "Failed to resend verification email";
      toast.error(errorMessage);
    } finally {
      // Add a 60 second cooldown
      setTimeout(() => setIsResending(false), 60000);
    }
  };

  const handleShare = (id: number) => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

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
            disabled={isResending}
            className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/20 rounded-full text-[12px] font-bold text-amber-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isResending ? "Resending..." : "Resend"}
          </button>
        </div>
      )}

      {/* Onboarding Checklist — shown until all steps complete and signup_completed_at is set */}
      {user && profile && !profile.signup_completed_at && (
        <OnboardingChecklist
          role={(profile.role as 'builder' | 'observer') || 'builder'}
          userId={user.id}
        />
      )}

      {/* ── HEADER ─────────────────── */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          {/* Avatar */}
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
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#6C5CE7] hover:bg-[#5b4ed6] text-white rounded-full text-[13px] font-bold shadow-[0_4px_14px_rgba(108,92,231,0.25)] transition-all"
        >
          <IconPlus /> New room
        </Link>
      </div>

      {/* ── PROFILE CARD & STATS ─────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 mb-8">
        {/* Profile Card */}
        <div className="xl:col-span-2 bg-[#0D0B14] border border-white/[0.08] rounded-[20px] p-6">
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

        {/* Stats Strip (2 columns) */}
        <div className="xl:col-span-3 flex overflow-x-auto snap-x snap-mandatory gap-4 sm:grid sm:grid-cols-2 xl:grid-cols-4 gap-5 sm:overflow-visible">
          {[
            {
              label: 'active rooms',
              value: activeRoomsCount,
              delta: '↑ 1 this week',
              deltaColor: 'text-emerald-400',
              numColor: 'text-[#8B7CF8]',
            },
            {
              label: 'total reactions',
              value: totalReactions,
              delta: '↑ 12 today',
              deltaColor: 'text-amber-400',
              numColor: 'text-white',
            },
            {
              label: 'observers',
              value: totalObservers,
              delta: '↑ 5 new',
              deltaColor: 'text-emerald-400',
              numColor: 'text-white',
            },
            {
              label: 'build logs',
              value: 1,
              delta: '1 completed',
              deltaColor: 'text-slate-400',
              numColor: 'text-white',
            },
          ].map((s, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              key={s.label} 
              className="bg-[#0D0B14] border border-white/[0.08] rounded-[16px] p-5 flex min-h-[120px] flex-col justify-between group hover:bg-white/[0.03] transition-colors cursor-default min-w-[150px] shrink-0 snap-center sm:min-w-0 flex-1"
            >
              <div className={`font-bold text-[30px] tracking-tight leading-none ${s.numColor}`}>
                {s.value}
              </div>
              <div className="text-[13px] text-slate-400 lowercase mt-2 font-mono font-medium">
                {s.label}
              </div>
              <div className={`text-[12px] font-bold mt-2 ${s.deltaColor}`}>
                {s.delta}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── INLINE TEXT TABS ────────────────── */}
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
              className={`relative px-3 py-3 text-[14px] sm:text-[15px] font-semibold transition-colors ${
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

      {/* ── MAIN COLUMNS GRID ────────────────── */}
      {activeTab === 'overview' ? (
        <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_0.95fr] gap-8">
          
          {/* LEFT COLUMN: ACTIVE WORK LIST */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center mb-1">
              <h2 className="font-bold text-[18px] text-white m-0">
                Active rooms
              </h2>
              <button 
                onClick={() => setTab('feed')} 
                className="bg-transparent border-none text-[13px] text-[#8B7CF8] hover:text-[#6C5CE7] font-bold cursor-pointer transition-colors"
              >
                View all
              </button>
            </div>

            {loading ? (
              <div className="text-slate-400 text-[13px]">Loading rooms…</div>
            ) : rooms.length === 0 ? (
              <div className="bg-white/[0.02] p-6 rounded-2xl border border-white/[0.06] text-slate-400 text-[13px]">
                No active rooms. <Link to="/dashboard/create" className="text-[#8B7CF8] hover:underline">Create one</Link> to start building.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {/* Render the rooms styled as dark cards with left vertical color strips */}
                {rooms.slice(0, 3).map((room, idx) => {
                  const lineColors = ['bg-[#6C5CE7]', 'bg-emerald-500', 'bg-amber-500'];
                  const lineColor = lineColors[idx % lineColors.length];
                  
                  const tag = (room.tags && room.tags[0]) ? room.tags[0] : 'product';
                  const tStyle = tagStyle(tag);
                  const isPaused = idx === 2; // Mocking a paused state for visual matching
                  
                  return (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                      key={room.id}
                    >
                      <Link
                        to={`/dashboard/room/${room.id}`}
                        className="block bg-[#0D0B14] border border-white/[0.08] rounded-[16px] py-4 px-5 flex flex-col gap-3 hover:bg-white/[0.03] active:scale-[0.99] transition-all group"
                      >
                        {/* Vertical internal line */}
                        <div className={`w-1 h-[36px] rounded-full shrink-0 ${lineColor} hidden sm:block`} />
                        
                        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center w-full">
                        <div className="flex flex-col gap-1.5">
                          <div className="text-[16px] sm:text-[17px] font-bold text-white group-hover:text-[#8B7CF8] transition-colors">
                            {room.title}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2 text-[14px] text-slate-400 font-mono font-medium">
                            <span className={`w-1.5 h-1.5 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                            <span className="capitalize">{isPaused ? 'Paused' : 'Live'}</span>
                            <span className="text-slate-600 opacity-50">·</span>
                            <span>Day {room.updateCount + 4}</span>
                            <span className="ml-1">{room.updateCount} updates</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-start sm:items-end gap-2">
                          <span className={`text-[11px] font-bold px-3 py-0.5 rounded-full lowercase tracking-wide ${tStyle.bg} ${tStyle.color}`}>
                            {tag}
                          </span>
                          <span className="text-[12px] font-mono text-slate-500 font-medium">
                            {room.updateCount * 3 + 11} reactions
                          </span>
                        </div>
                      </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: RECENT ACTIVITY & WATCHERS */}
          <div className="flex flex-col gap-5">
            
            {/* Recent activity card */}
            <div className="bg-[#0D0B14] border border-white/[0.08] rounded-[16px] p-5 relative overflow-hidden lg:self-start">
              <h3 className="m-0 mb-4 text-[12px] font-bold uppercase tracking-[0.1em] text-slate-500">
                Recent activity
              </h3>
              <div className="flex flex-col gap-1 relative">
                {recentActivity.map((event, idx) => (
                  <div key={idx} className="flex gap-3 items-start min-w-0 p-3 hover:bg-white/[0.03] rounded-xl transition-colors cursor-pointer">
                    <span className={`w-2 h-2 rounded-full ${event.color} mt-1.5 shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="m-0 text-[13px] text-slate-300 leading-snug">
                        <strong className="font-semibold text-white">{event.name}</strong> {event.text}
                      </p>
                      <p className="m-0 mt-1 text-[11px] text-slate-500 font-mono">
                        {event.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Observers card */}
            <div className="bg-[#0D0B14] border border-white/[0.08] rounded-[16px] p-5 relative overflow-hidden">
              <h3 className="m-0 mb-4 text-[12px] font-bold uppercase tracking-[0.1em] text-slate-500 relative">
                Observers on MoniFlow
              </h3>
              
              <div className="flex flex-col gap-1 relative">
                {observersList.map((obs, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-3 p-2 hover:bg-white/[0.03] rounded-xl transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full ${obs.bg} ${obs.color} font-bold text-[11px] flex items-center justify-center font-mono`}>
                        {obs.initials}
                      </div>
                      <span className="text-[13px] font-bold text-slate-200">
                        {obs.name}
                      </span>
                    </div>
                    
                    <span className="text-[12px] text-slate-500 font-medium">
                      {obs.visits}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      ) : (
        /* TIMELINE FEED FOR MY ROOMS / LIVE FEED TABS */
        <div className="max-w-[700px] w-full mx-auto">
          
          {/* INLINE COMPOSER */}
          <div className="bg-[#0D0B14] border-x border-t border-white/[0.08] rounded-t-[16px] p-5 flex gap-4 items-start">
            <div className="w-10 h-10 rounded-full bg-[#6C5CE7]/20 text-[#8B7CF8] font-bold flex items-center justify-center shrink-0">
              AK
            </div>
            <div className="flex-1">
              <textarea 
                placeholder="What are you building right now?"
                className="w-full bg-transparent border-none outline-none text-white text-[16px] resize-none placeholder:text-slate-500 min-h-[60px]"
              />
              <div className="flex justify-between items-center border-t border-white/[0.06] pt-3 mt-2">
                <div className="text-[#8B7CF8] text-[13px] font-semibold cursor-pointer hover:bg-[#8B7CF8]/10 px-3 py-1.5 rounded-full transition-colors active:scale-95">
                  Select Room
                </div>
                <button className="bg-[#8B7CF8] hover:bg-[#7b6ce8] text-white px-5 py-2 rounded-full font-bold text-[14px] transition-colors active:scale-95">
                  Post Update
                </button>
              </div>
            </div>
          </div>

          {/* TIMELINE FEED */}
          <div className="border border-white/[0.08] rounded-b-[16px] bg-[#0D0B14] overflow-hidden mb-12">
            {feedUpdates.map((update, idx) => {
              const tStyle = tagStyle(update.tag);
              return (
                <div key={update.id} className={`p-5 flex gap-4 hover:bg-white/[0.02] transition-colors cursor-pointer ${idx !== feedUpdates.length - 1 ? 'border-b border-white/[0.06]' : ''}`}>
                  <div className="w-10 h-10 rounded-full bg-white/5 text-slate-300 font-bold flex items-center justify-center shrink-0">
                    {update.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-[15px] text-white hover:underline">{update.builder}</span>
                      <span className="text-[14px] text-slate-500">{update.handle}</span>
                      <span className="text-[14px] text-slate-500">·</span>
                      <span className="text-[14px] text-slate-500">{update.time}</span>
                    </div>
                    
                    <div className="mb-2">
                      <span className="text-[13px] font-bold text-slate-300 mr-2">In <span className="text-white hover:underline">{update.room}</span></span>
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-sm lowercase tracking-wide ${tStyle.bg} ${tStyle.color}`}>
                        {update.tag}
                      </span>
                    </div>

                    <p className="text-[15px] text-white leading-relaxed mb-4">
                      {update.content}
                    </p>

                    <SocialActionRow
                      actions={[
                        {
                          key: "reply",
                          icon: <ReplyIcon />,
                          count: update.replies,
                          accent: "blue",
                          onClick: () => toggleComments(update.id),
                        },
                        {
                          key: "like",
                          icon: <HeartIcon />,
                          count: update.likes,
                          accent: "rose",
                          active: update.isLiked,
                          onClick: () => handleLike(update.id),
                        },
                        {
                          key: "share",
                          icon: <ShareIcon />,
                          accent: "emerald",
                          onClick: () => handleShare(update.id),
                        },
                      ]}
                    />

                    {/* Comments section */}
                    {expandedComments.includes(update.id) && (
                      <div className="mt-4 pt-4 border-t border-white/[0.06] flex flex-col gap-3">
                        {(update.comments || []).map((comment: any) => (
                          <div key={comment.id} className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/5 text-slate-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                              {comment.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 bg-white/[0.02] rounded-xl p-3 border border-white/[0.04]">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-[13px] text-white hover:underline">{comment.name}</span>
                                <span className="text-[12px] text-slate-500">{comment.handle}</span>
                                <span className="text-[12px] text-slate-500">·</span>
                                <span className="text-[12px] text-slate-500">{comment.time}</span>
                              </div>
                              <p className="text-[13.5px] text-slate-300 leading-relaxed m-0">
                                {comment.text}
                              </p>
                            </div>
                          </div>
                        ))}
                        <div className="flex items-center gap-3 mt-1">
                          <button 
                            onClick={() => handleReply(update.id)}
                            className="text-[13px] font-bold text-[#8B7CF8] hover:text-[#7b6ce8] transition-colors bg-transparent border-none cursor-pointer flex items-center gap-1.5"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                            Add a reply
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── KEYFRAMES ─────────────────────────── */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      {/* ── REPLY MODAL ────────────────────────── */}
      <AnimatePresence>
        {replyingTo !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReplyingTo(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-[#0D0B14] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden z-10"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/[0.08] bg-white/[0.02]">
                <h3 className="text-white font-bold text-[15px]">Reply to Update</h3>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-4">
                <textarea
                  autoFocus
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply here..."
                  className="w-full bg-transparent border border-white/[0.1] rounded-xl outline-none text-white text-[15px] p-3 min-h-[120px] resize-none placeholder:text-slate-500 focus:border-[#8B7CF8] transition-colors"
                />
                <div className="flex justify-end mt-4">
                  <button
                    onClick={submitReply}
                    disabled={!replyText.trim()}
                    className="bg-[#8B7CF8] hover:bg-[#7b6ce8] disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-full font-bold text-[14px] transition-colors active:scale-95"
                  >
                    Post Reply
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
