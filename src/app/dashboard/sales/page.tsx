import { AppShell } from "@/components/app-shell";
import { PageHeading } from "@/components/page-heading";
import { StatCard } from "@/components/stat-card";
import { BranchFilter } from "@/components/branch-filter";
import { getStaffContext, selectedBranch, scopeName } from "@/lib/staff";
import { formattedDate, liveCount } from "@/lib/live-data";

export default async function SalesPage({ searchParams }: { searchParams: Promise<{ branch?: string }> }) {
  const context = await getStaffContext();
  const branchId = selectedBranch(context, (await searchParams).branch);
  const today = new Date().toISOString();
  const [customers, leads, orders, won] = await Promise.all([
    liveCount(context, "customers", branchId),
    liveCount(context, "leads", branchId, { column: "status", value: "lost", exclude: true }),
    liveCount(context, "orders", branchId),
    liveCount(context, "leads", branchId, { column: "status", value: "won" }),
  ]);
  let followUpQuery = context.supabase.from("leads").select("id", { count: "exact", head: true })
    .lte("next_follow_up", today).not("status", "in", '("won","lost")');
  let recentQuery = context.supabase.from("leads")
    .select("id, contact_name, product_interest, status, next_follow_up")
    .order("created_at", { ascending: false }).limit(8);
  if (branchId) {
    followUpQuery = followUpQuery.eq("branch_id", branchId);
    recentQuery = recentQuery.eq("branch_id", branchId);
  }
  const [followUps, recent] = await Promise.all([followUpQuery, recentQuery]);
  if (followUps.error || recent.error) throw new Error("Unable to load sales records.");
  return <AppShell active="Sales">
    <PageHeading title="Sales dashboard" description={`Live customer and sales records · ${scopeName(context, branchId)}`} />
    <BranchFilter context={context} branchId={branchId} />
    <section className="stats">
      <StatCard label="Customers" value={String(customers)} note="Recorded customers" />
      <StatCard label="Open leads" value={String(leads - won)} note="Excludes won and lost" />
      <StatCard label="Follow-ups due" value={String(followUps.count ?? 0)} note="Due now or overdue" warning />
      <StatCard label="Orders" value={String(orders)} note="Recorded orders" />
    </section>
    <article className="panel"><div className="panel-head"><h2>Recent leads</h2><span>{scopeName(context, branchId)}</span></div>
      <div className="table-wrap"><table><thead><tr><th>Contact</th><th>Interest</th><th>Status</th><th>Follow-up</th></tr></thead>
        <tbody>{(recent.data ?? []).map((lead) => <tr key={lead.id}><td><strong>{lead.contact_name}</strong></td><td>{lead.product_interest ?? "—"}</td><td><span className="badge blue">{lead.status}</span></td><td>{formattedDate(lead.next_follow_up)}</td></tr>)}</tbody>
      </table></div>
      {!recent.data?.length && <p className="empty-state">No leads recorded for this view yet.</p>}
    </article>
  </AppShell>;
}
