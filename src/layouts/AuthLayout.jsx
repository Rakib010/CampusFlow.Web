import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="auth-shell">
      <div className="auth-split">
        <main className="auth-right">
          <Outlet />
        </main>
        <aside className="auth-left" aria-hidden="true" />
      </div>
    </div>
  );
}
