import { useMemo } from "react";
import { Link, useSearchParams } from "react-router";

interface ObserverRoom {
  id: string;
  title: string;
  description: string;
  tag: string;
  updates: number;
  observers: number;
  status: string;
}

interface UpdateItem {
  id: string;
  room: string;
  builder: string;
  time: string;
  text: string;
  reaction: string;
}

const observerRooms: ObserverRoom[] = [
  {
    id: "moniflow-dashboard",
    title: "MoniFlow BNPL — merchant dashboard",
    description: "Follow the team as they tune merchant onboarding and live finance flows.",
    tag: "Product",
    updates: 12,
    observers: 8,
    status: "Live",
  },
  {
    id: "palmpay-attendance",
    title: "PalmPay promoter app — attendance feature",
    description: "Watch the growth team iterate on field adoption and reward mechanics.",
    tag: "Product",
    updates: 8,
    observers: 5,
    status: "Live",
  },
  {
    id: "trust-score-v1",
    title: "Trust Score algorithm — v1",
    description: "See the engineering tradeoffs as the score moves from batch to real time.",
    tag: "Engineering",
    updates: 21,
    observers: 3,
    status: "Paused",
  },
];

const feedUpdates: UpdateItem[] = [
  {
    id: "u1",
    room: "MoniFlow BNPL — merchant dashboard",
    builder: "Ade I.",
    time: "8 min ago",
    text: "Published the first iteration of the new dashboard. The merchant heatmap now shows supply gaps clearly, and the field team can act faster.",
    reaction: "Sharp",
  },
  {
    id: "u2",
    room: "PalmPay promoter app — attendance feature",
    builder: "Funmi O.",
    time: "41 min ago",
    text: "Rethought the onboarding copy. Instead of 'Sign in', the next step now says 'Join the merchant network'. Conversion jumped in internal test.",
    reaction: "Tell me more",
  },
  {
    id: "u3",
    room: "Trust Score algorithm — v1",
    builder: "Chidi K.",
    time: "2 hr ago",
    text: "Switched the fraud score bucket from 5 to 3 tiers. Simpler scores make it easier for merchants to understand why they moved up or down.",
    reaction: "Push back",
  },
];

const suggestedBuilders = [
  { name: "Amara O.", role: "Product Designer", signal: "11 updates this week" },
  { name: "Kofi M.", role: "Growth Engineer", signal: "4 rooms followed" },
  { name: "Sarah J.", role: "Content Strategist", signal: "3 discovery picks" },
];

