import React, { useState, useEffect } from 'react';
import { useRoadmapItems, RoadmapItem } from '../../hooks/useRoadmap';
import { Loader2, Calendar, MessageSquare, Flag, Clock } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { RoadmapItemModal } from './RoadmapItemModal';
import { UserAvatar } from '../ui/UserAvatar';
import { format } from 'date-fns';

function RoadmapItemCard({ item, onClick }: { item: RoadmapItem; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="bg-[#151A27] p-4 rounded-2xl border border-slate-800 shadow-sm flex flex-col gap-3 relative group hover:border-primary-500/50 hover:shadow-lg transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <h4 className="font-bold text-white text-[14px] leading-tight pr-6">{item.title}</h4>
      </div>
      {item.description && (
        <p className="text-[12px] text-slate-400 line-clamp-2">{item.description}</p>
      )}
      <div className="flex flex-wrap gap-1.5 mt-1">
        {item.labels?.map(label => (
          <span key={label} className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300">
            {label}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800">
        <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500">
          {item.sprint_id ? (
             <span className="flex items-center gap-1 text-primary-400 bg-primary-400/10 px-2 py-0.5 rounded-full">
               <Calendar className="w-3 h-3" /> Sprint
             </span>
          ) : null}
          
          {item.due_date && (
            <span className="flex items-center gap-1" title="Due Date">
              <Clock className="w-3 h-3" /> {format(new Date(item.due_date), 'MMM d')}
            </span>
          )}

          {item.priority && (
            <span className={`flex items-center gap-1 ${item.priority === 'urgent' ? 'text-rose-500' : item.priority === 'high' ? 'text-orange-500' : ''}`} title={`Priority: ${item.priority}`}>
              <Flag className="w-3 h-3" />
            </span>
          )}

          {item.roadmap_comments && item.roadmap_comments[0]?.count > 0 && (
            <span className="flex items-center gap-1" title="Comments">
              <MessageSquare className="w-3 h-3" /> {item.roadmap_comments[0].count}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {item.roadmap_assignees && item.roadmap_assignees.length > 0 && (
            <div className="flex -space-x-1.5 overflow-hidden mr-1">
              {item.roadmap_assignees.map(a => (
                <div key={a.user_id} className="relative inline-block rounded-full ring-1 ring-[#1C212E]">
                  <UserAvatar userId={a.user_id} avatarUrl={a.users.avatar} name={a.users.name} className="w-5 h-5 rounded-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function PublicRoadmap({ builderId }: { builderId: string }) {
  const { data: items, isLoading } = useRoadmapItems(builderId);
  
  const [columns, setColumns] = useState<{ [key: string]: RoadmapItem[] }>({
    now: [],
    next: [],
    later: [],
    completed: []
  });
  
  const [selectedItem, setSelectedItem] = useState<RoadmapItem | null>(null);

  useEffect(() => {
    if (items) {
      setColumns({
        now: items.filter(i => i.status === 'now').sort((a, b) => a.position - b.position),
        next: items.filter(i => i.status === 'next').sort((a, b) => a.position - b.position),
        later: items.filter(i => i.status === 'later').sort((a, b) => a.position - b.position),
        completed: items.filter(i => i.status === 'completed').sort((a, b) => a.position - b.position)
      });
    }
  }, [items]);

  if (isLoading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 text-primary-500 animate-spin" /></div>;
  }

  const columnConfig = [
    { 
      id: 'now', 
      title: 'Now', 
      accent: 'bg-emerald-500 shadow-emerald-500/40',
      text: 'text-emerald-400',
      badge: 'bg-emerald-500/20 text-emerald-400',
      columnBg: 'bg-slate-800/20 border border-slate-800/50'
    },
    { 
      id: 'next', 
      title: 'Next', 
      accent: 'bg-amber-500 shadow-amber-500/40',
      text: 'text-amber-400',
      badge: 'bg-amber-500/20 text-amber-400',
      columnBg: 'bg-slate-800/20 border border-slate-800/50'
    },
    { 
      id: 'later', 
      title: 'Later', 
      accent: 'bg-slate-400 shadow-slate-400/40',
      text: 'text-slate-400',
      badge: 'bg-slate-800 text-slate-400',
      columnBg: 'bg-slate-800/20 border border-slate-800/50'
    },
    { 
      id: 'completed', 
      title: 'Completed', 
      accent: 'bg-primary-500 shadow-primary-500/40',
      text: 'text-primary-400',
      badge: 'bg-primary-500/20 text-primary-400',
      columnBg: 'bg-slate-800/20 border border-slate-800/50'
    }
  ];

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex gap-6 h-full overflow-x-auto pb-4 custom-scrollbar items-start snap-x snap-mandatory scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0">
        {columnConfig.map((col) => (
          <div key={col.id} className="flex-shrink-0 w-[85vw] max-w-[340px] sm:w-[320px] flex flex-col max-h-full snap-center">
            
            <div className={`flex-1 flex flex-col gap-3 min-h-[150px] p-3 rounded-3xl ${col.columnBg}`}>
              <div className="flex items-center justify-between mb-2 px-2 pt-1">
                <div className="flex items-center gap-2.5">
                  <div className={`w-2 h-2 rounded-full ${col.accent} shadow-lg`} />
                  <span className={`font-extrabold text-[13px] uppercase tracking-wider ${col.text}`}>{col.title}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${col.badge}`}>{columns[col.id]?.length || 0}</span>
              </div>

              {columns[col.id].map((item) => (
                <RoadmapItemCard key={item.id} item={item} onClick={() => setSelectedItem(item)} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {selectedItem && (
          <RoadmapItemModal 
            item={items?.find(i => i.id === selectedItem.id) || selectedItem} 
            onClose={() => setSelectedItem(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
