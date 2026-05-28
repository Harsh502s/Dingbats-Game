import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyHostToken } from '@/lib/auth/verifyHostToken';

export async function DELETE(req: Request) {
  try {
    const token = req.headers.get('x-host-token');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
      await verifyHostToken(token);
    } catch (error) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { packName } = await req.json();
    if (!packName) return NextResponse.json({ error: 'Pack name required' }, { status: 400 });

    const supabase = createAdminClient();

    // 1. Get all puzzle IDs belonging to this pack
    const { data: puzzles, error: fetchError } = await supabase
      .from('puzzles')
      .select('id')
      .eq('pack_name', packName);

    if (fetchError) throw fetchError;

    if (puzzles && puzzles.length > 0) {
      const puzzleIds = puzzles.map(p => p.id);

      // 2. Delete references in room_puzzles first (to avoid FK constraint error)
      const { error: refError } = await supabase
        .from('room_puzzles')
        .delete()
        .in('puzzle_id', puzzleIds);

      if (refError) throw refError;

      // 3. Delete the puzzles themselves
      const { error: deleteError } = await supabase
        .from('puzzles')
        .delete()
        .eq('pack_name', packName);

      if (deleteError) throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
