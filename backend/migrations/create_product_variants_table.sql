-- Create product_variants table to support multiple color variants per product
-- Run this in Supabase SQL Editor

-- Create the variants table
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  color TEXT NOT NULL,
  sku TEXT DEFAULT '',
  stock INT DEFAULT 0,
  original_price NUMERIC DEFAULT 0,
  sale_price NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);

-- Add sku column if it doesn't exist
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS sku TEXT DEFAULT '';

-- Migrate existing variant data from products table to product_variants table
INSERT INTO product_variants (product_id, color, stock, original_price, sale_price)
SELECT
  id as product_id,
  variant_color as color,
  variant_stock as stock,
  variant_original_price as original_price,
  variant_sale_price as sale_price
FROM products
WHERE variant_color IS NOT NULL
  AND variant_color != '';

-- Drop old variant columns from products table (optional - can keep for backup)
-- ALTER TABLE products DROP COLUMN IF EXISTS variant_color;
-- ALTER TABLE products DROP COLUMN IF EXISTS variant_stock;
-- ALTER TABLE products DROP COLUMN IF EXISTS variant_original_price;
-- ALTER TABLE products DROP COLUMN IF EXISTS variant_sale_price;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'product_variants table created successfully!';
  RAISE NOTICE 'Existing variant data migrated from products table';
  RAISE NOTICE 'You can now store multiple variants per product';
END $$;
