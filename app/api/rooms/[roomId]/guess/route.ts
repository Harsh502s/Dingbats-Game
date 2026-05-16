import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';

const guessSchema = z.object({
  playerId: z.string().uuid(),
  guess: z.string()
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const body = await req.json();
    const { playerId, guess } = guessSchema.parse(body);
    const { roomId } = await params;

    const supabase = createAdminClient();

    const { data: room } = await supabase
      .from('game_rooms')
      .select('status, current_round, round_started_at')
      .eq('id', roomId)
      .single();

    if (!room || room.status !== 'PLAYING') {
      return NextResponse.json({ error: 'Game not active' }, { status: 400 });
    }

    const { data: player } = await supabase
      .from('players')
      .select('is_kicked, score')
      .eq('id', playerId)
      .eq('room_id', roomId)
      .single();

    if (!player || player.is_kicked) {
      return NextResponse.json({ error: 'Invalid player' }, { status: 403 });
    }

    const startedAt = new Date(room.round_started_at!).getTime();
    const elapsed = (Date.now() - startedAt) / 1000;
    
    if (elapsed > 30) {
      return NextResponse.json({ correct: false, reason: 'timeout' });
    }

    const { data: rp } = await supabase
      .from('room_puzzles')
      .select('puzzles(answer, points_value)')
      .eq('room_id', roomId)
      .eq('round_number', room.current_round)
      .single();

    const puzzle = rp?.puzzles as any;
    if (!puzzle) {
      return NextResponse.json({ error: 'Puzzle not found' }, { status: 500 });
    }

    const normalize = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    const isCorrect = normalize(guess) === normalize(puzzle.answer);

    if (isCorrect) {
      const clamped = Math.max(0, Math.min(30, elapsed));
      const points_value = puzzle.points_value;
      const earned = points_value + Math.floor(points_value * (30 - clamped) / 30);

      await supabase
        .from('players')
        .update({ score: player.score + earned })
        .eq('id', playerId);

      return NextResponse.json({ correct: true, points: earned });
    }

    return NextResponse.json({ correct: false });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to process guess' }, { status: 500 });
  }
}
