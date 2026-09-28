import { AppShell } from "@/components/app-shell";
import { PageHeading } from "@/components/page-heading";
import { StatCard } from "@/components/stat-card";
import { BranchFilter } from "@/components/branch-filter";
import { getStaffContext, selectedBranch, scopeName } from "@/lib/staff";
import { formattedDate, formattedRand, liveCount } from "@/lib/live-data";

const orders = [
  ["SB-1048", "Example Events A", "9×15 m Frame Tent", "R65 000", "In production", "blue"],
  ["SB-1047", "Example Company B", "Mobile Freezer", "R85 000", "Deposit paid", ""],
  ["SB-1046", "Example Catering D", "7×12 m Blockout", "R47 500", "Quote sent", "orange"],
  ["SB-1045", "Example Events C", "Pagoda Package", "R45 000", "Awaiting payment", "red"],
];

export default async function DirectorDashboard({ searchParams }: { searchParams: Promise<{ branch?: string }> }) {
  const context = await getStaffContext();
  if (context.preview) return <PreviewDashboard />;
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

function PreviewDashboard() {
  return <AppShell active="Director">
    <PageHeading title="Director overview" description="Example layout for sales, production and operations." action="Create report" />
    <section className="stats">
      <StatCard label="Sales this month" value="R1.28m" note="↑ 14.2% from last month" />
      <StatCard label="Active leads" value="186" note="42 need follow-up today" warning />
      <StatCard label="Production jobs" value="37" note="28 on schedule" />
      <StatCard label="Outstanding balance" value="R284k" note="12 customer accounts" warning />
    </section>
    <section className="grid-two">
      <article className="panel">
        <div className="panel-head"><h2>Recent orders</h2><span>Illustrative orders</span></div>
        <div className="table-wrap"><table><thead><tr><th>Order</th><th>Customer</th><th>Product</th><th>Value</th><th>Status</th></tr></thead><tbody>
          {orders.map(([id,customer,product,value,status,color]) => <tr key={id}><td><strong>{id}</strong></td><td>{customer}</td><td>{product}</td><td>{value}</td><td><span className={`badge ${color}`}>{status}</span></td></tr>)}
        </tbody></table></div>
      </article>
      <article className="panel">
        <div className="panel-head"><h2>Business activity</h2><span>Example activity</span></div>
        <div className="activity">
          <div className="activity-item"><i/><div><strong>New R85 000 order confirmed</strong><small>Mobile freezer · Durban branch</small></div><time>09:18</time></div>
          <div className="activity-item"><i/><div><strong>Production job moved to welding</strong><small>SB-1048 · Main factory</small></div><time>08:42</time></div>
          <div className="activity-item"><i/><div><strong>12 new leads imported</strong><small>Facebook campaign · Sales queue</small></div><time>08:10</time></div>
          <div className="activity-item"><i/><div><strong>Stock warning: 800 gsm PVC</strong><small>Below minimum level · Purchase required</small></div><time>07:35</time></div>
        </div>
      </article>
    </section>
  </AppShell>;
}
