# Dingbats Multiplayer Game — Implementation Plan (v3 — FINAL)

Real-time multiplayer party game. Host reveals picture puzzles; players race to guess correctly and earn time-bonus points. All decisions locked. Ready to build.

---

## ✅ All Decisions Locked

| Decision | Locked Choice |
|---|---|
| Frontend | Next.js App Router + Tailwind CSS |
| Backend | Next.js Serverless Route Handlers |
| Real-time | **Supabase Realtime** (free tier) |
| Database | **Supabase PostgreSQL** (free tier) |
| Image hosting | **Cloudinary** (free tier) |
| Auth | **Anonymous** — UUID in `localStorage`, no accounts |
| Puzzle editor | **None** — seed script only |
| Hosting | **Vercel** (free tier) |
| Rounds per game | Host sets at room creation (1–20) |
| Round timer | **30 seconds**, hardcoded constant |
| Scoring | `earned = base + floor(base × remaining_secs / 30)` |
| Kicked players | Can rejoin as a **fresh session** (new player record, score starts at 0) |
| Puzzle assignment | **Shuffle-bag**: always pick least-used puzzles first; all puzzles rotate before any repeats |

---

## No More Open Questions

Everything is locked. Awaiting your approval to start execution.

---

## Proposed Changes

### Phase 0 — Project Scaffold

#### [NEW] Next.js init + dependencies
```bash
npx create-next-app@latest ./ --typescript --tailwind --app --no-src-dir --import-alias "@/*"
npm install @supabase/supabase-js @supabase/ssr framer-motion zod uuid
npm install -D @types/uuid
```

---

### Phase 1 — Database & Schema

#### [NEW] `supabase/migrations/001_init.sql`

```sql
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
```

#### Shuffle-Bag Logic (used in `start` route)
```
1. SELECT all puzzles ORDER BY times_used ASC, RANDOM() LIMIT total_rounds
2. INSERT selected rows into room_puzzles (round_number = 1..N)
3. UPDATE puzzles SET times_used = times_used + 1 WHERE id IN (selected IDs)
```
This guarantees every puzzle is shown before any puzzle repeats.
Edge case: if `COUNT(puzzles) < total_rounds`, the `start` route returns `400 Not enough puzzles`.

#### [NEW] `scripts/seed-puzzles.ts`
Bulk-insert puzzles (image URL + answer + points_value) via Supabase service role key. Run once to populate the library.

---

### Phase 2 — Config & Constants

#### [NEW] `lib/constants.ts`
```ts
export const ROUND_DURATION_SECONDS = 30;
```

#### [NEW] `lib/supabase/client.ts`
`createBrowserClient` from `@supabase/ssr` — used in Client Components and hooks.

#### [NEW] `lib/supabase/server.ts`
`createServerClient` from `@supabase/ssr` — used in Route Handlers and Server Components.

