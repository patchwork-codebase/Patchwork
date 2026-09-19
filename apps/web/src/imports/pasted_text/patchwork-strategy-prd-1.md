
PATCHWORK
Product Strategy & Product Requirements Document
The live operating system for builders
Version	1.0 — Draft
Status	Active
Document Type	Strategy + PRD
Date	June 2026
Author	Confidential
 
1. Executive Summary
Patchwork is a real-time social platform for builders — a live operating system where founders, engineers, designers, and creators share their work-in-progress, not polished outcomes. Built at the intersection of LinkedIn's professional identity, Facebook's social graph, and X's real-time signal layer, Patchwork fills a gap no existing platform addresses: the act of building itself.
Every existing platform captures the wrong moment. LinkedIn captures the past (your resume). X captures the opinion (your thoughts). Facebook captures the social (your life). Nobody captures the process — the messy, in-progress, real-time act of making something. That gap is Patchwork.
"LinkedIn shows where you've been. X shows what you think. Patchwork shows what you're building — right now."

Product name	Patchwork
Category	Social platform / Professional network / Creator tool
Core primitive	The Build Room — a live, observable, archivable project workspace
Target users	Builders: founders, product managers, engineers, designers, writers, growth practitioners
Primary markets	Lagos, Nairobi, London, Bangalore, Sao Paulo — Global-native from day one
Monetization	Freemium (Free / Pro $18/mo / Teams $60/seat/mo / Talent placement fee)
Validation horizon	3 months — 3 core hypotheses, 3 success metrics
Strategic moat	Behavioral data flywheel: what great builders do, how decisions get made, what feedback predicts success
 
2. Problem Statement
2.1 The Gap No Platform Fills
The modern builder has a paradox: they have more tools to share their work than ever, but no platform designed to share their process. The internet is full of finished products, polished posts, and curated portfolios. It has almost nothing on how things actually get made.
This matters because:
•	Process is where learning actually happens — watching someone navigate a real design decision teaches more than any tutorial.
•	Process is where trust is built — seeing how a founder thinks in real-time is more revealing than any pitch deck or LinkedIn summary.
•	Process is where talent is visible — a builder's decision-making under uncertainty is their most important professional signal.
•	Process is where feedback is most valuable — critique on a half-finished idea changes outcomes; critique on a shipped product changes nothing.

2.2 The Platform Landscape Fails Builders
Platform	What they capture	What they miss	Patchwork win
LinkedIn	Career history and credentials (the past)	The actual process of how work gets done	Build Log as living portfolio beats a static resume
X / Twitter	Real-time opinion and broadcasting (the thought)	Context, structure, and process depth	Structured reactions + build log turns signal into knowledge
Facebook	Social graph and community (the person)	Professional process and domain expertise	Domain reputation graph tied to real output
GitHub	Code commits and version history (the output)	Design, strategy, writing — non-code work	Cross-domain: design, product, writing, growth — not just code
Notion / Loom	Documents and async video walkthroughs	Audience, feedback loop, public discovery	Build in public with real observers and structured engagement
Substack / Medium	Long-form writing about completed work	In-progress, messy, real-time process	The gap between the tweet and the essay — live and unpolished

2.3 The Vulnerability Problem
There is a real tension at the heart of Patchwork: builders are often reluctant to share unfinished work publicly. This is the primary product risk. Three conditions must be true for the vulnerability barrier to fall:
•	Psychological safety — the platform culture must reward honest process over polished output.
•	Reciprocity — if everyone is building in the open, the norm shifts. Early community seeding is critical.
•	Perceived upside — builders must feel that sharing their process creates real career or commercial value for them.
The MVP must test whether these conditions can be manufactured — if they cannot, the product requires a privacy-first redesign (private rooms by default, selectively shared).
 
