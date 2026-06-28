-- Add jewellery categories if they don't exist
INSERT INTO categories (name, image, type, display_order, is_active) VALUES
  ('Necklaces', '', 'jewellery', 1, true),
  ('Long Haaram', '', 'jewellery', 2, true),
  ('Bridal Sets', '', 'jewellery', 3, true),
  ('Earrings&Jhumkas', '', 'jewellery', 4, true),
  ('Jadau kundan jewellery', '', 'jewellery', 5, true),
  ('Jewellery Under ₹599', '', 'jewellery', 6, true),
  ('Other Jewellery', '', 'jewellery', 7, true)
ON CONFLICT (name) DO NOTHING;

-- Get category IDs for jewellery categories
DO $$
DECLARE
  necklace_id UUID;
  haaram_id UUID;
  bridal_id UUID;
  earrings_id UUID;
  jadau_id UUID;
  under_599_id UUID;
  other_id UUID;
BEGIN
  SELECT id INTO necklace_id FROM categories WHERE name = 'Necklaces' AND type = 'jewellery';
  SELECT id INTO haaram_id FROM categories WHERE name = 'Long Haaram' AND type = 'jewellery';
  SELECT id INTO bridal_id FROM categories WHERE name = 'Bridal Sets' AND type = 'jewellery';
  SELECT id INTO earrings_id FROM categories WHERE name = 'Earrings&Jhumkas' AND type = 'jewellery';
  SELECT id INTO jadau_id FROM categories WHERE name = 'Jadau kundan jewellery' AND type = 'jewellery';
  SELECT id INTO under_599_id FROM categories WHERE name = 'Jewellery Under ₹599' AND type = 'jewellery';
  SELECT id INTO other_id FROM categories WHERE name = 'Other Jewellery' AND type = 'jewellery';
  
  -- Insert Ruby Temple Necklace Set
  INSERT INTO products (slug, name, sale_price, original_price, description, stock, featured, is_bogo, category_id, is_active, created_at, image_urls)
  VALUES (
    'ruby-temple-necklace-set',
    'Ruby Temple Necklace Set',
    3299,
    NULL,
    'South Indian temple jewellery set with rubies and emerald accents in antique gold finish. Includes matching jhumkas.',
    6,
    true,
    false,
    bridal_id,
    true,
    NOW(),
    ARRAY['/p3.jpg']::text[]
  ) ON CONFLICT (slug) DO NOTHING;
  
  -- Insert Antique Gold Pearl Jhumkas
  INSERT INTO products (slug, name, sale_price, original_price, description, stock, featured, is_bogo, category_id, is_active, created_at, image_urls)
  VALUES (
    'antique-gold-pearl-jhumkas',
    'Antique Gold Pearl Jhumkas',
    549,
    799,
    'Statement jhumkas with intricate gold work and pearl drops. Versatile across festive and everyday looks.',
    0,
    false,
    false,
    under_599_id,
    true,
    NOW(),
    ARRAY['/p4.jpg']::text[]
  ) ON CONFLICT (slug) DO NOTHING;
  
  -- Insert Jadau Kundan Bridal Set
  INSERT INTO products (slug, name, sale_price, original_price, description, stock, featured, is_bogo, category_id, is_active, created_at, image_urls)
  VALUES (
    'jadau-kundan-bridal-set',
    'Jadau Kundan Bridal Set',
    9999,
    12999,
    'Heirloom Jadau Kundan necklace set with uncut polki, pearls, and matching earrings. A bridal showstopper.',
    2,
    true,
    false,
    bridal_id,
    true,
    NOW(),
    ARRAY['/p6.jpg']::text[]
  ) ON CONFLICT (slug) DO NOTHING;
END $$;
