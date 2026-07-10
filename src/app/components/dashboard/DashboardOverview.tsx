import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Hammer, ArrowRight, Sparkles, Users } from "lucide-react";
import { ActiveRoomsList } from "./ActiveRoomsList";
import { RecentActivityList } from "./RecentActivityList";
import { TopObservers, LinkedDocsPanel, ObserverReactions } from "./OverviewInsights";
import { ActiveRoomPanel } from "./ActiveRoomPanel";
import { PendingDraftsList } from "./PendingDraftsList";
import { RequestsAndInvites } from "./RequestsAndInvites";
import { DashboardAchievements } from "./DashboardAchievements";
import { useRecentActivity, useRoomObservers } from "../../hooks/useDashboardStats";

interface DashboardOverviewProps {
  user: any;
  allMyRooms: any[];
  myRoomsLoading: boolean;
  observedRoomsLoading: boolean;
  setTab: (tab: 'overview' | 'feed' | 'mine') => void;
  selectedRoomId: string;
  setSelectedRoomId: (id: string) => void;
  reactions: any[];
  queryClient: any;
}

export function DashboardOverview({
  user,
  allMyRooms,
  myRoomsLoading,
  observedRoomsLoading,
  setTab,
  selectedRoomId,
  setSelectedRoomId,
  reactions,
  queryClient
}: DashboardOverviewProps) {
  const navigate = useNavigate();
  const { data: recentEventsData } = useRecentActivity(user?.id);
  const recentEvents = recentEventsData || [];

  const { data: roomObserversData } = useRoomObservers(selectedRoomId);
  const roomObservers = roomObserversData || [];

  const selectedRoomTitle = allMyRooms.find(r => r.id === selectedRoomId)?.title || 'Active Room';

  const isLoading = myRoomsLoading || observedRoomsLoading;
  const hasNoRooms = !isLoading && allMyRooms.length === 0;

  // Beautiful empty state for new builders
  if (hasNoRooms) {
    return (
      <div>
        <RequestsAndInvites />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col items-center justify-center text-center py-16 px-6"
        >
          {/* Illustration */}
          <div className="relative mb-8">
            <div className="w-24 h-24 rounded-[28px] bg-primary-500/10 border-2 border-primary-200/50 flex items-center justify-center shadow-lg shadow-primary-100">
              <Hammer className="w-10 h-10 text-primary-400" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-amber-400/20 border border-amber-300/40 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <div className="absolute -bottom-2 -left-2 w-7 h-7 rounded-full bg-emerald-400/20 border border-emerald-300/40 flex items-center justify-center">
              <Users className="w-3.5 h-3.5 text-emerald-500" />
            </div>
          </div>

          <h2 className="text-[22px] sm:text-[26px] font-extrabold text-slate-900 mb-3 leading-tight">
            You haven't built anything publicly yet
          </h2>
          <p className="text-[14px] sm:text-[15px] text-slate-500 leading-relaxed max-w-[400px] mb-8">
            Create your first <strong className="text-slate-700">Room</strong> to start sharing your work. Rooms are your public build space — where ideas become progress, and progress attracts observers.
          </p>

          {/* CTA */}
          <button
            onClick={() => navigate('/dashboard/create')}
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-primary-500 hover:bg-primary-600 text-white text-[14px] font-extrabold rounded-2xl shadow-lg shadow-primary-200/50 transition-all hover:scale-105 active:scale-95 mb-4"
          >
            <Hammer className="w-4 h-4" />
            Create your first Room
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setTab('feed')}
            className="text-[13px] font-bold text-slate-400 hover:text-primary-500 transition-colors"
          >
            Or explore what others are building →
          </button>

          {/* Social proof row */}
          <div className="mt-10 flex items-center gap-6 text-center">
            {[
              { label: "Builders", value: "500+" },
              { label: "Updates shared", value: "12k+" },
              { label: "Reactions given", value: "48k+" },
            ].map(stat => (
              <div key={stat.label}>
                <p className="text-[18px] font-extrabold text-slate-900">{stat.value}</p>
                <p className="text-[11px] text-slate-400 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div>
      <RequestsAndInvites />
      <PendingDraftsList />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8">
        <div className="flex flex-col gap-8">
          <ActiveRoomsList
            rooms={allMyRooms}
            loading={myRoomsLoading || observedRoomsLoading}
            setTab={setTab}
            selectedRoomId={selectedRoomId}
            setSelectedRoomId={setSelectedRoomId}
          />
          <RecentActivityList
            recentEvents={recentEvents}
            roomObservers={roomObservers}
            selectedRoomTitle={selectedRoomTitle}
          />
          <TopObservers />
          <LinkedDocsPanel />
        </div>
        <div className="flex flex-col gap-8">
          <ActiveRoomPanel
            user={user}
            room={allMyRooms.find(r => r.id === selectedRoomId) || allMyRooms[0]}
            reactions={reactions}
            queryClient={queryClient}
          />
          <DashboardAchievements user={user} />
          <ObserverReactions />
        </div>
      </div>
    </div>
  );
}
