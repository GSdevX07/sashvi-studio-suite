-- Ensure orders table has user_id column
-- Run this in Supabase SQL Editor

ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'user_id';

-- Check if any orders have null user_id
SELECT COUNT(*) as orders_without_user 
FROM orders 
WHERE user_id IS NULL;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'user_id column added to orders table successfully!';
  RAISE NOTICE 'If orders_without_user > 0, you may need to link orders to users manually';
END $$;
