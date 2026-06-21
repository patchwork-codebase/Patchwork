-- Migration for Expert Reviews Feature

-- Expert Review Requests Table
CREATE TABLE IF NOT EXISTS public.expert_review_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    builder_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    expert_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    room_id TEXT NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    build_summary TEXT NOT NULL,
    specific_challenge TEXT NOT NULL,
    questions TEXT NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    is_public BOOLEAN NOT NULL DEFAULT true,
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expert Reviews Table
CREATE TABLE IF NOT EXISTS public.expert_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL UNIQUE REFERENCES public.expert_review_requests(id) ON DELETE CASCADE,
    expert_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    builder_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    room_id TEXT NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    understanding TEXT NOT NULL,
    what_works TEXT NOT NULL,
    risks TEXT NOT NULL,
    questions TEXT NOT NULL,
    alternative_approaches TEXT NOT NULL,
    recommendation TEXT NOT NULL,
    confidence NUMERIC(3, 2) NOT NULL CHECK (confidence >= 0 AND confidence <= 10),
    score NUMERIC(3, 2) NOT NULL CHECK (score >= 0 AND score <= 10),
    is_resolved BOOLEAN NOT NULL DEFAULT false,
    converted_to_artifact BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.expert_review_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_reviews ENABLE ROW LEVEL SECURITY;

-- Expert Review Requests Policies
DROP POLICY IF EXISTS "Allow builders to view their own requests" ON public.expert_review_requests;
CREATE POLICY "Allow builders to view their own requests" ON public.expert_review_requests FOR SELECT USING (auth.uid() = builder_id OR auth.uid() = expert_id);
DROP POLICY IF EXISTS "Allow builders to insert their own requests" ON public.expert_review_requests;
CREATE POLICY "Allow builders to insert their own requests" ON public.expert_review_requests FOR INSERT WITH CHECK (auth.uid() = builder_id);
DROP POLICY IF EXISTS "Allow experts to update requests assigned to them" ON public.expert_review_requests;
CREATE POLICY "Allow experts to update requests assigned to them" ON public.expert_review_requests FOR UPDATE USING (auth.uid() = expert_id OR auth.uid() = builder_id);

-- Expert Reviews Policies
DROP POLICY IF EXISTS "Allow public read access to public reviews" ON public.expert_reviews;
CREATE POLICY "Allow public read access to public reviews" ON public.expert_reviews FOR SELECT USING (true); -- Simplified for now, should check request is_public
DROP POLICY IF EXISTS "Allow experts to insert their own reviews" ON public.expert_reviews;
CREATE POLICY "Allow experts to insert their own reviews" ON public.expert_reviews FOR INSERT WITH CHECK (auth.uid() = expert_id);
DROP POLICY IF EXISTS "Allow experts and builders to update reviews" ON public.expert_reviews;
CREATE POLICY "Allow experts and builders to update reviews" ON public.expert_reviews FOR UPDATE USING (auth.uid() = expert_id OR auth.uid() = builder_id);

-- Realtime replication
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'expert_review_requests') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.expert_review_requests;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'expert_reviews') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.expert_reviews;
  END IF;
END $$;
