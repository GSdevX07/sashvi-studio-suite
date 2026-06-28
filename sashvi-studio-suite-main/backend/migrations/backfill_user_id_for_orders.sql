-- Backfill user_id for existing orders based on email match
-- Run this in Supabase SQL Editor

-- First ensure user_id column exists
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- Update orders to link to users based on email match
UPDATE orders o
SET user_id = u.id
FROM users u
WHERE o.email = u.email
AND o.user_id IS NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- Show results
SELECT 
  COUNT(*) as total_orders,
  COUNT(user_id) as orders_with_user_id,
  COUNT(*) - COUNT(user_id) as orders_without_user_id
FROM orders;

-- Show orders that couldn't be matched (for manual review)
SELECT id, order_id, customer_name, email, mobile
FROM orders
WHERE user_id IS NULL
LIMIT 10;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'user_id backfill completed!';
  RAISE NOTICE 'Orders without user_id may need manual linking';
END $$;
