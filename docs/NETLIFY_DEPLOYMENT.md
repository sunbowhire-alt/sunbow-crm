# Netlify deployment for Sunbow CRM Phase 1

Netlify hosts the Next.js application. The existing Supabase project `zwwdfywvxhdgdgtnltml` continues to provide authentication and data. There is no database migration involved in changing hosts.

## Connect the project

1. Finish signing in or creating the Sunbow Netlify account. Import `sunbowhire-alt/sunbow-crm` from GitHub as a new project.
2. Select `nationwide-v1` as the production branch while Phase 1 is being verified. Use the repository root as the base directory. Let Netlify detect Next.js and its build settings; no static export or custom adapter is needed.
3. Before deploying, set these Netlify environment variables for builds and functions:

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | The URL of Supabase project `zwwdfywvxhdgdgtnltml` |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | That project's publishable key, never its secret or service-role key |
   | `NEXT_PUBLIC_PASSWORD_RESET_ENABLED` | `false` until a real reset completes successfully |

4. Deploy and record the exact HTTPS project URL. Limit access to the test accounts until the HTTPS page, redirect and branch authorization checks have passed. Keep the existing Vercel preview separate.

## Point email links at Netlify

1. In Supabase Authentication URL Configuration, set the Site URL to the exact Netlify production origin and add the exact `https://<netlify-host>/accept-invite` URL to the redirect allow list. Add a later custom domain only when that domain is serving the same deployed application.
2. Check the confirmation, magic-link and recovery templates against `docs/PHASE1_ACTIVATION.md`. Token-hash links permit the recipient to open an invitation on their own phone or browser. Confirm the configured SMTP sender can deliver a fresh message.
3. Complete the real-account checks in `docs/PHASE1_ACTIVATION.md`. Test recovery with the flag enabled on a preview deployment, then enable it for production and redeploy only after a new recovery message and password update both work.

Netlify Free permits commercial projects but has a hard monthly credit limit. Monitor usage during the pilot because exhausting credits pauses the site until the next cycle or a plan change. This release is still read-only for operational records.
