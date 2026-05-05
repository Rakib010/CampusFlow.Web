import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../../components/layout/Topbar.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { PageSpinner } from '../../components/ui/Spinner.jsx';
import { ticketsService } from '../../services/tickets.service.js';
import useToastStore from '../../stores/useToastStore.js';
import Icon from '../../components/ui/Icon.jsx';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    ticketsService.getMyTickets()
      .then((r) => setTickets(r.data || []))
      .catch(() => useToastStore.getState().error('Failed to load tickets.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Topbar />
      <div className="page-content">
        <div className="page-header">
          <div>
            <div className="page-title">My Tickets</div>
            <div className="page-subtitle">Tickets you have purchased · {tickets.length} total</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/events')}>Browse Events</button>
        </div>

        {loading ? <PageSpinner /> : tickets.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon" style={{ color: 'var(--text-muted)' }}>
              <Icon name="ticket" size={40} strokeWidth={1.4} />
            </div>
            <div className="empty-state-title">No tickets yet</div>
            <div className="empty-state-desc">Browse events and purchase a ticket to attend.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {tickets.map((t) => (
              <div
                key={t.id}
                className="card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 20,
                  cursor: 'pointer',
                  padding: '18px 24px',
                  transition: 'border-color var(--transition-fast)',
                }}
                onClick={() => setSelected(selected?.id === t.id ? null : t)}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(34,211,238,0.3)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
              >
                {/* Ticket icon */}
                <div style={{
                  width: 48, height: 48, borderRadius: 'var(--radius-md)',
                  background: 'rgba(34,211,238,0.1)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  color: 'var(--accent)', flexShrink: 0,
                }}>
                  <Icon name="ticket" size={22} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 15 }}>
                    {t.event_title || 'Event'}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
                    {t.ticket_type_name || t.ticket_type || 'General'} · {fmtDate(t.event_date || t.purchased_at)}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
                  <Badge
                    label={t.payment_status || t.status || 'pending'}
                    color={t.payment_status === 'confirmed' ? 'green' : 'amber'}
                  />
                  {t.price != null && (
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {Number(t.price).toFixed(2)} ৳
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Ticket detail panel */}
        {selected && (
          <div className="card" style={{ marginTop: 20, background: 'rgba(34,211,238,0.04)', borderColor: 'rgba(34,211,238,0.2)' }}>
            <div className="card-header">
              <div className="card-title">Ticket Details</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px' }}>
              {[
                ['Ticket ID', selected.id?.slice(0, 8) + '…'],
                ['Event', selected.event_title],
                ['Type', selected.ticket_type_name || selected.ticket_type || 'General'],
                ['Payment', selected.payment_type],
                ['Status', selected.payment_status || selected.status],
                ['Price', selected.price != null ? `${Number(selected.price).toFixed(2)} ৳` : 'Free'],
                ['Purchased', fmtDate(selected.purchased_at || selected.created_at)],
                ['Check-in', selected.checked_in_at ? fmtDate(selected.checked_in_at) : 'Not yet'],
              ].map(([label, val]) => (
                <div key={label} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 14, color: 'var(--text-default)' }}>{val || '—'}</div>
                </div>
              ))}
            </div>
            {selected.event_id && (
              <div style={{ marginTop: 16 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/events/${selected.event_id}`)}>
                  View Event
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
