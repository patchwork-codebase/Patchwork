import { Users } from "lucide-react";
import { getAvatarUrl, getObserverCount } from "../../utils/helpers";
import type { Room, RoomObserver } from "../../types";

interface ObserverAvatarStackProps {
  room: Partial<Room>;
  maxAvatars?: number;
  className?: string;
  size?: 'sm' | 'md';
}

export function ObserverAvatarStack({ room, maxAvatars = 4, className = "", size = 'sm' }: ObserverAvatarStackProps) {
  const observers: RoomObserver[] = room.roomObservers ?? [];
  const observerCount = getObserverCount(room);

  const sizeClasses = {
    sm: "w-6 h-6 -ml-2",
    md: "w-8 h-8 -ml-3"
  };

  const iconClasses = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4"
  };

  return (
    <div
      className={`flex items-center group/observers cursor-pointer ${className}`}
      title={`${observerCount} Observers`}
    >
      {observers.length > 0 ? (
        observers.slice(0, maxAvatars).map((obs, i) => (
          <div
            key={obs.observerId}
            className={`${sizeClasses[size]} rounded-full bg-slate-200 border-2 border-white overflow-hidden transition-all duration-300 first:ml-0 group-hover/observers:-ml-0.5 group-hover/observers:shadow-sm shrink-0`}
            style={{ zIndex: 10 - i }}
          >
            <img
              src={getAvatarUrl(obs.observerId)}
              alt="Observer"
              className="w-full h-full object-cover"
            />
          </div>
        ))
      ) : (
        <div className={`${sizeClasses[size].split(' ')[0]} ${sizeClasses[size].split(' ')[1]} rounded-full bg-slate-100 flex items-center justify-center shrink-0 border-2 border-white first:ml-0`}>
          <Users className={`${iconClasses[size]} text-slate-400`} />
        </div>
      )}
      <span className="ml-1.5 text-[12px] font-medium text-slate-500 transition-all duration-300 group-hover/observers:text-slate-900 shrink-0">
        {observerCount}
      </span>
    </div>
  );
}
