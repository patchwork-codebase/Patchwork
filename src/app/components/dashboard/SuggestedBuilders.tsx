import { useState, useEffect } from "react";
import { Link } from "react-router";
import { supabase } from "../auth/AuthContext";
import { getAvatarUrl } from "../../utils/helpers";
import { Loader2, X } from "lucide-react";
import type { Profile } from "../../types";
import { useFollow } from "../../hooks/useFollow";
import { UserAvatar } from "../ui/UserAvatar";

export function SuggestedBuilders({ currentUserId }: { currentUserId?: string }) {
  const [builders, setBuilders] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const q = supabase.from('users').select('*').eq('role', 'builder').order('created_at', { ascending: false }).limit(15);
      if (currentUserId) q.neq('id', currentUserId);
      
      const { data, error } = await q;
      if (!error && data) {
        setBuilders((data as Profile[]).slice(0, 8));
      }
      setLoading(false);
    }
    load();
  }, [currentUserId]);

  const handleDismiss = (builderId: string) => {
    setBuilders(prev => prev.filter(b => b.id !== builderId));
  };

  if (loading) return null;
  if (builders.length === 0) return null;

  return (
    <div className="py-5 border-y border-slate-100 bg-white sm:rounded-2xl sm:border sm:my-4 sm:px-5">
      <div className="flex items-center justify-between mb-4 px-4 sm:px-0">
        <h3 className="font-display font-extrabold text-[15px] sm:text-[17px] text-slate-900">People to follow</h3>
        <Link to="/dashboard/explore" className="text-[13px] font-bold text-primary-500 hover:text-primary-600 transition-colors">See all</Link>
      </div>
      
      <div className="flex overflow-x-auto gap-3 snap-x snap-mandatory scrollbar-hide px-4 sm:px-0 pb-2">
        {builders.map(b => (
          <SuggestedBuilderCard 
            key={b.id} 
            builder={b} 
            currentUserId={currentUserId} 
            onDismiss={handleDismiss} 
          />
        ))}
      </div>
    </div>
  );
}

function SuggestedBuilderCard({
  builder,
  currentUserId,
  onDismiss,
}: {
  builder: Profile;
  currentUserId?: string;
  onDismiss: (id: string) => void;
}) {
  const { isFollowing, isLoading, toggleFollow } = useFollow(builder.id, currentUserId);

  return (
    <div className="snap-start shrink-0 w-[150px] border border-slate-200 rounded-[20px] p-4 flex flex-col items-center text-center bg-white relative transition-shadow hover:shadow-sm">
      <button 
        onClick={() => onDismiss(builder.id)}
        className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
      
      <div className="w-[60px] h-[60px] rounded-full overflow-hidden border border-slate-100 mb-3 mt-1">
        <UserAvatar userId={builder.id} name={builder.name} avatarUrl={builder.avatar || builder.avatarUrl} className="w-full h-full object-cover" />
      </div>
      
      <div className="text-[13px] font-bold text-slate-900 truncate w-full mb-0.5">
        {builder.name || builder.email.split('@')[0]}
      </div>
      
      <div className="text-[11px] text-slate-500 line-clamp-2 h-8 leading-snug mb-3 w-full">
        {builder.organizationName ? `Builder at ${builder.organizationName}` : builder.bio || 'Builder on Patchwork'}
      </div>
      
      <button 
        onClick={toggleFollow}
        disabled={isLoading}
        className={`w-full py-2 rounded-xl text-[13px] font-bold transition-all flex items-center justify-center gap-1.5 ${
          isFollowing 
            ? 'bg-slate-100 text-slate-700' 
            : 'bg-primary-500 text-white hover:bg-primary-600'
        }`}
      >
        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isFollowing ? 'Following' : 'Follow'}
      </button>
    </div>
  );
}
