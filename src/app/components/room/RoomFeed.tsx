import { useState } from "react";
import { Virtuoso } from "react-virtuoso";
import { useSearchParams } from "react-router";
import { Hammer, Trash2, Zap } from "lucide-react";
import { timeAgo } from "../../utils/helpers";
import { UserAvatar } from "../ui/UserAvatar";
import { analyzeFeedbackSignal } from "../../../utils/feedbackEngine";
import { CodeSnippetBlock } from '../ui/CodeSnippetBlock';
import { ReadMoreText } from "../ui/ReadMoreText";
import { FigmaEmbed } from "../ui/FigmaEmbed";
import { SmartArtifactCard } from "../ui/SmartArtifactCard";
import { VerifiedTick } from "../ui/VerifiedTick";
import { SmartImage } from "../ui/SmartImage";
import { CrossroadCard } from "./CrossroadCard";
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
import type { PresenceUser } from "../../hooks/useRoomPresence";
import type { Room, Reaction, Update, ReactionConfig } from "../../types";

const CATEGORY_BADGE: Record<string, string> = {
  Bug: 'bg-rose-50 text-rose-600 border-rose-200',
  Idea: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  Critique: 'bg-amber-50 text-amber-600 border-amber-200',
  Encouragement: 'bg-blue-50 text-blue-600 border-blue-200',
  Uncategorized: 'bg-slate-50 text-slate-500 border-slate-200',
};

function FeedbackBadge({ text, isExpert, preCalculated }: { text: string; isExpert: boolean; preCalculated?: ReturnType<typeof analyzeFeedbackSignal> }) {
  const { category, signalScore } = preCalculated || analyzeFeedbackSignal(text, isExpert);
  const isHighSignal = signalScore >= 70;
  return (
    <span className="inline-flex items-center gap-1.5 flex-wrap">
      {category !== 'Uncategorized' && (
        <span className={`text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${CATEGORY_BADGE[category]}`}>
          {category}
        </span>
      )}
      {isHighSignal && (
        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded tracking-widest uppercase">
          <Zap className="w-2.5 h-2.5" /> Signal
        </span>
      )}
    </span>
  );
}

const UPDATE_TYPE_UI: Record<string, { label: string; color: string; icon: string }> = {
  decision: { label: 'Decision', color: 'bg-primary-400/10 text-primary-500 border-primary-400/30', icon: '⚡' },
  scrap: { label: 'Scrap', color: 'bg-rose-50 text-rose-600 border-rose-200', icon: '🗑' },
  pivot: { label: 'Pivot', color: 'bg-orange-50 text-orange-600 border-orange-200', icon: '🔄' },
  blocker: { label: 'Blocker', color: 'bg-red-50 text-red-600 border-red-200', icon: '🚧' },
  insight: { label: 'Insight', color: 'bg-amber-50 text-amber-600 border-amber-200', icon: '💡' },
  open_question: { label: 'Open question', color: 'bg-blue-50 text-blue-600 border-blue-200', icon: '❓' },
  shipped: { label: 'Shipped', color: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: '🚀' }
};

interface RoomFeedProps {
  room: Room;
  user: { id: string } | null;
  isBuilder: boolean;
  reactionsByUpdate: Record<string, Reaction[]>;
  expandedUpdates: Record<string, boolean>;
  setExpandedUpdates: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setReactionModal: (state: { open: boolean; updateId: string | null }) => void;
  deletingUpdateId: string | null;
  handleDeleteUpdate: (updateId: string) => void;
  setNewUpdate: (content: string) => void;
  updateTextAreaRef: React.RefObject<HTMLTextAreaElement | null>;
  REACTION_CONFIG: ReactionConfig;
  typingUsers?: PresenceUser[];
}

