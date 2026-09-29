import { AppShell } from "@/components/app-shell";
import { PageHeading } from "@/components/page-heading";
import { StatCard } from "@/components/stat-card";
import { BranchFilter } from "@/components/branch-filter";
import { getStaffContext, selectedBranch, scopeName } from "@/lib/staff";
import { formattedDate, liveCount } from "@/lib/live-data";

export default async function ManufacturingPage({ searchParams }: { searchParams: Promise<{ branch?: string }> }) {
  const context = await getStaffContext();
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
