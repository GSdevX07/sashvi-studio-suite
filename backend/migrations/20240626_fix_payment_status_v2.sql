-- Check all payment_status and payment_type values
SELECT id, order_id, payment_status, payment_type, total_amount FROM orders ORDER BY created_at DESC LIMIT 10;

-- Update ALL orders to have correct payment_type based on payment_status
-- If payment_status was 'advance_pending' or 'partially_paid', set payment_type to 'COD'
UPDATE orders 
SET payment_type = 'COD' 
WHERE payment_status IN ('advance_pending', 'partially_paid');

-- Update payment_status from pending to partially_paid for COD orders
UPDATE orders 
SET payment_status = 'partially_paid' 
WHERE payment_type = 'COD' AND payment_status = 'pending';

-- Verify the update
SELECT id, order_id, payment_status, payment_type FROM orders ORDER BY created_at DESC LIMIT 10;
