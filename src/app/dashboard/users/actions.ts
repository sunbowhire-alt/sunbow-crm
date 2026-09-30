"use server";

import { redirect } from "next/navigation";
import { getStaffContext, StaffRole } from "@/lib/staff";

const roles: StaffRole[] = ["director", "manager", "sales", "production"];

function result(message: string, error = false): never {
  redirect(`/dashboard/users?${error ? "error" : "notice"}=${encodeURIComponent(message)}`);
}

async function adminContext() {
  const context = await getStaffContext();
  if (context.profile.role !== "director") result("Only a Director can manage staff access.", true);
  return context;
}

function assignment(formData: FormData, branches: { id: string }[]) {
  const role = String(formData.get("role") ?? "") as StaffRole;
  const rawBranch = String(formData.get("branch_id") ?? "");
  if (!roles.includes(role)) result("Choose a valid role.", true);
  const national = role === "director" || role === "admin";
  if (!national && !branches.some((branch) => branch.id === rawBranch)) result("Choose an active branch.", true);
  return { role, branchId: national ? null : rawBranch };
}

export async function inviteStaff(formData: FormData) {
  const context = await adminContext();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("full_name") ?? "").trim();
  const { role, branchId } = assignment(formData, context.branches);
  if (!email || !name) result("Enter a staff name and email address.", true);
  const { error } = await context.supabase.rpc("invite_staff", {
    p_email: email, p_full_name: name, p_role: role, p_branch_id: branchId,
  });
  if (error) result(error.message, true);
  result("Invitation saved. Share the staff activation link with this person.");
}

export async function updateStaff(formData: FormData) {
  const context = await adminContext();
  const userId = String(formData.get("user_id") ?? "");
  if (userId === context.profile.id) result("You cannot change your own access.", true);
  const { role, branchId } = assignment(formData, context.branches);
  const { error } = await context.supabase.rpc("manage_staff_profile", {
    p_user_id: userId, p_role: role, p_branch_id: branchId,
    p_active: formData.get("active") === "on",
  });
  if (error) result(error.message, true);
  result("Staff access updated.");
}

export async function approveRegistration(formData: FormData) {
  const context = await adminContext();
  const userId = String(formData.get("user_id") ?? "");
  const { role, branchId } = assignment(formData, context.branches);
  if (!["manager", "sales", "production"].includes(role)) result("Choose a branch staff role.", true);
  const { error } = await context.supabase.rpc("review_staff_registration", {
    p_user_id: userId, p_approve: true, p_role: role, p_branch_id: branchId,
  });
  if (error) result(error.message, true);
  result("Registration approved. This staff member can now sign in.");
}

export async function rejectRegistration(formData: FormData) {
  const context = await adminContext();
  const userId = String(formData.get("user_id") ?? "");
  const { error } = await context.supabase.rpc("review_staff_registration", {
    p_user_id: userId, p_approve: false,
  });
  if (error) result(error.message, true);
  result("Registration declined.");
}
