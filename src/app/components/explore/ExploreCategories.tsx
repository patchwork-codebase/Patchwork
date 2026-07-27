interface ExploreCategoriesProps {
  categories: string[];
  selected: string;
  onSelect: (category: string) => void;
}

export function ExploreCategories({ categories, selected, onSelect }: ExploreCategoriesProps) {
  return (
    <div className="w-full overflow-x-auto hide-scrollbar pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="flex items-center gap-2 min-w-max">
        {categories.map((category) => {
          const isSelected = selected === category;
          return (
            <button
              key={category}
              onClick={() => onSelect(category)}
              className={`px-5 py-2.5 rounded-full text-[13px] font-bold tracking-wide transition-all duration-200 active:scale-95 ${
                isSelected
                  ? "bg-primary-500 text-white shadow-md shadow-primary-500/20"
                  : "bg-transparent text-slate-400 border border-slate-800 hover:bg-slate-800/50 hover:border-slate-700 hover:text-slate-100"
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>
    </div>
  );
}
