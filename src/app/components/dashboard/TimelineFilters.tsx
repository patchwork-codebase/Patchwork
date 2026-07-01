import React from 'react';

interface TimelineFiltersProps {
  activeDomainFilter: string;
  setActiveDomainFilter: (domain: string) => void;
  activeViewToggle: 'all' | 'media' | 'launches';
  setActiveViewToggle: (view: 'all' | 'media' | 'launches') => void;
  feedSort: 'latest' | 'trending';
  setFeedSort: (sort: 'latest' | 'trending') => void;
}

export function TimelineFilters({
  activeDomainFilter,
  setActiveDomainFilter,
  activeViewToggle,
  setActiveViewToggle,
  feedSort,
  setFeedSort
}: TimelineFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center w-full min-w-0">
      <div className="flex overflow-x-auto scrollbar-hide items-center gap-2 pb-2 sm:pb-0 snap-x w-full min-w-0 -mx-4 px-4 sm:mx-0 sm:px-0">
        {['All', 'Product', 'Engineering', 'Design'].map(domain => (
          <button
            key={domain}
            onClick={() => setActiveDomainFilter(domain)}
            className={`px-3 py-1.5 rounded-full text-[12px] font-bold transition-all border focus-ring whitespace-nowrap shrink-0 snap-start ${
              activeDomainFilter === domain
                ? 'bg-primary-500 border-primary-500 text-white shadow-[0_0_10px_rgba(108,92,231,0.3)]'
                : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {domain}
          </button>
        ))}
      </div>
      <div className="flex overflow-x-auto scrollbar-hide items-center gap-3 w-full sm:w-auto pb-2 sm:pb-0 snap-x min-w-0 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex bg-white border border-slate-200 rounded-full p-1 shadow-sm shrink-0 snap-start">
          {(['all', 'media', 'launches'] as const).map(view => (
            <button
              key={view}
              onClick={() => setActiveViewToggle(view)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                activeViewToggle === view ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {view}
            </button>
          ))}
        </div>
        <div className="flex bg-white border border-slate-200 rounded-full p-1 shadow-sm shrink-0 snap-start">
          <button
            onClick={() => setFeedSort('latest')}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              feedSort === 'latest' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Latest
          </button>
          <button
            onClick={() => setFeedSort('trending')}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              feedSort === 'trending' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Trending
          </button>
        </div>
      </div>
    </div>
  );
}
