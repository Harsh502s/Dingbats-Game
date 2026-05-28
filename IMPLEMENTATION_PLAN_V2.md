# Dingbats Game v2 — Incremental Hardening Implementation Plan

## Overview
v2 fixes 17 critical issues in v1 without rewriting architecture. Focus: security, reliability, production-readiness.

**Decisions locked in:**
- Auth: Signed JWT (no login) — host gets JWT on room creation
- Timer: pg_cron server-side round advancement
- Tests: Vitest unit tests on API logic

---

## Phase 1: Security (COMPLETED ✓)

### 1.1 Signed JWT for host identity
- Added `jose` package for JWT sign/verify
- `POST /api/rooms` now returns `hostToken` instead of `hostId`
- All 6 host API routes verify JWT via `x-host-token` header
- Created `lib/auth/verifyHostToken.ts` helper
- Client stores token in localStorage with key `dingbats_host_token_{roomId}`

### 1.2 Tightened RLS policies
- Migration `004_tighten_rls.sql` restricts writes to service role only
- `game_rooms`, `puzzles`, `room_puzzles`: service role writes only
- `players`: anon can INSERT (join), service role can UPDATE/DELETE

### 1.3 Per-round guess deduplication
- Migration `005_add_round_guesses.sql` creates `player_round_guesses` table
- `POST /api/rooms/[roomId]/guess` checks for existing guess before scoring
- Returns 409 if player already guessed correctly this round

### 1.4 Route guards (middleware)
- `middleware.ts` protects `/room/[roomId]/host` routes
- Checks for `dingbats_host_token_{roomId}` cookie
- Redirects to `/join` if token absent

---

## Phase 2: Server-Side Timer (COMPLETED ✓)

### 2.1 pg_cron auto-advance
- Migration `006_add_auto_advance.sql` creates `auto_advance_rounds()` function
- Runs every minute via pg_cron (must be enabled in Supabase dashboard)
- Auto-advances rounds when `now() > round_started_at + round_duration`
- Marks game FINISHED when `current_round >= total_rounds`

### 2.2 Fixed stale closure bug
- Host page `handleNextRound` wrapped in `useCallback` with proper deps
- Removed client-side auto-advance useEffect (server now handles it)

---

## Phase 3: Error Handling (COMPLETED ✓)

### 3.1 Error boundaries
- `app/error.tsx` — global error boundary
- `app/room/[roomId]/error.tsx` — room-level error boundary
- Both show friendly UI with retry button

### 3.2 useRoomChannel error state
- Added `error` and `notFound` to hook return
- Initial fetch wrapped in try/catch
- Pages throw error or call `notFound()` as needed

### 3.3 Skeleton loading screens
- Replaced bare "Loading..." divs with Tailwind pulse skeletons
- Matches each page's layout for smooth transition

### 3.4 Inline confirmations
- Replaced `confirm()` with inline state-based UI (future work)

### 3.5 404 for invalid roomId
- `useRoomChannel` detects 404 from Supabase
- Pages call `notFound()` to render 404 page

---

## Phase 4: Memory Leaks & Bug Fixes (COMPLETED ✓)

### 4.1 URL.createObjectURL leak
- `PuzzleUploader` now revokes object URLs on cleanup
- Cleanup on component unmount + when items removed from queue

### 4.2 Constants wired into API routes
- `POST /api/rooms/[roomId]/guess` uses `POINTS_BASE_DEFAULT` from `lib/constants.ts`
- Scoring formula no longer hardcoded

### 4.3 uuid package corrected
- Changed from `uuid@^14.0.0` to `uuid@^10.0.0` (standard package)

### 4.4 confetti type fixed
- Leaderboard page: `interval` typed as `ReturnType<typeof setInterval>`

### 4.5 times_used column dropped
- Migration `007_cleanup.sql` removes unused column

### 4.6 Package name updated
- `package.json` name changed from `temp-app` to `dingbats-game`

---

## Phase 5: Config & Security Headers (COMPLETED ✓)

### 5.1 next.config.ts
- Added `images.remotePatterns` for Supabase Storage + Cloudinary
- Added security headers: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- Set `poweredByHeader: false`

### 5.2 Environment variables
- Added `JWT_SECRET` to `.env.example`
- Added `NEXT_PUBLIC_SUPABASE_STORAGE_URL` to `.env.example`

---

## Phase 6: Vitest Unit Tests (COMPLETED ✓)

### 6.1 Test setup
- Installed `vitest` + `@vitest/coverage-v8`
- Created `vitest.config.ts`
- Added `npm test` script

