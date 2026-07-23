import React, { useState, useRef } from 'react';
import { MessageCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase, useAuth } from '../auth/AuthContext';
import type { FeedUpdate } from '../../hooks/useFeedUpdates';

interface ReactionGroupProps {
  targetUpdate: FeedUpdate;
  onReplyClick?: (e: React.MouseEvent) => void;
  showReplyButton?: boolean;
}

export function ReactionGroup({
  targetUpdate,
  onReplyClick,
  showReplyButton = true,
}: ReactionGroupProps) {
  const { user, profile, withVerification } = useAuth();
  const queryClient = useQueryClient();
  const [localOptimisticToggles, setLocalOptimisticToggles] = useState<Record<string, boolean>>({});
  const inFlightReactionsRef = useRef<Set<string>>(new Set());

  const handleToggleReaction = async (type: 'sharp' | 'pushback' | 'tellmemore') => {
    withVerification(async () => {
      if (!user) return;
      const key = `${targetUpdate.id}-${type}`;
      
      if (inFlightReactionsRef.current.has(key)) return;
      inFlightReactionsRef.current.add(key);
      
      const existing = (targetUpdate.reactions || []).find((r: any) => r.type === type && r.observerId === user.id);
      
      // Optimistic state toggle
      setLocalOptimisticToggles(prev => ({ ...prev, [key]: !existing }));

      try {
        if (existing) {
          const { error } = await supabase.from('reactions').delete().eq('id', existing.id);
          if (error) throw error;
          toast.success(`Removed ${type === 'tellmemore' ? 'More' : type} reaction`);
        } else {
          const payload = {
            id: `${targetUpdate.roomId}-reaction-${type}-${user.id}-${Date.now()}`,
            room_id: targetUpdate.roomId,
            update_id: targetUpdate.id,
            observer_id: user.id,
            observer_name: profile?.name || user.email?.split('@')[0] || 'Observer',
            type,
            text: type,
            created_at: new Date().toISOString(),
          };
          const { error } = await supabase.from('reactions').insert(payload);
          if (error) throw error;
          toast.success(`Added ${type === 'tellmemore' ? 'More' : type} reaction`);
        }
        await queryClient.invalidateQueries({ queryKey: ['feed-updates-v2'], exact: false });
        
        setLocalOptimisticToggles(prev => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      } catch (err: unknown) {
        setLocalOptimisticToggles(prev => ({ ...prev, [key]: !!existing }));
        toast.error(`Failed to update reaction: ${(err instanceof Error ? err.message : String(err))}`);
      } finally {
        inFlightReactionsRef.current.delete(key);
      }
    });
  };
  const reactions = targetUpdate.reactions || [];
  const replyCount = targetUpdate.replies?.length || 0;

  const reactionConfig = {
    sharp: { icon: '✦', activeColor: 'text-primary-500', activeBg: 'bg-primary-50' },
    pushback: { icon: '↩', activeColor: 'text-rose-500', activeBg: 'bg-rose-50' },
    tellmemore: { icon: '?', activeColor: 'text-emerald-600', activeBg: 'bg-emerald-50' },
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-2">
      {(['sharp', 'pushback', 'tellmemore'] as const).map((type) => {
        const config = reactionConfig[type];

        const key = `${targetUpdate.id}-${type}`;
        const hasOptimistic = localOptimisticToggles[key] !== undefined;
        const serverActive = reactions.some((r: any) => r.type === type && r.observerId === user?.id);
        const isActive = hasOptimistic ? localOptimisticToggles[key] : serverActive;
        let count = reactions.filter((r: any) => r.type === type).length;
        
        if (hasOptimistic) {
          if (localOptimisticToggles[key] && !serverActive) count += 1;
          else if (!localOptimisticToggles[key] && serverActive) count -= 1;
        }

        return (
          <button
            key={type}
            onClick={(e) => { 
              e.stopPropagation(); 
              handleToggleReaction(type); 
            }}
            className={`flex items-center transition-all duration-150 group pr-2.5 pl-1 py-1 rounded-full bg-white shadow-xs border active:scale-95 cursor-pointer ${
              isActive 
                ? 'border-primary-300 bg-primary-50/50 text-primary-700 shadow-primary-500/10' 
                : 'border-slate-200/80 hover:border-slate-300 text-slate-600 hover:bg-slate-50/60'
            }`}
          >
            <div className={`w-6.5 h-6.5 rounded-full flex items-center justify-center transition-colors shrink-0 ${
              isActive ? `${config.activeBg} ${config.activeColor}` : 'bg-slate-100/80 text-slate-500 group-hover:bg-slate-200/70 group-hover:text-slate-700'
            }`}>
               <span className="text-[12px] font-bold leading-none mb-[0.5px]">{config.icon}</span>
            </div>
            {count > 0 && <span className={`ml-1.5 text-[12px] font-bold ${isActive ? 'text-primary-700' : 'text-slate-600'}`}>{count}</span>}
          </button>
        );
      })}

      {showReplyButton && (
        <button 
          onClick={(e) => { e.stopPropagation(); onReplyClick?.(e); }}
          className="flex items-center transition-all duration-150 group pr-2.5 pl-1 py-1 rounded-full bg-white shadow-xs border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/60 active:scale-95 cursor-pointer ml-0.5"
        >
          <div className="w-6.5 h-6.5 rounded-full flex items-center justify-center transition-colors shrink-0 bg-slate-100/80 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600">
            <MessageCircle className="w-3.5 h-3.5" strokeWidth={2} />
          </div>
          {replyCount > 0 && <span className="ml-1.5 text-[12px] font-bold text-slate-600 group-hover:text-indigo-600">{replyCount}</span>}
        </button>
      )}
    </div>
  );
}