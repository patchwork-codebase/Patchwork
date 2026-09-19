import { Link } from "react-router";
import { Hammer, Users, Clock, ExternalLink, Share2, BookOpen, Linkedin, CheckCircle, Edit2, ShieldCheck, Lock, Layers, Compass, Zap } from "lucide-react";
import { timeAgo } from "../../utils/helpers";
import { VerifiedTick } from "../ui/VerifiedTick";
import { ObserverAvatarStack } from "../ui/ObserverAvatarStack";
import { SmartImage } from "../ui/SmartImage";
import { LinkRepositoryModal } from "./LinkRepositoryModal";
import type { PresenceUser } from "../../hooks/useRoomPresence";
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
import { IntegrationsModal } from "./IntegrationsModal";
import { LivePresencePill } from "./LivePresencePill";
import { BuilderTourModal } from "./BuilderTourModal";
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
  viewers: PresenceUser[];
}

export function RoomHeader({
  room,
  isBuilder,
  closingRoom,
  user,
  setLinkedinShareOpen,
  handleCloseRoom,
  copyLogLink,
  setRequestExpertModalOpen,
  viewers
}: RoomHeaderProps) {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [accessModalOpen, setAccessModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [integrationsModalOpen, setIntegrationsModalOpen] = useState(false);
  const [tourModalOpen, setTourModalOpen] = useState(false);

  const vis = room.visibility ?? (room.isPrivate ? 'private' : 'public');
  const VISIBILITY_BADGES: Record<string, { icon: string; label: string; className: string }> = {
    public: { icon: '🌍', label: 'Public', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
    unlisted: { icon: '🔗', label: 'Unlisted', className: 'bg-slate-100 text-slate-600 border border-slate-200' },
    private: { icon: '🔒', label: 'Private', className: 'bg-slate-900 text-slate-100 border border-slate-700' },
    org_only: { icon: '🏢', label: 'Org Only', className: 'bg-blue-50 text-blue-700 border border-blue-200' },
    nda_protected: { icon: '📜', label: 'NDA', className: 'bg-primary-400/10 text-primary-400 border border-primary-400/30' },
  };
  const badge = VISIBILITY_BADGES[vis] ?? VISIBILITY_BADGES.public;

  return (
    <div className="bg-white dark:bg-[#0a0a0a] border border-slate-100 dark:border-white/5 rounded-[24px] md:rounded-[32px] mb-8 shadow-2xl relative overflow-hidden">
      {room.coverImage && (
        <div className="w-full relative border-b border-slate-100 dark:border-white/5">
          <SmartImage src={room.coverImage} aspectRatio="banner" alt={room.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        </div>
      )}
      {/* Top accent line */}
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary-400/0 via-primary-400/60 to-primary-400/0 z-10" />

      {/* Outer flex-col: [top-row] + [meta-bar] */}
      <div className="p-6 md:p-10 flex flex-col gap-0 relative z-10">

        {/* TOP: title + desc + tags — action buttons inline in title row */}
        <div className="flex flex-col gap-4">
          {/* Title row: title + status badges + action buttons all on one line */}
          <div className="flex flex-wrap items-center justify-between gap-3 min-w-0">
            <div className="flex flex-wrap items-center gap-3 min-w-0 flex-1">
              <h1 className="text-[22px] md:text-[28px] font-extrabold text-slate-900 dark:text-white font-display leading-snug min-w-[200px]">
                {room.title}
              </h1>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest ${
                  room.status === 'active'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-white/5 text-slate-400 border border-slate-200 dark:border-white/10'
                }`}>
                  {room.status === 'active' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.9)]" />
                  )}
                  {room.status}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest ${badge.className}`}
                  title={`Visibility: ${vis.replace('_', ' ')}`}
                >
                  <span>{badge.icon}</span>
                  {badge.label}
                </span>
              </div>
            </div>

            {/* Action buttons — right side of title row */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {room.primaryLink && (
                <a
                  href={room.primaryLink.startsWith('http') ? room.primaryLink : `https://${room.primaryLink}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open Project"
                  aria-label="Open Project"
                  className="flex items-center justify-center w-9 h-9 border border-slate-100 dark:border-white/10 bg-white/5 hover:bg-white/10 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-all shadow-sm active:scale-95"
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
                className="flex items-center justify-center w-9 h-9 border border-slate-100 dark:border-white/10 bg-white/5 hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2] hover:border-[#1DA1F2]/30 rounded-xl text-slate-500 dark:text-slate-400 transition-all shadow-sm active:scale-95"
              >
                <Share2 className="w-4 h-4" />
              </button>

              {isBuilder && (room.status === 'active' || room.status === 'draft') && (
                <>
                  <button
                    onClick={() => setTourModalOpen(true)}
                    title="Interactive Guided Tour"
                    aria-label="Interactive Guided Tour"
                    className="flex items-center justify-center gap-1.5 px-3 h-9 border border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl text-amber-400 font-bold transition-all shadow-sm active:scale-95 text-xs cursor-pointer"
                  >
                    <Compass className="w-4 h-4 text-amber-400" />
                    <span className="hidden sm:inline">Tour</span>
                  </button>
                  <button
                    onClick={() => setIntegrationsModalOpen(true)}
                    title="Integrations (GitHub & Linear Webhooks)"
                    aria-label="Integrations"
                    className="flex items-center justify-center gap-1.5 px-3 h-9 border border-indigo-500/20 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-xl text-indigo-400 font-bold transition-all shadow-sm active:scale-95 text-xs"
                  >
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <span className="hidden sm:inline">Webhooks</span>
                  </button>
                  <button
                    onClick={() => setEditModalOpen(true)}
                    title="Edit Room"
                    aria-label="Edit Room"
                    className="flex items-center justify-center w-9 h-9 border border-slate-100 dark:border-white/10 bg-white/5 hover:bg-white/10 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-all shadow-sm active:scale-95"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </>
              )}

              {isBuilder && room.isPrivate && (
                <>
                  <button
                    onClick={() => setInviteModalOpen(true)}
                    title="Invite Team"
                    aria-label="Invite Team"
                    className="flex items-center justify-center gap-2 px-3 h-9 border border-primary-400/30 bg-primary-400/10 hover:bg-primary-400/20 rounded-xl text-primary-400 font-bold transition-all shadow-sm active:scale-95"
                  >
                    <Users className="w-4 h-4" />
                    <span className="hidden sm:inline text-xs">Invite</span>
                  </button>
                  <button
                    onClick={() => setAccessModalOpen(true)}
                    title="Manage Settings"
                    aria-label="Manage Settings"
                    className="flex items-center justify-center w-9 h-9 border border-slate-100 dark:border-white/10 bg-white/5 hover:bg-white/10 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-all shadow-sm active:scale-95"
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
                    className="flex items-center justify-center w-9 h-9 border border-slate-100 dark:border-white/10 bg-white/5 hover:bg-white/10 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-all shadow-sm active:scale-95"
                  >
                    <BookOpen className="w-4 h-4" />
                  </Link>
                  {isBuilder && (
                    <button
                      onClick={() => setLinkedinShareOpen(true)}
                      title="Share to LinkedIn"
                      aria-label="Share to LinkedIn"
                      className="flex items-center justify-center w-9 h-9 border border-[#0077b5]/30 bg-[#0077b5]/10 hover:bg-[#0077b5]/20 rounded-xl text-[#0077b5] transition-all shadow-sm active:scale-95"
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
                        className="flex items-center justify-center w-9 h-9 border border-slate-100 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 hover:text-slate-900 transition-all disabled:opacity-50 active:scale-95 shadow-sm dark:shadow-none"
                      >
                        {closingRoom ? <span className="w-4 h-4 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-white border-slate-100 text-slate-900 shadow-xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-slate-900 text-xl font-display">Close this room?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-600">
                          This will generate a permanent Build Log and prevent any further updates to this room. You cannot undo this action.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-transparent border-slate-100 hover:bg-slate-50 text-slate-700 shadow-sm dark:shadow-none">Cancel</AlertDialogCancel>
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
                  className="flex justify-center items-center gap-2 px-4 h-9 bg-slate-900 text-slate-900 dark:text-white rounded-xl text-[13px] font-bold hover:bg-slate-100 dark:bg-slate-800 transition-all shadow-lg active:scale-95"
                >
                  <Share2 className="w-4 h-4" /> Share Log
                </button>
              )}
            </div>
          </div>

          {/* Description */}
          {room.description && (
            <div className="text-slate-500 dark:text-slate-400 text-[14px] md:text-[15px] leading-relaxed max-w-3xl space-y-1">
              {room.description.split('\n').map((line: string, i: number) => {
                const parts = line.split(/(\*\*.*?\*\*)/g).map((part, j) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={j} className="text-slate-900 dark:text-white font-semibold">{part.slice(2, -2)}</strong>;
                  }
                  return part;
                });
                return <p key={i} className="m-0 break-words">{parts}</p>;
              })}
            </div>
          )}

          {/* Tags */}
          <div className="flex items-center gap-2 overflow-x-auto md:overflow-visible md:flex-wrap scrollbar-hide snap-x -mx-6 px-6 md:mx-0 md:px-0 py-0.5">
            {room.projectStage && (
              <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 snap-start">
                <Zap className="w-2.5 h-2.5" />
                {room.projectStage}
              </span>
            )}
            {room.primaryGoal && (
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 snap-start">
                {room.primaryGoal}
              </span>
            )}
            {room.tags?.map((tag: string) => (
              <span key={tag} className="shrink-0 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-white/5 text-slate-400 border border-slate-100 dark:border-white/10 snap-start hover:bg-primary-400/10 hover:text-primary-400 hover:border-primary-400/30 transition-colors cursor-default shadow-sm dark:shadow-none">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* FULL-WIDTH META BAR — below both columns */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between flex-wrap gap-y-3 gap-x-4 w-full">
          {/* Left: builder / observers / live */}
          <div className="flex items-center flex-wrap gap-x-4 gap-y-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary-400/10 flex items-center justify-center shrink-0">
                <Hammer className="w-3.5 h-3.5 text-primary-400" />
              </div>
              <span className="text-[13px] font-semibold text-slate-900 dark:text-white flex items-center gap-1 whitespace-nowrap">
                {room.builderName}
                <VerifiedTick isVerified={!!room.builderIsVerifiedExpert} className="w-3.5 h-3.5" />
              </span>
            </div>
            <span className="w-px h-4 bg-white/10 hidden sm:block" />
            <ObserverAvatarStack room={room} />
            {viewers.length > 0 && (
              <>
                <span className="w-px h-4 bg-white/10 hidden sm:block" />
                <LivePresencePill viewers={viewers} />
              </>
            )}
          </div>

          {/* Right: time / authorship */}
          <div className="flex items-center flex-wrap gap-x-4 gap-y-2">
            <div className="flex items-center gap-1.5 text-[12px] text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              {timeAgo(room.updatedAt)}
            </div>
            {room.authorshipTimestamp && (
              <span
                className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-full cursor-help hover:bg-emerald-100 transition-colors whitespace-nowrap"
                title={`Authorship established: ${new Date(room.authorshipTimestamp).toLocaleString()}`}
              >
                <ShieldCheck className="w-3 h-3" />
                Authored {timeAgo(room.authorshipTimestamp)}
              </span>
            )}
          </div>
        </div>

      </div>

      <EditRoomModal open={editModalOpen} onClose={() => setEditModalOpen(false)} room={room} />
      <PrivateRoomAccessModal open={accessModalOpen} onClose={() => setAccessModalOpen(false)} room={room} />
      {isBuilder && room.isPrivate && (
        <InviteTeamModal open={inviteModalOpen} onClose={() => setInviteModalOpen(false)} room={room} />
      )}
      {isBuilder && (
        <IntegrationsModal
          open={integrationsModalOpen}
          onClose={() => setIntegrationsModalOpen(false)}
          roomId={room.id}
          roomTitle={room.title}
        />
      )}
      <BuilderTourModal
        isOpen={tourModalOpen}
        onClose={() => setTourModalOpen(false)}
        roomId={room.id}
      />
    </div>
  );
}
