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
    if (room.status !== 'LOBBY') {
      return NextResponse.json({ error: 'Already started' }, { status: 400 });
    }

    const { count: playerCount } = await supabase
      .from('players')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', roomId)
      .eq('is_kicked', false);

    if (!playerCount || playerCount < 1) {
      return NextResponse.json({ error: 'Not enough players' }, { status: 400 });
    }

    const { packName } = await req.json().catch(() => ({}));

    // If packName is provided, we populate room_puzzles from the library
    if (packName) {
      // Clear any existing custom puzzles for this room if switching to a pack
      await supabase.from('room_puzzles').delete().eq('room_id', roomId);

      const { data: libraryPuzzles } = await supabase
        .from('puzzles')
        .select('id')
        .eq('pack_name', packName)
        .limit(room.total_rounds);

      if (!libraryPuzzles || libraryPuzzles.length === 0) {
        return NextResponse.json({ error: `No puzzles found in pack "${packName}"` }, { status: 400 });
      }

      // Shuffle and take total_rounds
      const shuffled = libraryPuzzles.sort(() => Math.random() - 0.5).slice(0, room.total_rounds);
      
      const roomPuzzles = shuffled.map((p, i) => ({
        room_id: roomId,
        round_number: i + 1,
        puzzle_id: p.id
      }));

      await supabase.from('room_puzzles').insert(roomPuzzles);
    }

    // Check actual number of puzzles in the room now
    const { data: roomPuzzlesData } = await supabase
      .from('room_puzzles')
      .select('round_number, puzzles(image_url)')
      .eq('room_id', roomId)
      .order('round_number', { ascending: true });

    const actualPuzzles = roomPuzzlesData?.length || 0;

    if (actualPuzzles < 1) {
      return NextResponse.json({ error: 'No puzzles found! Please add puzzles or select a pack.' }, { status: 400 });
    }

    const firstPuzzle = roomPuzzlesData?.find(rp => rp.round_number === 1);

    await supabase.from('game_rooms').update({
      status: 'PLAYING',
      current_round: 1,
      total_rounds: actualPuzzles,
      round_started_at: new Date().toISOString()
    }).eq('id', roomId);

    return NextResponse.json({ imageUrl: (firstPuzzle?.puzzles as any)?.image_url });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to start game' }, { status: 500 });
  }
}
