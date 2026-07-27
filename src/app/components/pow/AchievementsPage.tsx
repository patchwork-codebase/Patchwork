import React from 'react';
import { motion } from 'motion/react';
import { Award, Medal, Trophy, Star, ArrowUpRight, Hexagon, Linkedin, Users, Home, TrendingUp, Bug, Lock } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { Link } from 'react-router';
import { useProfile } from '../../hooks/useProfile';
import { useProofOfWork } from '../../hooks/useProofOfWork';
import { generateLinkedInCertUrl } from '../../utils/helpers';

export default function AchievementsPage() {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { userBadges, allBadges, calculateLevel, loading } = useProofOfWork(user?.id);

  const currentPoints = profile?.reputation || 0;
  const levelInfo = calculateLevel(currentPoints, allBadges);
  const nextLevel = levelInfo?.nextLevel;

  const getBadge = (ub: any) => Array.isArray(ub.badge) ? ub.badge[0] : ub.badge;

  const earnedMilestones = userBadges?.filter(ub => getBadge(ub)?.badge_type === 'achievement') || [];
  const earnedRecognitions = userBadges?.filter(ub => getBadge(ub)?.badge_type === 'recognition') || [];

  const earnedBadgeIds = userBadges?.map(ub => getBadge(ub)?.id).filter(Boolean) || [];
  const lockedMilestones = allBadges?.filter(b => b.badge_type === 'achievement' && !earnedBadgeIds.includes(b.id)) || [];
  const lockedRecognitions = allBadges?.filter(b => b.badge_type === 'recognition' && !earnedBadgeIds.includes(b.id)) || [];



  const HexagonSVG = ({ completed, number, isUpcoming }: { completed: boolean, number?: number | string, isUpcoming?: boolean }) => (
    <div className="relative shrink-0 flex items-center justify-center w-16 h-16 mr-2">
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full drop-shadow-sm">
        <polygon 
          points="25 5, 75 5, 95 50, 75 95, 25 95, 5 50" 
          className={
            isUpcoming ? "fill-slate-300 stroke-slate-200 stroke-[3]" :
            completed ? "fill-blue-500 stroke-blue-200 stroke-[3]" : 
            "fill-rose-400 stroke-rose-200 stroke-[3]"
          }
        />
        <polygon 
          points="28 10, 72 10, 89 50, 72 90, 28 90, 11 50" 
          className={
            isUpcoming ? "fill-slate-200" :
            completed ? "fill-blue-400" : 
            "fill-rose-300"
          }
        />
      </svg>
      {number && !isUpcoming && <span className="relative z-10 text-xl font-black text-white">{number}</span>}
    </div>
  );

  const RecognitionBadgeSVG = ({ title }: { title: string }) => {
    let colors = { primary: '#6366f1', secondary: '#4338ca', accent: '#a5b4fc' };
    let Icon = Users;
    
    if (title.includes('Leader')) {
      colors = { primary: '#10b981', secondary: '#047857', accent: '#6ee7b7' };
      Icon = Home;
    } else if (title.includes('1%')) {
      colors = { primary: '#3b82f6', secondary: '#1d4ed8', accent: '#93c5fd' };
      Icon = TrendingUp;
    } else if (title.includes('Bug')) {
      colors = { primary: '#f59e0b', secondary: '#b45309', accent: '#fcd34d' };
      Icon = Bug;
    }

    return (
      <div className="relative w-[84px] h-[84px] flex items-center justify-center drop-shadow-sm shrink-0">
        {/* Laurels (Left and Right) */}
        <svg className="absolute inset-0 w-full h-full text-slate-400 opacity-60" viewBox="0 0 100 100">
           {/* Left Laurel */}
           <path d="M 25 80 C 10 65, 10 35, 25 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
           <path d="M 25 70 C 15 65, 15 55, 20 50 C 25 55, 28 65, 25 70" fill="currentColor" />
           <path d="M 21 55 C 10 50, 10 40, 15 35 C 20 40, 23 50, 21 55" fill="currentColor" />
           <path d="M 19 40 C 8 35, 8 25, 13 20 C 18 25, 21 35, 19 40" fill="currentColor" />
           <path d="M 19 25 C 10 20, 10 10, 15 5 C 20 10, 22 20, 19 25" fill="currentColor" />

           {/* Right Laurel */}
           <path d="M 75 80 C 90 65, 90 35, 75 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
           <path d="M 75 70 C 85 65, 85 55, 80 50 C 75 55, 72 65, 75 70" fill="currentColor" />
           <path d="M 79 55 C 90 50, 90 40, 85 35 C 80 40, 77 50, 79 55" fill="currentColor" />
           <path d="M 81 40 C 92 35, 92 25, 87 20 C 82 25, 79 35, 81 40" fill="currentColor" />
           <path d="M 81 25 C 90 20, 90 10, 85 5 C 80 10, 78 20, 81 25" fill="currentColor" />
        </svg>
        
        {/* Hexagon Base */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" style={{ transform: 'scale(0.8)' }}>
          <defs>
            <linearGradient id={`grad-${colors.primary.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={colors.accent} />
              <stop offset="100%" stopColor={colors.secondary} />
            </linearGradient>
            <linearGradient id={`inner-${colors.primary.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={colors.primary} />
              <stop offset="100%" stopColor={colors.secondary} />
            </linearGradient>
          </defs>
          
          <polygon points="50 5, 90 25, 90 75, 50 95, 10 75, 10 25" fill={`url(#grad-${colors.primary.replace('#', '')})`} className="drop-shadow-md" />
          <polygon points="50 10, 85 28, 85 72, 50 90, 15 72, 15 28" fill={`url(#inner-${colors.primary.replace('#', '')})`} />
        </svg>

        {/* Ribbon at bottom */}
        <div className="absolute bottom-2 w-12 h-5 flex items-center justify-center z-20">
           <svg viewBox="0 0 100 40" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
             <path d="M 0 0 L 100 0 L 90 40 L 50 30 L 10 40 Z" fill={colors.secondary} stroke={colors.accent} strokeWidth="2" />
           </svg>
           <span className="relative z-10 text-white font-black text-[10px] leading-none mb-1">p</span>
        </div>

        {/* Center Icon */}
        <div className="relative z-10 text-white flex flex-col items-center mt-[-4px]">
           <Icon className="w-7 h-7 opacity-95 drop-shadow-sm" strokeWidth={1.5} />
        </div>

        {/* Tiny stars at top */}
        <div className="absolute top-[16px] flex gap-1 z-20">
           <Star className="w-1.5 h-1.5 text-white fill-current opacity-80" />
           <Star className="w-2 h-2 text-white fill-current -mt-0.5" />
           <Star className="w-1.5 h-1.5 text-white fill-current opacity-80" />
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-transparent relative">
      {/* Background ambient glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-teal-400/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="max-w-6xl mx-auto p-4 md:p-8 lg:p-12 relative z-10">
        <div className="mb-12">
          <h1 className="text-3xl font-extrabold text-slate-100 mb-4 tracking-tight">Achievements</h1>
          <p className="text-slate-400 max-w-2xl text-[15px] leading-relaxed">
            Your verified achievements in the global community can help you get recognized 
            and stand out at your workplace.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Milestones */}
          <div className="lg:col-span-7">
            <h2 className="text-[20px] font-bold text-slate-100 mb-6 font-display">Builder Milestones</h2>
            
            <div className="space-y-4">
              {earnedMilestones.length > 0 ? earnedMilestones.map((ub) => (
                <div key={ub.id} className="bg-slate-800/80 backdrop-blur-xl border border-slate-700 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] hover:bg-slate-800 transition-all duration-300">
                  <HexagonSVG completed={true} number={getBadge(ub)?.points_required ? Math.floor(getBadge(ub).points_required / 50) : 1} />
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-100 text-[15px]">{getBadge(ub)?.title}</h3>
                    <p className="text-slate-400 text-[13px] mt-0.5 mb-2">{getBadge(ub)?.description}</p>
                    <Link to={`/credentials/${ub.id}`} className="text-[12px] font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 group w-max">
                      See credentials <ArrowUpRight className="w-3.5 h-3.5 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>

                  <div className="shrink-0 mt-4 sm:mt-0">
                    <button 
                      onClick={() => window.open(generateLinkedInCertUrl(getBadge(ub)?.title || '', ub.issued_at, `${window.location.origin}/credentials/${ub.id}`), '_blank')}
                      className="flex items-center gap-2 bg-[#0A66C2] hover:bg-[#004182] text-white px-4 py-2.5 rounded-xl text-[13px] font-bold transition w-full sm:w-auto justify-center">
                      <Linkedin className="w-4 h-4 fill-current" /> Add to Profile
                    </button>
                  </div>
                </div>
              )) : (
                <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-3xl p-8 text-center shadow-sm">
                   <p className="text-slate-400 text-[14px]">You haven't earned any builder milestones yet. Keep participating in builds!</p>
                </div>
              )}
              
              {/* Locked Milestones */}
              {lockedMilestones.map((badge) => {
                const progressPercent = Math.min(100, Math.round((currentPoints / (badge.points_required || 1)) * 100));
                
                return (
                <div key={`locked-${badge.id}`} className="bg-slate-800/60 backdrop-blur-md border border-slate-700 shadow-sm rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 transition-all hover:bg-slate-800/80">
                  <div className="opacity-50 grayscale shrink-0">
                    <HexagonSVG completed={false} isUpcoming={true} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h3 className="font-bold text-slate-100 text-[15px]">{badge.title}</h3>
                      <span className="text-[11px] font-bold text-slate-400 bg-slate-700 border border-slate-600 px-2.5 py-1 rounded-md inline-flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Locked
                      </span>
                    </div>
                    <p className="text-slate-400 text-[13px] mb-3">{badge.description}</p>
                    
                    <div className="w-full bg-slate-700 rounded-full h-2 mb-1.5 overflow-hidden">
                      <div className="bg-blue-400 h-2 rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                    <div className="flex justify-between items-center text-[11.5px]">
                      <span className="text-slate-400 font-medium">Progress</span>
                      <span className="text-slate-300 font-bold">{currentPoints} / {badge.points_required} pts</span>
                    </div>
                    <p className="text-[11.5px] text-slate-400 mt-2 italic border-t border-slate-700 pt-2">
                      💡 How to earn: Build consistently, attend sessions, and get endorsed.
                    </p>
                  </div>
                </div>
              )})}

              {nextLevel && (
                <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 shadow-sm rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 opacity-70 grayscale transition-all">
                    <HexagonSVG completed={false} isUpcoming={true} />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-100 text-[15px]">Reach {nextLevel.title} level</h3>
                      <p className="text-slate-400 text-[13px] mt-0.5">Upcoming milestone • {nextLevel.points_required} points required</p>
                    </div>
                </div>
              )}

            </div>
          </div>

          {/* Right Column: Community Recognition */}
          <div className="lg:col-span-5">
            <h2 className="text-[20px] font-bold text-slate-100 mb-6 font-display">Community Recognition</h2>
            
            <div className="bg-gradient-to-br from-teal-900 to-emerald-950 rounded-3xl p-5 md:p-8 shadow-[0_20px_40px_rgba(20,184,166,0.15)] border border-teal-800/50 mb-8 relative overflow-hidden group hover:shadow-[0_20px_50px_rgba(20,184,166,0.25)] transition-all duration-500">
              <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/20 rounded-full blur-[60px] pointer-events-none group-hover:scale-110 transition-transform duration-700" />
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div className="w-16 h-16 relative">
                   <div className="absolute inset-0 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-2xl rotate-3 group-hover:rotate-6 transition-transform duration-300"></div>
                   <div className="absolute inset-0 bg-teal-950 rounded-2xl border border-teal-400/30 flex items-center justify-center -rotate-3 group-hover:rotate-0 transition-transform duration-300 shadow-xl">
                     <Trophy className="w-8 h-8 text-teal-400 drop-shadow-[0_0_10px_rgba(45,212,191,0.5)]" />
                   </div>
                   <div className="absolute -top-3 -right-3 bg-gradient-to-r from-amber-300 to-amber-500 text-amber-950 text-[10px] font-black px-2.5 py-0.5 rounded-full border-2 border-teal-900 shadow-lg">
                     1%
                   </div>
                </div>
              </div>
              <h3 className="font-bold text-white text-lg mb-2 relative z-10">Complete sessions, qualify for Top 1% July 2026</h3>
              <p className="text-teal-200/80 text-[14px] leading-relaxed relative z-10">
                To be considered for Top 1% for July 2026, you need to do at least 10 session(s) and maintain 80% attendance rate.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {earnedRecognitions.map((ub) => (
                <div key={ub.id} className="bg-slate-800/80 rounded-[20px] p-4 shadow-sm border border-slate-700 flex flex-col sm:flex-row sm:items-center gap-5 hover:shadow-md transition-all duration-300">
                  <div className="shrink-0 flex items-center justify-center mx-auto sm:mx-0">
                     <RecognitionBadgeSVG title={getBadge(ub)?.title || ''} />
                  </div>
                  <div className="flex-1 text-center sm:text-left sm:border-l sm:border-slate-700 sm:pl-5">
                     <h3 className="text-[17px] font-bold text-slate-100 mb-0.5 tracking-tight">{getBadge(ub)?.title}</h3>
                     <p className="text-slate-400 text-[13.5px] mb-2 leading-relaxed">{getBadge(ub)?.description}</p>
                     
                     <div className="flex items-center justify-center sm:justify-start gap-4 mt-4 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-slate-700">
                       <div className="text-[11px] font-bold text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full">
                         {ub.issued_at && !isNaN(new Date(ub.issued_at).getTime()) ? new Date(ub.issued_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'Recently'}
                       </div>
                       <Link to={`/credentials/${ub.id}`} className="text-[12px] font-bold text-teal-600 hover:text-teal-700 flex items-center group leading-tight">
                         View <ArrowUpRight className="w-3 h-3 ml-0.5" />
                       </Link>
                     </div>
                  </div>
                </div>
              ))}

              {earnedRecognitions.length === 0 && lockedRecognitions.length === 0 && (
                <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-3xl p-6 text-center shadow-sm">
                   <p className="text-slate-400 text-[13px]">Community recognition badges will appear here once earned.</p>
                </div>
              )}

              {/* Locked Recognitions */}
              {lockedRecognitions.map((badge) => {
                const progressPercent = Math.min(100, Math.round((currentPoints / (badge.points_required || 1)) * 100));

                return (
                <div key={`locked-${badge.id}`} className="bg-slate-800/80 backdrop-blur-md rounded-[20px] p-5 shadow-sm border border-slate-700 flex flex-col sm:flex-row sm:items-center gap-5 transition-all hover:shadow-md hover:bg-slate-800">
                  <div className="shrink-0 flex items-center justify-center mx-auto sm:mx-0 opacity-50 grayscale">
                     <RecognitionBadgeSVG title={badge.title} />
                  </div>
                  <div className="flex-1 text-center sm:text-left sm:border-l sm:border-slate-700 sm:pl-5">
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 gap-2">
                       <h3 className="text-[17px] font-bold text-slate-100 tracking-tight">{badge.title}</h3>
                       <div className="inline-flex items-center justify-center gap-1.5 bg-slate-700 text-slate-400 px-3 py-1 rounded-full text-[12px] font-bold">
                         <Lock className="w-3 h-3" /> Locked
                       </div>
                     </div>
                     <p className="text-slate-400 text-[13.5px] mb-3 leading-relaxed">{badge.description}</p>
                     
                     <div className="w-full bg-slate-700 rounded-full h-2 mb-1.5 overflow-hidden">
                       <div className="bg-teal-400 h-2 rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
                     </div>
                     <div className="flex justify-between items-center text-[11.5px] mb-2">
                       <span className="text-slate-400 font-medium">Progress</span>
                       <span className="text-slate-300 font-bold">{currentPoints} / {badge.points_required} pts</span>
                     </div>
                     <p className="text-[11.5px] text-slate-400 mt-2 italic border-t border-slate-700 pt-2 text-left">
                       💡 How to earn: Stand out in the community, share knowledge, and lead rooms.
                     </p>
                  </div>
                </div>
              )})}
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
