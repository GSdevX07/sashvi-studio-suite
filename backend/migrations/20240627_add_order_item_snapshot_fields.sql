-- Add additional snapshot fields to order_items table
-- These fields will store a snapshot of the product at the time of purchase
-- This ensures order details remain accurate even if product data changes later

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS selected_color TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS selected_size TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS discount NUMERIC DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS final_price NUMERIC DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS discount_type TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS discount_value NUMERIC DEFAULT 0;

-- Add comments to document the purpose of these fields
COMMENT ON COLUMN order_items.product_name IS 'Snapshot of product name at time of purchase';
COMMENT ON COLUMN order_items.product_image IS 'Snapshot of product image URL at time of purchase';
COMMENT ON COLUMN order_items.sku IS 'Snapshot of product SKU at time of purchase';
COMMENT ON COLUMN order_items.variant IS 'Snapshot of product variant at time of purchase';
COMMENT ON COLUMN order_items.category IS 'Snapshot of product category at time of purchase';
COMMENT ON COLUMN order_items.selected_color IS 'Selected color variant at time of purchase';
COMMENT ON COLUMN order_items.selected_size IS 'Selected size variant at time of purchase';
COMMENT ON COLUMN order_items.discount IS 'Discount amount applied to this item at time of purchase';
COMMENT ON COLUMN order_items.final_price IS 'Final price after discount at time of purchase';
COMMENT ON COLUMN order_items.discount_type IS 'Type of discount: percentage or fixed';
COMMENT ON COLUMN order_items.discount_value IS 'Value of discount: percentage or fixed amount';
