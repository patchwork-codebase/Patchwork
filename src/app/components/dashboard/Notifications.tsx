import { motion } from "motion/react";
import { useAuth } from "../auth/AuthContext";
import { useNotifications } from "../../hooks/useNotifications";
import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { timeAgo, getAvatarUrl } from "../../utils/helpers";
import { RequestsAndInvites } from "./RequestsAndInvites";

// Map notification type → display config
function getNotifConfig(n: any) {
  const roomTitle = n.metadata?.room_title || 'a room';

  switch (n.type) {
    case 'reaction': {
      const isLike = n.metadata?.reaction_type === 'like';
      return {
        icon: isLike ? '⚡' : '💬',
        iconBg: 'bg-primary-400/10',
        text: isLike ? 'reacted to your update' : 'replied to your update',
        preview: n.metadata?.reaction_text,
        primaryLink: n.metadata?.room_id && n.metadata?.update_id
          ? `/dashboard/room/${n.metadata.room_id}?updateId=${n.metadata.update_id}`
          : null,
        primaryLabel: 'View update',
        actorLink: n.actor?.id ? `/profile/${n.actor.id}` : null,
      };
    }
    case 'room_follow':
      return {
        icon: '👀',
        iconBg: 'bg-emerald-500/10',
        text: `started following "${roomTitle}"`,
        preview: null,
        primaryLink: n.metadata?.room_id ? `/dashboard/room/${n.metadata.room_id}` : null,
        primaryLabel: 'View room',
        actorLink: n.actor?.id ? `/profile/${n.actor.id}` : null,
      };
    case 'decision':
    case 'decision_updated':
      return {
        icon: '📝',
        iconBg: 'bg-violet-500/10',
        text: n.type === 'decision'
          ? `published a Decision Log in "${roomTitle}"`
          : `updated a Decision Log in "${roomTitle}"`,
        preview: n.metadata?.decision_text,
        primaryLink: n.metadata?.room_id
          ? `/dashboard/room/${n.metadata.room_id}?updateId=${n.reference_id}`
          : null,
        primaryLabel: 'View decision',
        actorLink: n.actor?.id ? `/profile/${n.actor.id}` : null,
      };
    case 'update_posted':
      return {
        icon: '🔔',
        iconBg: 'bg-amber-500/10',
        text: `posted a new update in "${roomTitle}"`,
        preview: n.metadata?.update_text,
        primaryLink: n.metadata?.room_id
          ? `/dashboard/room/${n.metadata.room_id}?updateId=${n.reference_id}`
          : null,
        primaryLabel: 'View update',
        actorLink: n.actor?.id ? `/profile/${n.actor.id}` : null,
      };
    default:
      return {
        icon: '🔔',
        iconBg: 'bg-slate-100',
        text: 'sent you a notification',
        preview: null,
        primaryLink: null,
        primaryLabel: null,
        actorLink: n.actor?.id ? `/profile/${n.actor.id}` : null,
      };
  }
}

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
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
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
            <div className="w-16 h-16 rounded-[20px] bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-5 shadow-sm">
              <span className="text-2xl">🔔</span>
            </div>
            <h3 className="text-slate-900 font-extrabold text-[20px] mb-2 tracking-tight">You're all caught up!</h3>
            <p className="text-[14px] text-slate-500 max-w-[280px] leading-relaxed mb-6">
              No notifications yet. Discover active rooms to follow.
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
              const config = getNotifConfig(n);
              const actorName = n.actor?.name || 'Someone';
              const actorAvatarUrl = n.actor?.avatar_url || getAvatarUrl(n.actor_id || actorName);

              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`p-4 sm:p-5 transition-colors ${!n.read ? 'bg-primary-50/50' : 'hover:bg-slate-50/60'}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Actor avatar — tappable to profile */}
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-white shadow-sm ring-1 ring-slate-100">
                        <img
                          src={actorAvatarUrl}
                          alt={actorName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = getAvatarUrl(actorName);
                          }}
                        />
                      </div>
                      {/* Notification type badge */}
                      <div className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full ${config.iconBg} border-2 border-white flex items-center justify-center text-[10px]`}>
                        {config.icon}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] text-slate-700 leading-snug">
                        {config.actorLink ? (
                          <Link
                            to={config.actorLink}
                            className="font-extrabold text-slate-900 hover:text-primary-500 transition-colors"
                          >
                            {actorName}
                          </Link>
                        ) : (
                          <strong className="font-extrabold text-slate-900">{actorName}</strong>
                        )}{' '}
                        {config.text}
                      </p>

                      {/* Preview snippet */}
                      {config.preview && (
                        <div className="mt-2 text-[13px] text-slate-600 bg-slate-50 border border-slate-200 p-2.5 rounded-xl line-clamp-2 italic">
                          "{config.preview}"
                        </div>
                      )}

                      {/* Timestamp + unread dot */}
                      <div className="text-[12px] text-slate-400 mt-2 font-medium flex items-center gap-2">
                        {timeAgo(n.created_at)}
                        {!n.read && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-rose-500" />
                            <span className="text-rose-400 font-bold text-[10px] uppercase tracking-wider">New</span>
                          </>
                        )}
                      </div>

                      {/* Action buttons */}
                      {(config.primaryLink || config.actorLink) && (
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          {config.primaryLink && config.primaryLabel && (
                            <Link
                              to={config.primaryLink}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-[12px] font-bold rounded-xl transition-all shadow-sm shadow-primary-100 active:scale-95"
                            >
                              <ExternalLink className="w-3 h-3" />
                              {config.primaryLabel}
                            </Link>
                          )}
                          {config.actorLink && (
                            <Link
                              to={config.actorLink}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-[12px] font-bold rounded-xl border border-slate-200 hover:border-slate-300 transition-all active:scale-95"
                            >
                              View profile
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
