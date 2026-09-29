-- Apply after 20260928_phase1_access.sql. Staff are invited by an active CRM
-- admin and claim access only after Supabase has verified their email address.
begin;

create table if not exists public.staff_invitations (
  email text primary key,
  full_name text not null,
  role public.app_role not null,
  branch_id uuid references public.branches(id),
  invited_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  claimed_by uuid references auth.users(id),
  claimed_at timestamptz,
  constraint staff_invitations_email_normalized check (email = lower(trim(email))),
  constraint staff_invitations_role_branch check (
    (role in ('director', 'admin') and branch_id is null)
    or (role in ('manager', 'sales', 'production') and branch_id is not null)
  )
);

alter table public.staff_invitations enable row level security;
revoke all on public.staff_invitations from public, anon, authenticated;
grant select on public.staff_invitations to authenticated;
create policy "Admins read invitations" on public.staff_invitations
  for select to authenticated using ((select private.active_staff_role()) = 'admin');

create or replace function public.invite_staff(
  p_email text, p_full_name text, p_role public.app_role, p_branch_id uuid default null
) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_email text := lower(trim(p_email));
begin
  if private.active_staff_role() is distinct from 'admin' then
    raise exception 'Only an active admin may invite staff';
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

create or replace function public.claim_staff_invitation() returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  v_user auth.users%rowtype;
  v_invite public.staff_invitations%rowtype;
begin
  select * into v_user from auth.users where id = auth.uid();
  if v_user.id is null or v_user.email_confirmed_at is null then return false; end if;
  if exists (select 1 from public.profiles where id = v_user.id) then return false; end if;

  select * into v_invite from public.staff_invitations
  where email = lower(v_user.email) and claimed_at is null for update;
  if v_invite.email is null then return false; end if;
  insert into public.profiles (id, full_name, role, branch_id, active)
  values (v_user.id, v_invite.full_name, v_invite.role, v_invite.branch_id, true);
  update public.staff_invitations set claimed_by = v_user.id, claimed_at = now()
  where email = v_invite.email;
  insert into public.activities (actor_id, entity_type, entity_id, action, branch_id)
  values (v_invite.invited_by, 'profile', v_user.id, 'staff_invitation_claimed', v_invite.branch_id);
  return true;
end;
$$;

create or replace function public.manage_staff_profile(
  p_user_id uuid, p_role public.app_role, p_branch_id uuid, p_active boolean
) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if private.active_staff_role() is distinct from 'admin' then
    raise exception 'Only an active admin may manage staff access';
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

revoke all on function public.invite_staff(text, text, public.app_role, uuid) from public, anon;
revoke all on function public.claim_staff_invitation() from public, anon;
revoke all on function public.manage_staff_profile(uuid, public.app_role, uuid, boolean) from public, anon;
grant execute on function public.invite_staff(text, text, public.app_role, uuid) to authenticated;
grant execute on function public.claim_staff_invitation() to authenticated;
grant execute on function public.manage_staff_profile(uuid, public.app_role, uuid, boolean) to authenticated;
commit;
