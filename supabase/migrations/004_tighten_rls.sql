-- Tighten RLS policies to defense-in-depth
-- Service role key is already server-side, but RLS should not allow all writes

-- game_rooms: only service role can write
ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "game_rooms_all" ON game_rooms;
CREATE POLICY "game_rooms_read_all" ON game_rooms FOR SELECT USING (true);
CREATE POLICY "game_rooms_write_service_role" ON game_rooms FOR INSERT WITH CHECK (false);
CREATE POLICY "game_rooms_update_service_role" ON game_rooms FOR UPDATE WITH CHECK (false);
CREATE POLICY "game_rooms_delete_service_role" ON game_rooms FOR DELETE USING (false);

-- players: anon can insert (join), service role can update/delete
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "players_all" ON players;
CREATE POLICY "players_read_all" ON players FOR SELECT USING (true);
CREATE POLICY "players_insert_anon" ON players FOR INSERT WITH CHECK (true);
CREATE POLICY "players_update_service_role" ON players FOR UPDATE WITH CHECK (false);
CREATE POLICY "players_delete_service_role" ON players FOR DELETE USING (false);

-- puzzles: only service role can write
ALTER TABLE puzzles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "puzzles_all" ON puzzles;
CREATE POLICY "puzzles_read_all" ON puzzles FOR SELECT USING (true);
CREATE POLICY "puzzles_write_service_role" ON puzzles FOR INSERT WITH CHECK (false);
CREATE POLICY "puzzles_update_service_role" ON puzzles FOR UPDATE WITH CHECK (false);
CREATE POLICY "puzzles_delete_service_role" ON puzzles FOR DELETE USING (false);

-- room_puzzles: only service role can write
ALTER TABLE room_puzzles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "room_puzzles_all" ON room_puzzles;
CREATE POLICY "room_puzzles_read_all" ON room_puzzles FOR SELECT USING (true);
CREATE POLICY "room_puzzles_write_service_role" ON room_puzzles FOR INSERT WITH CHECK (false);
CREATE POLICY "room_puzzles_update_service_role" ON room_puzzles FOR UPDATE WITH CHECK (false);
CREATE POLICY "room_puzzles_delete_service_role" ON room_puzzles FOR DELETE USING (false);
