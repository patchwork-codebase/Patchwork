import { useState } from "react";
import { Link } from "react-router";

const topics = [
  "Product",
  "Design",
  "Engineering",
  "Growth",
  "Writing",
  "Research",
];

const roomSuggestions = [
  {
    id: "moniflow-dashboard",
    title: "MoniFlow BNPL — merchant dashboard",
    tag: "Product",
    status: "Live",
    updates: 12,
    observers: 8,
  },
  {
    id: "palmpay-attendance",
    title: "PalmPay promoter app — attendance feature",
    tag: "Product",
    status: "Live",
    updates: 8,
    observers: 5,
  },
  {
    id: "trust-score-v1",
    title: "Trust Score algorithm — v1",
    tag: "Engineering",
    status: "Paused",
    updates: 21,
    observers: 3,
  },
];

export default function ObserverOnboarding() {
  const [selectedTopics, setSelectedTopics] = useState<string[]>(["Product", "Design"]);
  const [followedRooms, setFollowedRooms] = useState<string[]>(["moniflow-dashboard"]);

  function toggleTopic(topic: string) {
    setSelectedTopics(current =>
      current.includes(topic)
        ? current.filter(item => item !== topic)
        : [...current, topic],
    );
  }

  function toggleFollow(roomId: string) {
    setFollowedRooms(current =>
      current.includes(roomId)
        ? current.filter(id => id !== roomId)
        : [...current, roomId],
    );
  }

  return (
    <div className="min-h-screen bg-[#08070D] text-white px-4 sm:px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#6C5CE7]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#C3B5FF]">
              Observer onboarding
            </span>
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                Start observing builders in real time.
              </h1>
              <p className="max-w-2xl text-sm text-slate-400 leading-relaxed">
                Pick the domains you care about, follow a few live rooms, and jump into a feed of real updates. The more rooms you follow, the better your observer feed becomes.
              </p>
            </div>

            <div className="rounded-[32px] border border-white/[0.08] bg-white/[0.02] p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-slate-500">Choose your interests</div>
                  <p className="mt-2 text-sm text-slate-400">These will tailor the rooms and builders we recommend first.</p>
                </div>
                <div className="text-[11px] font-bold text-slate-300">{selectedTopics.length} selected</div>
              </div>
              <div className="flex flex-wrap gap-3">
                {topics.map(topic => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => toggleTopic(topic)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${selectedTopics.includes(topic)
                      ? 'bg-[#6C5CE7] text-white'
                      : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]'
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-white/[0.08] bg-white/[0.02] p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-5">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-slate-500">Recommended live rooms</div>
                  <p className="mt-2 text-sm text-slate-400">Follow the rooms you want to observe and jump straight into the live feed.</p>
                </div>
                <div className="text-[11px] font-bold text-slate-300">{followedRooms.length} followed</div>
              </div>

              <div className="space-y-4">
                {roomSuggestions.map(room => {
                  const isFollowed = followedRooms.includes(room.id);
                  return (
                    <div key={room.id} className="rounded-3xl border border-white/[0.06] bg-[#0F0C17] p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="text-[13px] uppercase tracking-[0.25em] text-slate-500">{room.tag}</div>
                          <h2 className="mt-2 text-xl font-extrabold text-white">{room.title}</h2>
                          <div className="mt-2 text-sm text-slate-400">{room.status} · {room.updates} updates · {room.observers} observers</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleFollow(room.id)}
                          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${isFollowed ? 'bg-white text-slate-950' : 'bg-[#6C5CE7] text-white hover:bg-[#5b4ed6]'}`}
                        >
                          {isFollowed ? 'Following' : 'Follow'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to="/dashboard/observer"
                className={`inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition ${selectedTopics.length > 0 ? 'bg-[#6C5CE7] text-white hover:bg-[#5b4ed6]' : 'bg-white/[0.06] text-slate-400 cursor-not-allowed'}`}
              >
                Start observing
              </Link>
              <p className="text-sm text-slate-500">You can update these preferences later from your observer feed.</p>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/[0.08] bg-white/[0.02] p-6">
            <div className="space-y-4">
              <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Why observe</div>
              <div className="space-y-3">
                <p className="text-sm text-slate-300">• See the exact moment builders make a decision, not just the finished outcome.</p>
                <p className="text-sm text-slate-300">• React with structured signals, so your feedback is fast and useful.</p>
                <p className="text-sm text-slate-300">• Build a discovery feed that delivers the most relevant updates first.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
