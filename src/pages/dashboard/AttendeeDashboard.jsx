import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../../components/layout/Topbar.jsx';
import StatCard from '../../components/ui/StatCard.jsx';
import { PageSpinner } from '../../components/ui/Spinner.jsx';
import { dashboardService } from '../../services/dashboard.service.js';
import Icon from '../../components/ui/Icon.jsx';
import { ChartCard, AreaTrend, PieBreakdown, BarSeries, CHART_COLORS } from '../../components/ui/Charts.jsx';

const fmtMonth = (d) => new Date(d).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });

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

  if (loading) return (<><Topbar /><div className="page-content"><PageSpinner /></div></>);
  if (!data) return (<><Topbar /><div className="page-content">Failed to load dashboard.</div></>);

  const t = data.tickets || {};
  const attendanceRate = t.total > 0 ? Math.round((t.attended / t.total) * 100) : 0;
  const monthlyTickets = (data.monthlyTickets || []).map((m) => ({
    month: fmtMonth(m.month),
    count: m.count,
    spent: m.spent,
  }));
  const categoryPie = (data.byCategory || []).map((c) => ({ name: c.category, value: c.count }));

  return (
    <>
      <Topbar />
      <div className="page-content">
        <div className="page-header">
          <div>
            <div className="page-title">Dashboard</div>
            <div className="page-subtitle">Your event activity overview</div>
          </div>
        </div>

        {/* Top stats */}
        <div className="stats-grid">
          <StatCard icon={<Icon name="ticket" size={22} />} label="Tickets" value={t.total || 0} color="cyan" />
          <StatCard
            icon={<Icon name="checkCircle" size={22} />}
            label="Attended"
            value={t.attended || 0}
            sub={`${attendanceRate}% attendance rate`}
            color="green"
          />
          <StatCard icon={<Icon name="trophy" size={22} />} label="Total Spent" value={`${(data.totalSpent || 0).toFixed(0)} ৳`} color="amber" />
          <StatCard icon={<Icon name="star" size={22} />} label="Reviews Given" value={data.feedbackGiven} color="purple" />
        </div>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginTop: 24 }}>
          <ChartCard
            title="Tickets Bought"
            subtitle="Last 6 months"
            empty={monthlyTickets.length === 0 ? 'No tickets purchased yet' : null}
          >
            <BarSeries data={monthlyTickets} xKey="month" yKey="count" color={CHART_COLORS.cyan} valueLabel="Tickets" />
          </ChartCard>

          <ChartCard
            title="Spending Trend"
            subtitle="Last 6 months · BDT"
            empty={monthlyTickets.length === 0 ? 'No spending recorded yet' : null}
          >
            <AreaTrend data={monthlyTickets} xKey="month" yKey="spent" color={CHART_COLORS.amber} valueLabel="৳" />
          </ChartCard>

          <ChartCard
            title="Events by Category"
            subtitle="Where you spend your time"
            empty={categoryPie.length === 0 ? 'Attend events to see your taste profile' : null}
          >
            <PieBreakdown data={categoryPie} />
          </ChartCard>

          <ChartCard
            title="Attendance Rate"
            subtitle={`${t.attended || 0} of ${t.total || 0} tickets used`}
            empty={!t.total ? 'Buy a ticket to track this' : null}
          >
            {t.total > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
                <div style={{ fontSize: 56, fontWeight: 700, color: CHART_COLORS.green, fontFamily: 'monospace', lineHeight: 1 }}>
                  {attendanceRate}%
                </div>
                {/* Progress bar */}
                <div style={{ width: '70%', height: 8, background: 'rgba(74,222,128,0.15)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    width: `${attendanceRate}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${CHART_COLORS.green}, ${CHART_COLORS.cyan})`,
                    transition: 'width 0.6s ease',
                  }} />
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {t.attended} attended / {t.total - t.attended} no-show
                </div>
              </div>
            )}
          </ChartCard>
        </div>

        {/* Recent attendance */}
        {data.recentAttendance?.length > 0 && (
          <div className="card" style={{ marginTop: 20 }}>
            <div className="card-header">
              <div className="card-title">Recent Check-ins</div>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('/my-tickets')}>My Tickets</button>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Event</th><th>Checked In</th><th>Checked Out</th></tr></thead>
                <tbody>
                  {data.recentAttendance.map((a, i) => (
                    <tr key={i}>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{a.event_title}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                        {a.check_in_time ? new Date(a.check_in_time).toLocaleString() : '—'}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                        {a.check_out_time ? new Date(a.check_out_time).toLocaleString() : '—'}
                      </td>
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
