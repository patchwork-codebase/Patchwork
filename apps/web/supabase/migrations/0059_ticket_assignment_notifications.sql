-- Migration: 0059_ticket_assignment_notifications.sql
-- Description: Triggers for ticket assignment, auto-invitation for non-room members, ticket updates, and comment notifications.

-- 1. Function and trigger on ticket assignment (roadmap_assignees insert)
CREATE OR REPLACE FUNCTION handle_ticket_assignment()
RETURNS TRIGGER AS $$
DECLARE
    v_item RECORD;
    v_room_title TEXT;
    v_assigner_name TEXT;
    v_is_member BOOLEAN := FALSE;
    v_assignee_email TEXT;
BEGIN
    -- Get item & room details
    SELECT ri.title, ri.room_id, ri.builder_id, r.title AS room_title
    INTO v_item
    FROM public.roadmap_items ri
    LEFT JOIN public.rooms r ON r.id = ri.room_id
    WHERE ri.id = NEW.item_id;

    -- Check if assignee is the room owner or an accepted room observer/team member
    IF v_item.builder_id = NEW.user_id THEN
        v_is_member := TRUE;
    ELSE
        SELECT EXISTS (
            SELECT 1 FROM public.room_observers
            WHERE room_id = v_item.room_id AND observer_id = NEW.user_id
        ) INTO v_is_member;
    END IF;

    -- Get assignee email for invitations
    SELECT email INTO v_assignee_email FROM public.users WHERE id = NEW.user_id;

    -- If NOT a room member, automatically create a pending room invitation
    IF NOT v_is_member AND v_assignee_email IS NOT NULL AND v_item.room_id IS NOT NULL THEN
        BEGIN
            INSERT INTO public.room_invitations (room_id, inviter_id, email, role, status)
            VALUES (v_item.room_id, auth.uid(), lower(trim(v_assignee_email)), 'team_member', 'pending')
            ON CONFLICT (room_id, email) WHERE status = 'pending' DO NOTHING;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Auto-invite insertion exception: %', SQLERRM;
        END;
    END IF;

    -- Insert in-app notification for the assignee
    BEGIN
        INSERT INTO public.notifications (user_id, actor_id, type, reference_id, metadata)
        VALUES (
            NEW.user_id,
            COALESCE(auth.uid(), v_item.builder_id),
            CASE WHEN v_is_member THEN 'ticket_assigned' ELSE 'ticket_assigned_invite' END,
            NEW.item_id,
            jsonb_build_object(
                'item_id', NEW.item_id,
                'ticket_title', v_item.title,
                'room_id', v_item.room_id,
                'room_title', COALESCE(v_item.room_title, 'Build Room'),
                'is_room_member', v_is_member
            )
        );
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Failed to insert ticket assignment notification: %', SQLERRM;
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_ticket_assigned ON public.roadmap_assignees;
CREATE TRIGGER on_ticket_assigned
    AFTER INSERT ON public.roadmap_assignees
    FOR EACH ROW
    EXECUTE FUNCTION handle_ticket_assignment();


-- 2. Function and trigger on ticket updates (roadmap_items update)
CREATE OR REPLACE FUNCTION handle_ticket_updated()
RETURNS TRIGGER AS $$
DECLARE
    v_assignee RECORD;
    v_room_title TEXT;
BEGIN
    -- Only trigger if significant fields changed (title, status, priority, description)
    IF OLD.title IS DISTINCT FROM NEW.title 
       OR OLD.status IS DISTINCT FROM NEW.status 
       OR OLD.priority IS DISTINCT FROM NEW.priority 
       OR OLD.description IS DISTINCT FROM NEW.description THEN
       
        SELECT title INTO v_room_title FROM public.rooms WHERE id = NEW.room_id;

        -- Notify all assignees except the updater
        FOR v_assignee IN (
            SELECT user_id FROM public.roadmap_assignees 
            WHERE item_id = NEW.id AND user_id != COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
        )
        LOOP
            BEGIN
                INSERT INTO public.notifications (user_id, actor_id, type, reference_id, metadata)
                VALUES (
                    v_assignee.user_id,
                    COALESCE(auth.uid(), NEW.builder_id),
                    'ticket_updated',
                    NEW.id,
                    jsonb_build_object(
                        'item_id', NEW.id,
                        'ticket_title', NEW.title,
                        'room_id', NEW.room_id,
                        'room_title', COALESCE(v_room_title, 'Build Room'),
                        'status', NEW.status,
                        'priority', NEW.priority
                    )
                );
            EXCEPTION WHEN OTHERS THEN
                RAISE WARNING 'Failed to insert ticket update notification: %', SQLERRM;
            END;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_ticket_updated ON public.roadmap_items;
CREATE TRIGGER on_ticket_updated
    AFTER UPDATE ON public.roadmap_items
    FOR EACH ROW
    EXECUTE FUNCTION handle_ticket_updated();


-- 3. Function and trigger on ticket comments (roadmap_comments insert)
CREATE OR REPLACE FUNCTION handle_ticket_comment()
RETURNS TRIGGER AS $$
DECLARE
    v_item RECORD;
    v_room_title TEXT;
    v_assignee RECORD;
BEGIN
    SELECT ri.title, ri.room_id, ri.builder_id, r.title AS room_title
    INTO v_item
    FROM public.roadmap_items ri
    LEFT JOIN public.rooms r ON r.id = ri.room_id
    WHERE ri.id = NEW.item_id;

    -- Notify item owner if commenter is not the owner
    IF v_item.builder_id IS NOT NULL AND v_item.builder_id != NEW.user_id THEN
        BEGIN
            INSERT INTO public.notifications (user_id, actor_id, type, reference_id, metadata)
            VALUES (
                v_item.builder_id,
                NEW.user_id,
                'ticket_comment',
                NEW.item_id,
                jsonb_build_object(
                    'item_id', NEW.item_id,
                    'ticket_title', v_item.title,
                    'room_id', v_item.room_id,
                    'room_title', COALESCE(v_item.room_title, 'Build Room'),
                    'comment_text', substring(NEW.content from 1 for 100)
                )
            );
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Failed to insert ticket comment notification for builder: %', SQLERRM;
        END;
    END IF;

    -- Notify all assignees except commenter & owner (already notified)
    FOR v_assignee IN (
        SELECT user_id FROM public.roadmap_assignees 
        WHERE item_id = NEW.item_id 
        AND user_id != NEW.user_id 
        AND user_id != COALESCE(v_item.builder_id, '00000000-0000-0000-0000-000000000000'::uuid)
    )
    LOOP
        BEGIN
            INSERT INTO public.notifications (user_id, actor_id, type, reference_id, metadata)
            VALUES (
                v_assignee.user_id,
                NEW.user_id,
                'ticket_comment',
                NEW.item_id,
                jsonb_build_object(
                    'item_id', NEW.item_id,
                    'ticket_title', v_item.title,
                    'room_id', v_item.room_id,
                    'room_title', COALESCE(v_item.room_title, 'Build Room'),
                    'comment_text', substring(NEW.content from 1 for 100)
                )
            );
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Failed to insert ticket comment notification for assignee: %', SQLERRM;
        END;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_ticket_comment ON public.roadmap_comments;
CREATE TRIGGER on_ticket_comment
    AFTER INSERT ON public.roadmap_comments
    FOR EACH ROW
    EXECUTE FUNCTION handle_ticket_comment();


-- 4. Ensure RLS allows authenticated users to insert notifications and drop legacy type checks
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated users can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

