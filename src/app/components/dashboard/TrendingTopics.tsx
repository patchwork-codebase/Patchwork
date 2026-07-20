import React, { useMemo } from 'react';
import { Flame } from 'lucide-react';
import type { FeedUpdate } from '../../hooks/useFeedUpdates';
import type { Room } from '../../types';

interface TrendingTopicsProps {
  updates: FeedUpdate[];
  rooms: Room[];
}

export function TrendingTopics({ updates, rooms }: TrendingTopicsProps) {
  const trendingTags = useMemo(() => {
    const tagsMap = new Map<string, number>();
    
    // Process recent updates to find trending tags
    updates.forEach(u => {
      // Tags from the room associated with the update
      const fullRoom = rooms.find(r => r.id === u.roomId) || u.rooms;
      if (fullRoom?.tags && Array.isArray(fullRoom.tags)) {
        fullRoom.tags.forEach(tag => {
          if (!tag) return;
          const cleanTag = tag.trim().toLowerCase();
          tagsMap.set(cleanTag, (tagsMap.get(cleanTag) || 0) + 1);
        });
      }
      
      // Hashtags embedded directly in the content
      if (u.content) {
        const hashtags = u.content.match(/#[a-zA-Z0-9_]+/g);
        if (hashtags) {
          hashtags.forEach(tag => {
            const cleanTag = tag.substring(1).toLowerCase();
            tagsMap.set(cleanTag, (tagsMap.get(cleanTag) || 0) + 1);
          });
        }
      }
    });

    return Array.from(tagsMap.entries())
      .filter(([tag]) => tag.length > 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5) // Top 5 tags
      .map(([tag, count]) => ({ tag, count }));
  }, [updates, rooms]);

  if (trendingTags.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-[24px] shadow-sm p-6 overflow-hidden relative">
      <div className="flex items-center gap-2 mb-6 relative z-10">
        <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
          <Flame className="w-4 h-4" />
        </div>
        <h3 className="font-bold text-[15px] text-slate-900">Trending Topics</h3>
      </div>
      
      <div className="flex flex-col gap-4 relative z-10">
        {trendingTags.map(({ tag, count }, idx) => (
          <div key={tag} className="flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-[13px] font-bold text-slate-400 group-hover:text-primary-500 transition-colors w-4">{idx + 1}</span>
              <div className="flex flex-col min-w-0">
                <span className="text-[14px] font-bold text-slate-900 group-hover:text-primary-500 transition-colors truncate">
                  #{tag}
                </span>
                <span className="text-[11px] text-slate-500">{count} updates</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
