-- Migration: 0016_top_observers_rpc.sql
-- Description: RPC function to calculate top observers for a builder

CREATE OR REPLACE FUNCTION get_top_observers(p_builder_id uuid)
RETURNS TABLE (
  observer_id uuid,
  name text,
  role text,
  city text,
  domain text,
  avatar text,
  rooms_followed bigint,
  reactions_made bigint,
  score bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH builder_rooms AS (
    SELECT id FROM public.rooms WHERE builder_id = p_builder_id
  ),
  observer_rooms AS (
    SELECT ro.observer_id, COUNT(ro.room_id) as rooms_followed
    FROM public.room_observers ro
    JOIN builder_rooms br ON ro.room_id = br.id
    GROUP BY ro.observer_id
  ),
  observer_reactions AS (
    SELECT r.observer_id, COUNT(r.id) as reactions_made
    FROM public.reactions r
    JOIN builder_rooms br ON r.room_id = br.id
    GROUP BY r.observer_id
  )
  SELECT 
    p.id as observer_id,
    p.name,
    p.role,
    p.city,
    p.domain,
    p.avatar,
    COALESCE(or_rooms.rooms_followed, 0) as rooms_followed,
    COALESCE(or_reactions.reactions_made, 0) as reactions_made,
    (COALESCE(or_rooms.rooms_followed, 0) * 5 + COALESCE(or_reactions.reactions_made, 0)) as score
  FROM public.profiles p
  LEFT JOIN observer_rooms or_rooms ON p.id = or_rooms.observer_id
  LEFT JOIN observer_reactions or_reactions ON p.id = or_reactions.observer_id
  WHERE (or_rooms.rooms_followed > 0 OR or_reactions.reactions_made > 0)
  ORDER BY score DESC
  LIMIT 10;
END;
$$;
