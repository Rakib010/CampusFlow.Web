import { useEffect, useState } from 'react';
import Topbar from '../../components/layout/Topbar.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { PageSpinner, Spinner } from '../../components/ui/Spinner.jsx';
import { usersService } from '../../services/users.service.js';
import { authService } from '../../services/auth.service.js';
import useAuthStore from '../../stores/useAuthStore.js';
import useToastStore from '../../stores/useToastStore.js';

const SKILLS = ['Technical', 'Design', 'Management', 'Marketing', 'Communication', 'Photography', 'Logistics', 'IT Support'];

export default function ProfilePage() {
  const { user, fetchMe } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});
  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const toast = useToastStore();

  useEffect(() => {
    usersService.getMyProfile()
      .then((r) => {
        setProfile(r.data);
        setForm({
          fullName: r.data.full_name || '',
          phone: r.data.phone || '',
          bio: r.data.bio || '',
          studentId: r.data.student_id || '',
          batch: r.data.batch || '',
          section: r.data.section || '',
          department: r.data.department || '',
          skills: r.data.skills || [],
        });
      })
      .catch(() => toast.error('Failed to load profile.'))
      .finally(() => setLoading(false));
  }, [toast]);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const toggleSkill = (s) => {
    setForm((f) => ({
      ...f,
      skills: f.skills.includes(s) ? f.skills.filter((x) => x !== s) : [...f.skills, s],
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await usersService.updateMyProfile(form);
      setProfile(res.data);
      await fetchMe();
      toast.success('Profile updated!');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Update failed.');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB.'); return; }
    try {
      await usersService.uploadPhoto(file);
      toast.success('Photo updated!');
      await fetchMe();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Upload failed.');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword.length < 6) { toast.error('New password must be at least 6 characters.'); return; }
    if (pwForm.newPassword !== pwForm.confirm) { toast.error('Passwords do not match.'); return; }
    setPwLoading(true);
    try {
      await authService.changePassword(pwForm.oldPassword, pwForm.newPassword);
      toast.success('Password changed successfully!');
      setPwForm({ oldPassword: '', newPassword: '', confirm: '' });
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to change password.');
    } finally {
      setPwLoading(false);
    }
  };

  if (loading) return (
    <>
      <Topbar />
      <div className="page-content"><PageSpinner /></div>
    </>
  );

  const name = profile?.full_name || user?.email?.split('@')[0] || 'User';

  return (
    <>
      <Topbar />
      <div className="page-content">
        <div className="page-header">
          <div>
            <div className="page-title">My Profile</div>
            <div className="page-subtitle">Manage your account</div>
          </div>
        </div>
        {/* Header */}
        <div className="card" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <Avatar name={name} src={profile?.photo_url} size="xl" />
            <label
              style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 26, height: 26, borderRadius: '50%',
                background: 'var(--gradient-accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', border: '2px solid var(--bg-surface)',
              }}
              title="Upload photo"
            >
              <svg width="12" height="12" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
            </label>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 20, color: 'var(--text-primary)' }}>{name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{user?.email}</div>
            <div style={{ marginTop: 8 }}><Badge label={user?.role} /></div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 0 }}>
          {[['profile', 'Profile Info'], ['password', 'Change Password']].map(([key, label]) => (
            <button
              key={key}
              className="btn btn-ghost btn-sm"
              style={{
                borderRadius: '6px 6px 0 0',
                borderBottom: tab === key ? '2px solid var(--accent)' : '2px solid transparent',
                color: tab === key ? 'var(--accent)' : 'var(--text-muted)',
              }}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'profile' && (
          <form onSubmit={handleSaveProfile} style={{ maxWidth: 620 }}>
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-title" style={{ marginBottom: 20 }}>Personal Information</div>
              <div className="form-grid">
                <div className="input-wrap">
                  <label className="input-label" htmlFor="fullName">Full Name</label>
                  <input id="fullName" name="fullName" className="input-field" value={form.fullName} onChange={handleChange} />
                </div>
                <div className="input-wrap">
                  <label className="input-label" htmlFor="phone">Phone</label>
                  <input id="phone" name="phone" className="input-field" placeholder="+387…" value={form.phone} onChange={handleChange} />
                </div>
                <div className="input-wrap">
                  <label className="input-label" htmlFor="studentId">Student ID</label>
                  <input id="studentId" name="studentId" className="input-field" value={form.studentId} onChange={handleChange} />
                </div>
                <div className="input-wrap">
                  <label className="input-label" htmlFor="department">Department</label>
                  <input id="department" name="department" className="input-field" value={form.department} onChange={handleChange} />
                </div>
                <div className="input-wrap">
                  <label className="input-label" htmlFor="batch">Batch</label>
                  <input id="batch" name="batch" type="number" className="input-field" value={form.batch} onChange={handleChange} />
                </div>
                <div className="input-wrap">
                  <label className="input-label" htmlFor="section">Section</label>
                  <input id="section" name="section" className="input-field" placeholder="A, B, C…" value={form.section} onChange={handleChange} />
                </div>
                <div className="input-wrap span-2">
                  <label className="input-label" htmlFor="bio">Bio</label>
                  <textarea id="bio" name="bio" className="textarea-field" rows={3} placeholder="Tell us about yourself…" value={form.bio} onChange={handleChange} />
                </div>
              </div>
            </div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-title" style={{ marginBottom: 14 }}>Skills</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {SKILLS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`badge ${form.skills?.includes(s) ? 'badge-cyan' : 'badge-slate'}`}
                    style={{ cursor: 'pointer', padding: '6px 14px', fontSize: 13 }}
                    onClick={() => toggleSkill(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <Spinner size="sm" /> : 'Save Changes'}
            </button>
          </form>
        )}

        {tab === 'password' && (
          <form onSubmit={handleChangePassword} style={{ maxWidth: 400 }}>
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-title" style={{ marginBottom: 20 }}>Change Password</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="input-wrap">
                  <label className="input-label" htmlFor="oldPassword">Current Password</label>
                  <input id="oldPassword" type="password" className="input-field" value={pwForm.oldPassword} onChange={(e) => setPwForm((f) => ({ ...f, oldPassword: e.target.value }))} required />
                </div>
                <div className="input-wrap">
                  <label className="input-label" htmlFor="newPassword">New Password</label>
                  <input id="newPassword" type="password" className="input-field" placeholder="Min. 6 characters" value={pwForm.newPassword} onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))} required />
                </div>
                <div className="input-wrap">
                  <label className="input-label" htmlFor="confirm">Confirm New Password</label>
                  <input id="confirm" type="password" className="input-field" value={pwForm.confirm} onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))} required />
                </div>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={pwLoading}>
              {pwLoading ? <Spinner size="sm" /> : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </>
  );
}
