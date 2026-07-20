import React, { useMemo } from 'react';
import { useProofOfWork } from '../../hooks/useProofOfWork';
import { BadgeCard } from '../ui/BadgeCard';
import { Award, Target, Trophy, Clock, Zap, ChevronRight, Activity } from 'lucide-react';
import { timeAgo } from '../../utils/helpers';
import { Badge } from '../../types/pow';

export function ProofOfWorkDashboard({ userId, totalReputation = 0 }: { userId: string, totalReputation?: number }) {
  const { allBadges, userBadges, reputationEvents, loading, calculateLevel } = useProofOfWork(userId);

  const levelInfo = useMemo(() => calculateLevel(totalReputation, allBadges), [totalReputation, allBadges, calculateLevel]);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-[32px] p-8 animate-pulse space-y-6">
        <div className="h-8 bg-slate-200 rounded-lg w-1/4"></div>
        <div className="h-32 bg-slate-100 rounded-2xl w-full"></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
          <div className="h-32 bg-slate-100 rounded-[24px]"></div>
          <div className="h-32 bg-slate-100 rounded-[24px]"></div>
        </div>
      </div>
    );
  }

  // Filter out 'level' badges from achievements grid, we just want actual achievements & recognitions
  const achievementBadges = allBadges?.filter(b => b.badge_type !== 'level') || [];
  
  return (
    <div className="space-y-8 mt-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
          <Trophy className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-[20px] font-extrabold text-slate-900 font-display">Proof of Work</h2>
          <p className="text-[13px] text-slate-500 font-medium">Verifiable builder reputation and achievements</p>
        </div>
      </div>

      {/* Level & Score Card */}
      <div className="bg-white border border-slate-200 rounded-[32px] p-6 sm:p-8 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] -z-10 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start justify-between">
          <div className="flex-1 w-full space-y-6">
            <div className="flex items-center gap-4">
              {levelInfo?.currentLevel && (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white shrink-0">
                  <Award className="w-8 h-8" />
                </div>
              )}
              <div>
                <div className="text-[12px] font-bold text-indigo-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> 
                  Level {levelInfo?.currentLevel ? levelInfo.currentLevel.title : 'New Builder'}
                </div>
                <div className="text-[32px] font-extrabold text-slate-900 leading-none">
                  {totalReputation.toLocaleString()} <span className="text-[16px] text-slate-400 font-medium">REP</span>
                </div>
              </div>
            </div>

            {levelInfo?.nextLevel && (
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-[13px] font-bold">
                  <span className="text-slate-500">Progress to {levelInfo.nextLevel.title}</span>
                  <span className="text-indigo-600">{Math.floor(levelInfo.progress)}%</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden w-full relative border border-slate-200/50">
                  <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out"
                    style={{ width: `${levelInfo.progress}%` }}
                  />
                </div>
                <p className="text-[12px] text-slate-400 font-medium">
                  {levelInfo.pointsToNext.toLocaleString()} points until next level
                </p>
              </div>
            )}
          </div>
          
          {/* Current Level Badge display if exists */}
          {levelInfo?.currentLevel && (
            <div className="shrink-0 scale-110 hidden md:block">
               <BadgeCard badge={levelInfo.currentLevel} userBadge={{ id: 'current', user_id: userId, badge_id: levelInfo.currentLevel.id, verified: true, issued_at: new Date().toISOString() }} />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Badges Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[16px] font-extrabold text-slate-900 flex items-center gap-2">
              <Target className="w-4 h-4 text-slate-400" /> Achievements
            </h3>
            <span className="text-[12px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
              {userBadges?.filter(ub => ub.badge?.badge_type !== 'level').length || 0} / {achievementBadges.length}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {achievementBadges.map(badge => {
              const userEarned = userBadges?.find(ub => ub.badge_id === badge.id);
              return (
                <BadgeCard key={badge.id} badge={badge} userBadge={userEarned} />
              );
            })}
          </div>
        </div>

        {/* Proof Timeline Section */}
        <div className="lg:col-span-1 space-y-6">
          <h3 className="text-[16px] font-extrabold text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-400" /> Proof Timeline
          </h3>

          <div className="bg-white border border-slate-200 rounded-[24px] p-5">
            {reputationEvents && reputationEvents.length > 0 ? (
              <div className="space-y-5">
                {reputationEvents.map((event, index) => (
                  <div key={event.id} className="relative pl-5 group">
                    {/* Timeline connector */}
                    {index !== reputationEvents.length - 1 && (
                      <div className="absolute left-[7px] top-6 bottom-[-20px] w-0.5 bg-slate-100" />
                    )}
                    {/* Timeline dot */}
                    <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-white bg-indigo-100 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    </div>

                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-[13px] font-bold text-slate-700 leading-tight">
                          {formatActionType(event.action_type)}
                        </span>
                        <span className="text-[12px] font-bold text-emerald-500 bg-emerald-50 px-1.5 rounded flex-shrink-0">
                          +{event.points}
                        </span>
                      </div>
                      <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {timeAgo(event.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-[13px] font-medium">No reputation events yet.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// Helper to format raw action_types into readable strings
function formatActionType(type: string) {
  switch (type) {
    case 'create_room': return 'Created a new Build Room';
    case 'publish_log': return 'Published a Build Log';
    case 'document_decision': return 'Documented a decision';
    case 'receive_reaction': return 'Received a reaction';
    case 'expert_review': return 'Completed an expert review';
    case 'milestone_completed': return 'Completed a milestone';
    default:
      return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
}
