import { useEffect, useRef, useState } from 'react';
import useNotifStore from '../../stores/useNotifStore.js';
import useToastStore from '../../stores/useToastStore.js';
import Icon from '../ui/Icon.jsx';

function timeAgo(date) {
  if (!date) return '';
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function Topbar() {
  const { notifications, unreadCount, isLoading, fetch, markRead, markAllRead, remove } = useNotifStore();
  const [open, setOpen] = useState(false);
  const popoverRef = useRef(null);
  const buttonRef = useRef(null);

  // Fetch when opening (and once on mount so the badge is correct)
  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { if (open) fetch(); }, [open, fetch]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target) &&
        buttonRef.current && !buttonRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    const handleEsc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      useToastStore.getState().success('All notifications marked as read.');
    } catch {
      useToastStore.getState().error('Failed to mark notifications as read.');
    }
  };

  const handleRemove = async (id) => {
    try { await remove(id); } catch { useToastStore.getState().error('Failed to delete.'); }
  };

  return (
    <header className="topbar">
      <div className="topbar-left" />
      <div className="topbar-right" style={{ position: 'relative' }}>
        <button
          ref={buttonRef}
          className="topbar-icon-btn"
          onClick={() => setOpen((v) => !v)}
          title="Notifications"
          aria-expanded={open}
        >
          <Icon name="bell" size={18} />
          {unreadCount > 0 && <span className="topbar-notif-dot" />}
        </button>

        {open && (
          <div
            ref={popoverRef}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: 'min(96vw, 400px)',
              maxHeight: 'min(80vh, 540px)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-soft)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              borderBottom: '1px solid var(--border-subtle)',
            }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Notifications</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                </div>
              </div>
              {unreadCount > 0 && (
                <button className="btn btn-ghost btn-sm" onClick={handleMarkAllRead}>
                  Mark all read
                </button>
              )}
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {isLoading && notifications.length === 0 ? (
                <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  Loading…
                </div>
              ) : notifications.length === 0 ? (
                <div style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                }}>
                  <Icon name="bell" size={32} strokeWidth={1.4} />
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-default)' }}>No notifications</div>
                  <div style={{ fontSize: 12 }}>You're all caught up.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--border-subtle)',
                        background: n.is_read ? 'transparent' : 'rgba(34,211,238,0.04)',
                        borderLeft: n.is_read ? '3px solid transparent' : '3px solid var(--accent)',
                        cursor: n.is_read ? 'default' : 'pointer',
                      }}
                      onClick={() => !n.is_read && markRead(n.id)}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 13,
                          fontWeight: n.is_read ? 400 : 600,
                          color: 'var(--text-primary)',
                          lineHeight: 1.4,
                        }}>
                          {n.title || n.message}
                        </div>
                        {n.title && n.message && (
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3, lineHeight: 1.5 }}>
                            {n.message}
                          </div>
                        )}
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>
                          {timeAgo(n.created_at)}
                        </div>
                      </div>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={(e) => { e.stopPropagation(); handleRemove(n.id); }}
                        title="Delete"
                        style={{ padding: 4, color: 'var(--text-muted)' }}
                      >
                        <Icon name="x" size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
