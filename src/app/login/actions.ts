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
  redirect("/dashboard");
}

export async function logout() {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  } catch {
    // The preview has no Supabase session.
  }
  redirect("/login");
}
