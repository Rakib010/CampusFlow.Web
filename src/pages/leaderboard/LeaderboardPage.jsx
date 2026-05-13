import { useEffect, useMemo, useState } from 'react';
import Topbar from '../../components/layout/Topbar.jsx';
import { PageSpinner, Spinner } from '../../components/ui/Spinner.jsx';
import Icon from '../../components/ui/Icon.jsx';
import StarRating from '../../components/ui/StarRating.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { feedbackService } from '../../services/feedback.service.js';
import useAuthStore from '../../stores/useAuthStore.js';
import useToastStore from '../../stores/useToastStore.js';

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtRelative(d) {
  if (!d) return '';
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}d ago`;
  return fmtDate(d);
}

// ── Podium (custom — not the sidebar variant) ─────────────────────────────
function PodiumItem({ rank, item, isMe }) {
  const conf = {
    1: { medal: '🥇', size: 88, fontSize: 24, blockH: 88, ringColor: '#fbbf24' },
    2: { medal: '🥈', size: 72, fontSize: 20, blockH: 60, ringColor: '#94a3b8' },
    3: { medal: '🥉', size: 64, fontSize: 18, blockH: 40, ringColor: '#b45309' },
  }[rank];

  if (!item) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: '0 0 180px' }}>
        <div style={{ fontSize: 24, opacity: 0.3 }}>{conf.medal}</div>
        <div style={{
          width: conf.size, height: conf.size, borderRadius: '50%',
          background: 'rgba(15,23,42,0.04)',
          border: '2px dashed rgba(15,23,42,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'rgba(15,23,42,0.32)', fontSize: conf.fontSize * 0.6, fontWeight: 700,
        }}>{['1st', '2nd', '3rd'][rank - 1]}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>—</div>
        <div style={{
          width: '100%', height: conf.blockH, opacity: 0.18,
          background: 'linear-gradient(180deg, rgba(139,92,246,0.20), rgba(139,92,246,0.05))',
          borderRadius: '12px 12px 0 0', marginTop: 4,
        }} />
      </div>
    );
  }

  const words = (item.full_name || 'Unknown').split(' ');
  const displayName = words.length >= 2 ? `${words[0]} ${words[1]}` : words[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, flex: '0 0 180px' }}>
      <div style={{ fontSize: rank === 1 ? 30 : 24, lineHeight: 1 }}>{conf.medal}</div>
      <div style={{
        width: conf.size, height: conf.size, borderRadius: '50%',
        background: 'linear-gradient(135deg, #8b5cf6, #a855f7, #7e22ce)',
        border: `3px solid ${conf.ringColor}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white', fontSize: conf.fontSize, fontWeight: 700, overflow: 'hidden',
        position: 'relative',
      }}>
        {item.photo_url
          ? <img src={item.photo_url} alt={item.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : initials(item.full_name)}
        {isMe && (
          <span style={{
            position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)',
            padding: '2px 8px', background: 'var(--accent)', color: 'white',
            fontSize: 9, fontWeight: 700, borderRadius: 999, whiteSpace: 'nowrap',
          }}>YOU</span>
        )}
      </div>
      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', textAlign: 'center', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {displayName}
      </div>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '3px 10px', background: 'rgba(139,92,246,0.10)', borderRadius: 999,
        fontSize: 13, fontWeight: 700, color: 'var(--accent)',
      }}>
        <Icon name="starFilled" size={11} style={{ color: '#f59e0b' }} />
        {parseFloat(item.avg_rating).toFixed(1)}
      </div>
      <div style={{
        width: '100%', height: conf.blockH,
        background: rank === 1
          ? 'linear-gradient(180deg, #fbbf24 0%, rgba(251,191,36,0.35) 100%)'
          : rank === 2
            ? 'linear-gradient(180deg, #cbd5e1 0%, rgba(148,163,184,0.30) 100%)'
            : 'linear-gradient(180deg, #b45309 0%, rgba(180,83,9,0.30) 100%)',
        borderRadius: '12px 12px 0 0', marginTop: 4,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 8,
        color: 'white', fontWeight: 700, fontSize: 18, textShadow: '0 1px 3px rgba(0,0,0,0.15)',
      }}>
        #{rank}
      </div>
    </div>
  );
}

