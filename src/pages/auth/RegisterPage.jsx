import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth.service.js';
import useToastStore from '../../stores/useToastStore.js';
import { Spinner } from '../../components/ui/Spinner.jsx';
import AppLogo from '../../components/ui/AppLogo.jsx';

const roles = [
  { value: 'VOLUNTEER', label: 'Volunteer', desc: 'Help at events, earn hours & certificates' },
  { value: 'ORGANIZER', label: 'Organizer', desc: 'Create and manage university events' },
  { value: 'ATTENDEE', label: 'Attendee', desc: 'Purchase tickets and attend events' },
];

export default function RegisterPage() {
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'VOLUNTEER' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const toast = useToastStore();
  const navigate = useNavigate();

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.role) {
      toast.error('Please fill in all required fields.');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.fullName?.trim()) delete payload.fullName;
      const res = await authService.register(payload);
      // ATTENDEE skips OTP — go straight to login
      if (res.data?.verified) {
        toast.success('Account created! You can now log in.');
        navigate('/login');
      } else {
        toast.success('Code sent! Check your email.');
        navigate(`/verify-otp?email=${encodeURIComponent(form.email.trim().toLowerCase())}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-logo">
        <AppLogo size="lg" />
      </div>

      <h1 className="auth-title">Create account</h1>
      <p className="auth-subtitle">Join the CampusFlow platform today.</p>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="input-wrap">
          <label className="input-label" htmlFor="fullName">Full name</label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            className="input-field"
            placeholder="Your full name"
            value={form.fullName}
            onChange={handleChange}
          />
        </div>

        <div className="input-wrap">
          <label className="input-label" htmlFor="email">Email address <span style={{ color: 'var(--red-400)' }}>*</span></label>
          <input
            id="email"
            name="email"
            type="email"
            className="input-field"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="input-wrap">
          <label className="input-label" htmlFor="password">Password <span style={{ color: 'var(--red-400)' }}>*</span></label>
          <div className="input-icon-wrap has-right-icon">
            <input
              id="password"
              name="password"
              type={showPw ? 'text' : 'password'}
              className="input-field"
              placeholder="Minimum 6 characters"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
              required
            />
            <span className="input-icon-right" onClick={() => setShowPw(!showPw)} style={{ cursor: 'pointer' }}>
              {showPw ? (
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </span>
          </div>
        </div>

        <div className="input-wrap">
          <label className="input-label">I am a… <span style={{ color: 'var(--red-400)' }}>*</span></label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {roles.map((r) => (
              <label
                key={r.value}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '12px 14px',
                  border: `1px solid ${form.role === r.value ? 'var(--accent)' : 'var(--border-soft)'}`,
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  background: form.role === r.value ? 'rgba(34,211,238,0.06)' : 'transparent',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <input
                  type="radio"
                  name="role"
                  value={r.value}
                  checked={form.role === r.value}
                  onChange={handleChange}
                  style={{ marginTop: 2, accentColor: 'var(--accent)' }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{r.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{r.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
          {loading ? <Spinner size="sm" /> : 'Create account'}
        </button>
      </form>

      <div className="auth-footer">
        Already have an account?{' '}
        <Link to="/login">Sign in</Link>
      </div>
    </div>
  );
}
