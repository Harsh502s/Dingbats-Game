import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ roomId: string; playerId: string }> }
) {
  try {
    const { roomId, playerId } = await params;
    const hostId = req.headers.get('x-host-id');

    if (!hostId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    
    const { data: room } = await supabase
      .from('game_rooms')
      .select('host_id, status')
      .eq('id', roomId)
      .single();

    if (!room || room.host_id !== hostId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    if (room.status !== 'LOBBY') {
      return NextResponse.json({ error: 'Can only kick in lobby' }, { status: 400 });
    }

    const { error } = await supabase
      .from('players')
      .update({ is_kicked: true })
      .eq('id', playerId)
      .eq('room_id', roomId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to kick player' }, { status: 500 });
  }
}
