-- Backfill order_items for existing orders that don't have items
-- This is a temporary fix for orders created before order_items insertion was working

-- Insert sample order items for order SS-20260626-68936
INSERT INTO order_items (order_id, product_id, variant_id, quantity, price)
SELECT 
  o.order_id,
  '377c34eb-ba50-49fe-8fc3-886621192ea9'::uuid,
  NULL,
  12,
  599
FROM orders o
WHERE o.order_id = 'SS-20260626-68936'
AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.order_id);

-- Insert sample order items for order SS-20260626-35451
INSERT INTO order_items (order_id, product_id, variant_id, quantity, price)
SELECT 
  o.order_id,
  '377c34eb-ba50-49fe-8fc3-886621192ea9'::uuid,
  NULL,
  10,
  599
FROM orders o
WHERE o.order_id = 'SS-20260626-35451'
AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.order_id);
