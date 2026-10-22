create table if not exists public.gameweek_payment_orders (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  fpl_entry_id text not null check (fpl_entry_id ~ '^[0-9]{1,12}$'),
  event_id integer not null check (event_id between 1 and 50),
  checkout_session_id text unique,
  payment_id text unique,
  status text not null default 'pending' check (status in ('pending', 'paid', 'refunded')),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists gameweek_payment_orders_entitlement_idx
  on public.gameweek_payment_orders (user_id, fpl_entry_id, event_id, status);

alter table public.gameweek_payment_orders enable row level security;
grant select on public.gameweek_payment_orders to authenticated;
revoke insert, update, delete on public.gameweek_payment_orders from anon, authenticated;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'gameweek_payment_orders'
      and policyname = 'Managers can view their own Gameweek payments'
  ) then
    create policy "Managers can view their own Gameweek payments"
      on public.gameweek_payment_orders for select to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;
