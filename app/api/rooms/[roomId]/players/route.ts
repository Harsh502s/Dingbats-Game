import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';

const joinRoomSchema = z.object({
  name: z.string().min(1).max(20)
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const body = await req.json();
    const { name } = joinRoomSchema.parse(body);
    const { roomId } = await params;

    const supabase = createAdminClient();
    
    const { data: room, error: roomError } = await supabase
      .from('game_rooms')
      .select('status')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    
    if (room.status !== 'LOBBY') {
      return NextResponse.json({ error: 'Game already in progress' }, { status: 403 });
    }

    const { data: player, error: playerError } = await supabase
      .from('players')
      .insert({ room_id: roomId, name })
      .select('id')
      .single();

    if (playerError) throw playerError;

    return NextResponse.json({ playerId: player.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to join room' }, { status: 400 });
  }
}
