"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ActivatePage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function activate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { shouldCreateUser: true, emailRedirectTo: `${window.location.origin}/accept-invite` },
      });
      if (otpError) throw otpError;
      setSent(true);
    } catch {
      setError("We could not send the activation link. Please try again later.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="login-shell">
    <section className="login-visual">
      <div className="login-brand"><Image src="/sunbow-logo.png" alt="Sunbow Tents Manufacture" width={2048} height={616} priority /></div>
      <div className="login-copy"><span className="login-eyebrow"><span /> SUNBOW WORKSPACE</span><h1>One system.<br /><em>Every department.</em></h1><p>Your secure place for Sunbow operations.</p></div>
      <div className="login-visual-foot"><span /> Built for Sunbow Tents Manufacture · South Africa</div>
    </section>
    <section className="login-form-wrap"><div className="login-form">
      <div className="login-form-mark" aria-hidden="true">S</div>
      <span className="login-form-eyebrow">SUNBOW CRM</span>
      <h2>Activate staff access.</h2>
      {sent ? <p role="status">If your email has been approved for Sunbow CRM, check your inbox for an activation link. Use the newest email.</p> : <>
        <p>Enter the exact email address your admin approved. We’ll send a one-time link to verify it and set your password.</p>
        {error && <div className="form-error" role="alert">{error}</div>}
        <form onSubmit={activate}><div className="field"><label htmlFor="activation-email">Email address</label><input id="activation-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></div>
          <button className="primary-button login-submit" disabled={busy} type="submit">{busy ? "Sending…" : "Send activation link →"}</button>
        </form>
      </>}
      <div className="login-note"><Link href="/login">Back to sign in</Link></div>
    </div></section>
  </main>;
}
