-- Add COD charge columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cod_charge NUMERIC DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cod_for_advance NUMERIC DEFAULT 0;
