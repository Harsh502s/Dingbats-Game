import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function cleanAll() {
  console.log('🧹 Cleaning all test data from Supabase...\n');

  const { error: e1 } = await supabase.from('room_puzzles').delete().gte('round_number', 0);
  console.log(`room_puzzles: cleared`, e1 ? `ERROR: ${e1.message}` : '✅');

  const { error: e2 } = await supabase.from('players').delete().eq('is_kicked', false).or('is_kicked.eq.true');
  console.log(`players: cleared`, e2 ? `ERROR: ${e2.message}` : '✅');

  const { error: e3 } = await supabase.from('game_rooms').delete().gte('created_at', '2000-01-01');
  console.log(`game_rooms: cleared`, e3 ? `ERROR: ${e3.message}` : '✅');

  const { error: e4 } = await supabase.from('puzzles').delete().neq('answer', '');
  console.log(`puzzles: cleared`, e4 ? `ERROR: ${e4.message}` : '✅');

  // Clean storage bucket
  const { data: files, error: listErr } = await supabase.storage.from('puzzles').list('', { limit: 1000 });
  if (listErr) {
    console.log(`Storage list error: ${listErr.message}`);
  } else if (files && files.length > 0) {
    const paths = files.map(f => f.name);
    const { error: delErr } = await supabase.storage.from('puzzles').remove(paths);
    console.log(`Storage: deleted ${paths.length} files`, delErr ? `ERROR: ${delErr.message}` : '✅');
  } else {
    console.log('Storage: no files to delete ✅');
  }

  console.log('\n✅ All test data cleaned!');
}

cleanAll().catch(console.error);
