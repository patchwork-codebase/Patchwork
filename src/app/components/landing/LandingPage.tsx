import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
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

// Domain options for setup and filtering
const domainOptions = [
  { id: "product", icon: "🧩", label: "Product" },
  { id: "design", icon: "🎨", label: "Design" },
  { id: "engineering", icon: "⚙️", label: "Engineering" },
  { id: "writing", icon: "✍️", label: "Writing" },
  { id: "growth", icon: "📈", label: "Growth" },
  { id: "research", icon: "🔬", label: "Research" },
];

// Interactive rooms dataset
const detailedRooms = [
  {
    id: "moniflow-dashboard",
    title: "MoniFlow BNPL — merchant dashboard",
    domain: "product",
    status: "Live",
    dayCount: 12,
    color: "#6C5CE7",
    badge: "product",
    initials: "MF",
    location: "Lagos, Nigeria",
    updates: [
      {
        time: "2 hours ago",
        text: "Scrapped the full merchant onboarding flow — it was 9 steps. Realised the real problem is merchants don't know their eligibility upfront. Moving KYC check to step 1 and cutting everything else to 4 steps. Drop-off should fall significantly.",
        reactions: { sharp: 14, pushback: 3, tellmemore: 7 }
      },
      {
        time: "Yesterday",
        text: "First version of the repayment calculator is live internally. The weekly vs monthly toggle was confusing promoters — simplified to a single slider. Will test with field team on Friday.",
        reactions: { sharp: 8, pushback: 0, tellmemore: 12 }
      },
      {
        time: "3 days ago",
        text: "Spoke to 5 merchants in Alaba market. Their biggest fear isn't interest rates; it's cash flow predictability. They want daily payouts to restock. Redesigning payout logic to support instant settlement.",
        reactions: { sharp: 19, pushback: 1, tellmemore: 5 }
      }
    ],
    observers: [
      { initials: "TN", name: "Tobi N.", visits: "8 visits", bg: "#F0EEFF", color: "#6C5CE7" },
      { initials: "FO", name: "Funmi O.", visits: "5 visits", bg: "#E8F5E9", color: "#2E7D32" },
      { initials: "AI", name: "Ade I.", visits: "3 visits", bg: "#FFF8E1", color: "#F57F17" },
      { initials: "PM", name: "Priya M.", visits: "2 visits", bg: "#FFF0F3", color: "#C2185B" }
    ]
  },
  {
    id: "palmpay-app",
    title: "PalmPay promoter app — attendance feature",
    domain: "product",
    status: "Live",
    dayCount: 8,
    color: "#00B37E",
    badge: "product",
    initials: "PP",
    location: "Nairobi, Kenya",
    updates: [
      {
        time: "4 hours ago",
        text: "Promoters are bypassing geo-fencing by using GPS spoofers. Added device-level signature checks and integrated network cell tower triangulation. Spoofing drops to zero in tests.",
        reactions: { sharp: 22, pushback: 1, tellmemore: 9 }
      },
      {
        time: "Yesterday",
        text: "Tested onboarding in offline mode. If SQLite sync fails, the promoter is stuck on the login screen. Added automatic offline queueing with local storage encryption.",
        reactions: { sharp: 12, pushback: 2, tellmemore: 6 }
      }
    ],
    observers: [
      { initials: "PM", name: "Priya M.", visits: "12 visits", bg: "#FFF0F3", color: "#C2185B" },
      { initials: "TN", name: "Tobi N.", visits: "4 visits", bg: "#F0EEFF", color: "#6C5CE7" },
      { initials: "KM", name: "Kofi M.", visits: "2 visits", bg: "#E3F2FD", color: "#1E88E5" }
    ]
  },
  {
    id: "moniflow-algorithm",
    title: "MoniFlow Trust Score algorithm — v1",
    domain: "engineering",
    status: "Paused",
    dayCount: 21,
    color: "#F59E0B",
    badge: "engineering",
    initials: "TS",
    location: "Lagos, Nigeria",
    updates: [
      {
        time: "1 day ago",
        text: "Optimized Postgres score calculation query. Added compound indexes on (merchant_id, score_type, created_at) which cut query execution time from 450ms to 12ms. API throughput up by 40%.",
        reactions: { sharp: 31, pushback: 0, tellmemore: 14 }
      },
      {
        time: "4 days ago",
        text: "Fitted XGBoost model using merchant transactional frequency data. Precision is 89% but recall is low for new merchants. Adding phone recharge frequency as a proxy feature for cash flow.",
        reactions: { sharp: 15, pushback: 4, tellmemore: 8 }
      }
    ],
    observers: [
      { initials: "AI", name: "Ade I.", visits: "15 visits", bg: "#FFF8E1", color: "#F57F17" },
      { initials: "FO", name: "Funmi O.", visits: "9 visits", bg: "#E8F5E9", color: "#2E7D32" },
      { initials: "DB", name: "Dave B.", visits: "6 visits", bg: "#EDE7F6", color: "#5E35B1" }
    ]
  }
];

// Showcase builders dataset
const showcaseBuilders = [
  {
    id: "builder-amara",
    name: "Amara O.",
    title: "Senior Product Designer",
    domain: "design",
    location: "Nairobi, Kenya",
    rep: 342,
    avatarColor: "#E2F0D9",
    avatarText: "AO",
    bio: "Crafting fintech interfaces that make sense. Currently designing MoniFlow's consumer portal.",
    projectTitle: "MoniFlow Consumer Portal",
    updateTime: "15 min ago",
    updateText: "Ditching bottom navigation bar for a floating action dock. In user tests, thumbs naturally hover at the lower center. Placing transactions + transfer there boosted task completion speed by 25%.",
    reactions: { sharp: 24, pushback: 2, tellmemore: 9 }
  },
  {
    id: "builder-chidi",
    name: "Chidi K.",
    title: "Backend Engineer",
    domain: "engineering",
    location: "Lagos, Nigeria",
    rep: 512,
    avatarColor: "#FFF2CC",
    avatarText: "CK",
    bio: "Rust & Go enthusiast. Making API requests blazingly fast.",
    projectTitle: "Realtime WebSockets Sync",
    updateTime: "1 hour ago",
    updateText: "Migrated from polling to WebSockets for room activity. Redis Pub/Sub handles message broadcasting. Connected client memory footprint reduced from 14MB to 1.2MB per socket connection.",
    reactions: { sharp: 41, pushback: 0, tellmemore: 15 }
  },
  {
    id: "builder-sarah",
    name: "Sarah J.",
    title: "Content Strategist",
    domain: "writing",
    location: "London, UK",
    rep: 198,
    avatarColor: "#FCE4D6",
    avatarText: "SJ",
    bio: "Translating complex technical workflows into human copy.",
    projectTitle: "Microcopy Refactor",
    updateTime: "3 hours ago",
    updateText: "Changed 'Submit Application' button text to 'Check Eligibility in 2 Mins'. Conversion rate increased by 18.4%. People hate submitting, but they love checking if they qualify.",
    reactions: { sharp: 18, pushback: 4, tellmemore: 11 }
  },
  {
    id: "builder-kofi",
    name: "Kofi M.",
    title: "Growth Engineer",
    domain: "growth",
    location: "Accra, Ghana",
    rep: 285,
    avatarColor: "#E1F5FE",
    avatarText: "KM",
    bio: "Scaling products from zero to one. Building loops, not funnels.",
    projectTitle: "Referral Loop Integration",
    updateTime: "Yesterday",
    updateText: "Implemented double-sided reward popups. Instead of spamming contact lists, we trigger referral prompts right after a user completes a successful transfer. Share rate rose by 3x.",
    reactions: { sharp: 31, pushback: 5, tellmemore: 8 }
  },
  {
    id: "builder-renata",
    name: "Renata S.",
    title: "UX Researcher",
    domain: "research",
    location: "São Paulo, Brazil",
    rep: 220,
    avatarColor: "#F3E5F5",
    avatarText: "RS",
    bio: "Listening to user pain points to shape product roadmaps.",
    projectTitle: "Field Study in Small Shops",
    updateTime: "2 days ago",
    updateText: "Spent 4 hours shadowing shop owners. 4 out of 5 keep their phones face down while working to avoid oil/dust. Audio cues for incoming transactions are way more critical than screen notifications.",
    reactions: { sharp: 56, pushback: 1, tellmemore: 22 }
  }
];

