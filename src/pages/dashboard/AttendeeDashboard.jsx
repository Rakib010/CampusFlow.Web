import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../../components/layout/Topbar.jsx';
import StatCard from '../../components/ui/StatCard.jsx';
import { PageSpinner } from '../../components/ui/Spinner.jsx';
import { dashboardService } from '../../services/dashboard.service.js';
import Icon from '../../components/ui/Icon.jsx';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AttendeeDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    dashboardService.attendeeDashboard()
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Topbar />
      <div className="page-content">
        <div className="page-header">
          <div>
            <div className="page-title">Dashboard</div>
            <div className="page-subtitle">Your event summary</div>
          </div>
        </div>
        {loading && <PageSpinner />}
        {data && (
          <>
            <div className="stats-grid">
              <StatCard icon={<Icon name="ticket" size={22} />} label="Tickets Purchased" value={data.totalTickets} color="cyan" />
              <StatCard icon={<Icon name="calendar" size={22} />} label="Upcoming Events" value={data.upcomingEvents} color="green" />
              <StatCard icon={<Icon name="checkCircle" size={22} />} label="Past Events" value={data.pastEvents} color="slate" />
            </div>
            {data.tickets?.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <div className="card-title">My Tickets</div>
                  <button className="btn btn-secondary btn-sm" onClick={() => navigate('/my-tickets')}>View all</button>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Event</th><th>Type</th><th>Date</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {data.tickets.slice(0, 5).map((t) => (
                        <tr key={t.id}>
                          <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{t.event_title || '—'}</td>
                          <td style={{ color: 'var(--text-muted)' }}>{t.ticket_type || '—'}</td>
                          <td>{fmtDate(t.purchased_at)}</td>
                          <td>
                            <span className={`badge badge-${t.payment_status === 'confirmed' ? 'green' : 'amber'}`}>
                              {t.payment_status}
                            </span>
                          </td>
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
