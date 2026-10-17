create table if not exists public.manager_accounts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  fpl_entry_id text check (fpl_entry_id is null or fpl_entry_id ~ '^[0-9]{1,12}$'),
  updated_at timestamptz not null default now()
);

create table if not exists public.gameweek_plans (
  user_id uuid not null references auth.users (id) on delete cascade,
  fpl_entry_id text not null check (fpl_entry_id ~ '^[0-9]{1,12}$'),
  event_id integer not null check (event_id between 1 and 50),
  plan_data jsonb not null check (jsonb_typeof(plan_data) = 'object'),
  updated_at timestamptz not null default now(),
  primary key (user_id, fpl_entry_id, event_id)
);

alter table public.manager_accounts enable row level security;
alter table public.gameweek_plans enable row level security;

grant select, insert, update, delete on public.manager_accounts to authenticated;
grant select, insert, update, delete on public.gameweek_plans to authenticated;

drop policy if exists "Managers can access their own account" on public.manager_accounts;
create policy "Managers can access their own account"
  on public.manager_accounts for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Managers can access their own Gameweek plans" on public.gameweek_plans;
create policy "Managers can access their own Gameweek plans"
  on public.gameweek_plans for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.playxi_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists manager_accounts_updated_at on public.manager_accounts;
create trigger manager_accounts_updated_at
  before update on public.manager_accounts
  for each row execute function public.playxi_set_updated_at();

drop trigger if exists gameweek_plans_updated_at on public.gameweek_plans;
create trigger gameweek_plans_updated_at
  before update on public.gameweek_plans
  for each row execute function public.playxi_set_updated_at();
