-- UPI payment configuration + manual verification fields on payments (PaymentTransaction).
-- Future gateways (Razorpay/Cashfree/COD) reuse payments.method / payments.gateway_provider.

create table if not exists payment_configurations (
  id text primary key,
  payment_method_name text not null,
  payment_method_type text not null check (payment_method_type in ('upi', 'gateway', 'cod')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  merchant_name text not null default '',
  business_name text not null default '',
  upi_id text not null default '',
  qr_type text not null default 'dynamic' check (qr_type in ('dynamic', 'static')),
  static_qr_url text not null default '',
  instructions text not null default '',
  min_amount double precision,
  max_amount double precision,
  display_order integer not null default 0,
  gateway_provider text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_payment_configurations_type_status
  on payment_configurations (payment_method_type, status);

create index if not exists idx_payment_configurations_display
  on payment_configurations (display_order);

-- Extend payments to act as PaymentTransaction with proof + approval audit trail.
alter table payments add column if not exists upi_transaction_id text not null default '';
alter table payments add column if not exists screenshot_url text not null default '';
alter table payments add column if not exists payment_note text not null default '';
alter table payments add column if not exists verified_by text not null default '';
alter table payments add column if not exists verified_date text not null default '';
alter table payments add column if not exists rejection_reason text not null default '';
alter table payments add column if not exists submitted_at text not null default '';
alter table payments add column if not exists qr_payload text not null default '';
alter table payments add column if not exists gateway_provider text not null default '';
alter table payments add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_payments_status on payments (status);
create index if not exists idx_payments_method on payments (method);
create index if not exists idx_payments_submitted_at on payments (submitted_at);

-- Compatibility view matching the PaymentTransaction naming in product docs.
create or replace view payment_transactions as
select
  id,
  order_id,
  amount,
  method as payment_method,
  upi_transaction_id,
  screenshot_url,
  status,
  verified_by,
  verified_date,
  rejection_reason,
  payment_note,
  submitted_at,
  qr_payload,
  gateway_provider,
  transaction_id,
  created_at,
  updated_at
from payments;

-- Seed default UPI configuration when none exists.
insert into payment_configurations (
  id, payment_method_name, payment_method_type, status,
  merchant_name, business_name, upi_id, qr_type, static_qr_url,
  instructions, min_amount, max_amount, display_order, gateway_provider
)
select
  'paycfg-upi-default',
  'UPI Payment',
  'upi',
  'active',
  'New Journey',
  'New Journey 3D Printing',
  'tareaditya08-1@oksbi',
  'dynamic',
  '',
  E'Scan the QR using any UPI application.\nComplete the payment for the exact order amount.\nUpload your payment screenshot and enter the UPI transaction ID.\nYour order will be verified shortly by our team.',
  null,
  null,
  1,
  ''
where not exists (select 1 from payment_configurations limit 1);
