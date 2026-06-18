-- Migration: Create room_templates table and seed default templates

CREATE TABLE IF NOT EXISTS public.room_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  recommended_tags TEXT[] NOT NULL DEFAULT '{}',
  template_context TEXT NOT NULL,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  author_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.room_templates ENABLE ROW LEVEL SECURITY;

-- Everyone can view system templates and their own custom templates
CREATE POLICY "Allow public read access to system templates" ON public.room_templates
  FOR SELECT USING (is_system = true OR auth.uid() = author_id);

-- Only authenticated users can insert custom templates
CREATE POLICY "Allow users to insert custom templates" ON public.room_templates
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE INDEX IF NOT EXISTS idx_room_templates_author ON public.room_templates(author_id);

-- Seed the 6 default templates
INSERT INTO public.room_templates (name, description, icon, recommended_tags, template_context, is_system) VALUES
(
  'PRD Build',
  'For PMs building a new Product Requirements Document.',
  'FileText',
  ARRAY['product', 'planning', 'prd'],
  '**Context:**\nI am drafting the PRD for [Project Name].\n\n**Recommended Updates to Post:**\n- [ ] Problem statement & hypotheses\n- [ ] Target audience definition\n- [ ] Core user flows\n- [ ] Eng feasibility review notes',
  true
),
(
  'User Research Sprint',
  'For tracking a user research phase.',
  'Users',
  ARRAY['research', 'product', 'discovery'],
  '**Context:**\nConducting user research for [Feature/Problem].\n\n**Recommended Updates to Post:**\n- [ ] Research question & methodology\n- [ ] Recruitment approach\n- [ ] Initial interview findings\n- [ ] Synthesis & Insights\n- [ ] Decision driven by research',
  true
),
(
  'Feature Launch',
  'For managing the rollout of a new feature.',
  'Rocket',
  ARRAY['launch', 'product', 'marketing'],
  '**Context:**\nPreparing for the launch of [Feature Name].\n\n**Recommended Milestones & Updates:**\n- [ ] T-14 days: Brief finalised & GTM strategy\n- [ ] T-7 days: Engineering sign-off & QA\n- [ ] T-0: Launch day!\n- [ ] T+7 days: Post-launch metrics & retro',
  true
),
(
  '0→1 Product',
  'For building something entirely new from scratch.',
  'Sparkles',
  ARRAY['0-to-1', 'product', 'innovation'],
  '**Context:**\nBuilding a completely new 0→1 product in the [Domain] space.\n\n**Recommended Updates to Post:**\n- [ ] The "Why" and the Vision\n- [ ] MVP scope defined\n- [ ] First prototype feedback\n- [ ] Beta release learnings',
  true
),
(
  'Onboarding Redesign',
  'For revamping user onboarding flows.',
  'LayoutTemplate',
  ARRAY['design', 'growth', 'product'],
  '**Context:**\nRedesigning the user onboarding flow to improve activation rates.\n\n**Recommended Updates to Post:**\n- [ ] Current funnel drop-off analysis\n- [ ] Competitor teardowns\n- [ ] Wireframe explorations\n- [ ] A/B test results',
  true
),
(
  'Competitive Analysis',
  'For deep dives into competitor products.',
  'Crosshair',
  ARRAY['strategy', 'product', 'research'],
  '**Context:**\nAnalyzing competitors in the [Market Segment] space.\n\n**Recommended Updates to Post:**\n- [ ] List of competitors identified\n- [ ] Feature matrix comparison\n- [ ] Pricing model breakdown\n- [ ] Strategic positioning takeaway',
  true
);