3. Product Vision & Strategy
3.1 Vision
A world where the internet can watch great builders think — and where that observation creates opportunity, learning, and professional reputation at scale.
3.2 Mission
Patchwork gives builders the infrastructure to share their process in real time, and observers the ability to learn, engage, and hire from what they watch.
3.3 Strategic bets
•	The first cohort of builders is seeded across Lagos, Nairobi, London, Bangalore, and Sao Paulo simultaneously. Silicon Valley is not the default. The builder community in these markets is dense, underserved, and social-media-native.: Global-native, not global-expansion
•	The platform actively discourages polished content. The feed rewards in-progress updates, honest pivots, and real questions — not launch announcements.: Process over polish
•	Reactions are constrained to three types at MVP. This is a deliberate product decision: forced structure produces higher-quality signal and reduces moderation overhead.: Structured signal over open noise
•	Every build room generates a rich dataset of how decisions get made, what feedback lands, and what patterns predict successful builds. This corpus, at scale, becomes an AI layer no competitor can replicate.: Behavioral data as the long-term moat
3.4 Product principles
•	Builders should not feel like they are logging work — they should feel like they are working, and Patchwork captures the record automatically.: Capture data as a byproduct of survival-mode actions
•	A junior designer who gives consistently sharp feedback accrues as much social capital as a senior who ships.: Reputation earned through output and critique, not credential
•	Everything is designed to produce a beautiful, shareable Build Log at the end of a project. That artifact is the product marketing.: The Build Log is the core artifact
 
4. Target Users
4.1 Primary — The Builder
The builder is the supply side of the platform. Without builders opening rooms and posting updates, there is no product. The MVP prioritizes recruiting builders above all else.
Who they are	Founders, PMs, engineers, designers, writers, growth practitioners — anyone making something in public or aspiring to.
Where they live	Twitter/X (build in public community), LinkedIn (professional), GitHub (code), Substack (writing)
Core need	Visibility into their process, structured feedback on in-progress work, a portfolio artifact they are proud of.
Current workaround	Twitter threads (no structure), Notion docs (private), LinkedIn posts (only polished), GitHub (code only)
Motivation to use Patchwork	Career signal, peer feedback, accountability, community recognition, potential hiring visibility.

4.2 Secondary — The Observer
The observer is the demand side. Their return visits validate whether the content is valuable. They are future builders and future hirers.
Who they are	Other builders learning from peers, hiring managers evaluating talent, investors tracking founders, mentors engaging early-stage work.
Core need	High-quality, real-time insight into how good builders think — without the noise of Twitter or the polish of LinkedIn.
Motivation to engage	Learning, discovery, occasional feedback contribution, talent sourcing.
Conversion path	Observer → active reactor → builder (opens their own room) → Pro subscriber.

4.3 Tertiary — The Company
Companies enter via the Teams product post-MVP. They are the primary revenue driver at scale and the enabler of the talent marketplace moat.
Who they are	Fast-growing startups (10-200 employees), remote-first product teams, talent-forward companies.
Core need	Higher-signal hiring, internal build culture visibility, async collaboration with narrative depth.
Buying trigger	A founder or hiring manager who is already an observer and has seen the quality of builder signal firsthand.
Competitive frame	Buys instead of: Notion + Loom + Slack for process documentation. Replaces LinkedIn Recruiter for talent sourcing.
 
5. Product Requirements — Feature Specifications
5.1 MVP Feature Set (3 features only)
Scope discipline is critical. The MVP ships three features and nothing else. Every additional feature is a post-validation addition. The goal is to test the core hypothesis, not to build the full product.

Feature 1 — Build Room
What it is	A live, project-tied workspace where a creator posts in-progress updates over days or weeks.
Core actions	Open a room, name it, tag a domain, post updates (text / image / link / short video clip). Close a room when the build is done or stalled.
Content types	Text (max 500 characters per update), image upload (JPG/PNG, max 5MB), URL link with auto-preview, video clip (max 60 seconds).
Room states	Active (open, accepting updates), Closed (completed build, log generated), Archived (inactive >14 days, auto-prompt to close).
Domain tags	Design / Engineering / Product / Writing / Growth / Research / Other. One tag per room at MVP.
Privacy	Public by default at MVP. Post-MVP: Private (Pro) and Team-only (Teams) modes added.
Limits (Free)	Max 3 active rooms at once. 30-day archive window per room after closure.
Not in MVP	No DMs, no followers, no sub-rooms, no real-time collaboration, no co-builder roles.

