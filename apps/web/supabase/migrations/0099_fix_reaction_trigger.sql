-- Migration: 0099_fix_broken_triggers.sql
-- Description: Fixes TWO broken triggers that called the undefined function
--              trigger_push_notification(), causing all INSERTs into reactions
--              and bounty_applications to return 400 Bad Request.
--              Both triggers are replaced with safe versions using EXCEPTION handlers.

-- ─── Fix 1: Reactions trigger ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION notify_author_on_reaction()
RETURNS trigger AS $$
DECLARE
    v_author_id UUID;
BEGIN
    BEGIN
        SELECT author_id INTO v_author_id
        FROM public.updates
        WHERE id = NEW.update_id;

        IF v_author_id IS NOT NULL AND v_author_id != NEW.observer_id THEN
            INSERT INTO public.notifications (user_id, actor_id, type, metadata)
            VALUES (
                v_author_id,
                NEW.observer_id,
                'reaction',
                jsonb_build_object(
                    'type',       'reaction',
                    'update_id',  NEW.update_id,
                    'emoji',      NEW.text,
                    'actor_name', NEW.observer_name
                )
            );
        END IF;

    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING '[reaction_trigger] Failed for update %: %', NEW.update_id, SQLERRM;
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_reaction_created ON public.reactions;
CREATE TRIGGER on_reaction_created
    AFTER INSERT ON public.reactions
    FOR EACH ROW
    EXECUTE FUNCTION notify_author_on_reaction();


-- ─── Fix 2: Bounty applications trigger ──────────────────────────────────────

CREATE OR REPLACE FUNCTION notify_observer_on_pitch()
RETURNS trigger AS $$
DECLARE
    v_observer_id UUID;
    v_builder_name TEXT;
    v_update_content TEXT;
BEGIN
    BEGIN
        IF NEW.status = 'pending' THEN
            SELECT author_id, content INTO v_observer_id, v_update_content
            FROM public.updates
            WHERE id = NEW.update_id;

            SELECT name INTO v_builder_name
            FROM public.users
            WHERE id = NEW.builder_id;

            IF v_observer_id IS NOT NULL THEN
                INSERT INTO public.notifications (user_id, actor_id, type, metadata)
                VALUES (
                    v_observer_id,
                    NEW.builder_id,
                    'bounty_pitch',
                    jsonb_build_object(
                        'type',         'bounty_pitch',
                        'update_id',    NEW.update_id,
                        'builder_name', v_builder_name,
                        'pitch_text',   substring(NEW.pitch_text from 1 for 60)
                    )
                );
            END IF;
        END IF;

    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING '[pitch_trigger] Failed for update %: %', NEW.update_id, SQLERRM;
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_bounty_pitch_created ON public.bounty_applications;
CREATE TRIGGER on_bounty_pitch_created
    AFTER INSERT ON public.bounty_applications
    FOR EACH ROW
    EXECUTE FUNCTION notify_observer_on_pitch();
