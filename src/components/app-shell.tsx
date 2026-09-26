import Link from "next/link";
import { logout } from "@/app/login/actions";

const links = [
  ["/dashboard", "Director"],
  ["/dashboard/sales", "Sales"],
  ["/dashboard/manufacturing", "Manufacturing"],
  ["/dashboard/customers", "Customers"],
  ["/dashboard/leads", "Lead pipeline"],
  ["/dashboard/users", "Users & roles"],
];

export function AppShell({ children, active = "Director" }: { children: React.ReactNode; active?: string }) {
  const preview = process.env.SUNBOW_PREVIEW_MODE === "true" && process.env.VERCEL_ENV === "preview";
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">S</div><div><strong>SUNBOW</strong><small>CRM PLATFORM</small></div></div>
        <div className="nav-label">WORKSPACE</div>
        <nav className="nav">
          {links.map(([href, label]) => <Link key={href} className={label === active ? "active" : ""} href={href}><span className="nav-dot" />{label}</Link>)}
        </nav>
        <div className="sidebar-foot"><strong>Sunbow Tents Manufacture</strong><br />Internal business system</div>
      </aside>
      <div className="main">
        <div className="preview-banner">INTERFACE PREVIEW · All figures and records shown are illustrative. Changes are not saved.</div>
        <header className="topbar">
          <div className="topbar-title"><strong>{active} workspace</strong><span>Sunbow CRM</span></div>
          {preview ? <span className="badge blue">Protected preview</span> : <form action={logout}><button className="secondary-button" type="submit">Sign out</button></form>}
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
