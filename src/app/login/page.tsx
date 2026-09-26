import { login } from "./actions";
import Link from "next/link";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const preview = process.env.SUNBOW_PREVIEW_MODE === "true" && process.env.VERCEL_ENV === "preview";
  return (
    <main className="login-shell">
      <section className="login-visual">
        <div className="brand">
          <div className="brand-mark">S</div>
          <div><strong>SUNBOW</strong><small>TENTS MANUFACTURE</small></div>
        </div>
        <div className="login-copy">
          <h1>One system.<br />Every department.</h1>
          <p>Manage sales, customers, quotations, orders and manufacturing from one secure Sunbow workspace.</p>
        </div>
        <small>Built for Sunbow Tents Manufacture · South Africa</small>
      </section>
      <section className="login-form-wrap">
        <form className="login-form" action={login}>
          <h2>Welcome back</h2>
          <p>Sign in with your Sunbow staff account to continue.</p>
          {error ? <div className="form-error">{error}</div> : null}
          <div className="field">
            <label htmlFor="email">EMAIL ADDRESS</label>
            <input id="email" name="email" type="email" placeholder="name@sunbowtents.co.za" required />
          </div>
          <div className="field">
            <label htmlFor="password">PASSWORD</label>
            <input id="password" name="password" type="password" placeholder="Enter your password" required />
          </div>
          <button className="primary-button" type="submit">Sign in to CRM</button>
          {preview && <Link className="preview-link" href="/dashboard">View protected interface preview</Link>}
          <div className="login-note">Access is restricted to authorised Sunbow staff. Contact a Director if you need an account or role change.</div>
        </form>
      </section>
    </main>
  );
}
