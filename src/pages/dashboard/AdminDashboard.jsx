import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../../components/layout/Topbar.jsx';
import StatCard from '../../components/ui/StatCard.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { PageSpinner } from '../../components/ui/Spinner.jsx';
import { dashboardService } from '../../services/dashboard.service.js';
import useAuthStore from '../../stores/useAuthStore.js';
import Icon from '../../components/ui/Icon.jsx';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    dashboardService.adminDashboard()
      .then((r) => setData(r.data))
      .catch((e) => setError(e.response?.data?.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const fullName = user?.fullName || user?.full_name || user?.email?.split('@')[0] || 'Admin';

  return (
    <>
      <Topbar />
      <div className="page-content">
        <div className="page-header">
          <div>
            <div className="page-title">Dashboard</div>
            <div className="page-subtitle">{greeting}, {fullName}</div>
          </div>
        </div>
        {loading && <PageSpinner />}
        {error && (
          <div className="auth-error">
            <Icon name="warning" size={16} /> {error}
          </div>
        )}

        {data && (
          <>
            {/* Stats — using actual API shape: data.users.total, data.events.total, etc. */}
            <div className="stats-grid">
              <StatCard
                icon={<Icon name="users" size={22} />}
                label="Total Users"
                value={Number(data.users?.total ?? 0).toLocaleString()}
                color="cyan"
              />
              <StatCard
                icon={<Icon name="calendar" size={22} />}
                label="Total Events"
                value={Number(data.events?.total ?? 0).toLocaleString()}
                color="green"
              />
              <StatCard
                icon={<Icon name="ticket" size={22} />}
                label="Tickets Sold"
                value={Number(data.tickets?.total_tickets ?? 0).toLocaleString()}
                color="amber"
              />
              <StatCard
                icon={<Icon name="award" size={22} />}
                label="Volunteers"
                value={Number(data.users?.volunteers ?? 0).toLocaleString()}
                color="green"
              />
              <StatCard
                icon={<Icon name="clock" size={22} />}
                label="Pending Approvals"
                value={Number(data.users?.pending_organizers ?? 0)}
                color={Number(data.users?.pending_organizers) > 0 ? 'amber' : 'cyan'}
                sub={Number(data.users?.pending_organizers) > 0 ? 'Organizers awaiting approval' : 'All clear'}
              />
              <StatCard
                icon={<Icon name="trophy" size={22} />}
                label="Revenue"
                value={`${Number(data.revenue ?? 0).toFixed(2)} ৳`}
                color="amber"
              />
            </div>

            {/* Active events breakdown */}
            {data.events && (
              <div className="stats-grid" style={{ marginBottom: 24 }}>
                {[
                  { key: 'published', label: 'Published', color: 'green' },
                  { key: 'ongoing', label: 'Ongoing', color: 'cyan' },
                  { key: 'completed', label: 'Completed', color: 'slate' },
                  { key: 'draft', label: 'Drafts', color: 'amber' },
                  { key: 'cancelled', label: 'Cancelled', color: 'red' },
                ].map(({ key, label, color }) => (
                  <div key={key} className="card card-sm" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 22, color: 'var(--text-primary)' }}>
                      {Number(data.events[key] ?? 0)}
                    </div>
                    <Badge label={key} color={color} />
                  </div>
                ))}
              </div>
            )}

            {/* Recent Events */}
            {data.recentEvents?.length > 0 ? (
              <div className="card">
                <div className="card-header">
                  <div>
                    <div className="card-title">Recent Events</div>
                    <div className="card-subtitle">Latest activity on the platform</div>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={() => navigate('/events')}>View all</button>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Event</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Category</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentEvents.map((ev) => (
                        <tr key={ev.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/events/${ev.id}`)}>
                          <td>
                            <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{ev.title}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{ev.location || 'No location'}</div>
                          </td>
                          <td><Badge label={ev.status} /></td>
                          <td>{fmtDate(ev.start_date)}</td>
                          <td><span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{ev.category || '—'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="card">
                <div className="card-header">
                  <div>
                    <div className="card-title">Events</div>
                    <div className="card-subtitle">No events yet</div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => navigate('/events/create')}>Create event</button>
                </div>
                <div className="empty-state">
                  <div className="empty-state-icon" style={{ color: 'var(--text-muted)' }}><Icon name="calendar" size={40} strokeWidth={1.4} /></div>
                  <div className="empty-state-title">No events on the platform yet</div>
                  <div className="empty-state-desc">Organizers will create events once their accounts are approved.</div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
