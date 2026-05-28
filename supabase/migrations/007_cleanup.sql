-- Drop unused times_used column from puzzles table
ALTER TABLE puzzles DROP COLUMN IF EXISTS times_used;
