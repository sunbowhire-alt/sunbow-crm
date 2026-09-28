import { AppShell } from "@/components/app-shell";
import { BranchFilter } from "@/components/branch-filter";
import { PageHeading } from "@/components/page-heading";
import { getStaffContext, selectedBranch, scopeName } from "@/lib/staff";
import { formattedDate } from "@/lib/live-data";

const stages = [["New leads", "48"], ["Contacted", "61"], ["Quote sent", "43"], ["Negotiation", "22"], ["Won", "12"]];

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ branch?: string }> }) {
  const context = await getStaffContext();
  if (context.preview) return <AppShell active="Lead pipeline">
    <PageHeading title="Lead pipeline" description="Example lead pipeline layout." />
    <section className="lead-stages">{stages.map(([stage, count]) => <article className="panel" key={stage}><div className="panel-head"><h2>{stage}</h2><span className="badge blue">{count}</span></div></article>)}</section>
  </AppShell>;

  const branchId = selectedBranch(context, (await searchParams).branch);
  let query = context.supabase.from("leads")
    .select("id, contact_name, product_interest, status, next_follow_up")
    .order("created_at", { ascending: false }).limit(100);
  if (branchId) query = query.eq("branch_id", branchId);
  const { data: leads, error } = await query;
  if (error) throw new Error("Unable to load leads.");
  return <AppShell active="Lead pipeline">
    <PageHeading title="Lead pipeline" description={`Live sales leads · ${scopeName(context, branchId)}`} />
    <BranchFilter context={context} branchId={branchId} />
    <article className="panel"><div className="panel-head"><h2>Recent leads</h2><span>Latest 100</span></div>
      <div className="table-wrap"><table><thead><tr><th>Contact</th><th>Product</th><th>Status</th><th>Next follow-up</th></tr></thead>
        <tbody>{(leads ?? []).map((lead) => <tr key={lead.id}><td><strong>{lead.contact_name}</strong></td><td>{lead.product_interest ?? "—"}</td><td><span className="badge blue">{lead.status}</span></td><td>{formattedDate(lead.next_follow_up)}</td></tr>)}</tbody>
      </table></div>
      {!leads?.length && <p className="empty-state">No leads recorded for this view yet.</p>}
    </article>
  </AppShell>;
}
