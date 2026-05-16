-- ─────────────────────────────────────────────
--  Enums
-- ─────────────────────────────────────────────
CREATE TYPE room_status AS ENUM ('LOBBY', 'PLAYING', 'FINISHED');

-- ─────────────────────────────────────────────
--  Game Rooms
-- ─────────────────────────────────────────────
CREATE TABLE game_rooms (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id          TEXT NOT NULL,          -- ephemeral UUID from localStorage
  status           room_status NOT NULL DEFAULT 'LOBBY',
  total_rounds     INTEGER NOT NULL CHECK (total_rounds BETWEEN 1 AND 20),
  current_round    INTEGER NOT NULL DEFAULT 0,
  round_started_at TIMESTAMPTZ,           -- set on each round start → time-bonus calc
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
--  Players
-- ─────────────────────────────────────────────
CREATE TABLE players (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id   UUID REFERENCES game_rooms(id) ON DELETE CASCADE,
  name      TEXT NOT NULL,
  score     INTEGER NOT NULL DEFAULT 0,
  is_kicked BOOLEAN NOT NULL DEFAULT FALSE  -- soft-kick; player can rejoin as new record
);

-- ─────────────────────────────────────────────
--  Puzzles (pre-seeded content library)
-- ─────────────────────────────────────────────
CREATE TABLE puzzles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url    TEXT NOT NULL,             -- Cloudinary delivery URL
  answer       TEXT NOT NULL,             -- normalized: lowercase, trimmed, no punctuation
  points_value INTEGER NOT NULL DEFAULT 100,
  times_used   INTEGER NOT NULL DEFAULT 0  -- shuffle-bag counter
);

-- ─────────────────────────────────────────────
--  Room → Puzzle Assignment (set at game start)
-- ─────────────────────────────────────────────
CREATE TABLE room_puzzles (
  room_id      UUID REFERENCES game_rooms(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  puzzle_id    UUID REFERENCES puzzles(id),
  PRIMARY KEY (room_id, round_number)
);

-- ─────────────────────────────────────────────
--  Realtime subscriptions
-- ─────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE game_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
