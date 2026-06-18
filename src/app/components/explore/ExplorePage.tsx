import { Compass } from "lucide-react";
import { useRooms } from "../../hooks/useRooms";
import { RoomCard } from "../room/RoomCard";

export default function ExplorePage() {
  const { data, isLoading } = useRooms();

  // useRooms is an infinite query, so data.pages contains the arrays of rooms
  const rooms = data?.pages.flat() ?? [];

  return (
    <div className="max-w-[1080px] w-full mx-auto px-4 sm:px-6 py-12 relative overflow-hidden">
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[380px] h-[380px] sm:w-[600px] sm:h-[600px] bg-[#6C5CE7]/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#6C5CE7]/10 border border-[#6C5CE7]/20 rounded-full mb-4 mx-auto">
          <Compass className="w-3.5 h-3.5 text-[#8B7CF8]" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#8B7CF8]">Directory</span>
        </div>
        <h1 className="text-5xl sm:text-[40px] font-extrabold text-slate-900 font-display tracking-tight leading-tight mb-3">
          Explore <span className="text-[#8B7CF8]">Builders</span>
        </h1>
        <p className="text-[15px] text-slate-600 font-medium">
          Discover builders working in the open across Patchwork.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-slate-50 border border-slate-200 rounded-2xl p-6 h-[200px] animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-200" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                  <div className="h-3 bg-slate-200 rounded w-1/3" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-slate-200 rounded w-full" />
                <div className="h-3 bg-slate-200 rounded w-4/5" />
              </div>
            </div>
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-[32px] px-6 py-16 text-center backdrop-blur-md">
          <p className="text-slate-900 font-bold text-lg">No active rooms found</p>
          <p className="text-slate-600 text-sm mt-2">Check back later or start your own room!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      )}
    </div>
  );
}
