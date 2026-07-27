import { Link, useNavigate } from "react-router";
import { useAuth } from "../auth/AuthContext";
import { useUserRooms, useObservedRooms, useOfficialRoom } from "../../hooks/useRooms";
import { PATCHWORK_OFFICIAL_ROOM_ID } from "../../constants/patchwork";
import { motion } from "motion/react";
import { FolderGit2, Figma, Github, Plus, Eye, Compass } from "lucide-react";
import { timeAgo, getObserverCount } from "../../utils/helpers";
import { ObserverAvatarStack } from "../ui/ObserverAvatarStack";

const NotionIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M4.459 4.208c-.746.06-1.126.31-1.126 1.054v13.475c0 .744.38 1.054 1.126 1.115v.148h6.251v-.148c-.744-.06-1.126-.371-1.126-1.115V8.167l7.854 10.603h1.839V4.208h-.149c-.06.744-.371 1.054-1.115 1.115v13.595L9.932 8.016v10.72c0 .744.381 1.054 1.126 1.115v.148H4.459v-.148z"/>
  </svg>
);

const TAG_PALETTE: Record<string, { bg: string; color: string }> = {
  design:      { bg: 'bg-primary-500/10', color: 'text-primary-400' },
  engineering: { bg: 'bg-emerald-500/10', color: 'text-emerald-400' },
  dev:         { bg: 'bg-blue-500/10',  color: 'text-blue-400' },
  product:     { bg: 'bg-primary-500/10', color: 'text-primary-400' },
  research:    { bg: 'bg-amber-500/10', color: 'text-amber-400' },
  writing:     { bg: 'bg-pink-500/10', color: 'text-pink-400' },
};

function tagStyle(tag: string) {
  return TAG_PALETTE[tag.toLowerCase()] || { bg: 'bg-white/5', color: 'text-slate-400' };
}

