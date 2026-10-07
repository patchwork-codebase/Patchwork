-- Migration: 0112_feed_simulations.sql
-- Description: Adds feed-native simulation challenges, simulation_responses tracking, and reputation rewards.

-- 1. Ensure updates table supports simulation update_type and simulation_data JSONB
ALTER TABLE public.updates ADD COLUMN IF NOT EXISTS simulation_data JSONB;

-- Normalize any unexpected, null, or legacy update_type values to 'general' before applying constraint
UPDATE public.updates 
SET update_type = 'general' 
WHERE update_type IS NULL 
   OR update_type NOT IN (
       'general', 'decision', 'scrap', 'pivot', 'blocker', 'insight', 
       'open_question', 'shipped', 'crossroad', 'spotlight', 'rfb', 
       'milestone', 'simulation'
   );

ALTER TABLE public.updates DROP CONSTRAINT IF EXISTS updates_update_type_check;
ALTER TABLE public.updates ADD CONSTRAINT updates_update_type_check 
CHECK (update_type IN (
    'general', 
    'decision', 
    'scrap', 
    'pivot', 
    'blocker', 
    'insight', 
    'open_question', 
    'shipped', 
    'crossroad', 
    'spotlight', 
    'rfb', 
    'milestone', 
    'simulation'
));

