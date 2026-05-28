import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { createHash } from 'crypto';
import { verifyHostToken } from '@/lib/auth/verifyHostToken';

export async function POST(req: Request) {
  try {
    const token = req.headers.get('x-host-token');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
      await verifyHostToken(token);
    } catch (error) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('image') as File;
    const answer = formData.get('answer') as string;
    const packName = formData.get('packName') as string;

    if (!file || !answer || !packName) {
      return NextResponse.json({ error: 'Image, answer, and pack name are required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Content hash for deduplication
    const bytes = await file.arrayBuffer();
    const hash = createHash('sha256').update(Buffer.from(bytes)).digest('hex').slice(0, 16);
    const fileExt = file.name.split('.').pop() ?? 'jpg';
    const fileName = `library/${packName}/${hash}.${fileExt}`;

    // Upload to storage
    await supabase.storage
      .from('puzzles')
      .upload(fileName, file, { contentType: file.type, upsert: true });

    const { data: { publicUrl } } = supabase.storage
      .from('puzzles')
      .getPublicUrl(fileName);

    // Insert/Upsert into puzzles table
    const { data: puzzle, error: puzzleError } = await supabase
      .from('puzzles')
      .upsert(
        {
          image_url: publicUrl,
          answer: answer.toLowerCase().trim(),
          points_value: 100,
          pack_name: packName
        },
        { onConflict: 'image_url' }
      )
      .select()
      .single();

    if (puzzleError) throw puzzleError;

    return NextResponse.json({ success: true, puzzle });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Pack upload failed' }, { status: 500 });
  }
}
