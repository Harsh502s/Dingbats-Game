import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const hostId = req.headers.get('x-host-id');

    if (!hostId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createAdminClient();

    const { data: room } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (!room || room.host_id !== hostId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
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
      .select('puzzles(image_url)')
      .eq('room_id', roomId)
      .eq('round_number', nextRound)
      .single();

    return NextResponse.json({ imageUrl: (rp?.puzzles as any)?.image_url, finished: false });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to advance round' }, { status: 500 });
  }
}
