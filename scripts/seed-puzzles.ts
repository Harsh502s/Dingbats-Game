import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const samplePuzzles = [
  { image_url: 'https://res.cloudinary.com/demo/image/upload/v1/puzzles/puzzle1.jpg', answer: 'apple', points_value: 100 },
  { image_url: 'https://res.cloudinary.com/demo/image/upload/v1/puzzles/puzzle2.jpg', answer: 'banana', points_value: 100 },
  { image_url: 'https://res.cloudinary.com/demo/image/upload/v1/puzzles/puzzle3.jpg', answer: 'cat', points_value: 100 },
];

async function seed() {
  console.log('Seeding puzzles...');
  const { error } = await supabase.from('puzzles').insert(samplePuzzles);
  if (error) {
    console.error('Error seeding puzzles:', error);
  } else {
    console.log('Successfully seeded puzzles!');
  }
}

seed();
