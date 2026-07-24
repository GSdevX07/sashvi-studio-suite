-- Add has_edited column to reviews table
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS has_edited BOOLEAN DEFAULT false;
