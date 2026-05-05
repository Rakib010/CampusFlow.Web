import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/useAuthStore.js';
import useToastStore from '../../stores/useToastStore.js';
import { Spinner } from '../../components/ui/Spinner.jsx';
import AppLogo from '../../components/ui/AppLogo.jsx';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const { login, isLoading } = useAuthStore();
  const toast = useToastStore();
  const navigate = useNavigate();

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Please fill in all fields.');
      return;
    }
    try {
      const { user } = await login(form.email.trim(), form.password);
      toast.success(`Welcome back, ${user.fullName || user.email}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-logo">
        <AppLogo size="lg" />
      </div>

      <h1 className="auth-title">Sign in</h1>
      <p className="auth-subtitle">Enter your credentials to access the platform.</p>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {/* Email */}
        <div className="input-wrap">
          <label className="input-label" htmlFor="email">Email address</label>
          <div className="input-icon-wrap">
            <span className="input-icon">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </span>
            <input
              id="email"
              name="email"
              type="email"
              className="input-field"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
            />
          </div>
        </div>

        {/* Password */}
        <div className="input-wrap">
          <label className="input-label" htmlFor="password">Password</label>
          <div className="input-icon-wrap has-right-icon">
            <span className="input-icon">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </span>
            <input
              id="password"
              name="password"
              type={showPw ? 'text' : 'password'}
              className="input-field"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
            />
            <span className="input-icon-right" onClick={() => setShowPw(!showPw)}>
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

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -8 }}>
          <Link to="/forgot-password" style={{ fontSize: 13 }}>Forgot password?</Link>
        </div>

        <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={isLoading}>
          {isLoading ? <Spinner size="sm" /> : 'Sign in'}
        </button>
      </form>

      <div className="auth-footer">
        Don&apos;t have an account?{' '}
        <Link to="/register">Create one</Link>
      </div>
    </div>
  );
}
