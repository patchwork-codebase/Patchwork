import { useQuery } from "@tanstack/react-query";
import { supabase } from "../auth/AuthContext";

interface ProductRoomStatsProps {
  roomId: string;
  reactionsCount: number;
  roomCreatedAt: string;
}

export function ProductRoomStats({ roomId, reactionsCount, roomCreatedAt }: ProductRoomStatsProps) {
  const { data: decisions = [], isLoading } = useQuery({
    queryKey: ['room-decisions', roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('room_decisions')
        .select('*')
        .eq('room_id', roomId);
      
      if (error) {
        console.error("Error fetching decisions:", error);
        return [];
      }
      return data || [];
    },
    enabled: !!roomId,
  });

  // Calculate metrics
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Decisions
  const allDecisions = decisions.filter(d => d.type === 'decision');
  const decisionsThisWeek = allDecisions.filter(d => new Date(d.created_at) > oneWeekAgo).length;
  
  const allScrapped = decisions.filter(d => d.type === 'scrapped');
  // Days Active
  const daysActive = Math.max(1, Math.floor((now.getTime() - new Date(roomCreatedAt).getTime()) / (1000 * 60 * 60 * 24)));

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-[#0a0a0a] rounded-[20px] p-5 h-[120px] animate-pulse border border-white/5" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {/* Decisions Made */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[20px] p-5 flex flex-col justify-between relative overflow-hidden group shadow-2xl hover:-translate-y-0.5 transition-all">
        <h4 className="text-[11px] font-bold text-slate-400 uppercase font-mono mb-2">Decisions Made</h4>
        <div>
          <p className="text-[32px] font-bold text-white leading-none mb-1">
            {allDecisions.length}
          </p>
          <p className="text-[11px] font-medium text-emerald-400 mt-1.5">
            ↑ {decisionsThisWeek} this week
          </p>
        </div>
      </div>

      {/* Things Scrapped */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[20px] p-5 flex flex-col justify-between relative overflow-hidden group shadow-2xl hover:-translate-y-0.5 transition-all">
        <h4 className="text-[11px] font-bold text-slate-400 uppercase font-mono mb-2">Things Scrapped</h4>
        <div>
          <p className="text-[32px] font-bold text-white leading-none mb-1">
            {allScrapped.length}
          </p>
          <p className="text-[11px] font-medium text-slate-400 mt-1.5">
            decisions pivoted
          </p>
        </div>
      </div>

      {/* Observer Reactions */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[20px] p-5 flex flex-col justify-between relative overflow-hidden group shadow-2xl hover:-translate-y-0.5 transition-all">
        <h4 className="text-[11px] font-bold text-slate-400 uppercase font-mono mb-2">Observer Reactions</h4>
        <div>
          <p className="text-[32px] font-bold text-white leading-none mb-1">
            {reactionsCount}
          </p>
          <p className="text-[11px] font-medium text-slate-400 mt-1.5">
            total engagements
          </p>
        </div>
      </div>

      {/* Days Active */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[20px] p-5 flex flex-col justify-between relative overflow-hidden group shadow-2xl hover:-translate-y-0.5 transition-all">
        <h4 className="text-[11px] font-bold text-slate-400 uppercase font-mono mb-2">Days Active</h4>
        <div>
          <p className="text-[32px] font-bold text-white leading-none mb-1">
            {daysActive}
          </p>
          <p className="text-[11px] font-medium text-slate-400 mt-1.5">
            since creation
          </p>
        </div>
      </div>
    </div>
  );
}
