-- Migration to create an RPC for fetching popular room tags dynamically

CREATE OR REPLACE FUNCTION get_popular_tags(limit_val INT DEFAULT 5)
RETURNS TABLE (tag TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT unnest(tags) AS tag, COUNT(*) AS count
  FROM rooms
  WHERE status = 'active'
  GROUP BY tag
  ORDER BY count DESC
  LIMIT limit_val;
END;
$$ LANGUAGE plpgsql;
