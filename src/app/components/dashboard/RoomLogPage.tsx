import { useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router";
import {
  ArrowLeft, Calendar, Clock, Users, TrendingUp, MessageCircle,
  Share2, BookOpen, Zap, CheckCircle2, PauseCircle, Archive,
  ChevronDown, ChevronUp, RotateCcw, Hammer, FileText, Target,
  CheckCircle, AlertCircle, ArrowRight, LayoutList
} from "lucide-react";
import { SmartArtifactCard } from '../../components/room/SmartArtifactCard';
import { extractKeywords } from '../../utils/keywordExtractor';
import { useRoomDetails } from "../../hooks/useRooms";
import { timeAgo, getAvatarUrl, getObserverCount } from "../../utils/helpers";
import { VerifiedTick } from "../ui/VerifiedTick";
import { OrganizationBadge } from "../ui/OrganizationBadge";
import { ReadMoreText } from "../ui/ReadMoreText";
import { SmartImage } from "../ui/SmartImage";
import { useAuth, supabase } from "../auth/AuthContext";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { analyzeFeedbackSignal } from "../../../utils/feedbackEngine";

const REACTION_CONFIG: Record<string, { emoji: string; label: string; badge: string }> = {
  sharp:       { emoji: '⚡', label: 'Sharp',        badge: 'bg-primary-400/10 text-primary-400 border border-primary-400/20' },
  pushback:    { emoji: '🔄', label: 'Push back',    badge: 'bg-rose-500/10 text-rose-400 border border-rose-500/20' },
  tellmemore:  { emoji: '💬', label: 'Tell me more', badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
  reply:       { emoji: '↩️', label: 'Reply',        badge: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' },
  like:        { emoji: '👍', label: 'Like',          badge: 'bg-white/10 text-white border border-white/20' },
};

function formatDate(iso: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function durationDays(start: string, end: string) {
  if (!start || !end) return 0;
  return Math.max(1, Math.round((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)));
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; icon: any; color: string }> = {
    completed: { label: 'Completed', icon: CheckCircle2, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    shipped:   { label: 'Shipped',   icon: CheckCircle2, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    paused:    { label: 'Paused',    icon: PauseCircle,  color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    stalled:   { label: 'Stalled',   icon: Archive,       color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
    active:    { label: 'Active',    icon: Zap,           color: 'bg-primary-400/10 text-primary-400 border-primary-400/30' },
  };
  const cfg = map[status] || map['completed'];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest border ${cfg.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {cfg.label}
    </span>
  );
}

export default function RoomLogPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: room, isLoading } = useRoomDetails(roomId);
  const [showAllUpdates, setShowAllUpdates] = useState(false);
  const [activeSection, setActiveSection] = useState<'timeline' | 'reactions' | 'decisions' | 'milestones'>('timeline');
  const [retroNote, setRetroNote] = useState('');
  const [retroSaving, setRetroSaving] = useState(false);
  const [sortHighestSignal, setSortHighestSignal] = useState(false);
  const [retroEditing, setRetroEditing] = useState(false);

  // Fetch decisions
  const { data: decisions = [] } = useQuery({
    queryKey: ['room-decisions', roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('room_decisions')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false });
      if (error) { console.error(error); return []; }
      return data || [];
    },
    enabled: !!roomId,
  });

  // Fetch milestones (linear issues)
  const { data: milestones = [] } = useQuery({
    queryKey: ['linear-issues', roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('linear_issues')
        .select('*')
        .eq('room_id', roomId)
        .order('updated_at', { ascending: false });
      if (error) { console.error(error); return []; }
      return data || [];
    },
    enabled: !!roomId,
  });

  // Local heuristic feedback insights — no API needed
  const aiInsights = useMemo(() => {
    if (!roomId) return null;
    return null; // placeholder, insights shown inline per reaction
  }, [roomId]);

  if (isLoading) {
    return (
      <div className="max-w-[860px] mx-auto px-4 sm:px-6 py-12 animate-pulse space-y-6">
        <div className="h-8 bg-slate-200 rounded-xl w-1/3" />
        <div className="h-40 bg-slate-200 rounded-[24px]" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-slate-200 rounded-[16px]" />)}
        </div>
        <div className="h-64 bg-slate-200 rounded-[24px]" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="max-w-[860px] mx-auto px-6 py-20 text-center">
        <Hammer className="w-12 h-12 mx-auto mb-4 text-slate-300" />
        <p className="text-[16px] font-bold text-slate-600 mb-2">Room not found</p>
        <Link to="/dashboard/build-logs" className="text-primary-400 hover:text-primary-500 font-bold text-[13px] inline-flex items-center gap-2 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Build Logs
        </Link>
      </div>
    );
  }

  const updates = room.updates || [];
  const reactions = room.reactions || [];
  const days = durationDays(room.createdAt, room.updatedAt);
  const totalReactions = reactions.filter((r: any) => r.type !== 'reply').length;
  const totalReplies = reactions.filter((r: any) => r.type === 'reply').length;
  const closingNote = updates[0];
  const existingRetro = room.retrospectiveNote || null;
  const isOwner = user?.id === room.builderId;

  // Top Observers based on Reputation Score
  const observerReactionMap: Record<string, { id: string; name: string; score: number, count: number }> = {};
  reactions.forEach((r: any) => {
    if (!r.observerId) return;
    if (!observerReactionMap[r.observerId]) {
      observerReactionMap[r.observerId] = { id: r.observerId, name: r.observerName || 'Observer', score: 0, count: 0 };
    }
    const analysis = analyzeFeedbackSignal(r.text || '', false);
    observerReactionMap[r.observerId].count++;
    observerReactionMap[r.observerId].score += (analysis.signalScore || 10); // Base 10 for any reaction
  });
  const topObservers = Object.values(observerReactionMap).sort((a, b) => b.score - a.score).slice(0, 5);
  const visibleUpdates = showAllUpdates ? updates : updates.slice(0, 5);

  const allUpdatesText = updates.map((u: any) => u.content || '').join(' ');
  const smartTags = React.useMemo(() => extractKeywords(allUpdatesText, 4), [allUpdatesText]);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied!');
  }

  async function saveRetroNote() {
    if (!roomId || !retroNote.trim()) return;
    setRetroSaving(true);
    try {
      const { error } = await supabase
        .from('rooms')
        .update({ retrospective_note: retroNote.trim() })
        .eq('id', roomId);
      if (error) throw error;
      toast.success('Retrospective saved!');
      queryClient.invalidateQueries({ queryKey: ['room-details', roomId] });
      setRetroEditing(false);
    } catch (err: unknown) {
      toast.error(`Failed to save: ${(err instanceof Error ? err.message : String(err))}`);
    } finally {
      setRetroSaving(false);
    }
  }

  return (
    <div className="max-w-[860px] w-full mx-auto px-4 sm:px-6 py-8 relative">

      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-[13px] font-bold text-slate-500 hover:text-slate-900 mb-8 transition-colors group">
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />Back
      </button>

      <div className="bg-white border border-slate-200 rounded-[28px] p-6 sm:p-8 mb-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary-400/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6 relative">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary-400/10 border border-primary-400/20 rounded-2xl flex items-center justify-center shrink-0">
            <BookOpen className="w-7 h-7 text-primary-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <StatusBadge status={room.status} />
              {room.tags?.[0] && <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-slate-100 text-slate-600 border border-slate-200">{room.tags[0]}</span>}
              
              {/* Smart Tags (Local Intelligence) */}
              {smartTags.map((tag, i) => (
                <span key={`smart-${i}`} className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-primary-400/10 text-primary-500 border border-primary-400/20 shadow-sm transition-colors hover:bg-primary-400/20 cursor-default flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5" /> {tag}
                </span>
              ))}
            </div>
            <h1 className="text-[22px] sm:text-[26px] font-extrabold text-slate-900 leading-tight font-display mb-2">{room.title}</h1>
            {room.description && <p className="text-[14px] text-slate-500 font-medium leading-relaxed mb-3 max-w-[560px]">{room.description}</p>}
            <div className="flex flex-wrap items-center gap-4 text-[12px] text-slate-500 font-medium">
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" />Started {formatDate(room.createdAt)}</span>
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-400" />Built over {days} day{days !== 1 ? 's' : ''}</span>
              {room.builderName && (
                <Link to={`/dashboard/profile/${room.builderId}`} className="flex items-center gap-1.5 hover:text-primary-400 transition-colors">
                  <img src={getAvatarUrl(room.builderId || room.builderName)} className="w-4 h-4 rounded-full" alt="builder" />
                  {room.builderName}
                  {!room.builderOrgName && (
                    <VerifiedTick isVerified={!!room.builderIsVerifiedExpert} className="w-3.5 h-3.5" />
                  )}
                </Link>
              )}
              {room.builderOrgName && (
                <OrganizationBadge 
                  orgName={room.builderOrgName} 
                  orgLogo={room.builderOrgLogo} 
                  isVerified={!!room.builderIsVerifiedExpert} 
                />
              )}
            </div>
          </div>
          <button onClick={copyLink} title="Copy link" className="shrink-0 flex items-center gap-2 px-4 py-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-full text-[12px] font-bold text-slate-600 transition-all">
            <Share2 className="w-3.5 h-3.5" /> Share
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[
          { icon: TrendingUp, label: 'Updates', value: updates.length, color: 'text-primary-400', bg: 'bg-primary-400/10' },
          { icon: Users, label: 'Observers', value: getObserverCount(room), color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { icon: Zap, label: 'Reactions', value: totalReactions, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { icon: MessageCircle, label: 'Replies', value: totalReplies, color: 'text-sky-500', bg: 'bg-sky-500/10' },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-slate-200 rounded-[20px] p-4 sm:p-5 shadow-sm flex flex-col gap-2">
            <div className={`w-8 h-8 rounded-xl ${stat.bg} flex items-center justify-center`}><stat.icon className={`w-4 h-4 ${stat.color}`} /></div>
            <div>
              <div className={`text-[24px] font-black leading-none ${stat.color} font-display`}>{stat.value}</div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {(existingRetro || isOwner) && (
        <div className={`border rounded-[20px] p-5 sm:p-6 mb-6 relative overflow-hidden ${existingRetro ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200 border-dashed'}`}>
          {existingRetro ? (
            <>
              <div className="absolute top-4 right-5 text-[72px] leading-none text-white/5 font-serif select-none">"</div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Builder's retrospective</span>
                </div>
                {isOwner && !retroEditing && (
                  <button onClick={() => { setRetroNote(existingRetro); setRetroEditing(true); }} className="text-[11px] font-bold text-slate-400 hover:text-white transition-colors">Edit</button>
                )}
              </div>
              {retroEditing ? (
                <>
                  <textarea autoFocus value={retroNote} onChange={e => setRetroNote(e.target.value)} rows={5} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-[14px] text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400/50 font-medium leading-relaxed" placeholder="What would you do differently? What worked well? What did you learn?" />
                  <div className="flex gap-2 mt-3 justify-end">
                    <button onClick={() => setRetroEditing(false)} className="px-4 py-2 text-[12px] font-bold text-slate-400 hover:text-white transition-colors">Cancel</button>
                    <button onClick={saveRetroNote} disabled={retroSaving || !retroNote.trim()} className="px-5 py-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-900 text-[12px] font-bold rounded-full transition-colors">{retroSaving ? 'Saving...' : 'Save'}</button>
                  </div>
                </>
              ) : (
                <p className="text-[14px] sm:text-[15px] text-slate-200 font-medium leading-relaxed">{existingRetro}</p>
              )}
            </>
          ) : isOwner ? (
            <>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Add a retrospective</span>
              </div>
              {!retroEditing ? (
                <div className="flex flex-col items-start gap-3">
                  <p className="text-[13px] text-slate-500 font-medium leading-relaxed max-w-[480px]">Write a short retrospective — what you learned, what worked, and what you'd do differently.</p>
                  <button onClick={() => setRetroEditing(true)} className="px-5 py-2.5 bg-slate-900 text-white text-[12px] font-bold rounded-full hover:bg-slate-800 transition-colors">Write retrospective</button>
                </div>
              ) : (
                <>
                  <textarea autoFocus value={retroNote} onChange={e => setRetroNote(e.target.value)} rows={5} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-[14px] text-slate-800 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-primary-400/40 font-medium leading-relaxed" placeholder="What would you do differently? What worked well? What did you learn?" />
                  <div className="flex gap-2 mt-3 justify-end">
                    <button onClick={() => setRetroEditing(false)} className="px-4 py-2 text-[12px] font-bold text-slate-500 hover:text-slate-700 transition-colors">Cancel</button>
                    <button onClick={saveRetroNote} disabled={retroSaving || !retroNote.trim()} className="px-5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-[12px] font-bold rounded-full transition-colors">{retroSaving ? 'Saving...' : 'Save retrospective'}</button>
                  </div>
                </>
              )}
            </>
          ) : null}
        </div>
      )}

      {closingNote && (
        <div className="bg-gradient-to-br from-primary-400/5 to-primary-500/5 border border-primary-400/20 rounded-[20px] p-5 sm:p-6 mb-6 relative overflow-hidden">
          <div className="absolute top-4 right-4 text-[60px] leading-none text-primary-400/10 font-serif select-none">"</div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse" />
            <span className="text-[10px] font-bold text-primary-400 uppercase tracking-widest">Builder's closing note</span>
            <span className="text-[10px] text-slate-400 font-mono ml-auto">{timeAgo(closingNote.createdAt)}</span>
          </div>
          <p className="text-[14px] sm:text-[15px] text-slate-700 font-medium leading-relaxed line-clamp-4">{closingNote.content}</p>
        </div>
      )}

      {topObservers.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-[20px] p-5 sm:p-6 mb-6 shadow-sm">
          <h3 className="text-[12px] font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-500" /> Top Contributors
          </h3>
          <div className="flex flex-col gap-2">
            {topObservers.map((obs, i) => (
              <div key={obs.id} onClick={() => navigate(`/dashboard/profile/${obs.id}`)} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group">
                <span className="text-[11px] font-mono font-bold text-slate-300 w-4">{i + 1}</span>
                <img src={getAvatarUrl(obs.id)} className="w-7 h-7 rounded-full ring-2 ring-white shadow-sm group-hover:ring-primary-400/30 transition-all" alt="observer" />
                <span className="text-[13px] font-bold text-slate-800 flex-1 truncate group-hover:text-primary-400 transition-colors flex items-center gap-2">
                  {obs.name}
                  {i === 0 && <span className="bg-amber-100 text-amber-700 text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full font-bold">Top Observer</span>}
                </span>
                <div className="flex flex-col items-end">
                  <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">{obs.score} Rep</span>
                  <span className="text-[9px] text-slate-400 font-mono mt-0.5">{obs.count} posts</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-1 border-b border-slate-200 mb-6 overflow-x-auto scrollbar-hide">
        {([
          { key: 'timeline', label: `Timeline (${updates.length})` },
          { key: 'decisions', label: `Decisions (${decisions.length})` },
          { key: 'milestones', label: `Milestones (${milestones.length})` },
          { key: 'reactions', label: `Reactions (${reactions.filter((r: any) => r.text?.trim()).length})` },
        ] as const).map(tab => (
          <button key={tab.key} onClick={() => setActiveSection(tab.key)} className={`px-5 py-3 text-[13px] font-bold border-b-2 transition-all whitespace-nowrap ${activeSection === tab.key ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeSection === 'timeline' && (
        <div className="space-y-4">
          {updates.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[24px]">
              <TrendingUp className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="text-[14px] font-bold text-slate-400">No updates were posted in this room</p>
            </div>
          ) : (
            <>
              {visibleUpdates.map((update: any, idx: number) => {
                const updateReactions = reactions.filter((r: any) => r.updateId === update.id);
                const reactionCounts = updateReactions.reduce((acc: any, r: any) => { acc[r.type] = (acc[r.type] || 0) + 1; return acc; }, {} as Record<string, number>);
                const isFirst = idx === 0;
                return (
                  <div key={update.id} className={`w-full max-w-full bg-white border rounded-[20px] p-5 sm:p-6 shadow-sm relative ${isFirst ? 'border-primary-400/30 ring-1 ring-primary-400/10' : 'border-slate-200'}`}>
                    {isFirst && (
                      <div className="absolute top-4 right-4">
                        <span className="text-[9px] font-bold text-primary-400 bg-primary-400/10 border border-primary-400/20 px-2 py-0.5 rounded-full uppercase tracking-wider">Final update</span>
                      </div>
                    )}
                    <div className="flex flex-col mb-3 gap-1">
                      <div className="flex items-center gap-2">
                        <img src={getAvatarUrl(update.authorId || update.authorName)} onClick={() => update.authorId && navigate(`/dashboard/profile/${update.authorId}`)} className="w-7 h-7 rounded-lg cursor-pointer hover:ring-2 hover:ring-primary-400 transition-all" alt="author" />
                        <div className="flex items-center gap-1.5 flex-wrap flex-1">
                          <span className="text-[13px] font-bold text-slate-800">{update.authorName}</span>
                          {(!(update as any).authorOrgName) && <VerifiedTick isVerified={!!(update as any).authorIsVerifiedExpert} className="w-3.5 h-3.5 shrink-0" />}
                          <OrganizationBadge 
                            orgName={(update as any).authorOrgName} 
                            orgLogo={(update as any).authorOrgLogo} 
                            isVerified={!!(update as any).authorIsVerifiedExpert} 
                          />
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono ml-auto">{timeAgo(update.createdAt)}</span>
                      </div>
                    </div>
                    <ReadMoreText text={update.content} maxLength={300} className="text-[14px] text-slate-700 leading-relaxed font-medium" />
                    {update.mediaUrl && (
                      <div className="mt-3 w-full max-w-full rounded-xl overflow-hidden border border-slate-200">
                        <SmartImage src={update.mediaUrl} aspectRatio="video" objectFit="cover" alt="Update media" />
                      </div>
                    )}
                    {Object.keys(reactionCounts).length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
                        {Object.entries(reactionCounts).map(([type, count]) => {
                          const cfg = REACTION_CONFIG[type] || REACTION_CONFIG['reply'];
                          return <span key={type} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${cfg.badge}`}><span>{cfg.emoji}</span><span>{count as number}</span></span>;
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              {updates.length > 5 && (
                <button onClick={() => setShowAllUpdates(prev => !prev)} className="w-full flex items-center justify-center gap-2 py-3.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-[20px] text-[13px] font-bold text-slate-600 hover:text-slate-900 transition-all shadow-sm">
                  {showAllUpdates ? <><ChevronUp className="w-4 h-4" /> Show less</> : <><ChevronDown className="w-4 h-4" /> Show all {updates.length} updates</>}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {activeSection === 'reactions' && (() => {
        const textReactions = reactions.filter((r: any) => r.text?.trim() && r.text !== r.type);
        
        // Calculate Room Pulse
        const pulse = { Bug: 0, Idea: 0, Critique: 0, Encouragement: 0, Uncategorized: 0 };
        textReactions.forEach((r: any) => {
          const analysis = analyzeFeedbackSignal(r.text, false);
          pulse[analysis.category]++;
        });
        const totalPulse = textReactions.length || 1; // avoid div by 0

        return (
          <div className="space-y-4">
            {/* Room Pulse (Sentiment Analytics) */}
            {textReactions.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-[20px] p-5 shadow-sm mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-slate-900 leading-tight">Room Pulse</h3>
                    <p className="text-[12px] font-medium text-slate-500">Real-time sentiment from {textReactions.length} feedback items</p>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="h-3 w-full rounded-full overflow-hidden flex bg-slate-100 mb-3 shadow-inner">
                  {pulse.Encouragement > 0 && <div style={{ width: `${(pulse.Encouragement / totalPulse) * 100}%` }} className="h-full bg-blue-500 transition-all duration-500" title="Encouragement" />}
                  {pulse.Idea > 0 && <div style={{ width: `${(pulse.Idea / totalPulse) * 100}%` }} className="h-full bg-emerald-500 transition-all duration-500" title="Idea" />}
                  {pulse.Critique > 0 && <div style={{ width: `${(pulse.Critique / totalPulse) * 100}%` }} className="h-full bg-amber-500 transition-all duration-500" title="Critique" />}
                  {pulse.Bug > 0 && <div style={{ width: `${(pulse.Bug / totalPulse) * 100}%` }} className="h-full bg-rose-500 transition-all duration-500" title="Bug" />}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-4 text-[11px] font-bold tracking-wide">
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" /><span className="text-blue-700">Encouragement ({Math.round((pulse.Encouragement/totalPulse)*100)}%)</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-emerald-700">Ideas ({Math.round((pulse.Idea/totalPulse)*100)}%)</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500" /><span className="text-amber-700">Critiques ({Math.round((pulse.Critique/totalPulse)*100)}%)</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500" /><span className="text-rose-700">Bugs ({Math.round((pulse.Bug/totalPulse)*100)}%)</span></div>
                </div>
              </div>
            )}

          {/* AI Feedback Insights Section */}
          {aiInsights && aiInsights.themes?.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-[20px] p-5 sm:p-6 mb-8 relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary-400 to-transparent opacity-30" />
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary-400/10 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 text-primary-400" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-slate-900 font-display">AI Feedback Insights</h3>
                  <p className="text-[13px] text-slate-600 font-medium">{aiInsights.summary}</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {aiInsights.themes.map((theme: any, i: number) => (
                  <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`w-2 h-2 rounded-full ${
                        theme.sentiment === 'positive' ? 'bg-emerald-400' :
                        theme.sentiment === 'negative' ? 'bg-rose-400' : 'bg-slate-400'
                      }`} />
                      <span className="text-[12px] font-bold text-slate-800 uppercase tracking-wider">{theme.name}</span>
                    </div>
                    <p className="text-[12px] text-slate-600 font-medium leading-relaxed">{theme.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-4 mt-2">
            <h3 className="text-[14px] font-bold text-slate-900">Feedback ({textReactions.length})</h3>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold text-slate-500">Highest signal first</span>
              <button
                onClick={() => setSortHighestSignal(!sortHighestSignal)}
                className={`w-10 h-5 sm:w-11 sm:h-6 rounded-full p-1 transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${sortHighestSignal ? 'bg-primary-500' : 'bg-slate-300'}`}
                aria-pressed={sortHighestSignal}
              >
                <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-white transition-transform ${sortHighestSignal ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {textReactions.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[24px]">
              <MessageCircle className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="text-[14px] font-bold text-slate-400">No text reactions were left in this room</p>
            </div>
          ) : (
            textReactions
              .sort((a: any, b: any) => {
                if (!sortHighestSignal) return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // Newest first
                const scoreA = analyzeFeedbackSignal(a.text || '', false).signalScore;
                const scoreB = analyzeFeedbackSignal(b.text || '', false).signalScore;
                if (scoreB !== scoreA) return scoreB - scoreA;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
              })
              .map((r: any) => {
              const cfg = REACTION_CONFIG[r.type] || REACTION_CONFIG['reply'];
              const { category, signalScore } = analyzeFeedbackSignal(r.text || '', false);
              const isHighSignal = signalScore >= 70;
              const CATEGORY_BADGE: Record<string, string> = {
                Bug:           'bg-rose-50 text-rose-600 border-rose-200',
                Idea:          'bg-emerald-50 text-emerald-600 border-emerald-200',
                Critique:      'bg-amber-50 text-amber-600 border-amber-200',
                Encouragement: 'bg-blue-50 text-blue-600 border-blue-200',
              };
              return (
                <div key={r.id} className={`flex items-start gap-4 p-4 sm:p-5 border rounded-[18px] shadow-sm transition-all ${
                  isHighSignal ? 'bg-amber-50/40 border-amber-200' : 'bg-white border-slate-200'
                }`}>
                  <div className="text-xl mt-0.5">{cfg.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded ${cfg.badge}`}>{cfg.label}</span>
                      {category !== 'Uncategorized' && (
                        <span className={`text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${CATEGORY_BADGE[category] || 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                          {category}
                        </span>
                      )}
                      {isHighSignal && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-700 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded tracking-widest uppercase">
                          <Zap className="w-2.5 h-2.5" /> High Signal
                        </span>
                      )}
                      <img src={getAvatarUrl(r.observerId)} onClick={() => r.observerId && navigate(`/dashboard/profile/${r.observerId}`)} className="w-5 h-5 rounded-full cursor-pointer hover:ring-2 hover:ring-primary-400 transition-all" alt="observer" />
                      <span className="text-[12px] font-bold text-slate-800">{r.observerName}</span>
                      <span className="text-[10px] text-slate-400 font-mono ml-auto">{timeAgo(r.createdAt)}</span>
                    </div>
                    <p className="text-[13px] sm:text-[14px] text-slate-700 leading-relaxed font-medium">{r.text}</p>
                  </div>
                </div>
              );
            })
          )}
          </div>
        </div>
        );
      })()}

      {/* ── Decisions tab ── */}
      {activeSection === 'decisions' && (
        <div className="space-y-3">
          {decisions.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[24px]">
              <FileText className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="text-[14px] font-bold text-slate-400">No decisions were logged in this room</p>
            </div>
          ) : (
            decisions.map((d: any) => {
              const typeMap: Record<string, { label: string; color: string; bg: string; border: string }> = {
                decision: { label: 'DECISION', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
                scrapped:  { label: 'SCRAPPED',  color: 'text-rose-700',  bg: 'bg-rose-50',  border: 'border-rose-200' },
                blocker:   { label: 'BLOCKER',   color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
                shipped:   { label: 'SHIPPED',   color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
              };
              const t = typeMap[d.type || 'decision'] || typeMap['decision'];
              return (
                <div key={d.id} className="bg-white border border-slate-200 rounded-[18px] p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className={`shrink-0 text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md border font-mono mt-0.5 ${t.color} ${t.bg} ${t.border}`}>{t.label}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[14px] font-bold text-slate-900 leading-snug">{d.title}</p>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0 mt-0.5">{timeAgo(d.created_at || d.createdAt)}</span>
                      </div>
                      {d.description && <p className="text-[13px] text-slate-600 mt-1.5 leading-relaxed font-medium">{d.description}</p>}
                      {d.outcome && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Outcome · </span>
                          <span className="text-[13px] text-slate-600 font-medium">{d.outcome}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Milestones tab ── */}
      {activeSection === 'milestones' && (
        <div className="space-y-3">
          {milestones.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[24px]">
              <Target className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="text-[14px] font-bold text-slate-400">No milestones were tracked in this room</p>
              <p className="text-[12px] text-slate-400 mt-1">Milestones sync from Linear when connected</p>
            </div>
          ) : (
            milestones.map((m: any) => {
              const state = (m.state || '').toLowerCase();
              let statusCfg: { icon: any; iconColor: string; badge: string; label: string };
              if (state.includes('done') || state.includes('complet') || state.includes('cancel')) {
                statusCfg = { icon: CheckCircle, iconColor: 'text-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: m.state };
              } else if (state.includes('progress') || state.includes('active') || state.includes('doing')) {
                statusCfg = { icon: ArrowRight, iconColor: 'text-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200', label: m.state };
              } else if (state.includes('block') || state.includes('stuck')) {
                statusCfg = { icon: AlertCircle, iconColor: 'text-rose-500', badge: 'bg-rose-50 text-rose-700 border-rose-200', label: m.state };
              } else {
                statusCfg = { icon: Clock, iconColor: 'text-slate-400', badge: 'bg-slate-50 text-slate-600 border-slate-200', label: m.state || 'Planned' };
              }
              const Icon = statusCfg.icon;
              return (
                <div key={m.id} className="bg-white border border-slate-200 rounded-[18px] p-5 shadow-sm flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5`}>
                    <Icon className={`w-4 h-4 ${statusCfg.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <p className="text-[14px] font-bold text-slate-900 leading-snug">{m.title}</p>
                      <span className={`shrink-0 text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md border font-mono ${statusCfg.badge}`}>{statusCfg.label}</span>
                    </div>
                    {m.description && <p className="text-[13px] text-slate-500 leading-relaxed font-medium">{m.description}</p>}
                    {m.url && (
                      <a href={m.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-primary-400 hover:underline font-bold mt-2">
                        View in Linear ↗
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      <div className="mt-10 flex items-center justify-between flex-wrap gap-3 py-6 border-t border-slate-200">
        <div className="flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-slate-400" />
          <span className="text-[12px] text-slate-400 font-medium">This room is archived and read-only</span>
        </div>
        <Link to="/dashboard/build-logs" className="text-[13px] font-bold text-slate-600 hover:text-slate-900 transition-colors inline-flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" /> All build logs
        </Link>
      </div>
    </div>
  );
}
