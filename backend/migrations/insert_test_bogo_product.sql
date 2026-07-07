-- Insert a test BOGO product for testing
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
  created_at
) VALUES (
  gen_random_uuid(),
  'test-bogo-saree',
  'Test BOGO Saree',
  'This is a test product for Buy 1 Get 1 offer functionality.',
  750,
  750,
  ARRAY['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800'],
  10,
  true,
  true,
  now()
)
ON CONFLICT (slug) DO NOTHING;
