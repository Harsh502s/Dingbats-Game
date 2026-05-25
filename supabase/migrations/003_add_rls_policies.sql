-- Enable RLS on tables (if not already enabled)
ALTER TABLE puzzles ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_puzzles ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read puzzles (needed for game display)
CREATE POLICY "Allow public read on puzzles" ON puzzles
  FOR SELECT USING (true);

-- Allow anyone to read room_puzzles (needed to fetch current puzzle)
CREATE POLICY "Allow public read on room_puzzles" ON room_puzzles
  FOR SELECT USING (true);

-- Allow anyone to read game_rooms (needed for game state)
CREATE POLICY "Allow public read on game_rooms" ON game_rooms
  FOR SELECT USING (true);

-- Allow anyone to read players (needed for leaderboard)
CREATE POLICY "Allow public read on players" ON players
  FOR SELECT USING (true);

-- Allow authenticated users to insert/update players (join game, update score)
CREATE POLICY "Allow authenticated insert on players" ON players
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated update on players" ON players
  FOR UPDATE USING (true) WITH CHECK (true);

-- Allow authenticated users to insert room_puzzles (admin only, but we use admin client)
CREATE POLICY "Allow authenticated insert on room_puzzles" ON room_puzzles
  FOR INSERT WITH CHECK (true);

-- Allow authenticated users to update game_rooms (admin only, but we use admin client)
CREATE POLICY "Allow authenticated update on game_rooms" ON game_rooms
  FOR UPDATE USING (true) WITH CHECK (true);

-- Allow authenticated users to insert puzzles (admin only, but we use admin client)
CREATE POLICY "Allow authenticated insert on puzzles" ON puzzles
  FOR INSERT WITH CHECK (true);

-- Allow authenticated users to upsert puzzles (admin only, but we use admin client)
CREATE POLICY "Allow authenticated upsert on puzzles" ON puzzles
  FOR UPDATE USING (true) WITH CHECK (true);
