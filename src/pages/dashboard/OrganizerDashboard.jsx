import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../../components/layout/Topbar.jsx';
import StatCard from '../../components/ui/StatCard.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { PageSpinner } from '../../components/ui/Spinner.jsx';
import { dashboardService } from '../../services/dashboard.service.js';
import Icon from '../../components/ui/Icon.jsx';
import { ChartCard, AreaTrend, BarSeries, PieBreakdown, CHART_COLORS } from '../../components/ui/Charts.jsx';

const fmtMonth = (d) => new Date(d).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
const truncate = (s, n = 14) => (s && s.length > n ? s.slice(0, n - 1) + '…' : s);

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

  if (loading) return (<><Topbar /><div className="page-content"><PageSpinner /></div></>);
  if (error) return (<><Topbar /><div className="page-content"><div className="auth-error"><Icon name="warning" size={16} /> {error}</div></div></>);
  if (!data) return null;

  const e = data.events || {};
  const apps = data.applications || {};
  const tt = data.tickets || {};

  const eventsPie = [
    { name: 'Published', value: parseInt(e.published) || 0 },
    { name: 'Ongoing',   value: parseInt(e.ongoing) || 0 },
    { name: 'Completed', value: parseInt(e.completed) || 0 },
    { name: 'Draft',     value: parseInt(e.draft) || 0 },
  ].filter((s) => s.value > 0);

  const monthlyRevenue = (data.monthlyRevenue || []).map((m) => ({
    month: fmtMonth(m.month),
    revenue: m.revenue,
  }));
  const ticketsByEvent = (data.ticketsByEvent || []).map((r) => ({ name: truncate(r.title), sold: r.sold }));
  const attendanceByEvent = (data.attendanceByEvent || []).map((r) => ({
    name: truncate(r.title),
    expected: r.expected,
    attended: r.attended,
  }));
  const revenueByEvent = (data.revenueByEvent || []).map((r) => ({
    name: truncate(r.title),
    revenue: parseFloat(r.revenue),
  }));

  return (
    <>
      <Topbar />
      <div className="page-content">
        <div className="page-header">
          <div>
            <div className="page-title">Dashboard</div>
            <div className="page-subtitle">Your event analytics</div>
          </div>
        </div>

        {/* Top stats */}
        <div className="stats-grid">
          <StatCard icon={<Icon name="calendar" size={22} />} label="Total Events" value={e.total} color="cyan" />
          <StatCard icon={<Icon name="checkCircle" size={22} />} label="Active" value={(parseInt(e.published) || 0) + (parseInt(e.ongoing) || 0)} color="green" />
          <StatCard icon={<Icon name="ticket" size={22} />} label="Tickets Sold" value={tt.total} color="amber" />
          <StatCard icon={<Icon name="trophy" size={22} />} label="Revenue" value={`${(tt.revenue || 0).toFixed(0)} ৳`} color="purple" />
          <StatCard icon={<Icon name="users" size={22} />} label="Volunteers" value={apps.approved} sub={`${apps.pending || 0} pending`} color="green" />
        </div>

        {/* Charts row 1 — revenue + tickets */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginTop: 24 }}>
          <ChartCard
            title="Revenue Trend"
            subtitle="Last 6 months · BDT"
            height={260}
            empty={monthlyRevenue.length === 0 ? 'No revenue yet — sell some tickets!' : null}
          >
            <AreaTrend data={monthlyRevenue} xKey="month" yKey="revenue" color={CHART_COLORS.amber} valueLabel="৳" />
          </ChartCard>

          <ChartCard
            title="Tickets Sold per Event"
            subtitle="Your last 5 events"
            height={260}
            empty={ticketsByEvent.length === 0 ? 'No tickets sold yet' : null}
          >
            <BarSeries data={ticketsByEvent} xKey="name" yKey="sold" color={CHART_COLORS.cyan} valueLabel="Tickets" />
          </ChartCard>

          <ChartCard
            title="Event Status"
            subtitle="Across all your events"
            height={260}
            empty={eventsPie.length === 0 ? 'No events yet' : null}
          >
            <PieBreakdown
              data={eventsPie}
              colors={[CHART_COLORS.green, CHART_COLORS.cyan, CHART_COLORS.slate, CHART_COLORS.amber]}
            />
          </ChartCard>
        </div>

        {/* Charts row 2 — attendance + revenue per event */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20, marginTop: 20 }}>
          <ChartCard
            title="Expected vs Attended"
            subtitle="Your last 5 events with sold tickets"
            height={280}
            empty={attendanceByEvent.length === 0 ? 'No attendance data yet' : null}
          >
            <BarSeries
              data={attendanceByEvent}
              xKey="name"
              multiKeys={[
                { key: 'expected', label: 'Expected', color: CHART_COLORS.slate },
                { key: 'attended', label: 'Attended', color: CHART_COLORS.green },
              ]}
            />
          </ChartCard>

          <ChartCard
            title="Top Earning Events"
            subtitle="Top 5 by revenue"
            height={280}
            empty={revenueByEvent.length === 0 ? 'No paid tickets sold yet' : null}
          >
            <BarSeries data={revenueByEvent} xKey="name" yKey="revenue" color={CHART_COLORS.purple} valueLabel="৳" />
          </ChartCard>
        </div>

        {/* Top volunteers */}
        {data.topVolunteers?.length > 0 && (
          <div className="card" style={{ marginTop: 20 }}>
            <div className="card-title" style={{ marginBottom: 14 }}>Top Volunteers</div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Volunteer</th><th>Avg Rating</th><th>Reviews</th></tr></thead>
                <tbody>
                  {data.topVolunteers.map((v, i) => (
                    <tr key={i}>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{v.full_name || '—'}</td>
                      <td>
                        <Badge label={`${v.avg_rating} / 5`} color="amber" />
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{v.total_ratings}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
