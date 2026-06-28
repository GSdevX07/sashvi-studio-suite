-- Create customers table or update users table for customer management
-- Run this in Supabase SQL Editor

-- Ensure users table has all customer-related fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile TEXT DEFAULT '0000000000';
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS city TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS state TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS pincode TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_orders INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_spent NUMERIC DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_order_date TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Users table updated with customer fields successfully!';
  RAISE NOTICE 'Registered customers are now stored in the users table with role = user';
END $$;

-- Verify the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
