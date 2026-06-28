-- Add discount_badge column to products table
ALTER TABLE products 
ADD COLUMN discount_badge TEXT;

-- Add comment
COMMENT ON COLUMN products.discount_badge IS 'Custom discount badge text (e.g., "Save 200", "Best Deal"). If empty, badge is auto-generated from discount settings.';
