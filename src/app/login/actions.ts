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
    let registrationStatus: string | null = null;
    if (user && !profile) {
      const { data } = await supabase.rpc("request_staff_registration");
      registrationStatus = data;
    }
    await supabase.auth.signOut();
    if (registrationStatus === "pending") {
      redirect("/login?notice=Registration%20received.%20A%20Director%20must%20approve%20your%20account%20before%20you%20can%20sign%20in.");
    }
    if (registrationStatus === "rejected") {
      redirect("/login?error=Your%20registration%20was%20not%20approved.%20Contact%20a%20Director.");
    }
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
