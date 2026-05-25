-- Add pack_name column to puzzles table for library organization
ALTER TABLE puzzles ADD COLUMN pack_name TEXT;

-- Add room_puzzles to realtime publication so image updates sync
ALTER PUBLICATION supabase_realtime ADD TABLE room_puzzles;
