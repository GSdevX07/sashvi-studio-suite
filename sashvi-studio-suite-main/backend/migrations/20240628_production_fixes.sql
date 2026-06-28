-- Production fixes: order item snapshots, coupons, refund fields

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_name TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_image TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS category TEXT;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_discount NUMERIC DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS replacement_reason TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS replacement_description TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_status TEXT;

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

ALTER TABLE order_status_updates ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);
