-- Phase 2 Migration — run after schema.sql (Phase 1)
-- Safe to run: uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS

-- Customer profiles
create table if not exists customer_profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  phone text,
  account_type text default 'personal',
  business_name text,
  gstin text,
  pan text,
  email_notifications boolean default true,
  whatsapp_notifications boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Customer addresses
create table if not exists customer_addresses (
  id uuid default gen_random_uuid() primary key,
  customer_id uuid references customer_profiles(id) on delete cascade,
  label text default 'Home',
  full_name text not null,
  phone text not null,
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  pincode text not null,
  country text default 'India',
  is_default boolean default false,
  created_at timestamptz default now()
);

-- Cart
create table if not exists carts (
  id uuid default gen_random_uuid() primary key,
  customer_id uuid references customer_profiles(id) on delete cascade,
  session_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists cart_items (
  id uuid default gen_random_uuid() primary key,
  cart_id uuid references carts(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  quantity int not null default 1,
  added_at timestamptz default now(),
  unique(cart_id, product_id)
);

-- Orders additions
alter table orders add column if not exists customer_id uuid references customer_profiles(id);
alter table orders add column if not exists address_id uuid references customer_addresses(id);
alter table orders add column if not exists gstin text;
alter table orders add column if not exists business_name text;

-- Blog
create table if not exists blog_posts (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  slug text unique not null,
  excerpt text,
  content text,
  cover_image text,
  tags text[],
  is_published boolean default false,
  published_at timestamptz,
  author_name text default 'Circuitkar Team',
  seo_title text,
  seo_description text,
  view_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table customer_profiles enable row level security;
alter table customer_addresses enable row level security;
alter table carts enable row level security;
alter table cart_items enable row level security;
alter table blog_posts enable row level security;

-- Policies (create only if not exists pattern)
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Users manage own profile') then
    create policy "Users manage own profile" on customer_profiles for all using (auth.uid() = id) with check (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users manage own addresses') then
    create policy "Users manage own addresses" on customer_addresses for all using (auth.uid() = customer_id) with check (auth.uid() = customer_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users manage own cart') then
    create policy "Users manage own cart" on carts for all using (auth.uid() = customer_id or session_id is not null) with check (auth.uid() = customer_id or session_id is not null);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users manage own cart items') then
    create policy "Users manage own cart items" on cart_items for all using (
      exists (select 1 from carts where carts.id = cart_items.cart_id and (carts.customer_id = auth.uid() or carts.session_id is not null))
    );
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Public read published posts') then
    create policy "Public read published posts" on blog_posts for select using (is_published = true);
  end if;
end $$;

-- Grants
grant select, insert, update on public.customer_profiles to authenticated;
grant select, insert, update, delete on public.customer_addresses to authenticated;
grant select, insert, update, delete on public.carts to authenticated, anon;
grant select, insert, update, delete on public.cart_items to authenticated, anon;
grant select on public.blog_posts to anon, authenticated;

-- Auto-create profile on signup trigger
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into customer_profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- New settings keys (upsert)
insert into settings (key, value, updated_at) values
  ('launch_mode', 'prelaunch', now()),
  ('maintenance_message', 'We are performing maintenance. Back soon!', now()),
  ('resend_api_key', '', now()),
  ('resend_from_email', 'orders@circuitkar.in', now()),
  ('resend_from_name', 'Circuitkar', now()),
  ('send_order_emails', 'true', now()),
  ('send_notifyme_emails', 'true', now()),
  ('razorpay_key_id_test', '', now()),
  ('razorpay_key_secret_test', '', now()),
  ('razorpay_key_id_live', '', now()),
  ('razorpay_key_secret_live', '', now()),
  ('razorpay_use_live', 'false', now()),
  ('shiprocket_email', '', now()),
  ('shiprocket_password', '', now()),
  ('shiprocket_pickup_location', 'Primary', now()),
  ('shiprocket_auto_create', 'false', now()),
  ('ga_measurement_id', '', now()),
  ('fb_pixel_id', '', now()),
  ('store_email', 'hello@circuitkar.in', now()),
  ('session_timeout_hours', '24', now())
on conflict (key) do nothing;
