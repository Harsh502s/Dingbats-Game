import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { createHash } from 'crypto';
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
      .select('total_rounds')
      .eq('id', roomId)
      .single();

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get('image') as File;
    const answer = formData.get('answer') as string;

    if (!file || !answer) {
      return NextResponse.json({ error: 'Image and answer are required' }, { status: 400 });
    }

    // Derive a stable filename from the file content hash — prevents duplicate uploads
    const bytes = await file.arrayBuffer();
    const hash = createHash('sha256').update(Buffer.from(bytes)).digest('hex').slice(0, 16);
    const fileExt = file.name.split('.').pop() ?? 'jpg';
    const fileName = `${roomId}/${hash}.${fileExt}`;

    // Check if this exact image hash already exists as a puzzle in this room
    const existingPublicUrl = supabase.storage.from('puzzles').getPublicUrl(fileName).data.publicUrl;
    const { data: existingPuzzle } = await supabase
      .from('puzzles')
      .select('id')
      .eq('image_url', existingPublicUrl)
      .maybeSingle();

    const { data: existingRoomPuzzle } = await supabase
      .from('room_puzzles')
      .select('id')
      .eq('room_id', roomId)
      .eq('puzzle_id', existingPuzzle?.id ?? '00000000-0000-0000-0000-000000000000')
      .maybeSingle();

    if (existingRoomPuzzle) {
      // Already uploaded this exact image — return 409 so client can mark as duplicate
      return NextResponse.json({ duplicate: true, message: 'This image is already in this room' }, { status: 409 });
    }

    // Upload to storage (upsert — safe to re-upload same hash)
    await supabase.storage
      .from('puzzles')
      .upload(fileName, file, { contentType: file.type, upsert: true });

    const { data: { publicUrl } } = supabase.storage
      .from('puzzles')
      .getPublicUrl(fileName);

    // Upsert puzzle row by image_url (handles cross-room reuse gracefully)
    const { data: puzzle, error: puzzleError } = await supabase
      .from('puzzles')
      .upsert(
        { image_url: publicUrl, answer: answer.toLowerCase().trim(), points_value: 100 },
        { onConflict: 'image_url', ignoreDuplicates: false }
      )
      .select()
      .single();

    if (puzzleError) throw puzzleError;

    // Get current puzzle count for this room to set round_number accurately
    const { count } = await supabase
      .from('room_puzzles')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', roomId);

    const nextRound = (count || 0) + 1;

    if (nextRound > 20) {
      return NextResponse.json({ error: 'Max 20 puzzles allowed' }, { status: 400 });
    }

    const { error: rpError } = await supabase.from('room_puzzles').insert({
      room_id: roomId,
      round_number: nextRound,
      puzzle_id: puzzle.id
    });

    if (rpError) throw rpError;

    return NextResponse.json({ success: true, puzzle });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}
