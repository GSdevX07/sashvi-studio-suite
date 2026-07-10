-- Add BOGO-related fields to order_items table
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS selected_quantity INT DEFAULT 1;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS payable_quantity INT DEFAULT 1;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS free_quantity INT DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS unit_price NUMERIC DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS final_price NUMERIC DEFAULT 0;
