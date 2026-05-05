import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 64, opacity: 0.3 }}>404</div>
      <h2 style={{ color: 'var(--text-primary)', margin: 0 }}>Page not found</h2>
      <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 14 }}>The page you're looking for doesn't exist.</p>
      <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
    </div>
  );
}
