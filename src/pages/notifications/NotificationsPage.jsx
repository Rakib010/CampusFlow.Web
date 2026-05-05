import { useEffect } from 'react';
import Topbar from '../../components/layout/Topbar.jsx';
import { PageSpinner } from '../../components/ui/Spinner.jsx';
import useNotifStore from '../../stores/useNotifStore.js';
import useToastStore from '../../stores/useToastStore.js';
import Icon from '../../components/ui/Icon.jsx';

function timeAgo(date) {
  if (!date) return '';
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function NotificationsPage() {
  const { notifications, unreadCount, isLoading, fetch, markRead, markAllRead, remove } = useNotifStore();
  const toast = useToastStore();

  useEffect(() => { fetch(); }, [fetch]);

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      toast.success('All notifications marked as read.');
    } catch {
      toast.error('Failed to mark notifications as read.');
    }
  };

  const handleRemove = async (id) => {
    try { await remove(id); } catch { toast.error('Failed to delete notification.'); }
  };

  return (
    <>
      <Topbar />
      <div className="page-content">
        <div className="page-header">
          <div>
            <div className="page-title">Notifications</div>
            <div className="page-subtitle">Your recent alerts and messages{unreadCount > 0 ? ` · ${unreadCount} unread` : ''}</div>
          </div>
          {unreadCount > 0 && (
            <button className="btn btn-secondary btn-sm" onClick={handleMarkAllRead}>
              Mark all read
            </button>
          )}
        </div>

        {isLoading ? (
          <PageSpinner />
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon" style={{ color: 'var(--text-muted)' }}><Icon name="bell" size={40} strokeWidth={1.4} /></div>
            <div className="empty-state-title">No notifications</div>
            <div className="empty-state-desc">You're all caught up!</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {notifications.map((n) => (
              <div
                key={n.id}
                className="card card-sm"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  padding: '14px 18px',
                  borderLeft: n.is_read ? '3px solid transparent' : '3px solid var(--accent)',
                  background: n.is_read ? 'var(--bg-surface)' : 'rgba(34,211,238,0.04)',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: n.is_read ? 400 : 600, color: 'var(--text-primary)', fontSize: 14 }}>
                    {n.title || n.message}
                  </div>
                  {n.title && n.message && (
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3, lineHeight: 1.5 }}>{n.message}</div>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>{timeAgo(n.created_at)}</div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {!n.is_read && (
                    <button className="btn btn-ghost btn-sm" style={{ fontSize: 12 }} onClick={() => markRead(n.id)}>
                      Mark read
                    </button>
                  )}
                  <button className="btn btn-danger btn-sm" style={{ fontSize: 12 }} onClick={() => handleRemove(n.id)}>
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
