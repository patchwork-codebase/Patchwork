/**
 * RoomCard – reusable room preview card used in ExplorePage and Dashboard.
 * Previously, identical card markup was duplicated in both pages.
 */
import { useNavigate } from "react-router";
import { Clock } from "lucide-react";
import { timeAgo, getAvatarUrl, getObserverCount } from "../../utils/helpers";
import { ObserverAvatarStack } from "../ui/ObserverAvatarStack";
import { VerifiedTick } from "../ui/VerifiedTick";
import type { Room, RoomObserver } from "../../types";

interface RoomCardProps {
  room: Room;
}

// Stable gradient palette based on room id
const GRADIENTS = [
  "from-indigo-500/20 via-purple-500/20 to-pink-500/20",
  "from-emerald-500/20 via-teal-500/20 to-cyan-500/20",
  "from-rose-500/20 via-red-500/20 to-orange-500/20",
  "from-blue-500/20 via-indigo-500/20 to-violet-500/20",
  "from-amber-500/20 via-orange-500/20 to-rose-500/20",
];

function gradientForId(id: string): string {
  const num = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return GRADIENTS[num % GRADIENTS.length];
}

export function RoomCard({ room }: RoomCardProps) {
  const navigate = useNavigate();
  const hasCover = !!room.coverImage;
  const bgGradient = gradientForId(room.id);
  const observers: RoomObserver[] = room.roomObservers ?? [];
  const observerCount = getObserverCount(room);

  return (
    <div
      onClick={() => navigate(`/dashboard/room/${room.id}`)}
      className="group bg-white border border-slate-200 hover:border-[#8B7CF8]/50 rounded-[28px] flex flex-col cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#8B7CF8]/5 relative overflow-hidden"
    >
      {/* Cover Banner */}
      <div
        className={`w-full h-[140px] shrink-0 relative overflow-hidden ${
          hasCover ? "" : `bg-gradient-to-br ${bgGradient}`
        }`}
      >
        {hasCover && (
          <img
            src={room.coverImage!}
            alt={room.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        )}
        {hasCover && (
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
        )}
        {/* Tags overlaid on cover */}
        <div className="absolute top-4 left-4 flex flex-wrap gap-2 pr-4">
          {(room.tags ?? ["product"]).slice(0, 2).map((tag, idx) => (
            <span
              key={idx}
              className="bg-white/90 backdrop-blur-md text-slate-900 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Builder Avatar overlapping the banner */}
      <div className="px-6 relative">
        <div className="absolute -top-6 left-6 p-1 bg-white rounded-2xl shadow-sm z-10">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 relative">
            <img
              src={getAvatarUrl(room.builderId || room.builderName)}
              className="w-full h-full object-cover"
              alt="Builder avatar"
            />
          </div>
        </div>
      </div>

      {/* Card Body */}
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
            <VerifiedTick
              isVerified={!!room.builderIsVerifiedExpert}
              className="w-3.5 h-3.5"
            />
          </div>
        </div>

        <p className="text-[14px] leading-relaxed text-slate-600 mb-6 line-clamp-2">
          {room.description || "No description provided."}
        </p>

        <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="flex items-center gap-4">
            {/* Last updated */}
            <div className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500">
              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <span>{timeAgo(room.updatedAt)}</span>
            </div>

            <ObserverAvatarStack room={room} />
          </div>

          {/* Update count badge */}
          <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wide uppercase bg-[#8B7CF8]/10 text-[#8B7CF8] px-3 py-1.5 rounded-full shrink-0">
            {room.updateCount ?? 0} {(room.updateCount ?? 0) === 1 ? 'update' : 'updates'}
          </div>
        </div>
      </div>
    </div>
  );
}
