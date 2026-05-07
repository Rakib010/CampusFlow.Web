import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Topbar from '../../components/layout/Topbar.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Icon from '../../components/ui/Icon.jsx';
import Countdown from '../../components/ui/Countdown.jsx';
import { PageSpinner } from '../../components/ui/Spinner.jsx';
import { ConfirmModal } from '../../components/ui/Modal.jsx';
import { eventsService } from '../../services/events.service.js';
import { usersService } from '../../services/users.service.js';
import { volunteersService } from '../../services/volunteers.service.js';
import { ticketsService } from '../../services/tickets.service.js';
import { paymentMethodsService, PAYMENT_METHOD_TYPES } from '../../services/paymentMethods.service.js';
import { feedbackService } from '../../services/feedback.service.js';
import StarRating from '../../components/ui/StarRating.jsx';
import useAuthStore from '../../stores/useAuthStore.js';
import useToastStore from '../../stores/useToastStore.js';

const STATUS_FLOW = { draft: 'published', published: 'ongoing', ongoing: 'completed' };
const CAN_MANAGE = ['ORGANIZER', 'ADMIN', 'SUPER_ADMIN'];

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtTime(d) {
  if (!d) return '';
  return new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function MetaCard({ icon, label, value, color = 'cyan' }) {
  const colorMap = {
    cyan:   { bg: 'rgba(34,211,238,0.08)',  fg: 'var(--cyan-400)' },
    green:  { bg: 'rgba(34,197,94,0.08)',   fg: 'var(--green-400)' },
    amber:  { bg: 'rgba(245,158,11,0.08)',  fg: 'var(--amber-400)' },
    purple: { bg: 'rgba(168,85,247,0.08)',  fg: 'var(--purple-400)' },
    slate:  { bg: 'rgba(148,163,184,0.08)', fg: 'var(--slate-400)' },
  };
  const c = colorMap[color] || colorMap.cyan;
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px' }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: c.bg, color: c.fg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon name={icon} size={20} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 600, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={typeof value === 'string' ? value : undefined}>
          {value || '—'}
        </div>
      </div>
    </div>
  );
}

const STATUS_COLOR = {
  draft: 'amber', published: 'green', ongoing: 'cyan',
  completed: 'slate', cancelled: 'red',
};

