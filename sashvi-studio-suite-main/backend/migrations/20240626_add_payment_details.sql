-- Add payment detail columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS advance_paid NUMERIC DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_for_advance NUMERIC DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gateway_for_advance NUMERIC DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_paid_online NUMERIC DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS remaining_amount NUMERIC DEFAULT 0;

-- Update existing orders to calculate these values
UPDATE orders 
SET 
  advance_paid = CASE WHEN payment_type = 'COD' THEN CEIL(total_amount * 0.10) ELSE total_amount END,
  delivery_for_advance = delivery_charge,
  gateway_for_advance = CASE WHEN payment_type = 'COD' THEN CEIL((CEIL(total_amount * 0.10) + delivery_charge) * 0.03) ELSE gateway_charge END,
  total_paid_online = CASE WHEN payment_type = 'COD' 
    THEN CEIL(total_amount * 0.10) + delivery_charge + CEIL((CEIL(total_amount * 0.10) + delivery_charge) * 0.03)
    ELSE total_amount END,
  remaining_amount = CASE WHEN payment_type = 'COD' 
    THEN total_amount - (CEIL(total_amount * 0.10) + delivery_charge + CEIL((CEIL(total_amount * 0.10) + delivery_charge) * 0.03))
    ELSE 0 END
WHERE advance_paid = 0;
