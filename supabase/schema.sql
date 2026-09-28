-- Sunbow CRM initial schema. Run this in the Supabase SQL editor after creating the project.
create type public.app_role as enum ('director','manager','sales','production','admin');
create type public.lead_status as enum ('new','contacted','quoted','negotiation','won','lost');
create type public.job_status as enum ('queued','in_progress','quality_check','ready','delivered','blocked');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role public.app_role not null default 'sales',
  branch text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  company text,
  branch text,
  address text,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id),
  contact_name text not null,
  phone text,
  product_interest text,
  source text,
  status public.lead_status not null default 'new',
  estimated_value numeric(12,2),
  assigned_to uuid references public.profiles(id),
  next_follow_up timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  customer_id uuid not null references public.customers(id),
  salesperson_id uuid references public.profiles(id),
  description text not null,
  total numeric(12,2) not null default 0,
  deposit numeric(12,2) not null default 0,
  status text not null default 'draft',
  required_date date,
  created_at timestamptz not null default now()
);

create table public.production_jobs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  department text not null,
  status public.job_status not null default 'queued',
  priority integer not null default 3 check (priority between 1 and 5),
  assigned_to uuid references public.profiles(id),
  due_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.activities (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id),
  entity_type text not null,
  entity_id uuid,
  action text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.leads enable row level security;
alter table public.orders enable row level security;
alter table public.production_jobs enable row level security;
alter table public.activities enable row level security;

-- Phase-one access policies are in migrations/20260928_phase1_access.sql.
-- Do not enter operational data before applying that migration and testing
-- the branch/role policies with separate staff accounts.

create index leads_assigned_status_idx on public.leads (assigned_to, status);
create index leads_follow_up_idx on public.leads (next_follow_up) where status not in ('won','lost');
create index jobs_status_due_idx on public.production_jobs (status, due_date);
create index orders_customer_idx on public.orders (customer_id);
