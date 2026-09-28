import { AppShell } from "@/components/app-shell";
import { PageHeading } from "@/components/page-heading";
import { StatCard } from "@/components/stat-card";
import { BranchFilter } from "@/components/branch-filter";
import { getStaffContext, selectedBranch, scopeName } from "@/lib/staff";
import { formattedDate, liveCount } from "@/lib/live-data";

const jobs=[['SB-1048','9×15 m frame tent','Welding','23 Sep','On track','blue'],['SB-1044','Double axle freezer','Assembly','25 Sep','On track',''],['SB-1041','7×12 m blockout tent','PVC sewing','19 Sep','At risk','orange'],['SB-1039','VIP trailer toilet','Finishing','18 Sep','Delayed','red']];
export default async function ManufacturingPage({ searchParams }: { searchParams: Promise<{ branch?: string }> }) {
  const context = await getStaffContext();
  if (context.preview) return <PreviewManufacturingPage />;
  const branchId = selectedBranch(context, (await searchParams).branch);
  const [open, blocked, ready, delivered] = await Promise.all([
    liveCount(context, "production_jobs", branchId, { column: "status", value: "delivered", exclude: true }),
    liveCount(context, "production_jobs", branchId, { column: "status", value: "blocked" }),
    liveCount(context, "production_jobs", branchId, { column: "status", value: "ready" }),
    liveCount(context, "production_jobs", branchId, { column: "status", value: "delivered" }),
  ]);
  let query = context.supabase.from("production_jobs")
    .select("id, department, status, priority, due_date, created_at")
    .order("created_at", { ascending: false }).limit(12);
  if (branchId) query = query.eq("branch_id", branchId);
  const { data: recentJobs, error } = await query;
  if (error) throw new Error("Unable to load production jobs.");
  return <AppShell active="Manufacturing">
    <PageHeading title="Manufacturing" description={`Live production job status · ${scopeName(context, branchId)}`} />
    <BranchFilter context={context} branchId={branchId} />
    <section className="stats">
      <StatCard label="Open jobs" value={String(open)} note="All except delivered" />
      <StatCard label="Blocked" value={String(blocked)} note="Needs intervention" warning />
      <StatCard label="Ready" value={String(ready)} note="Awaiting next step" />
      <StatCard label="Delivered" value={String(delivered)} note="Recorded as delivered" />
    </section>
    <article className="panel"><div className="panel-head"><h2>Recent jobs</h2><span>{scopeName(context, branchId)}</span></div>
      <div className="table-wrap"><table><thead><tr><th>Department</th><th>Status</th><th>Priority</th><th>Due</th></tr></thead>
        <tbody>{(recentJobs ?? []).map((job) => <tr key={job.id}><td><strong>{job.department}</strong></td><td><span className="badge blue">{job.status.replaceAll("_", " ")}</span></td><td>{job.priority}</td><td>{formattedDate(job.due_date)}</td></tr>)}</tbody>
      </table></div>
      {!recentJobs?.length && <p className="empty-state">No production jobs recorded for this view yet.</p>}
    </article>
  </AppShell>;
}

function PreviewManufacturingPage(){return <AppShell active="Manufacturing"><PageHeading title="Manufacturing" description="Example production layout and schedule." action="Create production job"/><section className="stats"><StatCard label="Open jobs" value="37" note="9 due this week"/><StatCard label="On schedule" value="76%" note="28 jobs on track"/><StatCard label="Material warnings" value="4" note="Purchasing action needed" warning/><StatCard label="Completed this month" value="63" note="↑ 11 from August"/></section><section className="grid-two"><article className="panel"><div className="panel-head"><h2>Production schedule</h2><span>All factories</span></div><div className="table-wrap"><table><thead><tr><th>Job</th><th>Product</th><th>Department</th><th>Due</th><th>Status</th></tr></thead><tbody>{jobs.map(([id,p,d,due,status,color])=><tr key={id}><td><strong>{id}</strong></td><td>{p}</td><td>{d}</td><td>{due}</td><td><span className={`badge ${color}`}>{status}</span></td></tr>)}</tbody></table></div></article><article className="panel"><div className="panel-head"><h2>Factory capacity</h2><span>This week</span></div>{[['PVC Sewing','88'],['HF Welding','72'],['Steel Fabrication','81'],['Coldroom Assembly','64']].map(([name,p])=><div className="list-row" key={name}><div className="list-row-top"><strong>{name}</strong><span>{p}%</span></div><div className="progress"><span style={{width:`${p}%`}}/></div></div>)}</article></section></AppShell>}
