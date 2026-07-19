-- Company finance ledger: expenses, income, bills, and manual adjustments
create table if not exists finance_entries (
  id text primary key,
  kind text not null check (kind in ('expense', 'income', 'bill')),
  title text not null,
  amount double precision not null default 0,
  category text not null default '',
  status text not null default 'pending' check (status in ('pending', 'paid', 'received', 'cancelled')),
  reference_id text not null default '',
  due_date text not null default '',
  paid_at text not null default '',
  notes text not null default '',
  created_by text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_finance_entries_kind on finance_entries (kind);
create index if not exists idx_finance_entries_status on finance_entries (status);
