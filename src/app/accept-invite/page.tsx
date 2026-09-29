"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { EmailOtpType } from "@supabase/supabase-js";

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
        const query = new URLSearchParams(window.location.search);
        const fragment = new URLSearchParams(window.location.hash.slice(1));
        const supabase = createSupabaseBrowserClient();
        if (query.has("error") || query.has("error_code")) {
          throw new Error("This link is invalid or has expired. Request a fresh link from the sign-in page.");
        }
        const accessToken = fragment.get("access_token");
        const refreshToken = fragment.get("refresh_token");
        const tokenHash = query.get("token_hash");
        const type = query.get("type");
        if (tokenHash && type) {
          const validTypes: EmailOtpType[] = ["recovery", "invite", "signup", "magiclink", "email"];
          if (!validTypes.includes(type as EmailOtpType)) throw new Error("Unsupported activation link.");
          const { error: tokenError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash, type: type as EmailOtpType,
          });
          if (tokenError) throw tokenError;
        } else if (accessToken && refreshToken) {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken, refresh_token: refreshToken,
            });
            if (sessionError) throw sessionError;
          }
        } else if (query.has("code")) {
          // @supabase/ssr normally consumes PKCE codes when its browser client
          // initializes. Exchange explicitly only if that did not yield a user.
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            const { error: codeError } = await supabase.auth.exchangeCodeForSession(query.get("code")!);
            if (codeError) throw codeError;
          }
        }
        window.history.replaceState(null, "", window.location.pathname);
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) throw new Error("This link is invalid or has expired. Request a fresh link from the sign-in page.");
        const { error: claimError } = await supabase.rpc("claim_staff_invitation");
        if (claimError) throw claimError;
        const { data: profile, error: profileError } = await supabase
          .from("profiles").select("active, role, branch_id").eq("id", user.id).single();
        if (profileError || !profile?.active || (!["director", "admin"].includes(profile.role) && !profile.branch_id)) {
          await supabase.auth.signOut();
          throw new Error("Staff access has not been enabled for this account.");
        }
        if (mounted) setReady(true);
      } catch (cause) {
        window.history.replaceState(null, "", window.location.pathname);
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
          {error && <div className="form-error" role="alert">{error} <Link href="/forgot-password">Request a new reset link</Link> or <Link href="/activate">activate staff access</Link>.</div>}
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
