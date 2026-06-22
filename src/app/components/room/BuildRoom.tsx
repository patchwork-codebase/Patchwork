import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth, supabase } from "../auth/AuthContext";
import { ArrowLeft, Hammer, Send, ImageIcon, Code, MessageCircle, Lock } from "lucide-react";
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

  const { data: room, isLoading: loading } = useRoomDetails(id);
  const joinPrivateRoomMutation = useJoinPrivateRoom();
  const inviteToken = searchParams.get('invite_token') || searchParams.get('invite');
  const [hasAttemptedJoin, setHasAttemptedJoin] = useState(false);
  const [hasAttemptedAcceptInvite, setHasAttemptedAcceptInvite] = useState(false);

  const [newUpdate, setNewUpdate] = useState('');
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [codeSnippet, setCodeSnippet] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [postingUpdate, setPostingUpdate] = useState(false);
  const [reactionModal, setReactionModal] = useState<{ open: boolean; updateId: string | null }>({ open: false, updateId: null });
  const [activeTab, setActiveTab] = useState<'overview' | 'workspace' | 'updates' | 'reactions' | 'team'>('updates');
  const [closingRoom, setClosingRoom] = useState(false);
  const [linkedinShareOpen, setLinkedinShareOpen] = useState(false);
  const [requestExpertModalOpen, setRequestExpertModalOpen] = useState(false);
  const [requestJoinModalOpen, setRequestJoinModalOpen] = useState(false);
  const [expandedUpdates, setExpandedUpdates] = useState<Record<string, boolean>>({});
  const [suggestedDecision, setSuggestedDecision] = useState<{ isDecision: boolean; extractedText: string | null } | null>(null);
  const [loggingDecision, setLoggingDecision] = useState(false);
  const [updateType, setUpdateType] = useState<'general' | 'decision' | 'scrap' | 'pivot' | 'blocker' | 'insight' | 'open_question' | 'shipped'>('general');
  const updateTextAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const quickUpdateMode = searchParams.get('action') === 'post';
  const isPostingRef = useRef(false);

  const isBuilder = room && profile?.role === 'builder' && room.builderId === user?.id;
  const joined = room?.observerCount !== undefined; // simplified

  useEffect(() => {
    if (quickUpdateMode && room && updateTextAreaRef.current && profile?.role === 'builder') {
      updateTextAreaRef.current.focus();
    }
  }, [quickUpdateMode, room, profile]);

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

  const handlePostUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user || (!newUpdate.trim() && !codeSnippet.trim() && !mediaPreview)) return;
    if (isPostingRef.current) return;
    
    isPostingRef.current = true;
    setPostingUpdate(true);
    
    try {
      let uploadedMediaUrl = null;
      if (mediaPreview && mediaPreview.startsWith('data:')) {
        const fileExt = mediaPreview.split(';')[0].split('/')[1];
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const base64Data = mediaPreview.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
        const blob = new Blob([new Uint8Array(byteNumbers)], { type: `image/${fileExt}` });

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('updates_media')
          .upload(`public/${fileName}`, blob);
        
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage
          .from('updates_media')
          .getPublicUrl(`public/${fileName}`);
          
        uploadedMediaUrl = urlData.publicUrl;
      }

      const updatePayload = {
        id: window.crypto?.randomUUID?.() || `upd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        room_id: id,
        author_id: user.id,
        author_name: profile?.name || user.email?.split('@')[0] || 'Builder',
        content: newUpdate.trim(),
        media_url: uploadedMediaUrl,
        code_snippet: codeSnippet.trim() || null,
        update_type: updateType,
        created_at: new Date().toISOString()
      };

      const { error: insertError } = await supabase.from('updates').insert(updatePayload);
      if (insertError) throw insertError;

      await supabase.from('rooms').update({
        update_count: (room?.updateCount || 0) + 1,
        last_update: newUpdate.trim().slice(0, 120),
        updated_at: new Date().toISOString()
      }).eq('id', id);

      setNewUpdate('');
      setMediaPreview(null);
      setCodeSnippet('');
      setShowCodeInput(false);
      setUpdateType('general');
      toast.success('Update posted!');

      // Analyze update for technical decisions in background
      supabase.functions.invoke('analyze-update', {
        body: { updateText: updatePayload.content }
      }).then(({ data, error }) => {
        if (!error && data?.success && data?.result?.isDecision && data?.result?.extractedText) {
          setSuggestedDecision(data.result);
        }
      });
    } catch (err: unknown) {
      toast.error(`Failed to post update: ${(err instanceof Error ? err.message : String(err))}`);
    } finally {
      isPostingRef.current = false;
      setPostingUpdate(false);
    }
  };

  const handleLogDecision = async () => {
    if (!id || !user || !suggestedDecision?.extractedText) return;
    setLoggingDecision(true);
    try {
      const payload = {
        room_id: id,
        title: suggestedDecision.extractedText.slice(0, 50) + (suggestedDecision.extractedText.length > 50 ? '...' : ''),
        description: suggestedDecision.extractedText,
        impact: 'Medium',
        created_at: new Date().toISOString()
      };
      const { error } = await supabase.from('room_decisions').insert(payload);
      if (error) throw error;
      toast.success('Decision automatically logged!');
      setSuggestedDecision(null);
    } catch (err: unknown) {
      toast.error(`Failed to log decision: ${(err instanceof Error ? err.message : String(err))}`);
    } finally {
      setLoggingDecision(false);
    }
  };

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
      <div className="max-w-[1000px] mx-auto px-6 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-white/5 rounded-xl w-1/2" />
          <div className="h-6 bg-white/5 rounded-md w-3/4" />
          <div className="h-64 bg-white/5 rounded-[24px]" />
        </div>
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
              <>
                {suggestedDecision && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-[24px] p-6 mb-8 flex items-start gap-4 shadow-[0_4px_20px_rgba(245,158,11,0.05)] animate-in fade-in slide-in-from-top-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 bg-amber-500/5 rounded-full blur-[40px] pointer-events-none" />
                    <div className="bg-amber-500/20 p-3 rounded-2xl shrink-0">
                      <Sparkles className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[16px] font-extrabold text-slate-900 mb-1 font-display">AI extracted a key decision</h4>
                      <p className="text-[14px] font-medium text-slate-700 mb-4 bg-white/60 p-3 rounded-xl border border-amber-500/10 italic">"{suggestedDecision.extractedText}"</p>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={handleLogDecision}
                          disabled={loggingDecision}
                          className="bg-amber-500 hover:bg-amber-400 text-white text-[13px] font-bold px-5 py-2.5 rounded-full transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                        >
                          {loggingDecision ? 'Logging...' : 'Add to Decision Log'}
                        </button>
                        <button 
                          onClick={() => setSuggestedDecision(null)}
                          className="text-slate-500 hover:text-slate-800 text-[13px] font-bold px-4 py-2.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                <form onSubmit={handlePostUpdate} className="bg-white border border-slate-200 rounded-[24px] p-6 mb-8 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-primary-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="mb-4 flex flex-col sm:flex-row sm:items-baseline gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-400/10 rounded-lg flex items-center justify-center">
                        <Hammer className="w-4 h-4 text-primary-400" />
                      </div>
                      <span className="text-[14px] font-extrabold text-primary-400 font-display">Post an update</span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium ml-0 sm:ml-2">For general progress and commits (Use the 'Log Decision' tab below for architectural choices)</span>
                  </div>
                  {/* Update type selector */}
                  {(() => {
                    const UPDATE_TYPES = [
                      { value: 'general',       label: 'General',       color: 'bg-slate-100 text-slate-600 border-slate-200' },
                      { value: 'decision',      label: '⚡ Decision',    color: 'bg-primary-400/10 text-primary-500 border-primary-400/30' },
                      { value: 'scrap',         label: '🗑 Scrap',       color: 'bg-rose-50 text-rose-600 border-rose-200' },
                      { value: 'pivot',         label: '🔄 Pivot',       color: 'bg-orange-50 text-orange-600 border-orange-200' },
                      { value: 'blocker',       label: '🚧 Blocker',     color: 'bg-red-50 text-red-600 border-red-200' },
                      { value: 'insight',       label: '💡 Insight',     color: 'bg-amber-50 text-amber-600 border-amber-200' },
                      { value: 'open_question', label: '❓ Open question', color: 'bg-blue-50 text-blue-600 border-blue-200' },
                      { value: 'shipped',       label: '🚀 Shipped',     color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
                    ] as const;
                    return (
                      <div className="mb-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Update type</p>
                        <div className="flex flex-wrap gap-1.5">
                          {UPDATE_TYPES.map(t => (
                            <button
                              key={t.value}
                              type="button"
                              onClick={() => setUpdateType(t.value as any)}
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${
                                updateType === t.value
                                  ? t.color + ' ring-1 ring-offset-1 ring-current'
                                  : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                  <div className="relative">
                  <textarea
                    ref={updateTextAreaRef}
                    value={newUpdate}
                    onChange={e => setNewUpdate(e.target.value.slice(0, 500))}
                    placeholder="What did you just ship, learn, or decide? Be specific — give observers something to react to."
                    rows={3}
                    maxLength={500}
                    className="w-full px-5 py-4 bg-slate-100 border border-slate-200 rounded-xl text-[14px] focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 resize-none mb-1 text-slate-900 placeholder-slate-500 font-medium transition-all focus-ring"
                  />
                  <span className={`absolute bottom-3 right-3 text-[11px] font-mono font-bold transition-colors ${
                    newUpdate.length >= 480 ? 'text-rose-400' : 'text-slate-400'
                  }`}>{newUpdate.length}/500</span>
                  </div>
                
                {mediaPreview && (
                  <div className="relative w-fit mb-4 group/preview">
                    <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                      <img src={mediaPreview} alt="Upload preview" className="max-h-[200px] object-cover" />
                    </div>
                  </div>
                )}

                {showCodeInput && (
                  <textarea
                    value={codeSnippet}
                    onChange={e => setCodeSnippet(e.target.value)}
                    placeholder="Paste your code snippet here..."
                    rows={5}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-mono text-slate-800 focus:outline-none focus:border-primary-400/50 focus:ring-1 focus:ring-primary-400/50 resize-none mb-4 transition-all focus-ring"
                  />
                )}

                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                  <div className="grid grid-cols-2 sm:flex items-center gap-2">
                    <label className="flex justify-center items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-full text-[12px] font-bold cursor-pointer transition-all focus-ring">
                      <ImageIcon className="w-4 h-4 text-primary-400" />
                      Attach visual
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 5 * 1024 * 1024) {
                              toast.error('Image must be under 5 MB');
                              e.target.value = '';
                              return;
                            }
                            const reader = new FileReader();
                            reader.onloadend = () => setMediaPreview(reader.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowCodeInput(!showCodeInput)}
                      className={`flex justify-center items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border ${showCodeInput ? 'border-primary-400 text-primary-400' : 'border-slate-200 text-slate-600'} rounded-full text-[12px] font-bold transition-all focus-ring`}
                    >
                      <Code className="w-4 h-4" />
                      Code snippet
                    </button>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={postingUpdate || (!newUpdate.trim() && !codeSnippet.trim() && !mediaPreview)}
                    className="flex justify-center items-center gap-2 px-6 py-3 w-full sm:w-auto bg-white text-slate-700 border border-slate-200 text-[13px] font-bold rounded-full hover:bg-slate-50 hover:text-slate-900 transition-all disabled:opacity-50 focus-ring"
                  >
                    {postingUpdate ? 'Posting...' : <><Send className="w-4 h-4" /> Post Update</>}
                  </button>
                </div>
              </form>
            </>
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
