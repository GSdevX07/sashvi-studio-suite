-- Insert a test BOGO product for testing in combos category
-- First, get the combos category ID
DO $$
DECLARE
  combo_category_id UUID;
BEGIN
  -- Get or create combos category
  SELECT id INTO combo_category_id 
  FROM categories 
  WHERE type = 'combos' AND name = 'Combos'
  LIMIT 1;
  
  IF combo_category_id IS NULL THEN
    -- Create combos category if it doesn't exist
    INSERT INTO categories (type, name, image, description, display_order, is_active)
    VALUES ('combos', 'Combos', '', 'Combo offers', 1, true)
    RETURNING id INTO combo_category_id;
  END IF;
  
  -- Insert test BOGO product
  INSERT INTO products (
    id,
    slug,
    name,
    description,
    sale_price,
    original_price,
    image_urls,
    stock,
    is_active,
    is_bogo,
    category_id,
    created_at
  ) VALUES (
    gen_random_uuid(),
    'test-bogo-combo',
    'Test BOGO Combo',
    'This is a test combo product for Buy 1 Get 1 offer functionality.',
    750,
    750,
    ARRAY['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800'],
    10,
    true,
    true,
    combo_category_id,
    now()
  )
  ON CONFLICT (slug) DO NOTHING;
  
  -- Add category relationship
  INSERT INTO product_categories (product_id, category_id)
  SELECT p.id, combo_category_id
  FROM products p
  WHERE p.slug = 'test-bogo-combo'
  AND NOT EXISTS (
    SELECT 1 FROM product_categories pc 
    WHERE pc.product_id = p.id AND pc.category_id = combo_category_id
  );
END $$;
