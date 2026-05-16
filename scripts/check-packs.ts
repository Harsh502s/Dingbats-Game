import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkPacks() {
  const { data, error } = await supabase.from('puzzles').select('pack_name');
  if (error) {
    console.error('Error fetching packs:', error);
  } else {
    const packs = [...new Set(data.map(p => p.pack_name).filter(Boolean))];
    console.log('Available Packs:', packs);
  }
}

checkPacks();
