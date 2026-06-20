import { ProductRoomStats } from "./ProductRoomStats";
import { DecisionLogCard } from "./DecisionLogCard";
import { MilestoneTrackerCard } from "./MilestoneTrackerCard";

export function RoomOverviewTab({ room, id, user, reactions, queryClient, isBuilder }: any) {
  return (
    <div className="mt-2">
      {(room.tags?.includes('product') || room.tags?.includes('product-management') || room.builderDomain?.toLowerCase() === 'product') && (
        <ProductRoomStats roomId={id!} reactionsCount={reactions.length} roomCreatedAt={room.created_at || room.createdAt || new Date().toISOString()} />
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 mt-4">
        <DecisionLogCard roomId={id!} user={user} reactions={reactions} queryClient={queryClient} isBuilder={isBuilder} />
        <MilestoneTrackerCard roomId={id!} user={user} reactions={reactions} queryClient={queryClient} />
      </div>
    </div>
  );
}
