export default function StatCard({ icon, label, value, color = 'cyan', sub }) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <div className={`stat-card-icon ${color}`}>{icon}</div>
        <div className="stat-card-value">{value ?? '—'}</div>
      </div>
      <div className="stat-card-label">{label}</div>
      {sub && <div className="stat-card-sub">{sub}</div>}
    </div>
  );
}
