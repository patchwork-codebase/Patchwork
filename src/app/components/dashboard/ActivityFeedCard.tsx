import React from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { timeAgo } from "../../utils/helpers";
import { UserAvatar } from "../ui/UserAvatar";
import { ReadMoreText } from "../ui/ReadMoreText";
import { FigmaEmbed } from "../ui/FigmaEmbed";
import { SmartImage } from "../ui/SmartImage";
import { CodeSnippetBlock } from "../ui/CodeSnippetBlock";
import { VerifiedTick } from "../ui/VerifiedTick";
import { OrganizationBadge } from "../ui/OrganizationBadge";
import type { FeedUpdate } from "../../hooks/useFeedUpdates";
import type { Room } from "../../types";

interface ActivityFeedCardProps {
  activity: FeedUpdate; // This is the 'reply' mapped as an activity
  rooms?: Room[];
}

export const ActivityFeedCard = React.memo(function ActivityFeedCard({
  activity,
  rooms,
}: ActivityFeedCardProps) {
  const navigate = useNavigate();
  const parent = activity.parentUpdate;
  if (!parent) return null;

  const parentRoomTitle = rooms?.find(r => r.id === parent.roomId)?.title || parent.rooms?.title || 'Unknown Room';

  return (
    <div
      className="w-full max-w-full bg-white/60 backdrop-blur-md border border-white/40 shadow-sm rounded-[28px] mb-4 p-4 sm:p-6 sm:px-8 hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-200/20 hover:bg-white transition-all duration-200 relative group focus-ring"
    >
      {/* 1. Context Header */}
      <div className="flex items-center gap-2 mb-4">
        <UserAvatar userId={activity.authorId} name={activity.authorName} avatarUrl={activity.authorAvatar} className="w-6 h-6 rounded-full ring-1 ring-slate-200 object-cover" />
        <span className="text-[13px] text-slate-500 font-medium">
          <strong className="text-slate-800 cursor-pointer hover:underline" onClick={() => navigate(`/dashboard/profile/${activity.authorId}`)}>
            {activity.authorName}
          </strong> commented
        </span>
      </div>

      {/* Trail Line */}
      <div className="absolute top-[48px] bottom-[36px] left-[26px] sm:left-[42px] w-0.5 bg-slate-200/80 z-0 hidden sm:block" />

      {/* 2. Highlighted Post (Inner Card) */}
      <div 
        onClick={() => navigate(`/dashboard/room/${parent.roomId}`)}
        className="ml-0 sm:ml-10 bg-slate-50/80 border border-slate-200/60 rounded-[20px] p-4 mb-4 hover:border-primary-200 hover:bg-white transition-colors cursor-pointer relative z-10"
      >
        <div className="flex items-start gap-3 mb-2">
          <UserAvatar userId={parent.authorId} name={parent.authorName} avatarUrl={parent.authorAvatar} className="w-8 h-8 rounded-full ring-1 ring-slate-200 shrink-0 object-cover" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-[14px] text-slate-900 truncate hover:underline" onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/profile/${parent.authorId}`); }}>
                {parent.authorName}
              </span>
              {!parent?.authorOrgName && <VerifiedTick isVerified={!!parent?.authorIsVerifiedExpert} className="w-3 h-3 shrink-0" />}
              {parent?.authorOrgName && (
                <OrganizationBadge 
                orgName={parent.authorOrgName} 
                orgLogo={parent.authorOrgLogo} 
                isVerified={!!parent.authorIsVerifiedExpert} 
                />
              )}
              <span className="text-slate-400 text-[13px] mx-1">·</span>
              <span className="text-[13px] text-slate-500 hover:underline truncate">{parentRoomTitle}</span>
              <span className="text-[12px] text-slate-400 ml-auto whitespace-nowrap">{timeAgo(parent.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="pl-11 mt-1 text-[14px]">
          {parent.content && (
            parent.content.includes("figma.com/") ? (
              <div className="my-2 rounded-[16px] overflow-hidden border border-slate-200/60 shadow-sm relative pointer-events-none">
                 <FigmaEmbed content={parent.content} />
              </div>
            ) : (
              <ReadMoreText content={parent.content} className="text-slate-700 leading-relaxed whitespace-pre-wrap break-words" />
            )
          )}
          
          {parent.mediaUrl && (
            <div className="mt-3 rounded-[16px] overflow-hidden border border-slate-200/60 pointer-events-none">
              <SmartImage src={parent.mediaUrl} aspectRatio="video" objectFit="cover" alt="Update media" />
            </div>
          )}
          
          {parent.codeSnippet && (
            <div className="mt-3 rounded-[16px] overflow-hidden border border-slate-200/60 pointer-events-none">
               <CodeSnippetBlock code={parent.codeSnippet} />
            </div>
          )}
        </div>
      </div>

      {/* 3. The Comment */}
      <div className="ml-0 sm:ml-[2.1rem] flex gap-3 relative z-10">
        <UserAvatar userId={activity.authorId} name={activity.authorName} avatarUrl={activity.authorAvatar} className="w-8 h-8 rounded-full ring-2 ring-white hidden sm:block shrink-0 object-cover" />
        <div className="flex-1 bg-white border border-slate-200/60 rounded-[18px] p-3 px-4 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-bold text-[13px] text-slate-900">{activity.authorName}</span>
            <span className="text-[11px] text-slate-400">{timeAgo(activity.createdAt)}</span>
          </div>
          <p className="text-[14px] text-slate-700 leading-relaxed whitespace-pre-wrap">{activity.content}</p>
        </div>
      </div>

    </div>
  );
});
