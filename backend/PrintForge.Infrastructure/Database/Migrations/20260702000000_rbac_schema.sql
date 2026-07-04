-- New Journey RBAC + tenant schema (Supabase Postgres)
-- Maps CloudPathology permission model to Postgres for Vercel + Render + Supabase deployment.

create extension if not exists "pgcrypto";

create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

insert into tenants (id, name, slug) values
  ('00000000-0000-0000-0000-000000000001', 'New Journey Default', 'default')
on conflict (slug) do nothing;

create table if not exists modules (
  module_id text primary key,
  name text not null,
  description text,
  metadata jsonb default '{}'
);

create table if not exists roles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  name text not null,
  slug text not null,
  description text,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  unique(tenant_id, slug)
);

create table if not exists role_permissions (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references roles(id) on delete cascade,
  module_id text not null references modules(module_id),
  permission_bits int not null default 0,
  unique(role_id, module_id)
);

create table if not exists user_permissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  module_id text not null references modules(module_id),
  permission_bits int not null default 0,
  metadata jsonb default '{}',
  unique(user_id, module_id)
);

create table if not exists disabled_modules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  location_id text not null default 'default',
  module_id text not null references modules(module_id),
  unique(tenant_id, location_id, module_id)
);

-- RLS policies (tenant isolation)
alter table roles enable row level security;
alter table role_permissions enable row level security;
alter table user_permissions enable row level security;

create policy "tenant_roles" on roles
  using (tenant_id::text = coalesce(auth.jwt() ->> 'tenant_id', '00000000-0000-0000-0000-000000000001'));
