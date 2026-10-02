import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { 
  ShieldCheck, Award, Rocket, Zap, GitCommit, ExternalLink, Calendar, 
  Flame, CheckCircle2, MapPin, Sparkles, Code2, Layers, Briefcase, ArrowUpRight, Share2, Activity
} from "lucide-react";
import { UserAvatar } from "../ui/UserAvatar";
import { VerifiedTick } from "../ui/VerifiedTick";
import { DecisionMatrixBlock } from "../pow/DecisionMatrixBlock";
import { MetricImpactBadge } from "../pow/MetricImpactBadge";
import { CodeDiffViewer } from "../pow/CodeDiffViewer";
import { supabase } from "../auth/AuthContext";
import type { Profile, Room } from "../../types";
import { PublicRoadmap } from "../roadmap/PublicRoadmap";

export function BuilderPortfolioView() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [topProofs, setTopProofs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "products" | "proofs" | "roadmap">("all");

  useEffect(() => {
    async function loadPortfolioData() {
      setLoading(true);
      try {
        let userMatch = null;
        if (username) {
          const { data: byUsername } = await supabase
            .from("users")
            .select("*")
            .ilike("username", username)
            .limit(1);

          if (byUsername && byUsername.length > 0) {
            userMatch = byUsername[0];
          } else {
            const { data: byName } = await supabase
              .from("users")
              .select("*")
              .ilike("full_name", `%${username}%`)
              .limit(1);

            if (byName && byName.length > 0) {
              userMatch = byName[0];
            }
          }
        }

        if (!userMatch) {
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          if (currentUser) {
            const { data: selfUser } = await supabase
              .from("users")
              .select("*")
              .eq("id", currentUser.id)
              .limit(1);

            if (selfUser && selfUser.length > 0) {
              userMatch = selfUser[0];
            }
          }
        }

        if (userMatch) {
          const u = userMatch;
          setProfile(u);

          const { data: roomData } = await supabase
            .from("rooms")
            .select("*")
            .eq("builder_id", u.id)
            .order("created_at", { ascending: false });

          if (roomData) setRooms(roomData);

          const { data: updateData } = await supabase
            .from("updates")
            .select("*, rooms(title)")
            .eq("author_id", u.id)
            .order("created_at", { ascending: false })
            .limit(12);

          if (updateData) setTopProofs(updateData);
        }
      } catch (err) {
        console.error("Error loading portfolio:", err);
      } finally {
        setLoading(false);
      }
    }

    loadPortfolioData();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-900 dark:text-white p-4">
        <h2 className="text-xl font-bold mb-2">Builder Profile Not Found</h2>
        <button onClick={() => navigate("/")} className="text-primary-400 font-bold hover:underline cursor-pointer">
          Return to Patchwork
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 font-sans antialiased selection:bg-primary-500/30 selection:text-white">
      {/* Top Navbar Header */}
      <header className="sticky top-0 z-50 border-b border-slate-100 dark:border-slate-800/80 bg-[#0b0f17]/90 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div onClick={() => navigate("/")} className="flex items-center gap-2 cursor-pointer group">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary-500 to-primary-400 shadow-[0_10px_30px_rgba(108,92,231,0.25)] transition-transform duration-300 group-hover:-translate-y-0.5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-900 dark:text-white">
                <path d="M15 12L9 6 3 12l1.5 1.5L9 9l4.5 4.5L15 12Z" />
                <path d="M15 12l4.5 4.5-1.5 1.5L13.5 13.5" />
                <path d="M9 6l3-3 3 3" />
              </svg>
            </div>
            <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white group-hover:text-primary-400 transition-colors">
              patch<span className="text-primary-500">·</span>work
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert("Portfolio URL copied to clipboard!");
              }}
              className="px-3.5 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 bg-slate-900/80 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:bg-slate-800 hover:text-slate-900 dark:text-white transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" /> Share Portfolio
            </button>
          </div>
        </div>
      </header>

      {/* Main Profile Header */}
      <section className="relative border-b border-slate-100 dark:border-slate-800/60 bg-gradient-to-b from-[#111622] to-[#0b0f17] py-12 px-6 overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start gap-8 relative z-10">
          {/* Avatar */}
          <div className="relative shrink-0">
            <UserAvatar
              userId={profile.id}
              name={profile.full_name || profile.username || "Builder"}
              avatarUrl={profile.avatar_url}
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl border-2 border-slate-300 dark:border-slate-700/80 shadow-2xl object-cover ring-4 ring-slate-900"
            />
            <span className="absolute -bottom-1 -right-1 p-2 bg-emerald-500 text-white rounded-2xl shadow-lg ring-4 ring-[#0b0f17]">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>

          {/* Profile Bio Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-slate-600 dark:text-slate-300 font-mono text-sm sm:text-base font-semibold">
                @{profile.username || "builder"}
              </span>
              <VerifiedTick isVerified={true} className="w-5 h-5 shrink-0" />
            </div>

            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed max-w-3xl mb-6 font-normal">
              {profile.bio || "Product Builder creating software & proof of work on Patchwork."}
            </p>

            {/* Stat Pill Badges */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900/90 border border-slate-100 dark:border-slate-800 px-3.5 py-2 rounded-2xl text-amber-300 shadow-sm">
                <Flame className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{rooms.length} Active Build Rooms</span>
              </div>

              <div className="flex items-center gap-2 bg-white dark:bg-slate-900/90 border border-slate-100 dark:border-slate-800 px-3.5 py-2 rounded-2xl text-indigo-300 shadow-sm">
                <Activity className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>{topProofs.length} Verified Proofs</span>
              </div>

              <div className="flex items-center gap-2 bg-white dark:bg-slate-900/90 border border-slate-100 dark:border-slate-800 px-3.5 py-2 rounded-2xl text-emerald-300 shadow-sm">
                <Award className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Proof of Work Certified</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Tabbed Portfolio Sections */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 mb-8 pb-3">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "all"
                ? "bg-primary-600 text-white shadow-md"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("products")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "products"
                ? "bg-primary-600 text-white shadow-md"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            Living Products ({rooms.length})
          </button>
          <button
            onClick={() => setActiveTab("proofs")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "proofs"
                ? "bg-primary-600 text-white shadow-md"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            Proof Logs ({topProofs.length})
          </button>
          <button
            onClick={() => setActiveTab("roadmap")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "roadmap"
                ? "bg-primary-600 text-white shadow-md"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            Roadmap
          </button>
        </div>

        {/* Products Section */}
        {(activeTab === "all" || activeTab === "products") && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Rocket className="w-5 h-5 text-primary-400" /> Living Products & Build Rooms
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  onClick={() => navigate(`/dashboard/room/${room.id}`)}
                  className="bg-[#111622] rounded-3xl p-6 border border-slate-100 dark:border-slate-800/80 hover:border-primary-500/50 shadow-lg hover:shadow-primary-500/5 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <h3 className="font-bold text-slate-900 dark:text-white text-lg group-hover:text-primary-400 transition-colors flex items-center gap-2">
                        {room.title}
                        <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-primary-400 transition-colors" />
                      </h3>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full shrink-0">
                        {room.status || "Active"}
                      </span>
                    </div>

                    <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed mb-4 line-clamp-3">
                      {room.description || "Building in public on Patchwork."}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">Phase: Private Beta</span>
                    <span className="text-primary-400 font-bold">Explore Room →</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Proof Log Feed */}
        {(activeTab === "all" || activeTab === "proofs") && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <GitCommit className="w-5 h-5 text-indigo-400" /> Proof of Work & Shipped Decisions
              </h2>
            </div>

            <div className="space-y-4">
              {topProofs.map((update) => (
                <div
                  key={update.id}
                  className="bg-[#111622] rounded-3xl p-6 border border-slate-100 dark:border-slate-800/80 shadow-md hover:border-slate-300 dark:border-slate-700 transition-all"
                >
                  <div className="flex items-center justify-between gap-2 mb-3 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary-400" />
                      <span className="font-bold text-slate-900 dark:text-white">{update.rooms?.title || "Build Room"}</span>
                    </div>
                    <span className="font-mono text-slate-500">{new Date(update.created_at).toLocaleDateString()}</span>
                  </div>

                  <p className="text-slate-700 dark:text-slate-200 text-sm sm:text-base leading-relaxed font-normal mb-4 whitespace-pre-wrap">
                    {update.content}
                  </p>

                  {update.decision_matrix && <DecisionMatrixBlock data={update.decision_matrix} />}
                  {update.diff_data && <CodeDiffViewer data={update.diff_data} />}
                  {update.metric_win && <MetricImpactBadge data={update.metric_win} />}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Roadmap Feed */}
        {activeTab === "roadmap" && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-400" /> Builder Roadmap
              </h2>
            </div>
            <div className="bg-[#111622] rounded-3xl p-6 border border-slate-100 dark:border-slate-800/80 shadow-md">
              <PublicRoadmap builderId={profile.id} />
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
