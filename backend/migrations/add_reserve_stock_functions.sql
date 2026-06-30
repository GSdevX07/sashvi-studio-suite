-- Function to reserve variant stock with row-level locking
CREATE OR REPLACE FUNCTION reserve_variant_stock(
  p_variant_id TEXT,
  p_product_id TEXT,
  p_qty INTEGER
)
RETURNS TABLE(stock INTEGER) AS $$
BEGIN
  -- Lock the row for update to prevent race conditions
  SELECT stock INTO stock FROM product_variants
  WHERE id = p_variant_id AND product_id = p_product_id
  FOR UPDATE;

  -- If stock is sufficient, reserve it by reducing
  IF stock >= p_qty THEN
    UPDATE product_variants
    SET stock = stock - p_qty
    WHERE id = p_variant_id AND product_id = p_product_id;
    RETURN QUERY SELECT stock - p_qty AS stock;
  ELSE
    -- Return current stock (insufficient)
    RETURN QUERY SELECT stock;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to reserve product stock with row-level locking
CREATE OR REPLACE FUNCTION reserve_product_stock(
  p_product_id TEXT,
  p_qty INTEGER
)
RETURNS TABLE(stock INTEGER) AS $$
BEGIN
  -- Lock the row for update to prevent race conditions
  SELECT stock INTO stock FROM products
  WHERE id = p_product_id
  FOR UPDATE;

  -- If stock is sufficient, reserve it by reducing
  IF stock >= p_qty THEN
    UPDATE products
    SET stock = stock - p_qty
    WHERE id = p_product_id;
    RETURN QUERY SELECT stock - p_qty AS stock;
  ELSE
    -- Return current stock (insufficient)
    RETURN QUERY SELECT stock;
  END IF;
END;
$$ LANGUAGE plpgsql;
