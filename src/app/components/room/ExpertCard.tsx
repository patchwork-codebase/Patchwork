
import { BadgeCheck, Star, Clock, Briefcase, ChevronRight } from 'lucide-react';

export interface ExpertProfile {
  id: string;
  name: string;
  avatar: string;
  title: string;
  company: string;
  domains: string[];
  reviewsCompleted: number;
  rating: number;
  activeSlots: number;
  monthlySlots: number;
  typicalResponseTime: string;
}

interface ExpertCardProps {
  expert: ExpertProfile;
  onSelect?: (expert: ExpertProfile) => void;
  selected?: boolean;
}

export default function ExpertCard({ expert, onSelect, selected }: ExpertCardProps) {
  const isUnavailable = expert.activeSlots <= 0;
  
  return (
    <div 
      className={`relative rounded-2xl p-5 border transition-all duration-300 ${
        selected 
          ? 'bg-primary/5 border-primary shadow-[0_0_20px_rgba(108,92,231,0.15)]' 
          : 'bg-ink-80 border-white/10 hover:border-white/20'
      } ${isUnavailable ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
      onClick={() => !isUnavailable && onSelect?.(expert)}
    >
      {selected && (
        <div className="absolute top-4 right-4 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
          <BadgeCheck className="w-4 h-4 text-white" />
        </div>
      )}

      <div className="flex items-start gap-4 mb-4">
        <div className="relative">
          {expert.avatar ? (
            <img loading="lazy" src={expert.avatar} alt={expert.name} className="w-14 h-14 rounded-full object-cover border border-white/10" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
              {expert.name.charAt(0)}
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
            <BadgeCheck className="w-4 h-4 text-blue-500" />
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            {expert.name}
          </h3>
          <p className="text-slate-400 text-sm flex items-center gap-1.5 mt-0.5">
            <Briefcase className="w-3.5 h-3.5" />
            {expert.title} {expert.company ? `at ${expert.company}` : ''}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {expert.domains.map(domain => (
          <span key={domain} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-slate-300">
            {domain}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-black/20 rounded-xl p-3 border border-white/5">
          <div className="flex items-center gap-1 text-yellow-500 mb-1">
            <Star className="w-4 h-4 fill-current" />
            <span className="font-bold text-sm">{expert.rating.toFixed(1)}</span>
          </div>
          <p className="text-xs text-slate-400">{expert.reviewsCompleted} reviews</p>
        </div>
        
        <div className="bg-black/20 rounded-xl p-3 border border-white/5">
          <div className="flex items-center gap-1 text-emerald-400 mb-1">
            <Clock className="w-4 h-4" />
            <span className="font-bold text-sm">{expert.typicalResponseTime}</span>
          </div>
          <p className="text-xs text-slate-400">Response time</p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-auto">
        <div className="flex flex-col">
          <span className="text-xs text-slate-400">Capacity</span>
          <span className={`text-sm font-semibold ${isUnavailable ? 'text-red-400' : (expert.activeSlots < 3 ? 'text-orange-400' : 'text-emerald-400')}`}>
            {isUnavailable ? 'Unavailable' : `${expert.activeSlots} slots open`}
          </span>
        </div>
        
        <button 
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            selected 
              ? 'bg-primary text-white' 
              : isUnavailable 
                ? 'bg-white/5 text-slate-500 cursor-not-allowed'
                : 'bg-white/10 text-white hover:bg-white/20'
          }`}
          disabled={isUnavailable}
        >
          {selected ? 'Selected' : (isUnavailable ? 'Full' : 'Select Expert')}
        </button>
      </div>
    </div>
  );
}
