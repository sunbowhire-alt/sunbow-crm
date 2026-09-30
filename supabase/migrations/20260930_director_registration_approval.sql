-- Staff may register, but only a verified Director may create their active profile.
begin;

create table if not exists private.staff_registration_requests (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id),
  assigned_role public.app_role,
  assigned_branch_id uuid references public.branches(id)
);
create index if not exists staff_registration_pending_idx
  on private.staff_registration_requests (requested_at desc) where status = 'pending';
alter table private.staff_registration_requests enable row level security;
revoke all on private.staff_registration_requests from public, anon, authenticated;

create or replace function public.request_staff_registration() returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_user auth.users%rowtype;
  v_name text;
  v_status text;
begin
  select * into v_user from auth.users where id = auth.uid();
  if v_user.id is null or v_user.email_confirmed_at is null then
    raise exception 'Confirm your email before requesting staff access';
  end if;
  if exists (select 1 from public.profiles where id = v_user.id) then
    return 'has_account';
  end if;
  -- This marker identifies signups through the CRM form; it never grants a role.
  if v_user.raw_user_meta_data->>'sunbow_registration' is distinct from 'staff' then
    return 'unavailable';
  end if;
  v_name := trim(v_user.raw_user_meta_data->>'full_name');
  if v_name is null or length(v_name) < 2 or length(v_name) > 120 then
    raise exception 'A valid full name is required';
  end if;
  insert into private.staff_registration_requests (user_id, email, full_name)
  values (v_user.id, lower(v_user.email), v_name)
  on conflict (user_id) do nothing;
  select r.status into v_status from private.staff_registration_requests r
  where r.user_id = v_user.id;
  return v_status;
end;
$$;

create or replace function public.pending_staff_registrations()
returns table (user_id uuid, email text, full_name text, requested_at timestamptz)
language plpgsql security definer set search_path = ''
as $$
begin
  if private.active_staff_role() is distinct from 'director' then
    raise exception 'Only an active Director may review registrations';
  end if;
  return query
    select r.user_id, r.email, r.full_name, r.requested_at
    from private.staff_registration_requests r
    join auth.users u on u.id = r.user_id and lower(u.email) = r.email
    where r.status = 'pending' and u.email_confirmed_at is not null
      and not exists (select 1 from public.profiles p where p.id = r.user_id)
    order by r.requested_at asc
    limit 200;
end;
$$;

create or replace function public.review_staff_registration(
  p_user_id uuid, p_approve boolean, p_role public.app_role default null,
  p_branch_id uuid default null
) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_request private.staff_registration_requests%rowtype;
begin
  if private.active_staff_role() is distinct from 'director' then
    raise exception 'Only an active Director may approve registrations';
  end if;
  select * into v_request from private.staff_registration_requests
  where user_id = p_user_id and status = 'pending' for update;
  if v_request.user_id is null then raise exception 'Pending registration not found'; end if;
  if not exists (
    select 1 from auth.users u where u.id = p_user_id
      and lower(u.email) = v_request.email and u.email_confirmed_at is not null
  ) then raise exception 'The email address must be verified'; end if;
  if exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'This staff profile already exists';
  end if;

  if p_approve then
    if p_role not in ('manager', 'sales', 'production') or
       not exists (select 1 from public.branches b where b.id = p_branch_id and b.active) then
      raise exception 'Choose a valid staff role and active branch';
    end if;
    insert into public.profiles (id, full_name, role, branch_id, active)
    values (p_user_id, v_request.full_name, p_role, p_branch_id, true);
  end if;
  update private.staff_registration_requests
    set status = case when p_approve then 'approved' else 'rejected' end,
        reviewed_by = auth.uid(), reviewed_at = now(),
        assigned_role = case when p_approve then p_role else null end,
        assigned_branch_id = case when p_approve then p_branch_id else null end
  where user_id = p_user_id;
  insert into public.activities (actor_id, entity_type, entity_id, action, branch_id)
  values (auth.uid(), 'profile', p_user_id,
          case when p_approve then 'staff_registration_approved' else 'staff_registration_rejected' end,
          case when p_approve then p_branch_id else null end);
end;
$$;

-- Legacy invitations and profile edits must also be Director-authorized.
create or replace function public.invite_staff(
  p_email text, p_full_name text, p_role public.app_role, p_branch_id uuid default null
) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_email text := lower(trim(p_email));
begin
  if private.active_staff_role() is distinct from 'director' then
    raise exception 'Only an active Director may invite staff';
  end if;
  if v_email is null or length(v_email) > 254 or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
     or nullif(trim(p_full_name), '') is null or length(p_full_name) > 120 then
    raise exception 'Enter a valid email address and name';
  end if;
  if not ((p_role = 'director' and p_branch_id is null)
       or (p_role in ('manager', 'sales', 'production') and exists (
         select 1 from public.branches b where b.id = p_branch_id and b.active))) then
    raise exception 'Choose a valid role and branch';
  end if;
  if exists (select 1 from auth.users u join public.profiles p on p.id = u.id
             where lower(u.email) = v_email) then
    raise exception 'This staff account already exists. Change its role in Staff access.';
  end if;
  insert into public.staff_invitations (email, full_name, role, branch_id, invited_by)
  values (v_email, trim(p_full_name), p_role, p_branch_id, auth.uid())
  on conflict (email) do update set full_name = excluded.full_name, role = excluded.role,
    branch_id = excluded.branch_id, invited_by = excluded.invited_by,
    created_at = now(), claimed_by = null, claimed_at = null;
end;
$$;

create or replace function public.manage_staff_profile(
  p_user_id uuid, p_role public.app_role, p_branch_id uuid, p_active boolean
) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if private.active_staff_role() is distinct from 'director' then
    raise exception 'Only an active Director may manage staff access';
  end if;
  if p_user_id = auth.uid() then raise exception 'You cannot change your own access'; end if;
  if not ((p_role = 'director' and p_branch_id is null)
       or (p_role in ('manager', 'sales', 'production') and exists (
         select 1 from public.branches b where b.id = p_branch_id and b.active))) then
    raise exception 'Choose a valid role and branch';
  end if;
  update public.profiles set role = p_role, branch_id = p_branch_id, active = p_active
  where id = p_user_id;
  if not found then raise exception 'Staff profile not found'; end if;
  insert into public.activities (actor_id, entity_type, entity_id, action, branch_id, detail)
  values (auth.uid(), 'profile', p_user_id, 'staff_access_updated', p_branch_id,
          pg_catalog.jsonb_build_object('role', p_role, 'active', p_active));
end;
$$;

drop policy if exists "Admins read invitations" on public.staff_invitations;
create policy "Directors read invitations" on public.staff_invitations
  for select to authenticated using ((select private.active_staff_role()) = 'director');

revoke all on function public.request_staff_registration() from public, anon;
revoke all on function public.pending_staff_registrations() from public, anon;
revoke all on function public.review_staff_registration(uuid, boolean, public.app_role, uuid) from public, anon;
grant execute on function public.request_staff_registration() to authenticated;
grant execute on function public.pending_staff_registrations() to authenticated;
grant execute on function public.review_staff_registration(uuid, boolean, public.app_role, uuid) to authenticated;
commit;
