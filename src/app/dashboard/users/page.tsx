import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeading } from "@/components/page-heading";
import { StaffAccessFields } from "@/components/staff-access-form";
import { getStaffContext, isNationalRole, StaffRole } from "@/lib/staff";
import { inviteStaff, updateStaff } from "./actions";

type Profile = { id: string; full_name: string; role: StaffRole; branch_id: string | null; active: boolean };
type Invitation = { email: string; full_name: string; role: StaffRole; branch_id: string | null; claimed_at: string | null };

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  const context = await getStaffContext();
  if (!isNationalRole(context.profile.role)) notFound();
  const admin = context.profile.role === "admin";
  const params = await searchParams;
  const [profilesResult, invitationsResult] = await Promise.all([
    context.supabase.from("profiles").select("id, full_name, role, branch_id, active").order("full_name").limit(200),
    admin ? context.supabase.from("staff_invitations").select("email, full_name, role, branch_id, claimed_at").is("claimed_at", null).order("created_at", { ascending: false }).limit(100) : Promise.resolve({ data: [] as Invitation[], error: null }),
  ]);
  if (profilesResult.error || invitationsResult.error) throw new Error("Unable to load staff access records.");
  const profiles = (profilesResult.data ?? []) as Profile[];
  const invitations = (invitationsResult.data ?? []) as Invitation[];
  const branchNames = new Map(context.branches.map((branch) => [branch.id, branch.name]));
  const scope = (role: StaffRole, branchId: string | null) => branchId ? branchNames.get(branchId) ?? "Unknown branch" : isNationalRole(role) ? "Nationwide" : "Unassigned";

  return <AppShell active="Users & roles">
    <PageHeading title="Staff access" description={admin ? "Invite staff and manage branch and nationwide roles" : "Staff accounts and branch assignments"} />
    {params.notice && <p className="form-notice" role="status">{params.notice}</p>}
    {params.error && <p className="form-error" role="alert">{params.error}</p>}
    {admin && <article className="panel staff-panel">
      <div className="panel-head"><h2>Invite staff</h2><span>Admin only</span></div>
      <p>Save an approved email and role, then share the <Link href="/activate">staff activation page</Link>. They must confirm that email before access is granted.</p>
      <form action={inviteStaff} className="staff-form">
        <label>Full name <input name="full_name" required maxLength={120} /></label>
        <label>Email address <input name="email" type="email" autoComplete="off" required maxLength={254} /></label>
        <StaffAccessFields branches={context.branches} role="sales" />
        <button className="primary-button" type="submit">Save invitation</button>
      </form>
    </article>}
    {admin && invitations.length > 0 && <article className="panel staff-panel">
      <div className="panel-head"><h2>Awaiting activation</h2><span>{invitations.length} pending</span></div>
      <div className="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Scope</th></tr></thead><tbody>
        {invitations.map((invitation) => <tr key={invitation.email}><td>{invitation.full_name}</td><td>{invitation.email}</td><td>{invitation.role}</td><td>{scope(invitation.role, invitation.branch_id)}</td></tr>)}
      </tbody></table></div>
    </article>}
    <article className="panel staff-panel">
      <div className="panel-head"><h2>Staff accounts</h2><span>{profiles.length} shown</span></div>
      <div className="table-wrap"><table><thead><tr><th>Name</th><th>Role and branch</th><th>Status</th><th>Access</th></tr></thead><tbody>
        {profiles.map((profile) => <tr key={profile.id}>
          <td><strong>{profile.full_name}</strong></td>
          <td>{profile.role} · {scope(profile.role, profile.branch_id)}</td>
          <td>{profile.active ? "Active" : "Disabled"}</td>
          <td>{admin && profile.id !== context.profile.id ? <form action={updateStaff} className="staff-form staff-form-inline">
            <input type="hidden" name="user_id" value={profile.id} />
            <StaffAccessFields branches={context.branches} role={profile.role} branchId={profile.branch_id} />
            <label className="staff-checkbox"><input type="checkbox" name="active" defaultChecked={profile.active} /> Active</label>
            <button className="secondary-button" type="submit">Save access</button>
          </form> : profile.id === context.profile.id ? "Your account" : "View only"}</td>
        </tr>)}
      </tbody></table></div>
      {!profiles.length && <p className="empty-state">No staff profiles configured yet.</p>}
    </article>
  </AppShell>;
}
