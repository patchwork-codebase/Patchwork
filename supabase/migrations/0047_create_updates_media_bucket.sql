-- Migration: 0047_create_updates_media_bucket.sql
-- Description: Create the updates_media bucket for room decisions and updates

INSERT INTO storage.buckets (id, name, public)
VALUES ('updates_media', 'updates_media', true)
ON CONFLICT (id) DO NOTHING;

-- Set up policies for updates_media bucket if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Public Access for updates_media'
    ) THEN
        CREATE POLICY "Public Access for updates_media"
        ON storage.objects FOR SELECT
        USING ( bucket_id = 'updates_media' );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Authenticated users can upload to updates_media'
    ) THEN
        CREATE POLICY "Authenticated users can upload to updates_media"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK ( bucket_id = 'updates_media' );
    END IF;
END $$;