// Workflow timeline steps details
const workflowSteps = [
  {
    step: 1,
    title: "Open a Build Room",
    description: "Initialize a focus workspace tied to a specific project milestone, release, or product experiment. Keep it simple and clear. This is your canvas.",
    points: [
      "Define clean goals, target timelines, and your current coordinates.",
      "Automatically alerts observers that a new build is underway.",
      "Creates a blank timeline ready to capture your process raw."
    ],
    mockup: {
      tag: "PRODUCT",
      title: "MoniFlow BNPL — merchant dashboard",
      status: "Day 1 of build · 0 updates",
      content: "Aiming to build a streamlined BNPL merchant onboarding portal in 14 days. Primary challenge is integrating third-party KYC checks without causing friction."
    }
  },
  {
    step: 2,
    title: "Stream Raw Progress",
    description: "Post regular updates as you design, write, code, or research. Share what works, what was scrapped, screenshot changes, and open questions. No polish, just proof.",
    points: [
      "Write quick text updates or attach screenshots, links, and code.",
      "Share pivot points: explaining why you changed direction yields high reputation.",
      "Integrate into your flow: standard updates take less than 2 minutes."
    ],
    mockup: {
      tag: "ENGINEERING",
      title: "KYC WebSync Integration",
      status: "Day 5 of build · 3 updates",
      content: "Spent 3 hours fighting the sandbox API. Decided to dump their SDK entirely and write custom curl handlers. Got latency down from 2.2s to 400ms. Code attached."
    }
  },
  {
    step: 3,
    title: "Receive Structured Feedback",
    description: "Get feedback that actually helps you ship. Patchwork disables comments and limits reactions to three specific signals to avoid noise and promote quality.",
    points: [
      "✦ Sharp: A nod to clever solutions or crisp execution.",
      "↩ Push back: Constructive feedback indicating something might be off.",
      "? Tell me more: Requests for further detail, code snippets, or user test data."
    ],
    mockup: {
      tag: "DESIGN",
      title: "Onboarding UI revision 4",
      status: "Day 8 of build · 6 updates",
      content: "Replaced the multiple dropdown selectors with a unified auto-complete search bar. Less steps, faster onboarding.",
      pillActions: true
    }
  },
  {
    step: 4,
    title: "Generate a Build Log",
    description: "When you finish building, hit 'Ship'. Patchwork compiles your room into a beautiful, shareable Build Log — an interactive proof-of-work history that stands out to companies.",
    points: [
      "Export as a clean, interactive resume or showcase item.",
      "Contains the full chronological history, including your struggles and pivots.",
      "Provides companies with 100x more signal than standard resume bullet points."
    ],
    mockup: {
      tag: "COMPLETED BUILD LOG",
      title: "MoniFlow BNPL Merchant Portal",
      status: "14 Days Build · 12 updates · 47 Observers",
      content: "This project has shipped live. Check out the full, step-by-step history of design iterations, backend sync optimizations, and user feedback responses."
    }
  }
];

// FAQs Dataset
const faqs = [
  {
    q: "What is Patchwork exactly?",
    a: "Patchwork is a platform where product managers, developers, designers, and growth marketers build in public. Instead of sharing polished portfolio case studies or personal opinions, you share your live process — day-to-day progress, failures, pivots, and iterations."
  },
  {
    q: "How does the Reputation system work?",
    a: "Your reputation score builds as you share high-quality updates and provide value to others. Actions like documenting why you scrapped a feature, sharing user testing data, or giving constructive 'Push back' feedback to other builders yield reputation points. It is a merit-based signal of how you work."
  },
  {
    q: "Can I make my rooms private?",
    a: "By default, Patchwork rooms are open to encourage collaboration and transparency. However, founding builders can create private rooms visible only to verified observers (like specific team members or prospective employers) using invite links."
  },
  {
    q: "What are the structured reactions?",
    a: "We found that open comment sections often lead to generic spam or noise. Patchwork limits reactions to three signals: '✦ This is sharp' (for quality execution), '↩ I'd push back' (for potential issues), and '? Tell me more' (for curiosity/details). This keeps conversation high-signal."
  },
  {
    q: "How do companies use Patchwork?",
    a: "Tech companies subscribe to Patchwork to watch talent build in real-time. Instead of judging you based on a 45-minute whiteboard test or a resume bullet, they can observe your engineering standards, communication, and adaptability over a multi-week build log."
  }
];

