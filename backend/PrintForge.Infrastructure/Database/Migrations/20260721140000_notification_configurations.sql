-- Admin-configurable customer notification rules (email / in-app / SMS stub).
create table if not exists notification_configurations (
  id text primary key,
  event_key text not null unique,
  event_name text not null,
  description text not null default '',
  enabled boolean not null default true,
  channel_email boolean not null default true,
  channel_in_app boolean not null default true,
  channel_sms boolean not null default false,
  title_template text not null default '',
  body_template text not null default '',
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_notification_configurations_enabled
  on notification_configurations (enabled);

-- Seed default order + payment notification rules.
insert into notification_configurations (
  id, event_key, event_name, description, enabled,
  channel_email, channel_in_app, channel_sms,
  title_template, body_template, display_order
)
select * from (values
  ('ncfg-accepted', 'accepted', 'Order Accepted', 'When order is accepted into production queue', true, true, true, false,
   'Order {{order_no}} accepted', 'Hi {{name}}, your order {{order_no}} has been accepted and queued for production.', 10),
  ('ncfg-printing-started', 'printing_started', 'Production Started', 'When printing / production begins', true, true, true, false,
   'Production started — {{order_no}}', 'Hi {{name}}, production has started for order {{order_no}}.', 20),
  ('ncfg-shipped', 'shipped', 'Order Shipped', 'When order is shipped', true, true, true, false,
   'Order {{order_no}} shipped', 'Hi {{name}}, your order {{order_no}} has been shipped.', 30),
  ('ncfg-out-for-delivery', 'out_for_delivery', 'Out for Delivery', 'When order is out for delivery', true, true, true, false,
   'Out for delivery — {{order_no}}', 'Hi {{name}}, order {{order_no}} is out for delivery.', 40),
  ('ncfg-delivered', 'delivered', 'Order Delivered', 'When order is delivered', true, true, true, false,
   'Delivered — {{order_no}}', 'Hi {{name}}, order {{order_no}} has been delivered. Enjoy!', 50),
  ('ncfg-cancelled', 'cancelled', 'Order Cancelled', 'When order is cancelled', true, true, true, false,
   'Order {{order_no}} cancelled', 'Hi {{name}}, order {{order_no}} has been cancelled.', 60),
  ('ncfg-payment-approved', 'payment_approved', 'Payment Approved', 'When UPI payment is verified', true, true, true, false,
   'Payment approved — {{order_no}}', 'Hi {{name}}, payment for order {{order_no}} ({{total}}) has been approved.', 70),
  ('ncfg-payment-rejected', 'payment_rejected', 'Payment Rejected', 'When UPI payment verification fails', true, true, true, false,
   'Payment failed — {{order_no}}', 'Hi {{name}}, payment for order {{order_no}} could not be verified.', 80),
  ('ncfg-payment-pending-verify', 'payment_verification_pending', 'Payment Verification Pending', 'When customer submits payment proof', false, true, true, false,
   'Payment under review — {{order_no}}', 'Hi {{name}}, we received your payment proof for {{order_no}}. We will verify shortly.', 90)
) as v(id, event_key, event_name, description, enabled, channel_email, channel_in_app, channel_sms, title_template, body_template, display_order)
where not exists (select 1 from notification_configurations limit 1);