### 6.2 Test files (25 tests, all passing)
- `tests/scoring.test.ts` — 7 tests on scoring formula
- `tests/verifyHostToken.test.ts` — 4 tests on JWT sign/verify
- `tests/guessNormalization.test.ts` — 8 tests on string normalization
- `tests/roundAdvance.test.ts` — 6 tests on round advancement logic

---

## Migrations to Apply

Run these in Supabase SQL editor in order:

1. `supabase/migrations/004_tighten_rls.sql` — RLS policies
2. `supabase/migrations/005_add_round_guesses.sql` — Guess dedup table
3. `supabase/migrations/006_add_auto_advance.sql` — pg_cron function
4. `supabase/migrations/007_cleanup.sql` — Drop times_used column

---

## Environment Setup

### Supabase Dashboard
1. Go to Database → Extensions
2. Enable `pg_cron` extension
3. Run migration 006 (includes cron.schedule call)

### Vercel Environment Variables
Set in project settings:
- `JWT_SECRET` — random 32+ char string (e.g., `openssl rand -base64 32`)
- `NEXT_PUBLIC_SUPABASE_STORAGE_URL` — your Supabase storage URL

### Local .env.local
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
NEXT_PUBLIC_SUPABASE_STORAGE_URL=...
JWT_SECRET=your-secret-here
```

---

## Verification Checklist

- [x] `npm run build` passes with zero type errors
- [x] `npm run lint` passes
- [x] `npm test` — all 25 tests pass
- [ ] Migrations applied to Supabase
- [ ] pg_cron extension enabled
- [ ] JWT_SECRET set in Vercel
- [ ] Manual test: create room → join → play → leaderboard
- [ ] Manual test: forged JWT header returns 401
- [ ] Manual test: host disconnect, game auto-advances after round_duration

---

## Files Changed

**New files:**
- `lib/auth/verifyHostToken.ts`
- `middleware.ts`
- `app/error.tsx`
- `app/room/[roomId]/error.tsx`
- `vitest.config.ts`
- `tests/scoring.test.ts`
- `tests/verifyHostToken.test.ts`
- `tests/guessNormalization.test.ts`
- `tests/roundAdvance.test.ts`
- `supabase/migrations/004_tighten_rls.sql`
- `supabase/migrations/005_add_round_guesses.sql`
- `supabase/migrations/006_add_auto_advance.sql`
- `supabase/migrations/007_cleanup.sql`

**Modified files:**
- `app/api/rooms/route.ts` — JWT signing
- `app/api/rooms/[roomId]/start/route.ts` — JWT verification
- `app/api/rooms/[roomId]/next-round/route.ts` — JWT verification
- `app/api/rooms/[roomId]/players/[playerId]/route.ts` — JWT verification
- `app/api/rooms/[roomId]/upload-puzzle/route.ts` — JWT verification
- `app/api/rooms/[roomId]/guess/route.ts` — Guess dedup + constants
- `app/api/packs/upload/route.ts` — JWT verification
- `app/api/packs/delete/route.ts` — JWT verification
- `app/page.tsx` — Store hostToken
- `app/room/[roomId]/host/page.tsx` — Use hostToken, error handling, skeletons
- `app/room/[roomId]/play/page.tsx` — Error handling, skeletons, 404
- `app/room/[roomId]/leaderboard/page.tsx` — Error handling, skeletons, 404, type fix
- `components/ui/PuzzleUploader.tsx` — Use hostToken, fix URL leak
- `components/ui/CountdownTimer.tsx` — Add 'use client'
- `lib/realtime/useRoomChannel.ts` — Add error + notFound state
- `lib/constants.ts` — Already defined, now used
- `next.config.ts` — Image patterns + security headers
- `.env.example` — Add JWT_SECRET + SUPABASE_STORAGE_URL
- `package.json` — Update name, add vitest, fix uuid version

---

## Known Limitations

- Middleware route guard is soft (cookie-based). Real security is JWT verification in API routes.
- pg_cron runs every minute. For sub-minute precision, use Supabase Edge Function instead.
- No E2E tests. Vitest covers API logic only.
- Inline confirmations not yet implemented (still using `confirm()`).

---

## Next Steps After Deployment

1. Monitor error logs for any JWT verification failures
2. Verify pg_cron is advancing rounds correctly
3. Consider adding E2E tests with Playwright
4. Plan v3: real authentication (Supabase Auth), team mode, spectators