#### [NEW] `.env.example`
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # server-only: answer validation, kick, shuffle-bag writes
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
```

---

### Phase 3 — API Route Handlers

All serverless functions, max 10s, short-lived. Real-time happens via Supabase edge.

---

#### `POST /api/rooms` — Create Room
**Body:** `{ hostId: string, hostName: string, totalRounds: number }`
**Validation (Zod):** `totalRounds` 1–20, `hostId` non-empty UUID, `hostName` 1–30 chars
**Action:** Insert `game_rooms` row
**Returns:** `{ roomId, joinUrl: "/room/:id/join", hostUrl: "/room/:id/host" }`

---

#### `POST /api/rooms/[roomId]/players` — Join Room
**Body:** `{ name: string }`
**Checks:**
- Room exists and `status === 'LOBBY'` (returns `403` if already started)
- `name` 1–20 chars (Zod)
**Action:** Insert player row
**Returns:** `{ playerId }`
**Realtime effect:** INSERT on `players` → Host lobby list updates live

> **Kicked players**: A kicked player simply hits this endpoint again. Their old row stays (`is_kicked=TRUE`) and a fresh row is created. No block on rejoin.

---

#### `DELETE /api/rooms/[roomId]/players/[playerId]` — Kick Player
**Header:** `x-host-id` validated against `game_rooms.host_id`
**Checks:** Room `status === 'LOBBY'` (can only kick in lobby)
**Action:** `UPDATE players SET is_kicked = TRUE WHERE id = playerId`
**Returns:** `{ success: true }`
**Realtime effect:** UPDATE on `players` → Player's client detects `is_kicked=TRUE` → shows "You were removed" screen

---

#### `POST /api/rooms/[roomId]/start` — Start Game
**Header:** `x-host-id`
**Checks:**
- `status === 'LOBBY'`
- At least 1 non-kicked player
- `COUNT(puzzles) >= total_rounds` (fails fast with `400` if not enough content)
**Action:**
1. Shuffle-bag selection (ORDER BY `times_used ASC, RANDOM() LIMIT total_rounds`)
2. Insert into `room_puzzles`
3. Increment `times_used` on selected puzzles
4. `UPDATE game_rooms SET status='PLAYING', current_round=1, round_started_at=NOW()`
**Returns:** `{ imageUrl: string }` — first puzzle image (answer stays server-side)
**Realtime effect:** UPDATE on `game_rooms` → All clients transition to game view

---

#### `POST /api/rooms/[roomId]/next-round` — Advance Round
**Header:** `x-host-id`
**Logic:**
- If `current_round < total_rounds`: increment round, set `round_started_at=NOW()`
- If `current_round === total_rounds`: set `status='FINISHED'`
**Returns:** `{ imageUrl: string | null, finished: boolean }`
**Realtime effect:** UPDATE on `game_rooms` → All clients load new puzzle or redirect to leaderboard

---

#### `POST /api/rooms/[roomId]/guess` — Submit Guess
**Body:** `{ playerId: string, guess: string }`
**Checks:**
- Room `status === 'PLAYING'`
- Player is not kicked
- Player hasn't already submitted a correct guess this round (prevent double-scoring)
  - Tracked via a simple in-memory check OR a `correct_rounds` JSONB column on `players`
**Answer validation:**
- Fetch correct answer via service role key (bypasses RLS)
- Normalize both: `.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '')`
- Compare strings
**If correct:**
```ts
const elapsed = (Date.now() - round_started_at) / 1000;  // seconds
const clamped = Math.max(0, Math.min(30, elapsed));
const earned  = points_value + Math.floor(points_value * (30 - clamped) / 30);
// UPDATE players SET score = score + earned
```
**Returns:** `{ correct: true, points: earned }` or `{ correct: false }`
**Realtime effect:** UPDATE on `players.score` → Leaderboard sidebar re-sorts live

---

### Phase 4 — Real-Time Event Map

| DB Mutation | Table | Who Listens | UI Effect |
|---|---|---|---|
| INSERT | `players` | Host client | New name in lobby list |
| UPDATE `is_kicked=TRUE` | `players` | All + kicked player | Kicked screen; host list removes player |
| UPDATE `status='PLAYING'` | `game_rooms` | All clients | Lobby → Game view |
| UPDATE `current_round` | `game_rooms` | All clients | New puzzle image fades in |
| UPDATE `round_started_at` | `game_rooms` | All clients | 30s countdown resets |
| UPDATE `score` | `players` | All clients | Live leaderboard sidebar re-sorts |
| UPDATE `status='FINISHED'` | `game_rooms` | All clients | Redirect → `/leaderboard` |

#### [NEW] `lib/realtime/useRoomChannel.ts`
Single hook per page. Returns `{ room, players, currentPuzzleUrl }`. Internally subscribes to both `game_rooms` and `players` channels for the given `roomId`.

---

### Phase 5 — Pages & UI

Design language: Swiss/minimalist, web-only desktop layout.

#### Design Tokens — `app/globals.css`
```css
:root {
  --bg:      #FAFAFA;
  --surface: #FFFFFF;
  --text:    #111827;
  --muted:   #6B7280;
  --accent:  #4F46E5;   /* Indigo — primary actions */
  --danger:  #EF4444;   /* Kick / error */
  --success: #10B981;   /* Correct guess */
  --warn:    #F59E0B;   /* Timer warning */
}
```
Font: **Inter** via `next/font/google`. Weights 400 / 600 / 800.

---

#### [NEW] `app/page.tsx` — Home (Room Creation)
- "Dingbats" wordmark (800 weight)
- Host name input (bottom-border)
- Round count stepper (1–20, default 5)
- **"Create Room"** → generates `hostId` UUID → `POST /api/rooms` → stores `hostId` in `localStorage` → redirect to `/room/:id/host`
- Framer Motion fade-in on load

---

#### [NEW] `app/room/[roomId]/host/page.tsx` — Host View

**Lobby** (`status=LOBBY`):
- Share link + copy-to-clipboard button
- Player list: name + "Kick" button per row (calls `DELETE .../players/:id`)
- Round count label ("5 rounds")
- "Start Game" CTA (disabled if 0 active players)

**Playing** (`status=PLAYING`):
- Header: `Round 2 / 5`
- Puzzle image (centered, large)
- 30s display timer (view only — host doesn't guess)
- Scrollable live guess feed: `PlayerName ✓ +143pts` / `PlayerName ✗`
- Sidebar: live leaderboard sorted by score (Framer Motion `layout` re-sort)
- "Next Round" button → "End Game" on final round

**Finished** → redirect to `/room/:id/leaderboard`

---

#### [NEW] `app/room/[roomId]/join/page.tsx` — Player Join
- Display name input + "Join" button
- Error states: "Room not found", "Game already in progress"
- On success: stores `playerId` in `localStorage` → redirect to `/room/:id/play`

---

#### [NEW] `app/room/[roomId]/play/page.tsx` — Player Game View

**Lobby**: "Waiting for host…" + live player list (own name highlighted)

**Playing**:
- Round indicator (top-left) + score badge (top-right, live)
- Puzzle image (Framer Motion `fade+scale` on round change)
- Circular 30s countdown (yellow → red at 10s)
- Guess input (bottom-border, submit on Enter)
- After correct: input hidden → `ScoreToast` "+143pts!" (auto-dismiss 2s)
- After timer: input locked, correct answer revealed in muted text

**Kicked** (`is_kicked=TRUE` via Realtime): Full-screen "You've been removed" message with option to rejoin (link back to `/join`)

**Finished** → redirect to `/room/:id/leaderboard`

---

#### [NEW] `app/room/[roomId]/leaderboard/page.tsx` — Final Podium
- Staggered entry animation (Framer Motion, 80ms per row)
- Top 3: gold / silver / bronze accent rings
- Own row: indigo highlight (matches `localStorage.playerId`)
- Score tooltip on hover: `Base 300 + Bonus 412 = 712pts`
- "Play Again" (host only, `localStorage.hostId` matches room's `host_id`) → back to home

---

### Phase 6 — Shared Components

| Component | Notes |
|---|---|
| `Button.tsx` | Flat pill, indigo fill, `scale-[0.98]` hover, spinner on loading |
| `Input.tsx` | Bottom-border only (`border-b-2`), indigo focus highlight |
| `PlayerList.tsx` | `AnimatePresence` list, avatar initials circle, optional kick button |
| `PuzzleCard.tsx` | White surface card, `fade+scale` on image swap |
| `CountdownTimer.tsx` | Circular SVG, `stroke-dashoffset` animation, `--warn` → `--danger` at 10s |
| `GuessFeed.tsx` | Scrollable, auto-scroll to bottom, correct = green badge, wrong = red |
| `LeaderboardRow.tsx` | Framer Motion `layout` prop for live re-ordering |
| `ScoreToast.tsx` | Animated "+Xpts!" pop-up, auto-dismiss 2s |
| `CopyLink.tsx` | Share URL display + copy button with "Copied!" confirmation |

---

### Phase 7 — Image Hosting (Cloudinary Free Tier)

#### [NEW] `lib/cloudinary.ts`
```ts
export function cloudinaryUrl(baseUrl: string, width = 800) {
  // Inject Cloudinary transforms into the delivery URL
  // f_auto,q_auto,w_{width}
  return baseUrl.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
}
```
Puzzles uploaded to Cloudinary Dashboard manually. Delivery URL saved in `puzzles.image_url`.

---

### Phase 8 — Deployment Config

#### [NEW] `vercel.json`
```json
{
  "functions": {
    "app/api/**": { "maxDuration": 10 }
  }
}
```

---

## Full File Map

```
app/
├── page.tsx                             # Home: create room
├── globals.css                          # Design tokens
├── layout.tsx                           # Root layout (Inter font)
└── room/[roomId]/
    ├── host/page.tsx                    # Host: lobby + game control
    ├── join/page.tsx                    # Player: name entry
    ├── play/page.tsx                    # Player: game view
    └── leaderboard/page.tsx             # Final podium

