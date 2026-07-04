import React from 'react';
import { motion } from 'motion/react';
import { Award, Medal, Trophy, Star, ArrowUpRight, Hexagon, Linkedin } from 'lucide-react';
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

  const MedalSVG = ({ text }: { text: string }) => (
    <div className="w-14 h-14 relative mb-2 flex items-center justify-center drop-shadow-sm">
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
        {/* Left ribbon */}
        <polygon points="20 40, 10 95, 35 80, 45 40" className="fill-amber-600" />
        {/* Right ribbon */}
        <polygon points="80 40, 90 95, 65 80, 55 40" className="fill-amber-600" />
        {/* Circle */}
        <circle cx="50" cy="40" r="35" className="fill-amber-400 stroke-amber-100 stroke-[4]" />
        <circle cx="50" cy="40" r="28" className="fill-amber-500" />
      </svg>
      <span className="relative z-10 text-white font-black text-lg mb-2">{text}</span>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-slate-50 relative">
      {/* Background ambient glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-teal-400/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="max-w-6xl mx-auto p-4 md:p-8 lg:p-12 relative z-10">
        <div className="mb-12">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">Achievements</h1>
          <p className="text-slate-600 max-w-2xl text-[15px] leading-relaxed">
            Your verified achievements in the global community can help you get recognized 
            and stand out at your workplace.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Milestones */}
          <div className="lg:col-span-7">
            <h2 className="text-[20px] font-bold text-slate-900 mb-6 font-display">Builder Milestones</h2>
            
            <div className="space-y-4">
              {earnedMilestones.length > 0 ? earnedMilestones.map((ub) => (
                <div key={ub.id} className="bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgba(0,0,0,0.03)] rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:bg-white transition-all duration-300">
                  <HexagonSVG completed={true} number={getBadge(ub)?.points_required ? Math.floor(getBadge(ub).points_required / 50) : 1} />
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 text-[15px]">{getBadge(ub)?.title}</h3>
                    <p className="text-slate-500 text-[13px] mt-0.5 mb-2">{getBadge(ub)?.description}</p>
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
                <div className="bg-white/50 backdrop-blur-md border border-white rounded-3xl p-8 text-center shadow-sm">
                   <p className="text-slate-500 text-[14px]">You haven't earned any builder milestones yet. Keep participating in builds!</p>
                </div>
              )}
              
              {/* Locked Milestones */}
              {lockedMilestones.map((badge) => (
                <div key={`locked-${badge.id}`} className="bg-white/50 backdrop-blur-md border border-white shadow-sm rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 opacity-60 grayscale transition-all">
                  <HexagonSVG completed={false} isUpcoming={true} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 text-[15px]">{badge.title}</h3>
                    <p className="text-slate-500 text-[13px] mt-0.5 mb-2">{badge.description}</p>
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-200 px-2.5 py-1 rounded-md inline-block">Locked</span>
                  </div>
                </div>
              ))}

              {nextLevel && (
                <div className="bg-white/50 backdrop-blur-md border border-white shadow-sm rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 opacity-70 grayscale transition-all">
                    <HexagonSVG completed={false} isUpcoming={true} />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 text-[15px]">Reach {nextLevel.title} level</h3>
                      <p className="text-slate-500 text-[13px] mt-0.5">Upcoming milestone • {nextLevel.points_required} points required</p>
                    </div>
                </div>
              )}

            </div>
          </div>

          {/* Right Column: Community Recognition */}
          <div className="lg:col-span-5">
            <h2 className="text-[20px] font-bold text-slate-900 mb-6 font-display">Community Recognition</h2>
            
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              {earnedRecognitions.map((ub) => (
                <div key={ub.id} className="bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgba(0,0,0,0.03)] rounded-3xl p-4 md:p-5 flex flex-col items-center text-center hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:bg-white transition-all duration-300">
                  <MedalSVG text="★" />
                  <h4 className="font-bold text-slate-900 text-[11px] md:text-[12px] leading-tight mb-1 px-1">{getBadge(ub)?.title}</h4>
                  <p className="text-[10px] md:text-[11px] text-slate-500 mb-2 px-1">{getBadge(ub)?.description}</p>
                  <div className="text-[9px] md:text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-bold mb-4">
                    {ub.issued_at && !isNaN(new Date(ub.issued_at).getTime()) 
                      ? new Date(ub.issued_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) 
                      : 'Recently'}
                  </div>
                  
                  <div className="mt-auto w-full flex flex-col 2xl:flex-row items-center justify-between border-t border-slate-100 pt-3 gap-2">
                    <Link to={`/credentials/${ub.id}`} className="text-[11px] font-bold text-teal-600 hover:text-teal-700 flex items-center group leading-tight">
                      Credentials <ArrowUpRight className="w-3 h-3 ml-0.5" />
                    </Link>
                    <button 
                      onClick={() => window.open(generateLinkedInCertUrl(getBadge(ub)?.title || '', ub.issued_at, `${window.location.origin}/credentials/${ub.id}`), '_blank')}
                      className="flex items-center justify-center gap-1.5 bg-[#0A66C2] hover:bg-[#004182] text-white px-2 py-1.5 rounded-md text-[11px] font-bold transition w-full 2xl:w-auto">
                      <Linkedin className="w-3 h-3 fill-current" /> Add
                    </button>
                  </div>
                </div>
              ))}

              {earnedRecognitions.length === 0 && lockedRecognitions.length === 0 && (
                <div className="col-span-2 lg:col-span-3 bg-white/50 backdrop-blur-md border border-white rounded-3xl p-6 text-center shadow-sm">
                   <p className="text-slate-500 text-[13px]">Community recognition badges will appear here once earned.</p>
                </div>
              )}

              {/* Locked Recognitions */}
              {lockedRecognitions.map((badge) => (
                <div key={`locked-${badge.id}`} className="bg-white/50 backdrop-blur-md border border-white shadow-sm rounded-3xl p-4 md:p-5 flex flex-col items-center text-center opacity-60 grayscale transition-all">
                  <MedalSVG text="?" />
                  <h4 className="font-bold text-slate-900 text-[11px] md:text-[12px] leading-tight mb-1 px-1">{badge.title}</h4>
                  <p className="text-[10px] md:text-[11px] text-slate-500 mb-2 px-1">{badge.description}</p>
                  <div className="text-[9px] md:text-[10px] text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full font-bold mt-auto mb-1">
                    Locked
                  </div>
                </div>
              ))}
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
