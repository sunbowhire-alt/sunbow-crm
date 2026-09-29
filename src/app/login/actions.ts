"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) redirect("/login?error=Enter%20your%20email%20and%20password");

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    redirect("/login?error=Authentication%20is%20not%20configured%20yet");
  }
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  const { data: { user } } = await supabase.auth.getUser();
  if (user) await supabase.rpc("claim_staff_invitation");
  const { data: profile } = user
    ? await supabase.from("profiles").select("active, role, branch_id").eq("id", user.id).single()
    : { data: null };
  if (!profile?.active || (!["director", "admin"].includes(profile.role) && !profile.branch_id)) {
    await supabase.auth.signOut();
    redirect("/login?error=Staff%20access%20has%20not%20been%20enabled");
  }
  redirect("/dashboard");
}

export async function logout() {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  } catch {
    // A missing session must still return the user to the login screen.
  }
  redirect("/login");
}
