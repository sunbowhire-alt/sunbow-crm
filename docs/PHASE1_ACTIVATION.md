# Phase 1 activation and release checks

## Database and hosting

- Verify the intended Supabase project reference is `zwwdfywvxhdgdgtnltml`; take a backup before changing an existing schema.
- Apply `supabase/schema.sql` only if the initial tables do not exist. Apply `20260928_phase1_access.sql`, `20260929_staff_access.sql`, then `20260930_director_registration_approval.sql` if not yet applied. Confirm eight branches and RLS policies.
- Keep the existing active Shane profile as `admin` and `sunbowhire@gmail.com` as the active Director. A signup alone never creates an active staff profile. The applicant verifies their email; the Director then chooses a role and branch and approves the request.
- Confirm the Vercel target has the correct Supabase URL and publishable key. Remove `SUNBOW_PREVIEW_MODE` if it remains configured; the application ignores it. Do not use a Supabase server secret for this release.
- In Supabase Auth URL Configuration, allow the exact deployed `https://<crm-host>/accept-invite` destination and set Site URL to the CRM origin. Check the email templates use `ConfirmationURL` or the correct `RedirectTo`. Enable password-reset email only after a fresh link reaches the correct page. Configure production SMTP for nationwide use.

## Email links across browsers and devices

`@supabase/ssr` initiates the PKCE flow. A default `{{ .ConfirmationURL }}` email returns an authorization code, which can only be exchanged in the browser that requested the email. An admin requesting a link in one browser and a staff member opening it in another produces `PKCE code verifier not found in storage`.

For a link that works in the recipient's own browser or phone, configure the hosted Supabase **Authentication → Email Templates** to use token hashes. The existing `/accept-invite` page verifies the hash with `verifyOtp`, claims only a pre-approved invitation, and then offers password setup. Use these links in the templates, retaining any other desired branding/text:

| Template | Link destination |
| --- | --- |
| Magic Link | `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email` |
| Confirm signup | `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email` |
| Reset password | `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery` |

Example Magic Link body: `<p><a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email">Activate Sunbow staff access</a></p>`. Keep the redirect URL allow list restricted to the exact CRM host and route. The link is one-time and must never be copied into support chat or logs. Test a fresh link in a different browser before declaring cross-device activation complete. If the templates have not yet been changed, the recipient can request a new link at `/activate` in their own browser and open the newest email in that same browser.

## Access checks with real accounts

1. A prospective staff member submits `/register` with their name, email and password, confirms their email in the same browser, and sees the pending approval message. They cannot enter `/dashboard`, and their direct Data API reads must return no operational rows.
2. The active Director signs in, reviews Registration requests, selects a branch role and active branch, then approves. Verify the new user can sign in with their own password. Check that an admin and branch staff cannot call `review_staff_registration`, `invite_staff`, or `manage_staff_profile` to bypass the Director.
3. Reject a separate test request and confirm it cannot sign in. Test a fresh password-reset email for an active account. It must return to `/accept-invite`, change the password and permit sign-in.
4. Approve two test staff users assigned to different branches. Test UI and direct Data API queries: each sees only their own branch customers, leads, orders, jobs and activities; the Director sees nationwide counts.
5. Disable one test user in Staff access. Their next dashboard request and direct Data API read must be denied. Unprofiled users and unapproved email signups must not enter the CRM.
6. Reconcile live dashboard counts with database records. Empty tables must show empty states, never sample metrics. Check desktop and mobile registration, login, dashboards, branch filter, sign-out and staff review.
7. After these checks, decide which Vercel deployment serves staff and adjust Deployment Protection for that target. Keep Supabase Auth and RLS in force. Monitor errors, email delivery and staff support during rollout.

## Current scope

This release provides identity, role/branch access and read-only live dashboards for customers, leads, orders and production jobs. It does not create or edit operational records, calculate stock or rental availability, or implement quotation, transfer and dispatch workflows. These remain in the ERP roadmap.
