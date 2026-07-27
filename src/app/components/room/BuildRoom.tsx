import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth, supabase } from "../auth/AuthContext";
import { ArrowLeft, MessageCircle, Lock, Smile, Loader2, LayoutDashboard, Layers, Users, Clock, ShieldCheck } from "lucide-react";

import { toast } from "sonner";
import { ReactionModal } from "./ReactionModal";
import { DraftUpdates } from "./DraftUpdates";
import { LinkedInShareModal } from "../ui/LinkedInShareModal";
import { RoomHeader } from "./RoomHeader";
import { RoomFeed } from "./RoomFeed";
import { RoomOverviewTab } from "./RoomOverviewTab";
import { RoomWorkspaceTab } from "./RoomWorkspaceTab";
import { RoomTeamTab } from "./RoomTeamTab";
import { useRoomTeam } from "../../hooks/useRoomTeam";
import { useRoomDetails, useJoinPrivateRoom } from "../../hooks/useRooms";
import { timeAgo } from "../../utils/helpers";
import { VerifiedTick } from "../ui/VerifiedTick";
import { RequestExpertReviewModal } from "./RequestExpertReviewModal";
import { RequestJoinModal } from "./RequestJoinModal";
import { RoomComposer } from "./RoomComposer";
import { OfficialRoomModal } from "./OfficialRoomModal";
import { PATCHWORK_OFFICIAL_ROOM_ID } from "../../constants/patchwork";
import { NdaGateModal } from "./NdaGateModal";
import { BuildTimelineCard } from "./BuildTimelineCard";
import { RoomAccessAuditTab } from "./RoomAccessAuditTab";
import { useCheckNdaAccepted } from "../../hooks/useNda";
import { useLogRoomAccess } from "../../hooks/useRoomAccessLog";
import { useRoomPresence } from "../../hooks/useRoomPresence";
import { SEO } from "../seo/SEO";

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
  const { loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: room, isLoading: roomLoading } = useRoomDetails(id, user?.id);
  const loading = authLoading || roomLoading;
  const { viewers, typingUsers, sendTypingEvent } = useRoomPresence(id, user);
  const joinPrivateRoomMutation = useJoinPrivateRoom();
  const inviteToken = searchParams.get('invite_token') || searchParams.get('invite');
  const [hasAttemptedJoin, setHasAttemptedJoin] = useState(false);
  const [hasAttemptedAcceptInvite, setHasAttemptedAcceptInvite] = useState(false);

  const [reactionModal, setReactionModal] = useState<{ open: boolean; updateId: string | null }>({ open: false, updateId: null });
  const [activeTab, setActiveTab] = useState<'overview' | 'workspace' | 'updates' | 'reactions' | 'team' | 'timeline' | 'audit'>('updates');
  const [closingRoom, setClosingRoom] = useState(false);
  const [linkedinShareOpen, setLinkedinShareOpen] = useState(false);
  const [requestExpertModalOpen, setRequestExpertModalOpen] = useState(false);
  const [requestJoinModalOpen, setRequestJoinModalOpen] = useState(false);
  const [expandedUpdates, setExpandedUpdates] = useState<Record<string, boolean>>({});

  // Composer state hoisted here so RoomFeed can use it for replies
  const [newUpdate, setNewUpdate] = useState('');
  const updateTextAreaRef = useRef<HTMLTextAreaElement | null>(null);

  const isBuilder = room && profile?.role === 'builder' && room.builderId === user?.id;
  const { data: teamData } = useRoomTeam(id);
  const myMemberObj = (teamData?.members || []).find((m: any) => m.id === user?.id);
  const userRole = isBuilder ? 'builder' : (myMemberObj?.role || 'observer');
  const isTeamMember = !!isBuilder || ['team_member', 'collaborator', 'co_founder', 'org_member', 'expert'].includes(userRole);

  // IP Protection hooks
  const { data: ndaAccepted, isLoading: ndaLoading } = useCheckNdaAccepted(
    room?.visibility === 'nda_protected' && !isBuilder && !!user ? id : undefined
  );
  const logAccess = useLogRoomAccess();
  const [ndaGateOpen, setNdaGateOpen] = useState(false);

  // Open NDA gate if room is nda_protected, user is not builder, and NDA not yet accepted
  useEffect(() => {
    if (
      room &&
      room.visibility === 'nda_protected' &&
      !isBuilder &&
      user &&
      !ndaLoading &&
      ndaAccepted === false
    ) {
      setNdaGateOpen(true);
    } else {
      setNdaGateOpen(false);
    }
  }, [room, isBuilder, user, ndaAccepted, ndaLoading]);

  // Log room view on first load (fire-and-forget)
  useEffect(() => {
    if (room && user && !isBuilder) {
      logAccess.mutate({ roomId: room.id, action: 'viewed' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.id, user?.id]);

  const [showOfficialModal, setShowOfficialModal] = useState(false);

  useEffect(() => {
    if (room && id === PATCHWORK_OFFICIAL_ROOM_ID) {
      const hasSeen = localStorage.getItem('patchwork_official_modal_seen');
      if (!hasSeen) {
        setShowOfficialModal(true);
      }
    }
  }, [room, id]);

  const handleCloseOfficialModal = () => {
    localStorage.setItem('patchwork_official_modal_seen', 'true');
    setShowOfficialModal(false);
  };
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
      // Only attempt to join if auth is resolved AND we're not the builder.
      // We detect "builder" heuristically: if the join RPC returns FALSE (access denied without token),
      // we don't want to show the request modal. So we only trigger this for non-builders.
      // The builder check happens inside join_private_room and returns TRUE, triggering a refetch.
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
      const reactionId = `${id}-reaction-${type}-${user.id}-${updateId || 'room'}`;
      
      // Check if it already exists (to toggle)
      const { data: existing } = await supabase.from('reactions').select('id').eq('id', reactionId).maybeSingle();
      
      if (existing) {
        // Toggle off
        const { error } = await supabase.from('reactions').delete().eq('id', reactionId);
        if (error) throw error;
        toast.success('Reaction removed');
        return;
      }

      const payload = {
        id: reactionId,
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

  const handleDeleteReaction = async (reactionId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('reactions').delete().eq('id', reactionId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.roomDetails(id || '') });
      toast.success("Comment deleted");
    } catch (error: unknown) {
      toast.error((error instanceof Error ? error.message : String(error)) || "Failed to delete comment");
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
      <SEO 
        title={`${room.title} | Patchwork`}
        description={`Follow the build log for ${room.title} by ${room.builderName} on Patchwork.`}
      />
      <OfficialRoomModal open={showOfficialModal} onClose={handleCloseOfficialModal} />

      {/* NDA Gate — shown to non-builders who haven't accepted the NDA yet */}
      {ndaGateOpen && room && (
        <NdaGateModal
          roomId={room.id}
          roomTitle={room.title}
          builderName={room.builderName}
          customNdaText={room.ndaText}
          onAccepted={() => setNdaGateOpen(false)}
        />
      )}

      <div className="max-w-[1000px] w-full mx-auto px-4 sm:px-6 py-6 md:py-10 relative">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />

        <Link to="/dashboard" className="inline-flex items-center gap-2 text-[13px] font-bold text-slate-400 hover:text-white mb-8 transition-colors group focus-ring rounded">
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Dashboard
        </Link>

        <RoomHeader 
          room={room} 
          isBuilder={!!isBuilder} 
          closingRoom={closingRoom} 
          user={user} 
          setLinkedinShareOpen={setLinkedinShareOpen} 
          handleCloseRoom={handleCloseRoom} 
          copyLogLink={copyLogLink}
          setRequestExpertModalOpen={setRequestExpertModalOpen}
          viewers={viewers}
        />

        <div className="relative mb-8 w-full group/tabs">
          {/* Scroll fade hints for mobile/desktop to indicate scrollability */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#0a0a0a] to-transparent z-10 pointer-events-none opacity-100 transition-opacity rounded-l-2xl" />
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#0a0a0a] to-transparent z-10 pointer-events-none opacity-100 transition-opacity rounded-r-2xl" />
          
          <div className="flex items-center gap-1.5 md:gap-2 bg-[#0a0a0a] p-1.5 rounded-2xl overflow-x-auto scrollbar-hide whitespace-nowrap border border-white/5 shadow-2xl relative z-0 snap-x">
            {[
              { key: 'updates', label: 'Updates', icon: <MessageCircle className="w-4 h-4" />, count: room.updates.length, show: true },
              { key: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" />, count: null, show: true },
              { key: 'workspace', label: 'Workspace', icon: <Layers className="w-4 h-4" />, count: null, show: true },
              { key: 'reactions', label: 'Reactions', icon: <Smile className="w-4 h-4" />, count: room.reactions.length, show: true },
              { key: 'team', label: 'Team', icon: <Users className="w-4 h-4" />, count: room.observerCount, show: room.isPrivate || room.visibility !== 'public' },
              { key: 'timeline', label: 'Timeline', icon: <Clock className="w-4 h-4" />, count: null, show: true },
              { key: 'audit', label: 'Access Log', icon: <ShieldCheck className="w-4 h-4" />, count: null, show: !!isBuilder },
            ].filter(t => t.show).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`snap-start px-4 md:px-5 py-2.5 text-[13px] font-bold rounded-xl transition-all flex items-center gap-2 focus-ring select-none relative group ${
                  activeTab === tab.key
                    ? 'bg-white/10 text-white ring-1 ring-white/10 shadow-sm'
                    : 'bg-transparent text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className={`transition-colors ${activeTab === tab.key ? 'text-primary-400' : 'text-slate-500 group-hover:text-slate-400'}`}>
                  {tab.icon}
                </span>
                {tab.label}
                {tab.count !== null && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold tracking-widest ml-1 transition-colors ${
                    activeTab === tab.key 
                      ? 'bg-primary-500/20 text-primary-400 ring-1 ring-primary-500/30' 
                      : 'bg-white/5 text-slate-400 group-hover:bg-white/10 group-hover:text-white'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'overview' && (
          <RoomOverviewTab
            room={room}
            id={id as string}
            user={user}
            reactions={room.reactions}
            queryClient={queryClient}
            isBuilder={!!isBuilder}
            onPostAsUpdate={(digestText) => {
              setNewUpdate(digestText);
              setActiveTab('updates');
              updateTextAreaRef.current?.focus();
            }}
          />
        )}

        {activeTab === 'workspace' && (
          <RoomWorkspaceTab
            roomId={id as string}
            builderId={room.builderId}
            user={user}
            isTeamMember={isTeamMember}
            userRole={userRole}
            builderName={room.builderName}
          />
        )}

        {activeTab === 'team' && (
          <RoomTeamTab roomId={id!} isBuilder={!!isBuilder} roomTitle={room.title} builderName={room.builderName} />
        )}

        {activeTab === 'timeline' && (
          <BuildTimelineCard
            roomId={id!}
            roomTitle={room.title}
            builderName={room.builderName}
            authorshipTimestamp={room.authorshipTimestamp}
          />
        )}

        {activeTab === 'audit' && isBuilder && (
          <RoomAccessAuditTab roomId={id!} />
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
                sendTypingEvent={sendTypingEvent}
              />
            )}

            {!isBuilder && room.status === 'active' && (
              <div className="flex items-center justify-between mb-8">
                <div />
                <button
                  onClick={() => setReactionModal({ open: true, updateId: null })}
                  className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white border border-white/20 text-[13px] font-bold rounded-full hover:bg-white/20 hover:-translate-y-0.5 transition-all shadow-lg focus-ring"
                >
                  <MessageCircle className="w-4 h-4" /> React to room
                </button>
              </div>
            )}

            <div className={`w-full min-h-[500px] pb-10 ${room.protectionFlags?.disableCopy ? 'select-none' : ''}`}>
              <RoomFeed 
                room={room} 
                user={user} 
                isBuilder={!!isBuilder} 
                reactionsByUpdate={reactionsByUpdate} 
                expandedUpdates={expandedUpdates} 
                setExpandedUpdates={setExpandedUpdates} 
                setReactionModal={setReactionModal} 
                deletingUpdateId={deletingUpdateId} 
                handleDeleteUpdate={handleDeleteUpdate}
                onDeleteReaction={handleDeleteReaction}
                setNewUpdate={setNewUpdate}
                updateTextAreaRef={updateTextAreaRef}
                REACTION_CONFIG={REACTION_CONFIG}
                typingUsers={typingUsers}
              />
            </div>
          </>
        )}

        {activeTab === 'reactions' && (
          <div className="space-y-4">
            {room.reactions.length === 0 ? (
              <div className="text-center py-20 bg-white/5 border-2 border-dashed border-white/10 rounded-[24px]">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-30 text-primary-400" />
                <p className="font-extrabold text-[16px] text-white font-display mb-2">No reactions yet</p>
              </div>
            ) : (
              [...room.reactions].reverse().filter(r => r.text && r.text.trim().length > 0).map(r => {
                const cfg = REACTION_CONFIG[r.type] || REACTION_CONFIG['reply'];
                return (
                  <div key={r.id} className="flex items-start gap-3 p-4 rounded-2xl bg-[#0a0a0a] border border-white/5 shadow-2xl hover:-translate-y-0.5 transition-all focus-ring" tabIndex={0}>
                    <div className="text-xl mt-0.5">{cfg.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded ${cfg.badge}`}>{cfg.label}</span>
                        <span className="text-[12px] font-bold text-white flex items-center gap-1">
                          {r.observerName}
                          <VerifiedTick userId={r.observerId} className="w-3.5 h-3.5" />
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono font-medium">{timeAgo(r.createdAt)}</span>
                      </div>
                      <p className="text-[14px] leading-relaxed font-medium text-slate-300 mb-2">{r.text}</p>
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
