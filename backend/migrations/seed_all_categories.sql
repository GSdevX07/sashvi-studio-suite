-- Seed all categories from frontend to database
-- Run this in Supabase SQL Editor

-- Clear existing categories (optional - comment out if you want to keep existing data)
-- DELETE FROM categories;

-- Insert Saree Categories
INSERT INTO categories (name, image, type, display_order, is_active) VALUES
  ('Mysore Silk Sarees', '', 'sarees', 1, true),
  ('Mul Cotton Sarees', '', 'sarees', 2, true),
  ('Handloom & Artisanal Sarees', '', 'sarees', 3, true),
  ('Fancy & Designer Sarees', '', 'sarees', 4, true),
  ('Saree & Stitched Blouse Combos', '', 'sarees', 5, true),
  ('Sarees Under ₹999', '', 'sarees', 6, true),
  ('Other Sarees & Blouses', '', 'sarees', 7, true)
ON CONFLICT DO NOTHING;

-- Insert Jewellery Categories
INSERT INTO categories (name, image, type, display_order, is_active) VALUES
  ('Necklaces', '', 'jewellery', 1, true),
  ('Long Haaram', '', 'jewellery', 2, true),
  ('Bridal Sets', '', 'jewellery', 3, true),
  ('Earrings&Jhumkas', '', 'jewellery', 4, true),
  ('Jadau kundan jewellery', '', 'jewellery', 5, true),
  ('Jewellery Under ₹599', '', 'jewellery', 6, true),
  ('Other Jewellery', '', 'jewellery', 7, true)
ON CONFLICT DO NOTHING;

-- Insert Combo Categories
INSERT INTO categories (name, image, type, display_order, is_active) VALUES
  ('Saree & Jewellery Combos', '', 'combos', 1, true),
  ('Buy 1 Get 1 Offers', '', 'combos', 2, true)
ON CONFLICT DO NOTHING;

-- Verify insertion
SELECT * FROM categories ORDER BY type, display_order;
