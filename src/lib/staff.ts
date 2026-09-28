import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type Branch = { id: string; code: string; name: string };
export type StaffRole = "director" | "admin" | "manager" | "sales" | "production";

export function isInterfacePreview() {
  return process.env.SUNBOW_PREVIEW_MODE === "true" && process.env.VERCEL_ENV === "preview";
}

export const getStaffContext = cache(async () => {
  if (isInterfacePreview()) {
    return {
      preview: true as const,
      supabase: null,
      profile: { id: "preview", full_name: "Interface preview", role: "director" as StaffRole, branch_id: null },
      branches: [] as Branch[],
    };
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    redirect("/login?error=Staff%20sign-in%20is%20not%20configured");
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, role, branch_id, active")
    .eq("id", user.id)
    .single();
  if (profileError || !profile?.active) redirect("/login?error=Staff%20access%20has%20not%20been%20enabled");

  const role = profile.role as StaffRole;
  if (!["director", "admin", "manager", "sales", "production"].includes(role)) {
    redirect("/login?error=Staff%20role%20is%20not%20configured");
  }
  if (!["director", "admin"].includes(role) && !profile.branch_id) {
    redirect("/login?error=Staff%20branch%20is%20not%20configured");
  }

  const { data: branches, error: branchesError } = await supabase
    .from("branches").select("id, code, name").eq("active", true).order("name");
  if (branchesError) throw new Error("Branch configuration could not be loaded.");

  return {
    preview: false as const,
    supabase,
    profile: { id: profile.id as string, full_name: profile.full_name as string, role, branch_id: profile.branch_id as string | null },
    branches: (branches ?? []) as Branch[],
  };
});

export type StaffContext = Awaited<ReturnType<typeof getStaffContext>>;

export function isNationalRole(role: StaffRole) {
  return role === "director" || role === "admin";
}

export function selectedBranch(context: StaffContext, requested?: string) {
  if (context.preview) return null;
  if (!isNationalRole(context.profile.role)) return context.profile.branch_id;
  return context.branches.some((branch) => branch.id === requested) ? requested! : null;
}

export function scopeName(context: StaffContext, branchId: string | null) {
  if (context.preview) return "Interface preview";
  return context.branches.find((branch) => branch.id === branchId)?.name ?? (branchId ? "Assigned branch" : "All branches");
}
