"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const submitting = useRef(false);

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      if (name.trim().length < 2 || name.trim().length > 120) throw new Error("Enter your full name.");
      if (password.length < 12) throw new Error("Use at least 12 characters for your password.");
      const supabase = createSupabaseBrowserClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { full_name: name.trim(), sunbow_registration: "staff" },
          emailRedirectTo: `${window.location.origin}/accept-invite`,
        },
      });
      if (signUpError) throw signUpError;
      if (data.session) {
        const { error: requestError } = await supabase.rpc("request_staff_registration");
        if (requestError) throw requestError;
        await supabase.auth.signOut();
      }
      setPassword("");
      setSubmitted(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Registration could not be submitted.");
    } finally {
      submitting.current = false;
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
      <h2>Request staff access.</h2>
      {submitted ? <p role="status">Check your inbox for a confirmation email. Open the newest link in this same browser. After your email is verified, your request goes to a Director for approval. You cannot enter the CRM until they approve it.</p> : <>
        <p>Register with your work email. A Director will review your request and assign your role and branch.</p>
        {error && <div className="form-error" role="alert">{error}</div>}
        <form onSubmit={register}>
          <div className="field"><label htmlFor="registration-name">Full name</label><input id="registration-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={120} autoComplete="name" required /></div>
          <div className="field"><label htmlFor="registration-email">Email address</label><input id="registration-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></div>
          <div className="field"><label htmlFor="registration-password">Create password</label><input id="registration-password" type="password" minLength={12} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required /></div>
          <button className="primary-button login-submit" type="submit" disabled={busy}>{busy ? "Submitting…" : "Request Director approval →"}</button>
        </form>
      </>}
      <div className="login-note"><Link href="/login">Already registered? Sign in</Link></div>
    </div></section>
  </main>;
}
