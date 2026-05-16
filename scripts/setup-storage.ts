import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function setupStorage() {
  console.log('Creating puzzles bucket...');
  const { data, error } = await supabase.storage.createBucket('puzzles', {
    public: true,
    fileSizeLimit: 5242880, // 5MB
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
  });

  if (error) {
    if (error.message.includes('already exists')) {
      console.log('Bucket already exists! We are good.');
    } else {
      console.error('Failed to create bucket:', error.message);
    }
  } else {
    console.log('Successfully created puzzles bucket!');
  }
}

setupStorage();