export default function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [screen, setScreen] = useState<"landing" | "onboarding" | "dashboard">("landing");
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

  const [calcUpdates, setCalcUpdates] = useState(3);
  const [calcReactions, setCalcReactions] = useState(15);
  const [calcObservers, setCalcObservers] = useState(10);

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
    navigate("/onboarding");
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

  // Reputation Calculator Math
  const calculateReputation = () => {
    const updatePoints = calcUpdates * 10;
    const reactionPoints = calcReactions * 5;
    const observerPoints = calcObservers * 15;
    return updatePoints + reactionPoints + observerPoints;
  };

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
    <div className="min-h-screen text-white font-sans bg-[#08070D] antialiased selection:bg-[#6C5CE7]/30 selection:text-white">
      {/* ─── Premium Glassmorphic Header ─────────────────────────────────── */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[#08070D]/95 backdrop-blur-xl shadow-[0_25px_80px_rgba(0,0,0,0.18)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-3 sm:px-6 sm:py-4">
          <div
            onClick={() => {
              showLanding();
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-3 text-base sm:text-lg font-bold tracking-tight text-white cursor-pointer group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#6C5CE7] to-[#8B7CF8] shadow-[0_10px_30px_rgba(108,92,231,0.25)] transition-transform duration-300 group-hover:-translate-y-0.5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 12L9 6 3 12l1.5 1.5L9 9l4.5 4.5L15 12Z" />
                <path d="M15 12l4.5 4.5-1.5 1.5L13.5 13.5" />
                <path d="M9 6l3-3 3 3" />
              </svg>
            </div>
            <span className="flex items-center gap-2 font-extrabold tracking-[-0.03em] text-base sm:text-xl text-white group">
              <span>patch<span className="inline-block text-[#6C5CE7] group-hover:animate-[spin_2s_linear_infinite]">·</span>work</span>
              <span className="rounded bg-[#6C5CE7]/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#8B7CF8]">Beta</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
              className="text-[13px] font-medium text-slate-300 hover:text-white transition"
            >
              Why Patchwork
            </button>
            <button
              onClick={() => document.getElementById("workflow")?.scrollIntoView({ behavior: "smooth" })}
              className="text-[13px] font-medium text-slate-300 hover:text-white transition"
            >
              How it works
            </button>
            <button
              onClick={() => document.getElementById("showcase")?.scrollIntoView({ behavior: "smooth" })}
              className="text-[13px] font-medium text-slate-300 hover:text-white transition"
            >
              Showcase
            </button>
            <button
              onClick={() => document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" })}
              className="text-[13px] font-medium text-slate-300 hover:text-white transition"
            >
              FAQ
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                navigate("/login");
                setMobileMenuOpen(false);
              }}
              className="hidden sm:inline-flex rounded-full px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition"
            >
              Sign In
            </button>
            <button
              onClick={() => {
                showOnboarding();
                setMobileMenuOpen(false);
              }}
              className="hidden sm:inline-flex rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#8B7CF8] px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_30px_rgba(108,92,231,0.25)] transition hover:opacity-95 active:scale-[0.98]"
            >
              Join as a builder
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(open => !open)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-white transition hover:border-white/20 sm:hidden"
              aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-white/[0.08] bg-[#08070D]/95 px-5 pb-4 pt-3">
            <div className="space-y-3">
              <button
                onClick={() => {
                  showOnboarding();
                  setMobileMenuOpen(false);
                }}
                className="w-full rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#8B7CF8] px-5 py-3 text-sm font-bold text-white shadow-[0_10px_30px_rgba(108,92,231,0.22)] transition hover:opacity-95"
              >
                Join as a builder
              </button>
              <button
                onClick={() => {
                  navigate("/login");
                  setMobileMenuOpen(false);
                }}
                className="w-full rounded-full border border-white/[0.12] bg-white/[0.03] px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/[0.05]"
              >
                Sign In
              </button>
              <div className="grid gap-2 rounded-3xl border border-white/[0.06] bg-white/[0.02] p-3">
                <button
                  onClick={() => {
                    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
                    setMobileMenuOpen(false);
                  }}
                  className="w-full rounded-2xl px-4 py-3 text-left text-sm font-medium text-slate-300 hover:text-white hover:bg-white/[0.04] transition"
                >
                  Why Patchwork
                </button>
                <button
                  onClick={() => {
                    document.getElementById("workflow")?.scrollIntoView({ behavior: "smooth" });
                    setMobileMenuOpen(false);
                  }}
                  className="w-full rounded-2xl px-4 py-3 text-left text-sm font-medium text-slate-300 hover:text-white hover:bg-white/[0.04] transition"
                >
                  How it works
                </button>
                <button
                  onClick={() => {
                    document.getElementById("showcase")?.scrollIntoView({ behavior: "smooth" });
                    setMobileMenuOpen(false);
                  }}
                  className="w-full rounded-2xl px-4 py-3 text-left text-sm font-medium text-slate-300 hover:text-white hover:bg-white/[0.04] transition"
                >
                  Showcase
                </button>
                <button
                  onClick={() => {
                    document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" });
                    setMobileMenuOpen(false);
                  }}
                  className="w-full rounded-2xl px-4 py-3 text-left text-sm font-medium text-slate-300 hover:text-white hover:bg-white/[0.04] transition"
                >
                  FAQ
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ─── MAIN CONTENT AREA ─────────────────────────────────────────── */}
      <main className="min-h-screen">
        {screen === "landing" && (
          <>
            {/* ─── Hero / Main Landing Screen ──────────────────────────── */}
            <section id="hero" className="relative overflow-hidden pt-24 pb-20 sm:pt-28 sm:pb-24 md:pt-40 md:pb-36 bg-[#08070D]">
              {/* Radial gradient background effects */}
              <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle,rgba(108,92,231,0.15)_0%,transparent_65%)] pointer-events-none" />
              <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle,rgba(139,124,248,0.1)_0%,transparent_70%)] pointer-events-none" />
              {/* Glowing mesh overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

              <div className="mx-auto max-w-7xl px-6">
                <div className="grid gap-12 lg:grid-cols-12 lg:items-center">

                  {/* Hero Left Content */}
                  <div className="lg:col-span-6 text-left space-y-6">
                    <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-1.5 text-[11px] font-semibold tracking-wider text-[#8B7CF8] uppercase">
                      <span className="block h-2 w-2 rounded-full bg-[#00B37E] animate-pulse" />
                      47 builders streaming proof-of-work live
                    </div>

                    <h1 className="text-4xl sm:text-6xl font-extrabold leading-[1.08] tracking-[-0.04em] text-white">
                      Build in the open.<br />
                      <span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-[#8B7CF8] to-[#DDD8FF]">
                        Ship with proof.
                      </span>
                    </h1>

                    <p className="max-w-xl text-base sm:text-lg text-slate-400 leading-relaxed">
                      The network where builders stream their work-in-progress, not polished job updates. Live building rooms, structured peer reviews, and an automated Build Log that acts as your living proof-of-work.
                    </p>

                    <div className="pt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                      <button
                        onClick={showOnboarding}
                        className="w-full rounded-full bg-[#6C5CE7] hover:bg-[#5b4ed6] px-5 sm:px-6 py-3.5 sm:py-4 text-[14px] sm:text-base font-bold text-white shadow-[0_12px_32px_rgba(108,92,231,0.3)] transition hover:-translate-y-0.5 active:translate-y-0 sm:w-auto"
                      >
                        Start building for free
                      </button>
                      <button
                        onClick={showDashboard}
                        className="w-full rounded-full border border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05] px-5 sm:px-6 py-3.5 sm:py-4 text-[14px] sm:text-base font-bold text-white transition flex items-center justify-center gap-2 sm:w-auto"
                      >
                        Enter dashboard
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="pt-6 grid grid-cols-2 gap-3 border-t border-white/[0.06] sm:grid-cols-3 sm:max-w-none">
                      <div className="rounded-2xl sm:rounded-3xl border border-white/[0.06] bg-white/[0.03] p-3 sm:p-4">
                        <div className="text-xl sm:text-3xl font-extrabold text-white">312+</div>
                        <div className="text-[11px] sm:text-sm text-slate-400 font-medium mt-1">Raw updates streamed</div>
                      </div>
                      <div className="rounded-2xl sm:rounded-3xl border border-white/[0.06] bg-white/[0.03] p-3 sm:p-4">
                        <div className="text-xl sm:text-3xl font-extrabold text-white">68%</div>
                        <div className="text-[11px] sm:text-sm text-slate-400 font-medium mt-1">Week-2 retention</div>
                      </div>
                      <div className="rounded-2xl sm:rounded-3xl border border-white/[0.06] bg-white/[0.03] p-3 sm:p-4 col-span-2 sm:col-span-1">
                        <div className="text-xl sm:text-3xl font-extrabold text-white">4.9★</div>
                        <div className="text-[11px] sm:text-sm text-slate-400 font-medium mt-1">Builder rating</div>
                      </div>
                    </div>
                  </div>

                  {/* Hero Right Content: INTERACTIVE ROOM PLAYGROUND */}
                  <div className="lg:col-span-6 relative mt-6 lg:mt-0">
                    <div className="absolute -inset-0.5 rounded-[28px] bg-gradient-to-tr from-[#6C5CE7]/30 to-[#8B7CF8]/10 blur opacity-45 pointer-events-none" />

                    {/* Live Playground Frame */}
                    <div className="relative overflow-hidden rounded-[20px] sm:rounded-[24px] border border-white/[0.08] bg-[#0E0C16] shadow-2xl">
                      {/* Window header */}
                      <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.03] px-3 sm:px-5 py-3 sm:py-4">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-[#FF5F57]" />
                          <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-[#FEBC2E]" />
                          <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-[#28C840]" />
                        </div>
                        <div className="text-[9px] sm:text-[11px] font-mono tracking-widest text-slate-500">PLAYGROUND DEMO</div>
                        <div className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      </div>

                      {/* Playground main grid */}
                      <div className="grid gap-0 md:grid-cols-[200px_1fr] h-[550px] sm:h-[480px] grid-rows-[160px_1fr] md:grid-rows-1">

                        {/* Sidebar */}
                        <aside className="border-b md:border-b-0 md:border-r border-white/[0.06] bg-[#0A0910] p-3 sm:p-4 flex flex-col justify-between overflow-y-auto">
                          <div className="space-y-4">
                            <div className="text-[9px] font-bold tracking-wider text-slate-600 uppercase">Live Rooms</div>
                            <div className="space-y-1.5">
                              {detailedRooms.map((room) => {
                                const isSelected = room.id === activeRoomId;
                                return (
                                  <button
                                    key={room.id}
                                    onClick={() => {
                                      setActiveRoomId(room.id);
                                      setActiveUpdatesIndex(0);
                                    }}
                                    className={`w-full flex items-center gap-3 rounded-xl p-2.5 text-left transition group ${isSelected
                                      ? "bg-[#6C5CE7]/15 border border-[#6C5CE7]/30 text-white"
                                      : "hover:bg-white/[0.04] border border-transparent text-slate-400 hover:text-white"
                                      }`}
                                  >
                                    <div
                                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold font-mono transition ${isSelected
                                        ? "bg-[#6C5CE7]/30 text-[#8B7CF8]"
                                        : "bg-white/[0.06] text-slate-300 group-hover:bg-white/[0.1]"
                                        }`}
                                    >
                                      {room.initials}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="truncate text-xs font-bold">{room.title}</div>
                                      <div className="text-[9px] text-slate-500 font-mono mt-0.5">{room.domain}</div>
                                    </div>
                                    {room.status === "Live" && isSelected && (
                                      <span className="h-1.5 w-1.5 rounded-full bg-[#00B37E] shrink-0 animate-pulse" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="pt-4 border-t border-white/[0.04] text-[10px] text-slate-500 flex items-center gap-2">
                            <Flame className="h-3.5 w-3.5 text-[#8B7CF8]" />
                            <span>Click a room to review updates</span>
                          </div>
                        </aside>

                        {/* Room Panel */}
                        <div className="flex flex-col bg-[#0C0B14] overflow-y-auto">

                          {/* Room Header */}
                          <div className="border-b border-white/[0.06] p-5 bg-white/[0.01]">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex rounded-full bg-[#6C5CE7]/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#8B7CF8] border border-[#6C5CE7]/20">
                                {currentRoom.badge}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500">Day {currentRoom.dayCount} of build</span>
                            </div>
                            <h3 className="text-sm font-bold text-white mt-1.5 leading-tight">{currentRoom.title}</h3>
                            <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-500 font-mono">
                              <MapPin className="h-3 w-3 text-slate-600" />
                              <span>{currentRoom.location}</span>
                            </div>
                          </div>

                          {/* Room Updates Feed */}
                          <div className="p-5 flex-1 space-y-4">
                            <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest flex items-center justify-between">
                              <span>Raw Updates</span>
                              <span>{currentRoom.updates.length} Updates</span>
                            </div>

                            {currentRoom.updates.map((update, idx) => {
                              return (
                                <div
                                  key={idx}
                                  className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4 space-y-3 transition hover:bg-white/[0.03]"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="h-5 w-5 rounded-full bg-gradient-to-tr from-[#6C5CE7] to-[#8B7CF8] flex items-center justify-center text-[9px] font-extrabold text-white">
                                        {currentRoom.initials}
                                      </div>
                                      <span className="text-xs font-semibold text-slate-300">Builder</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                                      <Clock className="h-3 w-3" />
                                      <span>{update.time}</span>
                                    </div>
                                  </div>

                                  <p className="text-xs leading-relaxed text-slate-300 font-sans">
                                    {update.text}
                                  </p>

                                  {/* Interactive Reaction Pills */}
                                  <div className="flex flex-wrap gap-2 pt-2 border-t border-white/[0.04]">
                                    {[
                                      { type: "sharp", label: "✦ Sharp", count: update.reactions.sharp },
                                      { type: "pushback", label: "↩ Push back", count: update.reactions.pushback },
                                      { type: "tellmemore", label: "? Tell me more", count: update.reactions.tellmemore }
                                    ].map((react) => {
                                      const reactionKey = `${currentRoom.id}-${idx}-${react.type}`;
                                      const isReacted = !!userHeroReactions[reactionKey];
                                      const count = getHeroReactionCount(currentRoom.id, idx, react.type, react.count);

                                      return (
                                        <button
                                          key={react.type}
                                          onClick={() => handleHeroReaction(currentRoom.id, idx, react.type)}
                                          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium transition active:scale-95 ${isReacted
                                            ? "bg-[#6C5CE7]/20 border border-[#6C5CE7] text-white"
                                            : "bg-white/[0.04] border border-white/[0.06] text-slate-400 hover:text-white hover:border-white/10"
                                            }`}
                                        >
                                          <span>{react.label}</span>
                                          <span className="h-3 w-px bg-white/10 mx-0.5" />
                                          <span className="font-bold text-slate-300">{count}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                        </div>

                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </section>

            {/* ─── Features Section (Why Patchwork) ──────────────────────────── */}
            <section id="features" className="relative py-24 bg-[#0B0A12] border-y border-white/[0.04]">
              <div className="absolute top-10 right-[10%] w-[30%] h-[30%] rounded-full bg-[#6C5CE7]/5 blur-[80px] pointer-events-none" />
              <div className="mx-auto max-w-7xl px-6">

                {/* Section Header */}
                <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
                  <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#8B7CF8] bg-[#6C5CE7]/10 px-3 py-1 rounded-full">
                    why patchwork
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
                    Built for how real builders<br />
                    <span className="font-serif italic text-[#8B7CF8]">actually ship products</span>
                  </h2>
                  <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                    Most platforms capture the wrong state. LinkedIn has your polished past. X has your active opinions. Patchwork has your real, raw building process.
                  </p>
                </div>

                {/* Features Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {[
                    {
                      icon: <Layers className="h-6 w-6 text-[#8B7CF8]" />,
                      title: "Live Build Rooms",
                      desc: "Tied directly to milestones. Share your updates — sketches, logic flows, links — as you build. Enable observers to follow step-by-step."
                    },
                    {
                      icon: <MessageSquareCode className="h-6 w-6 text-emerald-400" />,
                      title: "Structured Reactions",
                      desc: "No noise, just signal. Observers react with three precise indicators: Sharp (execution), Push back (warnings), or Tell me more (curiosity)."
                    },
                    {
                      icon: <CheckCircle2 className="h-6 w-6 text-amber-400" />,
                      title: "Chronological Build Log",
                      desc: "Shipping a project compiles your room timeline into a permanent, beautiful portfolio. Let your journey prove your expertise."
                    },
                    {
                      icon: <Award className="h-6 w-6 text-[#8B7CF8]" />,
                      title: "Domain Reputation",
                      desc: "Accumulate reputation points based on code logic, UI iterations, and constructiveness. Your reputational weight reflects what you build."
                    },
                    {
                      icon: <Users className="h-6 w-6 text-purple-400" />,
                      title: "Active Observers Widget",
                      desc: "Invite colleagues, engineers, or founders to observe your building room. Track who views your updates and how frequently they check in."
                    },
                    {
                      icon: <Lock className="h-6 w-6 text-slate-400" />,
                      title: "Verified Talent Signal",
                      desc: "Companies filter candidates by checking real build logs over time. Cut out technical interviews by letting your process prove itself."
                    }
                  ].map((card, i) => (
                    <div
                      key={i}
                      className="group relative rounded-[24px] border border-white/[0.05] bg-white/[0.02] p-8 space-y-4 hover:bg-white/[0.04] transition-all duration-300 hover:border-white/[0.12] hover:-translate-y-1 hover:shadow-[0_12px_40px_-12px_rgba(108,92,231,0.2)] backdrop-blur-sm overflow-hidden"
                    >
                      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="inline-flex rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 group-hover:scale-110 group-hover:bg-[#6C5CE7]/10 transition duration-300">
                        {card.icon}
                      </div>
                      <h3 className="text-[20px] font-extrabold text-white font-display group-hover:text-[#8B7CF8] transition-colors">{card.title}</h3>
                      <p className="text-slate-400 text-[14px] leading-relaxed font-medium">{card.desc}</p>
                    </div>
                  ))}
                </div>

              </div>
            </section>

            {/* ─── Interactive Workflow Timeline (How it Works) ─────────────── */}
            <section id="workflow" className="relative py-24 bg-[#08070D]">
              <div className="mx-auto max-w-7xl px-6">

                {/* Section Header */}
                <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
                  <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#8B7CF8] bg-[#6C5CE7]/10 px-3 py-1 rounded-full">
                    HOW IT WORKS
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
                    The four steps of public building
                  </h2>
                  <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                    Click through the steps below to explore how a raw idea transforms into a verified, permanent proof-of-work log.
                  </p>
                </div>

                {/* Workflow Selector & Panel */}
                <div className="grid gap-8 lg:grid-cols-12 items-center">

                  {/* Left Column: Selector Buttons */}
                  <div className="lg:col-span-5 space-y-4">
                    {workflowSteps.map((step) => {
                      const isActive = step.step === selectedWorkflowStep;
                      return (
                        <button
                          key={step.step}
                          onClick={() => setSelectedWorkflowStep(step.step)}
                          className={`w-full flex items-start gap-4 rounded-2xl p-5 text-left transition border ${isActive
                            ? "bg-white/[0.03] border-white/[0.1] shadow-lg"
                            : "hover:bg-white/[0.01] border-transparent"
                            }`}
                        >
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold transition text-sm ${isActive
                              ? "bg-[#6C5CE7] text-white"
                              : "bg-white/[0.05] text-slate-400"
                              }`}
                          >
                            {step.step}
                          </div>
                          <div className="space-y-1">
                            <h3 className={`text-base font-bold transition ${isActive ? "text-white" : "text-slate-400 hover:text-white"}`}>
                              {step.title}
                            </h3>
                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                              {step.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Right Column: Visual Mockup for Step */}
                  <div className="lg:col-span-7 relative">
                    <div className="absolute -inset-0.5 rounded-[24px] bg-gradient-to-tr from-[#6C5CE7]/20 to-[#8B7CF8]/5 blur opacity-30 pointer-events-none" />

                    <div className="relative rounded-[20px] border border-white/[0.08] bg-[#0E0C16] p-6 space-y-6">

                      {/* Workflow Card Mockup Header */}
                      <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                            Patchwork App Simulator
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-[#00B37E] animate-pulse" />
                          <span className="text-[10px] text-slate-500 font-mono">Simulating step {selectedWorkflowStep}</span>
                        </div>
                      </div>

                      {/* Dynamic Mockup Body */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="rounded-full bg-[#8B7CF8]/10 px-2 py-0.5 text-[9px] font-bold text-[#8B7CF8] uppercase">
                            {workflowSteps[selectedWorkflowStep - 1].mockup.tag}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            {workflowSteps[selectedWorkflowStep - 1].mockup.status}
                          </span>
                        </div>

                        <h4 className="text-base font-bold text-white">
                          {workflowSteps[selectedWorkflowStep - 1].mockup.title}
                        </h4>

                        <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-4 text-xs font-serif italic text-slate-300 leading-relaxed">
                          "{workflowSteps[selectedWorkflowStep - 1].mockup.content}"
                        </div>

                        {/* Interactive pills mock */}
                        {workflowSteps[selectedWorkflowStep - 1].mockup.pillActions && (
                          <div className="flex gap-2">
                            <span className="rounded-full bg-[#6C5CE7]/20 border border-[#6C5CE7]/40 px-2.5 py-1 text-[10px] text-[#8B7CF8] font-bold">✦ Sharp · 12</span>
                            <span className="rounded-full bg-white/[0.03] border border-white/[0.06] px-2.5 py-1 text-[10px] text-slate-400">↩ Push back · 2</span>
                            <span className="rounded-full bg-white/[0.03] border border-white/[0.06] px-2.5 py-1 text-[10px] text-slate-400">? Tell me more · 5</span>
                          </div>
                        )}

                        <div className="space-y-2 pt-2">
                          <div className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">Key Takeaways</div>
                          <ul className="space-y-2">
                            {workflowSteps[selectedWorkflowStep - 1].points.map((point, index) => (
                              <li key={index} className="flex items-start gap-2.5 text-xs text-slate-400 leading-relaxed">
                                <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>

              </div>
            </section>

            {/* ─── Live Builders Feed Showcase Section ──────────────────────── */}
            <section id="showcase" className="relative py-24 bg-[#0B0A12] border-y border-white/[0.04]">
              <div className="absolute top-[20%] left-[-5%] w-[40%] h-[40%] rounded-full bg-[#8B7CF8]/5 blur-[120px] pointer-events-none" />
              <div className="mx-auto max-w-7xl px-6">

                {/* Section Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                  <div className="space-y-3">
                    <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#8B7CF8] bg-[#6C5CE7]/10 px-3 py-1 rounded-full">
                      showcase feed
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
                      Explore live proof-of-work
                    </h2>
                    <p className="text-slate-400 text-sm sm:text-base max-w-xl">
                      Read what actual mock builders are coding and designing across Patchwork. Toggle domains below to filter activity.
                    </p>
                  </div>

                  {/* Domain filters */}
                  <div className="flex flex-wrap gap-1.5 bg-black/30 border border-white/[0.05] p-1.5 rounded-full shrink-0">
                    {["all", "product", "design", "engineering", "writing", "growth"].map((dom) => (
                      <button
                        key={dom}
                        onClick={() => setSelectedShowcaseDomain(dom)}
                        className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition ${selectedShowcaseDomain === dom
                          ? "bg-[#6C5CE7] text-white"
                          : "text-slate-400 hover:text-white"
                          }`}
                      >
                        {dom}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Builders Showcase Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredShowcaseBuilders.map((builder) => {
                    return (
                      <div
                        key={builder.id}
                        className="rounded-[24px] border border-white/[0.05] bg-white/[0.02] p-7 space-y-4 hover:border-white/[0.12] hover:bg-white/[0.04] hover:-translate-y-1 hover:shadow-[0_12px_40px_-12px_rgba(108,92,231,0.2)] transition-all duration-300 flex flex-col justify-between backdrop-blur-sm relative overflow-hidden group"
                      >
                        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        
                        <div className="space-y-4 relative z-10">
                          {/* Card Top: Builder Profile */}
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-0">
                            <div className="flex items-center gap-3 sm:gap-4">
                              <div
                                className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl font-bold font-mono text-slate-800 text-sm sm:text-base shadow-inner"
                                style={{ background: builder.avatarColor }}
                              >
                                {builder.avatarText}
                              </div>
                              <div className="min-w-0">
                                <div className="text-[15px] sm:text-[16px] font-extrabold text-white flex flex-wrap items-center gap-1.5 sm:gap-2 font-display group-hover:text-[#8B7CF8] transition-colors">
                                  <span className="whitespace-nowrap truncate">{builder.name}</span>
                                  <span className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-amber-500/10 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-amber-500 uppercase tracking-widest ring-1 ring-amber-500/20">
                                    ★ {builder.rep} rep
                                  </span>
                                </div>
                                <div className="text-[11px] sm:text-[12px] text-slate-500 font-medium capitalize mt-0.5 truncate">{builder.title} · {builder.location}</div>
                              </div>
                            </div>
                            <span className="self-start sm:self-auto rounded-md bg-white/[0.03] px-2 sm:px-2.5 py-1 text-[9px] sm:text-[10px] font-bold font-mono uppercase text-[#8B7CF8] ring-1 ring-white/[0.05] tracking-widest">
                              {builder.domain}
                            </span>
                          </div>

                          <p className="text-[14px] text-slate-400 leading-relaxed font-medium border-b border-white/[0.06] pb-4">
                            {builder.bio}
                          </p>

                          {/* Latest Update */}
                          <div className="space-y-3 pt-1">
                            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono font-medium">
                              <span className="text-slate-400 truncate pr-4">Room: <span className="text-white">{builder.projectTitle}</span></span>
                              <span className="shrink-0">{builder.updateTime}</span>
                            </div>
                            <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-5 text-[13px] text-slate-300 leading-relaxed font-medium italic">
                              "{builder.updateText}"
                            </div>
                          </div>
                        </div>

                        {/* Structured reactions */}
                        <div className="flex gap-1.5 pt-3 border-t border-white/[0.04] mt-3">
                          {[
                            { type: "sharp", label: "✦", count: builder.reactions.sharp },
                            { type: "pushback", label: "↩", count: builder.reactions.pushback },
                            { type: "tellmemore", label: "?", count: builder.reactions.tellmemore }
                          ].map((react) => {
                            const reactKey = `${builder.id}-${react.type}`;
                            const isReacted = !!userShowcaseReactions[reactKey];
                            const count = getShowcaseReactionCount(builder.id, react.type, react.count);
                            return (
                              <button
                                key={react.type}
                                onClick={() => handleShowcaseReaction(builder.id, react.type)}
                                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-semibold transition active:scale-95 ${isReacted
                                  ? "bg-[#6C5CE7]/20 border border-[#6C5CE7] text-white"
                                  : "bg-white/[0.03] border border-white/[0.05] text-slate-400 hover:text-white"
                                  }`}
                              >
                                <span>{react.label}</span>
                                <span className="font-bold">{count}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            </section>

            {/* ─── Reputation Calculator (Gamification) ─────────────────────── */}
            <section className="relative py-24 bg-[#08070D]">
              <div className="mx-auto max-w-4xl px-6">
                <div className="relative overflow-hidden rounded-[32px] border border-white/[0.08] bg-[#0E0C16] p-8 md:p-12 shadow-2xl">
                  {/* Gradient background circles */}
                  <div className="absolute -top-40 -right-40 h-[300px] w-[300px] rounded-full bg-[#6C5CE7]/10 blur-[80px]" />
                  <div className="absolute -bottom-40 -left-40 h-[300px] w-[300px] rounded-full bg-emerald-500/5 blur-[80px]" />

                  <div className="grid gap-8 md:grid-cols-12 items-center">

                    {/* Calculator Controls (Left) */}
                    <div className="md:col-span-7 space-y-6 relative">
                      <div className="space-y-2">
                        <span className="text-[10px] font-extrabold tracking-widest text-[#8B7CF8] uppercase">
                          BUILDER reputation estimate
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-snug">
                          Estimate your builder weight
                        </h2>
                        <p className="text-xs text-slate-400">
                          Reputation is earned. Use the sliders below to estimate your score based on updates, reactions, and observers.
                        </p>
                      </div>

                      <div className="space-y-5 pt-3">
                        {/* Control 1: Weekly updates */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="text-slate-300">Weekly Updates</span>
                            <span className="text-[#8B7CF8] font-mono font-bold">{calcUpdates} / week</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={calcUpdates}
                            onChange={(e) => setCalcUpdates(parseInt(e.target.value))}
                            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#6C5CE7]"
                          />
                        </div>

                        {/* Control 2: Average Reactions */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="text-slate-300">Avg Reactions Per Update</span>
                            <span className="text-[#8B7CF8] font-mono font-bold">{calcReactions} reactions</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="50"
                            value={calcReactions}
                            onChange={(e) => setCalcReactions(parseInt(e.target.value))}
                            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#6C5CE7]"
                          />
                        </div>

                        {/* Control 3: Observer follow rate */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="text-slate-300">Active Observers</span>
                            <span className="text-[#8B7CF8] font-mono font-bold">{calcObservers} observers</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="100"
                            value={calcObservers}
                            onChange={(e) => setCalcObservers(parseInt(e.target.value))}
                            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#6C5CE7]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Calculator Result (Right) */}
                    <div className="md:col-span-5 text-center p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] relative flex flex-col justify-center min-h-[220px]">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        Est. Reputation Score
                      </div>
                      <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-purple-300 tracking-tight my-4">
                        {calculateReputation()}
                      </div>
                      <div className="inline-flex items-center gap-1.5 mx-auto rounded-full bg-purple-500/10 border border-purple-500/20 px-3 py-1 text-[10px] font-semibold text-[#8B7CF8]">
                        <Award className="h-3.5 w-3.5" />
                        <span>Domain Rep Level 1</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-4 leading-relaxed max-w-[200px] mx-auto">
                        Tip: Explaining a scrapped feature in an update scores double reputation points!
                      </p>
                    </div>

                  </div>
                </div>
              </div>
            </section>

            {/* ─── FAQ Section ────────────────────────────────────────────────── */}
            <section id="faq" className="relative py-24 bg-[#0B0A12] border-t border-white/[0.04]">
              <div className="mx-auto max-w-4xl px-6">

                {/* Section Header */}
                <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
                  <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#8B7CF8] bg-[#6C5CE7]/10 px-3 py-1 rounded-full">
                    HELP & RESOURCES
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
                    Frequently Asked Questions
                  </h2>
                  <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                    Have questions about building in the open or reputation metrics? We've got you covered.
                  </p>
                </div>

                {/* FAQ List */}
                <div className="space-y-3">
                  {faqs.map((faq, idx) => {
                    const isOpen = activeFaq === idx;
                    return (
                      <div
                        key={idx}
                        className="rounded-2xl border border-white/[0.05] bg-[#0E0C16] overflow-hidden transition"
                      >
                        <button
                          onClick={() => setActiveFaq(isOpen ? null : idx)}
                          className="w-full flex items-center justify-between p-6 text-left transition hover:bg-white/[0.01]"
                        >
                          <span className="text-sm sm:text-base font-bold text-white pr-4">
                            {faq.q}
                          </span>
                          <ChevronDown
                            className={`h-5 w-5 text-slate-400 shrink-0 transition duration-300 ${isOpen ? "rotate-180 text-white" : ""
                              }`}
                          />
                        </button>

                        {/* Dynamic Height collapse */}
                        {isOpen && (
                          <div className="border-t border-white/[0.04] bg-black/10 px-6 py-5 text-xs sm:text-sm text-slate-400 leading-relaxed font-light">
                            {faq.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

              </div>
            </section>

            {/* ─── Call To Action (Bottom) ────────────────────────────────────── */}
            <section className="relative py-24 bg-[#08070D]">
              <div className="mx-auto max-w-4xl px-6">
                <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-tr from-[#6C5CE7] to-[#4A3DB8] px-8 py-16 md:px-12 md:py-24 text-center shadow-2xl">
                  {/* Grid background on card */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_50%)] pointer-events-none" />

                  <div className="max-w-2xl mx-auto space-y-6 relative">
                    <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
                      Ready to build<br />
                      <span className="font-serif italic text-purple-200">in the open?</span>
                    </h2>
                    <p className="text-sm sm:text-base text-purple-100/80 max-w-md mx-auto leading-relaxed">
                      Join 47 founding builders sharing their live journey. Establish your domain credibility today.
                    </p>
                    <div className="pt-2">
                      <button
                        onClick={showOnboarding}
                        className="rounded-full bg-white hover:bg-slate-50 px-10 py-4 text-base font-extrabold text-[#6C5CE7] shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition"
                      >
                        Claim your build room →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ─── Premium Footer ──────────────────────────────────────────────── */}
            <footer className="border-t border-white/[0.06] bg-[#0A0910] py-16 text-slate-400">
              <div className="mx-auto max-w-7xl px-6">
                <div className="grid gap-10 md:grid-cols-12">

                  {/* Footer Left Column: Logo & Newsletter */}
                  <div className="md:col-span-5 space-y-6">
                    <div className="flex items-center gap-3 text-lg font-bold tracking-tight text-white">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6C5CE7]">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M15 12L9 6 3 12l1.5 1.5L9 9l4.5 4.5L15 12Z" />
                        </svg>
                      </div>
                      <span className="font-extrabold">patchwork</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
                      The streaming platform for real software engineering, product design, and growth logic. Proof of work, verified.
                    </p>

                    {/* Newsletter Form */}
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-white uppercase tracking-wider">
                        Get weekly building digests
                      </div>
                      <form onSubmit={handleNewsletterSubmit} className="flex gap-2 max-w-sm">
                        <input
                          type="email"
                          required
                          value={newsletterEmail}
                          onChange={(e) => setNewsletterEmail(e.target.value)}
                          placeholder="you@builder.com"
                          className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-xs text-white outline-none focus:border-[#6C5CE7] transition"
                        />
                        <button
                          type="submit"
                          className="rounded-xl bg-[#6C5CE7] hover:bg-[#5b4ed6] px-4 py-2.5 text-xs font-bold text-white transition flex items-center justify-center gap-1.5 shrink-0"
                        >
                          {newsletterSent ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <>
                              <span>Subscribe</span>
                              <Send className="h-3 w-3" />
                            </>
                          )}
                        </button>
                      </form>
                      {newsletterSent && (
                        <p className="text-[10px] text-emerald-400 font-semibold animate-pulse mt-1">
                          ✓ Successfully subscribed to building digests!
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Footer Right Columns */}
                  <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-6 pt-8 md:pt-0">
                    <div className="space-y-4">
                      <div className="text-xs font-bold text-white uppercase tracking-wider">Product</div>
                      <ul className="space-y-2 text-xs">
                        <li><a href="#features" className="hover:text-white transition">Build Rooms</a></li>
                        <li><a href="#features" className="hover:text-white transition">Structured Reactions</a></li>
                        <li><a href="#features" className="hover:text-white transition">Build Logs</a></li>
                        <li><a href="#workflow" className="hover:text-white transition">Reputation Engine</a></li>
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <div className="text-xs font-bold text-white uppercase tracking-wider">Resources</div>
                      <ul className="space-y-2 text-xs">
                        <li><a href="#faq" className="hover:text-white transition">FAQs</a></li>
                        <li><a href="#showcase" className="hover:text-white transition">Showcase Feed</a></li>
                        <li><span className="text-slate-600 cursor-not-allowed">Talent Directory (soon)</span></li>
                        <li><span className="text-slate-600 cursor-not-allowed">API docs</span></li>
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <div className="text-xs font-bold text-white uppercase tracking-wider">Legal & Social</div>
                      <ul className="space-y-2 text-xs">
                        <li><span className="hover:text-white transition cursor-pointer">Privacy Policy</span></li>
                        <li><span className="hover:text-white transition cursor-pointer">Terms of Service</span></li>
                        <li><a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-white transition">GitHub</a></li>
                        <li><a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-white transition">Twitter / X</a></li>
                      </ul>
                    </div>
                  </div>

                </div>

                <div className="border-t border-white/[0.06] mt-12 pt-8 text-center text-[11px] text-slate-600 font-mono">
                  © 2026 Patchwork Platform. Built for developers by developers. All rights reserved.
                </div>
              </div>
            </footer>
          </>
        )}

        {/* ─── Redesigned Premium Onboarding Flow ───────────────────────── */}
        {screen === "onboarding" && (
          <section id="onboarding" className="min-h-screen bg-[#08070D] py-16 flex items-center">
            <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 lg:flex-row w-full items-stretch">

              {/* Onboarding Sidebar */}
              <aside className="w-full rounded-[24px] border border-white/[0.08] bg-[#0E0C16] p-6 sm:p-8 text-white lg:w-[360px] flex flex-col justify-between">
                <div className="space-y-8">
                  <div className="flex items-center gap-3 text-lg font-extrabold">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#6C5CE7] text-white">⚒️</span>
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
                            ? "border-[#6C5CE7] bg-[#6C5CE7]/15 text-[#8B7CF8]"
                            : isDone
                              ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                              : "border-white/10 text-slate-500"
                            }`}>
                            {isDone ? "✓" : item.num}
                          </div>
                          <div>
                            <div className={`text-sm font-bold transition ${isActive ? "text-white" : isDone ? "text-slate-300" : "text-slate-500"}`}>
                              {item.title}
                            </div>
                            <div className="text-[10px] font-mono text-slate-500 mt-0.5">{item.desc}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-12 pt-6 border-t border-white/[0.06] hidden lg:block">
                  <p className="font-serif italic text-xs text-slate-400 leading-relaxed">
                    "The feed rewards in-progress updates and honest pivots — not launch announcements."
                  </p>
                  <p className="mt-2 text-[9px] font-mono uppercase tracking-wider text-slate-500">
                    // patchwork design principle #3
                  </p>
                </div>
              </aside>

              {/* Onboarding Wizard Card */}
              <div className="flex-1 rounded-[24px] border border-white/[0.08] bg-[#0E0C16] p-6 sm:p-8 md:p-12 shadow-2xl flex flex-col justify-between">

                {step === 1 && (
                  <div className="space-y-6">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[#8B7CF8] font-bold">Step 1 of 4</span>
                      <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white">Create your builder account</h2>
                      <p className="mt-1.5 text-xs text-slate-400">You're joining as a founding builder. Start creating your profile.</p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">First name</label>
                        <input
                          value={fname}
                          onChange={e => setFname(e.target.value)}
                          className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-xs text-white outline-none focus:border-[#6C5CE7] transition"
                          placeholder="Akin"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">Last name</label>
                        <input
                          value={lname}
                          onChange={e => setLname(e.target.value)}
                          className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-xs text-white outline-none focus:border-[#6C5CE7] transition"
                          placeholder="Rodolu"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 block">Email Address</label>
                      <input
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        type="email"
                        className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-xs text-white outline-none focus:border-[#6C5CE7] transition"
                        placeholder="you@builder.com"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 block">Password</label>
                      <input
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        type="password"
                        className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-xs text-white outline-none focus:border-[#6C5CE7] transition"
                        placeholder="••••••••••"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300 block">Country</label>
                        <select
                          value={countryIso}
                          onChange={e => { setCountryIso(e.target.value); setStateIso(""); setCity(""); }}
                          className="w-full rounded-xl border border-white/[0.08] bg-[#0E0C16] px-4 py-3 text-xs text-white outline-none focus:border-[#6C5CE7] transition"
                        >
                          <option value="">Select Country</option>
                          {countryLib?.getAllCountries().map((c: any) => (
                            <option key={c.isoCode} value={c.isoCode}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300 block">State</label>
                        <select
                          value={stateIso}
                          onChange={e => { setStateIso(e.target.value); setCity(""); }}
                          disabled={!countryIso}
                          className="w-full rounded-xl border border-white/[0.08] bg-[#0E0C16] px-4 py-3 text-xs text-white outline-none focus:border-[#6C5CE7] transition disabled:opacity-50"
                        >
                          <option value="">Select State</option>
                          {countryIso && stateLib?.getStatesOfCountry(countryIso).map((s: any) => (
                            <option key={s.isoCode} value={s.isoCode}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300 block">City</label>
                        <select
                          value={city}
                          onChange={e => setCity(e.target.value)}
                          disabled={!stateIso}
                          className="w-full rounded-xl border border-white/[0.08] bg-[#0E0C16] px-4 py-3 text-xs text-white outline-none focus:border-[#6C5CE7] transition disabled:opacity-50"
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
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-[#6C5CE7] hover:bg-[#5b4ed6] px-6 py-3 text-xs font-bold text-white transition disabled:opacity-50"
                      >
                        Continue <ArrowRight className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => navigate('/login')}
                        className="inline-flex items-center justify-center rounded-full border border-white/10 hover:bg-white/[0.02] px-6 py-3 text-xs font-semibold text-slate-300 transition"
                      >
                        Sign In Instead
                      </button>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[#8B7CF8] font-bold">Step 2 of 4</span>
                      <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white">What do you build?</h2>
                      <p className="mt-1.5 text-xs text-slate-400">Select your primary domain. You can write across domains, but this acts as your home reputation base.</p>
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
                              ? "border-[#6C5CE7] bg-[#6C5CE7]/10 text-white"
                              : "border-white/10 bg-white/[0.02] text-slate-400 hover:border-[#6C5CE7]/45"
                              }`}
                          >
                            <span className="text-2xl">{option.icon}</span>
                            <span className="mt-2 text-xs font-bold block">{option.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-300">
                        <span>What are you currently building?</span>
                        <span className="text-[10px] font-mono text-slate-500">One sentence</span>
                      </div>
                      <textarea
                        value={buildingDesc}
                        onChange={e => setBuildingDesc(e.target.value)}
                        rows={3}
                        className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-xs text-white outline-none focus:border-[#6C5CE7] transition resize-none"
                        placeholder="e.g. A BNPL product for informal market merchants in Lagos using PalmPay's distribution network"
                      />
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row pt-4">
                      <button
                        onClick={() => setStep(3)}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-[#6C5CE7] hover:bg-[#5b4ed6] px-6 py-3 text-xs font-bold text-white transition"
                      >
                        Continue <ArrowRight className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setStep(1)}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 hover:bg-white/[0.02] px-6 py-3 text-xs font-semibold text-slate-300 transition"
                      >
                        ← Back
                      </button>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-6">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[#8B7CF8] font-bold">Step 3 of 4</span>
                      <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white">Open your first build room</h2>
                      <p className="mt-1.5 text-xs text-slate-400">Name the project or milestone you are building. This acts as your room headline.</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 block">Room name</label>
                      <input
                        value={roomName}
                        onChange={e => setRoomName(e.target.value)}
                        className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-xs text-white outline-none focus:border-[#6C5CE7] transition"
                        placeholder="e.g. MoniFlow BNPL merchant dashboard"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 block">Domain tag</label>
                      <select
                        value={roomDomain}
                        onChange={e => setRoomDomain(e.target.value)}
                        className="w-full rounded-xl border border-white/[0.08] bg-[#0E0C16] px-4 py-3 text-xs text-white outline-none focus:border-[#6C5CE7] transition"
                      >
                        <option value="product">🧩 Product</option>
                        <option value="design">🎨 Design</option>
                        <option value="engineering">⚙️ Engineering</option>
                        <option value="writing">✍️ Writing</option>
                        <option value="growth">📈 Growth</option>
                      </select>
                    </div>

                    {/* Room Mock Preview */}
                    <div className="rounded-2xl border border-white/[0.06] bg-black/30 p-5 space-y-2">
                      <span className="inline-flex rounded-full bg-[#6C5CE7]/15 border border-[#6C5CE7]/20 px-2.5 py-0.5 text-[9px] font-bold text-[#8B7CF8] uppercase">
                        {roomDomain}
                      </span>
                      <div className="text-base font-bold text-white">
                        {roomName || "Your room name will appear here"}
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono">Day 1 · 0 updates · 0 observers</p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row pt-4">
                      <button
                        onClick={() => setStep(4)}
                        disabled={!roomName}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-[#6C5CE7] hover:bg-[#5b4ed6] px-6 py-3 text-xs font-bold text-white transition disabled:opacity-50"
                      >
                        Open Room <ArrowRight className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setStep(2)}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 hover:bg-white/[0.02] px-6 py-3 text-xs font-semibold text-slate-300 transition"
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
                      <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white">Post your first update</h2>
                      <p className="mt-1.5 text-xs text-slate-400">Write what's actually happening in your build right now — a design scrapped, a bug solved, or a decision made.</p>
                    </div>

                    <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4.5 text-xs text-purple-200/90 leading-relaxed">
                      💡 <strong>Good updates:</strong> a decision you just made and why · something you thought would work but didn't · the hardest open query in your build.
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 block">First update text</label>
                      <textarea
                        value={firstUpdate}
                        onChange={e => setFirstUpdate(e.target.value)}
                        rows={5}
                        className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-xs text-white font-serif italic outline-none focus:border-[#6C5CE7] transition resize-none leading-relaxed"
                        placeholder="e.g. Scrapped onboarding flow v1. Moving KYC check to step 1 and cutting remaining onboarding steps to reduce field drop-offs."
                      />
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row pt-4">
                      <button
                        onClick={completeOnboarding}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-[#6C5CE7] hover:bg-[#5b4ed6] px-8 py-3.5 text-xs font-bold text-white transition shadow-lg"
                      >
                        Publish and enter Patchwork 🚀
                      </button>
                      <button
                        onClick={() => setStep(3)}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 hover:bg-white/[0.02] px-6 py-3 text-xs font-semibold text-slate-300 transition"
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
          <section id="dashboard" className="min-h-screen bg-[#08070D] py-24">
            <div className="mx-auto max-w-7xl px-6">
              <div className="grid gap-8 lg:grid-cols-[1fr_300px]">

                {/* Main panel */}
                <div className="rounded-[24px] border border-white/[0.08] bg-[#0E0C16] p-6 sm:p-8 space-y-6 sm:space-y-8">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.06] pb-6">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Good morning, Akin 👋</h1>
                      <p className="text-xs text-slate-500 font-mono mt-1">Wednesday, 3 June 2026 · Lagos, Nigeria</p>
                    </div>
                    <button className="rounded-full bg-[#6C5CE7] hover:bg-[#5b4ed6] px-6 py-3 text-xs font-bold text-white transition flex items-center gap-1.5 shrink-0">
                      <Plus className="h-4 w-4" />
                      <span>New room</span>
                    </button>
                  </div>

                  {/* Stat cards */}
                  <div className="grid gap-4 sm:grid-cols-4">
                    {[
                      { label: "active rooms", value: "3", delta: "↑ 1 this week", color: "text-[#8B7CF8]" },
                      { label: "total reactions", value: "47", delta: "↑ 12 today", color: "text-amber-500" },
                      { label: "observers", value: "28", delta: "↑ 5 new", color: "text-emerald-500" },
                      { label: "build logs", value: "1", delta: "1 completed", color: "text-slate-400" },
                    ].map(stat => (
                      <div key={stat.label} className="rounded-2xl border border-white/[0.06] bg-[#0A0910] p-5 space-y-1">
                        <div className="text-2xl font-black text-white">{stat.value}</div>
                        <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{stat.label}</div>
                        <div className={`text-[10px] font-semibold pt-1 ${stat.color}`}>{stat.delta}</div>
                      </div>
                    ))}
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-2 border-b border-white/[0.06] pb-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
                    {["Overview", "My rooms", "Global timeline"].map((tab, idx) => (
                      <button
                        key={tab}
                        className={`rounded-full px-4 py-2 text-xs font-bold transition ${idx === 0
                          ? "bg-[#6C5CE7]/15 text-[#8B7CF8] border border-[#6C5CE7]/25"
                          : "text-slate-400 hover:text-white"
                          }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {/* Active Rooms */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <span>Active rooms</span>
                      <button className="text-xs text-[#8B7CF8] font-bold">View all</button>
                    </div>
                    <div className="space-y-3">
                      {detailedRooms.map(room => (
                        <div
                          key={room.id}
                          className="rounded-2xl border border-white/[0.06] bg-[#0A0910] p-5 sm:p-6 hover:border-[#6C5CE7]/35 transition flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4 sm:gap-0"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-2 w-12 rounded-full" style={{ background: room.color }} />
                            <div>
                              <h3 className="text-sm font-bold text-white">{room.title}</h3>
                              <p className="text-[10px] text-slate-500 font-mono mt-1 capitalize">
                                {room.status} · Day {room.dayCount} · {room.updates.length} updates
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <span className="rounded-full bg-[#6C5CE7]/15 border border-[#6C5CE7]/20 px-2 py-0.5 text-[9px] font-bold text-[#8B7CF8] uppercase">
                              {room.badge}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold">
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
                  <div className="rounded-[24px] border border-white/[0.08] bg-[#0E0C16] p-6 space-y-4">
                    <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Recent Activity</div>

                    <div className="space-y-4">
                      {[
                        { name: "Tobi", text: "reacted \"Sharp\" to your update", time: "8 min ago" },
                        { name: "Funmi", text: "started following your room", time: "41 min ago" },
                        { name: "Ade", text: "reacted \"Tell me more\" to PalmPay update", time: "2 hr ago" },
                        { name: "James", text: "reacted \"Push back\" to MoniFlow v2", time: "5 hr ago" }
                      ].map((item, idx) => (
                        <div key={idx} className="flex gap-2.5 items-start">
                          <span className="h-2 w-2 rounded-full bg-[#6C5CE7] mt-1 shrink-0" />
                          <div>
                            <p className="text-xs text-slate-300">
                              <strong className="text-white font-bold">{item.name}</strong> {item.text}
                            </p>
                            <span className="text-[9px] font-mono text-slate-500 block mt-1">{item.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Observers on MoniFlow */}
                  <div className="rounded-[24px] border border-white/[0.08] bg-[#0E0C16] p-6 space-y-4">
                    <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Observers on MoniFlow</div>

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
                            <span className="font-semibold text-slate-300">{observer.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-500">{observer.visits}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Post Today's Update CTA */}
                  <div className="rounded-[24px] bg-gradient-to-tr from-[#6C5CE7] to-[#4A3DB8] p-6 space-y-3 text-white">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-purple-200">
                      POST TODAY'S UPDATE
                    </div>
                    <p className="text-xs text-purple-100/90 leading-relaxed">
                      Last update: 2 days ago. Your active observers are watching. Keep momentum high.
                    </p>
                    <button className="w-full rounded-full bg-white/10 hover:bg-white/15 px-4 py-2.5 text-xs font-bold text-white transition border border-white/10">
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
