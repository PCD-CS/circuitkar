-- ============================================================
-- Circuitkar — Database Schema (Supabase / Postgres)
-- Run this first in the Supabase SQL editor.
-- ============================================================

-- Required for gen_random_uuid() on older Postgres versions
create extension if not exists pgcrypto;

-- Categories
create table categories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  description text,
  icon text,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Products
create table products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  description text,
  short_description text,
  price decimal(10,2) not null,
  compare_price decimal(10,2),
  sku text unique,
  category_id uuid references categories(id),
  images text[],
  datasheet_url text,
  specifications jsonb,
  tags text[],
  in_stock boolean default false,
  stock_count int default 0,
  is_featured boolean default false,
  is_active boolean default true,
  weight_grams int,
  interest_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Product interests (notify me)
create table product_interests (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references products(id) on delete cascade,
  email text not null,
  name text,
  ip_address text,
  created_at timestamptz default now(),
  unique(product_id, email)
);

-- Orders (stub, ready for activation)
create table orders (
  id uuid default gen_random_uuid() primary key,
  order_number text unique not null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  shipping_address jsonb not null,
  items jsonb not null,
  subtotal decimal(10,2),
  shipping_charge decimal(10,2) default 0,
  total decimal(10,2),
  status text default 'pending',
  payment_status text default 'pending',
  razorpay_order_id text,
  razorpay_payment_id text,
  shiprocket_order_id text,
  shiprocket_tracking text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Site settings
create table settings (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);

-- Helpful indexes
create index idx_products_category on products(category_id);
create index idx_products_active on products(is_active);
create index idx_products_featured on products(is_featured);
create index idx_interests_product on product_interests(product_id);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table products enable row level security;
alter table categories enable row level security;
alter table product_interests enable row level security;
alter table orders enable row level security;

-- Public read: anyone (anon or authenticated) can browse products and categories
create policy "Public read products" on products for select using (is_active = true);
create policy "Public read categories" on categories for select using (true);

-- Notify-me: anon users can submit interest without signing in
create policy "Public insert interests" on product_interests for insert with check (true);

-- Admin full access is performed via the service role key in API routes,
-- which bypasses RLS. No additional policies required for the admin panel.

-- ============================================================
-- Grants
-- Without explicit grants, even matching RLS policies are blocked.
-- ============================================================

-- Anyone can read products and categories (backs the public RLS policies above)
grant select on public.products to anon, authenticated;
grant select on public.categories to anon, authenticated;

-- Anon users can submit notify-me interests (no login required)
grant insert on public.product_interests to anon, authenticated;

-- Orders: closed to direct API access; the service role (used in API routes) bypasses this.
-- Unlock selectively when the checkout flow goes live.
grant select, insert, update, delete on public.orders to authenticated;

-- Settings: readable by authenticated admins (service role bypasses anyway)
grant select on public.settings to authenticated;

-- ============================================================
-- Interest counter function
-- SECURITY DEFINER so it can update products regardless of the
-- caller's RLS context. Called exclusively via the service-role
-- API route, so we lock down direct execution from anon/public.
-- ============================================================
create or replace function increment_interest_count(p_product_id uuid)
returns int
language plpgsql
security definer
as $$
declare
  new_count int;
begin
  update products
    set interest_count = coalesce(interest_count, 0) + 1
    where id = p_product_id
    returning interest_count into new_count;
  return new_count;
end;
$$;

-- Only allow authenticated callers to invoke this function directly.
-- The service role (used by API routes) bypasses all grant checks.
revoke execute on function increment_interest_count(uuid) from public, anon;
grant execute on function increment_interest_count(uuid) to authenticated;
