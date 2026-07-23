import React from 'react';
import { useNavigate } from 'react-router';
import { timeAgo } from '../../utils/helpers';
import { UserAvatar } from '../ui/UserAvatar';
import { ReadMoreText } from '../ui/ReadMoreText';
import type { Reaction } from '../../types';

interface ThreadedReplyProps {
  reply: Reaction & { text?: string | null };
}

export const ThreadedReply = React.memo(function ThreadedReply({ reply }: ThreadedReplyProps) {
  const navigate = useNavigate();

  return (
    <div className="relative flex items-start gap-3 pt-3 mt-1 group">
      {/* Left visual connecting line */}
      <div className="absolute left-[15px] top-0 w-[2px] h-[30px] bg-slate-300 -z-10 group-last:h-[20px]" />
      <div className="absolute left-[15px] top-[20px] w-4 h-[2px] bg-slate-300 -z-10" />

      <div className="relative shrink-0 mt-1">
        <UserAvatar 
          userId={reply.observerId} 
          name={reply.observerName} 
          avatarUrl={reply.observerAvatar} 
          className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-sm bg-white" 
        />
      </div>

      <div className="flex-1 min-w-0 bg-slate-50 border border-slate-100 rounded-2xl p-3 hover:bg-slate-100 transition-colors">
        <div className="flex items-start justify-between gap-2 mb-1">
          <span 
            className="font-bold text-[13px] text-slate-900 cursor-pointer hover:text-primary-600 transition-colors truncate flex-1 min-w-0"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/dashboard/profile/${reply.observerId}`);
            }}
          >
            {reply.observerName}
          </span>
          <span className="text-[11px] text-slate-400 shrink-0 whitespace-nowrap mt-0.5">
            {timeAgo(reply.createdAt)}
          </span>
        </div>
        <ReadMoreText
          text={reply.text || ''}
          className="text-[14px] text-slate-700 leading-relaxed break-words font-medium"
        />
      </div>
    </div>
  );
});
