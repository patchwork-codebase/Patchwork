import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Zap, Layers, Target } from "lucide-react";
import { DecisionLogCard } from "../room/DecisionLogCard";
import { MilestoneTrackerCard } from "../room/MilestoneTrackerCard";

export interface ActiveRoomPanelProps {
  user: any;
  room: any;
  reactions: any[];
  queryClient: any;
}

export function ActiveRoomPanel({
  user,
  room,
  reactions = [],
  queryClient
}: ActiveRoomPanelProps) {
  const [activeTab, setActiveTab] = useState<'decisions' | 'milestones'>('decisions');

  if (!room) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-[#111111] border border-white/10 rounded-3xl h-[600px] shadow-sm">
        <Layers className="w-12 h-12 text-slate-400 mb-4 opacity-50" />
        <h3 className="text-[16px] font-bold text-white mb-2">No Room Selected</h3>
        <p className="text-[13px] text-slate-400 text-center max-w-sm">
          Select a room from your dashboard to view its decisions, milestones, and ongoing discussions.
        </p>
      </div>
    );
  }

  const roomReactions = reactions.filter(r => r.room_id === room.id || r.roomId === room.id);

  return (
    <div className="bg-[#111111] border border-white/10 rounded-3xl overflow-hidden flex flex-col h-[600px] shadow-sm">
      <div className="p-5 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#111111] gap-4">
        <div className="flex flex-col min-w-0">
          <h3 className="text-[16px] sm:text-[18px] font-extrabold text-white leading-tight mb-0.5 line-clamp-2">{room.title}</h3>
          <span className="text-[12px] text-primary-400 font-bold">Active Workspace</span>
        </div>
        <a 
          href={`/dashboard/room/${room.id}`}
          className="text-[11px] uppercase tracking-widest font-bold text-slate-400 hover:text-white px-4 py-2 rounded-full border border-white/10 hover:bg-white/5 transition-all shrink-0 whitespace-nowrap shadow-sm"
        >
          View Full Room
        </a>
      </div>

      <div className="flex px-2 border-b border-white/10 shrink-0 bg-[#1a1a1a]">
        <button
          onClick={() => setActiveTab('decisions')}
          className={`flex-1 py-3 text-[13px] font-bold flex items-center justify-center gap-2 transition-colors relative ${activeTab === 'decisions' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
        >
          <Zap className="w-4 h-4" /> Decision Log
          {activeTab === 'decisions' && (
            <motion.div layoutId="room-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-400" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('milestones')}
          className={`flex-1 py-3 text-[13px] font-bold flex items-center justify-center gap-2 transition-colors relative ${activeTab === 'milestones' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
        >
          <Target className="w-4 h-4" /> Milestones
          {activeTab === 'milestones' && (
            <motion.div layoutId="room-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-400" />
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide bg-[#1a1a1a] p-4">
        <AnimatePresence mode="wait">
          {activeTab === 'decisions' ? (
            <motion.div
              key="decisions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full"
            >
              <DecisionLogCard 
                roomId={room.id} 
                user={user} 
                reactions={roomReactions} 
                queryClient={queryClient} 
                isNested={true}
                isBuilder={room.builder_id === user?.id || room.builderId === user?.id}
              />
            </motion.div>
          ) : (
            <motion.div
              key="milestones"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full"
            >
              <MilestoneTrackerCard 
                roomId={room.id} 
                user={user} 
                reactions={roomReactions} 
                queryClient={queryClient} 
                isNested={true}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
