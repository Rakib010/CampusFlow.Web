import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../../components/layout/Topbar.jsx';
import { authService } from '../../services/auth.service.js';
import useToastStore from '../../stores/useToastStore.js';
import { Spinner } from '../../components/ui/Spinner.jsx';

export default function CreateAdminPage() {
  const [form, setForm] = useState({ email: '', password: '', fullName: '' });
  const [loading, setLoading] = useState(false);
  const toast = useToastStore();
  const navigate = useNavigate();

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Email and password are required.');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await authService.registerAdmin(form);
      toast.success('Admin account created successfully.');
      navigate('/users');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to create admin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Topbar />
      <div className="page-content">
        <div style={{ maxWidth: 500, margin: '0 auto' }}>
          <div className="page-header">
            <div>
              <div className="page-title">Create Admin</div>
              <div className="page-subtitle">Create a new university-level admin account</div>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" style={{ marginBottom: 20 }} onClick={() => navigate('/users')}>← Back</button>
          <div className="card">
            <div className="card-title" style={{ marginBottom: 4 }}>New Admin Account</div>
            <div className="card-subtitle" style={{ marginBottom: 24 }}>
              Admin accounts are auto-approved and email-verified.
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="input-wrap">
                <label className="input-label" htmlFor="fullName">Full name</label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  className="input-field"
                  placeholder="University Faculty Administrator"
                  value={form.fullName}
                  onChange={handleChange}
                />
              </div>
              <div className="input-wrap">
                <label className="input-label" htmlFor="email">Email <span style={{ color: 'var(--red-400)' }}>*</span></label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="input-field"
                  placeholder="admin@university.edu"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="input-wrap">
                <label className="input-label" htmlFor="password">Password <span style={{ color: 'var(--red-400)' }}>*</span></label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="input-field"
                  placeholder="Minimum 8 characters"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => navigate('/users')}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? <Spinner size="sm" /> : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
