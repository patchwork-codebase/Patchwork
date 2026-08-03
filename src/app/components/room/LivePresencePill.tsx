import { PresenceUser } from '../../hooks/useRoomPresence';
import { UserAvatar } from '../ui/UserAvatar';
import { Eye, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LivePresencePillProps {
  viewers: PresenceUser[];
  typingUsers?: PresenceUser[];
  className?: string;
}

export function LivePresencePill({ viewers = [], typingUsers = [], className = '' }: LivePresencePillProps) {
  const activeCount = viewers.length;

  return (
    <div className={`flex items-center gap-3 flex-wrap ${className}`}>
      {/* Live Active Pill */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-bold font-mono shadow-xs">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span>{activeCount} Live {activeCount === 1 ? 'Viewer' : 'Viewers'}</span>
      </div>

      {/* Viewers Avatar Stack */}
      {viewers.length > 0 && (
        <div className="flex items-center -space-x-2 overflow-hidden py-0.5">
          {viewers.slice(0, 5).map((v) => (
            <div
              key={v.id}
              className="relative inline-block w-6 h-6 rounded-full ring-2 ring-white overflow-hidden shadow-xs hover:scale-110 transition-transform cursor-pointer"
              title={`${v.name} (Active now)`}
            >
              <UserAvatar userId={v.id} name={v.name} avatarUrl={v.avatar_url} className="w-full h-full object-cover" />
            </div>
          ))}
          {viewers.length > 5 && (
            <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center ring-2 ring-white">
              +{viewers.length - 5}
            </div>
          )}
        </div>
      )}

      {/* Live Typing Banner */}
      <AnimatePresence>
        {typingUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            className="flex items-center gap-1.5 text-xs text-primary-600 font-medium bg-primary-50 px-2.5 py-1 rounded-full border border-primary-100"
          >
            <Zap className="w-3.5 h-3.5 animate-pulse text-primary-500" />
            <span>
              {typingUsers.map(u => u.name.split(' ')[0]).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing
            </span>
            <span className="flex gap-0.5 ml-0.5">
              <span className="w-1 h-1 bg-primary-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1 h-1 bg-primary-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1 h-1 bg-primary-500 rounded-full animate-bounce" />
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
