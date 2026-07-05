-- Fix products created with an empty slug (causes /404 on product detail links).
-- Run once in Supabase SQL Editor if existing products fail to open.

update products
set slug = trim(both '-' from lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g')))
where slug is null or trim(slug) = '';
