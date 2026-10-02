import { useState, useEffect } from 'react';
import { supabase, useAuth } from '../auth/AuthContext';

interface PollOption {
  id: string;
  poll_id: string;
  option_text: string;
}

interface Poll {
  id: string;
  question: string;
  poll_options: PollOption[];
}

export function PollWidget({ poll }: { poll: Poll }) {
  const { user } = useAuth();
  const [votes, setVotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserVoteId, setCurrentUserVoteId] = useState<string | null>(null);

  useEffect(() => {
    fetchVotes();
  }, [poll.id]);

  const fetchVotes = async () => {
    try {
      const { data } = await supabase
        .from('poll_votes')
        .select('*')
        .eq('poll_id', poll.id);
        
      if (data) {
        setVotes(data);
        if (user) {
          const userVote = data.find(v => v.user_id === user.id);
          if (userVote) setCurrentUserVoteId(userVote.poll_option_id);
        }
      }
    } catch (e) {
      console.error('Error fetching poll votes', e);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (optionId: string) => {
    if (!user) return;
    
    // Optimistic update
    setCurrentUserVoteId(optionId);
    
    try {
      await supabase.rpc('vote_on_poll', {
        p_poll_id: poll.id,
        p_poll_option_id: optionId,
      });
      fetchVotes();
    } catch (e) {
      console.error('Error voting on poll', e);
      fetchVotes();
    }
  };

  const totalVotes = votes.length;

  return (
    <div className="mt-3 p-4 rounded-[16px] bg-slate-50/50 dark:bg-[#1a1a1a]/50 border border-slate-200/60 dark:border-white/10">
      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">{poll.question}</h4>
      
      <div className="flex flex-col gap-2">
        {poll.poll_options?.map((opt) => {
          const optionVotes = votes.filter(v => v.poll_option_id === opt.id).length;
          const percentage = totalVotes > 0 ? (optionVotes / totalVotes) * 100 : 0;
          const isSelected = currentUserVoteId === opt.id;
          const hasVoted = currentUserVoteId !== null || totalVotes > 0;

          return (
            <div 
              key={opt.id}
              onClick={() => handleVote(opt.id)}
              className={`relative h-10 w-full rounded-lg border overflow-hidden cursor-pointer transition-all ${
                isSelected 
                  ? 'border-indigo-500/50 dark:border-indigo-400/50' 
                  : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
              }`}
            >
              {/* Background Progress Bar */}
              {hasVoted && (
                <div 
                  className={`absolute inset-y-0 left-0 transition-all duration-500 ease-out ${
                    isSelected 
                      ? 'bg-indigo-500/10 dark:bg-indigo-500/20' 
                      : 'bg-slate-200/50 dark:bg-white/5'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              )}
              
              {/* Content */}
              <div className="absolute inset-0 flex items-center justify-between px-3">
                <span className={`text-sm z-10 font-medium truncate pr-4 ${
                  isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'
                }`}>
                  {opt.option_text}
                </span>
                
                {hasVoted && (
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 z-10 shrink-0">
                    {Math.round(percentage)}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-3 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
        {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
      </div>
    </div>
  );
}
