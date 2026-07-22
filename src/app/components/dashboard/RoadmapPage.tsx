import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { KanbanBoard } from '../roadmap/KanbanBoard';
import { SprintPlanner } from '../roadmap/SprintPlanner';
import { DependencyMap } from '../roadmap/DependencyMap';
import { SEO } from '../seo/SEO';

export default function RoadmapPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeTab = (searchParams.get('tab') as 'kanban' | 'sprints' | 'dependencies') || 'kanban';

  function setTab(tab: 'kanban' | 'sprints' | 'dependencies') {
    setSearchParams({ tab });
  }

  return (
    <>
      <SEO title="Roadmap | Patchwork" />
      <div className="w-full max-w-[1180px] mx-auto px-4 sm:px-6 py-4 sm:py-8 h-full flex flex-col">
        
        <div className="mb-6 sm:mb-8">
          <h1 className="font-bold text-[24px] sm:text-[28px] text-slate-900 leading-snug tracking-tight">
            Roadmap view
          </h1>
          <p className="text-slate-500 mt-1">Plan what you're building, when you're building it, and why.</p>
        </div>

        {/* INLINE TEXT TABS */}
        <div className="relative shrink-0">
          <div className="flex items-center gap-2 sm:gap-6 mb-6 sm:mb-8 border-b border-slate-200 relative overflow-x-auto scrollbar-hide snap-x -mx-4 px-4 sm:mx-0 sm:px-0">
            {[
              { key: 'kanban' as const, label: 'Kanban boards' },
              { key: 'sprints' as const, label: 'Sprint planning' },
              { key: 'dependencies' as const, label: 'Dependency mapping' },
            ].map(tab => {
              const isCurrent = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setTab(tab.key)}
                  className={`relative px-4 py-3 min-h-[44px] text-[14px] sm:text-[15px] font-bold transition-all focus-ring whitespace-nowrap snap-start active:scale-95 ${
                    isCurrent
                      ? 'text-slate-900'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-t-lg'
                  }`}
                >
                  {tab.label}
                  {isCurrent && (
                    <motion.div
                      layoutId="roadmap-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-primary-400 rounded-t-full shadow-[0_0_8px_rgba(139,124,248,0.5)]"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 min-h-0">
          {activeTab === 'kanban' && <KanbanBoard />}
          {activeTab === 'sprints' && <SprintPlanner />}
          {activeTab === 'dependencies' && <DependencyMap />}
        </div>
      </div>
    </>
  );
}
