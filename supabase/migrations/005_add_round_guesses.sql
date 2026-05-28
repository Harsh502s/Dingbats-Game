-- Add per-round guess deduplication table
CREATE TABLE player_round_guesses (
  room_id UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  round_number INT NOT NULL,
  PRIMARY KEY (room_id, player_id, round_number)
);

-- Enable RLS
ALTER TABLE player_round_guesses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "player_round_guesses_read_all" ON player_round_guesses FOR SELECT USING (true);
CREATE POLICY "player_round_guesses_write_service_role" ON player_round_guesses FOR INSERT WITH CHECK (false);
CREATE POLICY "player_round_guesses_delete_service_role" ON player_round_guesses FOR DELETE USING (false);
