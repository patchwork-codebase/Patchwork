import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { supabase } from "../auth/AuthContext";
import { getAvatarUrl, timeAgo } from "../../utils/helpers";
import { ThumbsUp, MessageCircle, RefreshCw, Send } from "lucide-react";
import { UserAvatar } from "../ui/UserAvatar";

interface ShowcaseCard {
  id: string;
  authorName: string;
  authorAvatar?: string;
  domain: string;
  content: string;
  createdAt: string;
}

const FALLBACK_CARDS: ShowcaseCard[] = [
  { id: "1", authorName: "Yemi A.", domain: "Product", content: "Just shipped the first version of our onboarding flow. The drop-off rate was 60% before — going to track how this changes things.", createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
  { id: "2", authorName: "Sade O.", domain: "Design", content: "Redesigned the dashboard from scratch. Moving away from the card grid to a timeline-first view. Feels much more alive.", createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString() },
  { id: "3", authorName: "Temi B.", domain: "Engineering", content: "Finally solved the race condition in the sync engine. Turns out the issue was in how we handled optimistic updates during reconnects.", createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
  { id: "4", authorName: "Funke M.", domain: "Research", content: "Interviewed 8 users this week. Key insight: people don't want more features — they want less confusion. Simplifying the nav next.", createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString() },
  { id: "5", authorName: "Kola D.", domain: "Writing", content: "Published my 10th build log today. The habit of writing consistently has made me a better thinker. Highly recommend doing this.", createdAt: new Date(Date.now() - 1000 * 60 * 200).toISOString() },
  { id: "6", authorName: "Amaka I.", domain: "Product", content: "Launched beta to 50 users. First reactions are in — people love the speed, but the empty state is confusing. Fixing tomorrow.", createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString() },
];

export function LandingNetworkShowcase() {
  const [cards, setCards] = useState<ShowcaseCard[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchShowcase() {
      try {
        // Fetch the 6 most recent public updates joined with room tags and author info
        const { data, error } = await supabase
          .from("updates")
          .select(
            "id, content, created_at, author_name, author_id, rooms!room_id(title, tags, is_private), users!author_id(avatar)"
          )
          .order("created_at", { ascending: false })
          .limit(12);

        if (error || !data) throw error;

        // Filter to only updates in public rooms (is_private = false), take first 6
        const publicUpdates = data
          .filter((row: any) => row.rooms?.is_private !== true)
          .slice(0, 6);

        if (publicUpdates.length > 0) {
          const mapped: ShowcaseCard[] = publicUpdates.map((row: any) => ({
            id: row.id,
            authorName: row.author_name || "Builder",
            authorAvatar: row.users?.avatar,
            domain: row.rooms?.tags?.[0] || "Building",
            content: row.content,
            createdAt: row.created_at,
          }));
          setCards(mapped);
        } else {
          // No public data accessible — use fallback
          setCards(FALLBACK_CARDS);
        }
      } catch {
        // Silently fall back to placeholder cards — showcase won't show
        setCards(FALLBACK_CARDS);
      } finally {
        setLoading(false);
      }
    }

    fetchShowcase();
  }, []);


  return (
    <section className="relative py-32 bg-[#fafafa] overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-4 relative z-10">

        <div className="text-center mb-20">
          <h2 className="text-[42px] sm:text-[56px] font-display font-extrabold text-slate-900 leading-[1.1] mb-6">
            The Living Network
          </h2>
          <p className="text-[18px] text-slate-500 max-w-[600px] mx-auto">
            Builders on Patchwork right now — sharing their journey in public, one update at a time.
          </p>
        </div>

        {/* Dynamic Drifting Grid */}
        <div className="relative w-full h-[600px] flex items-center justify-center">

          {/* Background subtle grid lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />

          {loading ? (
            // Skeleton placeholders while fetching
            Array.from({ length: 6 }).map((_, idx) => {
              const angle = (idx / 6) * Math.PI * 2;
              const radius = 200 + (idx % 2 === 0 ? 50 : 0);
              const startX = Math.cos(angle) * radius;
              const startY = Math.sin(angle) * radius;
              return (
                <div
                  key={idx}
                  style={{ transform: `translate(${startX}px, ${startY}px)` }}
                  className="absolute w-[240px] sm:w-[280px] bg-white rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-slate-100 p-5 animate-pulse"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-slate-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-slate-200 rounded w-2/3" />
                      <div className="h-2.5 bg-slate-100 rounded w-1/3" />
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-[16px] p-4 space-y-2">
                    <div className="h-2 bg-slate-200 rounded w-full" />
                    <div className="h-2 bg-slate-200 rounded w-5/6" />
                    <div className="h-2 bg-slate-100 rounded w-4/6" />
                  </div>
                </div>
              );
            })
          ) : (
            cards.map((card, idx) => {
              const angle = (idx / cards.length) * Math.PI * 2;
              const radius = 200 + (idx % 2 === 0 ? 50 : 0);
              const startX = Math.cos(angle) * radius;
              const startY = Math.sin(angle) * radius;

              const isHovered = hoveredIndex === idx;
              const isBlurry = hoveredIndex !== null && !isHovered;

              return (
                <motion.div
                  key={card.id}
                  initial={{ x: startX, y: startY, opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  animate={{
                    x: isHovered ? 0 : startX,
                    y: isHovered ? 0 : startY,
                    scale: isHovered ? 1.2 : 1,
                    zIndex: isHovered ? 50 : 10,
                    filter: isBlurry ? "blur(8px)" : "blur(0px)",
                    opacity: isBlurry ? 0.4 : 1,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 20,
                    mass: 0.8,
                  }}
                  className="absolute w-[240px] sm:w-[280px] bg-white rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-slate-100 p-5 cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <UserAvatar userId={card.authorName} name={card.authorName} avatarUrl={card.authorAvatar} className="w-12 h-12 rounded-full ring-4 ring-primary-50 object-cover" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-[15px]">{card.authorName}</h4>
                      <span className="text-[12px] font-medium text-primary-500 uppercase tracking-wider">
                        {card.domain}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-[16px] p-4 border border-slate-100 flex flex-col gap-3">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Latest Update
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {timeAgo(card.createdAt)}
                        </span>
                      </div>
                      <p className="text-[13px] text-slate-700 leading-relaxed line-clamp-3">
                        {card.content}
                      </p>
                    </div>

                    {/* Interaction Row */}
                    <div className="flex items-center gap-4 pt-2 border-t border-slate-200/50 mt-1">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                           <span className="text-[14px] font-bold text-slate-500">✦</span>
                        </div>
                        <span className="text-[13px] font-bold">{Math.floor(Math.random() * 20) + 5}</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                           <span className="text-[14px] font-bold text-slate-500">↩</span>
                        </div>
                        <span className="text-[13px] font-bold">{Math.floor(Math.random() * 10) + 1}</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-slate-500">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                           <span className="text-[14px] font-bold text-emerald-600">?</span>
                        </div>
                        <span className="text-[13px] font-bold">{Math.floor(Math.random() * 10) + 1}</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-slate-500">
                        <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center">
                          <MessageCircle className="w-4 h-4 text-primary-500" />
                        </div>
                        <span className="text-[13px] font-bold">{Math.floor(Math.random() * 15) + 2}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

      </div>
    </section>
  );
}
