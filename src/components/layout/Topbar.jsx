import { useNavigate } from 'react-router-dom';
import useNotifStore from '../../stores/useNotifStore.js';
import Icon from '../ui/Icon.jsx';

export default function Topbar() {
  const { unreadCount } = useNotifStore();
  const navigate = useNavigate();

  return (
    <header className="topbar">
      <div className="topbar-left" />
      <div className="topbar-right">
        <button
          className="topbar-icon-btn"
          onClick={() => navigate('/notifications')}
          title="Notifications"
        >
          <Icon name="bell" size={18} />
          {unreadCount > 0 && <span className="topbar-notif-dot" />}
        </button>
      </div>
    </header>
  );
}
