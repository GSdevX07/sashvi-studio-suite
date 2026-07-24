-- Check if reviews have user_id populated
SELECT id, user_id, user_name, product_id FROM reviews LIMIT 10;

-- If user_id is NULL for existing reviews, we need to backfill them
-- This happens if reviews were created before the user_id column was properly set

-- First, let's see which reviews have NULL user_id
SELECT COUNT(*) as null_user_id_count FROM reviews WHERE user_id IS NULL;
