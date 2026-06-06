import { motion } from "motion/react";

interface StatsStripProps {
  myRooms: any[];
  reactions: any[];
  observers: any[];
  myRoomsLoading: boolean;
  reactionsLoading: boolean;
  observersLoading: boolean;
}

export function StatsStrip({
  myRooms,
  reactions,
  observers,
  myRoomsLoading,
  reactionsLoading,
  observersLoading,
}: StatsStripProps) {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  // Active rooms calculation
  const activeRoomsCount = myRooms.filter(r => r.status === 'active').length;
  const activeRoomsThisWeek = myRooms.filter(r => r.status === 'active' && new Date(r.createdAt || r.created_at) >= oneWeekAgo).length;
  const activeRoomsDelta = activeRoomsThisWeek > 0 ? `↑ ${activeRoomsThisWeek} this week` : '0 new this week';

  // Total reactions calculation
  const totalReactions = reactions.length;
  const reactionsTodayCount = reactions.filter((re: any) => new Date(re.created_at) >= oneDayAgo).length;
  const reactionsDelta = reactionsTodayCount > 0 ? `↑ ${reactionsTodayCount} today` : '0 new today';

  // Observers calculation
  const totalObservers = myRooms.reduce((sum, r) => sum + (r.observerCount || 0), 0);
  const observersThisWeekCount = observers.filter((ob: any) => new Date(ob.created_at) >= oneWeekAgo).length;
  const observersDelta = observersThisWeekCount > 0 ? `↑ ${observersThisWeekCount} new` : '0 new';

  // Build logs calculation
  const totalBuildLogs = myRooms.reduce((sum, r) => sum + (r.updateCount || 0), 0);
  const completedRooms = myRooms.filter(r => r.status === 'completed').length;
  const completedRoomsThisWeek = myRooms.filter(r => r.status === 'completed' && new Date(r.createdAt || r.created_at) >= oneWeekAgo).length;
  const buildLogsDelta = completedRoomsThisWeek > 0 ? `↑ ${completedRoomsThisWeek} this week` : `${completedRooms} completed`;

  const stats = [
    {
      label: 'active rooms',
      value: activeRoomsCount,
      delta: activeRoomsDelta,
      deltaColor: 'text-emerald-400',
      numColor: 'text-[#8B7CF8]',
      loading: myRoomsLoading,
    },
    {
      label: 'total reactions',
      value: totalReactions,
      delta: reactionsDelta,
      deltaColor: 'text-amber-400',
      numColor: 'text-white',
      loading: reactionsLoading,
    },
    {
      label: 'observers',
      value: totalObservers,
      delta: observersDelta,
      deltaColor: 'text-emerald-400',
      numColor: 'text-white',
      loading: myRoomsLoading || observersLoading,
    },
    {
      label: 'build logs',
      value: totalBuildLogs,
      delta: buildLogsDelta,
      deltaColor: 'text-slate-400',
      numColor: 'text-white',
      loading: myRoomsLoading,
    },
  ];

  return (
    <div className="xl:col-span-3 flex overflow-x-auto snap-x snap-mandatory gap-4 sm:grid sm:grid-cols-2 xl:grid-cols-4 gap-5 sm:overflow-visible">
      {stats.map((s, i) => (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
          key={s.label} 
          className="bg-[#0D0B14] border border-white/[0.08] rounded-[16px] p-5 flex min-h-[120px] flex-col justify-between group hover:bg-white/[0.03] transition-colors cursor-default min-w-[150px] shrink-0 snap-center sm:min-w-0 flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8]"
          tabIndex={0}
        >
          {s.loading ? (
            <div className="flex flex-col gap-3 w-full">
              <div className="h-8 w-12 bg-white/5 rounded animate-pulse" />
              <div className="text-[13px] text-slate-400 lowercase font-mono font-medium">
                {s.label}
              </div>
              <div className="h-4 w-16 bg-white/5 rounded animate-pulse mt-1" />
            </div>
          ) : (
            <>
              <div className={`font-bold text-[30px] tracking-tight leading-none ${s.numColor}`}>
                {s.value}
              </div>
              <div className="text-[13px] text-slate-400 lowercase mt-2 font-mono font-medium">
                {s.label}
              </div>
              <div className={`text-[12px] font-bold mt-2 ${s.deltaColor}`}>
                {s.delta}
              </div>
            </>
          )}
        </motion.div>
      ))}
    </div>
  );
}
