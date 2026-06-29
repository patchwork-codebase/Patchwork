import { Link } from "react-router";
import { Hammer, Users, Clock, ExternalLink, Share2, BookOpen, Linkedin, CheckCircle, Edit2, ShieldCheck, Sparkles, Lock } from "lucide-react";
import { timeAgo, getObserverCount } from "../../utils/helpers";
import { VerifiedTick } from "../ui/VerifiedTick";
import { ObserverAvatarStack } from "../ui/ObserverAvatarStack";
import { SmartImage } from "../ui/SmartImage";
import { LinkRepositoryModal } from "./LinkRepositoryModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { EditRoomModal } from "./EditRoomModal";
import { PrivateRoomAccessModal } from "./PrivateRoomAccessModal";
import { InviteTeamModal } from "./InviteTeamModal";
import { useState } from "react";
import type { Room } from "../../types";

interface RoomHeaderProps {
  room: Room;
  isBuilder: boolean;
  closingRoom: boolean;
  user: { id: string } | null;
  setLinkedinShareOpen: (open: boolean) => void;
  handleCloseRoom: () => void;
  copyLogLink: () => void;
  setRequestExpertModalOpen: (open: boolean) => void;
}

export function RoomHeader({
  room,
  isBuilder,
  closingRoom,
  user,
  setLinkedinShareOpen,
  handleCloseRoom,
  copyLogLink,
  setRequestExpertModalOpen
}: RoomHeaderProps) {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [accessModalOpen, setAccessModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  return (
    <div className="bg-white border border-slate-200 rounded-[24px] md:rounded-[32px] mb-8 shadow-sm relative overflow-hidden">
      {room.coverImage && (
        <div className="w-full relative border-b border-slate-100">
          <SmartImage src={room.coverImage} aspectRatio="banner" alt={room.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
        </div>
      )}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-400/50 to-transparent opacity-50 z-10" />
      <div className="p-6 md:p-10 flex flex-col md:flex-row items-start justify-between gap-6 relative z-10">
        <div className="flex-1 min-w-0 w-full flex flex-col gap-4">
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-wrap items-start justify-between gap-3 min-w-0">
              <h1 className="text-[22px] md:text-[28px] font-extrabold text-slate-900 font-display leading-snug flex-1 min-w-[200px]">{room.title}</h1>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold px-2.5 py-1.5 rounded-full uppercase tracking-wider ${
                  room.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}>
                  {room.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />}
                  {room.status}
                </span>
                {(() => {
                  const vis = room.visibility ?? (room.isPrivate ? 'private' : 'public');
                  const VISIBILITY_BADGES: Record<string, { icon: string; label: string; className: string }> = {
                    public: { icon: '🌍', label: 'Public', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
                    unlisted: { icon: '🔗', label: 'Unlisted', className: 'bg-slate-100 text-slate-600 border border-slate-200' },
                    private: { icon: '🔒', label: 'Private', className: 'bg-slate-800 text-slate-100 border border-slate-700' },
                    org_only: { icon: '🏢', label: 'Org Only', className: 'bg-blue-50 text-blue-700 border border-blue-200' },
                    nda_protected: { icon: '📜', label: 'NDA', className: 'bg-primary-400/10 text-primary-400 border border-primary-400/30' },
                  };
                  const badge = VISIBILITY_BADGES[vis] ?? VISIBILITY_BADGES.public;
                  return (
                    <span
                      className={`inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold px-2.5 py-1.5 rounded-full uppercase tracking-wider ${badge.className}`}
                      title={`Visibility: ${vis.replace('_', ' ')}`}
                    >
                      <span>{badge.icon}</span>
                      {badge.label}
                    </span>
                  );
                })()}
              </div>
            </div>
            {room.description && (
              <div className="text-slate-600 text-[14px] md:text-[15px] leading-relaxed max-w-3xl font-medium space-y-1.5">
                {room.description.split('\n').map((line: string, i: number) => {
                  const parts = line.split(/(\*\*.*?\*\*)/g).map((part, j) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      return <strong key={j} className="text-slate-900">{part.slice(2, -2)}</strong>;
                    }
                    return part;
                  });
                  return <p key={i} className="m-0 break-words">{parts}</p>;
                })}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto md:overflow-visible md:flex-wrap scrollbar-hide snap-x -mx-6 px-6 md:mx-0 md:px-0 py-1">
            {room.projectStage && (
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 snap-start">
                Stage: {room.projectStage}
              </span>
            )}
            
            {room.primaryGoal && (
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 snap-start">
                Goal: {room.primaryGoal}
              </span>
            )}

            {room.tags?.map((tag: string) => (
              <span key={tag} className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-slate-50 text-primary-400 border border-slate-200 snap-start">{tag}</span>
            ))}
          </div>

          <div className="flex items-center gap-4 text-[12px] sm:text-[13px] text-slate-600 flex-wrap font-medium mt-1">
            <span className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-primary-400/20 flex items-center justify-center"><Hammer className="w-3 h-3 text-primary-400" /></div>{room.builderName} <VerifiedTick isVerified={!!room.builderIsVerifiedExpert} className="w-3.5 h-3.5" /></span>
            <ObserverAvatarStack room={room} />
            <span className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center"><Clock className="w-3 h-3 text-slate-500" /></div>{timeAgo(room.updatedAt)}</span>
            {room.authorshipTimestamp && (
              <span
                className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full cursor-help"
                title={`Authorship established: ${new Date(room.authorshipTimestamp).toLocaleString()}`}
              >
                <ShieldCheck className="w-3 h-3" />
                Authored {timeAgo(room.authorshipTimestamp)}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-row flex-wrap md:justify-end items-center gap-2 w-full md:w-auto mt-6 md:mt-0">
          {room.primaryLink && (
            <a
              href={room.primaryLink.startsWith('http') ? room.primaryLink : `https://${room.primaryLink}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Open Project"
              aria-label="Open Project"
              className="flex items-center justify-center w-9 h-9 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-700 hover:text-slate-900 transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 active:scale-95"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          <button
            onClick={() => {
              const url = encodeURIComponent(window.location.href);
              const text = encodeURIComponent(`I'm building ${room.title} in public. Follow my raw, unfiltered progress on @Patchwork!\n`);
              window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
            }}
            title="Share Room"
            aria-label="Share Room"
            className="flex items-center justify-center w-9 h-9 border border-slate-200 bg-slate-50 hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2] hover:border-[#1DA1F2]/30 rounded-xl text-slate-600 transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1DA1F2] active:scale-95"
          >
            <Share2 className="w-4 h-4" />
          </button>
          
          {/* isBuilder && room.status === 'active' && (
            <button
              onClick={() => setRequestExpertModalOpen(true)}
              title="Request Expert Review"
              className="flex items-center justify-center gap-2 w-9 sm:w-auto h-9 px-0 sm:px-4 bg-gradient-to-r from-primary to-[#5a48d0] hover:opacity-90 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-95"
            >
              <Sparkles className="w-5 h-5 sm:w-4 sm:h-4 shrink-0" />
              <span className="hidden sm:inline">Expert Review</span>
            </button>
          ) */}
          
          {isBuilder && (room.status === 'active' || room.status === 'draft') && (
            <button
              onClick={() => setEditModalOpen(true)}
              title="Edit Room"
              aria-label="Edit Room"
              className="flex items-center justify-center w-9 h-9 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 hover:text-slate-900 transition-all shadow-sm focus-ring active:scale-95"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}

          {isBuilder && room.isPrivate && (
            <>
              <button
                onClick={() => setInviteModalOpen(true)}
                title="Invite Team"
                aria-label="Invite Team"
                className="flex items-center justify-center gap-2 px-3 h-9 border border-primary-400/30 bg-primary-400/10 hover:bg-primary-400/20 rounded-xl text-primary-400 font-bold transition-all shadow-sm focus-ring active:scale-95"
              >
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">Invite</span>
              </button>
              <button
                onClick={() => setAccessModalOpen(true)}
                title="Manage Settings"
                aria-label="Manage Settings"
                className="flex items-center justify-center w-9 h-9 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 active:scale-95"
              >
                <Lock className="w-4 h-4" />
              </button>
            </>
          )}

          {room.status === 'completed' && (
            <>
              <Link
                to={`/dashboard/build-logs`}
                title="View Build Log"
                aria-label="View Build Log"
                className="flex items-center justify-center w-9 h-9 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 hover:text-slate-900 transition-all shadow-sm focus-ring active:scale-95"
              >
                <BookOpen className="w-4 h-4" />
              </Link>
              {isBuilder && (
                <button
                  onClick={() => setLinkedinShareOpen(true)}
                  title="Share to LinkedIn"
                  aria-label="Share to LinkedIn"
                  className="flex items-center justify-center w-9 h-9 border border-[#0077b5]/30 bg-[#0077b5]/10 hover:bg-[#0077b5]/20 rounded-xl text-[#0077b5] transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077b5] active:scale-95"
                >
                  <Linkedin className="w-4 h-4" />
                </button>
              )}
            </>
          )}
          {isBuilder && room.status === 'active' && (
            <>
              <LinkRepositoryModal roomId={room.id} userId={user?.id || ''} />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                <button
                  disabled={closingRoom}
                  title={closingRoom ? 'Closing...' : 'Close Room'}
                  aria-label={closingRoom ? 'Closing...' : 'Close Room'}
                  className="flex items-center justify-center w-9 h-9 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 hover:text-slate-900 transition-all disabled:opacity-50 focus-ring active:scale-95"
                >
                  {closingRoom ? <span className="w-4 h-4 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-white border-slate-200 text-slate-900 shadow-xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-slate-900 text-xl font-display">Close this room?</AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-600">
                    This will generate a permanent Build Log and prevent any further updates to this room. You cannot undo this action.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-transparent border-slate-200 hover:bg-slate-50 text-slate-700">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCloseRoom} className="bg-primary-400 hover:bg-[#7b6ce8] text-white font-bold">
                    Yes, Close Room
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
              </AlertDialog>
            </>
          )}
          {room.status === 'completed' && (
            <button
              onClick={copyLogLink}
              className="flex justify-center items-center gap-2 px-4 sm:px-5 min-h-[44px] sm:min-h-[48px] bg-slate-900 text-white rounded-xl sm:rounded-full text-[13px] sm:text-[14px] font-bold hover:bg-slate-800 transition-all shadow-lg focus-ring active:scale-95 w-full sm:w-auto"
            >
              <Share2 className="w-4 h-4 sm:w-5 sm:h-5" /> Share Log
            </button>
          )}
        </div>
      </div>
      <EditRoomModal open={editModalOpen} onClose={() => setEditModalOpen(false)} room={room} />
      <PrivateRoomAccessModal open={accessModalOpen} onClose={() => setAccessModalOpen(false)} room={room} />
      {isBuilder && room.isPrivate && (
        <InviteTeamModal open={inviteModalOpen} onClose={() => setInviteModalOpen(false)} room={room} />
      )}
    </div>
  );
}
