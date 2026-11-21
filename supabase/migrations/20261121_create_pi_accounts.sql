-- DuLichConDen 2.0: link one verified Pi Network identity to one existing seller account.
-- Run this in Supabase SQL Editor before deploying the Pi login functions.

create table if not exists public.pi_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  pi_uid text not null unique,
  pi_username text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pi_accounts_pi_uid_not_empty check (length(trim(pi_uid)) > 0)
);

create index if not exists idx_pi_accounts_user_id
  on public.pi_accounts (user_id);

create index if not exists idx_pi_accounts_pi_uid
  on public.pi_accounts (pi_uid);

alter table public.pi_accounts enable row level security;

-- Only the Cloudflare backend's service-role key may access this mapping table.
revoke all on table public.pi_accounts from anon, authenticated;
grant all on table public.pi_accounts to service_role;

