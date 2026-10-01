import { AppShell } from "@/components/app-shell";
import { BranchFilter } from "@/components/branch-filter";
import { PageHeading } from "@/components/page-heading";
import { getStaffContext, selectedBranch, scopeName } from "@/lib/staff";
import { formattedDate } from "@/lib/live-data";

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ branch?: string }> }) {
  const context = await getStaffContext();
  const branchId = selectedBranch(context, (await searchParams).branch);
  let query = context.supabase.from("customers")
    .select("id, name, company, phone, branch_id, created_at")
    .order("created_at", { ascending: false }).limit(100);
  if (branchId) query = query.eq("branch_id", branchId);
  const { data: customers, error } = await query;
  if (error) throw new Error("Unable to load customers.");
  const branchNames = new Map(context.branches.map((branch) => [branch.id, branch.name]));
  return <AppShell active="Customers">
    <PageHeading title="Customers" description={`Live customer records · ${scopeName(context, branchId)}`} />
    <BranchFilter context={context} branchId={branchId} />
    <article className="panel"><div className="panel-head"><h2>Recent customers</h2><span>Latest 100</span></div>
      <div className="table-wrap"><table><thead><tr><th>Name</th><th>Company</th><th>Branch</th><th>Phone</th><th>Added</th></tr></thead>
        <tbody>{(customers ?? []).map((customer) => <tr key={customer.id}><td><strong>{customer.name}</strong></td><td>{customer.company ?? "—"}</td><td>{branchNames.get(customer.branch_id) ?? "Unassigned"}</td><td>{customer.phone ?? "—"}</td><td>{formattedDate(customer.created_at)}</td></tr>)}</tbody>
      </table></div>
      {!customers?.length && <p className="empty-state">No customers recorded for this view yet.</p>}
    </article>
  </AppShell>;
}
