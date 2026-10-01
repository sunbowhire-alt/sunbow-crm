import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeading } from "@/components/page-heading";
import { StaffAccessFields } from "@/components/staff-access-form";
import { getStaffContext, isNationalRole, StaffRole } from "@/lib/staff";
import { approveRegistration, rejectRegistration, updateStaff } from "./actions";

type Profile = { id: string; full_name: string; role: StaffRole; branch_id: string | null; active: boolean };
type Registration = { user_id: string; email: string; full_name: string; requested_at: string };

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  const context = await getStaffContext();
  if (!isNationalRole(context.profile.role)) notFound();
  const director = context.profile.role === "director";
  const params = await searchParams;
  const [profilesResult, registrationsResult] = await Promise.all([
    context.supabase.from("profiles").select("id, full_name, role, branch_id, active").order("full_name").limit(200),
    director ? context.supabase.rpc("pending_staff_registrations") : Promise.resolve({ data: [] as Registration[], error: null }),
  ]);
  if (profilesResult.error || registrationsResult.error) throw new Error("Unable to load staff access records.");
  const profiles = (profilesResult.data ?? []) as Profile[];
  const registrations = (registrationsResult.data ?? []) as Registration[];
  const branchNames = new Map(context.branches.map((branch) => [branch.id, branch.name]));
  const scope = (role: StaffRole, branchId: string | null) => branchId ? branchNames.get(branchId) ?? "Unknown branch" : isNationalRole(role) ? "Nationwide" : "Unassigned";

  return <AppShell active="Users & roles">
    <PageHeading title="Staff access" description={director ? "Review registrations and assign staff access" : "Staff accounts and branch assignments"} />
    {params.notice && <p className="form-notice" role="status">{params.notice}</p>}
    {params.error && <p className="form-error" role="alert">{params.error}</p>}
    {director && <article className="panel staff-panel">
      <div className="panel-head"><h2>Registration requests</h2><span>{registrations.length} pending</span></div>
      <p>Each person registers with their own email and password. Approving a verified request creates their staff profile and grants the selected branch access.</p>
      {registrations.map((request) => <div className="staff-request" key={request.user_id}>
        <div><strong>{request.full_name}</strong><br />{request.email}<br /><small>Requested {new Date(request.requested_at).toLocaleDateString("en-ZA")}</small></div>
        <form action={approveRegistration} className="staff-form staff-form-inline">
          <input type="hidden" name="user_id" value={request.user_id} />
          <StaffAccessFields branches={context.branches} role="sales" allowDirector={false} />
          <button className="primary-button" type="submit">Approve access</button>
        </form>
        <form action={rejectRegistration}>
          <input type="hidden" name="user_id" value={request.user_id} />
          <button className="secondary-button" type="submit">Decline</button>
        </form>
      </div>)}
      {!registrations.length && <p className="empty-state">No registration requests awaiting review.</p>}
    </article>}
    <article className="panel staff-panel">
      <div className="panel-head"><h2>Staff accounts</h2><span>{profiles.length} shown</span></div>
      <div className="table-wrap"><table><thead><tr><th>Name</th><th>Role and branch</th><th>Status</th><th>Access</th></tr></thead><tbody>
        {profiles.map((profile) => <tr key={profile.id}>
          <td><strong>{profile.full_name}</strong></td>
          <td>{profile.role} · {scope(profile.role, profile.branch_id)}</td>
          <td>{profile.active ? "Active" : "Disabled"}</td>
          <td>{director && profile.id !== context.profile.id ? <form action={updateStaff} className="staff-form staff-form-inline">
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
