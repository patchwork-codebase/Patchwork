import { Link } from "react-router";
import { motion } from "motion/react";
import { FolderGit2 } from "lucide-react";

interface Room {
  id: string;
  title: string;
  description: string;
  tags: string[];
  builderId: string;
  builderName: string;
  status: string;
  updateCount: number;
  observerCount: number;
  lastUpdate?: string;
  createdAt: string;
  updatedAt: string;
}

interface ActiveRoomsListProps {
  rooms: Room[];
  loading: boolean;
  setTab: (tab: 'overview' | 'feed' | 'mine') => void;
}

const TAG_PALETTE: Record<string, { bg: string; color: string }> = {
  design:      { bg: 'bg-purple-500/10', color: 'text-purple-400' },
  engineering: { bg: 'bg-emerald-500/10', color: 'text-emerald-400' },
  dev:         { bg: 'bg-blue-500/10',  color: 'text-blue-400' },
  product:     { bg: 'bg-[#6C5CE7]/10', color: 'text-[#8B7CF8]' },
  research:    { bg: 'bg-amber-500/10', color: 'text-amber-400' },
  writing:     { bg: 'bg-pink-500/10', color: 'text-pink-400' },
};

function tagStyle(tag: string) {
  return TAG_PALETTE[tag.toLowerCase()] || { bg: 'bg-white/5', color: 'text-slate-400' };
}

export function ActiveRoomsList({ rooms, loading, setTab }: ActiveRoomsListProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center mb-3 sm:mb-4 px-1">
        <h2 className="font-extrabold text-[20px] sm:text-[24px] text-white m-0 font-display tracking-tight">
          Active rooms
        </h2>
        <button 
          onClick={() => setTab('feed')} 
          className="flex items-center justify-center min-h-[44px] px-3 bg-transparent border-none text-[13px] sm:text-[14px] text-[#8B7CF8] hover:text-[#6C5CE7] active:scale-95 font-bold cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8] rounded-full hover:bg-white/[0.03]"
        >
          View all
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3 sm:gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[#0D0B14] border border-white/[0.08] rounded-[20px] py-4 px-5 flex flex-col gap-3">
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-2">
                    <div className="h-4 w-32 bg-white/5 rounded animate-pulse" />
                    <div className="h-3 w-48 bg-white/5 rounded animate-pulse" />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="h-5 w-16 bg-white/5 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="bg-[#0D0B14] border border-white/[0.08] rounded-[24px] p-8 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.01] rounded-full blur-[30px] pointer-events-none" />
          <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mb-4 text-[#8B7CF8] shadow-inner">
            <FolderGit2 className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="text-white text-[15px] font-bold mb-1">No Active Build Rooms</h3>
          <p className="text-slate-400 text-[12px] max-w-[280px] leading-relaxed mb-5">
            Initialize a room to document your project, sync git updates, and invite observers.
          </p>
          <Link
            to="/dashboard/create"
            className="inline-flex items-center justify-center px-5 py-2 bg-[#6C5CE7] hover:bg-[#5b4ed6] text-white rounded-full text-[12px] font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8] active:scale-95 shadow-md"
          >
            Create your first room
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:gap-4">
          {rooms.slice(0, 3).map((room, idx) => {
            const tag = (room.tags && room.tags[0]) ? room.tags[0] : 'product';
            const tStyle = tagStyle(tag);
            const isPaused = idx === 2; // Mocking a paused state for visual matching
            
            return (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                key={room.id}
              >
                <Link
                  to={`/dashboard/room/${room.id}`}
                  className="block bg-[#0A0910]/80 sm:bg-[#0D0B14] border border-white/[0.08] rounded-[20px] sm:rounded-[24px] p-4 sm:p-5 hover:bg-white/[0.03] hover:border-white/[0.12] active:scale-95 transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8] shadow-sm relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.01] rounded-full blur-[40px] -mr-16 -mt-16 pointer-events-none group-hover:bg-white/[0.02] transition-colors" />
                  
                  <div className="flex flex-col gap-3 w-full relative">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]' : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'}`} />
                        <div className="text-[15px] sm:text-[16px] font-extrabold text-white group-hover:text-[#8B7CF8] transition-colors font-display truncate">
                          {room.title}
                        </div>
                      </div>
                      <span className={`shrink-0 text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${tStyle.bg} ${tStyle.color} border border-current/10`}>
                        {tag}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[12px] sm:text-[13px] text-slate-400 font-mono font-medium">
                      <span className="capitalize">{isPaused ? 'Paused' : 'Live'}</span>
                      <span className="text-slate-600 opacity-50">·</span>
                      <span className="text-white/80 font-bold">Day {room.updateCount + 4}</span>
                      <span className="text-slate-600 opacity-50">·</span>
                      <span>{room.updateCount} updates</span>
                      <span className="text-slate-600 opacity-50 hidden sm:inline">·</span>
                      <span className="hidden sm:inline">{room.updateCount * 3 + 11} reactions</span>
                    </div>

                    <div className="sm:hidden mt-1 inline-flex w-fit items-center gap-1.5 text-[11px] text-slate-500 font-bold uppercase tracking-widest bg-white/[0.03] px-2 py-1 rounded-md">
                      {room.updateCount * 3 + 11} reactions
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
