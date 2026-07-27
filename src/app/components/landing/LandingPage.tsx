import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "../auth/AuthContext";
import { AuthRedirectGuard } from "../auth/AuthRedirectGuard";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Plus,
  Flame,
  Clock,
  Users,
  ChevronRight,
  Check,
  HelpCircle,
  ArrowUpRight,
  Send,
  Mail,
  Code,
  Edit3,
  Share2,
  Layers,
  MessageSquareCode,
  MapPin,
  Award,
  Lock,
  ChevronDown,
  Menu,
  X
} from "lucide-react";

import { LandingHeroCapstone } from "./LandingHeroCapstone";
import { LandingLiveFeedMockup } from "./LandingLiveFeedMockup";
import { LandingTargetAudience } from "./LandingTargetAudience";
import { LandingFeaturesCapstone } from "./LandingFeaturesCapstone";
import { LandingWorkflowCapstone } from "./LandingWorkflowCapstone";
import { LandingTestimonials } from "./LandingTestimonials";
import { LandingFAQs } from "./LandingFAQs";
import { LandingFooter } from "./LandingFooter";
import { RecruiterHero } from "./RecruiterHero";
import { RecruiterComparison } from "./RecruiterComparison";
import { RecruiterArtifact } from "./RecruiterArtifact";
import { RecruiterCTA } from "./RecruiterCTA";
import { domainOptions, detailedRooms, showcaseBuilders, workflowSteps, faqs } from "../../constants/landingData";


