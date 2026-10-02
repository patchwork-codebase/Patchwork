import { Link } from "react-router";
import { Sparkles, TrendingUp, Edit3, ArrowUpRight, CheckCircle2, Clock } from "lucide-react";
import { ObserverAvatarStack } from "../ui/ObserverAvatarStack";
import { VerifiedTick } from "../ui/VerifiedTick";
import { UserAvatar } from "../ui/UserAvatar";
import { RoomMilestoneBar } from "../pow/RoomMilestoneBar";
import { getObserverCount, timeAgo, getAvatarUrl } from "../../utils/helpers";
import type { Room } from "../../types";

function timeAgoDays(iso: string) {
  if (!iso) return 1;
  const diff = Date.now() - new Date(iso).getTime();
  return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function formatDate(iso: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function ActiveBuildCard({ room, isObserver, handleArchiveRoom, archivingId }: { room: Room; isObserver: boolean; handleArchiveRoom?: (id: string) => void; archivingId?: string | null }) {
  const tag = room.tags?.[0] || 'product';
  const daysActive = timeAgoDays(room.createdAt);

  return (
    <div className="bg-transparent border border-slate-100 dark:border-slate-800 rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 flex flex-col relative shadow-sm group hover:border-amber-500/30 hover:shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500" tabIndex={0}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-wrap gap-2 w-full pr-8">
          <div className="flex flex-wrap items-center gap-1.5 w-full">
            <span className="text-[10px] sm:text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-wide border border-amber-200/60">Active</span>
            <span className="text-slate-600 dark:text-slate-300">·</span>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest">{tag}</span>
            {room.projectStage && (
              <>
                <span className="text-slate-600 dark:text-slate-300">·</span>
                <span className="text-[10px] font-bold text-primary-500 bg-primary-50 px-1.5 py-0.5 rounded uppercase tracking-wide border border-primary-100">{room.projectStage}</span>
              </>
            )}
          </div>
          <h3 className="m-0 text-[16px] sm:text-[18px] font-extrabold text-slate-900 dark:text-slate-100 font-display line-clamp-2 leading-snug break-words">{room.title}</h3>
          
          <div className="flex items-center gap-2 mt-1 w-full">
            <div className="w-5 h-5 rounded-full object-cover border border-slate-100 overflow-hidden shrink-0 relative">
              <UserAvatar userId={room.builderId} name={room.builderName} avatarUrl={room.builderAvatarUrl} />
            </div>
            <span className="text-[12px] font-bold text-slate-600 dark:text-slate-300">{room.builderName}</span>
            {room.builderIsVerifiedExpert && <VerifiedTick isVerified className="w-3.5 h-3.5 -ml-1" />}
            {room.builderOrgName && (
               <>
                 <span className="text-[10px] text-slate-500 dark:text-slate-400">@</span>
                 <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-100">{room.builderOrgName}</span>
               </>
            )}
          </div>
        </div>
        
        {isObserver && (
          <button 
            className="absolute top-4 right-4 sm:top-6 sm:right-6 text-slate-500 dark:text-slate-400 hover:text-amber-500 transition-colors bg-transparent rounded-full p-1"
            title="Active observation"
          >
            <Sparkles size={16} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 mb-5">
        <ObserverAvatarStack room={room} max={3} size="sm" />
        <span className="text-[11px] font-bold text-slate-500">{getObserverCount(room)} observers</span>
      </div>

      <div className="grid grid-cols-1 gap-3 mb-5 relative md:grid-cols-2">
        <div className="bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl p-4 flex flex-col justify-center shadow-inner">
          <div className="flex justify-between text-[11px] sm:text-[12px] font-bold mb-2.5">
            <span className="text-slate-500 uppercase tracking-wide">Build progress</span>
            <span className="text-amber-600">Day {daysActive}</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full w-[60%] bg-gradient-to-r from-amber-400 to-amber-300 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.3)]" />
          </div>
        </div>
        
        <div className="bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl p-4 flex flex-col justify-center shadow-inner">
          <div className="flex items-center justify-between">
             <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><TrendingUp size={14}/> Updates</span>
             <div className="flex items-baseline gap-1">
                <span className="text-[20px] sm:text-[24px] font-black text-amber-600 font-display leading-none">{room.updateCount}</span>
                <span className="text-[10px] sm:text-[11px] text-slate-500 font-bold uppercase tracking-wide">total</span>
             </div>
          </div>
        </div>
      </div>

      <RoomMilestoneBar currentPhase={(room.projectStage as any) || "beta"} />

      {room.updatedAt && (
        <div className="bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl p-4 mb-5 relative">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-8000" /> Latest update</div>
          <p className="text-[13px] sm:text-[14px] text-slate-600 dark:text-slate-300 italic m-0 leading-relaxed font-medium line-clamp-2">
            Updated {timeAgo(room.updatedAt)}
          </p>
        </div>
      )}

      <div className="flex flex-row gap-2 relative mt-auto">
        {!isObserver && (
          <Link to={`/dashboard/room/${room.id}?action=post`}
            title="Post update"
            aria-label="Post update"
            className="inline-flex items-center justify-center w-11 h-11 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-600 rounded-xl active:scale-95 transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
            <Edit3 size={18} />
          </Link>
        )}
        <Link to={`/dashboard/room/${room.id}`}
          title="Open room"
          aria-label="Open room"
          className="inline-flex items-center justify-center w-11 h-11 bg-transparent hover:bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-100 rounded-xl active:scale-95 transition-all shadow-sm focus-ring">
          <ArrowUpRight size={18} />
        </Link>
      </div>
    </div>
  );
}

export function ShippedBuildCard({ log }: { log: Room }) {
  return (
    <div className="bg-transparent border border-emerald-500/20 rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 flex flex-col gap-4 sm:gap-5 relative overflow-hidden shadow-sm group hover:border-emerald-500/40 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500" tabIndex={0}>
      <div className="absolute top-0 right-0 p-24 bg-emerald-500/5 rounded-full blur-[50px] -mr-12 -mt-12 pointer-events-none" />
      
      <div className="flex justify-between items-start relative mb-1">
        <div className="flex gap-3 sm:gap-4 w-full">
          <div className="flex-1 min-w-0">
            <h3 className="m-0 text-[15px] sm:text-[16px] font-extrabold text-slate-900 dark:text-slate-100 font-display line-clamp-2 break-words mb-1.5">{log.title}</h3>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-full object-cover border border-slate-100 overflow-hidden shrink-0 relative">
                <UserAvatar userId={log.builderId} name={log.builderName} avatarUrl={log.builderAvatarUrl} />
              </div>
              <span className="text-[12px] font-bold text-slate-600 dark:text-slate-300">{log.builderName}</span>
              {log.projectStage && (
                <>
                  <span className="text-slate-600 dark:text-slate-300">·</span>
                  <span className="text-[10px] font-bold text-primary-500 bg-primary-50 px-1.5 py-0.5 rounded uppercase tracking-wide border border-primary-100">{log.projectStage}</span>
                </>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wide border border-emerald-200">Shipped</span>
            </div>
            <p className="m-0 text-[11px] sm:text-[12px] text-slate-500 font-mono font-medium truncate">Shipped {formatDate(log.updatedAt)}</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2 sm:gap-3 relative">
        <div className="bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl py-2 px-2 text-center flex flex-col justify-center shadow-inner">
          <div className="text-[15px] sm:text-[16px] font-black text-slate-900 dark:text-slate-100 font-display leading-none">{log.updateCount}</div>
          <div className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Updates</div>
        </div>
        <div className="bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl py-2 px-2 text-center flex flex-col justify-center shadow-inner">
          <div className="text-[15px] sm:text-[16px] font-black text-slate-900 dark:text-slate-100 font-display leading-none">{getObserverCount(log)}</div>
          <div className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Observers</div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl py-2 px-2 flex items-center justify-center shadow-inner group-hover:bg-emerald-50 transition-colors">
          <Link to={`/dashboard/room/${log.id}`} className="text-emerald-500 hover:text-emerald-600 transition-colors flex items-center justify-center p-2 rounded-lg" aria-label="Open room">
            <ArrowUpRight size={20} className="sm:w-[24px] sm:h-[24px]" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export function CompletedBuildCard({ log }: { log: Room }) {
  const daysActive = timeAgoDays(log.createdAt);
  
  return (
    <div className="bg-transparent border border-slate-100 dark:border-slate-800 rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 flex flex-col gap-4 sm:gap-5 relative overflow-hidden shadow-sm group hover:border-primary-400/30 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400" tabIndex={0}>
      <div className="flex justify-between items-start relative mb-1">
        <div className="flex gap-3 sm:gap-4 w-full">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-50 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 border border-primary-100">
            <CheckCircle2 size={18} className="text-primary-500 sm:w-[20px] sm:h-[20px]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="m-0 text-[15px] sm:text-[16px] font-extrabold text-slate-900 dark:text-slate-100 font-display line-clamp-2 break-words mb-1">{log.title}</h3>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-4 h-4 rounded-full object-cover border border-slate-100 overflow-hidden shrink-0 relative">
                <UserAvatar userId={log.builderId} name={log.builderName} avatarUrl={log.builderAvatarUrl} />
              </div>
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{log.builderName}</span>
            </div>
            <p className="m-0 text-[11px] sm:text-[12px] text-slate-500 font-mono font-medium truncate">Finished {formatDate(log.updatedAt)}</p>
          </div>
        </div>
      </div>
      
      {log.retrospectiveNote && (
        <div className="bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl p-3 sm:p-4 text-[12px] sm:text-[13px] text-slate-600 italic border-l-[3px] border-l-primary-400 shadow-sm">
          "{log.retrospectiveNote}"
        </div>
      )}
      
      <div className="flex flex-wrap gap-2 mt-auto">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-100 text-[11px] font-bold text-slate-500">
          <Clock size={12} /> {daysActive} days
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-100 text-[11px] font-bold text-slate-500">
          <Sparkles size={12} /> {log.updateCount} updates
        </div>
        <Link to={`/dashboard/room/${log.id}`} className="ml-auto flex items-center justify-center p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-100 border border-slate-100 text-slate-600 rounded-lg transition-colors focus-ring" aria-label="Open completed room">
          <ArrowUpRight size={16} />
        </Link>
      </div>
    </div>
  );
}
