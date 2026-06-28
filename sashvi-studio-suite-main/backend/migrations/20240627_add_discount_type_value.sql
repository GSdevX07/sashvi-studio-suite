-- Add canonical discount type/value columns for admin product discounts
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT 'none';
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_value NUMERIC DEFAULT 0;

-- Migrate legacy discount columns
UPDATE products
SET discount_type = 'percent', discount_value = discount_percentage
WHERE COALESCE(discount_percentage, 0) > 0
  AND (discount_type IS NULL OR discount_type = 'none' OR discount_type = '');

UPDATE products
SET discount_type = 'fixed', discount_value = discount_fixed
WHERE COALESCE(discount_fixed, 0) > 0
  AND COALESCE(discount_percentage, 0) = 0
  AND (discount_type IS NULL OR discount_type = 'none' OR discount_type = '');

COMMENT ON COLUMN products.discount_type IS 'none | fixed | percent';
COMMENT ON COLUMN products.discount_value IS 'Fixed amount in INR or percentage value';
