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
  const { data: recentEventsData } = useRecentActivity(user?.id);
  const recentEvents = recentEventsData || [];

  const { data: roomObserversData } = useRoomObservers(selectedRoomId);
  const roomObservers = roomObserversData || [];

  const selectedRoomTitle = allMyRooms.find(r => r.id === selectedRoomId)?.title || 'Active Room';

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
