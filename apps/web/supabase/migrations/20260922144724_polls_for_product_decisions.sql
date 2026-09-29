-- Migration: polls_for_product_decisions
-- Description: Add polls, poll_options, and poll_votes tables with RPC for atomic voting

CREATE TABLE public.polls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    update_id TEXT REFERENCES public.updates(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.poll_options (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.poll_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE,
    poll_option_id UUID REFERENCES public.poll_options(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(poll_id, user_id)
);

-- Enable RLS
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- Policies for polls
CREATE POLICY "Public read access for polls" ON public.polls FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create polls" ON public.polls FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authors can update their polls" ON public.polls FOR UPDATE USING (auth.uid() IN (SELECT author_id FROM public.updates WHERE id = public.polls.update_id));
CREATE POLICY "Authors can delete their polls" ON public.polls FOR DELETE USING (auth.uid() IN (SELECT author_id FROM public.updates WHERE id = public.polls.update_id));

-- Policies for poll_options
CREATE POLICY "Public read access for poll options" ON public.poll_options FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create options" ON public.poll_options FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Policies for poll_votes
CREATE POLICY "Public read access for poll votes" ON public.poll_votes FOR SELECT USING (true);
CREATE POLICY "Users can manage their own votes" ON public.poll_votes FOR ALL USING (auth.uid() = user_id);

-- RPC for atomic voting
DROP FUNCTION IF EXISTS vote_on_poll CASCADE;
CREATE OR REPLACE FUNCTION vote_on_poll(p_poll_id UUID, p_poll_option_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    -- Verify poll exists and hasn't expired
    IF EXISTS (SELECT 1 FROM public.polls WHERE id = p_poll_id AND expires_at < now()) THEN
        RAISE EXCEPTION 'Poll has expired';
    END IF;

    -- Upsert the vote (change vote if already voted)
    INSERT INTO public.poll_votes (poll_id, poll_option_id, user_id)
    VALUES (p_poll_id, p_poll_option_id, auth.uid())
    ON CONFLICT (poll_id, user_id) DO UPDATE SET poll_option_id = EXCLUDED.poll_option_id, created_at = now();
END;
$$;
