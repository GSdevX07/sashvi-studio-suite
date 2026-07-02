-- Create junction table for product-category many-to-many relationship
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, category_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_categories_product_id ON product_categories(product_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_category_id ON product_categories(category_id);

-- Migrate existing single category_id from products to product_categories
INSERT INTO product_categories (product_id, category_id)
SELECT id, category_id FROM products 
WHERE category_id IS NOT NULL 
AND NOT EXISTS (
  SELECT 1 FROM product_categories 
  WHERE product_categories.product_id = products.id 
  AND product_categories.category_id = products.category_id
);

-- Note: We keep the category_id column in products table for backward compatibility
-- but new products should use the product_categories junction table
