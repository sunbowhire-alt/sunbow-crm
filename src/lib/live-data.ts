import { StaffContext } from "@/lib/staff";

type TableName = "customers" | "leads" | "orders" | "production_jobs" | "profiles";

export async function liveCount(context: StaffContext, table: TableName, branchId: string | null, status?: { column: string; value: string; exclude?: boolean }) {
  let query = context.supabase.from(table).select("id", { count: "exact", head: true });
  if (branchId && table !== "profiles") query = query.eq("branch_id", branchId);
  if (status) query = status.exclude ? query.neq(status.column, status.value) : query.eq(status.column, status.value);
  const { count, error } = await query;
  if (error) throw new Error(`Unable to load ${table} count.`);
  return count ?? 0;
}

export function formattedDate(date: string | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Johannesburg" }).format(new Date(date));
}

export function formattedRand(value: number | null) {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(value ?? 0);
}
