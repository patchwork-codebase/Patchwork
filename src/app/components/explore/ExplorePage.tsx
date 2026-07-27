import { useState, useEffect, useMemo } from "react";
import { Compass } from "lucide-react";
import { useRooms } from "../../hooks/useRooms";
import { RoomCard } from "../room/RoomCard";
import { ExploreCategories } from "./ExploreCategories";
import { ExploreSearch } from "./ExploreSearch";
import { EXPLORE_CATEGORIES } from "../../constants";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data, isLoading } = useRooms(debouncedSearch, selectedCategory);

  // useRooms is an infinite query, so data.pages contains the arrays of rooms
  const rooms = useMemo(() => data?.pages.flat() ?? [], [data?.pages]);

  return (
    <div className="max-w-[1080px] w-full mx-auto px-4 sm:px-6 py-12 relative overflow-hidden">
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[380px] h-[380px] sm:w-[600px] sm:h-[600px] bg-primary-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="mb-10 text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-500/10 border border-primary-500/20 rounded-full mb-4 mx-auto">
          <Compass className="w-3.5 h-3.5 text-primary-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary-400">Directory</span>
        </div>
        <h1 className="text-5xl sm:text-[40px] font-extrabold text-slate-100 font-display tracking-tight leading-tight mb-3">
          Explore <span className="text-primary-400">Builders</span>
        </h1>
        <p className="text-[15px] text-slate-400 font-medium max-w-lg mx-auto mb-8">
          Discover builders working in the open across Patchwork. Find inspiration and follow their progress.
        </p>

        <ExploreSearch value={searchQuery} onChange={setSearchQuery} />
      </div>

      <div className="mb-8 flex justify-center">
        <ExploreCategories
          categories={[...EXPLORE_CATEGORIES]}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 h-[200px] animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-700" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-700 rounded w-1/2" />
                  <div className="h-3 bg-slate-700 rounded w-1/3" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-slate-700 rounded w-full" />
                <div className="h-3 bg-slate-700 rounded w-4/5" />
              </div>
            </div>
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="bg-transparent border border-slate-800 rounded-[32px] px-6 py-16 text-center backdrop-blur-md">
          <p className="text-slate-100 font-bold text-lg">No active rooms found</p>
          <p className="text-slate-400 text-sm mt-2">Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      )}
    </div>
  );
}
