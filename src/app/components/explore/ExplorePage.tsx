import { Link, useNavigate } from "react-router";
import { Compass, Users, Clock, Hammer } from "lucide-react";
import { useRooms } from "../../hooks/useRooms";
import { timeAgo } from "../../utils/helpers";

export default function ExplorePage() {
  const { data, isLoading } = useRooms();
  const navigate = useNavigate();

  // useRooms is an infinite query, so data.pages contains the arrays of rooms
  const rooms = data?.pages.flat() || [];

  return (
    <div className="max-w-[1080px] w-full mx-auto px-4 sm:px-6 py-12 relative overflow-hidden">
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[380px] h-[380px] sm:w-[600px] sm:h-[600px] bg-[#6C5CE7]/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#6C5CE7]/10 border border-[#6C5CE7]/20 rounded-full mb-4 mx-auto">
          <Compass className="w-3.5 h-3.5 text-[#8B7CF8]" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#8B7CF8]">Directory</span>
        </div>
        <h1 className="text-5xl sm:text-[40px] font-extrabold text-white font-display tracking-tight leading-tight mb-3">
          Explore <span className="text-[#8B7CF8]">Builders</span>
        </h1>
        <p className="text-[15px] text-slate-400 font-medium">
          Discover builders working in the open across Patchwork.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 h-[200px] animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/[0.05]" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-white/[0.05] rounded w-1/2" />
                  <div className="h-3 bg-white/[0.05] rounded w-1/3" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-white/[0.05] rounded w-full" />
                <div className="h-3 bg-white/[0.05] rounded w-4/5" />
              </div>
            </div>
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-[32px] px-6 py-16 text-center backdrop-blur-md">
          <p className="text-white font-bold text-lg">No active rooms found</p>
          <p className="text-slate-400 text-sm mt-2">Check back later or start your own room!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <div 
              key={room.id}
              onClick={() => navigate(`/dashboard/room/${room.id}`)}
              className="group bg-[#0A0910]/80 border border-white/[0.06] hover:border-[#6C5CE7]/50 rounded-[24px] p-0 flex flex-col cursor-pointer transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(108,92,231,0.15)] relative overflow-hidden h-[340px]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
              
              {/* Cover Image Banner */}
              {room.coverImage && (
                <div className="w-full h-32 overflow-hidden border-b border-white/[0.06] shrink-0">
                  <img 
                    src={room.coverImage} 
                    alt={room.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              )}

              <div className="p-6 flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {!room.coverImage && (
                      <div className="w-10 h-10 rounded-xl bg-[#6C5CE7]/10 border border-[#6C5CE7]/20 flex items-center justify-center text-[#8B7CF8] shrink-0">
                        <Hammer className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="text-white font-bold text-lg group-hover:text-[#8B7CF8] transition-colors line-clamp-1">{room.title}</h3>
                      <p className="text-slate-400 text-xs">by {room.builderName}</p>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-slate-300 mb-6 line-clamp-2 flex-grow">
                  {room.description || "No description provided."}
                </p>

                <div className="flex items-center gap-4 mt-auto pt-4 border-t border-white/[0.06]">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{timeAgo(room.updatedAt)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Users className="w-3.5 h-3.5" />
                    <span>{room.observerCount || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 ml-auto bg-[#6C5CE7]/10 text-[#8B7CF8] px-2 py-0.5 rounded-full font-medium">
                    {room.updateCount || 0} updates
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
