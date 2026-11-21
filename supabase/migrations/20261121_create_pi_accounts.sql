
-- DuLichConDen 3.0
-- Secure mapping: one Supabase user <-> one verified Pi identity.

begin;

create table if not exists public.pi_accounts (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null unique
    references auth.users(id) on delete cascade,

  pi_uid text not null unique,
  pi_username text not null default '',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint pi_accounts_pi_uid_not_empty
    check (length(trim(pi_uid)) > 0)
);

-- Automatically maintain updated_at.
create or replace function public.set_pi_accounts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_pi_accounts_updated_at
on public.pi_accounts;

create trigger trg_pi_accounts_updated_at
before update on public.pi_accounts
for each row
execute function public.set_pi_accounts_updated_at();

-- Enable row-level security.
alter table public.pi_accounts enable row level security;

-- Only trusted backend service role may access this mapping.
revoke all on table public.pi_accounts from anon, authenticated;
grant all on table public.pi_accounts to service_role;

-- Prevent ordinary API roles from executing the trigger function.
revoke all on function public.set_pi_accounts_updated_at()
from public, anon, authenticated;

commit;