export function RoomFeed({
  room,
  user,
  isBuilder,
  reactionsByUpdate,
  expandedUpdates,
  setExpandedUpdates,
  setReactionModal,
  deletingUpdateId,
  handleDeleteUpdate,
  setNewUpdate,
  updateTextAreaRef,
  REACTION_CONFIG,
  typingUsers = []
}: RoomFeedProps) {
  const [searchParams] = useSearchParams();
  const updateIdToScroll = searchParams.get('updateId');

  if (!room.updates || room.updates.length === 0) {
    return (
      <div className="text-center py-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[24px]">
        <Hammer className="w-12 h-12 mx-auto mb-4 opacity-30 text-primary-400" />
        <p className="font-extrabold text-[16px] text-slate-900 font-display mb-2">No updates yet</p>
        {isBuilder && (
          <>
            <p className="text-[14px] text-slate-600 font-medium mb-4 max-w-sm mx-auto">
              Post a manual update or link an integration. GitHub is currently available, with Figma, Jira, and more coming soon.
            </p>
            {Date.now() - new Date(room.createdAt).getTime() > 5 * 24 * 60 * 60 * 1000 && (
              <div className="inline-flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-2 rounded-full text-[13px] font-bold">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                It's been 5 days! Observers are waiting for your first update.
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const sortedUpdates = [...(room.updates || [])].sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return sortOrder === 'desc' ? bTime - aTime : aTime - bTime;
  });

  const initialTopMostItemIndex = updateIdToScroll
    ? Math.max(0, sortedUpdates.findIndex((u: any) => u.id === updateIdToScroll))
    : 0;

  return (
    <>
      <div className="flex justify-end mb-4">
        <div className="flex bg-white border border-slate-200 rounded-full p-1 shadow-sm shrink-0">
          <button
            onClick={() => setSortOrder('desc')}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              sortOrder === 'desc' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Latest
          </button>
          <button
            onClick={() => setSortOrder('asc')}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              sortOrder === 'asc' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Oldest
          </button>
        </div>
      </div>
      {typingUsers.length > 0 && (
        <div className="flex items-center gap-2 mb-6 ml-6 md:ml-0 md:justify-center animate-in fade-in slide-in-from-top-2">
          <div className="flex -space-x-2">
            {typingUsers.map(u => (
              <UserAvatar key={u.id} userId={u.id} name={u.name} avatarUrl={u.avatar_url} className="w-6 h-6 rounded-full border-2 border-slate-50 relative z-10 object-cover" />
            ))}
          </div>
          <div className="bg-slate-100 rounded-full px-4 py-1.5 flex items-center gap-2">
            <div className="flex space-x-1">
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
            </div>
            <span className="text-[11px] font-bold text-slate-500">
              {typingUsers.length === 1 ? `${typingUsers[0].name.split(' ')[0]} is typing...` : `${typingUsers.length} people are typing...`}
            </span>
          </div>
        </div>
      )}
      <Virtuoso
        useWindowScroll
        initialTopMostItemIndex={initialTopMostItemIndex}
        data={sortedUpdates}
        itemContent={(index, update) => {
          if (update.updateType === 'crossroad' || update.update_type === 'crossroad') {
            return <CrossroadCard key={update.id} update={update} />;
          }

          const updateReactions = reactionsByUpdate[update.id] || [];
          const isFigmaUrl = update.content.includes("figma.com/");
          const isTarget = update.id === updateIdToScroll;

          return (
            <div key={update.id} id={`update-${update.id}`} className={`w-full max-w-full bg-white border rounded-[24px] p-6 md:p-8 relative overflow-hidden group focus-ring mb-6 transition-all duration-700 ${isTarget ? 'border-primary-400 shadow-[0_0_30px_rgba(139,124,248,0.15)] ring-1 ring-primary-400' : 'border-slate-200 shadow-sm'}`} tabIndex={0}>
              {isTarget && (
                <div className="absolute inset-0 bg-primary-400/5 pointer-events-none animate-pulse" />
              )}
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="flex items-start justify-between gap-4 mb-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl border border-slate-200 shadow-sm overflow-hidden shrink-0">
                    <UserAvatar userId={update.authorId} name={update.authorName} avatarUrl={update.authorId === room.builderId ? (room.builderAvatarUrl || undefined) : undefined} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="text-[15px] font-extrabold text-slate-900 font-display flex items-center gap-1.5">
                      {update.authorName}
                      <VerifiedTick isVerified={!!room.builderIsVerifiedExpert} className="w-4 h-4" />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="text-[11px] text-slate-500 font-mono font-medium tracking-wide">{timeAgo(update.createdAt)}</div>
                      {update.updateType && update.updateType !== 'general' && UPDATE_TYPE_UI[update.updateType] && (
                        <>
                          <span className="text-slate-300">•</span>
                          <div className={`px-2 py-0.5 rounded text-[10px] font-bold border ${UPDATE_TYPE_UI[update.updateType].color} flex items-center gap-1`}>
                            <span>{UPDATE_TYPE_UI[update.updateType].icon}</span>
                            {UPDATE_TYPE_UI[update.updateType].label}
                          </div>
                        </>
                      )}
                      {update.authorId === user?.id && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              disabled={deletingUpdateId === update.id}
                              className="text-slate-500 hover:text-rose-400 transition-colors p-2.5 sm:p-2 -m-2 sm:-m-1 rounded-lg hover:bg-rose-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 flex items-center justify-center min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0"
                              title="Delete update"
                            >
                              {deletingUpdateId === update.id ? (
                                <span className="w-3 h-3 border-2 border-rose-400/30 border-t-rose-400 rounded-full animate-spin block" />
                              ) : (
                                <Trash2 className="w-3 h-3" />
                              )}
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#0E0C16] border border-white/[0.08] shadow-[0_20px_40px_rgba(0,0,0,0.8)] sm:rounded-[24px]"
                          >
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-[20px] font-display font-extrabold text-white">Delete this update?</AlertDialogTitle>
                              <AlertDialogDescription className="text-slate-400 text-[14px] font-medium leading-relaxed mt-2">
                                This action cannot be undone. This will permanently remove your update from the timeline.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="mt-6 border-t border-white/[0.05] pt-4">
                              <AlertDialogCancel className="bg-white/5 hover:bg-white/10 text-white border-0 font-semibold transition-all">Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteUpdate(update.id);
                                }}
                                className="bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/20 font-bold transition-all"
                              >
                                Delete Update
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                </div>
                {!isBuilder && room.status === 'active' && (
                  <button
                    onClick={() => setReactionModal({ open: true, updateId: update.id })}
                    className="text-[11px] text-slate-500 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-full px-4 py-2 hover:bg-slate-50 transition-all font-bold uppercase tracking-widest focus-ring"
                  >
                    React
                  </button>
                )}
              </div>

              {isFigmaUrl ? (
                <FigmaEmbed content={update.content} />
              ) : (
                <ReadMoreText
                  content={update.content}
                  className="text-[15px] text-slate-700 leading-relaxed whitespace-pre-wrap break-words font-medium border-l-[3px] border-primary-400/40 pl-4 sm:pl-5 mb-4 relative z-10"
                />
              )}

              {/* Smart Artifact Parsing */}
              {(() => {
                const urlRegex = /(https?:\/\/(?:www\.)?(?:github\.com|linear\.app)[^\s]+)/gi;
                const urls = update.content.match(urlRegex) || [];
                const uniqueUrls = Array.from(new Set(urls));
                return uniqueUrls.map((url, i) => (
                  <div key={i} className="mb-4 relative z-10">
                    <SmartArtifactCard url={url} />
                  </div>
                ));
              })()}

                {update.mediaUrl && (
                  <div className="mb-6 w-full max-w-full relative z-10 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm">
                    <SmartImage src={update.mediaUrl} aspectRatio="video" objectFit="cover" alt="Update media" />
                  </div>
                )}

              {update.codeSnippet && <CodeSnippetBlock code={update.codeSnippet} />}

              {updateReactions.length > 0 && (() => {
                const reactionCounts = updateReactions.reduce((acc: Record<string, number>, r: Reaction) => {
                  acc[r.type] = (acc[r.type] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>);

                const textReactions = updateReactions.filter((r: Reaction) => r.text && r.text.trim().length > 0 && r.text !== r.type);
                const isExpanded = expandedUpdates[update.id];
                const visibleReactions = isExpanded ? textReactions : textReactions.slice(0, 3);
                const hiddenCount = textReactions.length - visibleReactions.length;

                return (
                  <div className="mt-6 space-y-4 relative z-10">
                    {/* Aggregate Pills */}
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(reactionCounts).map(([type, count]) => {
                        const cfg = REACTION_CONFIG[type] || REACTION_CONFIG['reply'];
                        return (
                          <div key={type} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold ${cfg.color} border shadow-sm`}>
                            <span>{cfg.emoji}</span>
                            <span>{count as number}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Text Reactions */}
                    {visibleReactions.length > 0 && (
                      <div className="pt-4 border-t border-white/[0.06] space-y-3">
                        {visibleReactions.map((r: Reaction) => {
                          const cfg = REACTION_CONFIG[r.type] || REACTION_CONFIG['reply'];
                          const hasText = r.text && r.text.trim().length > 0;
                          const analysis = hasText ? analyzeFeedbackSignal(r.text as string, false) : { category: 'Uncategorized', signalScore: 0 } as any;
                          const isHighSignal = analysis.signalScore >= 70;

                          return (
                            <div key={r.id} className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${isHighSignal
                                ? 'bg-amber-50/50 border-amber-200 shadow-sm'
                                : 'bg-slate-50 border-slate-200'
                              }`}>
                              <div className="text-xl mt-0.5">{cfg.emoji}</div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                  <span className={`text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded ${cfg.badge}`}>{cfg.label}</span>
                                  {hasText && (
                                    <FeedbackBadge text={r.text as string} isExpert={false} preCalculated={analysis} />
                                  )}
                                  <span className="text-[11px] font-bold text-slate-900 flex items-center gap-1">
                                    {r.observerName}
                                    <VerifiedTick userId={r.observerId} className="w-3 h-3" />
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-mono font-medium">{timeAgo(r.createdAt)}</span>
                                  {isBuilder && r.type === 'tellmemore' && (
                                    <button
                                      onClick={() => {
                                        setNewUpdate(`> Replying to Tell Me More from @${r.observerName}:\n\n`);
                                        updateTextAreaRef.current?.focus();
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                      }}
                                      className="text-[10px] font-bold text-primary-400 hover:text-slate-900 ml-2 underline decoration-primary-400/30 underline-offset-2 transition-colors"
                                    >
                                      Draft Follow-up
                                    </button>
                                  )}
                                </div>
                                <p className="text-[13px] text-slate-700 leading-relaxed font-medium break-words">{r.text}</p>
                              </div>
                            </div>
                          );
                        })}

                        {hiddenCount > 0 && (
                          <button
                            onClick={() => setExpandedUpdates((prev: Record<string, boolean>) => ({ ...prev, [update.id]: true }))}
                            className="text-[12px] font-bold text-primary-400 hover:text-slate-900 transition-colors"
                          >
                            View {hiddenCount} more {hiddenCount === 1 ? 'reply' : 'replies'}...
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          );
        }}
      />
    </>
  );
}
