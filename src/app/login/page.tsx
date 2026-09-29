import { login } from "./actions";
import Link from "next/link";
import Image from "next/image";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="login-shell">
      <section className="login-visual">
        <div className="login-brand">
          <Image src="/sunbow-logo.png" alt="Sunbow Tents Manufacture" width={2048} height={616} priority />
        </div>
        <div className="login-copy">
          <span className="login-eyebrow"><span /> SUNBOW WORKSPACE</span>
          <h1>One system.<br /><em>Every department.</em></h1>
          <p>Your secure place for sales, customers, quotations, orders and manufacturing.</p>
        </div>
        <div className="login-visual-foot"><span /> Built for Sunbow Tents Manufacture · South Africa</div>
      </section>
      <section className="login-form-wrap">
        <form className="login-form" action={login}>
          <div className="login-form-mark" aria-hidden="true">S</div>
          <span className="login-form-eyebrow">SUNBOW CRM</span>
          <h2>Welcome back.</h2>
          <p>Sign in with your Sunbow staff account to continue.</p>
          {error ? <div className="form-error">{error}</div> : null}
          <div className="field">
            <label htmlFor="email">Email address</label>
            <input id="email" name="email" type="email" autoComplete="username" placeholder="name@sunbowtents.co.za" required />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" autoComplete="current-password" placeholder="Enter your password" required />
          </div>
          <Link className="forgot-link" href="/forgot-password">Forgot password?</Link>
          <button className="primary-button login-submit" type="submit">Sign in to CRM <span aria-hidden="true">→</span></button>
          <Link className="forgot-link" href="/activate">New staff? Activate your account</Link>
          <div className="login-note">For authorised Sunbow staff. Contact a Director if you need an account or role change.</div>
        </form>
      </section>
    </main>
  );
}
