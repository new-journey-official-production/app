-- Run once in Supabase SQL Editor if login fails and Render bootstrap env is set.
-- Replace YOUR_ADMIN_EMAIL and generate a bcrypt hash for your password (see note below).

-- Option A: after setting AdminEmail + AdminPassword on Render, click "Manual Deploy" —
-- the API creates the admin automatically on startup.

-- Option B: grant modules read access (fixes health check 401 on modules)
grant select on public.modules to anon, authenticated, service_role;
