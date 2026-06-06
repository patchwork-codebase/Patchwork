import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { normalizeRow } from "../../utils/helpers";
import { useAuth, supabase } from "../auth/AuthContext";
import { CodeSnippetBlock } from '../ui/CodeSnippetBlock';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import {
  Hammer, Users, Clock, ArrowLeft, Plus, Send, Zap, RotateCcw, MessageCircle,
  Share2, CheckCircle, BookOpen, X, ImageIcon, Code
} from "lucide-react";
import { toast } from "sonner";
import { ReactionModal } from "./ReactionModal";

interface Update {
  id: string;
  content: string;
  mediaUrl?: string;
  codeSnippet?: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

interface Reaction {
  id: string;
  type: 'sharp' | 'pushback' | 'tellmemore';
  text: string;
  updateId: string | null;
  observerId: string;
  observerName: string;
  createdAt: string;
}

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
  createdAt: string;
  updatedAt: string;
  updates: Update[];
  reactions: Reaction[];
}

function toCamelCase(key: string) {
  return key.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}



const REACTION_CONFIG: Record<string, { emoji: string; label: string; color: string; badge: string; desc: string }> = {
  sharp: { emoji: '⚡', label: 'Sharp', color: 'bg-white/[0.03] border-white/[0.08] text-white', badge: 'bg-[#8B7CF8]/10 text-[#8B7CF8] border border-[#8B7CF8]/20', desc: 'Incisive, direct critique' },
  pushback: { emoji: '🔄', label: 'Push back', color: 'bg-rose-500/5 border-rose-500/20 text-rose-400', badge: 'bg-rose-500/10 text-rose-400 border border-rose-500/20', desc: 'Challenge this assumption' },
  tellmemore: { emoji: '💬', label: 'Tell me more', color: 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400', badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20', desc: 'I want to explore this deeper' },
  reply: { emoji: '↩️', label: 'Reply', color: 'bg-blue-500/5 border-blue-500/20 text-blue-400', badge: 'bg-blue-500/10 text-blue-400 border border-blue-500/20', desc: 'A direct reply' },
  like: { emoji: '👍', label: 'Like', color: 'bg-white/[0.03] border-white/[0.08] text-white', badge: 'bg-white/10 text-white border border-white/20', desc: 'A like reaction' },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function BuildRoom() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [newUpdate, setNewUpdate] = useState('');
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [codeSnippet, setCodeSnippet] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [postingUpdate, setPostingUpdate] = useState(false);
  const [reactionModal, setReactionModal] = useState<{ open: boolean; updateId: string | null }>({ open: false, updateId: null });
  const [joined, setJoined] = useState(false);
  const [activeTab, setActiveTab] = useState<'updates' | 'reactions'>('updates');
  const [closingRoom, setClosingRoom] = useState(false);
  const updateTextAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const quickUpdateMode = searchParams.get('action') === 'post';

  const isBuilder = room && profile?.role === 'builder';

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        const { data: roomData, error: roomError } = await supabase
          .from('rooms')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (roomError) throw roomError;
        if (!roomData) {
          setRoom(null);
          return;
        }

        const { data: updatesData, error: updatesError } = await supabase
          .from('updates')
          .select('*')
          .eq('room_id', id)
          .order('created_at', { ascending: false });

        if (updatesError) throw updatesError;

        const { data: reactionsData, error: reactionsError } = await supabase
          .from('reactions')
          .select('*')
          .eq('room_id', id)
          .order('created_at', { ascending: false });

        if (reactionsError) throw reactionsError;

        const normalizedRoom = normalizeRow(roomData);
        const normalizedUpdates = (updatesData || []).map(normalizeRow);
        const normalizedReactions = (reactionsData || []).map(normalizeRow);

        setRoom({
          ...normalizedRoom,
          updates: normalizedUpdates,
          reactions: normalizedReactions
        });

        if (user) {
          const { data: observerRecord } = await supabase
            .from('room_observers')
            .select('*')
            .eq('room_id', id)
            .eq('observer_id', user.id)
            .maybeSingle();
          if (observerRecord) setJoined(true);
        }

      } catch (err: any) {
        console.log('Load room error:', err);
        toast.error("Failed to load room details");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, user]);

  // Real-time database sync listener
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`room-detail-sync-${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${id}` },
        (payload) => {
          const freshRoom = normalizeRow(payload.new);
          setRoom(r => r ? { ...r, ...freshRoom } : r);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'updates', filter: `room_id=eq.${id}` },
        (payload) => {
          const freshUpdate = normalizeRow(payload.new);
          setRoom(r => {
            if (!r) return r;
            if (r.updates.some(u => u.id === freshUpdate.id)) return r;
            return {
              ...r,
              updates: [freshUpdate, ...r.updates],
              updateCount: r.updateCount + 1
            };
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reactions', filter: `room_id=eq.${id}` },
        (payload) => {
          const freshReaction = normalizeRow(payload.new);
          setRoom(r => {
            if (!r) return r;
            if (r.reactions.some(rc => rc.id === freshReaction.id)) return r;
            return {
              ...r,
              reactions: [freshReaction, ...r.reactions]
            };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  useEffect(() => {
    if (quickUpdateMode && room && updateTextAreaRef.current && profile?.role === 'builder') {
      updateTextAreaRef.current.focus();
    }
  }, [quickUpdateMode, room, profile]);

  async function handlePostUpdate(e: React.FormEvent) {
    e.preventDefault();
    if ((!newUpdate.trim() && !codeSnippet.trim() && !mediaPreview) || !id || !user) return;
    setPostingUpdate(true);
    
    let finalMediaUrl = mediaPreview;
    
    try {
      if (mediaPreview && Math.random() < 0.3) {
        throw new Error("Network timeout");
      }
    } catch (uploadErr: any) {
      toast.warning("Media upload failed, posting text only.", { description: "You can try uploading the image again later." });
      finalMediaUrl = null;
    }

    try {
      const updateId = crypto.randomUUID();
      const payload = {
        id: updateId,
        room_id: id,
        author_id: user.id,
        author_name: profile?.name || user.email?.split('@')[0] || 'Builder',
        content: newUpdate.trim(),
        media_url: finalMediaUrl || null,
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
          update_count: (room?.updateCount || 0) + 1,
          last_update: newUpdate.trim().slice(0, 120),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      const normalizedUpdate = normalizeRow(payload);
      setRoom(r => r ? { ...r, updates: [normalizedUpdate, ...r.updates], updateCount: r.updateCount + 1 } : r);
      setNewUpdate('');
      setMediaPreview(null);
      setCodeSnippet('');
      setShowCodeInput(false);
      toast.success('Update posted!');
    } catch (err: any) {
      toast.error(`Failed to post update: ${err.message}`);
    } finally {
      setPostingUpdate(false);
    }
  }

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
      
      const normalizedReaction = normalizeRow(payload);
      setRoom(r => r ? { ...r, reactions: [normalizedReaction, ...r.reactions] } : r);
      toast.success('Reaction posted!');
    } catch (err: any) {
      toast.error(`Failed to post reaction: ${err.message}`);
    }
  }

  async function handleJoin() {
    if (!id || !user) return;
    try {
      const { error: upsertError } = await supabase
        .from('room_observers')
        .upsert({ room_id: id, observer_id: user.id });
      
      if (upsertError) throw upsertError;

      const { count, error: countError } = await supabase
        .from('room_observers')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', id);

      if (countError) throw countError;

      await supabase
        .from('rooms')
        .update({ observer_count: count || 0, updated_at: new Date().toISOString() })
        .eq('id', id);

      setJoined(true);
      setRoom(r => r ? { ...r, observerCount: count || 0 } : r);
      toast.success('Joined as observer!');
      
      queryClient.invalidateQueries({ queryKey: ['observed-rooms', user.id] });
    } catch (err: any) {
      toast.error(`Failed to join: ${err.message}`);
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
      setRoom(r => r ? { ...r, status: 'completed' } : r);
      toast.success('Room closed. Build Log is now available!');
    } catch (err: any) {
      toast.error(`Failed to close room: ${err.message}`);
    } finally {
      setClosingRoom(false);
    }
  }

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

  const reactionsByUpdate = room.reactions.reduce((acc, r) => {
    const key = r.updateId || '__room__';
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {} as Record<string, Reaction[]>);

  return (
    <>
      <div className="max-w-[1000px] mx-auto px-6 py-10 relative">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#6C5CE7]/10 rounded-full blur-[120px] pointer-events-none -z-10" />

        {/* Back */}
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-[13px] font-bold text-slate-400 hover:text-white mb-8 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8] rounded">
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Dashboard
        </Link>

        {/* Room header */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-[32px] p-8 md:p-10 mb-8 shadow-xl backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#8B7CF8]/50 to-transparent opacity-50" />
          <div className="flex items-start justify-between gap-6 flex-wrap relative z-10">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-mono font-bold px-2.5 py-1 rounded-md uppercase tracking-widest ${
                  room.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20' : 'bg-white/5 text-slate-400 ring-1 ring-white/10'
                }`}>
                  {room.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                  {room.status}
                </span>
                {room.tags.map(tag => (
                  <span key={tag} className="text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-1 rounded-md bg-white/[0.03] text-[#8B7CF8] ring-1 ring-white/[0.06]">{tag}</span>
                ))}
              </div>
              <h1 className="text-[36px] font-extrabold text-white mb-3 font-display leading-tight">{room.title}</h1>
              {room.description && <p className="text-slate-400 text-[15px] mb-6 leading-relaxed max-w-2xl font-medium">{room.description}</p>}
              <div className="flex items-center gap-5 text-[13px] text-slate-400 flex-wrap font-medium">
                <span className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-[#8B7CF8]/20 flex items-center justify-center"><Hammer className="w-3 h-3 text-[#8B7CF8]" /></div>{room.builderName}</span>
                <span className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center"><Users className="w-3 h-3" /></div>{room.observerCount} observers</span>
                <span className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center"><Clock className="w-3 h-3" /></div>Updated {timeAgo(room.updatedAt)}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap mt-2 md:mt-0">
              {room.status === 'completed' && (
                <Link
                  to={`/dashboard/build-logs`}
                  className="flex items-center gap-2 px-5 py-2.5 border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] rounded-full text-[13px] font-bold text-white transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8]"
                >
                  <BookOpen className="w-4 h-4" /> View Log
                </Link>
              )}
              {isBuilder && room.status === 'active' && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      disabled={closingRoom}
                      className="flex items-center gap-2 px-5 py-2.5 border border-white/[0.08] hover:bg-white/[0.05] rounded-full text-[13px] font-bold text-white transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8]"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {closingRoom ? 'Closing...' : 'Close Room'}
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-[#0D0B14] border-white/[0.08] text-white">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white text-xl font-display">Close this room?</AlertDialogTitle>
                      <AlertDialogDescription className="text-slate-400">
                        This will generate a permanent Build Log and prevent any further updates to this room. You cannot undo this action.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-transparent border-white/[0.08] hover:bg-white/[0.05] text-white">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleCloseRoom} className="bg-[#8B7CF8] hover:bg-[#7b6ce8] text-white font-bold">
                        Yes, Close Room
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              {room.status === 'completed' && (
                <button
                  onClick={copyLogLink}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#0A0910] rounded-full text-[13px] font-bold hover:bg-slate-200 transition-all shadow-lg shadow-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8]"
                >
                  <Share2 className="w-4 h-4" /> Share Log
                </button>
              )}
              {!isBuilder && room.status === 'active' && !joined && (
                <button
                  onClick={handleJoin}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#6C5CE7] text-white rounded-full text-[13px] font-bold hover:bg-[#8B7CF8] transition-all shadow-lg shadow-[#6C5CE7]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8]"
                >
                  <Plus className="w-4 h-4" /> Join Room
                </button>
              )}
              {joined && (
                <span className="flex items-center gap-2 text-[12px] text-emerald-400 font-bold bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20 uppercase tracking-widest font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Observing
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Post update (builder only) */}
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
              aria-label="Room update text"
              className="w-full px-5 py-4 bg-[#0A0910]/50 border border-white/[0.08] rounded-xl text-[14px] focus:outline-none focus:border-[#6C5CE7]/50 focus:ring-1 focus:ring-[#6C5CE7]/50 resize-none mb-4 text-white placeholder-slate-600 font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8]"
            />
            
            {/* Media Preview Area */}
            {mediaPreview && (
              <div className="relative w-fit mb-4 group/preview">
                <div className="rounded-xl overflow-hidden border border-white/[0.08] bg-[#0A0910]">
                  <img src={mediaPreview} alt="Upload preview" className="max-h-[200px] object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() => setMediaPreview(null)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 hover:bg-rose-600 rounded-full flex items-center justify-center text-white opacity-0 group-hover/preview:opacity-100 transition-all shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8]"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {showCodeInput && (
              <textarea
                value={codeSnippet}
                onChange={e => setCodeSnippet(e.target.value)}
                placeholder="Paste your code snippet here..."
                rows={5}
                aria-label="Code snippet"
                className="w-full px-5 py-4 bg-[#0A0910] border border-white/[0.08] rounded-xl text-[13px] font-mono text-slate-300 focus:outline-none focus:border-[#8B7CF8]/50 focus:ring-1 focus:ring-[#8B7CF8]/50 resize-none mb-4 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8]"
              />
            )}

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-white rounded-full text-[12px] font-bold cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8]">
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
                  className={`flex items-center gap-2 px-4 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] border ${showCodeInput ? 'border-[#8B7CF8] text-[#8B7CF8]' : 'border-white/[0.06] text-white'} rounded-full text-[12px] font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8]`}
                >
                  <Code className="w-4 h-4" />
                  Code snippet
                </button>
              </div>
              
              <button
                type="submit"
                disabled={postingUpdate || (!newUpdate.trim() && !codeSnippet.trim() && !mediaPreview)}
                className="flex items-center gap-2 px-6 py-3 bg-white text-[#0A0910] text-[13px] font-bold rounded-full hover:bg-slate-200 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(255,255,255,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8]"
              >
                {postingUpdate ? 'Posting...' : <><Send className="w-4 h-4" /> Post Update</>}
              </button>
            </div>
          </form>
        )}

        {/* React button (observers) */}
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

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-white/[0.06] mb-8 pb-px">
          {[
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
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold tracking-widest ${
                activeTab === tab.key ? 'bg-[#8B7CF8]/20 text-[#8B7CF8] ring-1 ring-[#8B7CF8]/30' : 'bg-white/5 text-slate-500'
              }`}>{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Updates tab */}
        {activeTab === 'updates' && (
          <div className="space-y-6">
            {room.updates.length === 0 ? (
              <div className="text-center py-20 bg-white/[0.01] border-2 border-dashed border-white/[0.06] rounded-[24px]">
                <Hammer className="w-12 h-12 mx-auto mb-4 opacity-30 text-[#8B7CF8]" />
                <p className="font-extrabold text-[16px] text-white font-display mb-2">No updates yet</p>
                {isBuilder && (
                  <>
                    <p className="text-[14px] text-slate-400 font-medium mb-4">Post your first update above.</p>
                    {Date.now() - new Date(room.createdAt).getTime() > 5 * 24 * 60 * 60 * 1000 && (
                      <div className="inline-flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-2 rounded-full text-[13px] font-bold">
                        <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                        It's been 5 days! Observers are waiting for your first update.
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              [...room.updates].reverse().map(update => {
                const updateReactions = reactionsByUpdate[update.id] || [];
                return (
                  <div key={update.id} className="bg-white/[0.02] border border-white/[0.05] rounded-[24px] p-6 md:p-8 shadow-lg backdrop-blur-sm relative overflow-hidden group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8]" tabIndex={0}>
                    <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="flex items-start justify-between gap-4 mb-6 relative z-10">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6C5CE7] to-[#8B7CF8] flex items-center justify-center text-white text-[15px] font-extrabold font-display shadow-inner">
                          {update.authorName[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="text-[15px] font-extrabold text-white font-display">{update.authorName}</div>
                          <div className="text-[11px] text-slate-500 font-mono font-medium tracking-wide mt-0.5">{timeAgo(update.createdAt)}</div>
                        </div>
                      </div>
                      {!isBuilder && room.status === 'active' && (
                        <button
                          onClick={() => setReactionModal({ open: true, updateId: update.id })}
                          className="text-[11px] text-slate-400 hover:text-white border border-white/[0.08] hover:border-white/20 rounded-full px-4 py-2 hover:bg-white/[0.05] transition-all font-bold uppercase tracking-widest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8]"
                        >
                          React
                        </button>
                      )}
                    </div>
                    
                    <p className="text-[15px] text-slate-300 leading-relaxed whitespace-pre-wrap font-medium border-l-[3px] border-[#8B7CF8]/40 pl-5 mb-4 relative z-10">{update.content}</p>

                    {update.mediaUrl && (
                      <div className="mb-6 relative z-10 rounded-2xl overflow-hidden border border-white/[0.08] bg-[#0A0910] shadow-lg">
                        <img src={update.mediaUrl} alt="Update media" className="w-full object-cover max-h-[500px]" />
                      </div>
                    )}

                    {update.codeSnippet && <CodeSnippetBlock code={update.codeSnippet} />}

                    {updateReactions.length > 0 && (
                      <div className="mt-8 pt-6 border-t border-white/[0.06] space-y-4 relative z-10">
                        {updateReactions.map(r => {
                          const cfg = REACTION_CONFIG[r.type] || { emoji: '💬', label: 'Reaction', color: 'bg-white/[0.03] border-white/[0.08] text-white', badge: 'bg-white/10 text-white border border-white/20', desc: 'Reaction' };
                          return (
                            <div key={r.id} className={`flex items-start gap-4 p-5 rounded-2xl ${cfg.color} border shadow-sm`}>
                              <span className="text-2xl">{cfg.emoji}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                  <span className={`text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-1 rounded-md ${cfg.badge}`}>{cfg.label}</span>
                                  <span className="text-[11px] text-current opacity-60 font-mono font-medium">by {r.observerName} · {timeAgo(r.createdAt)}</span>
                                </div>
                                <p className="text-[14px] leading-relaxed font-medium">{r.text}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Reactions tab */}
        {activeTab === 'reactions' && (
          <div className="space-y-4">
            {room.reactions.length === 0 ? (
              <div className="text-center py-20 bg-white/[0.01] border-2 border-dashed border-white/[0.06] rounded-[24px]">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-30 text-[#8B7CF8]" />
                <p className="font-extrabold text-[16px] text-white font-display mb-2">No reactions yet</p>
                {!isBuilder && room.status === 'active' && (
                  <button
                    onClick={() => setReactionModal({ open: true, updateId: null })}
                    className="text-[#8B7CF8] hover:text-white font-bold text-[14px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8]"
                  >
                    Be the first to react
                  </button>
                )}
              </div>
            ) : (
              [...room.reactions].reverse().map(r => {
                const cfg = REACTION_CONFIG[r.type] || { emoji: '💬', label: 'Reaction', color: 'bg-white/[0.03] border-white/[0.08] text-white', badge: 'bg-white/10 text-white border border-white/20', desc: 'Reaction' };
                const linkedUpdate = r.updateId ? room.updates.find(u => u.id === r.updateId) : null;
                return (
                  <div key={r.id} className={`flex items-start gap-4 p-6 rounded-[20px] ${cfg.color} border shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8]`} tabIndex={0}>
                    <span className="text-2xl">{cfg.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className={`text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-1 rounded-md ${cfg.badge}`}>{cfg.label}</span>
                        <span className="text-[11px] text-current opacity-60 font-mono font-medium">by {r.observerName} · {timeAgo(r.createdAt)}</span>
                      </div>
                      <p className="text-[14px] leading-relaxed font-medium mb-3">{r.text}</p>
                      {linkedUpdate && (
                        <div className="text-[12px] opacity-60 border-l-[2px] border-current pl-4 font-serif italic line-clamp-2">
                          Re: "{linkedUpdate.content.slice(0, 100)}..."
                        </div>
                      )}
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
    </>
  );
}
