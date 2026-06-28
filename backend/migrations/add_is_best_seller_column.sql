-- Add is_best_seller column to products table
ALTER TABLE products 
ADD COLUMN is_best_seller BOOLEAN DEFAULT FALSE;

-- Add comment
COMMENT ON COLUMN products.is_best_seller IS 'Flag to mark product as a best seller for homepage display';
