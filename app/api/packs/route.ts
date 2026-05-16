import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createAdminClient();
    
    // Select unique pack names that are not null
    const { data, error } = await supabase
      .from('puzzles')
      .select('pack_name')
      .not('pack_name', 'is', null);

    if (error) throw error;

    const packs = [...new Set(data.map(p => p.pack_name))];
    
    return NextResponse.json({ packs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
