import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Link2, MoreHorizontal, Trash2 } from "lucide-react";
import { timeAgo } from "../../utils/helpers";
import { UserAvatar } from "../ui/UserAvatar";
import { ReadMoreText } from "../ui/ReadMoreText";
import { FigmaEmbed } from "../ui/FigmaEmbed";
import { SmartImage } from "../ui/SmartImage";
import { CodeSnippetBlock } from "../ui/CodeSnippetBlock";
import type { FeedUpdate, Room, Profile } from "../../types";
import { QueryClient } from "@tanstack/react-query";
import { ReactionGroup } from "./ReactionGroup";
import { ReplyComposer } from "./ReplyComposer";
import { supabase } from "../auth/AuthContext";
import { toast } from "sonner";
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

interface ActivityFeedCardProps {
  activity: FeedUpdate;
  rooms: Room[];
  user: { id: string } | null;
  profile: Profile | null;
  queryClient: QueryClient;
}

export const ActivityFeedCard = React.memo(function ActivityFeedCard({
  activity,
  rooms,
  user,
  profile,
  queryClient,
}: ActivityFeedCardProps) {
  const navigate = useNavigate();
  const parent = activity.parentUpdate;
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string, type: 'update' | 'reaction' } | null>(null);

  const handleCopyLink = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/dashboard/update/${id}`);
    toast.success("Link copied to clipboard!");
    setOpenDropdownId(null);
  };

  const handleDeleteUpdate = async (id: string, type: 'update' | 'reaction') => {
    setIsDeleting(id);
    try {
      const table = type === 'update' ? 'updates' : 'reactions';
      const authorCol = type === 'update' ? 'author_id' : 'observer_id';
      const { error } = await supabase.from(table).delete().eq('id', id).eq(authorCol, user!.id);
      if (error) throw error;
      toast.success("Deleted successfully");
      queryClient.invalidateQueries({ queryKey: ['feed-updates-v2'] });
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)) || "Failed to delete");
    } finally {
      setIsDeleting(null);
      setDeleteTarget(null);
    }
  };

  if (!parent) return null;

  return (
    <div className="w-full max-w-full bg-white dark:bg-[#0a0a0a] border border-slate-100 dark:border-white/5 shadow-2xl rounded-[24px] mb-6 p-4 sm:p-6 sm:px-8 relative group hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] hover:border-slate-100 dark:border-white/10 hover:bg-[#111] transition-all duration-300 focus-ring overflow-hidden">
      
      {/* Subtle background glow on hover */}
      <div className="absolute -inset-24 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-500 pointer-events-none" />

      {/* 1. Context Header */}
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 relative z-10">
        <div className="relative shrink-0">
          <UserAvatar userId={activity.authorId} name={activity.authorName} avatarUrl={activity.authorAvatar} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover" />
        </div>
        <span className="text-[14px] sm:text-[15px] text-slate-500 dark:text-slate-400 font-medium leading-snug">
          <strong className="text-slate-900 dark:text-white font-bold cursor-pointer hover:underline font-display" onClick={() => navigate(`/dashboard/profile/${activity.authorId}`)}>
            {activity.authorName}
          </strong> commented <span className="text-[12px] sm:text-[13px] ml-1">{timeAgo(activity.createdAt)}</span>
        </span>
      </div>

      {/* Main Thread Container */}
      <div className="relative ml-4 sm:ml-5">
        {/* Main Vertical Trail Line */}
        <div className="absolute top-[-25px] sm:top-[-30px] bottom-8 left-[0px] w-0.5 bg-primary-500/20 z-0" />

        {/* 2. Highlighted Post (Parent - Purple Card) */}
        <div className="relative mb-3 sm:mb-4">
          <div className="absolute left-[0px] top-[-10px] w-[16px] sm:w-[24px] h-[30px] border-l-2 border-b-2 border-primary-500/20 rounded-bl-xl z-0" />

          <div
            onClick={() => navigate(`/dashboard/room/${parent.roomId}`)}
            className="ml-4 sm:ml-6 bg-primary-500/5 border border-primary-500/20 rounded-[20px] p-4 sm:p-5 hover:shadow-md transition-shadow cursor-pointer relative z-10"
          >
            <div className="flex items-start justify-between gap-2 sm:gap-3 mb-3">
              <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                <div className="relative shrink-0">
                  <UserAvatar userId={parent.authorId} name={parent.authorName} avatarUrl={parent.authorAvatar} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover" />
                  <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-primary-500 border-2 border-primary-900 rounded-full"></div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-0 sm:gap-1.5 flex-1 min-w-0">
                  <div className="flex items-center flex-wrap shrink min-w-0">
                    <span className="font-bold text-[13px] sm:text-[14px] text-slate-900 dark:text-white truncate hover:underline" onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/profile/${parent.authorId}`); }}>
                      {parent.authorName}
                    </span>
                    <span className="text-slate-600 text-[13px] mx-1 hidden sm:inline">·</span>
                    <span className="text-[12px] sm:text-[13px] text-slate-500 dark:text-slate-400 truncate mt-0.5 sm:mt-0"><span className="sm:hidden mr-1">·</span>Patchwork</span>
                  </div>
                </div>
              </div>
              <div className="flex items-start sm:items-center gap-1.5 sm:gap-3 shrink-0 text-right">
                <span className="text-[12px] sm:text-[13px] text-slate-500 dark:text-slate-400 max-w-[40px] sm:max-w-none text-right leading-tight mt-0.5 sm:mt-0">{timeAgo(parent.createdAt)}</span>
                <div className="relative">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setOpenDropdownId(openDropdownId === parent.id ? null : parent.id); }}
                    disabled={isDeleting === parent.id}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary-500/10 text-primary-400 flex items-center justify-center hover:bg-primary-500/20 transition-colors shrink-0"
                  >
                    {isDeleting === parent.id ? <span className="w-4 h-4 border-2 border-primary-400/30 border-t-primary-400 rounded-full animate-spin block" /> : <MoreHorizontal className="w-4 h-4" />}
                  </button>
                  {openDropdownId === parent.id && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpenDropdownId(null); }} />
                      <div className="absolute right-0 top-full mt-1 bg-slate-50 dark:bg-[#1a1a1a] border border-slate-100 dark:border-white/10 rounded-xl shadow-lg z-50 py-1 min-w-[140px] flex flex-col items-stretch text-left text-slate-900 dark:text-white">
                        <button onClick={(e) => handleCopyLink(e, parent.id)} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-white/5 text-left flex items-center gap-2"><Link2 className="w-4 h-4" /> Copy Link</button>
                        {user?.id === parent.authorId && (
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setDeleteTarget({ id: parent.id, type: 'update' }); 
                              setOpenDropdownId(null); 
                            }} 
                            className="px-4 py-2 text-sm text-rose-600 hover:bg-rose-500/10 text-left flex items-center gap-2 w-full"
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="pl-0 sm:pl-[52px] text-[14px] sm:text-[15px] mb-3 sm:mb-4">
              {parent.content && (
                parent.content.includes("figma.com/") ? (
                  <div className="my-2 rounded-[16px] overflow-hidden border border-slate-100 dark:border-white/10 shadow-sm relative pointer-events-none">
                    <FigmaEmbed content={parent.content} />
                  </div>
                ) : (
                  <ReadMoreText content={parent.content} className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap break-words" />
                )
              )}
              {parent.mediaUrl && (
                <div className="mt-3 rounded-[16px] overflow-hidden border border-slate-100 dark:border-white/10 pointer-events-none">
                  <SmartImage src={parent.mediaUrl} aspectRatio="video" objectFit="cover" alt="Update media" />
                </div>
              )}
              {parent.codeSnippet && (
                <div className="mt-3 rounded-[16px] overflow-hidden border border-slate-100 dark:border-white/10 pointer-events-none">
                  <CodeSnippetBlock code={parent.codeSnippet} />
                </div>
              )}
            </div>

            <ReactionGroup 
              targetUpdate={parent}
              onReplyClick={() => setReplyingToId(replyingToId === parent.id ? null : parent.id)}
            />

            {replyingToId === parent.id && queryClient && (
              <div className="mt-4">
                <ReplyComposer
                  update={parent}
                  user={user || null}
                  profile={profile || null}
                  queryClient={queryClient}
                  onCancel={() => setReplyingToId(null)}
                  onSuccess={() => setReplyingToId(null)}
                  onSubmit={async (text) => {
                    const newReply = {
                      id: `${parent.roomId}-reply-${parent.id}-${user!.id}-${Date.now()}`,
                      room_id: parent.roomId,
                      update_id: parent.id,
                      observer_id: user!.id,
                      observer_name: profile?.name || user!.email?.split('@')[0] || 'Observer',
                      type: 'reply',
                      text: text,
                      created_at: new Date().toISOString(),
                    };
                    const { error } = await supabase.from('reactions').insert(newReply);
                    if (error) throw error;
                    queryClient.invalidateQueries({ queryKey: ['feed-updates-v2'] });
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* 3. The Comment (Activity - Green Card) */}
        <div className="relative mb-4 sm:mb-6">
          <div className="absolute left-[0px] top-[-10px] w-[16px] sm:w-[24px] h-[30px] border-l-2 border-b-2 border-primary-500/20 rounded-bl-xl z-0" />

          <div className="ml-4 sm:ml-6 bg-emerald-500/5 border border-emerald-500/20 rounded-[20px] p-4 sm:p-5 hover:shadow-md transition-shadow relative z-10">
            <div className="flex items-start justify-between gap-2 sm:gap-3 mb-3">
              <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                <div className="relative shrink-0">
                  <UserAvatar userId={activity.authorId} name={activity.authorName} avatarUrl={activity.authorAvatar} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover" />
                  <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-500 border-2 border-emerald-900 rounded-full"></div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-0 sm:gap-1.5 flex-1 min-w-0">
                  <div className="flex items-center flex-wrap shrink min-w-0">
                    <span className="font-bold text-[13px] sm:text-[14px] text-slate-900 dark:text-white truncate hover:underline" onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/profile/${activity.authorId}`); }}>
                      {activity.authorName}
                    </span>
                    <span className="text-slate-600 text-[13px] mx-1 hidden sm:inline">·</span>
                    <span className="text-[12px] sm:text-[13px] text-slate-500 dark:text-slate-400 truncate mt-0.5 sm:mt-0"><span className="sm:hidden mr-1">·</span>Patchwork</span>
                  </div>
                </div>
              </div>
              <div className="flex items-start sm:items-center gap-1.5 sm:gap-3 shrink-0 text-right">
                <span className="text-[12px] sm:text-[13px] text-slate-500 dark:text-slate-400 max-w-[40px] sm:max-w-none text-right leading-tight mt-0.5 sm:mt-0">{timeAgo(activity.createdAt)}</span>
                <div className="relative">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setOpenDropdownId(openDropdownId === activity.id ? null : activity.id); }}
                    disabled={isDeleting === activity.id}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/20 transition-colors shrink-0"
                  >
                    {isDeleting === activity.id ? <span className="w-4 h-4 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin block" /> : <MoreHorizontal className="w-4 h-4" />}
                  </button>
                  {openDropdownId === activity.id && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpenDropdownId(null); }} />
                      <div className="absolute right-0 top-full mt-1 bg-slate-50 dark:bg-[#1a1a1a] border border-slate-100 dark:border-white/10 rounded-xl shadow-lg z-50 py-1 min-w-[140px] flex flex-col items-stretch text-left text-slate-900 dark:text-white">
                        <button onClick={(e) => handleCopyLink(e, activity.id)} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-white/5 text-left flex items-center gap-2"><Link2 className="w-4 h-4" /> Copy Link</button>
                        {user?.id === activity.authorId && (
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setDeleteTarget({ id: activity.id, type: 'reaction' }); 
                              setOpenDropdownId(null); 
                            }} 
                            className="px-4 py-2 text-sm text-rose-600 hover:bg-rose-500/10 text-left flex items-center gap-2 w-full"
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="pl-0 sm:pl-[52px] text-[14px] sm:text-[15px] mb-3 sm:mb-4 text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {activity.content.split(/(@\w+)/g).map((part, i) =>
                part.startsWith('@') ? <span key={i} className="text-primary-400 font-medium">{part}</span> : part
              )}
            </div>

            <ReactionGroup 
              targetUpdate={activity}
              onReplyClick={() => setReplyingToId(replyingToId === activity.id ? null : activity.id)}
            />

            {replyingToId === activity.id && queryClient && (
              <div className="mt-4">
                <ReplyComposer
                  update={activity}
                  user={user || null}
                  profile={profile || null}
                  queryClient={queryClient}
                  onCancel={() => setReplyingToId(null)}
                  onSuccess={() => setReplyingToId(null)}
                  onSubmit={async (text) => {
                    const newReply = {
                      id: `${activity.roomId}-reply-${activity.id}-${user!.id}-${Date.now()}`,
                      room_id: activity.roomId,
                      update_id: activity.id,
                      observer_id: user!.id,
                      observer_name: profile?.name || user!.email?.split('@')[0] || 'Observer',
                      type: 'reply',
                      text: text,
                      created_at: new Date().toISOString(),
                    };
                    const { error } = await supabase.from('reactions').insert(newReply);
                    if (error) throw error;
                    queryClient.invalidateQueries({ queryKey: ['feed-updates-v2'] });
                  }}
                  initialText={`@${activity.authorName.toLowerCase().replace(/\s+/g, '')} `}
                />
              </div>
            )}
          </div>
        </div>

        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
          <AlertDialogContent onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#111111] border border-slate-100 dark:border-white/10 sm:rounded-[24px] text-slate-900 dark:text-white shadow-sm dark:shadow-none">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-[20px] font-display font-bold">Delete {deleteTarget?.type === 'update' ? 'update' : 'reply'}?</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-500 dark:text-slate-400">This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={(e) => { e.stopPropagation(); if (deleteTarget) handleDeleteUpdate(deleteTarget.id, deleteTarget.type); }} className="bg-rose-500 text-white hover:bg-rose-600">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </div>
  );
});
