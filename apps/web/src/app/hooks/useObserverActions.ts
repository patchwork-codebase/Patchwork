import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../components/auth/AuthContext";
import { toast } from "sonner";

export function useFollowRoom(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roomId: string) => {
      if (!userId) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("room_observers")
        .upsert({ room_id: roomId, observer_id: userId });
      if (error) throw error;
      return roomId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["observed-rooms", userId] });
    },
    onError: (err: any) => {
      toast.error(`Failed to follow room: ${err.message || err}`);
    }
  });
}

export function useToggleReaction(userId: string | undefined, userName: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      updateId,
      roomId,
      type,
      currentReactions
    }: {
      updateId: string;
      roomId: string;
      type: "sharp" | "pushback" | "tellmemore";
      currentReactions: any[];
    }) => {
      if (!userId) throw new Error("Not authenticated");
      const existing = currentReactions?.find((r) => r.type === type && r.observerId === userId);

      if (existing) {
        const { error } = await supabase.from("reactions").delete().eq("id", existing.id);
        if (error) throw error;
      } else {
        // Remove other reactions on this update by this user first
        const others = currentReactions?.filter((r) => r.observerId === userId && r.type !== type);
        for (const o of others) await supabase.from("reactions").delete().eq("id", o.id);

        const { error } = await supabase.from("reactions").insert({
          id: `${roomId}-reaction-${type}-${userId}-${Date.now()}`,
          room_id: roomId,
          update_id: updateId,
          observer_id: userId,
          observer_name: userName || "Observer",
          type,
          text: type,
          created_at: new Date().toISOString(),
        });
        if (error) throw error;
      }
      return { updateId, type, existing: !!existing };
    },
    onSuccess: (data) => {
      if (!data.existing) toast.success("Taste signal recorded!");
      queryClient.invalidateQueries({ queryKey: ["feed-updates-v2"] });
      queryClient.invalidateQueries({ queryKey: ["observer-stats", userId] });
    },
    onError: (err: any) => {
      toast.error(`Failed to update reaction: ${err.message || err}`);
    }
  });
}
