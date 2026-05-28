import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyHostRequest } from '@/lib/auth/verifyHostToken';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ roomId: string; playerId: string }> }
) {
  try {
    const { roomId, playerId } = await params;
    const hostVerify = await verifyHostRequest(req, roomId);

    if (hostVerify instanceof NextResponse) {
      return hostVerify;
    }

    const supabase = createAdminClient();

    const { data: room } = await supabase
      .from('game_rooms')
      .select('status')
      .eq('id', roomId)
      .single();

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
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
