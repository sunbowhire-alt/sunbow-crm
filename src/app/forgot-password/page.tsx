"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function resetErrorMessage(cause: unknown) {
  if (cause instanceof Error && cause.message.includes("Supabase environment variables are not configured")) {
    return "Password recovery is not configured on this deployment. Contact a Director.";
  }
  const status = typeof cause === "object" && cause !== null && "status" in cause ? cause.status : null;
  if (status === 429 || (cause instanceof Error && /rate limit/i.test(cause.message))) {
    return "Email sending is temporarily limited. Please wait before trying again or contact a Director.";
  }
  return "We could not send a reset link right now. Please try again later or contact a Director.";
}

export default function ForgotPasswordPage() {
  const recoveryReady = process.env.NEXT_PUBLIC_PASSWORD_RESET_ENABLED === "true";
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const sending = useRef(false);

  async function requestReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current) return;
    sending.current = true;
    setBusy(true);
    setError("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/accept-invite`,
      });
      if (resetError) throw resetError;
      setSent(true);
    } catch (cause) {
      setError(resetErrorMessage(cause));
    } finally {
      sending.current = false;
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
          <h2>Reset your password.</h2>
          {!recoveryReady ? (
            <p role="status">Password reset links are being activated for this private CRM. Contact a Director for access in the meantime.</p>
          ) : sent ? (
            <p role="status">If this email has an active staff account, a password reset link is on its way. Check your inbox and spam folder.</p>
          ) : (
            <>
              <p>Enter your staff email address. We’ll send a secure link to set a new password.</p>
              {error && <div className="form-error" role="alert">{error}</div>}
              <form onSubmit={requestReset}>
                <div className="field">
                  <label htmlFor="reset-email">Email address</label>
                  <input id="reset-email" type="email" autoComplete="email" placeholder="name@sunbowtents.co.za" value={email} onChange={(event) => setEmail(event.target.value)} required />
                </div>
                <button className="primary-button login-submit" type="submit" disabled={busy}>{busy ? "Sending…" : "Send reset link →"}</button>
              </form>
            </>
          )}
          <div className="login-note"><Link href="/login">Back to sign in</Link></div>
        </div>
      </section>
    </main>
  );
}
