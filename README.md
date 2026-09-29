# Sunbow CRM

Sunbow's first staff-access release: eight branches, Supabase staff login, live branch-scoped dashboards, and admin-managed roles. The application uses real records only. Empty views mean no records have been entered; this release does not include inventory, rentals, quotations, or transactional editing.

## Local setup

1. Copy `.env.example` to `.env.local` and set the Supabase URL and publishable key. No Supabase secret key is used by this application.
2. Apply `supabase/schema.sql`, then `supabase/migrations/20260928_phase1_access.sql`, then `supabase/migrations/20260929_staff_access.sql` to the intended Sunbow project. Existing installations should apply only migrations not yet applied.
3. Run `npm ci && npm run dev`.
4. Use an existing active `admin` profile (Shane) to invite staff from **Users & roles**. An admin saves the approved email and role; the person opens `/activate`, verifies that email through Supabase, and sets their own password. Existing active users can use **Forgot password?**.
5. Add the exact deployed `/accept-invite` URL to Supabase Auth's redirect allowlist and set the site URL to the deployed CRM origin. Set `NEXT_PUBLIC_PASSWORD_RESET_ENABLED=true` only after verifying that destination and testing a real email link.

## Deployment

This repository is connected to the `sunbow-crm` Vercel project in `sunbowgroup`. Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the target environment. The application has no sample-mode bypass; every dashboard request requires a valid Supabase session and an active staff profile. SQL policies enforce the branch boundary even for direct Data API requests.

Keep Vercel Authentication enabled while testing a preview. For a nationwide staff rollout, verify the login, email recovery, admin role changes, and two-branch isolation with actual accounts, then make the app reachable to staff through Vercel settings. Disabling Vercel Authentication does not bypass Sunbow staff login. Review `docs/PHASE1_ACTIVATION.md` for release checks.

The leaked Supabase server secret from the earlier chat is not used here and should be rotated in Supabase before any server-side features are added. For nationwide email activation, configure a production SMTP provider; Supabase's default email sender is rate limited.

## Scope

This is Phase 1 identity and live reporting. The rest of the ERP job-card scope is tracked in `docs/ERP_ROADMAP.md` and has not been delivered as part of this release.
