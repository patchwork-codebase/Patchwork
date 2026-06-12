import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth, supabase } from "../auth/AuthContext";
import { ArrowLeft, Hammer, Send, ImageIcon, Code, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { ReactionModal } from "./ReactionModal";
import { DraftUpdates } from "./DraftUpdates";
import { LinkedInShareModal } from "../ui/LinkedInShareModal";
import { IntegrationsBar } from "./IntegrationsBar";
import { DecisionLogCard } from "./DecisionLogCard";
import { MilestoneTrackerCard } from "./MilestoneTrackerCard";
import { RoomHeader } from "./RoomHeader";
import { RoomFeed } from "./RoomFeed";
import { useRoomDetails } from "../../hooks/useRooms";
import { timeAgo } from "../../utils/helpers";

const REACTION_CONFIG: Record<string, { emoji: string; label: string; color: string; badge: string; desc: string }> = {
  sharp: { emoji: '⚡', label: 'Sharp', color: 'bg-white/[0.03] border-white/[0.08] text-white', badge: 'bg-[#8B7CF8]/10 text-[#8B7CF8] border border-[#8B7CF8]/20', desc: 'Incisive, direct critique' },
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

  const [newUpdate, setNewUpdate] = useState('');
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [codeSnippet, setCodeSnippet] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [postingUpdate, setPostingUpdate] = useState(false);
  const [reactionModal, setReactionModal] = useState<{ open: boolean; updateId: string | null }>({ open: false, updateId: null });
  const [activeTab, setActiveTab] = useState<'overview' | 'workspace' | 'updates' | 'reactions'>('updates');
  const [closingRoom, setClosingRoom] = useState(false);
  const [linkedinShareOpen, setLinkedinShareOpen] = useState(false);
  const [expandedUpdates, setExpandedUpdates] = useState<Record<string, boolean>>({});
  const updateTextAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const quickUpdateMode = searchParams.get('action') === 'post';
  const isPostingRef = useRef(false);

  const isBuilder = room && profile?.role === 'builder';
  const joined = room?.observerCount !== undefined; // simplified

  useEffect(() => {
    if (quickUpdateMode && room && updateTextAreaRef.current && profile?.role === 'builder') {
      updateTextAreaRef.current.focus();
    }
  }, [quickUpdateMode, room, profile]);

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
      toast.success('Update posted!');
    } catch (err: any) {
      toast.error(`Failed to post update: ${err.message}`);
    } finally {
      isPostingRef.current = false;
      setPostingUpdate(false);
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
    } catch (err: any) {
      toast.error(`Failed to post reaction: ${err.message}`);
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
    } catch (err: any) {
      toast.error(`Failed to close room: ${err.message}`);
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
    } catch (error: any) {
      toast.error(error.message || "Failed to delete update");
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
    return (
      <div className="max-w-[1000px] mx-auto px-6 py-20 text-center text-slate-400">
        <p className="text-lg font-bold">Room not found</p>
        <Link to="/dashboard" className="text-[#8B7CF8] hover:text-white transition-colors text-sm mt-4 inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8]">
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </Link>
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
      <div className="max-w-[1000px] mx-auto px-6 py-10 relative">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#6C5CE7]/10 rounded-full blur-[120px] pointer-events-none -z-10" />

        <Link to="/dashboard" className="inline-flex items-center gap-2 text-[13px] font-bold text-slate-400 hover:text-white mb-8 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8] rounded">
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
        />

        <div className="flex items-center gap-2 border-b border-white/[0.06] mb-8 pb-px mt-4">
          {[
            { key: 'overview', label: 'Overview', count: null },
            { key: 'workspace', label: 'Product Workspace', count: null },
            { key: 'updates', label: 'Updates', count: room.updates.length },
            { key: 'reactions', label: 'Reactions', count: room.reactions.length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-5 py-3 text-[14px] font-bold border-b-2 transition-all flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8] ${
                activeTab === tab.key
                  ? 'border-[#8B7CF8] text-white'
                  : 'border-transparent text-slate-400 hover:text-white hover:border-white/20'
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold tracking-widest ${
                  activeTab === tab.key ? 'bg-[#8B7CF8]/20 text-[#8B7CF8] ring-1 ring-[#8B7CF8]/30' : 'bg-white/5 text-slate-500'
                }`}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 mt-2">
            <DecisionLogCard roomId={id!} user={user} reactions={room.reactions} queryClient={queryClient} />
            <MilestoneTrackerCard roomId={id!} user={user} reactions={room.reactions} queryClient={queryClient} />
          </div>
        )}

        {activeTab === 'workspace' && (
          <div className="mb-8 p-8 bg-[#0D0B14] border border-white/[0.08] rounded-[24px]">
            <div className="text-center mb-8">
              <h3 className="text-[18px] font-bold text-white mb-2">Product Workspace</h3>
              <p className="text-[14px] text-slate-400 max-w-[400px] mx-auto">
                Connect your Notion PRDs, Linear Roadmaps, and GitHub repos to maintain a single source of truth.
              </p>
            </div>
            <div className="max-w-[500px] mx-auto bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6">
              <h4 className="text-[14px] font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#8B7CF8]"></span>
                Linked Artifacts
              </h4>
              <IntegrationsBar roomId={id!} builderId={room.builderId} isOwner={!!(user && user.id === room.builderId)} />
            </div>
          </div>
        )}

        {activeTab === 'updates' && (
          <>
            {isBuilder && room.status === 'active' && (
              <DraftUpdates roomId={id!} profile={profile} />
            )}

            {isBuilder && room.status === 'active' && (
              <form onSubmit={handlePostUpdate} className="bg-white/[0.02] border border-white/[0.06] rounded-[24px] p-6 mb-8 shadow-sm backdrop-blur-sm relative overflow-hidden group">
                <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-[#8B7CF8]/20 rounded-lg flex items-center justify-center">
                    <Hammer className="w-4 h-4 text-[#8B7CF8]" />
                  </div>
                  <span className="text-[14px] font-extrabold text-white font-display">Post an update</span>
                </div>
                <textarea
                  ref={updateTextAreaRef}
                  value={newUpdate}
                  onChange={e => setNewUpdate(e.target.value)}
                  placeholder="What did you just ship, learn, or decide? Be specific — give observers something to react to."
                  rows={3}
                  className="w-full px-5 py-4 bg-[#0A0910]/50 border border-white/[0.08] rounded-xl text-[14px] focus:outline-none focus:border-[#6C5CE7]/50 focus:ring-1 focus:ring-[#6C5CE7]/50 resize-none mb-4 text-white placeholder-slate-600 font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8]"
                />
                
                {mediaPreview && (
                  <div className="relative w-fit mb-4 group/preview">
                    <div className="rounded-xl overflow-hidden border border-white/[0.08] bg-[#0A0910]">
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
                    className="w-full px-5 py-4 bg-[#0A0910] border border-white/[0.08] rounded-xl text-[13px] font-mono text-slate-300 focus:outline-none focus:border-[#8B7CF8]/50 focus:ring-1 focus:ring-[#8B7CF8]/50 resize-none mb-4 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8]"
                  />
                )}

                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                  <div className="grid grid-cols-2 sm:flex items-center gap-2">
                    <label className="flex justify-center items-center gap-2 px-4 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-white rounded-full text-[12px] font-bold cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8]">
                      <ImageIcon className="w-4 h-4 text-[#8B7CF8]" />
                      Attach visual
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
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
                    <button
                      type="button"
                      onClick={() => setShowCodeInput(!showCodeInput)}
                      className={`flex justify-center items-center gap-2 px-4 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] border ${showCodeInput ? 'border-[#8B7CF8] text-[#8B7CF8]' : 'border-white/[0.06] text-white'} rounded-full text-[12px] font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8]`}
                    >
                      <Code className="w-4 h-4" />
                      Code snippet
                    </button>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={postingUpdate || (!newUpdate.trim() && !codeSnippet.trim() && !mediaPreview)}
                    className="flex justify-center items-center gap-2 px-6 py-3 w-full sm:w-auto bg-white text-[#0A0910] text-[13px] font-bold rounded-full hover:bg-slate-200 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(255,255,255,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8]"
                  >
                    {postingUpdate ? 'Posting...' : <><Send className="w-4 h-4" /> Post Update</>}
                  </button>
                </div>
              </form>
            )}

            {!isBuilder && room.status === 'active' && (
              <div className="flex items-center justify-between mb-8">
                <div />
                <button
                  onClick={() => setReactionModal({ open: true, updateId: null })}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-[#0A0910] text-[13px] font-bold rounded-full hover:bg-slate-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8]"
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
              <div className="text-center py-20 bg-white/[0.01] border-2 border-dashed border-white/[0.06] rounded-[24px]">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-30 text-[#8B7CF8]" />
                <p className="font-extrabold text-[16px] text-white font-display mb-2">No reactions yet</p>
              </div>
            ) : (
              [...room.reactions].reverse().filter(r => r.text && r.text.trim().length > 0).map(r => {
                const cfg = REACTION_CONFIG[r.type] || REACTION_CONFIG['reply'];
                return (
                  <div key={r.id} className="flex items-start gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8]" tabIndex={0}>
                    <div className="text-xl mt-0.5">{cfg.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded ${cfg.badge}`}>{cfg.label}</span>
                        <span className="text-[12px] font-bold text-slate-300">{r.observerName}</span>
                        <span className="text-[10px] text-slate-500 font-mono font-medium">{timeAgo(r.createdAt)}</span>
                      </div>
                      <p className="text-[14px] leading-relaxed font-medium text-slate-200 mb-2">{r.text}</p>
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
    </>
  );
}
