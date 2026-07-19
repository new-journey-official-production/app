-- Storefront hero settings + product color objects + hero image per product
create table if not exists storefront_settings (
  id text primary key default 'default',
  hero_image text not null default '',
  hero_title text not null default '',
  hero_subtitle text not null default '',
  updated_at timestamptz not null default now()
);

insert into storefront_settings (id) values ('default') on conflict (id) do nothing;

alter table products add column if not exists colors jsonb not null default '[]';
alter table products add column if not exists hero_image text not null default '';
