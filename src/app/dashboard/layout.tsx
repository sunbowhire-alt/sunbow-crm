import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Only an explicitly enabled, protected Vercel preview can bypass staff sign-in.
  if (process.env.SUNBOW_PREVIEW_MODE === "true" && process.env.VERCEL_ENV === "preview") {
    return children;
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    redirect("/login?error=Staff%20sign-in%20is%20not%20configured");
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");

  return children;
}
