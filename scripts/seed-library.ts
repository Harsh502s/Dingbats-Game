import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const GENERAL_PUZZLES = [
  { answer: 'piece of cake', image_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=60' },
  { answer: 'clock out', image_url: 'https://images.unsplash.com/photo-1508962914676-134849a727f0?w=800&auto=format&fit=crop&q=60' },
  { answer: 'apple of my eye', image_url: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&auto=format&fit=crop&q=60' },
  { answer: 'hot dog', image_url: 'https://images.unsplash.com/photo-1541214113241-21578d2d9b62?w=800&auto=format&fit=crop&q=60' },
  { answer: 'brain storm', image_url: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800&auto=format&fit=crop&q=60' }
];

async function seedLibrary() {
  console.log('Seeding "General" puzzle library...');
  
  const puzzles = GENERAL_PUZZLES.map(p => ({
    ...p,
    points_value: 100,
    pack_name: 'General'
  }));

  const { error } = await supabase.from('puzzles').upsert(puzzles, { onConflict: 'image_url' });

  if (error) {
    console.error('Error seeding library:', error);
  } else {
    console.log('Successfully seeded library!');
  }
}

seedLibrary();
