import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from './stores/useAuthStore.js';

// Guards
export function RequireAuth() {
  const { accessToken } = useAuthStore();
  if (!accessToken) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function RequireGuest() {
  const { accessToken } = useAuthStore();
  if (accessToken) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

export function RequireRole({ roles }) {
  const { user, accessToken } = useAuthStore();
  if (!accessToken) return <Navigate to="/login" replace />;
  if (!roles.includes(user?.role)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
