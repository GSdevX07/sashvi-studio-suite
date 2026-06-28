-- Update existing products with default values for color, stock, and prices
-- Run this in Supabase SQL Editor

-- Ensure all columns exist (safe to run multiple times)
ALTER TABLE products ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INT DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_price NUMERIC DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS original_price NUMERIC DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT false;

-- Update NULL values to defaults
UPDATE products 
SET color = '' 
WHERE color IS NULL;

UPDATE products 
SET stock = 0 
WHERE stock IS NULL;

UPDATE products 
SET sale_price = 0 
WHERE sale_price IS NULL;

UPDATE products 
SET original_price = 0 
WHERE original_price IS NULL;

UPDATE products 
SET is_new = false 
WHERE is_new IS NULL;

-- If sale_price is 0 but original_price has value, copy it
UPDATE products 
SET sale_price = original_price 
WHERE sale_price = 0 AND original_price > 0;

-- If original_price is 0 but sale_price has value, copy it
UPDATE products 
SET original_price = sale_price 
WHERE original_price = 0 AND sale_price > 0;

-- Set default stock to 10 if it's 0
UPDATE products 
SET stock = 10 
WHERE stock = 0;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Product defaults updated successfully!';
  RAISE NOTICE 'Columns verified: color, stock, sale_price, original_price, is_new';
END $$;
