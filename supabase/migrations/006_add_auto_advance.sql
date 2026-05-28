-- Enable pg_cron extension (must be enabled in Supabase dashboard first)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create function to auto-advance rounds
CREATE OR REPLACE FUNCTION auto_advance_rounds()
RETURNS void AS $$
DECLARE
  room_rec RECORD;
BEGIN
  -- Find all rooms that are PLAYING and have exceeded their round duration
  FOR room_rec IN
    SELECT id, current_round, total_rounds, round_started_at, round_duration
    FROM game_rooms
    WHERE status = 'PLAYING'
      AND round_started_at IS NOT NULL
      AND NOW() > round_started_at + (round_duration || ' seconds')::INTERVAL
  LOOP
    -- Check if this is the last round
    IF room_rec.current_round >= room_rec.total_rounds THEN
      -- Mark game as finished
      UPDATE game_rooms
      SET status = 'FINISHED'
      WHERE id = room_rec.id;
    ELSE
      -- Advance to next round
      UPDATE game_rooms
      SET current_round = current_round + 1,
          round_started_at = NOW()
      WHERE id = room_rec.id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Schedule the function to run every minute
-- Note: pg_cron must be enabled first via Supabase dashboard
-- SELECT cron.schedule('advance-rounds', '* * * * *', 'SELECT auto_advance_rounds()');
