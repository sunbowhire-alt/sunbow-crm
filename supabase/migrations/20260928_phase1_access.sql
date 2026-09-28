-- Apply after supabase/schema.sql in the selected Sunbow Supabase project.
-- Review existing branch text before applying; unmatched legacy records stay
-- visible to national directors/admins only until assigned a branch_id.
begin;

create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text unique not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.branches (code, name) values
  ('AMANZIMTOTI', 'Head Office Amanzimtoti'),
  ('DURBAN', 'Durban'),
  ('PRETORIA', 'Pretoria'),
  ('POLOKWANE', 'Polokwane'),
  ('BLOEMFONTEIN', 'Bloemfontein'),
  ('RICHARDS_BAY', 'Richards Bay'),
  ('TZANEEN', 'Tzaneen'),
  ('EAST_LONDON', 'East London')
on conflict (code) do nothing;

alter table public.profiles add column if not exists branch_id uuid references public.branches(id);
alter table public.customers add column if not exists branch_id uuid references public.branches(id);
alter table public.leads add column if not exists branch_id uuid references public.branches(id);
alter table public.orders add column if not exists branch_id uuid references public.branches(id);
alter table public.production_jobs add column if not exists branch_id uuid references public.branches(id);
alter table public.activities add column if not exists branch_id uuid references public.branches(id);

revoke all on public.branches from public, anon;
revoke all on public.profiles, public.customers, public.leads,
  public.orders, public.production_jobs, public.activities from public, anon;
grant select on public.branches, public.profiles, public.customers,
  public.leads, public.orders, public.production_jobs, public.activities to authenticated;
revoke insert, update, delete on public.branches, public.profiles,
  public.customers, public.leads, public.orders, public.production_jobs,
  public.activities from authenticated;

update public.profiles p set branch_id = b.id
from public.branches b
where p.branch_id is null and
  (lower(trim(p.branch)) = lower(b.name) or lower(trim(p.branch)) = lower(replace(b.code, '_', ' '))
   or (b.code = 'AMANZIMTOTI' and lower(trim(p.branch)) = 'amanzimtoti'));
update public.customers c set branch_id = b.id
from public.branches b
where c.branch_id is null and
  (lower(trim(c.branch)) = lower(b.name) or lower(trim(c.branch)) = lower(replace(b.code, '_', ' '))
   or (b.code = 'AMANZIMTOTI' and lower(trim(c.branch)) = 'amanzimtoti'));
update public.leads l set branch_id = c.branch_id
from public.customers c
where l.branch_id is null and l.customer_id = c.id;
update public.leads l set branch_id = p.branch_id
from public.profiles p
where l.branch_id is null and l.assigned_to = p.id;
update public.orders o set branch_id = c.branch_id
from public.customers c
where o.branch_id is null and o.customer_id = c.id;
update public.production_jobs j set branch_id = o.branch_id
from public.orders o
where j.branch_id is null and j.order_id = o.id;

create index if not exists profiles_branch_idx on public.profiles(branch_id);
create index if not exists customers_branch_idx on public.customers(branch_id);
create index if not exists leads_branch_status_idx on public.leads(branch_id, status);
create index if not exists orders_branch_idx on public.orders(branch_id);
create index if not exists jobs_branch_status_idx on public.production_jobs(branch_id, status);
create index if not exists activities_branch_idx on public.activities(branch_id, created_at desc);

-- SECURITY DEFINER reads only the caller's own profile, avoiding recursive
-- profile policies. The functions have an empty search path and are not
-- exposed as HTTP RPC endpoints.
create schema if not exists private;
create or replace function private.active_staff_role()
returns public.app_role
language sql stable security definer set search_path = ''
as $$
  select p.role from public.profiles p
  where p.id = (select auth.uid()) and p.active = true
  limit 1
$$;
create or replace function private.active_staff_branch()
returns uuid
language sql stable security definer set search_path = ''
as $$
  select p.branch_id from public.profiles p
  where p.id = (select auth.uid()) and p.active = true
  limit 1
$$;
create or replace function private.can_read_branch(target uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce(
    (select private.active_staff_role() in ('director', 'admin')
      or (target is not null and private.active_staff_branch() = target)), false)
$$;
revoke all on function private.active_staff_role() from public, anon;
revoke all on function private.active_staff_branch() from public, anon;
revoke all on function private.can_read_branch(uuid) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.active_staff_role() to authenticated;
grant execute on function private.active_staff_branch() to authenticated;
grant execute on function private.can_read_branch(uuid) to authenticated;

alter table public.branches enable row level security;
drop policy if exists "Active staff can read branches" on public.branches;
create policy "Active staff can read branches" on public.branches
  for select to authenticated using ((select private.active_staff_role()) is not null);

drop policy if exists "Authenticated staff can read profiles" on public.profiles;
create policy "Active staff can read allowed profiles" on public.profiles
  for select to authenticated using (
    (select private.active_staff_role()) is not null
    and (id = (select auth.uid()) or (select private.active_staff_role()) in ('director', 'admin'))
  );

drop policy if exists "Authenticated staff can read customers" on public.customers;
drop policy if exists "Authenticated staff can create customers" on public.customers;
drop policy if exists "Authenticated staff can update customers" on public.customers;
create policy "Staff read scoped customers" on public.customers
  for select to authenticated using ((select private.can_read_branch(branch_id)));

drop policy if exists "Authenticated staff can read leads" on public.leads;
drop policy if exists "Authenticated staff can create leads" on public.leads;
drop policy if exists "Authenticated staff can update leads" on public.leads;
create policy "Staff read scoped leads" on public.leads
  for select to authenticated using ((select private.can_read_branch(branch_id)));

drop policy if exists "Authenticated staff can read orders" on public.orders;
create policy "Staff read scoped orders" on public.orders
  for select to authenticated using ((select private.can_read_branch(branch_id)));
drop policy if exists "Authenticated staff can read jobs" on public.production_jobs;
create policy "Staff read scoped jobs" on public.production_jobs
  for select to authenticated using ((select private.can_read_branch(branch_id)));
drop policy if exists "Authenticated staff can read activities" on public.activities;
create policy "Staff read scoped activities" on public.activities
  for select to authenticated using ((select private.can_read_branch(branch_id)));

-- Do not grant browser clients direct writes to audit events or staff profiles.
revoke insert, update, delete on public.activities from anon, authenticated;
revoke insert, update, delete on public.profiles from anon, authenticated;
revoke insert, update, delete on public.branches from anon, authenticated;
commit;
