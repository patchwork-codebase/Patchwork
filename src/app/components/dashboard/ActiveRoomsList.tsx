import { Link, useNavigate } from "react-router";
import { motion } from "motion/react";
import { ObserverAvatarStack } from "../ui/ObserverAvatarStack";
import { FolderGit2, Figma, Github, Compass } from "lucide-react";
import { timeAgo } from "../../utils/helpers";
import { PATCHWORK_OFFICIAL_ROOM_ID } from "../../constants/patchwork";
import type { Room } from "../../types";

const NotionIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M4.459 4.208c-.746.06-1.126.31-1.126 1.054v13.475c0 .744.38 1.054 1.126 1.115v.148h6.251v-.148c-.744-.06-1.126-.371-1.126-1.115V8.167l7.854 10.603h1.839V4.208h-.149c-.06.744-.371 1.054-1.115 1.115v13.595L9.932 8.016v10.72c0 .744.381 1.054 1.126 1.115v.148H4.459v-.148z"/>
  </svg>
);

interface ActiveRoomsListProps {
  rooms: Room[];
  loading?: boolean;
  setTab: (tab: 'overview' | 'feed' | 'mine') => void;
  selectedRoomId?: string | null;
  setSelectedRoomId?: (id: string) => void;
}

const TAG_PALETTE: Record<string, { bg: string; color: string }> = {
  design:      { bg: 'bg-purple-500/10', color: 'text-purple-400' },
  engineering: { bg: 'bg-emerald-500/10', color: 'text-emerald-400' },
  dev:         { bg: 'bg-blue-500/10',  color: 'text-blue-400' },
  product:     { bg: 'bg-primary-500/10', color: 'text-primary-400' },
  research:    { bg: 'bg-amber-500/10', color: 'text-amber-400' },
  writing:     { bg: 'bg-pink-500/10', color: 'text-pink-400' },
};

function tagStyle(tag: string) {
  return TAG_PALETTE[tag.toLowerCase()] || { bg: 'bg-white/5', color: 'text-slate-400' };
}

