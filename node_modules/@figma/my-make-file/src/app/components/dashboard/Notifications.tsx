import { motion, AnimatePresence } from "motion/react";
import { useAuth, supabase } from "../auth/AuthContext";
import { useNotifications } from "../../hooks/useNotifications";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, ExternalLink, Heart, MessageCircle, Eye, FileText, Bell, Pin, Mail, Edit3, Image as ImageIcon, Repeat2, Bookmark, AtSign } from "lucide-react";
import { timeAgo } from "../../utils/helpers";
import { RequestsAndInvites } from "./RequestsAndInvites";
import { UserAvatar } from "../ui/UserAvatar";
import { toast } from "sonner";

// Helper for ultra-compact time (e.g., "22m", "1h", "2d")
function shortTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
  
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

// Inline action bar for interacting with updates directly from the notification feed
function NotificationActionBar({ notification, user }: { notification: any, user: any }) {
  const navigate = useNavigate();
  const [localReactions, setLocalReactions] = useState<string[]>([]); // simplified optimistic state
  const isUpdate = notification.type === 'update_posted';
  
  if (!isUpdate || !notification.metadata?.update_id) return null;

  const handleReact = async (e: React.MouseEvent, type: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const roomId = notification.metadata.room_id;
    const updateId = notification.metadata.update_id;
    
    // Toggle optimistic state
    const isReacted = localReactions.includes(type);
    if (isReacted) {
      setLocalReactions(prev => prev.filter(t => t !== type));
    } else {
      setLocalReactions(prev => [...prev, type]);
    }

    try {
      if (isReacted) {
        // In a real app we'd need the reaction ID, but for the notification feed 
        // optimistic UI is enough for the prototype feel.
        toast.success(`Removed reaction`);
      } else {
        const payload = {
          id: `${roomId}-reaction-${type}-${user.id}-${Date.now()}`,
          room_id: roomId,
          update_id: updateId,
          observer_id: user.id,
          observer_name: user.user_metadata?.name || 'Observer',
          type,
          text: type,
          created_at: new Date().toISOString(),
        };
        const { error } = await supabase.from('reactions').insert(payload);
        if (error) throw error;
        toast.success(`Reacted!`);
      }
    } catch (err: any) {
      toast.error('Failed to react');
      // revert
      if (isReacted) setLocalReactions(prev => [...prev, type]);
      else setLocalReactions(prev => prev.filter(t => t !== type));
    }
  };

  const handleReply = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/dashboard/room/${notification.metadata.room_id}?updateId=${notification.metadata.update_id}`);
  };

  const reactionConfig = [
    { type: 'heart', icon: <Heart className="w-4 h-4" />, activeColor: 'text-rose-500', activeBg: 'bg-rose-500/10', hover: 'hover:bg-rose-500/10 hover:text-rose-500' },
    { type: 'repost', icon: <Repeat2 className="w-4 h-4" />, activeColor: 'text-emerald-500', activeBg: 'bg-emerald-500/10', hover: 'hover:bg-emerald-500/10 hover:text-emerald-500' },
    { type: 'bookmark', icon: <Bookmark className="w-4 h-4" />, activeColor: 'text-primary-500', activeBg: 'bg-primary-500/10', hover: 'hover:bg-primary-500/10 hover:text-primary-500' },
  ];

  return (
    <div className="flex items-center gap-1 mt-3 -ml-2" onClick={e => e.stopPropagation()}>
      <button
        onClick={handleReply}
        className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-sky-500 hover:bg-sky-500/10 transition-colors group"
        title="Reply"
      >
        <MessageCircle className="w-4 h-4" />
      </button>

      {reactionConfig.map((config) => {
        const isActive = localReactions.includes(config.type);
        return (
          <button
            key={config.type}
            onClick={(e) => handleReact(e, config.type)}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${isActive ? `${config.activeBg} ${config.activeColor}` : `text-slate-500 ${config.hover}`}`}
            title={config.type}
          >
            {config.icon}
          </button>
        );
      })}
    </div>
  );
}