export default function MyRoomsPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const isObserver = profile?.role === 'observer';

  // Builders see their own rooms; observers see rooms they follow
  const { data: myRoomsData, isLoading: myRoomsLoading } = useUserRooms(!isObserver ? user?.id : undefined);
  const { data: observedRoomsData, isLoading: observedLoading } = useObservedRooms(isObserver ? user?.id : undefined);
  const { data: officialRoomData } = useOfficialRoom();

  const isLoading = isObserver ? observedLoading : myRoomsLoading;
  
  const roomsRaw = isObserver
    ? (observedRoomsData?.pages.flat() || [])
    : (myRoomsData?.pages.flat() || []);

  const rooms = [
    ...(officialRoomData ? [officialRoomData] : []),
    ...roomsRaw.filter(r => r.id !== PATCHWORK_OFFICIAL_ROOM_ID)
  ];

  return (
    <div className="max-w-[1000px] mx-auto w-full p-4 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[28px] sm:text-[32px] font-extrabold text-slate-100 font-display tracking-tight mb-2 flex items-center gap-2">
            {isObserver ? (
              <><Eye className="w-7 h-7 text-primary-400" /> Following</>
            ) : (
              'My Rooms'
            )}
          </h1>
          <p className="text-slate-400 font-medium">
            {isObserver
              ? 'Rooms you are watching and following'
              : 'Manage your active build rooms and feature rollouts'}
          </p>
        </div>

        {isObserver ? (
          <Link
            to="/dashboard/explore"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-[#5b4ed6] text-white rounded-xl text-[14px] font-bold transition-all shadow-md active:scale-95"
          >
            <Compass className="w-4 h-4" /> Explore builders
          </Link>
        ) : (
          <Link
            to="/dashboard/create"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-[#5b4ed6] text-white rounded-xl text-[14px] font-bold transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" /> Create Room
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-transparent border border-slate-800 rounded-[24px] py-6 px-6 flex flex-col gap-4 animate-pulse">
              <div className="h-6 w-1/3 bg-slate-800 rounded" />
              <div className="h-4 w-1/4 bg-slate-800 rounded" />
            </div>
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="bg-transparent border border-slate-800 rounded-[32px] p-12 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-sm mt-8">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-[40px] pointer-events-none" />
          <div className="w-16 h-16 rounded-3xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-6 text-primary-400 shadow-sm">
            {isObserver ? <Eye className="w-8 h-8 text-primary-400" /> : <FolderGit2 className="w-8 h-8" />}
          </div>
          <h3 className="text-slate-100 text-[20px] font-bold mb-2">
            {isObserver ? 'Not following any rooms yet' : 'No Build Rooms Yet'}
          </h3>
          <p className="text-slate-400 text-[15px] max-w-[360px] leading-relaxed mb-8">
            {isObserver
              ? 'Follow builders and rooms to see their progress here. Discover what people are building on Patchwork.'
              : 'Create your first room to start documenting your product decisions and sharing updates with your team.'}
          </p>
          <Link
            to={isObserver ? '/dashboard/explore' : '/dashboard/create'}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 hover:bg-[#5b4ed6] text-white rounded-xl text-[14px] font-bold transition-all active:scale-95 shadow-md"
          >
            {isObserver ? (
              <><Compass className="w-4 h-4" /> Explore builders</>
            ) : (
              'Start a feature rollout room'
            )}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {rooms.map((room: any, idx: number) => {
            const tag = (room.tags && room.tags[0]) ? room.tags[0] : 'product';
            const tStyle = tagStyle(tag);
            const isPaused = room.status === 'paused';
            const isShipped = room.status === 'shipped';

            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                key={room.id}
              >
                <div
                  onClick={() => navigate(`/dashboard/room/${room.id}`)}
                  className="block bg-transparent border border-slate-800 rounded-[24px] p-6 hover:bg-slate-800/50 hover:border-slate-700 hover:shadow-md transition-all group cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-48 h-48 bg-slate-800 rounded-full blur-[50px] -mr-24 -mt-24 pointer-events-none group-hover:bg-primary-500/5 transition-colors duration-500" />

                  <div className="flex flex-col gap-3 relative">
                    {/* Title first */}
                    <h2 className="text-[17px] sm:text-[19px] font-extrabold text-slate-100 font-display line-clamp-2 break-words group-hover:text-primary-500 transition-colors leading-snug">
                      {room.title}
                    </h2>

                    {/* Tag + Pinned badge on same row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${tStyle.bg} ${tStyle.color}`}>
                        {tag}
                      </span>
                      {room.id === PATCHWORK_OFFICIAL_ROOM_ID && (
                        <div className="flex items-center text-[10px] font-bold uppercase tracking-widest text-primary-500 bg-primary-500/10 px-2 py-0.5 rounded-full">
                          Pinned by Patchwork
                        </div>
                      )}
                      <span className="capitalize px-2 py-0.5 bg-slate-800 rounded-md text-slate-300 text-[11px] font-bold border border-slate-700">
                        {isShipped ? <span className="text-primary-400">Shipped</span>
                          : room.status === 'draft' ? <span className="text-amber-500">Draft</span>
                          : isPaused ? 'Paused' : 'Live'}
                      </span>
                      {isObserver && room.builderName && (
                        <span className="text-[11px] text-slate-400 font-medium">by {room.builderName}</span>
                      )}
                    </div>

                    <p className="text-[13px] sm:text-[14px] text-slate-400 font-medium line-clamp-2 leading-relaxed pl-5">
                      {room.description || "No description provided for this room."}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pl-5 text-[12px] text-slate-500 font-mono font-medium">
                      <span>
                        Day {Math.max(1, Math.floor((Date.now() - new Date(room.createdAt || room.created_at || Date.now()).getTime()) / (1000 * 60 * 60 * 24)) + 1)}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span>{room.updateCount || 0} updates</span>
                      {!isObserver && (
                        <>
                          <span className="text-slate-300">·</span>
                          <ObserverAvatarStack room={room} />
                        </>
                      )}
                      {room.updatedAt && (
                        <>
                          <span className="text-slate-300">·</span>
                          <span className="text-slate-400">{timeAgo(room.updatedAt)}</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-3 pl-5 pt-1">
                      {!isObserver && (
                        <div className="flex items-center gap-2 text-slate-400 bg-slate-800/50 px-2.5 py-1.5 rounded-xl border border-slate-700 shadow-sm group-hover:bg-slate-800 transition-colors">
                          <Figma className="w-3.5 h-3.5 hover:text-primary-500 transition-colors cursor-help" />
                          <NotionIcon className="w-3.5 h-3.5 hover:text-slate-100 transition-colors cursor-help" />
                          <Github className="w-3.5 h-3.5 hover:text-slate-100 transition-colors cursor-help" />
                        </div>
                      )}
                      <button className="text-[12px] font-bold text-primary-500 bg-primary-500/10 hover:bg-primary-500/20 px-3 py-1.5 rounded-lg transition-colors shrink-0 ml-auto">
                        View Room →
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
