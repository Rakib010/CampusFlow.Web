import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../../components/layout/Topbar.jsx';
import StatCard from '../../components/ui/StatCard.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { PageSpinner } from '../../components/ui/Spinner.jsx';
import { dashboardService } from '../../services/dashboard.service.js';
import Icon from '../../components/ui/Icon.jsx';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function OrganizerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    dashboardService.organizerDashboard()
      .then((r) => setData(r.data))
      .catch((e) => setError(e.response?.data?.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Topbar />
      <div className="page-content">
        <div className="page-header">
          <div>
            <div className="page-title">Dashboard</div>
            <div className="page-subtitle">Your event overview</div>
          </div>
        </div>
        {loading && <PageSpinner />}
        {error && <div className="auth-error"><Icon name="warning" size={16} /> {error}</div>}
        {data && (
          <>
            <div className="stats-grid">
              <StatCard icon={<Icon name="calendar" size={22} />} label="Total Events" value={data.totalEvents} color="cyan" />
              <StatCard icon={<Icon name="checkCircle" size={22} />} label="Active Events" value={data.activeEvents} color="green" />
              <StatCard icon={<Icon name="ticket" size={22} />} label="Tickets Sold" value={data.totalTicketsSold} color="amber" />
              <StatCard icon={<Icon name="users" size={22} />} label="Volunteers" value={data.totalVolunteers} color="green" />
              <StatCard icon={<Icon name="clock" size={22} />} label="Pending Applications" value={data.pendingApplications} color="amber" />
            </div>
            {data.upcomingEvents?.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <div className="card-title">Upcoming Events</div>
                  <button className="btn btn-secondary btn-sm" onClick={() => navigate('/events')}>View all</button>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Event</th><th>Status</th><th>Starts</th></tr>
                    </thead>
                    <tbody>
                      {data.upcomingEvents.map((ev) => (
                        <tr key={ev.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/events/${ev.id}`)}>
                          <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{ev.title}</td>
                          <td><Badge label={ev.status} /></td>
                          <td>{fmtDate(ev.start_date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
