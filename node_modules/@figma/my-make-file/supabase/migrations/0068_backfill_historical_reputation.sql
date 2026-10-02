-- 0068_backfill_historical_reputation.sql

DO $$
DECLARE
    rec RECORD;
    v_badge_id UUID;
BEGIN
    -- 1. Reset all existing reputation and clean up system-generated events/badges
    UPDATE public.users SET reputation = 0;
    
    -- Delete all reputation events
    DELETE FROM public.reputation_events;
    
    -- Delete automated user_badges (levels and achievements) but preserve 'recognition' badges
    DELETE FROM public.user_badges 
    WHERE badge_id IN (
        SELECT id FROM public.badges 
        WHERE badge_type IN ('level', 'achievement')
    );

    -- 2. Backfill Rooms (Created & Shipped)
    FOR rec IN SELECT id, builder_id, title, status, created_at FROM public.rooms LOOP
        IF rec.builder_id IS NOT NULL THEN
            -- Room Created (+50)
            INSERT INTO public.reputation_events (user_id, room_id, action_type, points, metadata, created_at)
            VALUES (rec.builder_id, rec.id, 'room_created', 50, jsonb_build_object('room_title', rec.title), rec.created_at);

            -- Room Shipped (+500)
            IF rec.status IN ('shipped', 'completed') THEN
                INSERT INTO public.reputation_events (user_id, room_id, action_type, points, metadata, created_at)
                VALUES (rec.builder_id, rec.id, 'product_shipped', 500, jsonb_build_object('room_title', rec.title), rec.created_at);
                
                -- Grant Shipped! Badge
                SELECT id INTO v_badge_id FROM public.badges WHERE title = 'Shipped!' AND badge_type = 'achievement';
                IF v_badge_id IS NOT NULL THEN
                    INSERT INTO public.user_badges (user_id, badge_id, verified, issued_at)
                    VALUES (rec.builder_id, v_badge_id, true, rec.created_at) ON CONFLICT DO NOTHING;
                END IF;
            END IF;
        END IF;
    END LOOP;

    -- 3. Backfill Updates (+10)
    FOR rec IN SELECT id, room_id, author_id, created_at FROM public.updates WHERE author_id IS NOT NULL LOOP
        INSERT INTO public.reputation_events (user_id, room_id, action_type, points, metadata, created_at)
        VALUES (rec.author_id, rec.room_id, 'update_posted', 10, jsonb_build_object('update_id', rec.id), rec.created_at);
    END LOOP;

    -- 4. Backfill Decisions (+15)
    FOR rec IN SELECT id, room_id, builder_id, type, created_at FROM public.room_decisions WHERE builder_id IS NOT NULL LOOP
        INSERT INTO public.reputation_events (user_id, room_id, action_type, points, metadata, created_at)
        VALUES (rec.builder_id, rec.room_id, 'decision_documented', 15, jsonb_build_object('decision_id', rec.id, 'type', rec.type), rec.created_at);
    END LOOP;

    -- 5. Backfill Discovery Completed (+100)
    FOR rec IN SELECT id, builder_id, title, created_at FROM public.discovery_projects WHERE status = 'converted' AND builder_id IS NOT NULL LOOP
        INSERT INTO public.reputation_events (user_id, action_type, points, metadata, created_at)
        VALUES (rec.builder_id, 'discovery_completed', 100, jsonb_build_object('project_id', rec.id, 'title', rec.title), rec.created_at);
    END LOOP;

    -- 6. Backfill Expert Reviews (+75 for builder, +25 for expert)
    FOR rec IN SELECT id, room_id, builder_id, expert_id, created_at FROM public.expert_reviews LOOP
        IF rec.builder_id IS NOT NULL THEN
            INSERT INTO public.reputation_events (user_id, room_id, action_type, points, metadata, created_at)
            VALUES (rec.builder_id, rec.room_id, 'expert_review_received', 75, jsonb_build_object('review_id', rec.id, 'expert_id', rec.expert_id), rec.created_at);
        END IF;
        IF rec.expert_id IS NOT NULL THEN
            INSERT INTO public.reputation_events (user_id, room_id, action_type, points, metadata, created_at)
            VALUES (rec.expert_id, rec.room_id, 'expert_review_given', 25, jsonb_build_object('review_id', rec.id, 'builder_id', rec.builder_id), rec.created_at);
        END IF;
    END LOOP;

    -- 7. Backfill Reactions (+5) - Check observer_id != builder_id
    FOR rec IN 
        SELECT r.id, r.room_id, r.observer_id, r.type, r.created_at, rm.builder_id 
        FROM public.reactions r
        JOIN public.rooms rm ON rm.id = r.room_id 
        WHERE r.observer_id IS NOT NULL
    LOOP
        IF rec.observer_id != rec.builder_id THEN
            INSERT INTO public.reputation_events (user_id, room_id, action_type, points, metadata, created_at)
            VALUES (rec.observer_id, rec.room_id, 'community_support', 5, jsonb_build_object('reaction_id', rec.id, 'type', rec.type), rec.created_at);
        END IF;
    END LOOP;

    -- 8. Backfill First Room Achievement
    SELECT id INTO v_badge_id FROM public.badges WHERE title = 'First Room' AND badge_type = 'achievement';
    IF v_badge_id IS NOT NULL THEN
        FOR rec IN SELECT builder_id, min(created_at) as first_room_date FROM public.rooms WHERE builder_id IS NOT NULL GROUP BY builder_id LOOP
            INSERT INTO public.user_badges (user_id, badge_id, verified, issued_at)
            VALUES (rec.builder_id, v_badge_id, true, rec.first_room_date) ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    -- 9. Backfill Decision Architect Achievement
    SELECT id INTO v_badge_id FROM public.badges WHERE title = 'Decision Architect' AND badge_type = 'achievement';
    IF v_badge_id IS NOT NULL THEN
        FOR rec IN SELECT builder_id, max(created_at) as ach_date FROM public.room_decisions WHERE builder_id IS NOT NULL GROUP BY builder_id HAVING count(*) >= 100 LOOP
            INSERT INTO public.user_badges (user_id, badge_id, verified, issued_at)
            VALUES (rec.builder_id, v_badge_id, true, rec.ach_date) ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    -- (Note: As rows are inserted into reputation_events, the `on_reputation_event` trigger will
    -- automatically sum up the points and update `users.reputation`. As `users.reputation` updates,
    -- the `on_user_reputation_increase` trigger will evaluate and grant any applicable Level badges).

END $$;
