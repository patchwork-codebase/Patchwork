-- Migration: 0090_add_media_urls_to_updates.sql
-- Description: Support multiple image attachments on updates via media_urls array,
-- with automatic synchronization and backwards compatibility for media_url.

-- 1. Add media_urls text array column to updates
ALTER TABLE public.updates 
ADD COLUMN IF NOT EXISTS media_urls TEXT[] DEFAULT '{}';

-- 2. Backfill existing media_url entries into media_urls
UPDATE public.updates 
SET media_urls = ARRAY[media_url]
WHERE media_url IS NOT NULL 

  AND (media_urls IS NULL OR array_length(media_urls, 1) = 0 OR media_urls = '{}');

-- 3. Trigger to keep media_url and media_urls synchronized
CREATE OR REPLACE FUNCTION public.sync_update_media_urls()
RETURNS TRIGGER AS $$
BEGIN
    -- If media_urls is provided but media_url is empty, set media_url to first item
    IF NEW.media_urls IS NOT NULL AND array_length(NEW.media_urls, 1) > 0 THEN
        IF NEW.media_url IS NULL OR NEW.media_url = '' THEN
            NEW.media_url = NEW.media_urls[1];
        END IF;
    -- If media_url is provided but media_urls is empty, wrap media_url in array
    ELSIF NEW.media_url IS NOT NULL AND NEW.media_url <> '' THEN
        IF NEW.media_urls IS NULL OR array_length(NEW.media_urls, 1) IS NULL OR array_length(NEW.media_urls, 1) = 0 THEN
            NEW.media_urls = ARRAY[NEW.media_url];
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_update_media_urls ON public.updates;
CREATE TRIGGER trg_sync_update_media_urls
BEFORE INSERT OR UPDATE ON public.updates
FOR EACH ROW
EXECUTE FUNCTION public.sync_update_media_urls();