app/api/
├── rooms/route.ts                       # POST: create room
└── rooms/[roomId]/
    ├── players/
    │   ├── route.ts                     # POST: join room
    │   └── [playerId]/route.ts          # DELETE: kick player
    ├── start/route.ts                   # POST: start + shuffle-bag assign
    ├── next-round/route.ts              # POST: advance round
    └── guess/route.ts                   # POST: validate + time bonus

components/ui/
├── Button.tsx
├── Input.tsx
├── PlayerList.tsx
├── PuzzleCard.tsx
├── CountdownTimer.tsx
├── GuessFeed.tsx
├── LeaderboardRow.tsx
├── ScoreToast.tsx
└── CopyLink.tsx

lib/
├── supabase/
│   ├── client.ts
│   └── server.ts
├── realtime/
│   └── useRoomChannel.ts
├── cloudinary.ts
└── constants.ts

supabase/
└── migrations/
    └── 001_init.sql

scripts/
└── seed-puzzles.ts

.env.example
vercel.json
```

---

## Verification Plan

### Build Check
```bash
npm run build     # zero TypeScript errors
```

### Supabase Migration
```bash
supabase db push  # or run SQL manually in Supabase Dashboard
```

### Manual E2E (two browser windows)
1. **Window A** (host): create room → 5 rounds → copy share link
2. **Window B** (player): open join link → enter name → appears in lobby
3. **Window A**: kick Window B → Window B sees removal + rejoin link
4. **Window B**: rejoin as new player → Window A starts game
5. **Window B**: puzzle appears → correct guess at ~15s → `+150pts` toast
6. **Window A**: guess feed shows "✓ +150pts" → click Next Round → new puzzle loads in Window B
7. After round 5 → both redirect to leaderboard → correct gold/silver/bronze display

### Edge Cases
| Scenario | Expected Behaviour |
|---|---|
| Guess after timer | Server: `elapsed > 30` → `correct: false`, stale guess rejected |
| Network drop | Supabase Realtime auto-reconnects on tab focus |
| `puzzles` count < `total_rounds` | `start` returns `400 "Not enough puzzles in library"` |
| All puzzles used once | `times_used` resets behaviour: picks lowest count, all rotate fairly |
| Host closes tab | Room frozen; players see "Waiting…" — no auto-recovery in v1 |
