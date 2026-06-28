-- Complete Database Schema Fix for Sashvi Studio
-- This migration ensures all tables and columns match frontend/backend requirements
-- Run this in Supabase SQL Editor

-- ============================================================================
-- USERS TABLE
-- ============================================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile TEXT DEFAULT '0000000000';
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture TEXT;

-- ============================================================================
-- CATEGORIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  image TEXT DEFAULT '',
  type TEXT DEFAULT 'sarees',
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- PRODUCTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE,
  name TEXT,
  description TEXT,
  sale_price NUMERIC DEFAULT 0,
  original_price NUMERIC DEFAULT 0,
  image_urls JSONB DEFAULT '[]'::jsonb,
  stock INT DEFAULT 0,
  category_id UUID REFERENCES categories(id),
  is_active BOOLEAN DEFAULT true,
  fabric TEXT DEFAULT '',
  occasion TEXT DEFAULT '',
  work_type TEXT DEFAULT '',
  blouse_included BOOLEAN DEFAULT false,
  length NUMERIC,
  weight NUMERIC,
  featured BOOLEAN DEFAULT false,
  is_bogo BOOLEAN DEFAULT false,
  color TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add any missing columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_price NUMERIC DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS original_price NUMERIC DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '[]'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INT DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS fabric TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS occasion TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS work_type TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS blouse_included BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS length NUMERIC;
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight NUMERIC;
ALTER TABLE products ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_bogo BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '';

-- ============================================================================
-- ORDERS TABLE
-- ============================================================================
-- Add all required columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_id TEXT UNIQUE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS mobile TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pincode TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_amount NUMERIC DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gst_amount NUMERIC DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_charge NUMERIC DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS weekend_discount NUMERIC DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gateway_charge NUMERIC DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_discount NUMERIC DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_status TEXT DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS replacement_reason TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS replacement_description TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_status TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ============================================================================
-- ORDER ITEMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name TEXT,
  product_image TEXT,
  sku TEXT,
  variant TEXT,
  category TEXT,
  quantity INT DEFAULT 1,
  price NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- ORDER STATUS UPDATES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS order_status_updates (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  order_id TEXT NOT NULL,
  previous_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES users(id)
);

-- Create RPC function for order status updates
CREATE OR REPLACE FUNCTION public.update_order_status(p_order_id TEXT, p_new_status TEXT)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_current_status TEXT;
BEGIN
  SELECT order_status INTO v_current_status FROM orders WHERE order_id = p_order_id FOR UPDATE;
  IF v_current_status IS NULL THEN
    RAISE EXCEPTION 'Order % not found', p_order_id;
  END IF;
  UPDATE orders SET order_status = p_new_status, updated_at = now() WHERE order_id = p_order_id;
  INSERT INTO order_status_updates (order_id, previous_status, new_status)
  VALUES (p_order_id, v_current_status, p_new_status);
  PERFORM pg_notify('order_status_change', json_build_object('order_id', p_order_id, 'new_status', p_new_status)::text);
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_order_status(TEXT, TEXT) TO anon, authenticated, service_role;

-- ============================================================================
-- ORDER REQUESTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS order_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  type TEXT NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  admin_remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- COUPONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  category TEXT DEFAULT 'All',
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value NUMERIC NOT NULL DEFAULT 0,
  minimum_purchase NUMERIC DEFAULT 0,
  usage_limit INT DEFAULT 0,
  usage_count INT DEFAULT 0,
  expiry DATE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- REVIEWS TABLE
-- ============================================================================
-- First, try to add columns if table exists (handle existing table with different schema)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'reviews') THEN
    -- Add missing columns if they don't exist
    ALTER TABLE reviews ADD COLUMN IF NOT EXISTS user_name TEXT;
    ALTER TABLE reviews ADD COLUMN IF NOT EXISTS product_id TEXT;
    ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating INT DEFAULT 5;
    ALTER TABLE reviews ADD COLUMN IF NOT EXISTS review TEXT;
    ALTER TABLE reviews ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;
    ALTER TABLE reviews ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;
    ALTER TABLE reviews ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
  ELSE
    -- Create table if it doesn't exist
    CREATE TABLE reviews (
      id BIGSERIAL PRIMARY KEY,
      user_name TEXT,
      product_id TEXT,
      rating INT DEFAULT 5,
      review TEXT,
      verified BOOLEAN DEFAULT false,
      featured BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  END IF;
END $$;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_coupon_code ON orders(coupon_code);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(active);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_verified ON reviews(verified);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

-- ============================================================================
-- SEED DEFAULT CATEGORIES IF EMPTY
-- ============================================================================
INSERT INTO categories (name, type, display_order, is_active)
SELECT * FROM (VALUES
  ('Mysore Silk Sarees', 'sarees', 1, true),
  ('Mul Cotton Sarees', 'sarees', 2, true),
  ('Necklaces', 'jewellery', 1, true),
  ('Bridal Sets', 'jewellery', 2, true),
  ('Saree Combos', 'combos', 1, true)
) AS v(name, type, display_order, is_active)
WHERE NOT EXISTS (SELECT 1 FROM categories LIMIT 1);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS) IF NEEDED
-- ============================================================================
-- Uncomment if you want to enable RLS
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE 'Database schema fix completed successfully!';
  RAISE NOTICE 'Tables verified: users, categories, products, orders, order_items, order_status_updates, order_requests, coupons, reviews';
END $$;
