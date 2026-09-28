import { getStaffContext } from "@/lib/staff";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await getStaffContext();
  return children;
}
