import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../../components/layout/Topbar.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { PageSpinner } from '../../components/ui/Spinner.jsx';
import { feedbackService } from '../../services/feedback.service.js';
import { eventsService } from '../../services/events.service.js';
import useAuthStore from '../../stores/useAuthStore.js';
import useToastStore from '../../stores/useToastStore.js';
import Icon from '../../components/ui/Icon.jsx';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function Stars({ value = 0, onChange, readonly = false }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= (hover || value);
        return (
          <span
            key={n}
            style={{
              cursor: readonly ? 'default' : 'pointer',
              color: filled ? 'var(--amber-400)' : 'var(--border-default)',
              transition: 'color 0.1s',
              display: 'inline-flex',
            }}
            onClick={() => !readonly && onChange?.(n)}
            onMouseEnter={() => !readonly && setHover(n)}
            onMouseLeave={() => !readonly && setHover(0)}
          >
            <Icon name={filled ? 'starFilled' : 'star'} size={22} strokeWidth={1.6} />
          </span>
        );
      })}
    </div>
  );
}

function RatingCard({ rating }) {
  return (
    <div className="card" style={{ padding: '16px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>
            {rating.event_title || rating.rater_name || 'Anonymous'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            {fmtDate(rating.created_at)}
          </div>
          {rating.comment && (
            <div style={{ fontSize: 13, color: 'var(--text-default)', marginTop: 8, fontStyle: 'italic' }}>
              "{rating.comment}"
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <Stars value={rating.rating || rating.score || 0} readonly />
          <Badge label={`${rating.rating || rating.score || 0}/5`} color="amber" />
        </div>
      </div>
    </div>
  );
}

function SubmitFeedbackModal({ event, onClose, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) { useToastStore.getState().error('Please select a star rating.'); return; }
    setSaving(true);
    try {
      await onSubmit(event.id, { rating, comment: comment.trim() || undefined });
      useToastStore.getState().success('Feedback submitted!');
      onClose();
    } catch {
      useToastStore.getState().error('Failed to submit feedback.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
        <div className="card-header">
          <div className="card-title">Rate Event</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div style={{ marginBottom: 12, color: 'var(--text-muted)', fontSize: 14 }}>
          {event?.title || 'Event'}
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Your Rating</div>
            <Stars value={rating} onChange={setRating} />
          </div>
          <div className="input-wrap">
            <label className="input-label">Comment (optional)</label>
            <textarea
              className="textarea-field"
              rows={3}
              placeholder="Share your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? 'Submitting…' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function FeedbackPage() {
  const { user } = useAuthStore();
  const role = user?.role;
  const navigate = useNavigate();

  const isVolunteer = role === 'VOLUNTEER';
  const isOrganizer = role === 'ORGANIZER';

  const [myRatings, setMyRatings] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        isVolunteer ? feedbackService.getMyVolunteerRatings() : null,
        isOrganizer ? feedbackService.getMyOrganizerRatings() : null,
        eventsService.listEvents({ status: 'completed', limit: 20, page: 1 }),
      ]);

      const ratingsRes = results[0]?.status === 'fulfilled' ? results[0].value : null;
      const orgRatingsRes = results[1]?.status === 'fulfilled' ? results[1].value : null;
      const eventsRes = results[2]?.status === 'fulfilled' ? results[2].value : null;

      const ratingsData = ratingsRes || orgRatingsRes;
      if (ratingsData) {
        setMyRatings(
          Array.isArray(ratingsData) ? ratingsData :
          ratingsData?.ratings || ratingsData?.data || []
        );
      }

      if (eventsRes) {
        const evts = Array.isArray(eventsRes) ? eventsRes : eventsRes?.events || eventsRes?.data || [];
        setPastEvents(evts);
      }
    } catch {
      useToastStore.getState().error('Failed to load feedback data.');
    } finally {
      setLoading(false);
    }
  }, [isVolunteer, isOrganizer]);

  useEffect(() => { load(); }, [load]);

  const avgRating = myRatings.length
    ? (myRatings.reduce((acc, r) => acc + (r.rating || r.score || 0), 0) / myRatings.length).toFixed(1)
    : null;

  return (
    <>
      <Topbar />
      <div className="page-content">
        <div className="page-header">
          <div>
            <div className="page-title">Feedback &amp; Ratings</div>
            <div className="page-subtitle">
              {(isVolunteer || isOrganizer) ? 'Your received ratings and event feedback' : 'Event feedback overview'}
            </div>
          </div>
        </div>

        {loading ? <PageSpinner /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* My ratings summary — for volunteer/organizer */}
            {(isVolunteer || isOrganizer) && (
              <section>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text-primary)' }}>
                    My {isVolunteer ? 'Volunteer' : 'Organizer'} Ratings
                  </h3>
                  {avgRating && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Stars value={Math.round(Number(avgRating))} readonly />
                      <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--amber-400)' }}>{avgRating}</span>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>({myRatings.length})</span>
                    </div>
                  )}
                </div>

                {myRatings.length === 0 ? (
                  <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                    No ratings received yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {myRatings.map((r, i) => <RatingCard key={r.id || i} rating={r} />)}
                  </div>
                )}
              </section>
            )}

            {/* Past events to rate / view feedback */}
            <section>
              <div style={{ marginBottom: 14 }}>
                <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text-primary)' }}>Completed Events</h3>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                  {role === 'ATTENDEE' ? 'Rate events you attended' : 'Browse event feedback'}
                </div>
              </div>

              {pastEvents.length === 0 ? (
                <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                  No completed events found.
                </div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Event</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pastEvents.map((evt) => (
                        <tr key={evt.id}>
                          <td>
                            <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{evt.title}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                              {evt.location || evt.venue || ''}
                            </div>
                          </td>
                          <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                            {fmtDate(evt.event_date || evt.start_date)}
                          </td>
                          <td>
                            <Badge label={evt.status || 'completed'} color="green" />
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 8 }}>
                              {role === 'ATTENDEE' && (
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() => setSubmitting(evt)}
                                >
                                  Rate Event
                                </button>
                              )}
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => navigate(`/events/${evt.id}`)}
                              >
                                View
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {submitting && (
        <SubmitFeedbackModal
          event={submitting}
          onClose={() => setSubmitting(null)}
          onSubmit={feedbackService.submitEventFeedback}
        />
      )}
    </>
  );
}
