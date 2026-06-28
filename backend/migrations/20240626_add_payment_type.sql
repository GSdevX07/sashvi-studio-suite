-- Add payment_type column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'Online';

-- Update existing orders to set payment_type based on payment_status
UPDATE orders SET payment_type = 'COD' WHERE payment_status IN ('advance_pending', 'partially_paid');
