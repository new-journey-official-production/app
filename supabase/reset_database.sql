-- =============================================================================
-- DESTRUCTIVE: Wipes all tables in public schema (Supabase SQL Editor only).
-- Run this once when resetting a messy database, then redeploy the API or run
-- supabase/migrations/20260705000000_master_schema.sql manually.
-- =============================================================================

drop schema if exists public cascade;

create schema public;

grant all on schema public to postgres;
grant all on schema public to anon;
grant all on schema public to authenticated;
grant all on schema public to service_role;
