-- Add notification_sent column to orders table
-- Run this in Supabase SQL Editor

-- Add notification_sent column
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS notification_sent BOOLEAN DEFAULT FALSE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_notification_sent 
ON orders(notification_sent) 
WHERE notification_sent = false;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'notification_sent column added successfully!';
  RAISE NOTICE 'Orders will now track whether admin notifications have been sent';
END $$;
