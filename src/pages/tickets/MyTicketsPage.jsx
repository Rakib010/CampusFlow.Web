import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../../components/layout/Topbar.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { PageSpinner } from '../../components/ui/Spinner.jsx';
import { ticketsService } from '../../services/tickets.service.js';
import { feedbackService } from '../../services/feedback.service.js';
import { eventsService } from '../../services/events.service.js';
import useToastStore from '../../stores/useToastStore.js';
import Icon from '../../components/ui/Icon.jsx';
import RatingModal from '../../components/ui/RatingModal.jsx';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [qrFullscreen, setQrFullscreen] = useState(null); // ticket whose QR is being shown fullscreen
  const [rating, setRating] = useState(null); // { eventId, eventTitle, organizerId } when modal open
  const navigate = useNavigate();

  useEffect(() => {
    ticketsService.getMyTickets()
      .then((r) => setTickets(r.data || []))
      .catch(() => useToastStore.getState().error('Failed to load tickets.'))
      .finally(() => setLoading(false));
  }, []);

  const handleDownloadQr = async (ticket) => {
    if (!ticket?.qr_code_url) return;
    const eventSlug = (ticket.event_title || 'event').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const filename = `ticket-${eventSlug}-${ticket.id?.slice(0, 8) || 'qr'}.png`;
    try {
      const res = await fetch(ticket.qr_code_url);
      if (!res.ok) throw new Error('Failed to fetch QR');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      useToastStore.getState().success('QR code downloaded.');
    } catch {
      // Fallback: open the image in a new tab so the user can right-click → save
      window.open(ticket.qr_code_url, '_blank', 'noopener');
      useToastStore.getState().info('QR opened in a new tab — right-click to save.');
    }
  };

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
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span>{t.ticket_type_name || t.ticket_type || 'General'} · {fmtDate(t.event_date || t.purchased_at)}</span>
                    {t.short_code && (
                      <span style={{
                        fontFamily: 'monospace',
                        fontSize: 11,
                        color: 'var(--accent)',
                        background: 'rgba(34,211,238,0.1)',
                        padding: '2px 6px',
                        borderRadius: 4,
                        letterSpacing: '0.05em',
                      }}>{t.short_code}</span>
                    )}
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
              <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>
                <Icon name="x" size={14} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: selected.qr_code_url ? '1fr 200px' : '1fr', gap: 24, alignItems: 'start' }}>
              {/* Ticket info */}
              <div>
                {/* Big ticket-code badge */}
                {selected.short_code && (
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(34,211,238,0.12), rgba(8,145,178,0.06))',
                    border: '1px solid rgba(34,211,238,0.35)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px 16px',
                    marginBottom: 14,
                  }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Ticket code</div>
                    <div style={{
                      fontSize: 22,
                      fontWeight: 700,
                      color: 'var(--accent)',
                      fontFamily: 'monospace',
                      letterSpacing: '0.05em',
                      userSelect: 'all',
                    }}>{selected.short_code}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      Show this code or your QR at the entrance
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px' }}>
                  {[
                    ['Event', selected.event_title],
                    ['Type', selected.ticket_type_name || selected.ticket_type || 'General'],
                    ['Payment', selected.payment_type],
                    ['Status', selected.payment_status || selected.status],
                    ['Price', selected.price != null ? `${Number(selected.price).toFixed(2)} ৳` : 'Free'],
                    ['Expires', selected.expires_at
                      ? new Date(selected.expires_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
                      : '—'],
                    ['Purchased', fmtDate(selected.purchased_at || selected.created_at)],
                    ['Check-in', selected.checked_in_at ? fmtDate(selected.checked_in_at) : 'Not yet'],
                  ].map(([label, val]) => (
                    <div key={label} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 14, color: 'var(--text-default)' }}>{val || '—'}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* QR code preview */}
              {selected.qr_code_url && (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                  padding: 14,
                  background: 'white',
                  borderRadius: 'var(--radius-md)',
                }}>
                  <img
                    src={selected.qr_code_url}
                    alt="Ticket QR code"
                    style={{ width: 170, height: 170, display: 'block' }}
                  />
                  <div style={{ fontSize: 11, color: '#475569', textAlign: 'center' }}>
                    Show this at the entrance
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {selected.qr_code_url && (
                <>
                  <button className="btn btn-primary btn-sm" onClick={() => setQrFullscreen(selected)}>
                    <Icon name="qr" size={14} /> Show at Entrance
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleDownloadQr(selected)}>
                    <Icon name="download" size={14} /> Download QR
                  </button>
                </>
              )}
              {/* Rate Event — only for completed events the attendee was checked in to */}
              {selected.event_status === 'completed' && (
                <button
                  className="btn btn-success btn-sm"
                  onClick={() => setRating({
                    eventId: selected.event_id,
                    eventTitle: selected.event_title,
                  })}
                >
                  <Icon name="star" size={14} /> Rate this Event
                </button>
              )}
              {selected.event_id && (
                <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/events/${selected.event_id}`)}>
                  View Event
                </button>
              )}
            </div>
          </div>
        )}

        {/* Fullscreen QR overlay (for showing at the gate) */}
        {rating && (
          <RatingModal
            title={`Rate "${rating.eventTitle}"`}
            subtitle="Help future attendees by sharing your experience"
            onClose={() => setRating(null)}
            onSubmit={(payload) => feedbackService.submitEventFeedback(rating.eventId, payload)}
            submitLabel="Submit Rating"
          />
        )}

        {qrFullscreen && (
          <div
            onClick={() => setQrFullscreen(null)}
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              background: 'rgba(0,0,0,0.92)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              padding: 20,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'white',
                padding: 32,
                borderRadius: 'var(--radius-xl)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
                maxWidth: 'min(90vw, 460px)',
                cursor: 'default',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
                  {qrFullscreen.event_title || 'Event Ticket'}
                </div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                  {qrFullscreen.ticket_type_name || qrFullscreen.ticket_type || 'General'} ·{' '}
                  ID {qrFullscreen.id?.slice(0, 8)}
                </div>
              </div>

              <img
                src={qrFullscreen.qr_code_url}
                alt="Ticket QR code"
                style={{ width: 'min(70vw, 320px)', height: 'min(70vw, 320px)', display: 'block' }}
              />

              <div style={{ fontSize: 12, color: '#475569', textAlign: 'center', maxWidth: 320, lineHeight: 1.5 }}>
                Show this QR to the organizer or volunteer staff at the entrance.
                Tap anywhere outside to close.
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleDownloadQr(qrFullscreen)}
                >
                  <Icon name="download" size={14} /> Download
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setQrFullscreen(null)}
                  style={{ background: '#e2e8f0', color: '#0f172a' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
