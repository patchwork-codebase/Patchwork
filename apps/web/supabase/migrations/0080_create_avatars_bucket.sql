-- Migration: 0080_create_avatars_bucket.sql
-- Description: Create the avatars bucket for user profile pictures

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Set up policies for avatars bucket if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Public Access for avatars'
    ) THEN
        CREATE POLICY "Public Access for avatars"
        ON storage.objects FOR SELECT
        USING ( bucket_id = 'avatars' );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Authenticated users can upload avatars'
    ) THEN
        CREATE POLICY "Authenticated users can upload avatars"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK ( bucket_id = 'avatars' );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Users can update their own avatars'
    ) THEN
        CREATE POLICY "Users can update their own avatars"
        ON storage.objects FOR UPDATE
        TO authenticated
        USING ( bucket_id = 'avatars' );
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Users can delete their own avatars'
    ) THEN
        CREATE POLICY "Users can delete their own avatars"
        ON storage.objects FOR DELETE
        TO authenticated
        USING ( bucket_id = 'avatars' );
    END IF;
END $$;
