-- Migration: Reputation System Triggers

-- 1. Function and Trigger for New Updates
CREATE OR REPLACE FUNCTION increment_reputation_on_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.update_type = 'scrap' THEN
    UPDATE profiles SET reputation = reputation + 10 WHERE id = NEW.author_id;
  ELSE
    UPDATE profiles SET reputation = reputation + 5 WHERE id = NEW.author_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_reputation_on_update ON updates;
CREATE TRIGGER trigger_reputation_on_update
AFTER INSERT ON updates
FOR EACH ROW EXECUTE FUNCTION increment_reputation_on_update();

-- 2. Function and Trigger for New Reactions
CREATE OR REPLACE FUNCTION increment_reputation_on_reaction()
RETURNS TRIGGER AS $$
DECLARE
  builder_uuid uuid;
BEGIN
  -- Give 1 point to the observer who reacted
  IF NEW.observer_id IS NOT NULL THEN
    UPDATE profiles SET reputation = reputation + 1 WHERE id = NEW.observer_id;
  END IF;
  
  -- Give 3 points to the room's builder
  SELECT builder_id INTO builder_uuid FROM rooms WHERE id = NEW.room_id;
  IF builder_uuid IS NOT NULL THEN
    UPDATE profiles SET reputation = reputation + 3 WHERE id = builder_uuid;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_reputation_on_reaction ON reactions;
CREATE TRIGGER trigger_reputation_on_reaction
AFTER INSERT ON reactions
FOR EACH ROW EXECUTE FUNCTION increment_reputation_on_reaction();

-- 3. Function and Trigger for New Observers Joining Rooms
CREATE OR REPLACE FUNCTION increment_reputation_on_observer()
RETURNS TRIGGER AS $$
DECLARE
  builder_uuid uuid;
BEGIN
  SELECT builder_id INTO builder_uuid FROM rooms WHERE id = NEW.room_id;
  IF builder_uuid IS NOT NULL THEN
    UPDATE profiles SET reputation = reputation + 2 WHERE id = builder_uuid;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_reputation_on_observer ON room_observers;
CREATE TRIGGER trigger_reputation_on_observer
AFTER INSERT ON room_observers
FOR EACH ROW EXECUTE FUNCTION increment_reputation_on_observer();
