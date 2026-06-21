-- Migration: 0041_discovery_mode
-- Description: Core tables and RLS policies for Discovery Mode.

-- Drop existing tables to ensure clean re-run of migration
DROP TABLE IF EXISTS public.discovery_decisions CASCADE;
DROP TABLE IF EXISTS public.discovery_reviews CASCADE;
DROP TABLE IF EXISTS public.discovery_signals CASCADE;
DROP TABLE IF EXISTS public.discovery_interviews CASCADE;
DROP TABLE IF EXISTS public.discovery_assumptions CASCADE;
DROP TABLE IF EXISTS public.discovery_hypotheses CASCADE;
DROP TABLE IF EXISTS public.discovery_projects CASCADE;

-- discovery_projects
CREATE TABLE public.discovery_projects (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    builder_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    problem_statement text,
    audience text,
    market text,
    pain_level text,
    confidence_score integer DEFAULT 0,
    status text DEFAULT 'active', -- active, converted, killed, archived
    converted_room_id text REFERENCES public.rooms(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT discovery_projects_pkey PRIMARY KEY (id)
);

-- discovery_hypotheses
CREATE TABLE public.discovery_hypotheses (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    project_id uuid NOT NULL REFERENCES public.discovery_projects(id) ON DELETE CASCADE,
    statement text NOT NULL,
    success_indicators text,
    failure_indicators text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT discovery_hypotheses_pkey PRIMARY KEY (id)
);

-- discovery_assumptions
CREATE TABLE public.discovery_assumptions (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    project_id uuid NOT NULL REFERENCES public.discovery_projects(id) ON DELETE CASCADE,
    assumption text NOT NULL,
    status text DEFAULT 'untested', -- untested, validated, invalidated
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT discovery_assumptions_pkey PRIMARY KEY (id)
);

-- discovery_interviews
CREATE TABLE public.discovery_interviews (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    project_id uuid NOT NULL REFERENCES public.discovery_projects(id) ON DELETE CASCADE,
    interviewee_name text,
    interviewee_role text,
    interviewee_company text,
    interview_date timestamp with time zone DEFAULT now(),
    notes text,
    recording_url text,
    summary text,
    key_insights text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT discovery_interviews_pkey PRIMARY KEY (id)
);

-- discovery_signals
CREATE TABLE public.discovery_signals (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    project_id uuid NOT NULL REFERENCES public.discovery_projects(id) ON DELETE CASCADE,
    type text NOT NULL, -- interview, survey, analytics, competitor_research, sales_call, etc.
    status text NOT NULL, -- positive, negative, neutral
    description text,
    impact_weight integer DEFAULT 0, -- the % impact on confidence
    source_reference_id uuid, -- e.g. links to an interview ID if applicable
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT discovery_signals_pkey PRIMARY KEY (id)
);

-- discovery_reviews
CREATE TABLE public.discovery_reviews (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    project_id uuid NOT NULL REFERENCES public.discovery_projects(id) ON DELETE CASCADE,
    reviewer_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    problem_quality text,
    research_quality text,
    evidence_quality text,
    market_opportunity text,
    decision_quality text,
    general_feedback text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT discovery_reviews_pkey PRIMARY KEY (id)
);

-- discovery_decisions
CREATE TABLE public.discovery_decisions (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    project_id uuid NOT NULL REFERENCES public.discovery_projects(id) ON DELETE CASCADE,
    decision text NOT NULL, -- proceed_to_build, need_more_research, pivot, kill_idea
    rationale text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT discovery_decisions_pkey PRIMARY KEY (id)
);


-- Function to update confidence score based on signals
CREATE OR REPLACE FUNCTION public.update_discovery_confidence()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.discovery_projects
    SET confidence_score = (
        SELECT COALESCE(SUM(impact_weight), 0)
        FROM public.discovery_signals
        WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
    ),
    updated_at = now()
    WHERE id = COALESCE(NEW.project_id, OLD.project_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_discovery_confidence_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.discovery_signals
FOR EACH ROW EXECUTE FUNCTION public.update_discovery_confidence();


-- RLS Setup (Inheriting logic from Rooms - public read, builder write)
ALTER TABLE public.discovery_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovery_hypotheses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovery_assumptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovery_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovery_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovery_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovery_decisions ENABLE ROW LEVEL SECURITY;

-- Project Policies
CREATE POLICY "Public read discovery projects" ON public.discovery_projects FOR SELECT USING (true);
CREATE POLICY "Builders insert discovery projects" ON public.discovery_projects FOR INSERT WITH CHECK (auth.uid() = builder_id);
CREATE POLICY "Builders update own discovery projects" ON public.discovery_projects FOR UPDATE USING (auth.uid() = builder_id);
CREATE POLICY "Builders delete own discovery projects" ON public.discovery_projects FOR DELETE USING (auth.uid() = builder_id);

-- Child table policies (Hypotheses, Assumptions, Interviews, Signals, Decisions)
-- Read: Public
-- Write: Only if you are the builder of the parent project.

-- For discovery_hypotheses
CREATE POLICY "Public read discovery_hypotheses" ON public.discovery_hypotheses FOR SELECT USING (true);
CREATE POLICY "Builders manage discovery_hypotheses" ON public.discovery_hypotheses FOR ALL USING (
    EXISTS (SELECT 1 FROM public.discovery_projects WHERE id = project_id AND builder_id = auth.uid())
);

-- For discovery_assumptions
CREATE POLICY "Public read discovery_assumptions" ON public.discovery_assumptions FOR SELECT USING (true);
CREATE POLICY "Builders manage discovery_assumptions" ON public.discovery_assumptions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.discovery_projects WHERE id = project_id AND builder_id = auth.uid())
);

-- For discovery_interviews
CREATE POLICY "Public read discovery_interviews" ON public.discovery_interviews FOR SELECT USING (true);
CREATE POLICY "Builders manage discovery_interviews" ON public.discovery_interviews FOR ALL USING (
    EXISTS (SELECT 1 FROM public.discovery_projects WHERE id = project_id AND builder_id = auth.uid())
);

-- For discovery_signals
CREATE POLICY "Public read discovery_signals" ON public.discovery_signals FOR SELECT USING (true);
CREATE POLICY "Builders manage discovery_signals" ON public.discovery_signals FOR ALL USING (
    EXISTS (SELECT 1 FROM public.discovery_projects WHERE id = project_id AND builder_id = auth.uid())
);

-- For discovery_decisions
CREATE POLICY "Public read discovery_decisions" ON public.discovery_decisions FOR SELECT USING (true);
CREATE POLICY "Builders manage discovery_decisions" ON public.discovery_decisions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.discovery_projects WHERE id = project_id AND builder_id = auth.uid())
);

-- For discovery_reviews (Experts leave reviews)
CREATE POLICY "Public read discovery_reviews" ON public.discovery_reviews FOR SELECT USING (true);
CREATE POLICY "Users insert discovery_reviews" ON public.discovery_reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Users update own discovery_reviews" ON public.discovery_reviews FOR UPDATE USING (auth.uid() = reviewer_id);
CREATE POLICY "Users delete own discovery_reviews" ON public.discovery_reviews FOR DELETE USING (auth.uid() = reviewer_id);
