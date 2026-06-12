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
      <div className="flex flex-col items-center justify-center p-12 bg-white/[0.02] border border-white/[0.05] rounded-3xl h-[600px]">
        <Layers className="w-12 h-12 text-slate-500 mb-4 opacity-50" />
        <h3 className="text-[16px] font-bold text-white mb-2">No Room Selected</h3>
        <p className="text-[13px] text-slate-400 text-center max-w-sm">
          Select a room from your dashboard to view its decisions, milestones, and ongoing discussions.
        </p>
      </div>
    );
  }

  const roomReactions = reactions.filter(r => r.room_id === room.id || r.roomId === room.id);

  return (
    <div className="bg-[#0D0B14] border border-white/[0.08] rounded-3xl overflow-hidden flex flex-col h-[600px] shadow-2xl">
      <div className="p-5 border-b border-white/[0.08] flex items-center justify-between shrink-0 bg-white/[0.01]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B7CF8]/20 to-[#6C5CE7]/10 border border-[#8B7CF8]/20 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5 text-[#8B7CF8]" />
          </div>
          <div>
            <h3 className="text-[16px] font-extrabold text-white leading-tight">{room.title}</h3>
            <span className="text-[12px] text-[#8B7CF8] font-bold">Active Workspace</span>
          </div>
        </div>
        <a 
          href={`/dashboard/room/${room.id}`}
          className="text-[11px] uppercase tracking-widest font-bold text-slate-400 hover:text-white px-3 py-1.5 rounded-full border border-white/[0.08] hover:bg-white/[0.04] transition-all"
        >
          View Full Room
        </a>
      </div>

      <div className="flex px-2 border-b border-white/[0.05] shrink-0 bg-black/20">
        <button
          onClick={() => setActiveTab('decisions')}
          className={`flex-1 py-3 text-[13px] font-bold flex items-center justify-center gap-2 transition-colors relative ${activeTab === 'decisions' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Zap className="w-4 h-4" /> Decision Log
          {activeTab === 'decisions' && (
            <motion.div layoutId="room-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8B7CF8]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('milestones')}
          className={`flex-1 py-3 text-[13px] font-bold flex items-center justify-center gap-2 transition-colors relative ${activeTab === 'milestones' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Target className="w-4 h-4" /> Milestones
          {activeTab === 'milestones' && (
            <motion.div layoutId="room-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8B7CF8]" />
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide bg-[#0A0910] p-4">
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
