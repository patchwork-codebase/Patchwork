import React from 'react';
import { useNavigate } from 'react-router';
import { Play, Filter, CheckCircle2 } from 'lucide-react';

export default function PMDecisionList() {
  const navigate = useNavigate();

  // Hardcoded MVP scenarios to match DB seeds for now
  const scenarios = [
    { id: '1', title: 'The Growth Dilemma', category: 'Prioritization', difficulty: 'Intermediate', context: 'Revenue has declined. Marketing wants discounts. Engineering wants infrastructure improvements. Sales wants new features. Customer Support wants bug fixes.' },
    { id: '2', title: 'Launch Week Crisis', category: 'Execution', difficulty: 'Advanced', context: 'A critical production bug appears during launch week. Delay launch or continue?' },
    { id: '3', title: 'Aggressive Growth vs Satisfaction', category: 'Strategy', difficulty: 'Intermediate', context: 'Leadership wants aggressive growth. Customer satisfaction is declining. Where do you invest?' },
    { id: '4', title: 'Resource Halving', category: 'Prioritization', difficulty: 'Advanced', context: 'Engineering capacity is reduced by 50%. How do you reprioritise the roadmap?' },
    { id: '5', title: 'The Whale Dilemma', category: 'Customer Thinking', difficulty: 'Intermediate', context: 'Your largest customer requests a custom feature. Building it delays your public roadmap. What do you do?' }
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="mb-10 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Decision Simulator</h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl">High-pressure, fast-paced dilemmas. AI evaluates the quality of your strategic thinking and prioritisation.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1C1A24] border border-slate-100 dark:border-white/10 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white transition-colors">
          <Filter className="w-4 h-4" /> Filter
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {scenarios.map(scenario => (
          <div 
            key={scenario.id}
            className="bg-white dark:bg-[#1C1A24] border border-slate-100 dark:border-white/10 rounded-2xl p-6 hover:border-emerald-500/50 hover:-translate-y-1 transition-all cursor-pointer flex flex-col group"
            onClick={() => navigate(`/pm-studio/decisions/${scenario.id}`)}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="inline-flex px-2 py-1 bg-white/5 text-slate-500 dark:text-slate-400 text-[10px] font-bold rounded uppercase tracking-wider">
                {scenario.category}
              </div>
              <div className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${
                scenario.difficulty === 'Advanced' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
              }`}>
                {scenario.difficulty}
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{scenario.title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 flex-1 line-clamp-3">{scenario.context}</p>
            
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Not Attempted
              </span>
              <button className="flex items-center gap-1 text-sm font-bold text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                Simulate <Play className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