export default function EventDetailPage() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmStatus, setConfirmStatus] = useState(false);
  const [showReassign, setShowReassign] = useState(false);
  const [organizers, setOrganizers] = useState([]);
  const [reassignLoading, setReassignLoading] = useState(false);
  const [selectedOrganizerId, setSelectedOrganizerId] = useState('');

  // Volunteer apply flow
  const [needs, setNeeds] = useState([]);
  const [myApplication, setMyApplication] = useState(null);
  const [applyingNeedId, setApplyingNeedId] = useState(null);

  // Attendee ticket purchase flow
  const [ticketTypes, setTicketTypes] = useState([]);
  const [myTicket, setMyTicket] = useState(null);
  const [buyingTypeId, setBuyingTypeId] = useState(null);
  const [paymentType, setPaymentType] = useState('cash');
  const [showBuyModal, setShowBuyModal] = useState(null); // holds the selected ticket type
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentReference, setPaymentReference] = useState('');

  // Event-level feedback (visible when completed)
  const [eventFeedback, setEventFeedback] = useState(null); // { average, count, comments: [...] }
  const { user } = useAuthStore();
  const toast = useToastStore();
  const navigate = useNavigate();

  useEffect(() => {
    eventsService.getEvent(id)
      .then((r) => {
        setEvent(r.data);
        // Once we know it's completed, fetch event feedback
        if (r.data?.status === 'completed') {
          feedbackService.getEventFeedback(id).then((fb) => {
            const list = Array.isArray(fb.data) ? fb.data : fb.data?.feedback || [];
            if (list.length > 0) {
              const avg = list.reduce((acc, x) => acc + (x.rating || x.score || 0), 0) / list.length;
              setEventFeedback({ average: avg, count: list.length, list });
            } else {
              setEventFeedback({ average: 0, count: 0, list: [] });
            }
          }).catch(() => { /* ignore */ });
        }
      })
      .catch(() => { toast.error('Event not found.'); navigate('/events'); })
      .finally(() => setLoading(false));
  }, [id, navigate, toast]);

  // Load volunteer needs + existing application (volunteer only)
  useEffect(() => {
    if (user?.role !== 'VOLUNTEER') return;
    Promise.allSettled([
      volunteersService.getNeedsByEvent(id),
      volunteersService.getMyApplications(),
    ]).then(([needsRes, appsRes]) => {
      if (needsRes.status === 'fulfilled') {
        setNeeds(needsRes.value.data || []);
      }
      if (appsRes.status === 'fulfilled') {
        const all = appsRes.value.data || [];
        const existing = all.find((a) => a.event_id === id);
        if (existing) setMyApplication(existing);
      }
    });
  }, [id, user?.role]);

  // Load ticket types + existing ticket + payment methods (attendee only)
  useEffect(() => {
    if (user?.role !== 'ATTENDEE') return;
    Promise.allSettled([
      ticketsService.getTicketTypes(id),
      ticketsService.getMyTickets(),
      paymentMethodsService.list(id),
    ]).then(([typesRes, ticketsRes, methodsRes]) => {
      if (typesRes.status === 'fulfilled') {
        setTicketTypes(typesRes.value.data || []);
      }
      if (ticketsRes.status === 'fulfilled') {
        const all = ticketsRes.value.data || [];
        const existing = all.find((t) => t.event_id === id);
        if (existing) setMyTicket(existing);
      }
      if (methodsRes.status === 'fulfilled') {
        setPaymentMethods(methodsRes.value.data || []);
      }
    });
  }, [id, user?.role]);

  const isOwner = user && event && (
    user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || event.organizer_id === user.id
  );
  const canManage = CAN_MANAGE.includes(user?.role) && isOwner;
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isVolunteer = user?.role === 'VOLUNTEER';
  const isAttendee = user?.role === 'ATTENDEE';
  const nextStatus = event ? STATUS_FLOW[event.status] : null;

  const handleApply = async (needId) => {
    setApplyingNeedId(needId);
    try {
      const res = await volunteersService.applyToEvent(id, needId ? { needId } : {});
      setMyApplication(res.data || { status: 'pending', need_id: needId, event_id: id });
      toast.success('Application submitted! The organizer will review it.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply.');
    } finally {
      setApplyingNeedId(null);
    }
  };

  const handleBuyTicket = async () => {
    if (!showBuyModal) return;
    if (paymentType === 'online' && !paymentReference.trim()) {
      toast.error('Please enter your transaction ID after sending the payment.');
      return;
    }
    setBuyingTypeId(showBuyModal.id);
    try {
      const res = await ticketsService.purchaseTicket({
        ticketTypeId: showBuyModal.id,
        paymentType,
        paymentReference: paymentType === 'online' ? paymentReference.trim() : undefined,
      });
      setMyTicket(res.data || { event_id: id, payment_status: 'pending' });
      toast.success(
        paymentType === 'cash'
          ? 'Ticket reserved! Pay at the venue — the organizer will confirm your payment.'
          : 'Ticket reserved! The organizer will verify your transaction and confirm.'
      );
      setShowBuyModal(null);
      setPaymentReference('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to purchase ticket.');
    } finally {
      setBuyingTypeId(null);
    }
  };

  const openReassign = async () => {
    setShowReassign(true);
    setSelectedOrganizerId('');
    if (organizers.length === 0) {
      try {
        const r = await usersService.listUsers({ role: 'ORGANIZER', isApproved: 'true', limit: 100 });
        setOrganizers(r.data || []);
      } catch {
        toast.error('Failed to load organizers list.');
      }
    }
  };

  const handleReassign = async () => {
    if (!selectedOrganizerId) return;
    setReassignLoading(true);
    try {
      await eventsService.reassignOrganizer(id, selectedOrganizerId);
      // Refresh event to get the new organizer info
      const r = await eventsService.getEvent(id);
      setEvent(r.data);
      toast.success('Event organizer reassigned.');
      setShowReassign(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reassign organizer.');
    } finally {
      setReassignLoading(false);
    }
  };

  const handleAdvanceStatus = async () => {
    try {
      await eventsService.updateStatus(id, nextStatus);
      toast.success(`Event status updated to "${nextStatus}".`);
      setEvent((e) => ({ ...e, status: nextStatus }));
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update status.');
    }
  };

  const handleCancel = async () => {
    try {
      await eventsService.updateStatus(id, 'cancelled');
      toast.success('Event cancelled.');
      setEvent((e) => ({ ...e, status: 'cancelled' }));
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to cancel.');
    }
  };

  const handleDelete = async () => {
    try {
      await eventsService.deleteEvent(id);
      toast.success('Event deleted.');
      navigate('/events');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to delete event.');
    }
  };

  if (loading) return (
    <>
      <Topbar />
      <div className="page-content"><PageSpinner /></div>
    </>
  );

  if (!event) return null;

  const startDate = fmtDate(event.start_date);
  const startTime = fmtTime(event.start_date);
  const endDate = fmtDate(event.end_date);
  const venueRaw = event.venue || event.location || '';
  const isOnline = /^https?:\/\//i.test(venueRaw);
  const venue = venueRaw || 'Not specified';
  const capacity = event.max_volunteers ? `${event.max_volunteers} spots` : 'Unlimited';

  return (
    <>
      <Topbar />
      <div className="page-content">
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          {/* Back link */}
          <button
            className="btn btn-ghost btn-sm"
            style={{ marginBottom: 16, paddingLeft: 0 }}
            onClick={() => navigate('/events')}
          >
            <Icon name="arrowLeft" size={14} /> Back to events
          </button>

          {/* Hero card */}
          <div className="card" style={{
            padding: 0,
            marginBottom: 20,
            overflow: 'hidden',
            background: 'linear-gradient(135deg, rgba(34,211,238,0.04) 0%, rgba(8,145,178,0.02) 100%)',
            borderColor: 'rgba(34,211,238,0.2)',
          }}>
            {/* Banner with main countdown overlay */}
            {event.banner_url ? (
              <div style={{
                height: 220,
                background: `linear-gradient(180deg, transparent 0%, rgba(10,22,40,0.85) 100%), url(${event.banner_url}) center/cover no-repeat`,
                position: 'relative',
              }}>
                {/* Main event countdown — overlaid bottom-right (only when active) */}
                {(event.status === 'published' || event.status === 'ongoing') && (
                  <div style={{
                    position: 'absolute',
                    right: 20,
                    bottom: 20,
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    background: 'rgba(10,22,40,0.55)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 4,
                  }}>
                    <Countdown
                      target={event.status === 'ongoing' ? event.end_date : event.start_date}
                      variant={event.status === 'ongoing' ? 'ends' : 'starts'}
                      label={event.status === 'ongoing' ? 'Ends in' : 'Starts in'}
                      size="md"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                height: 100,
                background: 'linear-gradient(135deg, rgba(34,211,238,0.15) 0%, rgba(8,145,178,0.08) 100%)',
                borderBottom: '1px solid var(--border-subtle)',
                position: 'relative',
              }}>
                {(event.status === 'published' || event.status === 'ongoing') && (
                  <div style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)' }}>
                    <Countdown
                      target={event.status === 'ongoing' ? event.end_date : event.start_date}
                      variant={event.status === 'ongoing' ? 'ends' : 'starts'}
                      label={event.status === 'ongoing' ? 'Ends in' : 'Starts in'}
                      size="sm"
                    />
                  </div>
                )}
              </div>
            )}

            <div style={{ padding: '24px 28px' }}>
              {/* Title row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                    {/* Status hidden when 'published' (it's the normal state and would just be noise) */}
                    {event.status && event.status !== 'published' && (
                      <Badge label={event.status} color={STATUS_COLOR[event.status] || 'slate'} />
                    )}
                    {event.category && <Badge label={event.category} color="purple" />}
                    {event.is_paid && <Badge label="Paid" color="amber" />}
                  </div>
                  <h1 style={{
                    margin: 0,
                    fontSize: 28,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.2,
                  }}>
                    {event.title}
                  </h1>
                </div>

                {/* Actions */}
                {canManage && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button className="btn btn-primary btn-sm" onClick={() => navigate(`/events/${id}/manage`)}>
                      <Icon name="dashboard" size={14} /> Manage
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/events/${id}/edit`)}>
                      <Icon name="edit" size={14} /> Edit
                    </button>
                    {nextStatus && (
                      <button className="btn btn-success btn-sm" onClick={() => setConfirmStatus(true)}>
                        <Icon name="arrowRight" size={14} /> Advance
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Description */}
              {event.description && (
                <p style={{
                  fontSize: 14,
                  color: 'var(--text-default)',
                  lineHeight: 1.7,
                  margin: '12px 0 0',
                  whiteSpace: 'pre-wrap',
                }}>
                  {event.description}
                </p>
              )}
            </div>
          </div>

          {/* Quick stats grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 12,
            marginBottom: 24,
          }}>
            <MetaCard
              icon="calendar"
              label="Date"
              value={startDate === endDate ? startDate : `${startDate} – ${endDate}`}
              color="cyan"
            />
            <MetaCard icon="clock" label="Start Time" value={startTime || '—'} color="amber" />
            <MetaCard
              icon={isOnline ? 'spark' : 'mapPin'}
              label={isOnline ? 'Online Event' : 'Venue'}
              value={isOnline ? (
                <a
                  href={venueRaw}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--cyan-400)', textDecoration: 'underline', textDecorationColor: 'rgba(34,211,238,0.4)' }}
                >
                  Join meeting →
                </a>
              ) : venue}
              color="purple"
            />
            <MetaCard icon="users" label="Volunteer Spots" value={capacity} color="green" />
          </div>

          {/* Two-column body */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: 20,
            alignItems: 'start',
          }} className="event-detail-grid">

            {/* Left: full details */}
            <div className="card">
              <div className="card-title" style={{ marginBottom: 16 }}>Event Information</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {[
                  ['Category', event.category],
                  [isOnline ? 'Meeting link' : 'Venue', isOnline ? (
                    <a key="v" href={venueRaw} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cyan-400)', wordBreak: 'break-all' }}>{venueRaw}</a>
                  ) : venue],
                  ['Starts', `${startDate}${startTime ? ' · ' + startTime : ''}`],
                  ['Ends', endDate],
                  ['Volunteer Spots', capacity],
                  ['Ticketing', event.is_paid ? 'Paid event — ticket types in Manage' : 'Free entry'],
                  ['Ticket sales close', event.attendee_registration_deadline
                    ? `${fmtDate(event.attendee_registration_deadline)} · ${fmtTime(event.attendee_registration_deadline)}`
                    : 'Same as event start'],
                  ['Volunteer applications close', event.volunteer_registration_deadline
                    ? `${fmtDate(event.volunteer_registration_deadline)} · ${fmtTime(event.volunteer_registration_deadline)}`
                    : 'Same as event start'],
                  ['Status', <Badge key="s" label={event.status} color={STATUS_COLOR[event.status] || 'slate'} />],
                  ['Created', fmtDate(event.created_at)],
                ].map(([label, value]) => (
                  <div key={label} style={{
                    display: 'flex',
                    gap: 16,
                    padding: '12px 0',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}>
                    <span style={{
                      width: 140, flexShrink: 0,
                      fontSize: 13, color: 'var(--text-muted)', fontWeight: 500,
                    }}>{label}</span>
                    <span style={{ fontSize: 14, color: 'var(--text-default)' }}>{value || '—'}</span>
                  </div>
                ))}
              </div>

              {/* Event ratings — only after the event completes */}
              {eventFeedback && eventFeedback.count > 0 && (
                <div className="card" style={{ marginTop: 16, borderColor: 'rgba(245,158,11,0.25)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Icon name="star" size={18} color="var(--amber-400)" />
                      <div>
                        <div className="card-title" style={{ margin: 0 }}>Attendee Feedback</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          Average rating from {eventFeedback.count} {eventFeedback.count === 1 ? 'review' : 'reviews'}
                        </div>
                      </div>
                    </div>
                    <StarRating value={eventFeedback.average} count={eventFeedback.count} size={18} />
                  </div>

                  {/* Recent comments */}
                  {eventFeedback.list.filter((x) => x.comment).slice(0, 5).length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {eventFeedback.list.filter((x) => x.comment).slice(0, 5).map((fb, i) => (
                        <div key={fb.id || i} style={{ padding: '10px 14px', background: 'rgba(34,211,238,0.04)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                              {fb.full_name || fb.user_name || 'Anonymous'}
                            </div>
                            <StarRating value={fb.rating || fb.score || 0} size={11} showValue={false} />
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--text-default)', fontStyle: 'italic', lineHeight: 1.5 }}>
                            "{fb.comment}"
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Volunteer Apply (volunteer only) */}
              {isVolunteer && (
                <div className="card" style={{ borderColor: 'rgba(34,211,238,0.25)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <Icon name="users" size={16} color="var(--accent)" />
                    <div className="card-title" style={{ margin: 0 }}>Volunteer</div>
                  </div>

                  {/* Application deadline countdown — inline, contextual */}
                  {!myApplication && event.volunteer_registration_deadline && (event.status === 'published' || event.status === 'ongoing') && (
                    <div style={{ marginBottom: 14 }}>
                      <Countdown
                        target={event.volunteer_registration_deadline}
                        variant="deadline"
                        label="Applications close in"
                        expiredLabel="Applications closed"
                        size="sm"
                      />
                    </div>
                  )}

                  {myApplication ? (
                    // Already applied — show status
                    <div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
                        Your application status:
                      </div>
                      <Badge
                        label={myApplication.status || 'pending'}
                        color={
                          myApplication.status === 'approved' ? 'green' :
                          myApplication.status === 'rejected' ? 'red' : 'amber'
                        }
                      />
                      {myApplication.role_name && (
                        <div style={{ fontSize: 13, color: 'var(--text-default)', marginTop: 10 }}>
                          Role: <strong>{myApplication.role_name}</strong>
                        </div>
                      )}
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12, lineHeight: 1.6 }}>
                        {myApplication.status === 'approved' && 'You\'re approved! Check your dashboard for further details.'}
                        {myApplication.status === 'rejected' && 'Your application was not selected this time.'}
                        {(!myApplication.status || myApplication.status === 'pending') && 'The organizer will review your application soon.'}
                      </div>
                    </div>
                  ) : event.status === 'cancelled' || event.status === 'completed' ? (
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      This event is no longer accepting volunteers.
                    </div>
                  ) : event.volunteer_registration_deadline && new Date(event.volunteer_registration_deadline) < new Date() ? (
                    <div style={{ fontSize: 13, color: 'var(--red-400)' }}>
                      Volunteer applications closed on {new Date(event.volunteer_registration_deadline).toLocaleString()}.
                    </div>
                  ) : needs.length === 0 ? (
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      The organizer hasn't posted volunteer roles yet. Check back later.
                    </div>
                  ) : (
                    // Show available roles to apply to
                    <div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>
                        Pick a role to apply for:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {needs.map((need) => {
                          const filled = (need.applied_count ?? 0) >= (need.headcount ?? 0) && need.headcount > 0;
                          return (
                            <div
                              key={need.id}
                              style={{
                                padding: '10px 12px',
                                background: 'rgba(34,211,238,0.05)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: 'var(--radius-md)',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                                  {need.role_name}
                                </div>
                                {need.headcount > 0 && (
                                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                    {need.applied_count ?? 0}/{need.headcount}
                                  </span>
                                )}
                              </div>
                              {need.description && (
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, lineHeight: 1.5 }}>
                                  {need.description}
                                </div>
                              )}
                              <button
                                className="btn btn-primary btn-sm btn-full"
                                onClick={() => handleApply(need.id)}
                                disabled={!!applyingNeedId || filled}
                              >
                                {applyingNeedId === need.id ? 'Applying…' : filled ? 'Full' : 'Apply'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Attendee tickets (attendee only) */}
              {isAttendee && (
                <div className="card" style={{ borderColor: 'rgba(34,211,238,0.25)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <Icon name="ticket" size={16} color="var(--accent)" />
                    <div className="card-title" style={{ margin: 0 }}>Attend This Event</div>
                  </div>

                  {/* Ticket deadline countdown — inline, contextual */}
                  {!myTicket && event.is_paid && event.attendee_registration_deadline && (event.status === 'published' || event.status === 'ongoing') && (
                    <div style={{ marginBottom: 14 }}>
                      <Countdown
                        target={event.attendee_registration_deadline}
                        variant="deadline"
                        label="Sales close in"
                        expiredLabel="Sales closed"
                        size="sm"
                      />
                    </div>
                  )}

                  {myTicket ? (
                    <div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>You have a ticket:</div>
                      <Badge
                        label={myTicket.payment_status || myTicket.status || 'pending'}
                        color={myTicket.payment_status === 'confirmed' ? 'green' : 'amber'}
                      />
                      {myTicket.ticket_type_name && (
                        <div style={{ fontSize: 13, color: 'var(--text-default)', marginTop: 10 }}>
                          Type: <strong>{myTicket.ticket_type_name}</strong>
                        </div>
                      )}
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12, lineHeight: 1.6 }}>
                        {myTicket.payment_status === 'confirmed'
                          ? 'Your ticket is confirmed. Find your QR code in My Tickets.'
                          : 'Pay at the venue and the organizer will confirm your payment.'}
                      </div>
                      <button
                        className="btn btn-secondary btn-sm btn-full"
                        style={{ marginTop: 14 }}
                        onClick={() => navigate('/my-tickets')}
                      >
                        View My Tickets
                      </button>
                    </div>
                  ) : event.status === 'cancelled' || event.status === 'completed' ? (
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      This event is no longer accepting registrations.
                    </div>
                  ) : event.attendee_registration_deadline && new Date(event.attendee_registration_deadline) < new Date() ? (
                    <div style={{ fontSize: 13, color: 'var(--red-400)' }}>
                      Ticket sales closed on {new Date(event.attendee_registration_deadline).toLocaleString()}.
                    </div>
                  ) : !event.is_paid ? (
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                      This is a free event. No ticket required — just show up at the venue.
                    </div>
                  ) : ticketTypes.length === 0 ? (
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      The organizer hasn't published ticket types yet. Check back later.
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>
                        Pick a ticket type:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {ticketTypes.map((tt) => {
                          const soldOut = tt.available_quantity != null && tt.available_quantity <= 0;
                          return (
                            <div
                              key={tt.id}
                              style={{
                                padding: '12px',
                                background: 'rgba(34,211,238,0.05)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: 'var(--radius-md)',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{tt.name}</div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent)' }}>
                                  {Number(tt.price).toFixed(2)} ৳
                                </div>
                              </div>
                              {tt.available_quantity != null && (
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
                                  {tt.available_quantity} of {tt.quantity} available
                                </div>
                              )}
                              <button
                                className="btn btn-primary btn-sm btn-full"
                                onClick={() => { setShowBuyModal(tt); setPaymentType('cash'); }}
                                disabled={soldOut}
                              >
                                {soldOut ? 'Sold Out' : 'Buy Ticket'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Organizer */}
              {(event.organizer_name || event.organizer_email) && (
                <div className="card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <Icon name="user" size={16} color="var(--accent)" />
                    <div className="card-title" style={{ margin: 0 }}>Organizer</div>
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 600 }}>
                    {event.organizer_name || event.organizer_email}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    {event.organizer_email}
                  </div>
                  {isAdmin && (
                    <button
                      className="btn btn-secondary btn-sm btn-full"
                      style={{ marginTop: 14 }}
                      onClick={openReassign}
                    >
                      <Icon name="refresh" size={14} /> Reassign to another organizer
                    </button>
                  )}
                </div>
              )}

              {/* Danger zone (admin only) */}
              {canManage && (
                <div className="card" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <Icon name="warning" size={16} color="var(--red-400)" />
                    <div className="card-title" style={{ margin: 0, color: 'var(--red-400)' }}>Danger Zone</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {event.status !== 'cancelled' && event.status !== 'completed' && (
                      <button className="btn btn-danger btn-sm btn-full" onClick={() => setConfirmCancel(true)}>
                        Cancel Event
                      </button>
                    )}
                    <button className="btn btn-danger btn-sm btn-full" onClick={() => setConfirmDelete(true)}>
                      <Icon name="trash" size={14} /> Delete Permanently
                    </button>
                  </div>
                </div>
              )}

              {/* Gallery */}
              {event.gallery?.length > 0 && (
                <div className="card">
                  <div className="card-title" style={{ marginBottom: 12 }}>Gallery</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                    {event.gallery.map((img) => (
                      <img
                        key={img.id}
                        src={img.url}
                        alt="gallery"
                        style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <ConfirmModal
            isOpen={confirmDelete}
            onClose={() => setConfirmDelete(false)}
            onConfirm={handleDelete}
            title="Delete Event"
            message={`Delete "${event.title}" permanently? All related data will be removed.`}
            confirmText="Delete"
            danger
          />
          <ConfirmModal
            isOpen={confirmCancel}
            onClose={() => setConfirmCancel(false)}
            onConfirm={handleCancel}
            title="Cancel Event"
            message={`Cancel "${event.title}"? Volunteers and ticket holders will be notified. This can't be reverted.`}
            confirmText="Cancel Event"
            danger
          />
          <ConfirmModal
            isOpen={confirmStatus}
            onClose={() => setConfirmStatus(false)}
            onConfirm={handleAdvanceStatus}
            title="Update Status"
            message={`Advance event status from "${event.status}" to "${nextStatus}"?`}
            confirmText="Confirm"
          />

          {/* Buy ticket modal */}
          {showBuyModal && (
            <div className="modal-overlay" onClick={() => !buyingTypeId && setShowBuyModal(null)}>
              <div className="modal" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
                <div className="card-header">
                  <div className="card-title">Buy Ticket</div>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowBuyModal(null)} disabled={!!buyingTypeId}>
                    <Icon name="x" size={14} />
                  </button>
                </div>
                <div style={{ marginBottom: 16, padding: '14px 16px', background: 'rgba(34,211,238,0.06)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{showBuyModal.name}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>{Number(showBuyModal.price).toFixed(2)} ৳</div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{event.title}</div>
                </div>

                <div className="input-wrap" style={{ marginBottom: 18 }}>
                  <label className="input-label">Payment Method</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { value: 'cash', label: 'Cash at venue', desc: 'Reserve now, pay the organizer at the event' },
                      {
                        value: 'online',
                        label: 'Online transfer',
                        desc: paymentMethods.length > 0
                          ? `Send via ${paymentMethods.map((m) => (PAYMENT_METHOD_TYPES.find(t => t.value === m.method_type)?.label || m.method_type)).join(' / ')}, then enter the TrxID`
                          : 'Organizer hasn\'t added online payment methods yet',
                        disabled: paymentMethods.length === 0,
                      },
                    ].map((opt) => (
                      <label
                        key={opt.value}
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: 10,
                          padding: '12px 14px',
                          border: `1px solid ${paymentType === opt.value ? 'var(--accent)' : 'var(--border-soft)'}`,
                          borderRadius: 'var(--radius-md)',
                          background: paymentType === opt.value ? 'rgba(34,211,238,0.06)' : 'transparent',
                          cursor: opt.disabled ? 'not-allowed' : 'pointer',
                          opacity: opt.disabled ? 0.5 : 1,
                          transition: 'all var(--transition-fast)',
                        }}
                      >
                        <input
                          type="radio"
                          name="paymentType"
                          value={opt.value}
                          checked={paymentType === opt.value}
                          onChange={(e) => setPaymentType(e.target.value)}
                          disabled={opt.disabled}
                          style={{ marginTop: 2, accentColor: 'var(--accent)' }}
                        />
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{opt.label}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{opt.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Online payment instructions */}
                {paymentType === 'online' && paymentMethods.length > 0 && (
                  <div style={{
                    padding: 14,
                    background: 'rgba(34,211,238,0.06)',
                    border: '1px solid rgba(34,211,238,0.25)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 18,
                  }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                      Step 1 · Send {Number(showBuyModal.price).toFixed(2)} ৳ to one of these accounts:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {paymentMethods.map((m) => {
                        const meta = PAYMENT_METHOD_TYPES.find((t) => t.value === m.method_type);
                        return (
                          <div key={m.id} style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '10px 12px',
                            background: 'var(--bg-surface)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-subtle)',
                          }}>
                            <span style={{
                              background: meta?.color || '#64748b',
                              color: 'white', fontSize: 10, fontWeight: 600,
                              padding: '3px 8px', borderRadius: 4,
                              textTransform: 'uppercase', letterSpacing: '0.04em',
                              flexShrink: 0,
                            }}>{meta?.label || m.method_type}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace', userSelect: 'all' }}>
                                {m.account_number}
                                {m.account_label && <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 12, fontFamily: 'inherit', marginLeft: 6 }}>· {m.account_label}</span>}
                              </div>
                              {m.account_name && (
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{m.account_name}</div>
                              )}
                              {m.instructions && (
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 2 }}>{m.instructions}</div>
                              )}
                            </div>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => {
                                navigator.clipboard?.writeText(m.account_number);
                                toast.success('Copied');
                              }}
                              title="Copy"
                              style={{ padding: 4 }}
                            >
                              <Icon name="clipboard" size={13} />
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '14px 0 6px' }}>
                      Step 2 · Enter your transaction ID
                    </div>
                    <input
                      className="input-field"
                      placeholder="e.g. 8AB12CD34E"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      style={{ fontFamily: 'monospace', textTransform: 'uppercase' }}
                    />
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>
                      Your ticket stays <strong>pending</strong> until the organizer verifies your TrxID. They'll confirm and your QR code becomes valid.
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setShowBuyModal(null); setPaymentReference(''); }} disabled={!!buyingTypeId}>Cancel</button>
                  <button className="btn btn-primary btn-sm" onClick={handleBuyTicket} disabled={!!buyingTypeId}>
                    {buyingTypeId ? 'Processing…' : `Reserve — ${Number(showBuyModal.price).toFixed(2)} ৳`}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Reassign organizer modal */}
          {showReassign && (
            <div className="modal-overlay" onClick={() => !reassignLoading && setShowReassign(false)}>
              <div className="modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
                <div className="card-header">
                  <div className="card-title">Reassign Organizer</div>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowReassign(false)} disabled={reassignLoading}>
                    <Icon name="x" size={14} />
                  </button>
                </div>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 0, marginBottom: 16, lineHeight: 1.6 }}>
                  Transfer ownership of <strong style={{ color: 'var(--text-primary)' }}>{event.title}</strong> to a different approved organizer. They will gain full management access; the current organizer will lose it.
                </p>
                <div className="input-wrap" style={{ marginBottom: 18 }}>
                  <label className="input-label" htmlFor="organizer-select">New Organizer</label>
                  <select
                    id="organizer-select"
                    className="input-field select-field"
                    value={selectedOrganizerId}
                    onChange={(e) => setSelectedOrganizerId(e.target.value)}
                    disabled={reassignLoading}
                  >
                    <option value="">— Select an organizer —</option>
                    {organizers
                      .filter((o) => o.id !== event.organizer_id)
                      .map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.full_name || o.email} ({o.email})
                        </option>
                      ))}
                  </select>
                  {organizers.length === 0 && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>Loading organizers…</div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowReassign(false)} disabled={reassignLoading}>
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleReassign}
                    disabled={!selectedOrganizerId || reassignLoading}
                  >
                    {reassignLoading ? 'Reassigning…' : 'Reassign Organizer'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
