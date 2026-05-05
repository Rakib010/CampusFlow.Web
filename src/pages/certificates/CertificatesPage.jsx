import { useEffect, useState } from 'react';
import Topbar from '../../components/layout/Topbar.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { PageSpinner } from '../../components/ui/Spinner.jsx';
import { certificatesService } from '../../services/certificates.service.js';
import useAuthStore from '../../stores/useAuthStore.js';
import useToastStore from '../../stores/useToastStore.js';
import Icon from '../../components/ui/Icon.jsx';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function HoursCard({ hours }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
      {[
        { label: 'Total Hours', value: hours?.total_hours ?? '—', icon: 'clock', color: 'var(--cyan-400)' },
        { label: 'Events Volunteered', value: hours?.events_count ?? '—', icon: 'calendar', color: 'var(--purple-400)' },
        { label: 'Certificates Earned', value: hours?.certificates_count ?? '—', icon: 'award', color: 'var(--green-400)' },
      ].map((s) => (
        <div key={s.label} className="stat-card" style={{ textAlign: 'center' }}>
          <div style={{ color: s.color, marginBottom: 8, display: 'flex', justifyContent: 'center' }}>
            <Icon name={s.icon} size={28} strokeWidth={1.5} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

function AdminStats({ stats }) {
  if (!stats) return null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
      {[
        { label: 'Total Certificates', value: stats.total_certificates ?? '—', icon: 'award', color: 'var(--cyan-400)' },
        { label: 'Total Volunteers', value: stats.total_volunteers ?? '—', icon: 'users', color: 'var(--purple-400)' },
        { label: 'Total Hours', value: stats.total_hours ?? '—', icon: 'clock', color: 'var(--green-400)' },
        { label: 'Avg Hours/Volunteer', value: stats.avg_hours_per_volunteer ? Number(stats.avg_hours_per_volunteer).toFixed(1) : '—', icon: 'dashboard', color: 'var(--amber-400)' },
      ].map((s) => (
        <div key={s.label} className="stat-card" style={{ textAlign: 'center' }}>
          <div style={{ color: s.color, marginBottom: 8, display: 'flex', justifyContent: 'center' }}>
            <Icon name={s.icon} size={28} strokeWidth={1.5} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function CertificatesPage() {
  const { user } = useAuthStore();
  const role = user?.role;
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';

  const [certs, setCerts] = useState([]);
  const [hours, setHours] = useState(null);
  const [adminStats, setAdminStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const reqs = [certificatesService.getMyCertificates()];
    if (!isAdmin) reqs.push(certificatesService.getMyHours());
    if (isAdmin) reqs.push(certificatesService.getAdminStats());

    Promise.allSettled(reqs).then(([certsRes, secondRes]) => {
      if (certsRes.status === 'fulfilled') {
        const d = certsRes.value;
        setCerts(Array.isArray(d) ? d : d?.certificates || d?.data || []);
      } else {
        useToastStore.getState().error('Failed to load certificates.');
      }
      if (secondRes?.status === 'fulfilled') {
        if (isAdmin) setAdminStats(secondRes.value);
        else setHours(secondRes.value);
      }
      setLoading(false);
    });
  }, [isAdmin]);

  const handleDownload = (cert) => {
    if (cert.certificate_url || cert.file_url) {
      window.open(cert.certificate_url || cert.file_url, '_blank');
    } else {
      useToastStore.getState().info('Certificate file not available for download.');
    }
  };

  return (
    <>
      <Topbar />
      <div className="page-content">
        <div className="page-header">
          <div>
            <div className="page-title">Certificates</div>
            <div className="page-subtitle">Your volunteer certificates and hours · {certs.length} total</div>
          </div>
        </div>

        {loading ? <PageSpinner /> : (
          <>
            {isAdmin ? <AdminStats stats={adminStats} /> : <HoursCard hours={hours} />}

            {certs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon" style={{ color: 'var(--text-muted)' }}>
                  <Icon name="award" size={40} strokeWidth={1.4} />
                </div>
                <div className="empty-state-title">No certificates yet</div>
                <div className="empty-state-desc">
                  {isAdmin ? 'No certificates have been generated yet.' : 'Complete volunteer events to earn certificates.'}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {certs.map((cert) => (
                  <div key={cert.id}>
                    <div
                      className="card"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 20,
                        cursor: 'pointer', padding: '18px 24px',
                        transition: 'border-color var(--transition-fast)',
                        borderColor: expanded === cert.id ? 'rgba(34,211,238,0.3)' : 'var(--border-subtle)',
                      }}
                      onClick={() => setExpanded(expanded === cert.id ? null : cert.id)}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(34,211,238,0.3)')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = expanded === cert.id ? 'rgba(34,211,238,0.3)' : 'var(--border-subtle)')}
                    >
                      <div style={{
                        width: 48, height: 48, borderRadius: 'var(--radius-md)',
                        background: 'rgba(34,211,238,0.1)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        color: 'var(--accent)', flexShrink: 0,
                      }}>
                        <Icon name="award" size={24} />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 15 }}>
                          {cert.event_title || cert.event_name || 'Volunteer Certificate'}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
                          {cert.hours_contributed != null ? `${cert.hours_contributed}h contributed` : ''}
                          {cert.hours_contributed != null && cert.issued_at ? ' · ' : ''}
                          {cert.issued_at ? fmtDate(cert.issued_at) : fmtDate(cert.created_at)}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
                        <Badge label={cert.status || 'issued'} color="green" />
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={(e) => { e.stopPropagation(); handleDownload(cert); }}
                        >
                          Download
                        </button>
                      </div>
                    </div>

                    {expanded === cert.id && (
                      <div className="card" style={{
                        marginTop: 4, background: 'rgba(34,211,238,0.04)',
                        borderColor: 'rgba(34,211,238,0.2)', borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
                      }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px' }}>
                          {[
                            ['Certificate ID', cert.id?.slice(0, 8) + '…'],
                            ['Event', cert.event_title || cert.event_name],
                            ['Volunteer', cert.volunteer_name || cert.user_name],
                            ['Hours', cert.hours_contributed != null ? `${cert.hours_contributed}h` : '—'],
                            ['Role', cert.role_name || '—'],
                            ['Issued', fmtDate(cert.issued_at || cert.created_at)],
                            ['Valid Until', cert.expires_at ? fmtDate(cert.expires_at) : 'No expiry'],
                            ['Status', cert.status || 'issued'],
                          ].map(([label, val]) => (
                            <div key={label} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
                              <div style={{ fontSize: 14, color: 'var(--text-default)' }}>{val || '—'}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