Feature 2 — Structured Reactions
What it is	Three fixed reaction types observers can apply to any update in a Build Room.
Reaction types	1) This is sharp — positive signal, agreement, validation. 2) I'd push back — constructive dissent, challenge. 3) Tell me more — curiosity, request for elaboration.
Design rationale	No open comments at MVP. Forced structure produces higher-quality signal, reduces moderation cost, and lowers the barrier to engagement (three taps vs blank text field).
Display	Reaction counts visible per update. Breakdown by type visible to the room creator. Public observers see aggregate count only.
Notification	Room creator is notified when an update receives 3+ reactions or a 'push back' reaction (signal of substantive engagement).
Post-MVP evolution	Open comments unlocked at a reaction threshold. Threaded replies. Reaction analytics per builder.

Feature 3 — Build Log
What it is	An automatically generated, chronological archive of every update in a Build Room. Shareable as a public URL.
Generated on	Room closure (manual or auto-archive after 14 days of inactivity).
Contents	Room name, domain tag, all updates in chronological order with timestamps, aggregate reaction counts per update, total duration, final status (shipped / stalled / ongoing).
Shareability	Unique public URL. Embed-friendly. Open Graph preview for Twitter/LinkedIn sharing.
Archive window	Free: 30 days post-closure. Pro: unlimited. Build logs are the primary retention and virality driver.
Builder portfolio	All completed Build Logs appear on the builder's public profile, organized by domain and date.

5.2 Full Feature Roadmap
Feature	Description	Phase	Priority	Validates
Build Room	Live workspace tied to a project. Creator posts updates — text, image, link, short clip.	MVP	P0	Supply hypothesis
Structured Reactions	3 fixed reactions: This is sharp / I'd push back / Tell me more. No open comments.	MVP	P0	Demand hypothesis
Build Log	Auto-generated chronological archive of every update. Shareable URL on room close.	MVP	P0	Loop hypothesis
Domain Tags	Rooms tagged by domain: design / engineering / product / writing / growth.	MVP	P1	Discovery
Follow a Room	Observers follow rooms, get push or email notification on new updates.	MVP	P1	Retention
Builder Profile	Public page showing active rooms, completed build logs, domain reputation score.	MVP	P1	Identity layer
Room Discovery Feed	Algorithmic feed filtered by domain relevance and build stage.	Post-MVP	P2	Organic growth
Private Rooms	Stealth-mode rooms invisible to public. Shared via direct link only.	Pro tier	P2	Monetization unlock
AI Co-pilot	Synthesizes feedback patterns across build logs. Surfaces recurring decision blind spots.	Pro tier	P2	Monetization value
Engagement Analytics	Shows who engaged, from where, and at which update — per room and per builder.	Pro tier	P2	Monetization value
Teams Dashboard	Company view: all internal build rooms, team activity, hiring signal overlay.	Teams tier	P3	B2B value prop
Talent Matching	Company observers surface builder talent. Placement facilitated within platform.	Post-Teams	P4	Moat
 
6. MVP Validation Plan — 3 Months
6.1 Core Hypothesis
Will builders share their in-progress work publicly on a dedicated platform — and will observers find it valuable enough to return without being pushed?
Everything else — revenue, talent marketplace, AI layer, company product — is downstream of answering this question with real behavioral data in 90 days.

6.2 Three Sub-hypotheses
•	Builders will open a room and post updates for more than one week without dropping off.: Supply hypothesis
•	Observers will return to rooms unprompted (no notification triggered) more than once.: Demand hypothesis
•	Completed Build Logs will be shared externally by builders as portfolio or proof-of-work artifacts.: Loop hypothesis

6.3 Monthly Plan
Phase	Focus	Actions	Success Signal
Phase 1 Month 1	Supply creation	Manually recruit 30-50 builders via DM on Twitter/X and LinkedIn. White-glove onboarding call. Target the build-in-public crowd.	40%+ of builders post week 2 update
Phase 2 Month 2	Demand testing	Stop recruiting builders. Observe return visit rate. Track unprompted observer returns. Tune discovery and notification layer.	3x average unprompted observer return visits
Phase 3 Month 3	Loop closure	Watch what happens post-ship. Does the Build Log travel externally? Do new users arrive from those shares?	30%+ of Build Logs shared outside platform
Phase 4 Post-MVP	B2B wedge	5-10 companies using platform to observe and hire. Teams product launch. Case studies. Outbound sales motion begins.	First 3 Teams deals closed

