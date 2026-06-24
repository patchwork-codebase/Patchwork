import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router";
import { AnimatePresence } from "motion/react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth, supabase } from "../auth/AuthContext";
import { ArrowLeft, Hammer, Send, ImageIcon, Code, MessageCircle, Lock, Sparkles, Smile, Loader2 } from "lucide-react";
import EmojiPicker from 'emoji-picker-react';
import { toast } from "sonner";
import { ReactionModal } from "./ReactionModal";
import { DraftUpdates } from "./DraftUpdates";
import { LinkedInShareModal } from "../ui/LinkedInShareModal";
import { IntegrationsBar } from "./IntegrationsBar";
import { DecisionLogCard } from "./DecisionLogCard";
import { MilestoneTrackerCard } from "./MilestoneTrackerCard";
import { ProductRoomStats } from "./ProductRoomStats";
import { RoomHeader } from "./RoomHeader";
import { RoomFeed } from "./RoomFeed";
import { RoomOverviewTab } from "./RoomOverviewTab";
import { RoomWorkspaceTab } from "./RoomWorkspaceTab";
import { RoomTeamTab } from "./RoomTeamTab";
import { useRoomDetails, useJoinPrivateRoom } from "../../hooks/useRooms";
import { timeAgo } from "../../utils/helpers";
import { VerifiedTick } from "../ui/VerifiedTick";
import { RequestExpertReviewModal } from "./RequestExpertReviewModal";
import { RequestJoinModal } from "./RequestJoinModal";
import { RoomComposer } from "./RoomComposer";

const REACTION_CONFIG: Record<string, { emoji: string; label: string; color: string; badge: string; desc: string }> = {
  sharp: { emoji: '⚡', label: 'Sharp', color: 'bg-white/[0.03] border-white/[0.08] text-white', badge: 'bg-primary-400/10 text-primary-400 border border-primary-400/20', desc: 'Incisive, direct critique' },
  pushback: { emoji: '🔄', label: 'Push back', color: 'bg-rose-500/5 border-rose-500/20 text-rose-400', badge: 'bg-rose-500/10 text-rose-400 border border-rose-500/20', desc: 'Challenge this assumption' },
  tellmemore: { emoji: '💬', label: 'Tell me more', color: 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400', badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20', desc: 'I want to explore this deeper' },
  reply: { emoji: '↩️', label: 'Reply', color: 'bg-blue-500/5 border-blue-500/20 text-blue-400', badge: 'bg-blue-500/10 text-blue-400 border border-blue-500/20', desc: 'A direct reply' },
  like: { emoji: '👍', label: 'Like', color: 'bg-white/[0.03] border-white/[0.08] text-white', badge: 'bg-white/10 text-white border border-white/20', desc: 'A like reaction' },
};

