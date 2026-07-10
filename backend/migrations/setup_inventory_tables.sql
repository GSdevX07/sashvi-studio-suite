-- Complete Inventory Tables Setup
-- Run this in Supabase SQL Editor to ensure all inventory-related tables are properly set up

-- ============================================================================
-- PRODUCTS TABLE (Main product info with total stock)
-- ============================================================================

-- Ensure products table has all required columns
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INT DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_best_seller BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_badge TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT 'none';
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_value NUMERIC DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_fixed NUMERIC DEFAULT 0;

-- ============================================================================
-- PRODUCT_VARIANTS TABLE (Variant-specific inventory)
-- ============================================================================

-- Create product_variants table if it doesn't exist
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

-- Add sku column if table exists but doesn't have it
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS sku TEXT DEFAULT '';

-- ============================================================================
-- MIGRATE EXISTING VARIANT DATA (if any)
-- ============================================================================

-- Migrate existing variant data from products table to product_variants table
INSERT INTO product_variants (product_id, color, sku, stock, original_price, sale_price)
SELECT
  id as product_id,
  COALESCE(variant_color, color) as color,
  sku || '-V1' as sku,
  COALESCE(variant_stock, stock) as stock,
  COALESCE(variant_original_price, original_price) as original_price,
  COALESCE(variant_sale_price, sale_price) as sale_price
FROM products
WHERE variant_color IS NOT NULL
  AND variant_color != ''
ON CONFLICT DO NOTHING;

-- ============================================================================
-- CREATE VIEW FOR INVENTORY SUMMARY
-- ============================================================================

-- Create a view that shows products with their variant stock summary
CREATE OR REPLACE VIEW inventory_summary AS
SELECT 
  p.id,
  p.name,
  p.sku as product_sku,
  p.stock as total_stock,
  p.is_active,
  COUNT(pv.id) as variant_count,
  COALESCE(SUM(pv.stock), 0) as total_variant_stock
FROM products p
LEFT JOIN product_variants pv ON p.id = pv.product_id
GROUP BY p.id, p.name, p.sku, p.stock, p.is_active;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Inventory tables setup completed successfully!';
  RAISE NOTICE 'Products table: Main product info with total stock';
  RAISE NOTICE 'Product_variants table: Variant-specific inventory (color, sku, stock)';
  RAISE NOTICE 'Inventory_summary view: Quick overview of product inventory';
END $$;

-- Verify setup
SELECT 'Products table columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'products' 
  AND column_name IN ('stock', 'sku', 'is_best_seller', 'discount_badge');

SELECT 'Product_variants table columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'product_variants';