// Map notification type → display config
function getNotifConfig(n: any) {
  const roomTitle = n.metadata?.room_title || 'a room';

  switch (n.type) {
    case 'reaction': {
      const isLike = n.metadata?.reaction_type === 'like';
      return {
        Icon: isLike ? Heart : MessageCircle,
        iconColor: isLike ? 'text-pink-500' : 'text-primary-500',
        text: isLike ? 'liked your update in' : 'replied to your update in',
        context: roomTitle,
        preview: n.metadata?.reaction_text,
        thumbnailUrl: null, // If we had media in metadata we'd put it here
        primaryLink: n.metadata?.room_id && n.metadata?.update_id
          ? `/dashboard/room/${n.metadata.room_id}?updateId=${n.metadata.update_id}`
          : null,
      };
    }
    case 'room_follow':
      return {
        Icon: Eye,
        iconColor: 'text-emerald-500',
        text: 'started following',
        context: roomTitle,
        preview: null,
        thumbnailUrl: null,
        primaryLink: n.metadata?.room_id ? `/dashboard/room/${n.metadata.room_id}` : null,
      };
    case 'decision':
    case 'decision_updated':
      return {
        Icon: FileText,
        iconColor: 'text-violet-500',
        text: n.type === 'decision' ? 'published a decision in' : 'updated a decision in',
        context: roomTitle,
        preview: n.metadata?.decision_text,
        thumbnailUrl: null,
        primaryLink: n.metadata?.room_id
          ? `/dashboard/room/${n.metadata.room_id}?updateId=${n.reference_id}`
          : null,
      };
    case 'update_posted':
      return {
        Icon: Bell,
        iconColor: 'text-amber-500',
        text: 'posted a new update in',
        context: roomTitle,
        preview: n.metadata?.update_text,
        thumbnailUrl: null,
        primaryLink: n.metadata?.room_id
          ? `/dashboard/room/${n.metadata.room_id}?updateId=${n.reference_id}`
          : null,
      };
    case 'new_message':
      return {
        Icon: MessageCircle,
        iconColor: 'text-blue-500',
        text: 'sent a message in',
        context: roomTitle,
        preview: n.metadata?.message_preview,
        thumbnailUrl: null,
        primaryLink: n.metadata?.room_id ? `/dashboard/messages/${n.metadata.room_id}` : null,
      };
    case 'mention':
      return {
        Icon: AtSign,
        iconColor: 'text-primary-500',
        text: 'mentioned you in',
        context: roomTitle,
        preview: n.metadata?.message_preview,
        thumbnailUrl: null,
        primaryLink: n.metadata?.room_id ? `/dashboard/messages/${n.metadata.room_id}` : null,
      };
    case 'ticket_assigned': {
      const ticketId = n.metadata?.item_id || n.reference_id;
      return {
        Icon: Pin,
        iconColor: 'text-indigo-500',
        text: 'assigned you to a ticket in',
        context: roomTitle,
        preview: n.metadata?.ticket_title,
        thumbnailUrl: null,
        primaryLink: ticketId ? `/dashboard/roadmap?ticketId=${ticketId}` : '/dashboard/roadmap',
      };
    }
    case 'ticket_assigned_invite': {
      const ticketId = n.metadata?.item_id || n.reference_id;
      return {
        Icon: Mail,
        iconColor: 'text-primary-500',
        text: 'invited you to collaborate on a ticket in',
        context: roomTitle,
        preview: n.metadata?.ticket_title,
        thumbnailUrl: null,
        primaryLink: ticketId ? `/dashboard/roadmap?ticketId=${ticketId}` : '/dashboard/roadmap',
      };
    }
    case 'ticket_updated': {
      const ticketId = n.metadata?.item_id || n.reference_id;
      return {
        Icon: Edit3,
        iconColor: 'text-sky-500',
        text: 'updated a ticket in',
        context: roomTitle,
        preview: n.metadata?.ticket_title,
        thumbnailUrl: null,
        primaryLink: ticketId ? `/dashboard/roadmap?ticketId=${ticketId}` : '/dashboard/roadmap',
      };
    }
    case 'ticket_comment': {
      const ticketId = n.metadata?.item_id || n.reference_id;
      return {
        Icon: MessageCircle,
        iconColor: 'text-sky-500',
        text: 'commented on a ticket in',
        context: roomTitle,
        preview: n.metadata?.comment_text,
        thumbnailUrl: null,
        primaryLink: ticketId ? `/dashboard/roadmap?ticketId=${ticketId}` : '/dashboard/roadmap',
      };
    }
    default:
      return {
        Icon: Bell,
        iconColor: 'text-slate-500',
        text: 'sent you a notification',
        context: '',
        preview: null,
        thumbnailUrl: null,
        primaryLink: null,
      };
  }
}

