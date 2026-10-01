import { AppShell } from "@/components/app-shell";
import { PageHeading } from "@/components/page-heading";
import { StatCard } from "@/components/stat-card";
import { BranchFilter } from "@/components/branch-filter";
import { getStaffContext, selectedBranch, scopeName } from "@/lib/staff";
import { formattedDate, formattedRand, liveCount } from "@/lib/live-data";

export default async function DirectorDashboard({ searchParams }: { searchParams: Promise<{ branch?: string }> }) {
  const context = await getStaffContext();
  const branchId = selectedBranch(context, (await searchParams).branch);
  const [customers, leads, ordersCount, jobs] = await Promise.all([
    liveCount(context, "customers", branchId),
    liveCount(context, "leads", branchId, { column: "status", value: "lost", exclude: true }),
    liveCount(context, "orders", branchId),
    liveCount(context, "production_jobs", branchId, { column: "status", value: "delivered", exclude: true }),
  ]);
  let query = context.supabase.from("orders")
    .select("id, order_number, description, total, status, created_at")
    .order("created_at", { ascending: false }).limit(8);
  if (branchId) query = query.eq("branch_id", branchId);
  const { data: recentOrders, error } = await query;
  if (error) throw new Error("Unable to load recent orders.");
  return <AppShell active="Director">
    <PageHeading title="Operations overview" description={`Live operational records · ${scopeName(context, branchId)}`} />
    <BranchFilter context={context} branchId={branchId} />
    <section className="stats">
      <StatCard label="Customers" value={String(customers)} note="Recorded customer accounts" />
      <StatCard label="Leads" value={String(leads)} note="All except lost leads" />
      <StatCard label="Orders" value={String(ordersCount)} note="Recorded orders" />
      <StatCard label="Open production jobs" value={String(jobs)} note="All except delivered" />
    </section>
    <article className="panel">
      <div className="panel-head"><h2>Recent orders</h2><span>{scopeName(context, branchId)}</span></div>
      <div className="table-wrap"><table><thead><tr><th>Order</th><th>Description</th><th>Value</th><th>Status</th><th>Created</th></tr></thead>
        <tbody>{(recentOrders ?? []).map((order) => <tr key={order.id}><td><strong>{order.order_number}</strong></td><td>{order.description}</td><td>{formattedRand(order.total)}</td><td><span className="badge blue">{order.status}</span></td><td>{formattedDate(order.created_at)}</td></tr>)}</tbody>
      </table></div>
      {!recentOrders?.length && <p className="empty-state">No orders recorded for this view yet.</p>}
    </article>
  </AppShell>;
}