export default function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, loading } = useAuth();
  const [screen, setScreen] = useState<"landing" | "onboarding" | "dashboard">("landing");
  const [audience, setAudience] = useState<'builders' | 'observers'>('builders');

  // Auto-redirect if already logged in
  useEffect(() => {
    if (!loading) {
      if (user && (location.pathname === "/" || location.pathname === "/login" || location.pathname === "/onboarding")) {
        const returnTo = sessionStorage.getItem('oauth_return_to');
        if (returnTo) {
          sessionStorage.removeItem('oauth_return_to');
          navigate(returnTo);
        } else if (profile) {
          navigate(profile.role === 'observer' ? '/dashboard/observer' : '/dashboard');
        } else {
          navigate('/dashboard');
        }
      }
    }
  }, [user, profile, loading, navigate, location.pathname]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [countryIso, setCountryIso] = useState("");
  const [stateIso, setStateIso] = useState("");
  const [city, setCity] = useState("");
  const [domain, setDomain] = useState("product");
  const [buildingDesc, setBuildingDesc] = useState("");
  const [roomName, setRoomName] = useState("");
  const [roomDomain, setRoomDomain] = useState("product");
  const [firstUpdate, setFirstUpdate] = useState("");

  // Redesign state managers
  const [activeRoomId, setActiveRoomId] = useState("moniflow-dashboard");
  const [activeUpdatesIndex, setActiveUpdatesIndex] = useState(0);
  const [heroRoomReactions, setHeroRoomReactions] = useState<Record<string, number>>({});
  const [userHeroReactions, setUserHeroReactions] = useState<Record<string, boolean>>({});

  const [selectedShowcaseDomain, setSelectedShowcaseDomain] = useState("all");
  const [showcaseReactions, setShowcaseReactions] = useState<Record<string, number>>({});
  const [userShowcaseReactions, setUserShowcaseReactions] = useState<Record<string, boolean>>({});

  const [selectedWorkflowStep, setSelectedWorkflowStep] = useState(1);



  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSent, setNewsletterSent] = useState(false);

  // Lazy load country-state-city
  const [countryLib, setCountryLib] = useState<any>(null);
  const [stateLib, setStateLib] = useState<any>(null);
  const [cityLib, setCityLib] = useState<any>(null);

  useEffect(() => {
    if (screen === "onboarding" && step === 1 && !countryLib) {
      import("country-state-city").then(({ Country, State, City }) => {
        setCountryLib(Country);
        setStateLib(State);
        setCityLib(City);
      });
    }
  }, [screen, step, countryLib]);

  useEffect(() => {
    if (location.pathname === "/onboarding") {
      setScreen("onboarding");
      setStep(1);
    } else if (location.pathname === "/dashboard") {
      setScreen("dashboard");
    } else {
      setScreen("landing");
    }
  }, [location.pathname]);

  const showLanding = () => navigate("/");
  const showOnboarding = () => {
    navigate("/signup");
    setStep(1);
  };
  const showDashboard = () => navigate("/dashboard");

  const selectDomain = (id: string) => {
    setDomain(id);
    setRoomDomain(id);
  };

  const completeOnboarding = () => {
    navigate("/login");
  };

  // Hero Room Interaction handlers
  const handleHeroReaction = (roomId: string, updateIndex: number, reactionType: string) => {
    const key = `${roomId}-${updateIndex}-${reactionType}`;
    const userAlreadyReacted = userHeroReactions[key];

    setUserHeroReactions(prev => ({
      ...prev,
      [key]: !userAlreadyReacted
    }));

    setHeroRoomReactions(prev => {
      const current = prev[key] !== undefined ? prev[key] : 0;
      return {
        ...prev,
        [key]: userAlreadyReacted ? Math.max(0, current - 1) : current + 1
      };
    });
  };

  const getHeroReactionCount = (roomId: string, updateIndex: number, reactionType: string, defaultVal: number) => {
    const key = `${roomId}-${updateIndex}-${reactionType}`;
    return heroRoomReactions[key] !== undefined ? defaultVal + heroRoomReactions[key] : defaultVal;
  };

  // Showcase Filter & Reaction handlers
  const handleShowcaseReaction = (builderId: string, reactionType: string) => {
    const key = `${builderId}-${reactionType}`;
    const userAlreadyReacted = userShowcaseReactions[key];

    setUserShowcaseReactions(prev => ({
      ...prev,
      [key]: !userAlreadyReacted
    }));

    setShowcaseReactions(prev => {
      const current = prev[key] !== undefined ? prev[key] : 0;
      return {
        ...prev,
        [key]: userAlreadyReacted ? Math.max(0, current - 1) : current + 1
      };
    });
  };

  const getShowcaseReactionCount = (builderId: string, reactionType: string, defaultVal: number) => {
    const key = `${builderId}-${reactionType}`;
    return showcaseReactions[key] !== undefined ? defaultVal + showcaseReactions[key] : defaultVal;
  };

  const filteredShowcaseBuilders = selectedShowcaseDomain === "all"
    ? showcaseBuilders
    : showcaseBuilders.filter(b => b.domain === selectedShowcaseDomain);



  // Handle Newsletter Submission
  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setNewsletterSent(true);
      setTimeout(() => {
        setNewsletterEmail("");
        setNewsletterSent(false);
      }, 4000);
    }
  };

  const currentRoom = detailedRooms.find(r => r.id === activeRoomId) || detailedRooms[0];

  return (
    <div className="min-h-screen text-slate-900 font-sans bg-gradient-to-br from-white via-sage-50 to-emerald-50 antialiased selection:bg-primary-500/30 selection:text-white overflow-x-hidden">
      <AuthRedirectGuard />
      {/* ─── Premium Glassmorphic Header ─────────────────────────────────── */}
      <header className="fixed inset-x-0 top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-3 sm:px-6 sm:py-4">
          <div
            onClick={() => {
              showLanding();
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-3 text-lg font-bold tracking-tight text-slate-900 cursor-pointer group"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-[12px] bg-gradient-to-br from-[#6C5CE7] to-[#8B7CF8] text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 12-8.373 8.373a1 1 0 1 1-1.414-1.414L13.586 10.586"/>
                <path d="m18 13.4-9-9"/>
                <path d="M12 4.4 14.6 2l3.4 3.4L15.6 8z"/>
                <path d="M18.4 10.6 21 8l-3.4-3.4L15 7.2"/>
              </svg>
            </div>
            <span className="font-black text-[#0f172a] tracking-tight text-xl">patchwork</span>
          </div>

          <div className="hidden md:flex items-center">
            <div className="flex bg-[#111111] rounded-full p-0.5 border border-[#222222]">
              <button 
                onClick={() => setAudience('builders')}
                className={`text-xs font-bold px-3.5 py-1 rounded-full shadow-sm transition ${audience === 'builders' ? 'text-white bg-black' : 'text-slate-400 hover:text-white bg-transparent'}`}
              >
                For builders
              </button>
              <button 
                onClick={() => setAudience('observers')}
                className={`text-xs font-bold px-3.5 py-1 rounded-full shadow-sm transition ${audience === 'observers' ? 'text-white bg-black' : 'text-slate-400 hover:text-white bg-transparent'}`}
              >
                For observers
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                navigate("/login");
                setMobileMenuOpen(false);
              }}
              className="hidden sm:inline-flex text-sm font-bold text-slate-600 hover:text-slate-900 transition"
            >
              Sign In
            </button>
            <button
              onClick={() => {
                showOnboarding();
                setMobileMenuOpen(false);
              }}
              className="hidden sm:inline-flex rounded-full bg-primary-500 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-primary-500/20 transition hover:bg-primary-600"
            >
              Use Patchwork
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(open => !open)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition sm:hidden"
            >
              {mobileMenuOpen ? <X className="h-[18px] w-[18px]" /> : <Menu className="h-[18px] w-[18px]" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border-b border-slate-200 shadow-xl p-4 sm:hidden flex flex-col gap-4 z-50">
            <div className="flex flex-col gap-2 bg-[#111111] p-2 rounded-xl">
              <button 
                onClick={() => { setAudience('builders'); setMobileMenuOpen(false); }}
                className={`text-sm font-bold px-4 py-2.5 rounded-lg transition text-left ${audience === 'builders' ? 'text-white bg-white/10' : 'text-slate-400 hover:text-white'}`}
              >
                For builders
              </button>
              <button 
                onClick={() => { setAudience('observers'); setMobileMenuOpen(false); }}
                className={`text-sm font-bold px-4 py-2.5 rounded-lg transition text-left ${audience === 'observers' ? 'text-white bg-white/10' : 'text-slate-400 hover:text-white'}`}
              >
                For observers
              </button>
            </div>
            <button
              onClick={() => {
                navigate("/login");
                setMobileMenuOpen(false);
              }}
              className="w-full text-center text-sm font-bold text-slate-600 hover:text-slate-900 py-3.5 rounded-xl border border-slate-200"
            >
              Sign In
            </button>
            <button
              onClick={() => {
                showOnboarding();
                setMobileMenuOpen(false);
              }}
              className="w-full text-center rounded-xl bg-primary-500 px-5 py-3.5 text-sm font-bold text-white shadow-md shadow-primary-500/20"
            >
              Use Patchwork
            </button>
          </div>
        )}
      </header>

      {/* ─── MAIN CONTENT AREA ─────────────────────────────────────────── */}
      <main className="min-h-screen">
        {screen === "landing" && audience === "builders" && (
          <>
            <LandingHeroCapstone onSignup={showOnboarding} />
            <LandingLiveFeedMockup />
            <LandingTargetAudience />
            <LandingFeaturesCapstone />
            <LandingWorkflowCapstone />
            <LandingTestimonials />
            <LandingFAQs />
            <LandingFooter 
              newsletterEmail={newsletterEmail}
              setNewsletterEmail={setNewsletterEmail}
              newsletterSent={newsletterSent}
              handleNewsletterSubmit={handleNewsletterSubmit}
            />
          </>
        )}

        {screen === "landing" && audience === "observers" && (
          <>
            <RecruiterHero />
            <RecruiterComparison />
            <RecruiterArtifact />
            <RecruiterCTA />
          </>
        )}

        {/* ─── Redesigned Premium Onboarding Flow ───────────────────────── */}
        {screen === "onboarding" && (
          <section id="onboarding" className="min-h-screen bg-[#FAFAF9] py-16 flex items-center">
            <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 lg:flex-row w-full items-stretch">

              {/* Onboarding Sidebar */}
              <aside className="w-full rounded-[24px] border border-slate-200 bg-white p-6 sm:p-8 text-slate-900 lg:w-[360px] flex flex-col justify-between">
                <div className="space-y-8">
                  <div className="flex items-center gap-3 text-lg font-extrabold">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500 text-white">⚒️</span>
                    <span>patchwork</span>
                  </div>

                  <div className="space-y-6">
                    {[
                      { num: 1, title: "Create account", desc: "name · email · password" },
                      { num: 2, title: "Your domain", desc: "what do you build?" },
                      { num: 3, title: "Open your first room", desc: "name it · frame the build" },
                      { num: 4, title: "Post first update", desc: "write · publish · begin" },
                    ].map(item => {
                      const isActive = step === item.num;
                      const isDone = step > item.num;
                      return (
                        <div key={item.num} className="flex gap-4">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition ${isActive
                            ? "border-primary-500 bg-primary-500/15 text-primary-400"
                            : isDone
                              ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                              : "border-slate-200 text-slate-500"
                            }`}>
                            {isDone ? "✓" : item.num}
                          </div>
                          <div>
                            <div className={`text-sm font-bold transition ${isActive ? "text-slate-900" : isDone ? "text-slate-700" : "text-slate-500"}`}>
                              {item.title}
                            </div>
                            <div className="text-[10px] font-mono text-slate-500 mt-0.5">{item.desc}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-12 pt-6 border-t border-slate-200 hidden lg:block">
                  <p className="font-serif italic text-xs text-slate-600 leading-relaxed">
                    "The feed rewards in-progress updates and honest pivots — not launch announcements."
                  </p>
                  <p className="mt-2 text-[9px] font-mono uppercase tracking-wider text-slate-500">
                    // patchwork design principle #3
                  </p>
                </div>
              </aside>

              {/* Onboarding Wizard Card */}
              <div className="flex-1 rounded-[24px] border border-slate-200 bg-white p-6 sm:p-8 md:p-12 shadow-xl flex flex-col justify-between">

                {step === 1 && (
                  <div className="space-y-6">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-primary-400 font-bold">Step 1 of 4</span>
                      <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">Create your builder account</h2>
                      <p className="mt-1.5 text-xs text-slate-600">You're joining as a founding builder. Start creating your profile.</p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">First name</label>
                        <input
                          value={fname}
                          onChange={e => setFname(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white shadow-sm px-4 py-3 text-xs text-slate-900 outline-none focus:border-primary-500 transition"
                          placeholder="Akin"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Last name</label>
                        <input
                          value={lname}
                          onChange={e => setLname(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white shadow-sm px-4 py-3 text-xs text-slate-900 outline-none focus:border-primary-500 transition"
                          placeholder="Rodolu"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 block">Email Address</label>
                      <input
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        type="email"
                        className="w-full rounded-xl border border-slate-200 bg-white shadow-sm px-4 py-3 text-xs text-slate-900 outline-none focus:border-primary-500 transition"
                        placeholder="you@builder.com"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 block">Password</label>
                      <input
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        type="password"
                        className="w-full rounded-xl border border-slate-200 bg-white shadow-sm px-4 py-3 text-xs text-slate-900 outline-none focus:border-primary-500 transition"
                        placeholder="••••••••••"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 block">Country</label>
                        <select
                          value={countryIso}
                          onChange={e => { setCountryIso(e.target.value); setStateIso(""); setCity(""); }}
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-900 outline-none focus:border-primary-500 transition"
                        >
                          <option value="">Select Country</option>
                          {countryLib?.getAllCountries().map((c: any) => (
                            <option key={c.isoCode} value={c.isoCode}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 block">State</label>
                        <select
                          value={stateIso}
                          onChange={e => { setStateIso(e.target.value); setCity(""); }}
                          disabled={!countryIso}
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-900 outline-none focus:border-primary-500 transition disabled:opacity-50"
                        >
                          <option value="">Select State</option>
                          {countryIso && stateLib?.getStatesOfCountry(countryIso).map((s: any) => (
                            <option key={s.isoCode} value={s.isoCode}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 block">City</label>
                        <select
                          value={city}
                          onChange={e => setCity(e.target.value)}
                          disabled={!stateIso}
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-900 outline-none focus:border-primary-500 transition disabled:opacity-50"
                        >
                          <option value="">Select City</option>
                          {stateIso && cityLib?.getCitiesOfState(countryIso, stateIso).map((c: any) => (
                            <option key={c.name} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row pt-4">
                      <button
                        onClick={() => setStep(2)}
                        disabled={!fname || !lname || !email || !password || !countryIso || !stateIso || !city}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-500 hover:bg-[#5b4ed6] px-6 py-3 text-xs font-bold text-white transition disabled:opacity-50"
                      >
                        Continue <ArrowRight className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => navigate('/login')}
                        className="inline-flex items-center justify-center rounded-full border border-slate-200 hover:bg-white shadow-sm px-6 py-3 text-xs font-semibold text-slate-700 transition"
                      >
                        Sign In Instead
                      </button>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-primary-400 font-bold">Step 2 of 4</span>
                      <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">What do you build?</h2>
                      <p className="mt-1.5 text-xs text-slate-600">Select your primary domain. You can write across domains, but this acts as your home reputation base.</p>
                    </div>

                    <div className="space-y-3">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Primary domain</div>
                      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
                        {domainOptions.map(option => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => selectDomain(option.id)}
                            className={`rounded-xl border p-4 text-left transition flex flex-col items-center justify-center text-center ${domain === option.id
                              ? "border-primary-500 bg-primary-500/10 text-white"
                              : "border-slate-200 bg-white shadow-sm text-slate-600 hover:border-primary-500/45"
                              }`}
                          >
                            <span className="text-2xl">{option.icon}</span>
                            <span className="mt-2 text-xs font-bold block">{option.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-700">
                        <span>What are you currently building?</span>
                        <span className="text-[10px] font-mono text-slate-500">One sentence</span>
                      </div>
                      <textarea
                        value={buildingDesc}
                        onChange={e => setBuildingDesc(e.target.value)}
                        rows={3}
                        className="w-full rounded-xl border border-slate-200 bg-white shadow-sm px-4 py-3 text-xs text-slate-900 outline-none focus:border-primary-500 transition resize-none"
                        placeholder="e.g. A BNPL product for informal market merchants in Lagos using PalmPay's distribution network"
                      />
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row pt-4">
                      <button
                        onClick={() => setStep(3)}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-500 hover:bg-[#5b4ed6] px-6 py-3 text-xs font-bold text-white transition"
                      >
                        Continue <ArrowRight className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setStep(1)}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 hover:bg-white shadow-sm px-6 py-3 text-xs font-semibold text-slate-700 transition"
                      >
                        ← Back
                      </button>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-6">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-primary-400 font-bold">Step 3 of 4</span>
                      <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">Open your first build room</h2>
                      <p className="mt-1.5 text-xs text-slate-600">Name the project or milestone you are building. This acts as your room headline.</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 block">Room name</label>
                      <input
                        value={roomName}
                        onChange={e => setRoomName(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white shadow-sm px-4 py-3 text-xs text-slate-900 outline-none focus:border-primary-500 transition"
                        placeholder="e.g. MoniFlow BNPL merchant dashboard"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 block">Domain tag</label>
                      <select
                        value={roomDomain}
                        onChange={e => setRoomDomain(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-900 outline-none focus:border-primary-500 transition"
                      >
                        <option value="product">🧩 Product</option>
                        <option value="design">🎨 Design</option>
                        <option value="engineering">⚙️ Engineering</option>
                        <option value="writing">✍️ Writing</option>
                        <option value="growth">📈 Growth</option>
                      </select>
                    </div>

                    {/* Room Mock Preview */}
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-2">
                      <span className="inline-flex rounded-full bg-primary-500/15 border border-primary-500/20 px-2.5 py-0.5 text-[9px] font-bold text-primary-400 uppercase">
                        {roomDomain}
                      </span>
                      <div className="text-base font-bold text-slate-900">
                        {roomName || "Your room name will appear here"}
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono">Day 1 · 0 updates · 0 observers</p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row pt-4">
                      <button
                        onClick={() => setStep(4)}
                        disabled={!roomName}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-500 hover:bg-[#5b4ed6] px-6 py-3 text-xs font-bold text-white transition disabled:opacity-50"
                      >
                        Open Room <ArrowRight className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setStep(2)}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 hover:bg-white shadow-sm px-6 py-3 text-xs font-semibold text-slate-700 transition"
                      >
                        ← Back
                      </button>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-6">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-amber-500 font-bold">Step 4 of 4 — the most important step</span>
                      <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">Post your first update</h2>
                      <p className="mt-1.5 text-xs text-slate-600">Write what's actually happening in your build right now — a design scrapped, a bug solved, or a decision made.</p>
                    </div>

                    <div className="rounded-xl border border-primary-500/20 bg-primary-500/5 p-4.5 text-xs text-primary-200/90 leading-relaxed">
                      💡 <strong>Good updates:</strong> a decision you just made and why · something you thought would work but didn't · the hardest open query in your build.
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 block">First update text</label>
                      <textarea
                        value={firstUpdate}
                        onChange={e => setFirstUpdate(e.target.value)}
                        rows={5}
                        className="w-full rounded-xl border border-slate-200 bg-white shadow-sm p-4 text-xs text-slate-900 font-serif italic outline-none focus:border-primary-500 transition resize-none leading-relaxed"
                        placeholder="e.g. Scrapped onboarding flow v1. Moving KYC check to step 1 and cutting remaining onboarding steps to reduce field drop-offs."
                      />
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row pt-4">
                      <button
                        onClick={completeOnboarding}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-500 hover:bg-[#5b4ed6] px-8 py-3.5 text-xs font-bold text-white transition shadow-lg"
                      >
                        Publish and enter Patchwork 🚀
                      </button>
                      <button
                        onClick={() => setStep(3)}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 hover:bg-white shadow-sm px-6 py-3 text-xs font-semibold text-slate-700 transition"
                      >
                        ← Back
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </section>
        )}

        {/* ─── Fallback Dashboard View (Redirect target or local simulation) ── */}
        {screen === "dashboard" && (
          <section id="dashboard" className="min-h-screen bg-[#FAFAF9] py-24">
            <div className="mx-auto max-w-7xl px-6">
              <div className="grid gap-8 lg:grid-cols-[1fr_300px]">

                {/* Main panel */}
                <div className="rounded-[24px] border border-slate-200 bg-white p-6 sm:p-8 space-y-6 sm:space-y-8">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-6">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Good morning, Akin 👋</h1>
                      <p className="text-xs text-slate-500 font-mono mt-1">Wednesday, 3 June 2026 · Lagos, Nigeria</p>
                    </div>
                    <button className="rounded-full bg-primary-500 hover:bg-[#5b4ed6] px-6 py-3 text-xs font-bold text-white transition flex items-center gap-1.5 shrink-0">
                      <Plus className="h-4 w-4" />
                      <span>New room</span>
                    </button>
                  </div>

                  {/* Stat cards */}
                  <div className="grid gap-4 sm:grid-cols-4">
                    {[
                      { label: "active rooms", value: "3", delta: "↑ 1 this week", color: "text-primary-400" },
                      { label: "total reactions", value: "47", delta: "↑ 12 today", color: "text-amber-500" },
                      { label: "observers", value: "28", delta: "↑ 5 new", color: "text-emerald-500" },
                      { label: "build logs", value: "1", delta: "1 completed", color: "text-slate-600" },
                    ].map(stat => (
                      <div key={stat.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-1">
                        <div className="text-2xl font-black text-slate-900">{stat.value}</div>
                        <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{stat.label}</div>
                        <div className={`text-[10px] font-semibold pt-1 ${stat.color}`}>{stat.delta}</div>
                      </div>
                    ))}
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
                    {["Overview", "My rooms", "Global timeline"].map((tab, idx) => (
                      <button
                        key={tab}
                        className={`rounded-full px-4 py-2 text-xs font-bold transition ${idx === 0
                          ? "bg-primary-500/15 text-primary-400 border border-primary-500/25"
                          : "text-slate-600 hover:text-slate-900"
                          }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {/* Active Rooms */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-600 uppercase tracking-wider">
                      <span>Active rooms</span>
                      <button className="text-xs text-primary-400 font-bold">View all</button>
                    </div>
                    <div className="space-y-3">
                      {detailedRooms.map(room => (
                        <div
                          key={room.id}
                          className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6 hover:border-primary-500/35 transition flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4 sm:gap-0"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-2 w-12 rounded-full" style={{ background: room.color }} />
                            <div>
                              <h3 className="text-sm font-bold text-slate-900">{room.title}</h3>
                              <p className="text-[10px] text-slate-500 font-mono mt-1 capitalize">
                                {room.status} · Day {room.dayCount} · {room.updates.length} updates
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <span className="rounded-full bg-primary-500/15 border border-primary-500/20 px-2 py-0.5 text-[9px] font-bold text-primary-400 uppercase">
                              {room.badge}
                            </span>
                            <span className="text-[10px] text-slate-600 font-semibold">
                              {room.updates.reduce((a, b) => a + b.reactions.sharp + b.reactions.pushback + b.reactions.tellmemore, 0)} reactions
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Panel */}
                <aside className="space-y-6">
                  {/* Recent Activity */}
                  <div className="rounded-[24px] border border-slate-200 bg-white p-6 space-y-4">
                    <div className="text-[10px] font-extrabold uppercase text-slate-600 tracking-wider">Recent Activity</div>

                    <div className="space-y-4">
                      {[
                        { name: "Tobi", text: "reacted \"Sharp\" to your update", time: "8 min ago" },
                        { name: "Funmi", text: "started following your room", time: "41 min ago" },
                        { name: "Ade", text: "reacted \"Tell me more\" to PalmPay update", time: "2 hr ago" },
                        { name: "James", text: "reacted \"Push back\" to MoniFlow v2", time: "5 hr ago" }
                      ].map((item, idx) => (
                        <div key={idx} className="flex gap-2.5 items-start">
                          <span className="h-2 w-2 rounded-full bg-primary-500 mt-1 shrink-0" />
                          <div>
                            <p className="text-xs text-slate-700">
                              <strong className="text-slate-900 font-bold">{item.name}</strong> {item.text}
                            </p>
                            <span className="text-[9px] font-mono text-slate-500 block mt-1">{item.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Observers on MoniFlow */}
                  <div className="rounded-[24px] border border-slate-200 bg-white p-6 space-y-4">
                    <div className="text-[10px] font-extrabold uppercase text-slate-600 tracking-wider">Observers on MoniFlow</div>

                    <div className="space-y-3">
                      {[
                        { initials: "TN", name: "Tobi N.", visits: "8 visits", bg: "bg-indigo-500/10 text-indigo-400" },
                        { initials: "FO", name: "Funmi O.", visits: "5 visits", bg: "bg-emerald-500/10 text-emerald-400" },
                        { initials: "AI", name: "Ade I.", visits: "3 visits", bg: "bg-amber-500/10 text-amber-400" },
                        { initials: "PM", name: "Priya M.", visits: "2 visits", bg: "bg-rose-500/10 text-rose-400" }
                      ].map((observer, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2.5">
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold font-mono text-[10px] ${observer.bg}`}>
                              {observer.initials}
                            </div>
                            <span className="font-semibold text-slate-700">{observer.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-500">{observer.visits}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Post Today's Update CTA */}
                  <div className="rounded-[24px] bg-gradient-to-tr from-primary-500 to-[#4A3DB8] p-6 space-y-3 text-slate-900">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-primary-200">
                      POST TODAY'S UPDATE
                    </div>
                    <p className="text-xs text-primary-100/90 leading-relaxed">
                      Last update: 2 days ago. Your active observers are watching. Keep momentum high.
                    </p>
                    <button className="w-full rounded-full bg-white/10 hover:bg-white/15 px-4 py-2.5 text-xs font-bold text-slate-900 transition border border-slate-200">
                      Open MoniFlow Room →
                    </button>
                  </div>
                </aside>

              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
