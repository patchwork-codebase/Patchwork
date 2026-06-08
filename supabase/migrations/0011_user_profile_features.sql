-- Add new fields to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS twitter text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS github_url text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS linkedin_url text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS skills text[] DEFAULT '{}';

-- Create follows table
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

-- Enable RLS on follows
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Allow public read access to follows
CREATE POLICY "Allow public read access to follows" ON public.follows
  FOR SELECT USING (true);

-- Allow authenticated users to follow/unfollow
CREATE POLICY "Allow authenticated users to follow" ON public.follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Allow authenticated users to unfollow" ON public.follows
  FOR DELETE USING (auth.uid() = follower_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);

-- Enable realtime for follows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'follows'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.follows;
  END IF;
END $$;
