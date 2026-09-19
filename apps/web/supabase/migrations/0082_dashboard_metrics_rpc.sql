-- Migration: 0082_dashboard_metrics_rpc.sql
-- Description: Creates an RPC to fetch all dashboard metrics for a specific workspace in one call.

CREATE OR REPLACE FUNCTION public.get_workspace_metrics(p_workspace_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reactions JSONB;
  v_top_observers JSONB;
  v_linked_docs JSONB;
BEGIN
  -- 1. Get Reaction Metrics
  SELECT jsonb_build_object(
    'sharp_count', COALESCE(SUM(CASE WHEN type = 'sharp' THEN 1 ELSE 0 END), 0),
    'tell_me_more_count', COALESCE(SUM(CASE WHEN type = 'tell_me_more' THEN 1 ELSE 0 END), 0),
    'pushback_count', COALESCE(SUM(CASE WHEN type = 'pushback' THEN 1 ELSE 0 END), 0),
    'updates_count', COUNT(DISTINCT update_id)
  ) INTO v_reactions
  FROM public.reactions
  WHERE room_id = p_workspace_id;

  -- 2. Get Top Observers (Top 5)
  SELECT COALESCE(jsonb_agg(obs), '[]'::jsonb) INTO v_top_observers
  FROM (
    SELECT 
      u.id, 
      u.name, 
      u.avatar, 
      u.is_verified_expert, 
      COUNT(r.id) as interaction_count
    FROM public.reactions r
    JOIN public.users u ON r.observer_id = u.id
    WHERE r.room_id = p_workspace_id
    GROUP BY u.id
    ORDER BY interaction_count DESC
    LIMIT 5
  ) obs;

  -- 3. Get Linked Docs
  SELECT COALESCE(jsonb_agg(docs), '[]'::jsonb) INTO v_linked_docs
  FROM (
    SELECT 
      d.id, 
      d.title, 
      d.url, 
      d.created_at
    FROM public.room_notion_docs d
    WHERE d.room_id = p_workspace_id
    ORDER BY d.created_at DESC
    LIMIT 10
  ) docs;

  -- Return combined result
  RETURN jsonb_build_object(
    'reactions', v_reactions,
    'top_observers', v_top_observers,
    'linked_docs', v_linked_docs
  );
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_workspace_metrics(TEXT) TO authenticated;
