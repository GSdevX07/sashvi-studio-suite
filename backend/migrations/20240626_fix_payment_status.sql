-- Check current payment_status values
SELECT id, order_id, payment_status, payment_type FROM orders ORDER BY created_at DESC LIMIT 10;

-- Force update all COD orders to partially_paid
UPDATE orders 
SET payment_status = 'partially_paid' 
WHERE payment_type = 'COD' OR payment_status = 'pending';

-- Verify the update
SELECT id, order_id, payment_status, payment_type FROM orders ORDER BY created_at DESC LIMIT 10;
