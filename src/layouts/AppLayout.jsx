import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar.jsx';
import useNotifStore from '../stores/useNotifStore.js';
import useMobileNavStore from '../stores/useMobileNavStore.js';

export default function AppLayout() {
  const fetchNotifs = useNotifStore((s) => s.fetch);
  const drawerOpen = useMobileNavStore((s) => s.drawerOpen);
  const closeDrawer = useMobileNavStore((s) => s.closeDrawer);

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifs]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') closeDrawer();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen, closeDrawer]);

  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        {drawerOpen && (
          <button
            type="button"
            className="sidebar-backdrop"
            aria-label="Close navigation menu"
            onClick={closeDrawer}
          />
        )}
        <Outlet />
      </div>
    </div>
  );
}
