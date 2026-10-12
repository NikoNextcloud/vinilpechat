-- Run on a NEW Supabase project in SQL Editor; keep the service-role key on the server only.
create table if not exists public.vinyl_categories (
  id text primary key,
  name text not null,
  description text not null default '',
  icon text not null default '',
  sort_order int not null default 0
);
create table if not exists public.vinyl_products (
  id integer primary key,
  category text not null references public.vinyl_categories(id),
  name text not null,
  description text not null default '',
  sale_price numeric(12,2),
  unit text not null default 'бр.',
  active boolean not null default true,
  source text,
  image text,
  images jsonb not null default '[]'::jsonb,
  supplier_options jsonb not null default '[]'::jsonb,
  price_verification_needed boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists vinyl_products_category_idx on public.vinyl_products(category);
create table if not exists public.vinyl_costs (
  product_id integer primary key references public.vinyl_products(id) on delete cascade,
  supplier_price numeric(12,2)
);
create table if not exists public.vinyl_settings (
  id int primary key default 1 check (id=1),
  brand text not null default 'Винил & Брезенти',
  company text not null default '',
  phone text not null default '',
  email text not null default '',
  address text not null default '',
  shipping text not null default '',
  privacy text not null default ''
);
create table if not exists public.vinyl_orders (
  id text primary key,
  kind text not null check (kind in ('order','contact')),
  status text not null default 'new' check (status in ('new','in_progress','confirmed','completed','cancelled')),
  customer_name text not null,
  phone text not null,
  email text,
  message text,
  items jsonb not null default '[]'::jsonb,
  estimated_total numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);
-- Lock down direct browser access. Server-side endpoints use the service role after admin authentication.
alter table public.vinyl_categories enable row level security;
alter table public.vinyl_products enable row level security;
alter table public.vinyl_costs enable row level security;
alter table public.vinyl_settings enable row level security;
alter table public.vinyl_orders enable row level security;
revoke all on table public.vinyl_costs from anon, authenticated;
revoke all on table public.vinyl_orders from anon, authenticated;
drop policy if exists vinyl_categories_public_read on public.vinyl_categories;
create policy vinyl_categories_public_read on public.vinyl_categories for select to anon,authenticated using (true);
drop policy if exists vinyl_products_public_read on public.vinyl_products;
create policy vinyl_products_public_read on public.vinyl_products for select to anon,authenticated using (active=true);
drop policy if exists vinyl_settings_public_read on public.vinyl_settings;
create policy vinyl_settings_public_read on public.vinyl_settings for select to anon,authenticated using (true);
-- Only public images appear in the shop. Uploads go through the verified server-side admin.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('vinyl-product-images','vinyl-product-images',true,3145728,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=true, file_size_limit=3145728,allowed_mime_types=array['image/jpeg','image/png','image/webp'];
