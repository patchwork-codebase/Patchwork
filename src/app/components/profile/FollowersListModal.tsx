import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { useFollowers, useFollowing, FollowUser } from '../../hooks/useFollowers';
import { UserAvatar } from '../ui/UserAvatar';
import { useNavigate } from 'react-router';
import { ShieldCheck, Users } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useFollow } from '../../hooks/useFollow';
import { VerifiedTick } from '../ui/VerifiedTick';

interface FollowersListModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  type: 'followers' | 'following';
}

function FollowRow({ user: rowUser, onNavigate }: { user: FollowUser; onNavigate: () => void }) {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  // Don't show follow button for ourself
  const isSelf = currentUser?.id === rowUser.id;
  const { isFollowing, isLoading, toggleFollow } = useFollow(rowUser.id, currentUser?.id);

  return (
    <div 
      className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer rounded-xl transition-colors group"
      onClick={() => {
        onNavigate();
        navigate(`/dashboard/profile/${rowUser.id}`);
      }}
    >
      <UserAvatar
        userId={rowUser.id}
        name={rowUser.name}
        avatarUrl={rowUser.avatarUrl}
        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-900 text-[14px] sm:text-[15px] truncate group-hover:text-primary-600 transition-colors">{rowUser.name}</span>
          <VerifiedTick isVerified={rowUser.isVerifiedExpert} className="w-4 h-4 shrink-0" />
        </div>
        {(rowUser.role || rowUser.domain) && (
          <div className="text-[12px] sm:text-[13px] text-slate-500 truncate">
            {[rowUser.role, rowUser.domain].filter(Boolean).join(' • ')}
          </div>
        )}
      </div>
      
      {!isSelf && currentUser && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFollow();
          }}
          disabled={isLoading}
          className={`shrink-0 ml-2 px-4 py-1.5 rounded-full text-[12px] sm:text-[13px] font-bold transition-all disabled:opacity-50 ${
            isFollowing 
              ? 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100 border border-transparent' 
              : 'bg-slate-900 text-white hover:bg-slate-800'
          }`}
        >
          {isFollowing ? 'Following' : 'Follow'}
        </button>
      )}
    </div>
  );
}

export function FollowersListModal({ isOpen, onClose, userId, type }: FollowersListModalProps) {
  const { data: followers = [], isLoading: loadingFollowers } = useFollowers(isOpen && type === 'followers' ? userId : undefined);
  const { data: following = [], isLoading: loadingFollowing } = useFollowing(isOpen && type === 'following' ? userId : undefined);

  const users = type === 'followers' ? followers : following;
  const isLoading = type === 'followers' ? loadingFollowers : loadingFollowing;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden gap-0 bg-white sm:rounded-[24px] max-w-[90vw] rounded-[24px]">
        <DialogHeader className="px-6 py-4 sm:py-5 border-b border-slate-100 bg-white z-10 relative shadow-sm dark:shadow-none">
          <DialogTitle className="text-[18px] sm:text-[20px] font-bold font-display text-center capitalize">
            {type}
          </DialogTitle>
          <DialogDescription className="sr-only">
            List of your {type}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="max-h-[60vh] sm:max-h-[500px] min-h-[200px] overflow-y-auto p-2 sm:p-3 scrollbar-thin scrollbar-thumb-slate-200">
          {isLoading ? (
            <div className="flex justify-center items-center h-[200px]">
              <span className="w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center flex flex-col items-center justify-center h-[200px] text-slate-500 text-[14px]">
              <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                <Users className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </div>
              No {type} found.
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {users.map(u => (
                <FollowRow key={u.id} user={u} onNavigate={onClose} />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
