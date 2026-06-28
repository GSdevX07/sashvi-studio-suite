-- Add discount_percentage column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC(5, 2) DEFAULT 0;

-- Add discount_fixed column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS discount_fixed NUMERIC(10, 2) DEFAULT 0;

-- Add comments to the columns
COMMENT ON COLUMN products.discount_percentage IS 'Discount percentage (0-100) for the product';
COMMENT ON COLUMN products.discount_fixed IS 'Fixed discount amount (₹) for the product';
