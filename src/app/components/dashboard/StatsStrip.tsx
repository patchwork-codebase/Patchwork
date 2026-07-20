import { motion } from "motion/react";
import { getObserverCount } from "../../utils/helpers";
import { Activity, MessageSquare, Users, FileText, Bookmark, Zap, Rocket } from "lucide-react";

interface StatsStripProps {
  myRooms: any[];
  reactions: any[];
  observers: any[];
  myRoomsLoading: boolean;
  reactionsLoading: boolean;
  observersLoading: boolean;
  isObserver?: boolean;
  observerStats?: {
    roomsFollowed: number;
    totalReactions: number;
    sharpInsights: number;
    shippedProducts: number;
  };
  observerStatsLoading?: boolean;
}

export function StatsStrip({
  myRooms,
  reactions,
  observers,
  myRoomsLoading,
  reactionsLoading,
  observersLoading,
  isObserver = false,
  observerStats,
  observerStatsLoading = false,
}: StatsStripProps) {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  // Active rooms calculation (Builder)
  const activeRoomsCount = myRooms.filter(r => r.status === 'active').length;
  const activeRoomsThisWeek = myRooms.filter(r => r.status === 'active' && new Date(r.createdAt || r.created_at) >= oneWeekAgo).length;
  const activeRoomsDelta = activeRoomsThisWeek > 0 ? `↑ ${activeRoomsThisWeek} this week` : '0 new this week';

  // Total reactions calculation (Builder)
  const totalReactions = reactions.length;
  const reactionsTodayCount = reactions.filter((re: any) => new Date(re.created_at) >= oneDayAgo).length;
  const reactionsDelta = reactionsTodayCount > 0 ? `↑ ${reactionsTodayCount} today` : '0 new today';

  // Observers calculation (Builder)
  const totalObservers = myRooms.reduce((sum, r) => sum + getObserverCount(r), 0);
  const observersThisWeekCount = observers.filter((ob: any) => new Date(ob.created_at) >= oneWeekAgo).length;
  const observersDelta = observersThisWeekCount > 0 ? `↑ ${observersThisWeekCount} new` : '0 new';

  // Build logs calculation (Builder)
  const totalBuildLogs = myRooms.reduce((sum, r) => sum + (r.updateCount || 0), 0);
  const completedRooms = myRooms.filter(r => r.status === 'completed').length;
  const completedRoomsThisWeek = myRooms.filter(r => r.status === 'completed' && new Date(r.createdAt || r.created_at) >= oneWeekAgo).length;
  const buildLogsDelta = completedRoomsThisWeek > 0 ? `↑ ${completedRoomsThisWeek} this week` : `${completedRooms} completed`;

  const stats = isObserver
    ? [
        {
          label: 'followed rooms',
          value: observerStats?.roomsFollowed ?? 0,
          delta: 'tracking progress',
          deltaColor: 'text-primary-600',
          deltaBg: 'bg-primary-50',
          deltaBorder: 'border-primary-100',
          numColor: 'text-slate-900',
          icon: Bookmark,
          iconColor: 'text-primary-400',
          loading: observerStatsLoading,
        },
        {
          label: 'reactions given',
          value: observerStats?.totalReactions ?? 0,
          delta: 'insights shared',
          deltaColor: 'text-amber-600',
          deltaBg: 'bg-amber-50',
          deltaBorder: 'border-amber-100',
          numColor: 'text-slate-900',
          icon: MessageSquare,
          iconColor: 'text-amber-400',
          loading: observerStatsLoading,
        },
        {
          label: 'sharp critiques',
          value: observerStats?.sharpInsights ?? 0,
          delta: '⚡ high signal',
          deltaColor: 'text-purple-600',
          deltaBg: 'bg-purple-50',
          deltaBorder: 'border-purple-100',
          numColor: 'text-slate-900',
          icon: Zap,
          iconColor: 'text-purple-400',
          loading: observerStatsLoading,
        },
        {
          label: 'shipped products',
          value: observerStats?.shippedProducts ?? 0,
          delta: 'witnessed launches',
          deltaColor: 'text-emerald-600',
          deltaBg: 'bg-emerald-50',
          deltaBorder: 'border-emerald-100',
          numColor: 'text-slate-900',
          icon: Rocket,
          iconColor: 'text-emerald-400',
          loading: observerStatsLoading,
        },
      ]
    : [
        {
          label: 'active rooms',
          value: activeRoomsCount,
          delta: activeRoomsDelta,
          deltaColor: 'text-emerald-600',
          deltaBg: 'bg-emerald-50',
          deltaBorder: 'border-emerald-100',
          numColor: 'text-slate-900',
          icon: Activity,
          iconColor: 'text-primary-500',
          loading: myRoomsLoading,
        },
        {
          label: 'total reactions',
          value: totalReactions,
          delta: reactionsDelta,
          deltaColor: 'text-amber-600',
          deltaBg: 'bg-amber-50',
          deltaBorder: 'border-amber-100',
          numColor: 'text-slate-900',
          icon: MessageSquare,
          iconColor: 'text-amber-500',
          loading: reactionsLoading,
        },
        {
          label: 'observers',
          value: totalObservers,
          delta: observersDelta,
          deltaColor: 'text-emerald-600',
          deltaBg: 'bg-emerald-50',
          deltaBorder: 'border-emerald-100',
          numColor: 'text-slate-900',
          icon: Users,
          iconColor: 'text-emerald-500',
          loading: myRoomsLoading || observersLoading,
        },
        {
          label: 'build logs',
          value: totalBuildLogs,
          delta: buildLogsDelta,
          deltaColor: 'text-slate-600',
          deltaBg: 'bg-slate-100',
          deltaBorder: 'border-slate-200',
          numColor: 'text-slate-900',
          icon: FileText,
          iconColor: 'text-slate-400',
          loading: myRoomsLoading,
        },
      ];

  return (
    <div className="h-fit self-start flex overflow-x-auto snap-x snap-mandatory gap-4 sm:grid sm:grid-cols-2 xl:grid-cols-4 sm:gap-5 sm:overflow-visible pb-2 sm:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {stats.map((s, i) => (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
          key={s.label} 
          className="bg-white border border-slate-200 rounded-[20px] p-5 flex min-h-[140px] flex-col justify-between group hover:border-primary-200 hover:shadow-md transition-all cursor-default min-w-[160px] shrink-0 snap-center sm:min-w-0 flex-1 focus-ring relative overflow-hidden"
          tabIndex={0}
        >
          {/* Subtle background gradient on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

          {s.loading ? (
            <div className="flex flex-col gap-3 w-full relative z-10">
              <div className="flex justify-between items-start w-full">
                <div className="h-4 w-20 bg-slate-100 rounded animate-pulse" />
                <div className="w-8 h-8 rounded-full bg-slate-50 animate-pulse" />
              </div>
              <div className="h-10 w-16 bg-slate-100 rounded animate-pulse mt-2" />
              <div className="h-5 w-24 bg-slate-100 rounded-full animate-pulse mt-3" />
            </div>
          ) : (
            <div className="flex flex-col h-full relative z-10">
              <div className="flex justify-between items-start w-full mb-3">
                <div className="text-[12px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                  {s.label}
                </div>
                {s.icon && (
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center bg-slate-50 border border-slate-100 group-hover:bg-white group-hover:shadow-sm transition-all ${s.iconColor}`}>
                    <s.icon strokeWidth={2.5} size={16} />
                  </div>
                )}
              </div>
              <div className={`font-black text-[36px] font-display tracking-tight leading-none mb-4 ${s.numColor}`}>
                {s.value}
              </div>
              <div className="mt-auto">
                <span className={`inline-flex items-center text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide border ${s.deltaBg} ${s.deltaColor} ${s.deltaBorder}`}>
                  {s.delta}
                </span>
              </div>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
