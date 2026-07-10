-- Update existing COD orders to show partially_paid status
UPDATE orders 
SET payment_status = 'partially_paid'
WHERE payment_type = 'COD' AND payment_status != 'partially_paid';
