import { motion } from "motion/react";
import { useAuth } from "../auth/AuthContext";
import { useNotifications } from "../../hooks/useNotifications";
import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { timeAgo } from "../../utils/helpers";
import { RequestsAndInvites } from "./RequestsAndInvites";


export default function Notifications() {
  const { user } = useAuth();
  const { data: notificationsData, isLoading, markAllAsRead } = useNotifications(user?.id);
  
  const notifications = notificationsData || [];
  const unreadCount = notifications.filter(n => !n.read).length;

  const hasMarkedRef = useRef(false);

  useEffect(() => {
    if (unreadCount > 0 && !hasMarkedRef.current) {
      hasMarkedRef.current = true;
      markAllAsRead.mutate();
    }
  }, [unreadCount]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-[800px] mx-auto px-5 sm:px-6 py-8"
    >
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-[13px] font-bold text-slate-500 hover:text-slate-900 mb-6 sm:mb-8 transition-colors group">
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Back to Dashboard
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-bold text-2xl sm:text-[28px] text-slate-900 leading-tight tracking-tight m-0">
            Notifications
          </h1>
          <p className="text-slate-500 mt-1 text-[14px]">
            Stay updated on activity in your rooms
          </p>
        </div>
      </div>

      <div className="bg-primary-400/10 border border-primary-400/20 rounded-xl p-4 mb-6 flex items-start gap-4">
        <div className="w-8 h-8 rounded-full bg-primary-400/20 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-[16px]">🔌</span>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-slate-900 text-[14px]">GitHub & Figma Webhooks</h3>
            <span className="px-2 py-0.5 bg-primary-400/10 border border-primary-400/20 text-primary-400 text-[9px] font-bold uppercase tracking-wider rounded-md">Coming Soon</span>
          </div>
          <p className="text-slate-600 text-[13px] leading-relaxed">
            Soon, you'll see automated notifications here whenever a Pull Request is merged or a Figma design changes in your linked artifacts.
          </p>
        </div>
      </div>

      <RequestsAndInvites />

      <div className="bg-white border border-slate-200 rounded-[20px] overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
            <div className="w-6 h-6 rounded-full border-2 border-primary-500/20 border-t-primary-500 animate-spin" />
            <span className="text-[14px]">Loading notifications...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center text-slate-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-[40px] pointer-events-none" />
            <div className="w-16 h-16 rounded-[20px] bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-5 shadow-sm text-primary-400">
              <span className="text-2xl">🔔</span>
            </div>
            <h3 className="text-slate-900 font-extrabold text-[20px] mb-2 tracking-tight">You're all caught up!</h3>
            <p className="text-[14px] text-slate-500 max-w-[280px] leading-relaxed mb-6">
              You don't have any notifications right now. Discover active rooms to follow.
            </p>
            <Link
              to="/explore"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[13px] font-bold transition-all shadow-sm active:scale-95"
            >
              Explore Builders →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map(n => {
              const isReaction = n.type === 'reaction';
              const isDecision = n.type === 'decision';
              const actorName = n.actor?.name || 'Someone';
              
              let text = '';
              let icon = '';
              let bg = '';
              let color = '';
              let linkTo = null;
              
              if (isReaction) {
                const isLike = n.metadata?.reaction_type === 'like';
                text = isLike ? 'reacted "Like" to your update' : 'replied to your update';
                icon = isLike ? '⚡' : '🔄';
                bg = 'bg-primary-400/10';
                color = 'text-primary-400';
                
                if (n.metadata?.room_id && n.metadata?.update_id) {
                  linkTo = `/dashboard/room/${n.metadata.room_id}?updateId=${n.metadata.update_id}`;
                }
              } else if (isDecision) {
                const roomTitle = n.metadata?.room_title || 'a room';
                text = `published a new Decision Log in "${roomTitle}"`;
                icon = '📝';
                bg = 'bg-primary-400/10';
                color = 'text-primary-400';
                linkTo = `/dashboard/room/${n.metadata?.room_id}?updateId=${n.reference_id}`;
              } else if (n.type === 'decision_updated') {
                const roomTitle = n.metadata?.room_title || 'a room';
                text = `updated a Decision Log in "${roomTitle}"`;
                icon = '📝';
                bg = 'bg-primary-400/10';
                color = 'text-primary-400';
                linkTo = `/dashboard/room/${n.metadata?.room_id}?updateId=${n.reference_id}`;
              } else if (n.type === 'update_posted') {
                const roomTitle = n.metadata?.room_title || 'a room';
                text = `posted a new update in "${roomTitle}"`;
                icon = '🔔';
                bg = 'bg-primary-400/10';
                color = 'text-primary-400';
                linkTo = `/dashboard/room/${n.metadata?.room_id}?updateId=${n.reference_id}`;
              } else {
                const roomTitle = n.metadata?.room_title || 'your room';
                text = `started following "${roomTitle}"`;
                icon = '👀';
                bg = 'bg-emerald-500/10';
                color = 'text-emerald-400';
              }

              const InnerContent = (
                <div className={`p-5 flex items-start gap-4 transition-colors hover:bg-slate-50/50 ${!n.read ? 'bg-slate-50' : ''}`}>
                  <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center shrink-0 mt-0.5`}>
                    <span className="text-[18px]">{icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] text-slate-700 leading-snug">
                      <strong className="text-slate-900 font-bold">{actorName}</strong> {text}
                    </div>
                    {(isDecision || n.type === 'decision_updated') && n.metadata?.decision_text && (
                      <div className="mt-2 text-[13px] text-slate-600 bg-slate-50 border border-slate-200 p-3 rounded-xl line-clamp-2">
                        {n.metadata.decision_text}...
                      </div>
                    )}
                    {n.type === 'update_posted' && n.metadata?.update_text && (
                      <div className="mt-2 text-[13px] text-slate-600 bg-slate-50 border border-slate-200 p-3 rounded-xl line-clamp-2">
                        {n.metadata.update_text}...
                      </div>
                    )}
                    {isReaction && n.metadata?.reaction_text && n.metadata.reaction_type !== 'like' && (
                      <div className="mt-2 text-[13px] text-slate-600 bg-slate-50 border border-slate-200 p-3 rounded-xl italic">
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

              return linkTo ? (
                <Link key={n.id} to={linkTo} className="block">
                  {InnerContent}
                </Link>
              ) : (
                <div key={n.id}>
                  {InnerContent}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
