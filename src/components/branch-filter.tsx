import { StaffContext, isNationalRole, scopeName } from "@/lib/staff";

export function BranchFilter({ context, branchId }: { context: StaffContext; branchId: string | null }) {
  if (context.preview) return null;
  if (!isNationalRole(context.profile.role)) {
    return <div className="scope-label">Branch: <strong>{scopeName(context, branchId)}</strong></div>;
  }
  return <form method="get" className="branch-filter">
    <label htmlFor="branch-filter">Viewing</label>
    <select id="branch-filter" name="branch" defaultValue={branchId ?? ""}>
      <option value="">All branches</option>
      {context.branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
    </select>
    <button type="submit" className="secondary-button">Apply</button>
  </form>;
}
