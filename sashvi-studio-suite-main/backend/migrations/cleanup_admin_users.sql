-- Remove all admin users except the specified one
-- This script will:
-- 1. Delete all users with role 'admin' except admin@sashvistudio.com
-- 2. Ensure the specified admin exists with the correct password

-- First, delete all admin users except the specified one
DELETE FROM users
WHERE role = 'admin'
AND email != 'admin@sashvistudio.com';

-- Check if the specified admin exists, if not create it
-- Note: The password hash needs to be generated using bcrypt
-- For the password 'sashviadmin@6000', you'll need to generate the bcrypt hash
-- You can generate it using a bcrypt tool or the backend's registration endpoint

-- If the admin doesn't exist, insert it (uncomment and update the password hash)
-- INSERT INTO users (id, email, password, name, role, created_at)
-- VALUES (
--   gen_random_uuid(),
--   'admin@sashvistudio.com',
--   '<GENERATED_BCRYPT_HASH_HERE>',
--   'Admin',
--   'admin',
--   NOW()
-- )
-- ON CONFLICT (email) DO NOTHING;

-- Verify the admin users remaining
SELECT id, email, name, role, created_at
FROM users
WHERE role = 'admin';
