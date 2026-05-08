import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/useAuthStore.js';
import useNotifStore from '../../stores/useNotifStore.js';
import useToastStore from '../../stores/useToastStore.js';
import Icon from '../ui/Icon.jsx';
import Avatar from '../ui/Avatar.jsx';

function timeAgo(date) {
  if (!date) return '';
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function Topbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { notifications, unreadCount, isLoading, fetch, markRead, markAllRead, remove } = useNotifStore();
  const [open, setOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const popoverRef = useRef(null);
  const buttonRef = useRef(null);
  const userButtonRef = useRef(null);
  const userPopoverRef = useRef(null);

  // Fetch when opening (and once on mount so the badge is correct)
  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { if (open) fetch(); }, [open, fetch]);

  // Close on outside click
  useEffect(() => {
    if (!open && !userOpen) return;
    const handleClick = (e) => {
      const clickedNotif =
        (popoverRef.current && popoverRef.current.contains(e.target)) ||
        (buttonRef.current && buttonRef.current.contains(e.target));
      const clickedUser =
        (userPopoverRef.current && userPopoverRef.current.contains(e.target)) ||
        (userButtonRef.current && userButtonRef.current.contains(e.target));

      if (!clickedNotif) setOpen(false);
      if (!clickedUser) setUserOpen(false);
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setUserOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open, userOpen]);

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

  const fullName = user?.fullName || user?.full_name || user?.email?.split('@')[0] || 'User';
  const role = (user?.role || 'ATTENDEE').replace('_', ' ');

  const handleGoProfile = () => {
    setUserOpen(false);
    navigate('/profile');
  };

  const handleLogout = () => {
    setUserOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <header className="topbar">
      <div className="topbar-left" />
      <div className="topbar-right">
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
            className="notif-popover"
          >
            {/* Header */}
            <div className="notif-header">
              <div>
                <div className="notif-title">Notifications</div>
                <div className="notif-subtitle">
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
            <div className="notif-body">
              {isLoading && notifications.length === 0 ? (
                <div className="notif-loading">Loading…</div>
              ) : notifications.length === 0 ? (
                <div className="notif-empty">
                  <Icon name="bell" size={32} strokeWidth={1.4} />
                  <div className="notif-empty-title">No notifications</div>
                  <div className="notif-empty-sub">You're all caught up.</div>
                </div>
              ) : (
                <div>
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`notif-item ${n.is_read ? 'read' : 'unread'}`}
                      onClick={() => !n.is_read && markRead(n.id)}
                    >
                      <div className="notif-item-content">
                        <div className="notif-item-headline">
                          {n.title || n.message}
                        </div>
                        {n.title && n.message && (
                          <div className="notif-item-message">
                            {n.message}
                          </div>
                        )}
                        <div className="notif-item-time">
                          {timeAgo(n.created_at)}
                        </div>
                      </div>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={(e) => { e.stopPropagation(); handleRemove(n.id); }}
                        title="Delete"
                      >
                        <span className="notif-delete">
                          <Icon name="x" size={14} />
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <button
          ref={userButtonRef}
          type="button"
          className="topbar-user"
          onClick={() => setUserOpen((v) => !v)}
          aria-expanded={userOpen}
          aria-haspopup="menu"
        >
          <Avatar name={fullName} size="sm" />
          <div className="topbar-user-meta">
            <div className="topbar-user-name">{fullName}</div>
            <div className="topbar-user-role">{role}</div>
          </div>
        </button>

        {userOpen && (
          <div
            ref={userPopoverRef}
            className="topbar-user-menu"
            role="menu"
          >
            <button type="button" className="topbar-menu-item" role="menuitem" onClick={handleGoProfile}>
              <Icon name="user" size={16} />
              <span>My Profile</span>
            </button>
            <button type="button" className="topbar-menu-item danger" role="menuitem" onClick={handleLogout}>
              <Icon name="logout" size={16} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
