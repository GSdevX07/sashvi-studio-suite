-- Supabase / Postgres migration for initial tables
-- Run this in Supabase SQL editor

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text unique not null,
  password_hash text,
  is_verified boolean default false,
  is_admin boolean default false,
  verify_token text,
  verify_expires timestamptz,
  created_at timestamptz default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  title text,
  slug text unique,
  description text,
  price int,
  images jsonb,
  tags text[],
  is_new boolean default false,
  is_featured boolean default false,
  created_at timestamptz default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  items jsonb,
  shipping jsonb,
  payment_mode text,
  product_total int,
  delivery int,
  cod_charge int,
  gateway_charge int,
  total int,
  status text,
  razorpay_payment_id text,
  created_at timestamptz default now()
);
