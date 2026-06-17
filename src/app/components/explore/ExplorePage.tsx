import { Link, useNavigate } from "react-router";
import { Compass, Users, Clock, Hammer } from "lucide-react";
import { useRooms } from "../../hooks/useRooms";
import { timeAgo, getAvatarUrl } from "../../utils/helpers";
import { VerifiedTick } from "../ui/VerifiedTick";

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
          {rooms.map((room) => {
            const avatar = getAvatarUrl(room.builderId || room.builderName);
            const num = room.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
            const gradients = [
              'from-indigo-500/20 via-purple-500/20 to-pink-500/20',
              'from-emerald-500/20 via-teal-500/20 to-cyan-500/20',
              'from-rose-500/20 via-red-500/20 to-orange-500/20',
              'from-blue-500/20 via-indigo-500/20 to-violet-500/20',
              'from-amber-500/20 via-orange-500/20 to-rose-500/20'
            ];
            const bgGradient = gradients[num % gradients.length];
            const hasCover = !!room.coverImage;

            return (
              <div 
                key={room.id}
                onClick={() => navigate(`/dashboard/room/${room.id}`)}
                className="group bg-white border border-slate-200 hover:border-[#8B7CF8]/50 rounded-[28px] flex flex-col cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#8B7CF8]/5 relative overflow-hidden"
              >
                {/* Dynamic Cover Banner */}
                <div className={`w-full h-[140px] shrink-0 relative overflow-hidden ${hasCover ? '' : `bg-gradient-to-br ${bgGradient}`}`}>
                  {hasCover && (
                    <img 
                      src={room.coverImage} 
                      alt={room.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  )}
                  {hasCover && <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />}
                  {/* Tags overlaid on cover */}
                  <div className="absolute top-4 left-4 flex flex-wrap gap-2 pr-4">
                    {(room.tags || ['product']).slice(0, 2).map((tag: string, idx: number) => (
                      <span key={idx} className="bg-white/90 backdrop-blur-md text-slate-900 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Builder Avatar overlaps the banner */}
                <div className="px-6 relative">
                  <div className="absolute -top-6 left-6 p-1 bg-white rounded-2xl shadow-sm z-10">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 relative">
                      <img src={avatar} className="w-full h-full object-cover" alt="Avatar" />
                    </div>
                  </div>
                </div>

                <div className="px-6 pt-8 pb-6 flex flex-col flex-1">
                  <div className="mb-3">
                    <h3 className="text-slate-900 font-extrabold text-[18px] group-hover:text-[#8B7CF8] transition-colors line-clamp-1 font-display">
                      {room.title}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-slate-500 text-[13px] font-medium">by</span>
                      <span className="text-slate-700 text-[13px] font-bold group-hover:underline">
                        {room.builderName}
                      </span>
                      <VerifiedTick isVerified={!!room.builderIsVerifiedExpert} className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <p className="text-[14px] leading-relaxed text-slate-600 mb-6 line-clamp-2">
                    {room.description || "No description provided."}
                  </p>

                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500" title="Updates">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <span>{timeAgo(room.updatedAt)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500" title="Observers">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <span>{room.observerCount || 0}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wide uppercase bg-[#8B7CF8]/10 text-[#8B7CF8] px-3 py-1.5 rounded-full shrink-0">
                      {room.updateCount || 0} updates
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
