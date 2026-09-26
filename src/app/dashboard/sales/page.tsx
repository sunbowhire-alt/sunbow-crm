import { AppShell } from "@/components/app-shell";
import { PageHeading } from "@/components/page-heading";
import { StatCard } from "@/components/stat-card";

export default function SalesPage() { return <AppShell active="Sales">
  <PageHeading title="Sales dashboard" description="Example sales layout and metrics." action="Add quotation" />
  <section className="stats"><StatCard label="Monthly sales" value="R1.28m" note="74% of target"/><StatCard label="Quotes sent" value="94" note="31% conversion rate"/><StatCard label="Follow-ups due" value="42" note="8 overdue" warning/><StatCard label="Average order" value="R38 450" note="↑ R4 120 this month"/></section>
  <section className="grid-two"><article className="panel"><div className="panel-head"><h2>Sales team target</h2><span>September</span></div>
    {[['Rep A','82'],['Rep B','74'],['Rep C','68'],['Rep D','61']].map(([name,p])=><div className="list-row" key={name}><div className="list-row-top"><strong>{name}</strong><span>{p}%</span></div><div className="progress"><span style={{width:`${p}%`}}/></div></div>)}
  </article><article className="panel"><div className="panel-head"><h2>Lead sources</h2><span>186 active</span></div>{[['Facebook & Instagram','78'],['Website','44'],['WhatsApp','39'],['Walk-in / referral','25']].map(([source,count])=><div className="list-row" key={source}><div className="list-row-top"><strong>{source}</strong><span className="badge blue">{count}</span></div></div>)}</article></section>
  </AppShell>; }
