import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeading } from "@/components/page-heading";
import { getStaffContext, isNationalRole } from "@/lib/staff";

const examples = [
  ["Example Director", "Director", "All branches"],
  ["Example Sales Manager", "Manager", "Amanzimtoti"],
  ["Example Sales Rep", "Sales", "Durban"],
];

export default async function UsersPage() {
  const context = await getStaffContext();
  if (!isNationalRole(context.profile.role)) notFound();
  if (context.preview) return <AppShell active="Users & roles">
    <PageHeading title="Users and roles" description="Example staff and role layout." />
    <article className="panel"><div className="panel-head"><h2>Example staff</h2><span>Preview only</span></div>
      <div className="table-wrap"><table><thead><tr><th>Name</th><th>Role</th><th>Scope</th></tr></thead>
        <tbody>{examples.map(([name, role, scope]) => <tr key={name}><td><strong>{name}</strong></td><td><span className="badge blue">{role}</span></td><td>{scope}</td></tr>)}</tbody>
      </table></div>
    </article>
  </AppShell>;

  const { data: profiles, error } = await context.supabase.from("profiles")
    .select("id, full_name, role, branch_id, active")
    .order("full_name").limit(200);
  if (error) throw new Error("Unable to load staff profiles.");
  const branchNames = new Map(context.branches.map((branch) => [branch.id, branch.name]));
  return <AppShell active="Users & roles">
    <PageHeading title="Staff access" description="Live staff roles and branch assignment · read only" />
    <article className="panel"><div className="panel-head"><h2>Staff accounts</h2><span>{profiles?.length ?? 0} shown</span></div>
      <div className="table-wrap"><table><thead><tr><th>Name</th><th>Role</th><th>Branch</th><th>Status</th></tr></thead>
        <tbody>{(profiles ?? []).map((profile) => <tr key={profile.id}><td><strong>{profile.full_name}</strong></td><td><span className="badge blue">{profile.role}</span></td><td>{profile.branch_id ? branchNames.get(profile.branch_id) ?? "Unknown branch" : isNationalRole(profile.role) ? "Nationwide" : "Unassigned"}</td><td><span className={`badge ${profile.active ? "" : "red"}`}>{profile.active ? "Active" : "Disabled"}</span></td></tr>)}</tbody>
      </table></div>
      {!profiles?.length && <p className="empty-state">No staff profiles configured yet.</p>}
    </article>
  </AppShell>;
}
