-- Restore the Phase 1 least-privilege grants on the live public tables.
-- RLS remains the row boundary; clients only need SELECT for these screens.
begin;

revoke all on table public.branches, public.profiles, public.customers,
  public.leads, public.orders, public.production_jobs, public.activities
  from public, anon, authenticated;

grant select on table public.branches, public.profiles, public.customers,
  public.leads, public.orders, public.production_jobs, public.activities
  to authenticated;

do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'branches', 'profiles', 'customers', 'leads', 'orders',
    'production_jobs', 'activities'
  ] loop
    if pg_catalog.has_table_privilege('anon', 'public.' || v_table, 'SELECT')
       or pg_catalog.has_table_privilege('anon', 'public.' || v_table, 'INSERT')
       or pg_catalog.has_table_privilege('authenticated', 'public.' || v_table, 'INSERT')
       or pg_catalog.has_table_privilege('authenticated', 'public.' || v_table, 'UPDATE')
       or pg_catalog.has_table_privilege('authenticated', 'public.' || v_table, 'DELETE')
       or not pg_catalog.has_table_privilege('authenticated', 'public.' || v_table, 'SELECT') then
      raise exception 'Unexpected client grant on public.%', v_table;
    end if;
  end loop;
end;
$$;

commit;
