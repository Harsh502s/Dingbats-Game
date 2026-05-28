import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyHostRequest } from '@/lib/auth/verifyHostToken';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const hostVerify = await verifyHostRequest(req, roomId);

    if (hostVerify instanceof NextResponse) {
      return hostVerify;
    }

    const supabase = createAdminClient();

    const { data: room } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const nextRound = room.current_round + 1;

    if (nextRound > room.total_rounds) {
      await supabase.from('game_rooms').update({ status: 'FINISHED' }).eq('id', roomId);
      return NextResponse.json({ imageUrl: null, finished: true });
    }

    await supabase.from('game_rooms').update({
      current_round: nextRound,
      round_started_at: new Date().toISOString()
    }).eq('id', roomId);

    const { data: rp } = await supabase
      .from('room_puzzles')
      .select('puzzle_id')
      .eq('room_id', roomId)
      .eq('round_number', nextRound)
      .single();

    let imageUrl = null;
    if (rp?.puzzle_id) {
      const { data: puzzle } = await supabase
        .from('puzzles')
        .select('image_url')
        .eq('id', rp.puzzle_id)
        .single();
      imageUrl = puzzle?.image_url || null;
    }

    return NextResponse.json({ imageUrl, finished: false });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to advance round' }, { status: 500 });
  }
}
