import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../auth/AuthContext";
import { useObservedRooms } from "../../hooks/useRooms";
import { motion } from "motion/react";
import { Compass, EyeOff, Search } from "lucide-react";
import { timeAgo } from "../../utils/helpers";
import { UserAvatar } from "../ui/UserAvatar";
import { toast } from "sonner";
import { supabase } from "../auth/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "../../constants";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";

export default function FollowedRoomsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [unfollowingId, setUnfollowingId] = useState<string | null>(null);

  const { data: observedRoomsData, isLoading } = useObservedRooms(user?.id);
  
  const rooms = observedRoomsData?.pages.flat() || [];

  const handleUnfollow = async (e: React.MouseEvent, roomId: string) => {
    e.stopPropagation();
    if (!user) return;
    
    setUnfollowingId(roomId);
    try {
      const { error } = await supabase
        .from("room_observers")
        .delete()
        .eq("room_id", roomId)
        .eq("observer_id", user.id);
      
      if (error) throw error;
      
      toast.success("Stopped following this room.");
      // Optimistically update
      queryClient.setQueryData(QUERY_KEYS.observedRooms(user.id), (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: any[]) => page.filter(r => r.id !== roomId))
        };
      });
      // Also invalidate stats
      queryClient.invalidateQueries({ queryKey: ["observer-stats", user.id] });
    } catch (err: any) {
      toast.error(`Failed to unfollow: ${err.message}`);
    } finally {
      setUnfollowingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] mx-auto w-full p-4 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[28px] sm:text-[32px] font-extrabold text-slate-900 font-display tracking-tight mb-2 flex items-center gap-2">
            Followed Rooms
          </h1>
          <p className="text-slate-500 text-[15px] max-w-2xl">
            Keep track of the builds you're observing.
          </p>
        </div>
        <Link
          to="/dashboard/explore"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all focus-ring whitespace-nowrap"
        >
          <Search className="w-4 h-4" />
          Discover more
        </Link>
      </div>

      {rooms.length === 0 ? (
        <div className="bg-white border border-slate-200 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary-500/10 text-primary-500 flex items-center justify-center mb-6">
            <Compass className="w-8 h-8" />
          </div>
          <h3 className="text-[20px] font-bold text-slate-900 mb-2">No followed rooms yet</h3>
          <p className="text-slate-500 text-[15px] max-w-md mx-auto mb-8">
            You aren't following any builds right now. Head over to the Explore page to discover interesting projects and start tracking their progress.
          </p>
          <Link
            to="/dashboard/explore"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white font-bold rounded-xl hover:bg-[#5b4ed6] shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
          >
            <Compass className="w-5 h-5" />
            Explore Builders
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {rooms.map((room) => (
              <div 
                key={room.id}
                onClick={() => navigate(`/dashboard/room/${room.id}`)}
                className="p-4 sm:p-5 hover:bg-slate-50 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center gap-4 group"
              >
                {/* Builder Info */}
                <div 
                  className="flex items-center gap-3 w-full sm:w-[250px] shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/dashboard/profile/${room.builderId}`);
                  }}
                >
                  <UserAvatar 
                    userId={room.builderId}
                    name={room.builderName || ''}
                    avatarUrl={room.builderAvatarUrl}
                    className="w-10 h-10 rounded-full object-cover shrink-0 hover:ring-2 hover:ring-primary-400 transition-all cursor-pointer"
                  />
                  <div className="min-w-0 flex-1 hover:underline cursor-pointer">
                    <div className="font-bold text-slate-900 text-[15px] truncate">
                      {room.builderName}
                    </div>
                    {room.builderOrgName && (
                      <div className="text-[12px] text-slate-500 truncate">
                        {room.builderOrgName}
                      </div>
                    )}
                  </div>
                </div>

                {/* Room Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[16px] text-slate-900 truncate mb-1 group-hover:text-primary-600 transition-colors">
                    {room.title}
                  </div>
                  <div className="text-[13px] text-slate-500 line-clamp-1">
                    {room.description || "No description provided."}
                  </div>
                </div>

                {/* Last Activity & Action */}
                <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 mt-2 sm:mt-0">
                  <div className="text-[13px] text-slate-500 flex flex-col items-start sm:items-end">
                    <span className="font-medium text-slate-700">
                      {room.latestUpdate ? 'Updated ' + timeAgo(room.latestUpdate.createdAt) : 'No updates yet'}
                    </span>
                    <span className="text-[12px]">Last activity</span>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button 
                        onClick={(e) => e.stopPropagation()}
                        disabled={unfollowingId === room.id}
                        className="w-9 h-9 flex items-center justify-center rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors disabled:opacity-50"
                        title="Unfollow"
                      >
                        {unfollowingId === room.id ? (
                          <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent onClick={(e) => e.stopPropagation()} className="bg-white border border-slate-200 sm:rounded-[24px]">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-[20px] font-display font-bold">Unfollow room?</AlertDialogTitle>
                        <AlertDialogDescription>
                          You will no longer receive updates from <span className="font-bold text-slate-700">{room.title}</span> on your feed.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={(e) => handleUnfollow(e as unknown as React.MouseEvent, room.id)} 
                          className="bg-rose-500 text-white hover:bg-rose-600"
                        >
                          Unfollow
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
