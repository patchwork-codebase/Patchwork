-- 0097_real_funnel_metrics.sql

CREATE OR REPLACE FUNCTION public.get_workspace_metrics(p_workspace_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_reactions INT;
  v_sharp_insights INT;
  v_profile_views INT;
  v_update_reads INT;
  v_top_observers JSONB;
  v_linked_docs JSONB;
BEGIN

  -- 1. Total Reactions & Sharp Insights
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE type = 'sharp')
  INTO v_total_reactions, v_sharp_insights
  FROM reactions r
  JOIN updates u ON r.update_id = u.id
  WHERE u.room_id = p_workspace_id;

  -- 2. Real Workspace Views (Room Views)
  SELECT COUNT(*)
  INTO v_profile_views
  FROM public.page_views
  WHERE target_type = 'room' AND target_id = p_workspace_id;

  -- 3. Real Update Reads (for this room)
  SELECT COUNT(*)
  INTO v_update_reads
  FROM public.page_views
  WHERE target_type = 'update' AND target_id IN (
    SELECT id FROM public.updates WHERE room_id = p_workspace_id
  );

  -- 4. Top Observers (High Signal)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'name', o.name,
      'avatar', o.avatar,
      'role', o.role,
      'domain', o.domain,
      'interaction_count', interactions.cnt
    )
  ), '[]'::jsonb) INTO v_top_observers
  FROM (
    SELECT observer_id, COUNT(*) as cnt
    FROM reactions r
    JOIN updates u ON r.update_id = u.id
    WHERE u.room_id = p_workspace_id
    GROUP BY observer_id
    ORDER BY cnt DESC
    LIMIT 3
  ) interactions
  JOIN users o ON interactions.observer_id = o.id
  WHERE o.is_verified_expert = true;

  -- 5. Linked Docs (Updates with media or links in this room)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', u.id,
      'content', u.content,
      'created_at', u.created_at
    )
  ), '[]'::jsonb) INTO v_linked_docs
  FROM updates u
  WHERE u.room_id = p_workspace_id
    AND (u.media_url IS NOT NULL OR u.content ILIKE '%http%')
  ORDER BY u.created_at DESC
  LIMIT 5;

  RETURN jsonb_build_object(
    'reactions_count', COALESCE(v_total_reactions, 0),
    'sharp_insights', COALESCE(v_sharp_insights, 0),
    'profile_views', COALESCE(v_profile_views, 0),
    'update_reads', COALESCE(v_update_reads, 0),
    'top_observers', v_top_observers,
    'linked_docs', v_linked_docs
  );
END;
$$;


-- Fix missing MIME types (video/mp4) in updates_media bucket
UPDATE storage.buckets 
SET allowed_mime_types = NULL
WHERE id = 'updates_media';
