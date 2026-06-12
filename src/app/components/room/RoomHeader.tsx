import { Link } from "react-router";
import { Hammer, Users, Clock, ExternalLink, Share2, BookOpen, Linkedin, CheckCircle } from "lucide-react";
import { timeAgo } from "../../utils/helpers";
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

export function RoomHeader({ 
  room, 
  isBuilder, 
  closingRoom, 
  user,
  setLinkedinShareOpen,
  handleCloseRoom,
  copyLogLink
}: any) {
  return (
    <div className={`bg-white/[0.02] border border-white/[0.06] rounded-[24px] md:rounded-[32px] p-6 md:p-10 mb-8 shadow-xl backdrop-blur-md relative overflow-hidden ${room.coverImage ? 'min-h-[300px] flex flex-col justify-end' : ''}`}>
      {room.coverImage && (
        <>
          <div className="absolute inset-0 z-0">
            <img src={room.coverImage} alt={room.title} className="w-full h-full object-cover opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0910] via-[#0A0910]/80 to-transparent" />
          </div>
        </>
      )}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#8B7CF8]/50 to-transparent opacity-50 z-10" />
      <div className="flex flex-col md:flex-row items-start justify-between gap-6 relative z-10">
        <div className="flex-1 min-w-0 w-full flex flex-col gap-4">
          <div className="flex flex-col gap-2.5">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-[28px] md:text-[36px] font-extrabold text-white font-display leading-tight truncate">{room.title}</h1>
              <span className={`shrink-0 inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold px-2.5 py-1.5 rounded-full uppercase tracking-wider ${
                room.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_8px_rgba(52,211,153,0.3)]' : 'bg-white/5 text-slate-400 border border-white/10'
              }`}>
                {room.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />}
                {room.status}
              </span>
            </div>
            {room.description && <p className="text-slate-400 text-[14px] md:text-[15px] leading-relaxed max-w-2xl font-medium">{room.description}</p>}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto md:overflow-visible md:flex-wrap scrollbar-hide snap-x -mx-6 px-6 md:mx-0 md:px-0 py-1">
            {room.projectStage && (
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 snap-start">
                Stage: {room.projectStage}
              </span>
            )}
            
            {room.primaryGoal && (
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 snap-start">
                Goal: {room.primaryGoal}
              </span>
            )}

            {room.tags?.map((tag: string) => (
              <span key={tag} className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-white/[0.03] text-[#8B7CF8] border border-white/[0.06] snap-start">{tag}</span>
            ))}
          </div>

          <div className="flex items-center gap-4 text-[12px] sm:text-[13px] text-slate-400 flex-wrap font-medium mt-1">
            <span className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-[#8B7CF8]/20 flex items-center justify-center"><Hammer className="w-3 h-3 text-[#8B7CF8]" /></div>{room.builderName}</span>
            <span className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center"><Users className="w-3 h-3" /></div>{room.observerCount}</span>
            <span className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center"><Clock className="w-3 h-3" /></div>{timeAgo(room.updatedAt)}</span>
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
              className="flex items-center justify-center w-11 h-11 border border-white/[0.08] bg-white/[0.05] hover:bg-white/[0.1] rounded-xl text-white transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white active:scale-95"
            >
              <ExternalLink className="w-5 h-5" />
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
            className="flex items-center justify-center w-11 h-11 border border-white/[0.08] bg-white/[0.02] hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2] hover:border-[#1DA1F2]/30 rounded-xl text-slate-300 transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1DA1F2] active:scale-95"
          >
            <Share2 className="w-5 h-5" />
          </button>
          {room.status === 'completed' && (
            <>
              <Link
                to={`/dashboard/build-logs`}
                title="View Build Log"
                aria-label="View Build Log"
                className="flex items-center justify-center w-11 h-11 border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] rounded-xl text-white transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8] active:scale-95"
              >
                <BookOpen className="w-5 h-5" />
              </Link>
              {isBuilder && (
                <button
                  onClick={() => setLinkedinShareOpen(true)}
                  title="Share to LinkedIn"
                  aria-label="Share to LinkedIn"
                  className="flex items-center justify-center w-11 h-11 border border-[#0077b5]/30 bg-[#0077b5]/10 hover:bg-[#0077b5]/20 rounded-xl text-[#0077b5] transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077b5] active:scale-95"
                >
                  <Linkedin className="w-5 h-5" />
                </button>
              )}
            </>
          )}
          {isBuilder && room.status === 'active' && (
            <>
              <LinkRepositoryModal roomId={room.id} userId={user.id} />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                <button
                  disabled={closingRoom}
                  title={closingRoom ? 'Closing...' : 'Close Room'}
                  aria-label={closingRoom ? 'Closing...' : 'Close Room'}
                  className="flex items-center justify-center w-11 h-11 border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] rounded-xl text-white transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8] active:scale-95"
                >
                  {closingRoom ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-[#0D0B14] border-white/[0.08] text-white">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white text-xl font-display">Close this room?</AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-400">
                    This will generate a permanent Build Log and prevent any further updates to this room. You cannot undo this action.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-transparent border-white/[0.08] hover:bg-white/[0.05] text-white">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCloseRoom} className="bg-[#8B7CF8] hover:bg-[#7b6ce8] text-white font-bold">
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
              className="flex justify-center items-center gap-2 px-4 sm:px-5 min-h-[44px] sm:min-h-[48px] bg-white text-[#0A0910] rounded-xl sm:rounded-full text-[13px] sm:text-[14px] font-bold hover:bg-slate-200 transition-all shadow-lg shadow-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8] active:scale-95 w-full sm:w-auto"
            >
              <Share2 className="w-4 h-4 sm:w-5 sm:h-5" /> Share Log
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
