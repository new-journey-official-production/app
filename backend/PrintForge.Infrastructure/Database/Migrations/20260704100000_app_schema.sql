-- New Journey application schema (Supabase Postgres)
-- Run after 20260702000000_rbac_schema.sql

create table if not exists users (
  id text primary key,
  email text not null unique,
  password_hash text not null,
  name text not null,
  phone text,
  role text not null default 'customer',
  role_id text,
  avatar_url text,
  email_verified boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_users_role on users(role);
create index if not exists idx_users_role_id on users(role_id);

create table if not exists categories (
  id text primary key,
  name text not null,
  slug text not null unique,
  icon text not null default '',
  image text not null default ''
);

create table if not exists products (
  id text primary key,
  name text not null,
  slug text not null unique,
  description text not null default '',
  short_description text not null default '',
  category_slug text not null,
  price double precision not null,
  discount_price double precision,
  stock integer not null default 0,
  material text not null default 'PLA',
  weight_g double precision,
  dimensions text,
  print_time_hours double precision,
  color_variants jsonb not null default '[]',
  images jsonb not null default '[]',
  tags jsonb not null default '[]',
  featured boolean not null default false,
  is_active boolean not null default true,
  seo_title text,
  seo_description text,
  rating_avg double precision not null default 0,
  rating_count integer not null default 0,
  orders_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_products_category on products(category_slug);
create index if not exists idx_products_active on products(is_active);

create table if not exists reviews (
  id text primary key,
  product_id text not null references products(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,
  user_name text,
  rating integer not null,
  title text not null default '',
  comment text not null default '',
  approved boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_reviews_product on reviews(product_id);

create table if not exists wishlist (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  product_id text not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, product_id)
);

create table if not exists addresses (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  label text not null default 'Home',
  full_name text not null,
  phone text not null,
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  postal_code text not null,
  country text not null default 'India',
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_addresses_user on addresses(user_id);

create table if not exists coupons (
  id text primary key,
  code text not null unique,
  kind text not null default 'percent',
  value double precision not null,
  min_order double precision not null default 0,
  max_discount double precision,
  is_active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id text primary key,
  order_no text not null unique,
  user_id text not null references users(id),
  user_email text not null,
  items jsonb not null default '[]',
  address jsonb not null default '{}',
  payment_method text not null,
  coupon_code text,
  subtotal double precision not null,
  shipping double precision not null default 0,
  gst double precision not null default 0,
  discount double precision not null default 0,
  total double precision not null,
  status text not null default 'placed',
  timeline jsonb not null default '[]',
  notes text,
  priority text not null default 'normal',
  printer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_user on orders(user_id);
create index if not exists idx_orders_status on orders(status);

create table if not exists inventory (
  id text primary key,
  name text not null,
  kind text not null default 'filament',
  material text,
  color text,
  quantity double precision not null default 0,
  unit text not null default 'kg',
  reorder_level double precision not null default 0,
  unit_cost double precision not null default 0,
  supplier text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists printers (
  id text primary key,
  name text not null,
  model text not null,
  status text not null default 'idle',
  nozzle_size text not null default '0.4mm',
  filament_loaded text,
  current_job text,
  total_hours double precision not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists tickets (
  id text primary key,
  user_id text not null references users(id),
  user_name text,
  user_email text not null,
  subject text not null,
  order_no text,
  status text not null default 'open',
  messages jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists notifications (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  title text not null,
  message text not null,
  kind text not null default '',
  ref_id text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on notifications(user_id);

create table if not exists blog_posts (
  id text primary key,
  title text not null,
  slug text not null unique,
  excerpt text not null default '',
  content text not null default '',
  cover_image text,
  tags jsonb not null default '[]',
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists media (
  id text primary key,
  filename text not null,
  content_type text not null,
  size integer not null,
  data text not null,
  created_at timestamptz not null default now(),
  uploaded_by text not null default ''
);

create table if not exists activity_logs (
  id text primary key,
  user_id text,
  user_email text,
  user_name text,
  action text not null,
  target text not null,
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists payments (
  id text primary key,
  order_id text not null references orders(id),
  method text not null,
  amount double precision not null,
  status text not null,
  transaction_id text not null,
  created_at timestamptz not null default now()
);

create table if not exists password_resets (
  id text primary key,
  token text not null unique,
  user_id text not null references users(id) on delete cascade,
  expires_at timestamptz not null,
  used boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists email_log (
  id text primary key,
  recipient text not null,
  template text not null,
  body text not null,
  context jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists newsletter (
  id text primary key,
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists contact_messages (
  id text primary key,
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  created_at timestamptz not null default now()
);

-- Align RBAC user_permissions.user_id with text app user ids
alter table user_permissions alter column user_id type text using user_id::text;
