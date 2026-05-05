export default function StatCard({ icon, label, value, color = 'cyan', sub }) {
  return (
    <div className="stat-card">
      <div className={`stat-card-icon ${color}`}>{icon}</div>
      <div className="stat-card-body">
        <div className="stat-card-value">{value ?? '—'}</div>
        <div className="stat-card-label">{label}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
      </div>
    </div>
  );
}
