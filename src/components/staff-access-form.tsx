"use client";

import { useState } from "react";
import { Branch, StaffRole } from "@/lib/staff";

export function StaffAccessFields({ branches, role: initialRole, branchId = null }: {
  branches: Branch[]; role: StaffRole; branchId?: string | null;
}) {
  const [role, setRole] = useState(initialRole);
  const national = role === "director" || role === "admin";
  return <>
    <label>Role <select name="role" value={role} onChange={(event) => setRole(event.target.value as StaffRole)}>
      <option value="director">Director · nationwide</option>
      {initialRole === "admin" && <option value="admin" disabled>Admin · existing account</option>}
      <option value="manager">Branch manager</option>
      <option value="sales">Sales</option>
      <option value="production">Production</option>
    </select></label>
    <label>Branch <select name="branch_id" defaultValue={branchId ?? ""} disabled={national} required={!national}>
      <option value="">Select branch</option>
      {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
    </select></label>
  </>;
}
