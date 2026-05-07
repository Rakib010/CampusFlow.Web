import { NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/useAuthStore.js';
import useNotifStore from '../../stores/useNotifStore.js';
import Avatar from '../ui/Avatar.jsx';
import AppLogo from '../ui/AppLogo.jsx';
import Icon from '../ui/Icon.jsx';

const navConfig = {
  SUPER_ADMIN: [
    {
      section: 'Overview',
      items: [
        { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
        { to: '/events', icon: 'calendar', label: 'Events' },
      ],
    },
    {
      section: 'Administration',
      items: [
        { to: '/users', icon: 'users', label: 'Users' },
        { to: '/users/create-admin', icon: 'plus', label: 'Create Admin' },
      ],
    },
    {
      section: 'Platform',
      items: [
        { to: '/profile', icon: 'user', label: 'My Profile' },
      ],
    },
  ],
  ADMIN: [
    {
      section: 'Overview',
      items: [
        { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
        { to: '/events', icon: 'calendar', label: 'Events' },
      ],
    },
    {
      section: 'Administration',
      items: [
        { to: '/users', icon: 'users', label: 'Users' },
      ],
    },
    {
      section: 'Platform',
      items: [
        { to: '/profile', icon: 'user', label: 'My Profile' },
      ],
    },
  ],
  ORGANIZER: [
    {
      section: 'Overview',
      items: [
        { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
        { to: '/events', icon: 'calendar', label: 'My Events' },
        { to: '/events/create', icon: 'plus', label: 'Create Event' },
      ],
    },
    {
      section: 'Insights',
      items: [
        { to: '/feedback', icon: 'star', label: 'Feedback & Ratings' },
      ],
    },
    {
      section: 'Tools',
      items: [
        { to: '/profile', icon: 'user', label: 'My Profile' },
      ],
    },
  ],
  VOLUNTEER: [
    {
      section: 'Overview',
      items: [
        { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
        { to: '/events', icon: 'calendar', label: 'Browse Events' },
        { to: '/my-applications', icon: 'clipboard', label: 'My Applications' },
      ],
    },
    {
      section: 'My Record',
      items: [
        { to: '/certificates', icon: 'award', label: 'Certificates' },
        { to: '/feedback', icon: 'star', label: 'My Ratings' },
      ],
    },
    {
      section: 'Account',
      items: [
        { to: '/profile', icon: 'user', label: 'My Profile' },
      ],
    },
  ],
  ATTENDEE: [
    {
      section: 'Overview',
      items: [
        { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
        { to: '/events', icon: 'calendar', label: 'Browse Events' },
        { to: '/my-tickets', icon: 'ticket', label: 'My Tickets' },
      ],
    },
    {
      section: 'Activity',
      items: [
        { to: '/feedback', icon: 'star', label: 'Feedback' },
      ],
    },
    {
      section: 'Account',
      items: [
        { to: '/profile', icon: 'user', label: 'My Profile' },
      ],
    },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotifStore();
  const navigate = useNavigate();

  const role = user?.role || 'ATTENDEE';
  const sections = navConfig[role] || navConfig.ATTENDEE;
  const fullName = user?.fullName || user?.email?.split('@')[0] || 'User';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <AppLogo size="md" />
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {sections.map((sec) => (
          <div key={sec.section} className="sidebar-section">
            <div className="sidebar-section-label">{sec.section}</div>
            {sec.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/dashboard' || item.to === '/events'}
                className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
              >
                <span className="sidebar-item-icon"><Icon name={item.icon} size={17} /></span>
                <span>{item.label}</span>
                {item.notif && unreadCount > 0 && (
                  <span className="sidebar-item-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
              </NavLink>
            ))}
          </div>
        ))}

        {/* Logout */}
        <div className="sidebar-section">
          <div className="sidebar-section-label">Session</div>
          <button className="sidebar-item" onClick={handleLogout}>
            <span className="sidebar-item-icon"><Icon name="logout" size={17} /></span>
            <span>Logout</span>
          </button>
        </div>
      </nav>

      {/* User footer */}
      <div className="sidebar-footer">
        <NavLink to="/profile" className="sidebar-user" style={{ textDecoration: 'none' }}>
          <Avatar name={fullName} size="sm" />
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{fullName}</div>
            <div className="sidebar-user-role">{role.replace('_', ' ')}</div>
          </div>
          <div className="sidebar-user-dot" />
        </NavLink>
      </div>
    </aside>
  );
}