export default function Notifications() {
  const { user } = useAuth();
  const { data: notificationsData, isLoading, markAllAsRead } = useNotifications(user?.id);
  
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  const notifications = notificationsData || [];
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const displayedNotifications = activeTab === 'all' 
    ? notifications 
    : notifications.filter(n => !n.read);

  const hasMarkedRef = useRef(false);
  useEffect(() => {
    // Only auto-mark as read if we are on the "all" tab, or maybe just when we unmount?
    // Let's mark as read after 3 seconds of viewing the page
    const timer = setTimeout(() => {
      if (unreadCount > 0 && !hasMarkedRef.current) {
        hasMarkedRef.current = true;
        markAllAsRead.mutate();
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [unreadCount, markAllAsRead]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-[680px] mx-auto px-5 sm:px-6 py-8"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-bold text-2xl sm:text-[28px] text-slate-900 dark:text-white leading-tight tracking-tight m-0">
            Notifications
          </h1>
        </div>
      </div>

      {/* TABS */}
      <div className="flex border-b border-slate-200 dark:border-white/10 mb-6">
        <button
          onClick={() => setActiveTab('all')}
          className={`relative pb-3 px-1 mr-6 text-[15px] font-bold transition-colors ${activeTab === 'all' ? 'text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          All
          {activeTab === 'all' && (
            <motion.div layoutId="notifTab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary-500 rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('unread')}
          className={`relative pb-3 px-1 text-[15px] font-bold transition-colors ${activeTab === 'unread' ? 'text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          Unread
          {unreadCount > 0 && (
            <span className="ml-2 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-primary-500 text-white text-[10px]">
              {unreadCount}
            </span>
          )}
          {activeTab === 'unread' && (
            <motion.div layoutId="notifTab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary-500 rounded-t-full" />
          )}
        </button>
      </div>

      <RequestsAndInvites />

      <div className="bg-white dark:bg-[#0a0a0a] border-x border-t border-slate-100 dark:border-white/10 rounded-t-[20px] shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center gap-3">
            <div className="w-6 h-6 rounded-full border-2 border-primary-500/20 border-t-primary-500 animate-spin" />
            <span className="text-[14px]">Loading notifications...</span>
          </div>
        ) : displayedNotifications.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400">
            <Bell className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-slate-900 dark:text-white font-extrabold text-[20px] mb-2 tracking-tight">
              {activeTab === 'unread' ? "You're all caught up!" : "No notifications yet."}
            </h3>
          </div>
        ) : (
          <div className="flex flex-col">
            <AnimatePresence initial={false}>
              {displayedNotifications.map(n => {
                const config = getNotifConfig(n);
                const actorName = n.actor?.name || 'Someone';
                const NotificationWrapper = config.primaryLink ? Link : 'div';

                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-b border-slate-100 dark:border-white/10"
                  >
                    <NotificationWrapper
                      to={config.primaryLink || '#'}
                      className={`block p-4 sm:p-5 transition-colors cursor-pointer group ${!n.read ? 'bg-primary-500/[0.03] dark:bg-primary-500/[0.05]' : 'hover:bg-slate-50 dark:hover:bg-white/[0.02]'}`}
                    >
                      <div className="flex items-start gap-3">
                        {/* THE GUTTER: Action Icon */}
                        <div className="w-10 shrink-0 flex justify-end pt-1">
                          <config.Icon className={`w-6 h-6 ${config.iconColor}`} strokeWidth={2.5} />
                        </div>

                        {/* RICH PREVIEW */}
                        <div className="flex-1 min-w-0 pb-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <UserAvatar userId={n.actor_id} name={actorName} avatarUrl={n.actor?.avatar_url} className="w-7 h-7 rounded-full" />
                          </div>
                          
                          <p className="text-[15px] text-slate-700 dark:text-slate-300 leading-snug">
                            <Link to={`/dashboard/profile/${n.actor_id}`} className="font-bold text-slate-900 dark:text-white hover:underline" onClick={e => e.stopPropagation()}>
                              {actorName}
                            </Link>{' '}
                            <span className="text-slate-500 dark:text-slate-400">{config.text}</span>{' '}
                            {config.context && <span className="font-semibold text-slate-900 dark:text-white">{config.context}</span>}
                          </p>

                          {config.preview && (
                            <div className="mt-2.5 text-[15px] text-slate-600 dark:text-slate-300 leading-relaxed pr-4">
                              {config.preview}
                            </div>
                          )}

                          {/* INLINE ACTION BAR */}
                          <NotificationActionBar notification={n} user={user} />
                        </div>

                        {/* THUMBNAIL (If media exists) */}
                        {config.thumbnailUrl && (
                          <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 ml-2">
                            <img src={config.thumbnailUrl} alt="Attachment" className="w-full h-full object-cover" />
                          </div>
                        )}
                        
                        {/* TIMESTAMP */}
                        <div className="shrink-0 text-[13px] text-slate-400 pt-0.5 ml-2">
                          {shortTimeAgo(n.created_at)}
                        </div>
                      </div>
                    </NotificationWrapper>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
