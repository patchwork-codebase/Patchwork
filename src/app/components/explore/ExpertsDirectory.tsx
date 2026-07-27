import { useState } from "react";
import { AwardIcon } from "../layout/LayoutIcons";
import { ExploreCategories } from "./ExploreCategories";
import { ExploreSearch } from "./ExploreSearch";
import ExpertCard, { ExpertProfile } from "../room/ExpertCard";
import { useExperts } from "../../hooks/useExperts";
import { RequestExpertReviewModal } from "../room/RequestExpertReviewModal";

import { useNavigate } from "react-router";

// Expert domains to filter by (similar to EXPLORE_CATEGORIES)
const EXPERT_DOMAINS = [
  "All",
  "Product",
  "Engineering",
  "Design",
  "Marketing",
  "Growth",
  "Sales",
  "Operations",
  "Finance",
  "Legal"
];

export default function ExpertsDirectory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<string>("All");
  const [expertForModal, setExpertForModal] = useState<ExpertProfile | null>(null);
  const navigate = useNavigate();

  const { data: experts = [], isLoading } = useExperts(searchQuery, selectedDomain);

  return (
    <div className="max-w-[1080px] w-full mx-auto px-4 sm:px-6 py-12 relative overflow-hidden">
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[380px] h-[380px] sm:w-[600px] sm:h-[600px] bg-primary-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="mb-10 text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-500/10 border border-primary-500/20 rounded-full mb-4 mx-auto">
          <AwardIcon className="w-3.5 h-3.5 text-primary-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary-500">Directory</span>
        </div>
        <h1 className="text-5xl sm:text-[40px] font-extrabold text-slate-100 font-display tracking-tight leading-tight mb-3">
          Expert <span className="text-primary-400">Directory</span>
        </h1>
        <p className="text-[15px] text-slate-400 font-medium max-w-lg mx-auto mb-8">
          Discover verified experts across Patchwork. Browse by domain, request reviews, and get valuable feedback on your builds.
        </p>

        <ExploreSearch 
          value={searchQuery} 
          onChange={setSearchQuery} 
          placeholder="Search experts by name..."
        />
      </div>

      <div className="mb-8 flex justify-center">
        <ExploreCategories
          categories={[...EXPERT_DOMAINS]}
          selected={selectedDomain}
          onSelect={setSelectedDomain}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-transparent border border-slate-800 rounded-2xl p-5 h-[280px] animate-pulse flex flex-col">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-slate-700 shrink-0" />
                <div className="space-y-2 flex-1 pt-1">
                  <div className="h-4 bg-slate-700 rounded w-2/3" />
                  <div className="h-3 bg-slate-700 rounded w-1/2" />
                </div>
              </div>
              <div className="flex gap-2 mb-4">
                <div className="h-6 bg-slate-700 rounded w-16" />
                <div className="h-6 bg-slate-700 rounded w-20" />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="h-14 bg-slate-700 rounded-xl" />
                <div className="h-14 bg-slate-700 rounded-xl" />
              </div>
              <div className="mt-auto flex justify-between items-center">
                <div className="h-8 bg-slate-700 rounded w-20" />
                <div className="h-9 bg-slate-700 rounded-xl w-28" />
              </div>
            </div>
          ))}
        </div>
      ) : experts.length === 0 ? (
        <div className="bg-transparent border border-slate-800 rounded-[32px] px-6 py-16 text-center">
          <p className="text-slate-100 font-bold text-lg">No experts found</p>
          <p className="text-slate-400 text-sm mt-2">Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {experts.map((expert) => (
            <ExpertCard 
              key={expert.id} 
              expert={expert} 
              onSelect={(expert) => setExpertForModal(expert)}
              onProfileClick={() => navigate(`/dashboard/profile/${expert.id}`)}
            />
          ))}
        </div>
      )}
      
      {expertForModal && (
        <RequestExpertReviewModal
          open={!!expertForModal}
          initialExpert={expertForModal}
          onClose={() => setExpertForModal(null)}
        />
      )}
    </div>
  );
}
