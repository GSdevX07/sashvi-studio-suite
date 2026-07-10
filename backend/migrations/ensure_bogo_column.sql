-- Ensure is_bogo column exists in products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_bogo BOOLEAN DEFAULT false;