export function ActiveRoomsList({ rooms, loading, setTab, selectedRoomId, setSelectedRoomId }: ActiveRoomsListProps) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center mb-3 sm:mb-4 px-1">
        <div>
          <h2 className="font-extrabold text-[20px] sm:text-[24px] text-slate-900 m-0 font-display tracking-tight">
            Active rooms
          </h2>
          <p className="text-[11px] text-slate-400 font-mono font-medium mt-0.5">Sorted by recent activity</p>
        </div>
        <Link
          to="/dashboard/rooms"
          className="flex items-center justify-center min-h-[44px] px-3 bg-transparent border-none text-[13px] sm:text-[14px] text-primary-400 hover:text-primary-500 active:scale-95 font-bold cursor-pointer transition-all focus-ring rounded-full hover:bg-slate-50"
        >
          View all
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3 sm:gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white border border-slate-200 rounded-[20px] py-4 px-5 flex flex-col gap-3">
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-2">
                    <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
                    <div className="h-3 w-48 bg-slate-100 rounded animate-pulse" />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="h-5 w-16 bg-slate-100 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-[24px] p-8 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full blur-[30px] pointer-events-none" />
          <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-4 text-primary-400">
            <FolderGit2 className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="text-slate-900 text-[15px] font-bold mb-1">No Active Build Rooms</h3>
          <p className="text-slate-500 text-[12px] max-w-[280px] leading-relaxed mb-5">
            Start a feature rollout room, link your PRD, and document your product decisions.
          </p>
          <Link
            to="/dashboard/create"
            className="inline-flex items-center justify-center px-5 py-2 bg-primary-500 hover:bg-[#5b4ed6] text-white rounded-full text-[12px] font-bold transition-all focus-ring active:scale-95 shadow-md"
          >
            Start a feature rollout room
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:gap-4">
          {[...rooms]
            .sort((a, b) => {
              const aTime = new Date(a.updatedAt || (a as any).updated_at || 0).getTime();
              const bTime = new Date(b.updatedAt || (b as any).updated_at || 0).getTime();
              return bTime - aTime;
            })
            .slice(0, 4).map((room, idx) => {
            const tag = (room.tags && room.tags[0]) ? room.tags[0] : 'product';
            const tStyle = tagStyle(tag);
            const isPaused = room.status === 'paused';
            
            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                key={room.id}
              >
                <div
                  onClick={() => {
                    if (setSelectedRoomId && selectedRoomId !== room.id) {
                      setSelectedRoomId(room.id);
                    } else {
                      navigate(`/dashboard/room/${room.id}`);
                    }
                  }}
                  onMouseEnter={() => {
                    if (window.matchMedia('(hover: hover)').matches && setSelectedRoomId) {
                      setSelectedRoomId(room.id);
                    }
                  }}
                  className={`block border rounded-[20px] sm:rounded-[24px] p-4 sm:p-5 active:scale-95 transition-all group focus-ring shadow-sm relative overflow-hidden cursor-pointer ${
                    selectedRoomId === room.id 
                      ? 'bg-slate-50 border-primary-400/50 shadow-sm' 
                      : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-[40px] -mr-16 -mt-16 pointer-events-none group-hover:bg-slate-100 transition-colors" />
                  
                  <div className="flex flex-col gap-2 w-full relative">
                    {/* Title row — full width, never compete with tag */}
                    <div className="flex items-start gap-2 min-w-0">
                      <div className={`w-2 h-2 rounded-full mt-[5px] shrink-0 ${isPaused ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]' : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'}`} />
                      <div className="flex flex-col gap-1">
                        {room.id === PATCHWORK_OFFICIAL_ROOM_ID && (
                          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary-500 bg-primary-500/10 px-2 py-0.5 rounded-full w-fit">
                            <Compass className="w-3 h-3" /> Pinned by Patchwork
                          </div>
                        )}
                        <div className={`text-[14px] sm:text-[15px] font-extrabold transition-colors font-display leading-snug line-clamp-3 group-hover:underline break-words ${selectedRoomId === room.id ? 'text-slate-900' : 'text-slate-700 group-hover:text-primary-400'}`}>
                          {room.title}
                        </div>
                      </div>
                    </div>

                    {/* Tag — always below title, never on same row */}
                    <span className={`self-start text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${tStyle.bg} ${tStyle.color} border border-current/10`}>
                      {tag}
                    </span>

                    {/* Meta row */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 text-[11px] sm:text-[12px] text-slate-400 font-mono font-medium min-w-0">
                        <span className="capitalize px-2 py-0.5 bg-slate-100 rounded-md text-slate-600 text-[11px] font-bold">
                          {room.status === 'draft' ? <span className="text-amber-500">Draft</span> : isPaused ? 'Paused' : 'Live'}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span>Day {Math.max(1, Math.floor((Date.now() - new Date(room.createdAt || (room as any).created_at || Date.now()).getTime()) / (1000 * 60 * 60 * 24)) + 1)}</span>
                        <span className="text-slate-300">·</span>
                        <span><span className="sm:hidden">{room.updateCount || 0} upd</span><span className="hidden sm:inline">{room.updateCount || 0} updates</span></span>
                        <span className="text-slate-300">·</span>
                        <span>Updated {timeAgo(room.updatedAt || (room as any).updated_at || room.createdAt)}</span>
                        <span className="text-slate-300">·</span>
                        <ObserverAvatarStack room={room} />
                      </div>

                      {/* Integration icons — hidden on mobile */}
                      <div className="hidden sm:flex items-center gap-2 text-slate-400 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 shadow-inner shrink-0">
                        <Figma className="w-3.5 h-3.5 hover:text-purple-400 transition-colors" />
                        <NotionIcon className="w-3.5 h-3.5 hover:text-slate-900 transition-colors" />
                        <Github className="w-3.5 h-3.5 hover:text-slate-900 transition-colors" />
                      </div>
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
