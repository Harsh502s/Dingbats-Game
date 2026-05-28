import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import { signHostToken } from '@/lib/auth/verifyHostToken';

const createRoomSchema = z.object({
  totalRounds: z.number().int().min(1).max(20),
  roundDuration: z.number().int().min(10).max(120).default(30)
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { totalRounds, roundDuration } = createRoomSchema.parse(body);

    const hostId = uuidv4();
    const roomId = uuidv4();

    const supabase = createAdminClient();
    const { error } = await supabase
      .from('game_rooms')
      .insert({
        id: roomId,
        host_id: hostId,
        status: 'LOBBY',
        total_rounds: totalRounds,
        current_round: 0,
        round_duration: roundDuration
      });

    if (error) throw error;

    const hostToken = await signHostToken({ roomId, hostId });

    return NextResponse.json({
      roomId: roomId,
      hostToken: hostToken,
      joinUrl: `/room/${roomId}/join`,
      hostUrl: `/room/${roomId}/host`
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 400 });
  }
}
