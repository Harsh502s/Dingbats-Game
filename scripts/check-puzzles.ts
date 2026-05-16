import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkPuzzles() {
  const { data, error } = await supabase.from('puzzles').select('id, answer, image_url').limit(10);
  if (error) {
    console.error('Error fetching puzzles:', error);
  } else {
    console.log('Puzzles in DB:', data);
  }
}

checkPuzzles();
