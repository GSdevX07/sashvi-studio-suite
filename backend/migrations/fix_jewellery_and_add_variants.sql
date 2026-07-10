-- Fix jewellery issues and add variant fields
-- Run this in Supabase SQL Editor

-- Add material/metal column for jewellery
ALTER TABLE products ADD COLUMN IF NOT EXISTS material TEXT DEFAULT '';

-- Add variant fields for color variants
ALTER TABLE products ADD COLUMN IF NOT EXISTS variant_color TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS variant_stock INT DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS variant_original_price NUMERIC DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS variant_sale_price NUMERIC DEFAULT 0;

-- Fix blouse_piece for jewellery - set to NULL or appropriate default for non-saree products
-- First, identify jewellery products (by category)
UPDATE products p
SET blouse_included = NULL
FROM categories c
WHERE p.category_id = c.id 
  AND c.type = 'jewellery'
  AND p.blouse_included IS NOT NULL;

-- For combos, also set blouse_included to NULL
UPDATE products p
SET blouse_included = NULL
FROM categories c
WHERE p.category_id = c.id 
  AND c.type = 'combos'
  AND p.blouse_included IS NOT NULL;

-- For sarees, ensure blouse_included has a default value
UPDATE products p
SET blouse_included = true
FROM categories c
WHERE p.category_id = c.id 
  AND c.type = 'sarees'
  AND p.blouse_included IS NULL;

-- Set default material for jewellery if NULL
UPDATE products p
SET material = 'Gold Plated'
FROM categories c
WHERE p.category_id = c.id 
  AND c.type = 'jewellery'
  AND (p.material IS NULL OR p.material = '');

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Jewellery fixes applied!';
  RAISE NOTICE '- Added material column';
  RAISE NOTICE '- Added variant columns (color, stock, original_price, sale_price)';
  RAISE NOTICE '- Fixed blouse_piece for jewellery and combos (set to NULL)';
  RAISE NOTICE '- Set default material for jewellery';
END $$;
