import { ProductRoomStats } from "./ProductRoomStats";
import { DecisionLogCard } from "./DecisionLogCard";
import { MilestoneTrackerCard } from "./MilestoneTrackerCard";
import { AiBuildDigestCard } from "./AiBuildDigestCard";
import type { Room } from "../../types";

interface RoomOverviewTabProps {
  room: Room;
  id: string;
  user: any;
  reactions: any[];
  queryClient: any;
  isBuilder: boolean;
  onPostAsUpdate?: (text: string) => void;
}

export function RoomOverviewTab({ room, id, user, reactions, queryClient, isBuilder, onPostAsUpdate }: RoomOverviewTabProps) {
  return (
    <div className="mt-2">
      <AiBuildDigestCard room={room} isBuilder={isBuilder} onPostAsUpdate={onPostAsUpdate} />
      
      {(room.tags?.includes('product') || room.tags?.includes('product-management') || (room as any).builderDomain?.toLowerCase() === 'product') && (
        <ProductRoomStats roomId={id!} reactionsCount={reactions.length} roomCreatedAt={room.createdAt || new Date().toISOString()} />
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 mt-4">
        <DecisionLogCard roomId={id!} user={user} reactions={reactions} queryClient={queryClient} isBuilder={isBuilder} />
        <MilestoneTrackerCard roomId={id!} user={user} reactions={reactions} queryClient={queryClient} />
      </div>
    </div>
  );
}
