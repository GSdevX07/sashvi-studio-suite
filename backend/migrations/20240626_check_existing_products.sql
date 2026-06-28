-- Check existing products in database
SELECT 
  p.id,
  p.slug,
  p.name,
  p.sale_price,
  p.original_price,
  c.name as category_name,
  c.type as category_type,
  p.is_active
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
ORDER BY c.type, p.created_at;

-- Count products by type
SELECT 
  c.type,
  COUNT(*) as product_count
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
GROUP BY c.type;