-- 2. Create simulation_responses table
CREATE TABLE IF NOT EXISTS public.simulation_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    update_id TEXT NOT NULL REFERENCES public.updates(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    selected_option_id TEXT NOT NULL,
    rationale TEXT,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(update_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_simulation_responses_update_id ON public.simulation_responses(update_id);
CREATE INDEX IF NOT EXISTS idx_simulation_responses_user_id ON public.simulation_responses(user_id);

-- 3. Enable RLS on simulation_responses
ALTER TABLE public.simulation_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Simulation responses are viewable by everyone" ON public.simulation_responses;
CREATE POLICY "Simulation responses are viewable by everyone" ON public.simulation_responses
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own simulation response" ON public.simulation_responses;
CREATE POLICY "Users can insert their own simulation response" ON public.simulation_responses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own simulation response" ON public.simulation_responses;
CREATE POLICY "Users can update their own simulation response" ON public.simulation_responses
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. Automated Reputation Rewards Trigger (+50 Rep for completing a challenge)
CREATE OR REPLACE FUNCTION public.handle_simulation_response_reward()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.reputation_events (
        user_id,
        action_type,
        points,
        metadata
    ) VALUES (
        NEW.user_id,
        'completed_simulation',
        50,
        jsonb_build_object(
            'update_id', NEW.update_id,
            'selected_option_id', NEW.selected_option_id,
            'has_rationale', (NEW.rationale IS NOT NULL AND length(trim(NEW.rationale)) > 0)
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_simulation_response_reward ON public.simulation_responses;
CREATE TRIGGER on_simulation_response_reward
    AFTER INSERT ON public.simulation_responses
    FOR EACH ROW EXECUTE FUNCTION public.handle_simulation_response_reward();

-- 5. Seed sample high-signal Senior PM challenges if public build rooms exist
DO $$
DECLARE
    v_room_id TEXT;
    v_user_id UUID;
    v_author_name TEXT;
    v_update_id_1 TEXT := 'sim_challenge_001';
    v_update_id_2 TEXT := 'sim_challenge_002';
BEGIN
    -- Find an existing room and user to anchor the simulation posts
    SELECT r.id, r.builder_id, COALESCE(u.name, 'Patchwork Senior') 
    INTO v_room_id, v_user_id, v_author_name 
    FROM public.rooms r
    LEFT JOIN public.users u ON u.id = r.builder_id
    LIMIT 1;
    
    IF v_room_id IS NOT NULL AND v_user_id IS NOT NULL THEN
        -- Challenge 1: Checkout Latency vs Security
        INSERT INTO public.updates (
            id,
            room_id,
            author_id,
            author_name,
            content,
            update_type,
            simulation_data,
            created_at
        ) VALUES (
            v_update_id_1,
            v_room_id,
            v_user_id,
            COALESCE(v_author_name, 'Patchwork Senior'),
            '⚡ Senior PM Dilemma: Mobile Checkout Latency Spike vs Anti-Fraud Model',
            'simulation',
            jsonb_build_object(
                'scenario_title', 'Checkout Latency Spike vs Anti-Fraud Defense',
                'category', 'Product Strategy & Risk',
                'seniority_target', 'Strategic PM',
                'role_tag', 'Fintech',
                'context_prompt', 'A new real-time risk model cut fraud by 40%, but added 350ms to mobile checkout latency. Top enterprise merchants report a 2.5% drop in transaction completion and demand an immediate rollback. The security team insists keeping it live to block an active credential stuffing attack.',
                'creator_role', 'Product Lead',
                'creator_company', 'Fintech Platform',
                'options', jsonb_build_array(
                    jsonb_build_object(
                        'id', 'opt_a',
                        'title', 'Rollback model immediately to restore merchant conversion',
                        'description', 'Prioritize checkout conversion rate today; patch bot filters asynchronously out-of-band.',
                        'impact_metrics', jsonb_build_object('trust', 15, 'velocity', 20, 'revenue', 25, 'risk', -30)
                    ),
                    jsonb_build_object(
                        'id', 'opt_b',
                        'title', 'Keep model live; whitelist top enterprise accounts with conditional fast-pathing',
                        'description', 'Isolate known trusted users from latency overhead while maintaining active shield for untrusted traffic.',
                        'impact_metrics', jsonb_build_object('trust', 25, 'velocity', 10, 'revenue', 15, 'risk', 15)
                    ),
                    jsonb_build_object(
                        'id', 'opt_c',
                        'title', 'Move risk check to post-checkout async with reversible hold',
                        'description', 'Authorise payments instantly in sub-100ms and run the heavy 350ms fraud scoring in the background before capture.',
                        'impact_metrics', jsonb_build_object('trust', 30, 'velocity', 5, 'revenue', 20, 'risk', 10)
                    )
                ),
                'creator_rationale', 'Moving verification to an async pre-capture stage or conditional fast-pathing protects transaction velocity without leaving the infrastructure vulnerable. Never treat security and conversion as a zero-sum trade-off.',
                'senior_tip', 'Great PMs deconstruct latency bottlenecks into synchronous vs asynchronous lifecycle moments.'
            ),
            NOW() - INTERVAL '2 hours'
        ) ON CONFLICT (id) DO NOTHING;

        -- Challenge 2: Power User Feature Sunset
        INSERT INTO public.updates (
            id,
            room_id,
            author_id,
            author_name,
            content,
            update_type,
            simulation_data,
            created_at
        ) VALUES (
            v_update_id_2,
            v_room_id,
            v_user_id,
            COALESCE(v_author_name, 'Patchwork Senior'),
            '⚡ Senior PM Dilemma: Sunset Legacy Reporting Loved by 2% of Power Users',
            'simulation',
            jsonb_build_object(
                'scenario_title', 'Killing Legacy Export Loved by 2% Power Users',
                'category', 'Technical Debt & Lifecycle',
                'seniority_target', 'Senior PM',
                'role_tag', 'B2B SaaS',
                'context_prompt', 'Our v1 CSV batch export consumes 60% of background worker compute and blocks the release of our new real-time analytics engine. The 2% of users who rely on it generate 18% of total ARR and threaten to churn if removed.',
                'creator_role', 'Group PM',
                'creator_company', 'Analytics SaaS',
                'options', jsonb_build_array(
                    jsonb_build_object(
                        'id', 'opt_a',
                        'title', 'Sunset with 60-day notice and dedicated migration engineer support',
                        'description', 'Draw a firm boundary to unblock the entire product roadmap, investing high-touch human support to retain ARR.',
                        'impact_metrics', jsonb_build_object('trust', -10, 'velocity', 30, 'revenue', -5, 'risk', 10)
                    ),
                    jsonb_build_object(
                        'id', 'opt_b',
                        'title', 'Keep feature active as an isolated paid add-on ($500/mo legacy tier)',
                        'description', 'Align compute costs directly with customer value. Filters out casual usage while funding dedicated infrastructure.',
                        'impact_metrics', jsonb_build_object('trust', 15, 'velocity', 15, 'revenue', 20, 'risk', 5)
                    ),
                    jsonb_build_object(
                        'id', 'opt_c',
                        'title', 'Delay new analytics launch by 2 quarters to rebuild legacy export on serverless',
                        'description', 'Refuse to break any customer workflow; absorb the opportunity cost of delay.',
                        'impact_metrics', jsonb_build_object('trust', 20, 'velocity', -25, 'revenue', 5, 'risk', -15)
                    )
                ),
                'creator_rationale', 'A legacy maintenance fee turns an expensive technical burden into an economically viable tier. It gives power users choice without forcing your entire platform velocity to crawl to a halt.',
                'senior_tip', 'When power users defend legacy workflows, price the complexity honestly before you build workarounds.'
            ),
            NOW() - INTERVAL '5 hours'
        ) ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;
