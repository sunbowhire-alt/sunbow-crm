# Sunbow ERP implementation roadmap

Working plan based on Job Card **HAI-SUN-ERP-2026-001** (opened 31 May 2026). This is a scope and acceptance checklist for discussion with Sunbow Management and the assigned developer. It does not change the job card's OPEN – IN PROGRESS status or assert that any contractual milestone has been delivered.

## Current repository baseline (28 September 2026)

- Next.js/Vercel interface preview with login, director, sales, manufacturing, customer, lead, and user screens. The dashboard data and buttons are illustrative; changes are not saved.
- Supabase Auth client setup and an initial SQL schema for profiles, customers, leads, orders, production jobs, and activities. The schema is not evidence that it has been applied to a live database.
- The current row-level policies allow any authenticated user to read all customers, leads, orders, jobs, and activities, and to insert/update customers and leads without branch or role checks. This must be corrected before real branch or customer data is entered.
- Inventory, stock movements/transfers, serialized assets, QR/barcode workflows, rentals, dispatch/receiving, real reporting, and audit capture are not implemented.
- The protected Vercel preview is for visual review. Production operational use and the job card's Production Deployment milestone remain outstanding.

## Phase 1 update (29 September 2026)

The branch now contains real-data-only dashboards, admin-managed staff invitations and role changes, and a recovery callback that accepts Supabase email link formats. This is code prepared for release, not evidence that the new migration was applied or that nationwide users completed acceptance checks. The operational pilot and later ERP modules remain outstanding.

## First usable operational release

Pilot **one branch and one product flow**: an authorized salesperson creates a customer, quote, and order; the factory reserves materials, records production stages and finished goods; dispatch records delivery; management sees the actual order and stock movements. Every mutation records who acted and when. Test branch access with at least two users from different branches. Expand nationally after the pilot reconciles with physical stock and the existing paper/system process.

## Phased delivery and acceptance

| Phase | Deliverable | Acceptance evidence |
| --- | --- | --- |
| 0. Process and data sign-off | Confirm branches, roles, product/item types, units, stock locations, approval thresholds, document numbering, current systems, and data migration scope. Map the actual quote-to-cash, procurement-to-stock, production, transfer, and rental flows. | Sunbow approves process diagrams, a data dictionary, role/branch matrix, pilot branch, and prioritized backlog. |
| 1. Identity and secure foundation | Staff provisioning, deactivation, branch membership, permission matrix, database migrations, branch/role-aware row-level policies, and append-only audit events. Separate preview sample data from operational data. Rotate credentials previously exposed outside the secrets manager before live use. | A disabled user is denied; a branch user cannot read or mutate another branch's restricted rows through the UI or API; privileged actions are audited; migrations can be reproduced in staging. |
| 2. Inventory and manufacturing pilot | Item master, units, warehouse/bin locations, receipts, adjustments with reasons/approval, reservations, material consumption, bills of materials where applicable, work orders, WIP stages, quality checks, and finished-goods receipt. Use a movement ledger for stock balances. | A physical count agrees with system stock after pilot transactions; the order traces to materials consumed, WIP, finished unit, and responsible staff; exceptions and shortages are visible. |
| 3. Sales, orders, and logistics | Real customer/lead records, quotations and revisions, order conversion, payment/deposit status as recorded data, dispatch notes, delivery confirmation, branch transfer request, dispatch, in-transit, and receiving. | One real pilot order completes the end-to-end workflow; the same transfer cannot be received twice; sending and receiving branches can reconcile quantities and discrepancies. |
| 4. Rentals and scanning | Serialized rental assets, availability/reservations, issue and return, condition/damage, maintenance blocks, QR/barcode labels, scan-in/out, and movement history. | Staff can scan a specific unit, see its current location/status, reserve it without double booking, return it with condition evidence, and trace its full history. |
| 5. Reporting and rollout | Role-appropriate live dashboards, inventory valuation/aging rules as agreed, manufacturing throughput, rentals, sales, exports, reconciliation, monitoring, backup/restore procedure, training, UAT, and branch rollout. | Figures reconcile to source transactions; Sunbow signs UAT scenarios; restore is demonstrated; each branch has trained owners and a support route before production use. |

Phases may overlap, but Phase 1 access controls and audit design are prerequisites for real customer, staff, and stock data. Put the vertical pilot through UAT before national rollout.

## Job card coverage

| Job card area | Current state | Roadmap phase |
| --- | --- | --- |
| Manufacturing | Illustrative schedule; starter `production_jobs` table | 2 |
| National/branch inventory and audits | No item/stock ledger or stock screens | 2, 5 |
| Transfers and logistics | No transfer, dispatch, or receiving workflow | 3 |
| QR/barcode tracking | No scan or serialized asset workflow | 4 |
| Rentals | No reservation, return, availability, or maintenance workflow | 4 |
| Sales | Illustrative dashboards; starter customers/leads/orders tables | 3 |
| Roles, branch access, audit | Login scaffolding and broad starter policies; no enforced branch matrix or populated activity log | 1 |
| Executive reporting | Illustrative figures only | 5 |

## Scope items to agree with Sunbow and the developer

1. **Delivery definition:** Which exact workflows, branches, users, and data belong in the first release? Is a pilot a separate milestone from nationwide production?
2. **Ownership and access:** Who owns the GitHub repository, Vercel/Supabase projects, database, domains, source code, and exports; which accounts will the developer use; what access is removed at handover?
3. **Acceptance:** Demo scenarios and test data per module, who signs off, defect severity and correction window, and evidence required for UAT and production deployment.
4. **Schedule and changes:** Milestone dates, dependencies on Sunbow decisions/data, review cadence, and how new requirements and revisions are approved.
5. **Operations:** Hosting and service costs, backups/restore, monitoring, support, incident response, training, documentation, and data import/export responsibilities.
6. **Business rules:** Product/asset identifiers, stock units, valuation, negative stock, transfer discrepancies, reservations, rental deposits/damage, and authority to approve adjustments.

The job card confirms work was initiated and lists modules/objectives, but does not yet specify these deliverables, acceptance tests, dates, responsibilities, or handover terms. Treat any detailed phase plan as proposed until both parties agree it.

## Technical notes

- Supabase recommends combining Auth with row-level security for authorization; table grants and policies are separate controls. Test policies against actual branch and role cases, including direct API access. See https://supabase.com/docs/guides/database/postgres/row-level-security and https://supabase.com/docs/guides/api/custom-claims-and-role-based-access-control-rbac.
- Keep operational data behind staff authentication and explicit branch permissions. Vercel deployment protection governs access to a deployment URL; it is not a substitute for application/database authorization. See https://vercel.com/docs/deployment-protection.
- The existing `SUNBOW_PREVIEW_MODE` path is for protected, sample-only preview builds. Never use it as production ERP access or with real data.
