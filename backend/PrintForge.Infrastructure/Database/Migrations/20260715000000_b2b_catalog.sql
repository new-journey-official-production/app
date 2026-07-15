-- B2B Catalog Management — independent from retail products/categories

create table if not exists b2b_categories (
  id text primary key,
  name text not null,
  slug text not null unique,
  parent_id text references b2b_categories(id) on delete set null,
  short_description text not null default '',
  long_description text not null default '',
  banner text not null default '',
  cover_image text not null default '',
  icon text not null default '',
  seo_title text,
  seo_description text,
  status text not null default 'active',
  display_order integer not null default 0,
  featured boolean not null default false,
  visibility text not null default 'visible',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_b2b_categories_parent on b2b_categories(parent_id);
create index if not exists idx_b2b_categories_status on b2b_categories(status);
create index if not exists idx_b2b_categories_order on b2b_categories(display_order);

create table if not exists b2b_products (
  id text primary key,
  name text not null,
  sku text not null default '',
  slug text not null unique,
  category_id text references b2b_categories(id) on delete set null,
  subcategory_id text references b2b_categories(id) on delete set null,
  brand text not null default '',
  status text not null default 'draft',
  featured boolean not null default false,
  best_seller boolean not null default false,
  new_arrival boolean not null default false,
  retail_price double precision not null default 0,
  wholesale_price double precision not null default 0,
  dealer_price double precision not null default 0,
  min_order_qty integer not null default 1,
  recommended_moq integer not null default 1,
  gst_percent double precision not null default 18,
  discount_percent double precision not null default 0,
  offer_price double precision,
  material text not null default '',
  printer text not null default '',
  printing_technology text not null default '',
  layer_height text not null default '',
  nozzle_size text not null default '',
  infill text not null default '',
  weight_g double precision,
  dimensions text,
  production_time text not null default '',
  lead_time text not null default '',
  packaging text not null default '',
  country_of_origin text not null default 'India',
  colors jsonb not null default '[]',
  customization jsonb not null default '{}',
  hero_image text not null default '',
  gallery jsonb not null default '[]',
  lifestyle_images jsonb not null default '[]',
  white_bg_images jsonb not null default '[]',
  transparent_images jsonb not null default '[]',
  images_360 jsonb not null default '[]',
  videos jsonb not null default '[]',
  overview text not null default '',
  features text not null default '',
  applications text not null default '',
  benefits text not null default '',
  specifications text not null default '',
  package_contents text not null default '',
  care_instructions text not null default '',
  faqs jsonb not null default '[]',
  is_visible boolean not null default true,
  is_downloadable boolean not null default true,
  show_price boolean not null default true,
  show_moq boolean not null default true,
  show_lead_time boolean not null default true,
  recommended boolean not null default false,
  coming_soon boolean not null default false,
  seo_title text,
  seo_description text,
  seo_keywords text,
  og_image text,
  twitter_card text,
  canonical_url text,
  views_count bigint not null default 0,
  downloads_count bigint not null default 0,
  quote_requests_count bigint not null default 0,
  shares_count bigint not null default 0,
  whatsapp_clicks_count bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_b2b_products_category on b2b_products(category_id);
create index if not exists idx_b2b_products_status on b2b_products(status);
create index if not exists idx_b2b_products_visible on b2b_products(is_visible);
create index if not exists idx_b2b_products_featured on b2b_products(featured);
create index if not exists idx_b2b_products_sku on b2b_products(sku);

create table if not exists b2b_quote_requests (
  id text primary key,
  business_name text not null,
  owner_name text not null,
  phone text not null,
  email text not null,
  gst text not null default '',
  address text not null default '',
  product_id text references b2b_products(id) on delete set null,
  product_name text not null default '',
  quantity integer not null default 1,
  customization text not null default '',
  message text not null default '',
  status text not null default 'pending',
  admin_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_b2b_quotes_status on b2b_quote_requests(status);
create index if not exists idx_b2b_quotes_created on b2b_quote_requests(created_at desc);

create table if not exists b2b_dealers (
  id text primary key,
  company_name text not null,
  owner_name text not null,
  phone text not null,
  email text not null,
  gst text not null default '',
  address text not null default '',
  business_type text not null default '',
  categories jsonb not null default '[]',
  monthly_purchase_volume text not null default '',
  status text not null default 'pending',
  admin_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_b2b_dealers_status on b2b_dealers(status);
create index if not exists idx_b2b_dealers_email on b2b_dealers(email);

create table if not exists b2b_analytics_events (
  id text primary key,
  event_type text not null,
  product_id text,
  category_id text,
  metadata jsonb not null default '{}',
  device text not null default '',
  country text not null default '',
  ip_hash text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_b2b_events_type on b2b_analytics_events(event_type);
create index if not exists idx_b2b_events_created on b2b_analytics_events(created_at desc);
create index if not exists idx_b2b_events_product on b2b_analytics_events(product_id);

create table if not exists b2b_settings (
  id text primary key default 'default',
  company_name text not null default 'New Journey Studio',
  tagline text not null default 'Bulk Manufacturing & Wholesale 3D Printing Solutions',
  whatsapp_number text not null default '',
  sales_email text not null default '',
  sales_phone text not null default '',
  catalog_cover_title text not null default 'Wholesale Catalog',
  default_pdf_template text not null default 'modern',
  show_dealer_price_public boolean not null default false,
  hero_image text not null default '',
  updated_at timestamptz not null default now()
);

insert into b2b_settings (id) values ('default') on conflict (id) do nothing;

insert into modules (module_id, name, description) values
  ('/admin/b2b', 'B2B Dashboard', 'B2B catalog management overview'),
  ('/admin/b2b/categories', 'B2B Categories', 'B2B category management'),
  ('/admin/b2b/products', 'B2B Products', 'B2B product management'),
  ('/admin/b2b/catalog', 'B2B Catalog Generator', 'PDF catalog generation'),
  ('/admin/b2b/quotes', 'B2B Quote Requests', 'Wholesale quote request management'),
  ('/admin/b2b/dealers', 'B2B Dealers', 'Dealer registration management'),
  ('/admin/b2b/analytics', 'B2B Analytics', 'B2B catalog analytics'),
  ('/admin/b2b/settings', 'B2B Settings', 'B2B module settings'),
  ('/b2b', 'B2B Portal', 'Public B2B wholesale catalog')
on conflict (module_id) do nothing;