// ── Volunteer Detail Modal ────────────────────────────────────────────────
function VolunteerDetailModal({ volunteerId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    if (!volunteerId) return;
    setLoading(true);
    feedbackService.getVolunteerProfile(volunteerId)
      .then((r) => setData(r?.data ?? r))
      .catch(() => useToastStore.getState().error('Failed to load volunteer profile.'))
      .finally(() => setLoading(false));
  }, [volunteerId]);

  if (!volunteerId) return null;

  const p = data?.profile;
  const s = data?.stats;
  const ratings = data?.ratings || [];
  const events = data?.events || [];

  return (
    <Modal isOpen={true} onClose={onClose} title="Volunteer details" size="lg">
      {loading || !data ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Header card */}
          <div style={{
            padding: '20px 22px',
            background: 'linear-gradient(135deg, rgba(139,92,246,0.10), rgba(168,85,247,0.04))',
            border: '1px solid rgba(139,92,246,0.20)',
            borderRadius: 14,
            display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'linear-gradient(135deg,#8b5cf6,#a855f7,#7e22ce)',
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 700, overflow: 'hidden', flexShrink: 0,
            }}>
              {p.photo_url ? <img src={p.photo_url} alt={p.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(p.full_name)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                {p.full_name || 'Unknown'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {p.department && <span>{p.department}</span>}
                {p.batch && <span>·  Batch {p.batch}</span>}
                {p.section && <span>·  Sec {p.section}</span>}
                {p.created_at && <span>·  Joined {fmtDate(p.created_at)}</span>}
              </div>
              {p.bio && (
                <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5 }}>{p.bio}</p>
              )}
              {p.skills?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                  {p.skills.map((sk) => (
                    <span key={sk} style={{
                      padding: '2px 8px', fontSize: 10.5, fontWeight: 600,
                      background: 'rgba(139,92,246,0.12)', color: 'var(--accent)',
                      borderRadius: 999,
                    }}>{sk}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stat tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            <StatTile icon="star" label="Avg rating" value={s.total_ratings > 0 ? s.avg_rating.toFixed(1) : '—'} sub={s.total_ratings > 0 ? `${s.total_ratings} review${s.total_ratings === 1 ? '' : 's'}` : 'No reviews'} accent="#f59e0b" />
            <StatTile icon="calendar" label="Events" value={s.events_count} sub="approved" accent="#22c55e" />
            <StatTile icon="clipboard" label="Applications" value={s.applications_count} sub="all-time" accent="#0ea5e9" />
            <StatTile icon="clock" label="Hours logged" value={s.total_hours > 0 ? `${s.total_hours}` : '—'} sub="recorded" accent="#7c3aed" />
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', gap: 4 }}>
            {['overview', 'reviews', 'events'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                style={{
                  background: 'none', border: 'none',
                  padding: '10px 16px',
                  fontSize: 13, fontWeight: 600,
                  color: tab === t ? 'var(--accent)' : 'var(--text-muted)',
                  borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
                  marginBottom: -1, cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {t}
                {t === 'reviews' && ratings.length > 0 && (
                  <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--text-muted)' }}>({ratings.length})</span>
                )}
                {t === 'events' && events.length > 0 && (
                  <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--text-muted)' }}>({events.length})</span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ minHeight: 200, maxHeight: 420, overflow: 'auto', paddingRight: 4 }}>
            {tab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {s.total_ratings > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>Rating breakdown</div>
                    <RatingDistribution ratings={ratings} />
                  </div>
                )}
                {events.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>Recent events</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {events.slice(0, 3).map((ev) => <EventRow key={ev.application_id} ev={ev} />)}
                    </div>
                  </div>
                )}
                {s.total_ratings === 0 && events.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)', fontSize: 13 }}>
                    No activity recorded yet.
                  </div>
                )}
              </div>
            )}
            {tab === 'reviews' && (
              ratings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)', fontSize: 13 }}>
                  This volunteer hasn't been rated yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {ratings.map((r) => (
                    <div key={r.id} style={{
                      padding: 14, background: 'var(--bg-surface, white)',
                      border: '1px solid var(--border-subtle)', borderRadius: 10,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: '50%',
                            background: '#e2e8f0', color: '#475569',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 700, overflow: 'hidden',
                          }}>
                            {r.rated_by_photo
                              ? <img src={r.rated_by_photo} alt={r.rated_by_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : initials(r.rated_by_name)}
                          </div>
                          <div>
                            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>
                              {r.rated_by_name || 'Anonymous'}
                            </div>
                            <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                              {r.event_title} ·  {fmtRelative(r.created_at)}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <StarRating value={r.rating} readonly size={12} />
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{r.rating}/5</span>
                        </div>
                      </div>
                      {r.comment && (
                        <p style={{ fontSize: 12.5, color: 'var(--text-default)', lineHeight: 1.55, margin: 0, fontStyle: 'italic' }}>
                          "{r.comment}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}
            {tab === 'events' && (
              events.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)', fontSize: 13 }}>
                  This volunteer hasn't applied to any events yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {events.map((ev) => <EventRow key={ev.application_id} ev={ev} />)}
                </div>
              )
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

function StatTile({ icon, label, value, sub, accent }) {
  return (
    <div style={{
      padding: '12px 14px', background: 'var(--bg-surface, white)',
      border: '1px solid var(--border-subtle)', borderRadius: 10,
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{
          width: 22, height: 22, borderRadius: 6,
          background: `${accent}1f`, color: accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name={icon} size={12} />
        </div>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.8, textTransform: 'uppercase' }}>{label}</span>
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{sub}</div>
    </div>
  );
}

function RatingDistribution({ ratings }) {
  const buckets = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  ratings.forEach((r) => { if (buckets[r.rating] !== undefined) buckets[r.rating]++; });
  const max = Math.max(1, ...Object.values(buckets));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {[5, 4, 3, 2, 1].map((star) => {
        const count = buckets[star];
        const pct = (count / max) * 100;
        return (
          <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
            <span style={{ width: 22, color: 'var(--text-muted)', fontWeight: 600 }}>{star}★</span>
            <div style={{ flex: 1, height: 6, background: 'var(--border-subtle)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #f59e0b, #fbbf24)', transition: 'width 240ms ease' }} />
            </div>
            <span style={{ width: 22, textAlign: 'right', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{count}</span>
          </div>
        );
      })}
    </div>
  );
}

function EventRow({ ev }) {
  const statusColor = ev.application_status === 'approved' ? 'green'
                    : ev.application_status === 'rejected' ? 'red' : 'amber';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: 10, background: 'var(--bg-surface, white)',
      border: '1px solid var(--border-subtle)', borderRadius: 10,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
        background: ev.banner_url ? `url(${ev.banner_url}) center/cover` : 'linear-gradient(135deg, #e0e7ff, #c7d2fe)',
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {ev.title}
        </div>
        <div style={{ fontSize: 10.5, color: 'var(--text-muted)', display: 'flex', gap: 8, marginTop: 2 }}>
          <span>{fmtDate(ev.start_date)}</span>
          {ev.role_name && <span>·  {ev.role_name}</span>}
          {ev.hours_logged > 0 && <span>·  {ev.hours_logged}h</span>}
        </div>
      </div>
      <Badge label={ev.application_status} color={statusColor} />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function LeaderboardPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [detailId, setDetailId] = useState(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  useEffect(() => {
    feedbackService.getLeaderboard(100)
      .then((r) => setData(Array.isArray(r) ? r : r?.data || []))
      .catch(() => useToastStore.getState().error('Failed to load leaderboard.'))
      .finally(() => setLoading(false));
  }, []);

  const ratedOnly = useMemo(() => data.filter((d) => d.total_ratings > 0), [data]);
  const podium = ratedOnly.slice(0, 3);

  const stats = useMemo(() => {
    const totalVolunteers = data.length;
    const ratedCount = ratedOnly.length;
    const avgOfAvgs = ratedCount > 0
      ? (ratedOnly.reduce((acc, d) => acc + parseFloat(d.avg_rating || 0), 0) / ratedCount).toFixed(1)
      : null;
    const totalRatings = ratedOnly.reduce((acc, d) => acc + (d.total_ratings || 0), 0);
    return { totalVolunteers, ratedCount, avgOfAvgs, totalRatings };
  }, [data, ratedOnly]);

  const filtered = useMemo(() => {
    let list = data;
    if (filter === 'rated') list = list.filter((d) => d.total_ratings > 0);
    if (filter === 'unrated') list = list.filter((d) => d.total_ratings === 0);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((d) => (d.full_name || '').toLowerCase().includes(q));
    return list;
  }, [data, filter, search]);

  // Reset to first page whenever the filter inputs change.
  useEffect(() => { setPage(1); }, [filter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pagedList = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  const myRank = user?.id ? data.findIndex((d) => d.volunteer_id === user.id) + 1 : 0;
  const myEntry = myRank > 0 ? data[myRank - 1] : null;

  return (
    <>
      <Topbar />
      <div className="page-content">
        {/* Hero header — soft lavender, dark text for readability */}
        <div style={{
          position: 'relative',
          padding: '28px 32px',
          marginBottom: 24,
          background: 'linear-gradient(135deg, #ddd6fe 0%, #e9d5ff 50%, #f3e8ff 100%)',
          borderRadius: 16,
          color: '#3b0764',
          overflow: 'hidden',
          border: '1px solid rgba(139,92,246,0.20)',
        }}>
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 28 }}>🏆</span>
                <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: -0.3, color: '#3b0764' }}>
                  Volunteer Leaderboard
                </h1>
              </div>
              <p style={{ margin: 0, fontSize: 13.5, color: '#6b21a8', maxWidth: 560, lineHeight: 1.5 }}>
                Campus-wide rankings based on average rating. The more volunteers participate, the higher their score climbs.
              </p>
            </div>
            {myRank > 0 && (
              <div style={{
                padding: '10px 18px',
                background: 'rgba(255,255,255,0.65)',
                border: '1px solid rgba(139,92,246,0.30)',
                borderRadius: 12,
                backdropFilter: 'blur(8px)',
              }}>
                <div style={{ fontSize: 10.5, color: '#7c3aed', letterSpacing: 1, textTransform: 'uppercase', fontWeight: 700 }}>Your rank</div>
                <div style={{ fontSize: 24, fontWeight: 700, marginTop: 2, color: '#3b0764' }}>#{myRank}</div>
              </div>
            )}
          </div>
        </div>

        {loading ? <PageSpinner /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Stat row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
              <BigStat icon="users" iconBg="#ddd6fe" iconColor="#6d28d9" label="Total volunteers" value={stats.totalVolunteers} sub="active" />
              <BigStat icon="star" iconBg="#fef3c7" iconColor="#b45309" label="Rated volunteers" value={stats.ratedCount} sub={`of ${stats.totalVolunteers}`} />
              <BigStat icon="trophy" iconBg="#fce7f3" iconColor="#be185d" label="Avg rating" value={stats.avgOfAvgs ?? '—'} sub="across rated" />
              <BigStat icon="clipboard" iconBg="#dbeafe" iconColor="#1d4ed8" label="Total reviews" value={stats.totalRatings} sub="submitted" />
            </div>

            {/* Podium card */}
            <div style={{
              padding: '32px 24px 16px', borderRadius: 16,
              background: 'linear-gradient(180deg, #ffffff 0%, #faf5ff 100%)',
              border: '1px solid rgba(139,92,246,0.18)',
              boxShadow: '0 4px 20px rgba(139,92,246,0.06)',
            }}>
              <div style={{ textAlign: 'center', marginBottom: 18 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase' }}>
                  Top performers
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 16, maxWidth: 640, margin: '0 auto' }}>
                {/* Order: 2nd, 1st, 3rd */}
                <PodiumItem rank={2} item={podium[1] ?? null} isMe={podium[1]?.volunteer_id === user?.id} />
                <PodiumItem rank={1} item={podium[0] ?? null} isMe={podium[0]?.volunteer_id === user?.id} />
                <PodiumItem rank={3} item={podium[2] ?? null} isMe={podium[2]?.volunteer_id === user?.id} />
              </div>
              {ratedOnly.length === 0 && (
                <div style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: 'var(--text-muted)' }}>
                  No ratings yet — the podium will fill in once organizers and attendees submit ratings.
                </div>
              )}
            </div>

            {/* Table card */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Full ranking</div>
                <div className="search-wrap" style={{ flex: '1 1 220px', minWidth: 200, maxWidth: 320 }}>
                  <span className="search-icon"><Icon name="search" size={14} /></span>
                  <input
                    className="search-input input-field"
                    placeholder="Search by name…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <select
                  className="input-field select-field"
                  style={{ height: 36, width: 160, fontSize: 13, marginLeft: 'auto' }}
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">All volunteers</option>
                  <option value="rated">Rated only</option>
                  <option value="unrated">Not yet rated</option>
                </select>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {filtered.length} of {data.length}
                </span>
              </div>

              {filtered.length === 0 ? (
                <div className="empty-state" style={{ padding: '40px 20px' }}>
                  <div className="empty-state-icon" style={{ color: 'var(--text-muted)' }}>
                    <Icon name="trophy" size={36} strokeWidth={1.4} />
                  </div>
                  <div className="empty-state-title">No volunteers match</div>
                  <div className="empty-state-desc">Try adjusting your search or filter.</div>
                </div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: 56 }}>Rank</th>
                        <th>Volunteer</th>
                        <th>Department</th>
                        <th>Rating</th>
                        <th style={{ textAlign: 'right' }}>Reviews</th>
                        <th style={{ textAlign: 'right' }}>Events</th>
                        <th style={{ textAlign: 'right' }}>Hours</th>
                        <th style={{ textAlign: 'right' }}>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedList.map((item) => {
                        const rank = data.findIndex((d) => d.volunteer_id === item.volunteer_id) + 1;
                        const rated = item.total_ratings > 0;
                        const isMe = user?.id === item.volunteer_id;
                        return (
                          <tr key={item.volunteer_id} style={isMe ? { background: 'rgba(139,92,246,0.06)' } : undefined}>
                            <td style={{ fontWeight: 700, fontSize: 14, color: rank <= 3 ? 'var(--accent)' : 'var(--text-primary)' }}>
                              {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `#${rank}`}
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                  width: 36, height: 36, borderRadius: '50%',
                                  background: 'linear-gradient(135deg,#8b5cf6,#a855f7)',
                                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 12, fontWeight: 700, flexShrink: 0, overflow: 'hidden',
                                }}>
                                  {item.photo_url
                                    ? <img src={item.photo_url} alt={item.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : initials(item.full_name)}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>
                                    {item.full_name || 'Unknown'} {isMe && <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 700, marginLeft: 4, padding: '1px 6px', background: 'rgba(139,92,246,0.12)', borderRadius: 999 }}>YOU</span>}
                                  </div>
                                  {item.batch && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Batch {item.batch}</div>}
                                </div>
                              </div>
                            </td>
                            <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.department || '—'}</td>
                            <td>
                              {rated ? (
                                <StarRating value={parseFloat(item.avg_rating)} readonly size={12} />
                              ) : (
                                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>Not rated</span>
                              )}
                            </td>
                            <td style={{ textAlign: 'right', fontSize: 13, color: rated ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                              {item.total_ratings || 0}
                            </td>
                            <td style={{ textAlign: 'right', fontSize: 13, color: 'var(--text-muted)' }}>
                              {item.events_count || 0}
                            </td>
                            <td style={{ textAlign: 'right', fontSize: 13, fontVariantNumeric: 'tabular-nums', color: item.total_hours > 0 ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: item.total_hours > 0 ? 600 : 400 }}>
                              {item.total_hours > 0 ? `${item.total_hours} h` : '—'}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => setDetailId(item.volunteer_id)}
                                style={{ padding: '4px 10px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                              >
                                <Icon name="eye" size={11} /> View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination footer */}
              {filtered.length > PAGE_SIZE && (
                <Pagination
                  page={currentPage}
                  totalPages={totalPages}
                  pageStart={pageStart}
                  pageEnd={Math.min(pageStart + PAGE_SIZE, filtered.length)}
                  total={filtered.length}
                  onChange={setPage}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {detailId && (
        <VolunteerDetailModal volunteerId={detailId} onClose={() => setDetailId(null)} />
      )}
    </>
  );
}

function BigStat({ icon, iconBg, iconColor, label, value, sub }) {
  return (
    <div style={{
      padding: '16px 18px',
      background: 'var(--bg-surface, white)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: iconBg, color: iconColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon name={icon} size={15} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.8, textTransform: 'uppercase' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────
function Pagination({ page, totalPages, pageStart, pageEnd, total, onChange }) {
  // Build a compact page list with ellipses when there are many pages
  const pages = [];
  const push = (p) => pages.push(p);
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) push(i);
  } else {
    push(1);
    if (page > 3) push('…');
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) push(i);
    if (page < totalPages - 2) push('…');
    push(totalPages);
  }

  const btn = (content, opts = {}) => {
    const { active, disabled, onClick, ariaLabel } = opts;
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-current={active ? 'page' : undefined}
        style={{
          minWidth: 34, height: 34, padding: '0 10px',
          background: active ? 'var(--accent)' : 'white',
          color: active ? 'white' : disabled ? 'var(--text-muted)' : 'var(--text-primary)',
          border: `1px solid ${active ? 'var(--accent)' : 'var(--border-subtle)'}`,
          borderRadius: 8,
          fontSize: 13,
          fontWeight: active ? 700 : 500,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {content}
      </button>
    );
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 12, flexWrap: 'wrap',
      padding: '12px 20px',
      borderTop: '1px solid var(--border-subtle)',
      background: 'var(--bg-page, transparent)',
    }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        Showing <strong style={{ color: 'var(--text-primary)' }}>{pageStart + 1}–{pageEnd}</strong> of <strong style={{ color: 'var(--text-primary)' }}>{total}</strong>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {btn('‹ Prev', { disabled: page <= 1, onClick: () => onChange(page - 1), ariaLabel: 'Previous page' })}
        {pages.map((p, i) => p === '…'
          ? <span key={`e${i}`} style={{ padding: '0 4px', color: 'var(--text-muted)', fontSize: 13 }}>…</span>
          : btn(p, { active: p === page, onClick: () => onChange(p), ariaLabel: `Page ${p}` })
        )}
        {btn('Next ›', { disabled: page >= totalPages, onClick: () => onChange(page + 1), ariaLabel: 'Next page' })}
      </div>
    </div>
  );
}
