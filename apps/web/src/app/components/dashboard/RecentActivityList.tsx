import { getAvatarUrl } from "../../utils/helpers";
import { Sparkles, Users } from "lucide-react";
import { useNavigate } from "react-router";
import { UserAvatar } from "../ui/UserAvatar";

interface RecentEvent {
  name: string;
  text: string;
  time: string;
  color: string;
}

interface RoomObserver {
  initials: string;
  name: string;
  visits: string;
  bg: string;
  color: string;
  userId?: string;
}

interface RecentActivityListProps {
  recentEvents: RecentEvent[];
  roomObservers: RoomObserver[];
  selectedRoomTitle: string;
}

export function RecentActivityList({
  recentEvents,
  roomObservers,
  selectedRoomTitle,
}: RecentActivityListProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-5">
      {/* Recent activity card */}
      <div className="bg-white dark:bg-[#111111] border border-slate-100 dark:border-white/10 shadow-sm rounded-[16px] p-5 relative overflow-hidden lg:self-start w-full">
        <h3 className="m-0 mb-4 text-[12px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
          Recent activity
        </h3>
        <div className="flex flex-col gap-1 relative">
          {recentEvents.length > 0 ? (
            recentEvents.map((event, idx) => (
              <div 
                key={idx} 
                className="flex gap-3 items-start min-w-0 p-3 hover:bg-white/5 rounded-xl transition-colors cursor-pointer focus-ring"
                tabIndex={0}
              >
                <span className={`w-2 h-2 rounded-full ${event.color} mt-1.5 shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className="m-0 text-[13px] text-slate-500 dark:text-slate-400 leading-snug">
                    <strong className="font-semibold text-slate-900 dark:text-white">{event.name}</strong> {event.text}
                  </p>
                  <p className="m-0 mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    {event.time}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
              <Sparkles className="w-5 h-5 text-slate-500 dark:text-slate-400 mb-2 animate-pulse" />
              <p className="text-[12px] font-semibold text-slate-500 m-0">All quiet for now</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 max-w-[200px] leading-relaxed">
                Activity from observers and reactions to your builds will stream in here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Observers card */}
      <div className="bg-white dark:bg-[#111111] border border-slate-100 dark:border-white/10 shadow-sm rounded-[16px] p-5 relative overflow-hidden w-full">
        <h3 className="m-0 mb-4 text-[12px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400 relative">
          Observers on {selectedRoomTitle}
        </h3>
        
        <div className="flex flex-col gap-1 relative">
          {roomObservers.length > 0 ? (
            roomObservers.map((obs, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-between gap-3 p-2 hover:bg-white/5 rounded-xl transition-colors cursor-pointer focus-ring"
                tabIndex={0}
              >
                <div className="flex items-center gap-3">
                  <div 
                    onClick={(e) => {
                      if (obs.userId) {
                        e.stopPropagation();
                        navigate(`/dashboard/profile/${obs.userId}`);
                      }
                    }}
                    className={`w-8 h-8 rounded-full bg-slate-50 dark:bg-[#1a1a1a] flex items-center justify-center font-mono overflow-hidden shadow-sm cursor-pointer hover:ring-2 hover:ring-primary-400 transition-all`}
                  >
                    <UserAvatar userId={obs.userId || obs.name} name={obs.name} className="w-full h-full object-cover scale-110" />
                  </div>
                  <span className="text-[13px] font-bold text-slate-900 dark:text-white">
                    {obs.name}
                  </span>
                </div>
                
                <span className="text-[12px] text-slate-500 dark:text-slate-400 font-medium">
                  {obs.visits}
                </span>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
              <Users className="w-5 h-5 text-slate-500 dark:text-slate-400 mb-2 animate-pulse" />
              <p className="text-[12px] font-semibold text-slate-500 m-0">No Observers Yet</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 max-w-[200px] leading-relaxed">
                When observers follow this build room, they'll appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
