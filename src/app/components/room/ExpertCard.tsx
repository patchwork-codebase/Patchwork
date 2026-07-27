
import { BadgeCheck, Star, Clock, Briefcase, ChevronRight } from 'lucide-react';
import { UserAvatar } from '../ui/UserAvatar';

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
  onProfileClick?: (expert: ExpertProfile) => void;
  selected?: boolean;
}

export default function ExpertCard({ expert, onSelect, onProfileClick, selected }: ExpertCardProps) {
  const isUnavailable = expert.activeSlots <= 0;
  
  return (
    <div 
      className={`relative rounded-2xl p-5 border transition-all duration-300 ${
        selected 
          ? 'bg-primary-500/10 border-primary-500 shadow-[0_0_20px_rgba(108,92,231,0.1)]' 
          : 'bg-transparent border-slate-800 hover:bg-slate-800/50 hover:border-primary-500/50 hover:shadow-sm'
      } cursor-pointer`}
      onClick={() => onProfileClick?.(expert)}
    >
      {selected && (
        <div className="absolute top-4 right-4 h-6 w-6 rounded-full bg-primary-500 flex items-center justify-center shadow-sm">
          <BadgeCheck className="w-4 h-4 text-white" />
        </div>
      )}

      <div className="flex items-start gap-4 mb-4">
        <div className="relative">
          {expert.avatar ? (
            <UserAvatar userId={expert.id} name={expert.name} avatarUrl={expert.avatar} className="w-14 h-14 rounded-full object-cover border border-slate-700" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-primary-600 flex items-center justify-center text-white font-bold text-xl shadow-sm">
              {expert.name.charAt(0)}
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 bg-slate-900 rounded-full p-0.5 shadow-sm border border-slate-800">
            <BadgeCheck className="w-4 h-4 text-blue-500" />
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-slate-100 font-bold text-lg flex items-center gap-2">
            {expert.name}
          </h3>
          <p className="text-slate-400 text-sm flex items-center gap-1.5 mt-0.5 font-medium">
            <Briefcase className="w-3.5 h-3.5" />
            {expert.title} {expert.company ? `at ${expert.company}` : ''}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {expert.domains.map(domain => (
          <span key={domain} className="px-2.5 py-1 rounded-lg bg-slate-800/50 border border-slate-700 text-xs font-semibold text-slate-300">
            {domain}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-slate-800/30 rounded-xl p-3 border border-slate-700/50">
          <div className="flex items-center gap-1 text-amber-500 mb-1">
            <Star className="w-4 h-4 fill-current" />
            <span className="font-bold text-sm text-slate-100">{expert.rating.toFixed(1)}</span>
          </div>
          <p className="text-xs font-medium text-slate-500">{expert.reviewsCompleted} reviews</p>
        </div>
        
        <div className="bg-slate-800/30 rounded-xl p-3 border border-slate-700/50">
          <div className="flex items-center gap-1 text-emerald-500 mb-1">
            <Clock className="w-4 h-4" />
            <span className="font-bold text-sm text-slate-100">{expert.typicalResponseTime}</span>
          </div>
          <p className="text-xs font-medium text-slate-500">Response time</p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-auto">
        <div className="flex flex-col">
          <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-0.5">Capacity</span>
          <span className={`text-sm font-bold ${isUnavailable ? 'text-red-500' : (expert.activeSlots < 3 ? 'text-amber-500' : 'text-emerald-500')}`}>
            {isUnavailable ? 'Unavailable' : `${expert.activeSlots} slots open`}
          </span>
        </div>
        
        <button 
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            selected 
              ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20' 
              : isUnavailable 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-slate-100'
          }`}
          disabled={isUnavailable}
          onClick={(e) => {
            e.stopPropagation();
            if (!isUnavailable) {
              onSelect?.(expert);
            }
          }}
        >
          {selected ? 'Selected' : (isUnavailable ? 'Full' : 'Select Expert')}
        </button>
      </div>
    </div>
  );
}
