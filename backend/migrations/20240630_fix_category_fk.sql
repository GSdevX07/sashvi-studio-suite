-- Fix ambiguous products ↔ categories relationship in Supabase/PostgREST
-- Run only if you still see embed errors after the code fix.

-- List all foreign keys between products and categories:
-- SELECT conname, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'products'::regclass AND confrelid = 'categories'::regclass;

-- Keep category_id as the single canonical link; drop duplicate FK if one exists:
-- ALTER TABLE products DROP CONSTRAINT IF EXISTS products_categories_fkey;
-- ALTER TABLE products DROP CONSTRAINT IF EXISTS fk_products_category;

-- Ensure one clear FK:
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_id_fkey;
ALTER TABLE products
  ADD CONSTRAINT products_category_id_fkey
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;
