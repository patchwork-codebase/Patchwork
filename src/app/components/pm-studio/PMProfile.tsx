import React from 'react';
import { Award, Target, Activity, Share2, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';

export default function PMProfile() {
  // Mock data for MVP
  const skills = [
    { name: 'Product Discovery', score: 85 },
    { name: 'Prioritization', score: 92 },
    { name: 'Strategic Thinking', score: 78 },
    { name: 'Customer Focus', score: 88 },
    { name: 'Communication', score: 95 },
    { name: 'Analytics', score: 70 },
    { name: 'Execution', score: 82 },
  ];

  const timeline = [
    { date: 'Today', type: 'Decision', title: 'The Growth Dilemma', score: 78, impact: '+2 Prioritization' },
    { date: 'Yesterday', type: 'Decision', title: 'Launch Week Crisis', score: 92, impact: '+5 Execution' },
    { date: '3 days ago', type: 'Case Study', title: 'Spotify Retention Drop', score: 85, impact: '+8 Discovery' },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto pb-24">
      <header className="mb-10 flex items-start justify-between">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-blue-600 to-emerald-500 p-[2px]">
            <div className="w-full h-full bg-white dark:bg-[#120F1C] rounded-2xl flex items-center justify-center">
              <span className="text-3xl font-black text-slate-900 dark:text-white">JD</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">John Doe</h1>
              <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3 h-3" /> Verified PM
              </div>
            </div>
            <p className="text-slate-500 dark:text-slate-400">Top 5% in Prioritization • 3 Scenarios Completed</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-colors">
          <Share2 className="w-4 h-4" /> Share Portfolio
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Stats & Radar */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white dark:bg-[#1C1A24] border border-slate-100 dark:border-white/10 rounded-3xl p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-400" /> Skill Breakdown
            </h3>
            
            <div className="space-y-4">
              {skills.map(skill => (
                <div key={skill.name}>
                  <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300 mb-2 uppercase tracking-wider">
                    <span>{skill.name}</span>
                    <span className="text-slate-900 dark:text-white">{skill.score}/100</span>
                  </div>
                  <div className="w-full bg-slate-50 dark:bg-[#0E0C15] rounded-full h-2">
                    <div 
                      className={`h-full rounded-full ${skill.score >= 90 ? 'bg-emerald-500' : skill.score >= 80 ? 'bg-blue-500' : 'bg-yellow-500'}`}
                      style={{ width: `${skill.score}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Timeline & Achievements */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-[#1C1A24] border border-slate-100 dark:border-white/10 rounded-3xl p-8">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Activity className="w-6 h-6 text-emerald-400" /> Learning Timeline
            </h3>
            
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
              
              {timeline.map((item, i) => (
                <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-100 dark:border-white/10 bg-white dark:bg-[#120F1C] text-slate-500 dark:text-slate-400 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white dark:bg-[#120F1C] border border-slate-100 dark:border-white/5 p-5 rounded-xl shadow-md hover:border-emerald-500/30 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-500 uppercase">{item.type}</span>
                      <time className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" /> {item.date}</time>
                    </div>
                    <div className="font-bold text-slate-900 dark:text-white mb-3 text-lg">{item.title}</div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">Score: {item.score}/100</div>
                      <div className="text-sm font-bold text-blue-400">{item.impact}</div>
                    </div>
                  </div>
                </div>
              ))}
              
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-emerald-900/40 to-blue-900/40 border border-emerald-500/20 rounded-3xl p-8 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Build Your Proof of Work</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-md">Continue completing interactive case studies and decisions to build an irrefutable portfolio of your product sense.</p>
            </div>
            <Award className="w-24 h-24 text-emerald-500 opacity-20" />
          </div>
        </div>

      </div>
    </div>
  );
}
