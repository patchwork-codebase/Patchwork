-- Migration for Mentions and Tagging
CREATE TABLE IF NOT EXISTS public.mentions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type TEXT NOT NULL CHECK (source_type IN ('update', 'comment')),
    source_id UUID NOT NULL,
    mentioned_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast lookup of mentions for a specific user
CREATE INDEX IF NOT EXISTS idx_mentions_mentioned_user_id ON public.mentions(mentioned_user_id);

-- Function to handle push and in-app notifications for mentions
CREATE OR REPLACE FUNCTION handle_new_mention()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert into notifications table (in-app notification)
    INSERT INTO public.notifications (user_id, type, source_id, message, created_at)
    VALUES (
        NEW.mentioned_user_id, 
        'mention', 
        NEW.source_id, 
        'You were mentioned in a ' || NEW.source_type || '.', 
        now()
    );
    
    -- In the future, this is where we would trigger a webhook to a Push Notification service (like Firebase Cloud Messaging/OneSignal) 
    -- using HTTP extensions or a Supabase Edge Function to deliver the actual Push Notification to the user's mobile device.
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to fire on new mention
DROP TRIGGER IF EXISTS on_mention_created ON public.mentions;
DROP TRIGGER IF EXISTS on_mention_created ON mentions;
CREATE TRIGGER on_mention_created
    AFTER INSERT ON public.mentions
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_mention();


