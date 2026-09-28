# Sunbow CRM

Internal CRM and manufacturing operations platform for Sunbow Tents Manufacture.

## Included in this starter

- Responsive Sunbow-branded login and application shell
- Director, sales and manufacturing dashboards
- Customer database, lead pipeline and user/role screens
- Supabase server/browser client setup
- Initial PostgreSQL schema with row-level security
- Vercel-ready Next.js App Router project

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Add the Supabase URL and publishable key.
3. Run `supabase/schema.sql` and then `supabase/migrations/20260928_phase1_access.sql` in the selected Supabase project's SQL editor. Follow `docs/PHASE1_ACTIVATION.md` for staff profiles and branch checks.
4. Install packages with `npm install`.
5. Start with `npm run dev`.

## Protected Vercel preview

Import this GitHub repository into a `sunbow-crm` Vercel project with the repository root as the Root Directory. Use the Next.js framework preset; the lockfile selects npm. Check that **Deployment Protection / Vercel Authentication** is enabled for Preview deployments before sharing a URL. Deploy a non-production branch to Preview, not Production.

For an interface-only preview, set `SUNBOW_PREVIEW_MODE=true` in the Vercel **Preview** environment only. This bypasses staff sign-in on protected previews and displays clearly marked illustrative records. It does not save data. Never enable this setting on an unprotected deployment.

For a staff-authenticated installation, leave preview mode off, configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, apply the schema and phase-one migration in the selected Supabase project, and provision staff accounts. The `SUPABASE_SECRET_KEY` is reserved for future server features and is not needed by the current UI; never commit it. Staff-authenticated dashboards query live, branch-scoped records and are read-only in this phase.

## Current stage

The protected interface preview uses illustrative records. Operational use requires the intended Supabase project, the phase-one migration, approved staff accounts, and branch-access testing. Later ERP workflows are tracked in `docs/ERP_ROADMAP.md`.
