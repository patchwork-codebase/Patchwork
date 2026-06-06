import { useState, useMemo } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { CodeSnippetBlock } from '../ui/CodeSnippetBlock';
import { 
  Heart, MessageCircle, Share2, ShieldAlert, Sparkles, X, 
  Send, Hammer, ArrowRight, BookOpen, ImageIcon, Code
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../auth/AuthContext";
import { getAvatarUrl } from "../../utils/helpers";

interface TimelineFeedProps {
  user: any;
  profile: any;
  myRooms: any[];
  observedRooms: any[];
  dbUpdates: any[];
  selectedRoomId: string;
  setSelectedRoomId: (id: string) => void;
  updateContent: string;
  setUpdateContent: (content: string) => void;
  codeSnippet: string;
  setCodeSnippet: (content: string) => void;
  mediaPreview: string | null;
  setMediaPreview: (preview: string | null) => void;
  posting: boolean;
  handlePostUpdate: () => Promise<void>;
  hasNextUpdates: boolean;
  fetchNextUpdates: () => void;
  isFetchingNextUpdates: boolean;
  rooms: any[];
  activeTab: 'overview' | 'feed' | 'mine';
  queryClient: any;
}

const TAG_PALETTE: Record<string, { bg: string; color: string }> = {
  design:      { bg: 'bg-purple-500/10', color: 'text-purple-400' },
  engineering: { bg: 'bg-emerald-500/10', color: 'text-emerald-400' },
  dev:         { bg: 'bg-blue-500/10',  color: 'text-blue-400' },
  product:     { bg: 'bg-[#6C5CE7]/10', color: 'text-[#8B7CF8]' },
  research:    { bg: 'bg-amber-500/10', color: 'text-amber-400' },
  writing:     { bg: 'bg-pink-500/10', color: 'text-pink-400' },
};

function tagStyle(tag: string) {
  return TAG_PALETTE[tag.toLowerCase()] || { bg: 'bg-white/5', color: 'text-slate-400' };
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function TimelineFeed({
  user,
  profile,
  myRooms,
  observedRooms,
  dbUpdates,
  selectedRoomId,
  setSelectedRoomId,
  updateContent,
  setUpdateContent,
  codeSnippet,
  setCodeSnippet,
  mediaPreview,
  setMediaPreview,
  posting,
  handlePostUpdate,
  hasNextUpdates,
  fetchNextUpdates,
  isFetchingNextUpdates,
  rooms,
  activeTab,
  queryClient,
}: TimelineFeedProps) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [expandedComments, setExpandedComments] = useState<string[]>([]);
  const [optimisticToggles, setOptimisticToggles] = useState<Record<string, boolean>>({});
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [activeDomainFilter, setActiveDomainFilter] = useState('All');
  const [feedSort, setFeedSort] = useState<'latest' | 'trending'>('latest');

  const avatarUrl = getAvatarUrl(user?.id || user?.email || 'default');

  const toggleComments = (id: string) => {
    setExpandedComments(prev => 
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  const handleReplyClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setReplyingTo(id);
  };

  const handleOverlayClick = () => {
    if (replyText.trim()) {
      if (window.confirm("You have an unsaved reply. Discard it?")) {
        setReplyingTo(null);
        setReplyText("");
      }
    } else {
      setReplyingTo(null);
    }
  };

  const submitReply = async () => {
    if (!replyText.trim() || !user || !replyingTo) return;
    const update = dbUpdates.find(u => u.id === replyingTo);
    if (!update) return;

    try {
      const payload = {
        id: `${update.roomId}-reaction-reply-${user.id}-${Date.now()}`,
        room_id: update.roomId,
        update_id: replyingTo,
        observer_id: user.id,
        observer_name: profile?.name || user.email?.split('@')[0] || 'Observer',
        type: 'reply',
        text: replyText.trim(),
        created_at: new Date().toISOString(),
      };
      await supabase.from('reactions').insert(payload);
      toast.success("Reply posted successfully!");
      setExpandedComments(prev => replyingTo && !prev.includes(replyingTo) ? [...prev, replyingTo] : prev);
      setReplyingTo(null);
      setReplyText("");
      queryClient.invalidateQueries({ queryKey: ['feed-updates'] });
    } catch (err: any) {
      toast.error(`Failed to post reply: ${err.message}`);
    }
  };

  const handleFollowRoom = async (roomId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    try {
      await supabase.from('room_observers').upsert({ room_id: roomId, observer_id: user.id });
      toast.success("You are now observing this room!");
      queryClient.invalidateQueries({ queryKey: ['observed-rooms', user.id] });
    } catch (err: any) {
      toast.error(`Failed to follow room: ${err.message}`);
    }
  };

  const handleToggleReaction = async (
    updateId: string,
    roomId: string,
    type: 'sharp' | 'pushback' | 'tellmemore',
    currentReactions: any[]
  ) => {
    if (!user) return;
    const key = `${updateId}-${type}`;
    const existing = currentReactions?.find(r => r.type === type && r.observerId === user.id);
    
    // Optimistic state toggle
    setOptimisticToggles(prev => ({
      ...prev,
      [key]: !existing
    }));

    try {
      if (existing) {
        await supabase.from('reactions').delete().eq('id', existing.id);
        toast.success(`Removed ${type === 'tellmemore' ? 'More' : type} reaction`);
      } else {
        const payload = {
          id: `${roomId}-reaction-${type}-${user.id}-${Date.now()}`,
          room_id: roomId,
          update_id: updateId,
          observer_id: user.id,
          observer_name: profile?.name || user.email?.split('@')[0] || 'Observer',
          type,
          text: '',
          created_at: new Date().toISOString(),
        };
        await supabase.from('reactions').insert(payload);
        toast.success(`Added ${type === 'tellmemore' ? 'More' : type} reaction!`);
      }
      queryClient.invalidateQueries({ queryKey: ['feed-updates'] });
    } catch (err: any) {
      // Revert optimistic update on error
      setOptimisticToggles(prev => ({
        ...prev,
        [key]: !!existing
      }));
      toast.error(`Reaction failed: ${err.message}`);
    }
  };

  const renderReactionButton = (
    updateId: string,
    roomId: string,
    type: 'sharp' | 'pushback' | 'tellmemore',
    label: string,
    icon: string,
    activeClass: string,
    serverReactions: any[]
  ) => {
    const key = `${updateId}-${type}`;
    const hasOptimisticOverride = optimisticToggles[key] !== undefined;
    
    const existingInServer = serverReactions?.some(r => r.type === type && r.observerId === user?.id) || false;
    const isActive = hasOptimisticOverride ? optimisticToggles[key] : existingInServer;
    
    let count = serverReactions?.filter(r => r.type === type).length || 0;
    if (hasOptimisticOverride) {
      if (optimisticToggles[key] && !existingInServer) {
        count += 1;
      } else if (!optimisticToggles[key] && existingInServer) {
        count -= 1;
      }
    }

    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleToggleReaction(updateId, roomId, type, serverReactions);
        }}
        className={`px-4 py-1.5 rounded-full text-[12px] font-bold transition-all border active:scale-95 flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8] ${
          isActive 
            ? activeClass
            : "bg-white/[0.02] border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.04]"
        }`}
      >
        <span>{icon}</span>
        <span>{label}</span>
        <span className="opacity-40">·</span>
        <span>{count}</span>
      </button>
    );
  };

  const filteredUpdates = useMemo(() => {
    let result = dbUpdates;
    
    // 1. Base filter by tab
    if (activeTab === 'overview') {
      result = result.filter(u => myRooms.some(r => r.id === u.roomId));
    }

    // 2. Domain filter (only on Global feed)
    if (activeTab === 'feed' && activeDomainFilter !== 'All') {
      result = result.filter(u => {
        const room = rooms?.find(r => r.id === u.roomId) || u.rooms;
        return room?.tags?.includes(activeDomainFilter.toLowerCase());
      });
    }

    // 3. Sorting (Trending vs Latest)
    if (activeTab === 'feed' && feedSort === 'trending') {
      result = [...result].sort((a, b) => {
        const aInteractions = (a.reactions?.length || 0);
        const bInteractions = (b.reactions?.length || 0);
        return bInteractions - aInteractions;
      });
    }
    
    return result;
  }, [dbUpdates, myRooms, activeTab, activeDomainFilter, feedSort, rooms]);

  return (
    <div className="max-w-[700px] w-full mx-auto">
      {/* INLINE COMPOSER */}
      {profile?.role === 'builder' && activeTab === 'overview' && (
        <div className="bg-[#0D0B14] border border-white/[0.08] rounded-[16px] p-3 sm:p-5 flex gap-3 sm:gap-4 items-start mb-6">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/[0.03] border border-white/[0.08] flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover scale-110" />
          </div>
          <div className="flex-1 min-w-0">
            <textarea 
              value={updateContent}
              onChange={(e) => setUpdateContent(e.target.value)}
              disabled={!profile?.emailVerified}
              placeholder={profile?.emailVerified ? "What are you building right now?" : "Please verify your email address to post updates."}
              aria-label="New update content"
              className="w-full bg-transparent border-none outline-none text-white text-[15px] sm:text-[16px] resize-none placeholder:text-slate-500 min-h-[50px] sm:min-h-[60px] disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-[#8B7CF8] rounded-md p-1"
            />

            {mediaPreview && (
              <div className="relative w-fit mb-4 group/preview mt-3">
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
                className="w-full px-5 py-4 mt-3 bg-[#0A0910] border border-white/[0.08] rounded-xl text-[13px] font-mono text-slate-300 focus:outline-none focus:border-[#8B7CF8]/50 focus:ring-1 focus:ring-[#8B7CF8]/50 resize-none mb-4 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8]"
              />
            )}

            <div className="flex items-center justify-between border-t border-white/[0.06] pt-3 mt-2">
              <div className="flex items-center gap-1 sm:gap-2">
                {!profile?.emailVerified ? (
                  <span className="text-[12px] font-bold text-amber-400">⚠️ Verification required.</span>
                ) : myRooms && myRooms.length > 0 ? (
                  <>
                    <label className="flex items-center justify-center w-8 h-8 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 hover:bg-white/[0.06] text-slate-400 hover:text-white rounded-full cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8]">
                      <ImageIcon className="w-[18px] h-[18px]" />
                      <span className="hidden sm:inline sm:ml-1.5 text-[13px] font-semibold">Media</span>
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
                      className={`flex items-center justify-center w-8 h-8 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 hover:bg-white/[0.06] rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8] ${showCodeInput ? 'text-[#8B7CF8] bg-[#8B7CF8]/10' : 'text-slate-400 hover:text-white'}`}
                    >
                      <Code className="w-[18px] h-[18px]" />
                      <span className="hidden sm:inline sm:ml-1.5 text-[13px] font-semibold">Code</span>
                    </button>

                    <div className="w-px h-5 bg-white/[0.08] mx-1 sm:mx-2"></div>

                    <div className="relative inline-block text-left">
                      <button
                        type="button"
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center gap-1.5 bg-[#8B7CF8]/10 hover:bg-[#8B7CF8]/20 text-[#8B7CF8] text-[12px] sm:text-[13px] font-bold rounded-full px-3 py-1.5 focus:outline-none cursor-pointer transition-all max-w-[130px] sm:max-w-[200px]"
                      >
                        <span className="truncate">{myRooms.find(r => r.id === selectedRoomId)?.title || "Select room"}</span>
                        <svg className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                      </button>

                      <AnimatePresence>
                        {dropdownOpen && (
                          <>
                            <div 
                              className="fixed inset-0 z-40 cursor-default" 
                              onClick={() => setDropdownOpen(false)} 
                            />
                            <motion.div
                              initial={{ opacity: 0, y: 4, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 4, scale: 0.95 }}
                              transition={{ duration: 0.12 }}
                              className="absolute left-0 bottom-full mb-2 min-w-[180px] w-max max-w-[280px] bg-[#0E0C16] border border-white/[0.08] rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.6)] p-1 z-50 overflow-hidden"
                            >
                              {myRooms.map(r => (
                                <button
                                  key={r.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedRoomId(r.id);
                                    setDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-3.5 py-2 rounded-lg text-[13px] font-semibold transition-all block ${
                                    selectedRoomId === r.id
                                      ? 'bg-[#8B7CF8]/20 text-[#8B7CF8]'
                                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
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
                  </>
                ) : (
                  <span className="text-slate-500 text-[12px] font-medium">Create a room first</span>
                )}
              </div>

              <button 
                onClick={handlePostUpdate}
                disabled={posting || (!updateContent.trim() && !codeSnippet.trim() && !mediaPreview) || !selectedRoomId || !profile?.emailVerified}
                className="bg-[#8B7CF8] hover:bg-[#7b6ce8] disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 sm:px-5 py-1.5 sm:py-2 rounded-full font-bold text-[13px] sm:text-[14px] transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8] shrink-0 ml-2"
              >
                {posting ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TIMELINE HEADER */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="text-[11px] uppercase tracking-widest text-slate-500 font-bold">
            {activeTab === 'overview' ? 'Overview — active updates' : 'Global timeline'}
          </div>
          <div className="h-px bg-white/[0.08] flex-1 ml-4" />
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 bg-white/[0.02] border border-white/[0.08] px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{rooms.length} live rooms</span>
          </div>
        </div>
        {activeTab === 'feed' && (
          <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
            <div className="flex flex-wrap items-center gap-2">
              {['All', 'Design', 'Engineering', 'Product', 'Research', 'Dev', 'Writing'].map(domain => (
                <button
                  key={domain}
                  onClick={() => setActiveDomainFilter(domain)}
                  className={`px-3 py-1.5 rounded-full text-[12px] font-bold transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8] ${
                    activeDomainFilter === domain
                      ? 'bg-[#6C5CE7] border-[#6C5CE7] text-white shadow-[0_0_10px_rgba(108,92,231,0.3)]'
                      : 'bg-white/[0.02] border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  {domain}
                </button>
              ))}
            </div>
            <div className="flex bg-[#0D0B14] border border-white/[0.08] rounded-full p-1 self-start sm:self-auto">
              <button
                onClick={() => setFeedSort('latest')}
                className={`px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${
                  feedSort === 'latest' ? 'bg-white/[0.08] text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Latest
              </button>
              <button
                onClick={() => setFeedSort('trending')}
                className={`px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${
                  feedSort === 'trending' ? 'bg-white/[0.08] text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Trending
              </button>
            </div>
          </div>
        )}
      </div>

      {/* TIMELINE FEED */}
      <div className="flex flex-col gap-4 mb-12">
        {filteredUpdates.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-[14px] font-medium bg-[#0D0B14] border border-white/[0.08] rounded-[24px]">
            No updates posted yet.
          </div>
        ) : (
          filteredUpdates.map((update, idx) => {
            const fullRoom = rooms?.find(r => r.id === update.roomId);
            const tag = fullRoom?.tags?.[0] || update.rooms?.tags?.[0] || 'product';
            const tStyle = tagStyle(tag);
            const builderName = update.authorName;
            const updateAvatarUrl = getAvatarUrl(update.authorId || builderName);
            const timeString = timeAgo(update.createdAt);
            const roomTitle = fullRoom?.title || update.rooms?.title || 'Unknown Room';
            const comments = update.reactions?.filter((r: any) => r.type === 'reply' || r.text) || [];
            
            const isFollowing = observedRooms.some(r => r.id === update.roomId);
            const isLaunch = fullRoom?.updateCount === 1;

            return (
              <div 
                key={update.id} 
                onClick={() => toggleComments(update.id)}
                className={`bg-[#0D0B14] border ${isLaunch ? 'border-[#8B7CF8]/40 shadow-[0_0_20px_rgba(139,124,248,0.1)]' : 'border-white/[0.08]'} rounded-[24px] p-6 shadow-xl hover:bg-white/[0.01] transition-all cursor-pointer relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8]`}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    toggleComments(update.id);
                  }
                }}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 ${isLaunch ? 'ring-2 ring-[#8B7CF8] shadow-[0_0_15px_rgba(139,124,248,0.3)]' : 'bg-white/[0.03] border border-white/[0.08] shadow-inner'}`}>
                      {isLaunch ? (
                        <div className="w-full h-full bg-gradient-to-br from-[#6C5CE7] to-[#8B7CF8] flex items-center justify-center text-white text-[18px]">🚀</div>
                      ) : (
                        <img src={updateAvatarUrl} alt="Avatar" className="w-full h-full object-cover scale-110" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="font-extrabold text-[16px] text-white leading-tight font-display hover:underline" onClick={(e) => e.stopPropagation()}>{builderName}</div>
                        {isLaunch && (
                          <span className="text-[10px] uppercase tracking-widest font-bold bg-[#8B7CF8]/20 text-[#8B7CF8] px-2 py-0.5 rounded-full">Launched</span>
                        )}
                      </div>
                      <div className="text-[13px] text-slate-400 mt-1 font-medium flex items-center">
                        <span className="text-white font-semibold hover:underline" onClick={(e) => e.stopPropagation()}>{roomTitle}</span>
                        <span className="text-slate-600 mx-1.5">·</span>
                        <span className="capitalize">{tag}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="text-[12px] text-slate-500 font-medium whitespace-nowrap">
                      {timeString}
                    </div>
                    {activeTab === 'feed' && !isFollowing && (
                      <button 
                        onClick={(e) => handleFollowRoom(update.roomId, e)}
                        className="text-[11px] font-bold text-[#8B7CF8] bg-[#8B7CF8]/10 hover:bg-[#8B7CF8]/20 px-2.5 py-1 rounded-full transition-colors"
                      >
                        + Follow
                      </button>
                    )}
                  </div>
                </div>

                {update.content && (
                  <p className="text-[15px] text-slate-200 leading-relaxed mb-4 whitespace-pre-wrap">
                    {update.content}
                  </p>
                )}

                {update.mediaUrl && (
                  <div className="mb-6 relative z-10 rounded-2xl overflow-hidden border border-white/[0.08] bg-[#0A0910] shadow-lg">
                    <img src={update.mediaUrl} alt="Update media" className="w-full object-cover max-h-[500px]" />
                  </div>
                )}

                {update.codeSnippet && <CodeSnippetBlock code={update.codeSnippet} />}

                <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-white/[0.08]">
                  {renderReactionButton(update.id, update.roomId, 'sharp', 'Sharp', '✦', 'bg-[#8B7CF8]/10 border-[#8B7CF8]/30 text-[#8B7CF8]', update.reactions || [])}
                  {renderReactionButton(update.id, update.roomId, 'pushback', 'Push back', '↩', 'bg-rose-500/10 border-rose-500/30 text-rose-400', update.reactions || [])}
                  {renderReactionButton(update.id, update.roomId, 'tellmemore', 'More', '?', 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400', update.reactions || [])}
                  
                  {comments.length > 0 ? (
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleComments(update.id); }}
                      className="ml-auto text-[12px] font-bold text-[#8B7CF8] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8] rounded px-1"
                    >
                      {comments.length} {comments.length === 1 ? 'reply' : 'replies'}
                    </button>
                  ) : (
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleComments(update.id); }}
                      className="ml-auto text-[12px] font-bold text-slate-500 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8] rounded px-1"
                    >
                      Reply
                    </button>
                  )}
                </div>

                {/* Comments section */}
                {expandedComments.includes(update.id) && (
                  <div className="mt-4 pt-4 border-t border-white/[0.06] flex flex-col gap-3">
                    {comments.map((comment: any) => {
                      const commentAvatarUrl = getAvatarUrl(comment.observerId || comment.observerName);
                      const commentHandle = `@${comment.observerName.toLowerCase().replace(/\s+/g, '')}`;
                      const commentTime = timeAgo(comment.createdAt);
                      return (
                        <div key={comment.id} className="flex gap-3" onClick={(e) => e.stopPropagation()}>
                          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                            <img src={commentAvatarUrl} alt="Avatar" className="w-full h-full object-cover scale-110" />
                          </div>
                          <div className="flex-1 bg-white/[0.02] rounded-xl p-3 border border-white/[0.04]">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-[13px] text-white hover:underline">{comment.observerName}</span>
                              <span className="text-[12px] text-slate-500">{commentHandle}</span>
                              <span className="text-[12px] text-slate-500">·</span>
                              <span className="text-[12px] text-slate-500">{commentTime}</span>
                            </div>
                            <p className="text-[13.5px] text-slate-300 leading-relaxed m-0">
                              {comment.text}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex items-center gap-3 mt-1" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={(e) => handleReplyClick(e, update.id)}
                        className="text-[13px] font-bold text-[#8B7CF8] hover:text-[#7b6ce8] transition-colors bg-transparent border-none cursor-pointer flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8] rounded px-1"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        Add a reply
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}

        {hasNextUpdates && (
          <div className="flex justify-center p-6 border-t border-white/[0.06] bg-white/[0.01]">
            <button
              onClick={() => fetchNextUpdates()}
              disabled={isFetchingNextUpdates}
              className="px-6 py-2.5 bg-[#8B7CF8]/10 hover:bg-[#8B7CF8]/20 active:scale-95 border border-[#8B7CF8]/20 text-[#8B7CF8] hover:text-white rounded-full text-[13px] font-bold transition-all disabled:opacity-50 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8]"
            >
              {isFetchingNextUpdates ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Loading...
                </>
              ) : (
                "Load More Updates"
              )}
            </button>
          </div>
        )}
      </div>

      {/* REPLY MODAL */}
      <AnimatePresence>
        {replyingTo !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleOverlayClick}
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
                  onClick={handleOverlayClick}
                  className="text-slate-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8] rounded"
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
                  aria-label="Reply text"
                  className="w-full bg-transparent border border-white/[0.1] rounded-xl outline-none text-white text-[15px] p-3 min-h-[120px] resize-none placeholder:text-slate-500 focus:border-[#8B7CF8] transition-colors focus-visible:ring-2 focus-visible:ring-[#8B7CF8]"
                />
                <div className="flex justify-end mt-4">
                  <button
                    onClick={submitReply}
                    disabled={!replyText.trim()}
                    className="bg-[#8B7CF8] hover:bg-[#7b6ce8] disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-full font-bold text-[14px] transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8]"
                  >
                    Post Reply
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
