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
  return (
    <div className="flex flex-col gap-5">
      {/* Recent activity card */}
      <div className="bg-[#0D0B14] border border-white/[0.08] rounded-[16px] p-5 relative overflow-hidden lg:self-start w-full">
        <h3 className="m-0 mb-4 text-[12px] font-bold uppercase tracking-[0.1em] text-slate-500">
          Recent activity
        </h3>
        <div className="flex flex-col gap-1 relative">
          {recentEvents.length > 0 ? (
            recentEvents.map((event, idx) => (
              <div 
                key={idx} 
                className="flex gap-3 items-start min-w-0 p-3 hover:bg-white/[0.03] rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8]"
                tabIndex={0}
              >
                <span className={`w-2 h-2 rounded-full ${event.color} mt-1.5 shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className="m-0 text-[13px] text-slate-300 leading-snug">
                    <strong className="font-semibold text-white">{event.name}</strong> {event.text}
                  </p>
                  <p className="m-0 mt-1 text-[11px] text-slate-500 font-mono">
                    {event.time}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-[12px] text-slate-500 p-3 m-0">No recent activity</p>
          )}
        </div>
      </div>

      {/* Observers card */}
      <div className="bg-[#0D0B14] border border-white/[0.08] rounded-[16px] p-5 relative overflow-hidden w-full">
        <h3 className="m-0 mb-4 text-[12px] font-bold uppercase tracking-[0.1em] text-slate-500 relative">
          Observers on {selectedRoomTitle}
        </h3>
        
        <div className="flex flex-col gap-1 relative">
          {roomObservers.length > 0 ? (
            roomObservers.map((obs, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-between gap-3 p-2 hover:bg-white/[0.03] rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8]"
                tabIndex={0}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full ${obs.bg} ${obs.color} font-bold text-[11px] flex items-center justify-center font-mono`}>
                    {obs.initials}
                  </div>
                  <span className="text-[13px] font-bold text-slate-200">
                    {obs.name}
                  </span>
                </div>
                
                <span className="text-[12px] text-slate-500 font-medium">
                  {obs.visits}
                </span>
              </div>
            ))
          ) : (
            <p className="text-[12px] text-slate-500 p-2 m-0">No active observers</p>
          )}
        </div>
      </div>
    </div>
  );
}
