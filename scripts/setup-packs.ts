import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function setupPacks() {
  console.log('Attempting to add pack_name column to puzzles table...');
  
  // Using rpc to execute SQL if available
  const { error: sqlError } = await supabase.rpc('exec_sql', { 
    sql: 'ALTER TABLE puzzles ADD COLUMN IF NOT EXISTS pack_name TEXT DEFAULT \'General\';' 
  });

  if (sqlError) {
    console.error('Could not add column via RPC. Please run this manually in Supabase SQL Editor:');
    console.log('ALTER TABLE puzzles ADD COLUMN IF NOT EXISTS pack_name TEXT DEFAULT \'General\';');
  } else {
    console.log('Successfully added pack_name column!');
  }
}

setupPacks();
