-- Run once on existing Supabase DBs to register the Billing admin module.
insert into modules (module_id, name, description, metadata) values
  ('/admin/billing', 'Billing', 'Payment tracking and invoices', '{"group":"admin"}')
on conflict (module_id) do nothing;