export default function BuildRoom() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();

  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: room, isLoading: loading } = useRoomDetails(id, user?.id);
  const joinPrivateRoomMutation = useJoinPrivateRoom();
  const inviteToken = searchParams.get('invite_token') || searchParams.get('invite');
  const [hasAttemptedJoin, setHasAttemptedJoin] = useState(false);
  const [hasAttemptedAcceptInvite, setHasAttemptedAcceptInvite] = useState(false);

  const [reactionModal, setReactionModal] = useState<{ open: boolean; updateId: string | null }>({ open: false, updateId: null });
  const [activeTab, setActiveTab] = useState<'overview' | 'workspace' | 'updates' | 'reactions' | 'team'>('updates');
  const [closingRoom, setClosingRoom] = useState(false);
  const [linkedinShareOpen, setLinkedinShareOpen] = useState(false);
  const [requestExpertModalOpen, setRequestExpertModalOpen] = useState(false);
  const [requestJoinModalOpen, setRequestJoinModalOpen] = useState(false);
  const [expandedUpdates, setExpandedUpdates] = useState<Record<string, boolean>>({});

  // Composer state hoisted here so RoomFeed can use it for replies
  const [newUpdate, setNewUpdate] = useState('');
  const updateTextAreaRef = useRef<HTMLTextAreaElement | null>(null);

  const isBuilder = room && profile?.role === 'builder' && room.builderId === user?.id;
  const joined = room?.observerCount !== undefined; // simplified



  useEffect(() => {
    if (!loading && !user && inviteToken) {
      navigate(`/signup?returnUrl=${encodeURIComponent(`/room/${id}?invite_token=${inviteToken}`)}`, { replace: true });
    }
  }, [loading, user, inviteToken, id, navigate]);

  useEffect(() => {
    if (!loading && user && inviteToken && !hasAttemptedAcceptInvite) {
      setHasAttemptedAcceptInvite(true);
      supabase.rpc('accept_room_invitation', { p_token: inviteToken }).then(({ error }) => {
        if (!error) {
          toast.success("Invitation accepted! You have successfully joined the room.");
          queryClient.invalidateQueries({ queryKey: ['room-details', id] });
          // Clean up the URL
          const newSearchParams = new URLSearchParams(searchParams);
          newSearchParams.delete('invite_token');
          newSearchParams.delete('invite');
          navigate({ search: newSearchParams.toString() }, { replace: true });
        } else {
          // If it fails (maybe already accepted, expired, or wrong email), fallback to standard join
          if (!room && !hasAttemptedJoin && !joinPrivateRoomMutation.isPending) {
            setHasAttemptedJoin(true);
            joinPrivateRoomMutation.mutate({ roomId: id!, inviteToken });
          }
        }
      });
    } else if (!loading && !room && id && user && !hasAttemptedJoin && !joinPrivateRoomMutation.isPending && !inviteToken) {
      setHasAttemptedJoin(true);
      joinPrivateRoomMutation.mutate({ roomId: id });
    }
  }, [loading, room, id, user, inviteToken, hasAttemptedAcceptInvite, hasAttemptedJoin, joinPrivateRoomMutation, searchParams, navigate, queryClient]);

  useEffect(() => {
    if (user && window.location.pathname.startsWith('/room/')) {
      const search = window.location.search;
      navigate(`/dashboard/room/${id}${search}`, { replace: true });
    }
  }, [user, id, navigate]);



  async function handleReaction(type: string, text: string, updateId: string | null) {
    if (!id || !user) return;
    try {
      const payload = {
        id: `${id}-reaction-${type}-${user.id}-${Date.now()}`,
        room_id: id,
        update_id: updateId || null,
        observer_id: user.id,
        observer_name: profile?.name || user.email?.split('@')[0] || 'Observer',
        type,
        text,
        created_at: new Date().toISOString(),
      };
      
      const { error } = await supabase.from('reactions').insert(payload);
      if (error) throw error;
      toast.success('Reaction posted!');
    } catch (err: unknown) {
      toast.error(`Failed to post reaction: ${(err instanceof Error ? err.message : String(err))}`);
    }
  }

  async function handleCloseRoom() {
    if (!id) return;
    setClosingRoom(true);
    try {
      const { error } = await supabase
        .from('rooms')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', id);
        
      if (error) throw error;
      toast.success('Room closed successfully!');
    } catch (err: unknown) {
      toast.error(`Failed to close room: ${(err instanceof Error ? err.message : String(err))}`);
    } finally {
      setClosingRoom(false);
    }
  }

  const [deletingUpdateId, setDeletingUpdateId] = useState<string | null>(null);

  const handleDeleteUpdate = async (updateId: string) => {
    if (!user) return;
    setDeletingUpdateId(updateId);
    try {
      const { error, count } = await supabase.from('updates').delete({ count: 'exact' }).eq('id', updateId).eq('author_id', user.id);
      if (error) throw error;
      if (count === 0) throw new Error("Update not found or permission denied.");
      toast.success("Update deleted");
    } catch (error: unknown) {
      toast.error((error instanceof Error ? error.message : String(error)) || "Failed to delete update");
    } finally {
      setDeletingUpdateId(null);
    }
  };

  function copyLogLink() {
    const url = `${window.location.origin}/log/${id}`;
    navigator.clipboard.writeText(url);
    toast.success('Build Log link copied!');
  }

  if (loading) {
    return (
      <div className="max-w-[1000px] mx-auto px-6 py-24 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-primary-400 animate-spin mb-4" />
        <p className="text-slate-500 font-medium animate-pulse">Loading room...</p>
      </div>
    );
  }

  if (!room) {
    if (joinPrivateRoomMutation.isPending) {
      return (
        <div className="max-w-[1000px] mx-auto px-6 py-20 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary-400 border-t-transparent rounded-full animate-spin mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Requesting Access...</h2>
          <p className="text-slate-400">Verifying your invite token.</p>
        </div>
      );
    }

    return (
      <div className="max-w-[1000px] mx-auto px-6 py-20 text-center flex flex-col items-center justify-center">
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-slate-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Private Room</h2>
        <p className="text-slate-400 max-w-md mx-auto mb-8">
          This room is private. You need an invite link from the builder to access it. 
          {(!user && inviteToken) && " Please sign in or create an account to use your invite token."}
        </p>
        
        {!user && inviteToken ? (
          <Link to={`/login?returnUrl=/room/${id}?invite_token=${inviteToken}`} className="bg-primary-400 hover:bg-[#7b6ce8] text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-primary-400/20 focus-ring">
            Sign In to Join
          </Link>
        ) : user ? (
          <div className="flex gap-4">
            <Link to="/dashboard" className="text-slate-400 hover:text-white transition-colors inline-flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white bg-white/5 px-6 py-3 rounded-xl hover:bg-white/10 font-bold">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
            <button onClick={() => setRequestJoinModalOpen(true)} className="bg-primary-400 hover:bg-[#7b6ce8] text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-primary-400/20 focus-ring">
              Request to Join
            </button>
          </div>
        ) : (
          <Link to="/dashboard" className="text-slate-400 hover:text-white transition-colors inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white bg-white/5 px-6 py-3 rounded-xl hover:bg-white/10 font-bold">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        )}
        <RequestJoinModal open={requestJoinModalOpen} onClose={() => setRequestJoinModalOpen(false)} roomId={id!} />
      </div>
    );
  }

  const reactionsByUpdate = room.reactions.reduce((acc: any, r: any) => {
    const key = r.updateId || '__room__';
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <>
      <div className="max-w-[1000px] w-full mx-auto px-4 sm:px-6 py-6 md:py-10 relative">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />

        <Link to="/dashboard" className="inline-flex items-center gap-2 text-[13px] font-bold text-slate-400 hover:text-white mb-8 transition-colors group focus-ring rounded">
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Dashboard
        </Link>

        <RoomHeader 
          room={room} 
          isBuilder={isBuilder} 
          closingRoom={closingRoom} 
          user={user} 
          setLinkedinShareOpen={setLinkedinShareOpen} 
          handleCloseRoom={handleCloseRoom} 
          copyLogLink={copyLogLink}
          setRequestExpertModalOpen={setRequestExpertModalOpen}
        />

        <div className="flex items-center gap-2 border-b border-white/[0.06] mb-8 pb-px mt-4 overflow-x-auto scrollbar-hide whitespace-nowrap">
          {[
            { key: 'overview', label: 'Overview', count: null, show: true },
            { key: 'workspace', label: 'Product Workspace', count: null, show: true },
            { key: 'updates', label: 'Updates', count: room.updates.length, show: true },
            { key: 'reactions', label: 'Reactions', count: room.reactions.length, show: true },
            { key: 'team', label: 'Team Members', count: room.observerCount, show: room.isPrivate }
          ].filter(t => t.show).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-5 py-3 text-[14px] font-bold border-b-2 transition-all flex items-center gap-2 focus-ring ${
                activeTab === tab.key
                  ? 'border-primary-400 text-primary-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold tracking-widest ${
                  activeTab === tab.key ? 'bg-primary-400/20 text-primary-400 ring-1 ring-primary-400/30' : 'bg-white/5 text-slate-500'
                }`}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <RoomOverviewTab room={room} id={id} user={user} reactions={room.reactions} queryClient={queryClient} isBuilder={isBuilder} />
        )}

        {activeTab === 'workspace' && (
          <RoomWorkspaceTab roomId={id} builderId={room.builderId} user={user} />
        )}

        {activeTab === 'team' && (
          <RoomTeamTab roomId={id!} isBuilder={isBuilder} roomTitle={room.title} builderName={room.builderName} />
        )}

        {activeTab === 'updates' && (
          <>
            {isBuilder && room.status === 'active' && (
              <DraftUpdates roomId={id!} profile={profile} />
            )}

            {isBuilder && room.status === 'active' && (
              <RoomComposer 
                roomId={id!} 
                user={user} 
                profile={profile} 
                room={room} 
                newUpdate={newUpdate}
                setNewUpdate={setNewUpdate}
                updateTextAreaRef={updateTextAreaRef}
              />
            )}

            {!isBuilder && room.status === 'active' && (
              <div className="flex items-center justify-between mb-8">
                <div />
                <button
                  onClick={() => setReactionModal({ open: true, updateId: null })}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-ink text-[13px] font-bold rounded-full hover:bg-slate-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] focus-ring"
                >
                  <MessageCircle className="w-4 h-4" /> React to room
                </button>
              </div>
            )}

            <div className="h-[800px]">
              <RoomFeed 
                room={room} 
                user={user} 
                isBuilder={isBuilder} 
                reactionsByUpdate={reactionsByUpdate} 
                expandedUpdates={expandedUpdates} 
                setExpandedUpdates={setExpandedUpdates} 
                setReactionModal={setReactionModal} 
                deletingUpdateId={deletingUpdateId} 
                handleDeleteUpdate={handleDeleteUpdate}
                setNewUpdate={setNewUpdate}
                updateTextAreaRef={updateTextAreaRef}
                REACTION_CONFIG={REACTION_CONFIG}
              />
            </div>
          </>
        )}

        {activeTab === 'reactions' && (
          <div className="space-y-4">
            {room.reactions.length === 0 ? (
              <div className="text-center py-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[24px]">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-30 text-primary-400" />
                <p className="font-extrabold text-[16px] text-slate-900 font-display mb-2">No reactions yet</p>
              </div>
            ) : (
              [...room.reactions].reverse().filter(r => r.text && r.text.trim().length > 0).map(r => {
                const cfg = REACTION_CONFIG[r.type] || REACTION_CONFIG['reply'];
                return (
                  <div key={r.id} className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm focus-ring" tabIndex={0}>
                    <div className="text-xl mt-0.5">{cfg.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded ${cfg.badge}`}>{cfg.label}</span>
                        <span className="text-[12px] font-bold text-slate-900 flex items-center gap-1">
                          {r.observerName}
                          <VerifiedTick userId={r.observerId} className="w-3.5 h-3.5" />
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono font-medium">{timeAgo(r.createdAt)}</span>
                      </div>
                      <p className="text-[14px] leading-relaxed font-medium text-slate-700 mb-2">{r.text}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {reactionModal.open && (
        <ReactionModal
          updateId={reactionModal.updateId}
          onClose={() => setReactionModal({ open: false, updateId: null })}
          onSubmit={handleReaction}
        />
      )}
      <LinkedInShareModal
        open={linkedinShareOpen}
        onClose={() => setLinkedinShareOpen(false)}
        roomId={id!}
        userId={user?.id!}
        roomTitle={room?.title || ''}
      />
      <RequestExpertReviewModal
        open={requestExpertModalOpen}
        onClose={() => setRequestExpertModalOpen(false)}
        roomId={id!}
      />
    </>
  );
}
