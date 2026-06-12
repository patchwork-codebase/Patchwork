import { useRef } from "react";
import { Virtuoso } from "react-virtuoso";
import { Hammer, MessageCircle, Trash2 } from "lucide-react";
import { timeAgo } from "../../utils/helpers";
import { CodeSnippetBlock } from '../ui/CodeSnippetBlock';
import { ReadMoreText } from "../ui/ReadMoreText";
import { FigmaEmbed } from "../ui/FigmaEmbed";
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
  REACTION_CONFIG
}: any) {
  if (room.updates.length === 0) {
    return (
      <div className="text-center py-20 bg-white/[0.01] border-2 border-dashed border-white/[0.06] rounded-[24px]">
        <Hammer className="w-12 h-12 mx-auto mb-4 opacity-30 text-[#8B7CF8]" />
        <p className="font-extrabold text-[16px] text-white font-display mb-2">No updates yet</p>
        {isBuilder && (
          <>
            <p className="text-[14px] text-slate-400 font-medium mb-4 max-w-sm mx-auto">
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

  const sortedUpdates = [...room.updates].reverse();

  return (
    <Virtuoso
      useWindowScroll
      data={sortedUpdates}
      itemContent={(index, update) => {
        const updateReactions = reactionsByUpdate[update.id] || [];
        const isFigmaUrl = update.content.includes("figma.com/");

        return (
          <div key={update.id} className="bg-white/[0.02] border border-white/[0.05] rounded-[24px] p-6 md:p-8 shadow-lg backdrop-blur-sm relative overflow-hidden group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8] mb-6" tabIndex={0}>
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="flex items-start justify-between gap-4 mb-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6C5CE7] to-[#8B7CF8] flex items-center justify-center text-white text-[15px] font-extrabold font-display shadow-inner">
                  {update.authorName[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="text-[15px] font-extrabold text-white font-display">{update.authorName}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="text-[11px] text-slate-500 font-mono font-medium tracking-wide">{timeAgo(update.createdAt)}</div>
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
                  className="text-[11px] text-slate-400 hover:text-white border border-white/[0.08] hover:border-white/20 rounded-full px-4 py-2 hover:bg-white/[0.05] transition-all font-bold uppercase tracking-widest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8]"
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
                className="text-[15px] text-slate-300 leading-relaxed whitespace-pre-wrap font-medium border-l-[3px] border-[#8B7CF8]/40 pl-4 sm:pl-5 mb-4 relative z-10" 
              />
            )}

            {update.mediaUrl && (
              <div className="mb-6 relative z-10 rounded-2xl overflow-hidden border border-white/[0.08] bg-[#0A0910] shadow-lg">
                <img src={update.mediaUrl} alt="Update media" className="w-full h-auto object-cover max-h-[400px] sm:max-h-[500px]" />
              </div>
            )}

            {update.codeSnippet && <CodeSnippetBlock code={update.codeSnippet} />}

            {updateReactions.length > 0 && (() => {
              const reactionCounts = updateReactions.reduce((acc: any, r: any) => {
                acc[r.type] = (acc[r.type] || 0) + 1;
                return acc;
              }, {} as Record<string, number>);
              
              const textReactions = updateReactions.filter((r: any) => r.text && r.text.trim().length > 0);
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
                      {visibleReactions.map((r: any) => {
                        const cfg = REACTION_CONFIG[r.type] || REACTION_CONFIG['reply'];
                        return (
                          <div key={r.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                            <div className="text-xl mt-0.5">{cfg.emoji}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className={`text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded ${cfg.badge}`}>{cfg.label}</span>
                                <span className="text-[11px] font-bold text-slate-300">{r.observerName}</span>
                                <span className="text-[10px] text-slate-500 font-mono font-medium">{timeAgo(r.createdAt)}</span>
                                {isBuilder && r.type === 'tellmemore' && (
                                  <button 
                                    onClick={() => {
                                      setNewUpdate(`> Replying to Tell Me More from @${r.observerName}:\n\n`);
                                      updateTextAreaRef.current?.focus();
                                      window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className="text-[10px] font-bold text-[#8B7CF8] hover:text-white ml-2 underline decoration-[#8B7CF8]/30 underline-offset-2 transition-colors"
                                  >
                                    Draft Follow-up
                                  </button>
                                )}
                              </div>
                              <p className="text-[13px] text-slate-300 leading-relaxed font-medium">{r.text}</p>
                            </div>
                          </div>
                        );
                      })}
                      
                      {hiddenCount > 0 && (
                        <button
                          onClick={() => setExpandedUpdates((prev: any) => ({ ...prev, [update.id]: true }))}
                          className="text-[12px] font-bold text-[#8B7CF8] hover:text-white transition-colors"
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
  );
}
