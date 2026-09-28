# Phase 1 activation: staff login and live branch dashboards

The application code is ready to read real records, but it must be connected to the **intended Sunbow Supabase project** before operational use. Do not put customer or staff data into an unverified project or use the sample-only preview mode for live data.

## Configuration sequence

1. Confirm the Sunbow-owned Supabase project and its Project URL. Rotate any secret key that was previously shared outside the project's secret manager. The current read-only dashboards do not need a service-role/secret key.
2. In that project's SQL editor, apply `supabase/schema.sql` if the initial tables do not yet exist, followed by `supabase/migrations/20260928_phase1_access.sql`. If the schema already exists, apply only the migration. Keep a database backup before migrating existing records.
3. Inspect legacy profiles/customers/leads/orders/jobs whose `branch_id` remains null. Assign the intended branch after reconciling the old branch text. Branch staff cannot see unassigned rows; directors/admins can inspect them. Do not guess a branch.
4. Create the first staff account in Supabase Auth, then insert its `profiles` row using that user's Auth UUID, full name, `role='director'`, `active=true`, and a null `branch_id`. Create branch staff accounts with `role='manager'|'sales'|'production'` and an actual `branches.id`. An active Auth account without a matching active profile cannot sign in to the CRM.
5. Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in Vercel for the intended environment, redeploy, and verify the sign-in page. Keep Vercel Authentication enabled while the rollout remains private. `SUNBOW_PREVIEW_MODE` must be false or absent in operational deployments.
6. Test with a director plus two branch users from different branches. The director must see national and branch-filtered counts; each branch user must see only their branch records. Test direct Supabase API reads and writes, not only the UI. Confirm disabled/unprofiled users are denied.
7. Reconcile each live dashboard count against the database and source records. The dashboard shows live counts of customers, leads, orders, and production jobs; it does **not** yet calculate revenue, stock, rentals, or cross-system figures.

## Staff provisioning example

After creating the Auth user in the selected Supabase project, retrieve the actual UUID from Auth > Users. In the SQL editor, substitute the UUID, name, role, and branch intentionally:

```sql
insert into public.profiles (id, full_name, role, branch_id, active)
values (
  '<AUTH_USER_UUID>'::uuid,
  '<STAFF_NAME>',
  'sales',
  (select id from public.branches where code = 'DURBAN'),
  true
);
```

For a nationwide director, use `role='director'` and `branch_id=null`. Never give a branch user the director/admin role solely to make a dashboard work.

## Acceptance before nationwide staff rollout

- All eight branch areas are present and correctly named.
- Every staff member has an approved role and branch assignment; directors/admins are explicitly approved for nationwide access.
- A direct query as a Durban user cannot retrieve or edit a Pretoria customer or lead.
- A disabled or unprofiled Auth user cannot access dashboard data.
- The preview sample banner never appears on a live staff session; live dashboards do not contain example figures.
- Current login, branch switch, sign-out, and empty-data views work on desktop and mobile.

The Phase 1 release is read-only for dashboards. Customer/lead editing, staff invitations, transactions, stock, and rental workflows require later implementation and acceptance.
