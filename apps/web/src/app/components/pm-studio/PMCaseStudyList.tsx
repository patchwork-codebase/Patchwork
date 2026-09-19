import React from 'react';
import { useNavigate } from 'react-router';
import { Play, Filter, CheckCircle2 } from 'lucide-react';

export default function PMCaseStudyList() {
  const navigate = useNavigate();

  const caseStudies = [
    { id: '1', title: 'Spotify Retention Drop', category: 'Product Discovery', difficulty: 'Intermediate', time: '30 mins', context: 'You\'ve just joined Spotify as a Product Manager. Your retention has dropped by 18%. Analyze the situation and turn it around.' }
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="mb-10 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Interactive Case Studies</h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl">Deep dive into realistic product scenarios. Analyze data, talk to stakeholders, and solve complex problems.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1C1A24] border border-slate-100 dark:border-white/10 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white transition-colors">
          <Filter className="w-4 h-4" /> Filter
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {caseStudies.map(study => (
          <div 
            key={study.id}
            className="bg-white dark:bg-[#1C1A24] border border-slate-100 dark:border-white/5 rounded-2xl p-6 hover:-translate-y-1 transition-all cursor-pointer flex flex-col group shadow-lg"
            onClick={() => navigate(`/pm-studio/case-studies/${study.id}`)}
          >
            {/* Top Category Label */}
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-5">
              {study.category}
            </div>
            
            {/* Title & Role */}
            <div className="flex items-start gap-4 mb-5">
              <div className="w-12 h-12 rounded-xl bg-white/10 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold shrink-0">
                {study.title.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight mb-1">{study.title}</h3>
                <p className="text-orange-500 text-sm font-medium">
                  You'll be: Senior Product Manager
                </p>
              </div>
            </div>
            
            {/* Description */}
            <p className="text-slate-600 dark:text-slate-300 text-sm flex-1 leading-relaxed line-clamp-3 mb-6">
              {study.context}
            </p>
            
            {/* Pills */}
            <div className="flex items-center gap-3 mb-6">
              <span className={`px-4 py-1.5 rounded-full text-xs font-medium border ${
                study.difficulty === 'Advanced' 
                  ? 'border-red-500/50 text-red-400 bg-red-500/10' 
                  : study.difficulty === 'Intermediate'
                  ? 'border-orange-500/50 text-orange-400 bg-orange-500/10'
                  : 'border-blue-500/50 text-blue-400 bg-blue-500/10'
              }`}>
                {study.difficulty}
              </span>
              <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-slate-400/30 text-slate-700 dark:text-slate-200">
                {study.time}
              </span>
            </div>
            
            {/* Actions */}
            <div className="grid grid-cols-2 gap-4">
              <button 
                className="py-3 px-4 rounded-xl border border-orange-500 text-orange-500 font-bold hover:bg-orange-500/10 transition-colors text-sm"
                onClick={(e) => { e.stopPropagation(); /* handle preview */ }}
              >
                Preview
              </button>
              <button 
                className="py-3 px-4 rounded-xl bg-orange-500 text-black font-bold hover:bg-orange-600 transition-colors text-sm"
              >
                Start Scenario
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
