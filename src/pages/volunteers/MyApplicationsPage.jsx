import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../../components/layout/Topbar.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { PageSpinner } from '../../components/ui/Spinner.jsx';
import { volunteersService } from '../../services/volunteers.service.js';
import { feedbackService } from '../../services/feedback.service.js';
import useToastStore from '../../stores/useToastStore.js';
import Icon from '../../components/ui/Icon.jsx';
import RatingModal from '../../components/ui/RatingModal.jsx';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

const statusColor = { approved: 'green', rejected: 'red', pending: 'amber' };

export default function MyApplicationsPage() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(null); // { eventId, eventTitle, organizerId, organizerName }
  const navigate = useNavigate();

  useEffect(() => {
    volunteersService.getMyApplications()
      .then((r) => setApps(r.data || []))
      .catch(() => useToastStore.getState().error('Failed to load applications.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Topbar />
      <div className="page-content">
        <div className="page-header">
          <div>
            <div className="page-title">My Applications</div>
            <div className="page-subtitle">Your volunteer event applications · {apps.length} total</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/events')}>
            Browse Events
          </button>
        </div>

        {loading ? <PageSpinner /> : apps.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon" style={{ color: 'var(--text-muted)' }}>
              <Icon name="clipboard" size={40} strokeWidth={1.4} />
            </div>
            <div className="empty-state-title">No applications yet</div>
            <div className="empty-state-desc">Browse events and apply to volunteer roles.</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Applied</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {apps.map((app) => (
                  <tr key={app.id}>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                        {app.event_title || 'Unknown Event'}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {app.event_date ? fmtDate(app.event_date) : ''}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-default)', fontSize: 13 }}>
                      {app.role_name || '—'}
                    </td>
                    <td>
                      <Badge label={app.status} color={statusColor[app.status] || 'slate'} />
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                      {fmtDate(app.applied_at || app.created_at)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {/* Rate Organizer — approved volunteers can rate after the event completes */}
                        {app.status === 'approved' && app.event_status === 'completed' && app.organizer_id && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => setRating({
                              eventId: app.event_id,
                              eventTitle: app.event_title,
                              organizerId: app.organizer_id,
                              organizerName: app.organizer_name,
                            })}
                          >
                            <Icon name="star" size={13} /> Rate Organizer
                          </button>
                        )}
                        {app.event_id && (
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => navigate(`/events/${app.event_id}`)}
                          >
                            View Event
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {rating && (
          <RatingModal
            title={`Rate ${rating.organizerName || 'the organizer'}`}
            subtitle={`How was your experience volunteering for "${rating.eventTitle}"?`}
            onClose={() => setRating(null)}
            onSubmit={(payload) => feedbackService.rateOrganizer(rating.eventId, rating.organizerId, payload)}
            submitLabel="Submit Rating"
          />
        )}
      </div>
    </>
  );
}
