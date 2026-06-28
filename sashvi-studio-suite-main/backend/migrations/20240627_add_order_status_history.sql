-- Migration: add order_status_history column to orders table
-- This file should be applied to the Supabase/PostgreSQL database.

ALTER TABLE orders
ADD COLUMN order_status_history JSONB DEFAULT '[]'::jsonb;
