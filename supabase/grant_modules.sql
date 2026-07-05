-- Fix admin login: set Render AdminPassword to your chosen password, then Manual Deploy.
-- On startup the API syncs password_hash for configured AdminEmail automatically.
--
-- Verify in browser after deploy:
--   https://newjourney-api.onrender.com/api/health
-- Look for:
--   bootstrap.configured_admin_email  -> login with THIS email
--   bootstrap.admin_account_exists    -> must be true
--
-- Login password must exactly match Render env var AdminPassword (not .env.example).

grant select on public.modules to anon, authenticated, service_role;
