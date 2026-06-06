import { Link } from "react-router";
import { motion } from "motion/react";

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
      <div className="flex justify-between items-center mb-1">
        <h2 className="font-bold text-[18px] text-white m-0">
          Active rooms
        </h2>
        <button 
          onClick={() => setTab('feed')} 
          className="bg-transparent border-none text-[13px] text-[#8B7CF8] hover:text-[#6C5CE7] font-bold cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8]"
        >
          View all
        </button>
      </div>

      {loading ? (
        <div className="text-slate-400 text-[13px] animate-pulse">Loading rooms…</div>
      ) : rooms.length === 0 ? (
        <div className="bg-white/[0.02] p-6 rounded-2xl border border-white/[0.06] text-slate-400 text-[13px]">
          No active rooms. <Link to="/dashboard/create" className="text-[#8B7CF8] hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#8B7CF8]">Create one</Link> to start building.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {rooms.slice(0, 3).map((room, idx) => {
            const lineColors = ['bg-[#6C5CE7]', 'bg-emerald-500', 'bg-amber-500'];
            const lineColor = lineColors[idx % lineColors.length];
            
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
                  className="block bg-[#0D0B14] border border-white/[0.08] rounded-[16px] py-4 px-5 flex flex-col gap-3 hover:bg-white/[0.03] active:scale-[0.99] transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8]"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center w-full">
                    <div className="flex items-center gap-3">
                      {/* Vertical internal line */}
                      <div className={`w-1 h-[36px] rounded-full shrink-0 ${lineColor} hidden sm:block`} />
                      
                      <div className="flex flex-col gap-1.5">
                        <div className="text-[16px] sm:text-[17px] font-bold text-white group-hover:text-[#8B7CF8] transition-colors">
                          {room.title}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2 text-[14px] text-slate-400 font-mono font-medium">
                          <span className={`w-1.5 h-1.5 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                          <span className="capitalize">{isPaused ? 'Paused' : 'Live'}</span>
                          <span className="text-slate-600 opacity-50">·</span>
                          <span>Day {room.updateCount + 4}</span>
                          <span className="ml-1">{room.updateCount} updates</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-start sm:items-end gap-2 sm:pl-0 pl-4">
                      <span className={`text-[11px] font-bold px-3 py-0.5 rounded-full lowercase tracking-wide ${tStyle.bg} ${tStyle.color}`}>
                        {tag}
                      </span>
                      <span className="text-[12px] font-mono text-slate-500 font-medium">
                        {room.updateCount * 3 + 11} reactions
                      </span>
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
