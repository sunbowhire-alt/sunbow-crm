export function StatCard({ label, value, note, warning = false }: { label: string; value: string; note: string; warning?: boolean }) {
  return <article className="stat-card"><span>{label}</span><strong>{value}</strong><div className={`trend${warning ? " warn" : ""}`}>{note}</div></article>;
}
