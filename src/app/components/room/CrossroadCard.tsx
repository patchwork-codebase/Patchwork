import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Share2, MapPin, Zap, MessageCircle, AlertCircle, TrendingUp, Compass, ArrowRight, User } from 'lucide-react';
import { getAvatarUrl } from '../../utils/helpers';
import { UserAvatar } from '../ui/UserAvatar';
import { VerifiedTick } from '../ui/VerifiedTick';
import { supabase } from '../auth/AuthContext';
import { toast } from 'sonner';

interface CrossroadCardProps {
  update: any; // We'll just pass any for the mockup
}

export function CrossroadCard({ update }: CrossroadCardProps) {
  const queryClient = useQueryClient();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [rationale, setRationale] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { data: votes = [], isLoading } = useQuery({
    queryKey: ['crossroad_votes', update?.id],
    queryFn: async () => {
      if (!update?.id) return [];
      const { data, error } = await supabase
        .from('crossroad_votes')
        .select(`
          id, option_title, rationale, created_at, user_id,
          user:profiles(name, avatar_url, is_verified_expert, role)
        `)
        .eq('update_id', update.id)
        .order('created_at', { ascending: false });
        
      if (error && error.code !== '42P01') throw error;
      return data || [];
    },
    enabled: !!update?.id
  });

  const handleVote = (option: string) => {
    if (submitted) return;
    setSelectedOption(option);
  };

  const voteMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to vote');

      const { error } = await supabase
        .from('crossroad_votes')
        .insert({
          update_id: update.id,
          user_id: user.id,
          option_title: selectedOption,
          rationale: rationale.trim()
        });
        
      if (error) throw error;
      return { user };
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['crossroad_votes', update.id] });
      const previousVotes = queryClient.getQueryData(['crossroad_votes', update.id]);
      
      queryClient.setQueryData(['crossroad_votes', update.id], (old: any) => [
        {
          id: 'optimistic_' + Date.now(),
          option_title: selectedOption,
          rationale: rationale.trim(),
          user: { name: 'You', is_verified_expert: false }
        },
        ...(old || [])
      ]);
      
      return { previousVotes };
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(['crossroad_votes', update.id], context?.previousVotes);
      toast.error(`Failed to submit vote: ${err.message}`);
      setSubmitted(false);
    },
    onSuccess: () => {
      toast.success('Your rationale has been staked!');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['crossroad_votes', update.id] });
    }
  });

  const handleSubmit = () => {
    if (!rationale.trim() || !selectedOption || !update?.id) return;
    setSubmitted(true);
    voteMutation.mutate();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-[24px] p-4 sm:p-6 md:p-8 mb-6 shadow-sm relative group">
      <div className="relative z-10">
        
        {/* Header Label */}
        <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-5 flex-wrap gap-3">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-200">
                <Compass className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                 <h4 className="text-[11px] font-black tracking-widest uppercase text-slate-500 mb-0.5 flex items-center gap-1.5">
                   <TrendingUp className="w-3.5 h-3.5" /> Builder Crossroad
                 </h4>
                 <p className="text-[13px] text-slate-500 font-medium">Navigating a trade-off</p>
              </div>
           </div>
           <div className="text-[12px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200/60">
             Active Decision
           </div>
        </div>

        {/* Builder's Dilemma */}
        <div className="mb-8">
           <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 leading-snug">{update.content}</h3>
           <p className="text-slate-600 text-[15px] leading-relaxed mb-5">
             {update.crossroadData?.context || "I'm weighing two approaches for the architecture. Need some advice from the community."}
           </p>
           
           <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="shrink-0 w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center mt-0.5">
                 <AlertCircle className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                 <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">The Core Trade-off</h5>
                 <p className="text-[14px] text-slate-800 font-medium leading-relaxed">{update.crossroadData?.tradeoff || "Speed vs Scale. Do we ship faster but incur migration debt, or build it right and delay launch?"}</p>
              </div>
           </div>
        </div>

        {/* Voting Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
           {update.crossroadData?.options?.map((opt: any, idx: number) => {
             const isSelected = selectedOption === opt.title;
             const isOtherSelected = selectedOption && selectedOption !== opt.title;
             
             return (
               <button 
                 key={idx}
                 onClick={() => handleVote(opt.title)}
                 disabled={submitted}
                 className={`text-left p-5 rounded-2xl border transition-all duration-200 relative overflow-hidden group
                   ${isSelected ? 'bg-white border-slate-900 ring-1 ring-slate-900 shadow-md' : 
                     isOtherSelected ? 'bg-slate-50 border-slate-200 opacity-60 grayscale-[0.5]' : 
                     'bg-white border-slate-200 hover:border-slate-400 hover:shadow-sm'}`}
               >
                  <div className="flex items-start justify-between mb-3">
                     <span className={`text-[11px] font-bold uppercase tracking-widest ${isSelected ? 'text-slate-900' : 'text-slate-400'}`}>
                       Option {String.fromCharCode(65 + idx)}
                     </span>
                     {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-slate-900" />}
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-1.5">{opt.title}</h4>
                  <p className="text-[13.5px] text-slate-500 leading-relaxed line-clamp-2">{opt.description}</p>
               </button>
             );
           })}
        </div>

        {/* Action Area (Rationale Input) */}
        <div className={`transition-all duration-500 overflow-hidden ${selectedOption && !submitted ? 'max-h-[300px] opacity-100 mb-8' : 'max-h-0 opacity-0 mb-0'}`}>
           <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
              <label className="block text-[13px] font-medium text-slate-700 mb-3">
                You selected <span className="font-bold text-slate-900">{selectedOption}</span>. Stake your reputation by leaving a rationale:
              </label>
              <textarea
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                placeholder="Why is this the right choice? Provide expert insight..."
                maxLength={140}
                className="w-full bg-white border border-slate-300 rounded-xl p-4 text-slate-900 text-[14px] placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 resize-none h-24 mb-4 shadow-sm transition-all"
              />
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                 <span className="text-[12px] font-medium text-slate-400">{rationale.length}/140 chars</span>
                 <button 
                   onClick={handleSubmit}
                   disabled={rationale.length < 5 || voteMutation.isPending}
                   className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold text-[13px] px-6 py-2.5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
                 >
                   {voteMutation.isPending ? 'Staking...' : 'Stake Rationale'} <Zap className="w-3.5 h-3.5 fill-current" />
                 </button>
              </div>
           </div>
        </div>

        {/* Social Proof / Rationales */}
        <div className="border-t border-slate-100 pt-6">
           <div className="flex items-center justify-between mb-5">
             <h4 className="text-[13px] font-bold text-slate-800 flex items-center gap-2">
               <MessageCircle className="w-4 h-4 text-slate-400" /> Staked Rationales
             </h4>
             <span className="text-[12px] font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">{votes.length} Votes</span>
           </div>
           
           <div className="space-y-4">
              {isLoading && (
                 <div className="text-center py-4 text-slate-400 text-sm">Loading rationales...</div>
              )}
              {!isLoading && votes.length === 0 && !submitted && (
                 <p className="text-slate-400 text-[13px] font-medium bg-white border border-slate-200 border-dashed rounded-xl p-6 text-center">No rationales staked yet. Be the first to share your expertise!</p>
              )}
              {votes.map((r: any) => {
                const u = r.user || {};
                return (
                  <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                     <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 relative">
                          <UserAvatar userId={r.user_id} name={u.name || 'User'} avatarUrl={u.avatar_url || u.avatarUrl || u.avatar} />
                        </div>
                        <div>
                           <div className="flex items-center gap-1.5">
                              <span className="text-[13px] font-bold text-slate-900">{u.name || 'User'}</span>
                              {u.is_verified_expert && <VerifiedTick className="w-3.5 h-3.5" />}
                           </div>
                           <div className="text-[11px] text-slate-500 font-medium">{u.role || 'Observer'}</div>
                        </div>
                        <div className="ml-auto bg-slate-100 text-slate-600 text-[10px] font-bold uppercase px-2 py-1 rounded">
                          Voted {r.option_title}
                        </div>
                     </div>
                     <p className="text-[14px] text-slate-700 leading-relaxed">"{r.rationale}"</p>
                  </div>
                );
              })}
            </div>
        </div>

      </div>
    </div>
  );
}
