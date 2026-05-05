import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../../components/layout/Topbar.jsx';
import StatCard from '../../components/ui/StatCard.jsx';
import { PageSpinner } from '../../components/ui/Spinner.jsx';
import { dashboardService } from '../../services/dashboard.service.js';
import Icon from '../../components/ui/Icon.jsx';

export default function VolunteerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    dashboardService.volunteerDashboard()
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
            <div className="page-subtitle">Your volunteer summary</div>
          </div>
        </div>
        {loading && <PageSpinner />}
        {data && (
          <>
            <div className="stats-grid">
              <StatCard icon={<Icon name="clipboard" size={22} />} label="Total Applications" value={data.totalApplications} color="cyan" />
              <StatCard icon={<Icon name="checkCircle" size={22} />} label="Approved" value={data.approvedApplications} color="green" />
              <StatCard icon={<Icon name="clock" size={22} />} label="Volunteer Hours" value={data.totalHours} color="amber" />
              <StatCard icon={<Icon name="award" size={22} />} label="Certificates" value={data.totalCertificates} color="green" />
              <StatCard icon={<Icon name="star" size={22} />} label="Avg Rating" value={data.averageRating?.toFixed(1)} color="cyan" />
            </div>
            {data.upcomingEvents?.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <div className="card-title">Upcoming Events</div>
                  <button className="btn btn-secondary btn-sm" onClick={() => navigate('/events')}>Browse events</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {data.upcomingEvents.map((ev) => (
                    <div
                      key={ev.id}
                      style={{ padding: '12px 0', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}
                      onClick={() => navigate(`/events/${ev.id}`)}
                    >
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{ev.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{ev.location || 'No location'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
