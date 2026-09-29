"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AcceptInvitePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");

  useEffect(() => {
    let mounted = true;
    async function activate() {
      try {
        const supabase = createSupabaseBrowserClient();
        const fragment = new URLSearchParams(window.location.hash.slice(1));
        const accessToken = fragment.get("access_token");
        const refreshToken = fragment.get("refresh_token");
        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          // Remove credentials from the address bar after the session is stored.
          window.history.replaceState(null, "", window.location.pathname);
          if (sessionError) throw sessionError;
        }
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) throw new Error("This link is invalid or has expired. Request a new password reset link.");
        const { data: profile, error: profileError } = await supabase
          .from("profiles").select("active, role, branch_id").eq("id", user.id).single();
        if (profileError || !profile?.active || (!["director", "admin"].includes(profile.role) && !profile.branch_id)) {
          await supabase.auth.signOut();
          throw new Error("Staff access has not been enabled for this account.");
        }
        if (mounted) setReady(true);
      } catch (cause) {
        if (mounted) setError(cause instanceof Error ? cause.message : "Invitation could not be opened.");
      }
    }
    void activate();
    return () => { mounted = false; };
  }, []);

  async function setNewPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password.length < 12) return setError("Use at least 12 characters for your password.");
    if (password !== confirmation) return setError("The passwords do not match.");
    setBusy(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Your session has expired. Request a new password reset link.");
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setPassword("");
      setConfirmation("");
      router.replace("/dashboard");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Password could not be saved.");
      setBusy(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-visual">
        <div className="login-brand"><Image src="/sunbow-logo.png" alt="Sunbow Tents Manufacture" width={2048} height={616} priority /></div>
        <div className="login-copy">
          <span className="login-eyebrow"><span /> SUNBOW WORKSPACE</span>
          <h1>One system.<br /><em>Every department.</em></h1>
          <p>Your secure place for sales, customers, quotations, orders and manufacturing.</p>
        </div>
        <div className="login-visual-foot"><span /> Built for Sunbow Tents Manufacture · South Africa</div>
      </section>
      <section className="login-form-wrap">
        <div className="login-form">
          <div className="login-form-mark" aria-hidden="true">S</div>
          <span className="login-form-eyebrow">SUNBOW CRM</span>
          <h2>Set your password.</h2>
          <p>Choose a new password for your Sunbow staff account.</p>
          {error && <div className="form-error" role="alert">{error}</div>}
          {!ready && !error && <p>Checking your secure link…</p>}
          {ready && <form onSubmit={setNewPassword}>
            <div className="field">
              <label htmlFor="new-password">New password</label>
              <input id="new-password" type="password" autoComplete="new-password" minLength={12} value={password} onChange={(event) => setPassword(event.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="confirm-password">Confirm password</label>
              <input id="confirm-password" type="password" autoComplete="new-password" minLength={12} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required />
            </div>
            <button className="primary-button login-submit" type="submit" disabled={busy}>{busy ? "Saving…" : "Save password →"}</button>
          </form>}
          <div className="login-note">Only use a link sent to your own email address. <Link href="/login">Back to sign in</Link></div>
        </div>
      </section>
    </main>
  );
}