export default function ObserverDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as 'overview' | 'feed' | 'following') || 'overview';

  const followedRooms = useMemo(() => observerRooms.slice(0, 2), []);
  const activityCount = feedUpdates.length;
  const reactionCount = 17;

  function setTab(tab: 'overview' | 'feed' | 'following') {
    setSearchParams({ tab });
  }

  return (
    <div className="w-full max-w-[1180px] mx-auto px-4 sm:px-6 py-12">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.85fr]">
        <div className="space-y-8">
          <div className="rounded-[32px] border border-white/[0.08] bg-white/[0.02] p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-3">
                <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Observer home</p>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">Watch builders build in public.</h1>
                <p className="max-w-2xl text-sm text-slate-400 leading-relaxed">
                  Follow rooms, discover updates, and react with structured signals that help builders move faster.
                </p>
              </div>
              <Link
                to="/observer-onboarding"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-[#6C5CE7] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#5b4ed6]"
              >
                Update interests
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-3xl border border-white/[0.06] bg-[#0F0C17] p-6">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Rooms followed</p>
                <p className="mt-4 text-4xl font-extrabold text-white">{followedRooms.length}</p>
              </div>
              <div className="rounded-3xl border border-white/[0.06] bg-[#0F0C17] p-6">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Updates today</p>
                <p className="mt-4 text-4xl font-extrabold text-white">{activityCount}</p>
              </div>
              <div className="rounded-3xl border border-white/[0.06] bg-[#0F0C17] p-6">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Reactions given</p>
                <p className="mt-4 text-4xl font-extrabold text-white">{reactionCount}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/[0.08] bg-white/[0.02] p-6">
            <div className="flex flex-wrap gap-2 bg-white/[0.04] border border-white/[0.06] p-2 rounded-full">
              {[
                { key: 'overview', label: 'Overview' },
                { key: 'feed', label: 'Global timeline' },
                { key: 'following', label: 'Following' },
              ].map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setTab(tab.key as 'overview' | 'feed' | 'following')}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeTab === tab.key ? 'bg-[#6C5CE7] text-white' : 'text-slate-300 hover:bg-white/[0.06]'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'overview' && (
            <div className="grid gap-6">
              <div className="rounded-[32px] border border-white/[0.08] bg-[#0F0C17] p-6">
                <div className="flex items-center justify-between gap-4 mb-5">
                  <div>
                    <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Top follow recommendations</p>
                    <h2 className="mt-3 text-2xl font-extrabold text-white">Rooms worth watching</h2>
                  </div>
                  <Link to="/dashboard/explore" className="text-sm font-semibold text-[#8B7CF8] hover:text-white transition">Browse more</Link>
                </div>
                <div className="grid gap-4">
                  {observerRooms.map(room => (
                    <Link key={room.id} to={`/dashboard/room/${room.id}`} className="block rounded-3xl border border-white/[0.06] bg-[#12101B] p-5 transition hover:border-white/[0.12] hover:bg-[#17131F]">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="text-xs uppercase tracking-[0.28em] text-slate-500">{room.tag}</div>
                          <h3 className="mt-2 text-lg font-extrabold text-white">{room.title}</h3>
                        </div>
                        <div className="text-sm text-slate-400">{room.status}</div>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-slate-400">{room.description}</p>
                      <div className="mt-4 flex flex-wrap gap-3 text-[13px] text-slate-500">
                        <span>{room.updates} updates</span>
                        <span>{room.observers} observers</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'feed' && (
            <div className="space-y-4">
              {feedUpdates.map(update => (
                <div key={update.id} className="rounded-[32px] border border-white/[0.08] bg-[#0F0C17] p-6 hover:border-white/[0.12] transition">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-slate-500">{update.builder}</p>
                      <h3 className="mt-2 text-lg font-extrabold text-white">{update.room}</h3>
                    </div>
                    <span className="text-sm text-slate-400">{update.time}</span>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-slate-400">{update.text}</p>
                  <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/[0.03] px-3 py-2 text-sm font-semibold text-[#8B7CF8]">
                    {update.reaction}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'following' && (
            <div className="grid gap-4">
              {followedRooms.map(room => (
                <Link key={room.id} to={`/dashboard/room/${room.id}`} className="block rounded-3xl border border-white/[0.06] bg-[#12101B] p-6 transition hover:border-white/[0.12] hover:bg-[#17131F]">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs uppercase tracking-[0.28em] text-slate-500">{room.tag}</div>
                      <h3 className="mt-2 text-lg font-extrabold text-white">{room.title}</h3>
                    </div>
                    <div className="text-sm text-slate-400">{room.status}</div>
                  </div>
                  <p className="mt-4 text-sm text-slate-400 leading-relaxed">{room.description}</p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <div className="rounded-[32px] border border-white/[0.08] bg-[#0F0C17] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Recent activity</p>
                <h2 className="mt-2 text-xl font-extrabold text-white">What you’ve missed</h2>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              {feedUpdates.slice(0, 3).map(update => (
                <div key={update.id} className="rounded-3xl border border-white/[0.06] bg-[#12101B] p-4">
                  <div className="text-sm font-semibold text-white">{update.builder}</div>
                  <div className="mt-1 text-sm text-slate-400">{update.time} · {update.reaction}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/[0.08] bg-[#0F0C17] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Suggested builders</p>
                <h2 className="mt-2 text-xl font-extrabold text-white">Top observers</h2>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {suggestedBuilders.map(builder => (
                <div key={builder.name} className="rounded-3xl border border-white/[0.06] bg-[#12101B] p-4">
                  <div className="text-sm font-semibold text-white">{builder.name}</div>
                  <div className="text-sm text-slate-400">{builder.role}</div>
                  <div className="mt-2 text-xs uppercase tracking-[0.3em] text-slate-500">{builder.signal}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