6.4 Success Metrics at Day 90
40%
Room retention
40%+ of opened rooms post a week-2 update. Below this = vulnerability tension is structural.	3×
Observer return visits
Average observer visits a room 3+ times unprompted. Three visits = habit, not curiosity.	30%
Build Log external share rate
30%+ of completed logs shared outside the platform. Builders must be proud enough to own them.

6.5 Kill Conditions & Pivot Paths
Signal	What it means	Pivot action
Builders open rooms but go silent after 3 days	Vulnerability tension is structural, not a UX issue	Flip to private-by-default. Rooms shared selectively. Reframe as a working journal.
Observers visit once, never return	Content not compelling or discovery/notification broken	Add more curation. Reduce raw stream volume. Introduce editorial picks.
Build logs not shared externally	Builders treat process as private IP, not portfolio value	Reposition as proof-of-work artifact. Add export to PDF/LinkedIn. Add case-study templates.
 
7. Revenue Model
7.1 Overview
Patchwork runs a freemium model with four revenue streams layered by user maturity. The free tier is the acquisition engine and must be genuinely useful with no friction. Monetization increases as builders get more serious and companies see talent value.
Tier	Price	Key Features	Target User
Free	$0/mo	Build rooms, 30-day archive, public profile, basic reactions	Solo builders, hobbyists, students
Pro	$18/mo	Unlimited archive, private rooms, engagement analytics, AI co-pilot feedback patterns	Professional builders, indie hackers, freelancers
Teams	$60/seat/mo	Internal build culture layer, async collaboration, hiring signal dashboard, admin controls	Startups, product teams, remote-first companies
Talent Placement	% fee	Passive talent discovery, company-builder matching, placement facilitated by Patchwork	Companies hiring, senior builders open to roles

7.2 Revenue stream detail
Pro — $18/month
Pro unlocks the full builder toolkit. The AI co-pilot is the highest-value Pro feature: it synthesizes feedback patterns across a builder's complete Build Log history and surfaces recurring decision blind spots. For example: 'Your design decisions receive the most push-back reactions when you skip the problem-framing step in the first update.' This is a capability no other platform offers because no other platform has the behavioral data.
Teams — $60/seat/month
Companies use Teams to make their internal build culture visible and navigable. New hires can watch how real decisions get made. Remote teams can async collaborate without losing the texture of the process. The platform competes with Notion + Loom + Slack on the process documentation use case, and wins on narrative depth and social engagement. Minimum viable deal: 5-seat team at $300/month.
Talent Marketplace (Post-Teams)
The talent marketplace is the long-term moat. A company that observes a builder's Build Log for four weeks has more signal about that person's thinking quality than any resume or interview process provides. Patchwork facilitates the introduction and takes a placement fee (target: 8-12% of first-year salary for senior placements). This transforms the platform from social tool to talent infrastructure — and makes it a LinkedIn killer at scale.
7.3 Revenue projections — Year 1 targets
Pro subscribers target	500 builders at $18/mo = $9,000 MRR by month 12
Teams deals target	15 companies at avg. 8 seats = $60 x 8 x 15 = $7,200 MRR by month 12
Combined MRR target	$16,200/month (~$195K ARR) at end of Year 1
Talent placement target	3-5 placements in Year 1 at $5K avg fee = $15-25K one-time
Primary Year 1 focus	Validation, supply/demand balance, and first 10 Teams customers — not revenue optimization
 
8. Go-to-Market Strategy
8.1 The core GTM bet
Patchwork's GTM is community-first, category creation second. The platform cannot be built without a seeded community of high-quality builders from day one. The product cannot market itself until great Build Logs exist to share. These are the two constraints everything else is designed around.
The marketing channel IS the product. A beautiful Build Log shared on Twitter or LinkedIn is a Patchwork ad. The GTM succeeds when the product sells itself through the artifacts it produces.

