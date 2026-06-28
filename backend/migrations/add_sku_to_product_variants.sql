-- Add sku column to product_variants table
-- Run this in Supabase SQL Editor

ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS sku TEXT DEFAULT '';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'sku column added to product_variants table successfully!';
END $$;
