import { motion } from "motion/react";
import { useAuth } from "../auth/AuthContext";
import { useNotifications } from "../../hooks/useNotifications";
import { useEffect } from "react";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Notifications() {
  const { user } = useAuth();
  const { data: notificationsData, isLoading, markAllAsRead } = useNotifications(user?.id);
  
  const notifications = notificationsData || [];
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (unreadCount > 0) {
      markAllAsRead.mutate();
    }
  }, [unreadCount, markAllAsRead]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-[800px] mx-auto px-5 sm:px-6 py-8"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-bold text-2xl sm:text-[28px] text-white leading-tight tracking-tight m-0">
            Notifications
          </h1>
          <p className="text-slate-400 mt-1 text-[14px]">
            Stay updated on activity in your rooms
          </p>
        </div>
      </div>

      <div className="bg-[#0D0B14] border border-white/[0.08] rounded-[20px] overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
            <div className="w-6 h-6 rounded-full border-2 border-[#6C5CE7]/20 border-t-[#6C5CE7] animate-spin" />
            <span className="text-[14px]">Loading notifications...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <div className="w-16 h-16 rounded-full bg-white/[0.02] flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔔</span>
            </div>
            <h3 className="text-white font-bold text-[16px] mb-1">All caught up</h3>
            <p className="text-[13px]">You don't have any notifications yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {notifications.map(n => {
              const isReaction = n.type === 'reaction';
              const actorName = n.actor?.name || 'Someone';
              
              let text = '';
              let icon = '';
              let bg = '';
              let color = '';
              
              if (isReaction) {
                const isLike = n.metadata?.reaction_type === 'like';
                text = isLike ? 'reacted "Like" to your update' : 'replied to your update';
                icon = isLike ? '⚡' : '🔄';
                bg = 'bg-[#8B7CF8]/10';
                color = 'text-[#8B7CF8]';
              } else {
                const roomTitle = n.metadata?.room_title || 'your room';
                text = `started following "${roomTitle}"`;
                icon = '👀';
                bg = 'bg-emerald-500/10';
                color = 'text-emerald-400';
              }

              return (
                <div key={n.id} className={`p-5 flex items-start gap-4 transition-colors hover:bg-white/[0.02] ${!n.read ? 'bg-white/[0.01]' : ''}`}>
                  <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center shrink-0 mt-0.5`}>
                    <span className="text-[18px]">{icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] text-slate-300 leading-snug">
                      <strong className="text-white font-bold">{actorName}</strong> {text}
                    </div>
                    {isReaction && n.metadata?.reaction_text && n.metadata.reaction_type !== 'like' && (
                      <div className="mt-2 text-[13px] text-slate-400 bg-white/[0.02] border border-white/[0.05] p-3 rounded-xl italic">
                        "{n.metadata.reaction_text}"
                      </div>
                    )}
                    <div className="text-[12px] text-slate-500 mt-2 font-mono font-medium flex items-center gap-2">
                      {timeAgo(n.created_at)}
                      {!n.read && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-rose-500" />
                          <span className="text-rose-400 font-bold text-[10px] uppercase tracking-wider">New</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
