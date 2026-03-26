-- Run this in your Supabase SQL editor

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  date date not null,
  amount numeric not null,
  type text check (type in ('debit', 'credit')),
  raw_merchant text not null,
  clean_merchant text,
  category text,
  category_source text check (category_source in ('rule', 'ai', 'user')),
  confidence text check (confidence in ('high', 'low')),
  created_at timestamp default now()
);

create table if not exists corrections (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid references transactions(id),
  user_id text not null,
  old_category text,
  new_category text,
  created_at timestamp default now()
);

-- Index for fast user lookups
create index if not exists idx_transactions_user_id on transactions(user_id);
create index if not exists idx_transactions_date on transactions(date desc);
