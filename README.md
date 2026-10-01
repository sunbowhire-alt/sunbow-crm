# Sunbow CRM

Sunbow's Phase 1 staff-access release: eight branches, Supabase staff login, Director-approved registration, and live branch-scoped dashboards. The application uses real records only. Empty views mean no operational records have been entered; this release does not include inventory, rentals, quotations, or transactional editing.

## Local setup

1. Copy `.env.example` to `.env.local` and set the Supabase URL and publishable key. No Supabase secret key is used by this application.
2. On a new database, apply `supabase/schema.sql`, then the dated migrations in order through `20261001_harden_phase1_table_grants.sql`. Existing installations should apply only migrations not yet applied. The intended Sunbow Supabase project already has these migrations.
3. Run `npm ci && npm run dev`.
4. New staff register at `/register` with their own email and password, confirm the email, then wait for the active Director to approve the request and assign a branch role in **Staff access**. Signing up alone never grants access. Existing Director-created invitations use `/activate`.
5. Add the exact deployed `/accept-invite` URL to Supabase Auth's redirect allowlist and set the Site URL to the deployed CRM origin. Configure the token-hash email templates in `docs/PHASE1_ACTIVATION.md` for links that work across devices. Set `NEXT_PUBLIC_PASSWORD_RESET_ENABLED=true` only after testing a real recovery email and password change.

## Deployment

This repository is connected to the `sunbow-crm` Vercel project in `sunbowgroup`. Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the target environment. The application has no sample-mode bypass; every dashboard request requires a valid Supabase session and an active staff profile. SQL policies enforce the branch boundary even for direct Data API requests.

Keep Vercel Authentication enabled while testing a preview. For a nationwide staff rollout, confirm a Vercel plan permitting commercial use; verify registration, Director approval, recovery, disabled-account denial, and two-branch isolation with actual accounts; then make the production deployment reachable to staff. Vercel deployment protection is separate from Sunbow staff login. Review `docs/PHASE1_ACTIVATION.md` for release checks.

No Supabase server secret is used by this app. Rotate any secret previously exposed outside a secrets manager before adding server-side features. Production SMTP is configured in Supabase; verify delivery in the staff acceptance flow.

## Scope

This is Phase 1 identity and live reporting. The rest of the ERP job-card scope is tracked in `docs/ERP_ROADMAP.md` and has not been delivered as part of this release.
