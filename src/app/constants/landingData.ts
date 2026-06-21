// Domain options for setup and filtering
export const domainOptions = [
  { id: "product", icon: "🧩", label: "Product" },
  { id: "design", icon: "🎨", label: "Design" },
  { id: "engineering", icon: "⚙️", label: "Engineering" },
  { id: "writing", icon: "✍️", label: "Writing" },
  { id: "growth", icon: "📈", label: "Growth" },
  { id: "research", icon: "🔬", label: "Research" },
];

// Interactive rooms dataset
export const detailedRooms = [
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
export const showcaseBuilders = [
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
export const workflowSteps = [
  {
    step: 1,
    title: "Build in Private Workspace",
    description: "Start building without pressure. It's just you and your code/design. Draft ideas, try things out securely.",
    points: [
      "Define clean goals and target timelines.",
      "Completely isolated and secure space.",
      "Start with a blank canvas."
    ],
    mockup: {
      tag: "PRIVATE ROOM",
      title: "MoniFlow BNPL — merchant dashboard",
      status: "Day 1 of build · 0 updates",
      content: "Aiming to build a streamlined BNPL merchant onboarding portal in 14 days. Primary challenge is integrating third-party KYC checks without causing friction."
    }
  },
  {
    step: 2,
    title: "Invite Your Team",
    description: "Bring in co-founders or teammates to collaborate and observe securely.",
    points: [
      "Share private links with your immediate team.",
      "Brainstorm and gather early feedback.",
      "Keep everything strictly confidential."
    ],
    mockup: {
      tag: "TEAM COLLABORATION",
      title: "KYC WebSync Integration",
      status: "Day 5 of build · 3 updates",
      content: "Spent 3 hours fighting the sandbox API. Decided to dump their SDK entirely and write custom curl handlers. Got latency down from 2.2s to 400ms. Code attached."
    }
  },
  {
    step: 3,
    title: "Request Expert Reviews",
    description: "Invite verified domain experts for structured feedback and reviews on complex challenges.",
    points: [
      "Get high-signal reviews from verified talent.",
      "Use structured reactions (Sharp, Push back).",
      "Pay in reputation or cash (soon)."
    ],
    mockup: {
      tag: "EXPERT REVIEW",
      title: "Onboarding UI revision 4",
      status: "Day 8 of build · 6 updates",
      content: "Replaced the multiple dropdown selectors with a unified auto-complete search bar. Less steps, faster onboarding.",
      pillActions: true
    }
  },
  {
    step: 4,
    title: "Go Public & Ship",
    description: "Flip the switch to make your room public, generate a Build Log, and build your reputation.",
    points: [
      "Export an interactive proof-of-work history.",
      "Highlight your chronological iterations.",
      "Stand out to top companies."
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
export const faqs = [
  {
    q: "What is Patchwork exactly?",
    a: "Patchwork is where builders share their live process—day-to-day progress, pivots, and iterations—instead of polished case studies."
  },
  {
    q: "How does the Reputation system work?",
    a: "Reputation builds as you share high-quality updates. Actions like documenting why you scrapped a feature or providing 'Push back' feedback yield reputation points."
  },
  {
    q: "Can I make my rooms private?",
    a: "Rooms are open by default. Founding builders can create private rooms visible only to verified observers via invite links."
  },
  {
    q: "What are the structured reactions?",
    a: "To keep conversation high-signal, we limit reactions to: '✦ Sharp', '↩ Push back', and '? Tell me more'. No open comments."
  },
  {
    q: "How do companies use Patchwork?",
    a: "Companies watch talent build in real-time, observing engineering standards and adaptability over multi-week build logs rather than traditional resumes."
  }
];