8.2 Phase 1 — Community seeding (Month 1)
Manual recruitment of 30-50 builders across five cities: Lagos, Nairobi, London, Bangalore, Sao Paulo. The deliberate choice to go global-native — not Silicon Valley — signals who the platform is for and taps into dense builder communities that LinkedIn underserves.
Recruitment channel: direct DM via Twitter/X and LinkedIn. Target criteria: already narrates their work publicly (tweets threads, posts Notion docs, shares decisions openly), active builder (shipping something in the next 60 days), domain spread across design / engineering / product / writing.
White-glove onboarding: 20-minute call with every first-cohort builder. Goal: help them frame their first room well. A well-framed opening update dramatically increases the chance of continued posting and observer engagement.
8.3 Phase 2 — Content flywheel (Month 2)
Every great Build Log becomes distribution. The team works with builders to repurpose their completed logs as: Twitter/X threads, LinkedIn posts, YouTube Shorts, newsletter case studies. Each piece of content attributes back to Patchwork with a link to the Build Log. The content markets the platform for free, and the Build Log URL does the conversion.
The team also creates a weekly 'Best Builds' newsletter: the top 3-5 Build Logs of the week, curated and sent to the observer list. This is the primary observer retention mechanism and a low-cost content operation.
8.4 Phase 3 — B2B wedge (Month 3+)
The first company customers will come from founders and hiring managers who are already observers. The sales motion is warm: 'You've been watching [builder's] room for three weeks. Did you know you can have your whole team build in the open the same way?' The Teams product launch is gated until 5+ companies are using an informal version.
Case studies from the first 3 Teams customers become the primary outbound sales asset. Target: fast-growing startups with remote-first culture and strong PM/design team identity.
8.5 Positioning statement
Patchwork is the platform for builders who think out loud. Unlike LinkedIn, which shows where you've been, or X, which shows what you think, Patchwork shows what you're building — in real time, with the people who care most about how you do it.
 
9. Technical Architecture
9.1 Recommended stack — MVP
Frontend	Next.js 14 (App Router). React Server Components for feed and Build Log pages. Tailwind CSS.
Backend	Supabase — Postgres for structured data, Realtime for live room updates, Auth for user management, Storage for media uploads.
Deployment	Vercel (frontend). Supabase cloud (backend). CDN for media delivery.
Payments	Stripe — subscription billing for Pro and Teams tiers. Webhook-driven entitlement updates.
Notifications	Resend for transactional email. Push notifications via web push API (post-MVP mobile).
Media	Supabase Storage + Cloudflare CDN for images. Mux or Cloudflare Stream for short video clips.
Analytics	PostHog — product analytics, session recording, feature flags. Critical for MVP hypothesis testing.
AI layer (Pro)	Anthropic Claude API. Feedback pattern synthesis across Build Logs. Prompt-based, no custom model training at MVP.
9.2 Data model — core entities
•	User — id, name, avatar, domain_tags[], reputation_score, created_at
•	Room — id, creator_id, title, domain_tag, status (active/closed/archived), created_at, closed_at
•	Update — id, room_id, content_text, media_urls[], link_url, created_at
•	Reaction — id, update_id, user_id, type (sharp/pushback/tellmore), created_at
•	BuildLog — id, room_id, generated_at, share_url, public_view_count
•	Follow — id, user_id, room_id, created_at, notification_enabled
9.3 Build timeline — MVP in 10 weeks
Weeks 1-2	Auth, user profiles, basic room creation and update posting (text only).
Weeks 3-4	Media uploads (image + link). Reactions (3 types). Basic feed.
Weeks 5-6	Build Log generation and share URL. Room close flow. Email notifications.
Weeks 7-8	Follow a room. Push notifications. Domain tag discovery.
Weeks 9-10	Polish, bug fix, performance. PostHog instrumentation. Soft launch to first 50 builders.
 
10. Risks & Mitigations
Risk	Mitigation

Risk	Severity	Mitigation
Vulnerability tension: builders don't want to share in-progress work	HIGH	Private rooms in Pro tier. Community norms seeded deliberately in first cohort. Reframe as proof-of-work journal, not public performance.
Cold start: no observers without builders; no builders without observers	HIGH	Seed 30-50 builders before opening observer signups. Build Log shares drive organic observer acquisition from outside the platform.
Content quality degradation as the platform scales	MEDIUM	Structured reactions enforce quality floor. Editorial curation ('Best Builds') in early stages. Reputation score creates quality incentive.
LinkedIn or Notion clones the Build Room feature	MEDIUM	Speed to moat: behavioral data corpus and domain reputation graph are hard to replicate. Community culture is the real defensibility.
Builders use the platform for self-promotion, not genuine process sharing	MEDIUM	Reaction types 'I'd push back' create norm against polish. Community moderation. First-cohort culture sets platform norms permanently.
Monetization friction reduces builder supply	LOW	Free tier is permanently generous. Monetization targets observers-turned-buyers and companies, not builders. Builder supply must never feel gated.
 
11. Success Metrics — Full Dashboard
11.1 North Star metric
Weekly Active Build Rooms: the number of rooms that receive at least one update in a 7-day window. This is the single metric that captures both builder supply and platform health.

11.2 Metric framework by layer
Layer	Metric	Target (Month 3)	Target (Month 12)
Supply	Active rooms with week-2 update	40% retention	60% retention
Supply	Total builders with a completed Build Log	20 builders	500 builders
Demand	Avg. unprompted observer return visits per room	3x per room	6x per room
Demand	Observer-to-builder conversion rate	—	15%
Loop	Build Logs shared externally	30% of closed rooms	50% of closed rooms
Loop	New signups from external Build Log shares	—	30% of total signups
Revenue	Pro subscribers	0 (pre-launch)	500
Revenue	Teams customers	0 (pre-launch)	15
Revenue	MRR	$0	$16,200
Moat	Total reactions recorded	500	50,000
Moat	Avg. feedback quality score (measured by follow-up engagement)	Baseline	20% above baseline
 
12. Appendix — Quick Reference
12.1 The three questions this document answers
•	A real-time social platform where builders share their in-progress work publicly, get structured feedback from observers, and generate a Build Log artifact at the end of each project.: What is Patchwork?
•	Three features: Build Room, Structured Reactions (3 types), Build Log. Nothing else. Ship in 10 weeks, validate in 90 days.: What is the MVP?
•	40% room retention, 3x unprompted observer return visits, 30% of Build Logs shared externally.: What does success look like at 90 days?

12.2 Product DNA — what Patchwork inherits from each platform
From Facebook	Social graph structure, community norms-setting, group identity around domain (design/engineering/etc).
From LinkedIn	Professional identity, domain reputation scoring, talent discovery and hiring signal.
From X / Twitter	Real-time feed, ambient awareness, build-in-public culture, short-form update format.
What Patchwork adds	Structure (3-reaction system), process depth (multi-update rooms), artifact generation (Build Log), and a behavioral data moat none of the three possess.

12.3 Glossary
Build Room	A live workspace tied to a project. The core primitive. Creator posts updates; observers follow and react.
Build Log	Auto-generated archive of a completed Build Room. Shareable URL. The primary artifact and viral loop.
Structured Reaction	One of three fixed observer responses: This is sharp / I'd push back / Tell me more.
Domain Tag	Category label on a room: Design / Engineering / Product / Writing / Growth / Research / Other.
Reputation Score	Platform-generated score based on quality of build output and structured feedback given to others.
Supply hypothesis	Builders will open rooms and post updates for more than one week.
Demand hypothesis	Observers will return to rooms unprompted more than once.
Loop hypothesis	Completed Build Logs will be shared externally as portfolio artifacts.
Vulnerability tension	The psychological barrier builders face when asked to share unfinished, imperfect, in-progress work publicly.
Behavioral data flywheel	The self-reinforcing dataset of builder decisions, feedback patterns, and outcomes that becomes Patchwork's AI and talent moat.

This document is a living product strategy. Every section should be revisited after the 90-day MVP validation window. Metrics and assumptions will update as real behavioral data replaces hypotheses.

