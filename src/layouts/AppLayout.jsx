import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar.jsx';
import useNotifStore from '../stores/useNotifStore.js';

export default function AppLayout() {
  const fetchNotifs = useNotifStore((s) => s.fetch);

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifs]);

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
}
