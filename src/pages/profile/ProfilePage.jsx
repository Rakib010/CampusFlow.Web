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
  const [tab, setTab] = useState('general');
  const [editSection, setEditSection] = useState(null); // contact | personal | about | skills
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
  const email = user?.email || profile?.email || '';

  return (
    <>
      <Topbar />
      <div className="page-content">
        <div className="profile-shell">
          <div className="profile-head">
            <div className="profile-title">Profile</div>
          </div>

          <div className="profile-tabs" role="tablist" aria-label="Profile tabs">
            {[
              { key: 'general', label: 'General' },
              { key: 'password', label: 'Password change' },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                className={`profile-tab${tab === t.key ? ' is-active' : ''}`}
                onClick={() => { setTab(t.key); setEditSection(null); }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="profile-card">
            <div className="profile-hero">
              <div className="profile-photo-wrap">
                <Avatar name={name} src={profile?.photo_url} size="xl" />
                <label className="profile-photo-btn" title="Upload photo">
                  <svg width="12" height="12" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <input type="file" accept="image/*" className="event-file-hidden" onChange={handlePhotoUpload} />
                </label>
              </div>
              <div className="profile-hero__meta">
                <div className="profile-hero__name">{name}</div>
                <div className="profile-hero__email">{email}</div>
                <div style={{ marginTop: 10 }}><Badge label={user?.role} /></div>
              </div>
              <div className="profile-hero__actions" />
            </div>

            {tab === 'general' && (
              <form onSubmit={handleSaveProfile}>
                <div className="profile-grid">
                  <div className="profile-section">
                    <div className="profile-section__head">
                      <div className="profile-section__title">Contact info</div>
                      <button type="button" className="profile-edit-link" onClick={() => setEditSection((s) => (s === 'contact' ? null : 'contact'))}>
                        {editSection === 'contact' ? 'Done' : 'Edit'}
                      </button>
                    </div>
                    <div className="profile-kv">
                      <div className="profile-k">Display name</div>
                      <div className="profile-v">
                        {editSection === 'contact'
                          ? <input name="fullName" className="input-field" value={form.fullName} onChange={handleChange} />
                          : (form.fullName || <span className="profile-muted">—</span>)}
                      </div>
                      <div className="profile-k">Email address</div>
                      <div className="profile-v">{email || <span className="profile-muted">—</span>}</div>
                      <div className="profile-k">Phone number</div>
                      <div className="profile-v">
                        {editSection === 'contact'
                          ? <input name="phone" className="input-field" placeholder="01XXXXXXXXX" value={form.phone} onChange={handleChange} />
                          : (form.phone || <span className="profile-muted">—</span>)}
                      </div>
                    </div>
                  </div>

                  <div className="profile-section">
                    <div className="profile-section__head">
                      <div className="profile-section__title">Personal info</div>
                      <button type="button" className="profile-edit-link" onClick={() => setEditSection((s) => (s === 'personal' ? null : 'personal'))}>
                        {editSection === 'personal' ? 'Done' : 'Edit'}
                      </button>
                    </div>
                    <div className="profile-kv">
                      <div className="profile-k">Student ID</div>
                      <div className="profile-v">
                        {editSection === 'personal'
                          ? <input name="studentId" className="input-field" value={form.studentId} onChange={handleChange} />
                          : (form.studentId || <span className="profile-muted">—</span>)}
                      </div>
                      <div className="profile-k">Department</div>
                      <div className="profile-v">
                        {editSection === 'personal'
                          ? <input name="department" className="input-field" value={form.department} onChange={handleChange} />
                          : (form.department || <span className="profile-muted">—</span>)}
                      </div>
                      <div className="profile-k">Batch</div>
                      <div className="profile-v">
                        {editSection === 'personal'
                          ? <input name="batch" type="number" className="input-field" value={form.batch} onChange={handleChange} />
                          : (form.batch || <span className="profile-muted">—</span>)}
                      </div>
                      <div className="profile-k">Section</div>
                      <div className="profile-v">
                        {editSection === 'personal'
                          ? <input name="section" className="input-field" value={form.section} onChange={handleChange} />
                          : (form.section || <span className="profile-muted">—</span>)}
                      </div>
                    </div>
                  </div>

                  <div className="profile-section profile-section--about">
                    <div className="profile-section__head">
                      <div className="profile-section__title">About</div>
                      <button type="button" className="profile-edit-link" onClick={() => setEditSection((s) => (s === 'about' ? null : 'about'))}>
                        {editSection === 'about' ? 'Done' : 'Edit'}
                      </button>
                    </div>
                    {editSection === 'about'
                      ? <textarea name="bio" className="textarea-field" rows={3} value={form.bio} onChange={handleChange} />
                      : <div className="profile-v">{form.bio || <span className="profile-muted">—</span>}</div>}
                  </div>

                  <div className="profile-section">
                    <div className="profile-section__head">
                      <div className="profile-section__title">Skills</div>
                    </div>
                    <div className="profile-skill-chips">
                      {SKILLS.map((s) => {
                        const active = form.skills?.includes(s);
                        return (
                          <button
                            key={s}
                            type="button"
                            className={`profile-skill-chip ${active ? 'is-active' : ''}`}
                            disabled
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="profile-section">
                    <div className="profile-actions-row">
                      <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? <Spinner size="sm" /> : 'Save changes'}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {tab === 'password' && (
              <div className="profile-section">
                <div className="profile-section__head">
                  <div className="profile-section__title">Change password</div>
                </div>
                <form onSubmit={handleChangePassword} style={{ maxWidth: 420 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div className="input-wrap">
                      <label className="input-label" htmlFor="oldPassword">Current password</label>
                      <input id="oldPassword" type="password" className="input-field" value={pwForm.oldPassword} onChange={(e) => setPwForm((f) => ({ ...f, oldPassword: e.target.value }))} required />
                    </div>
                    <div className="input-wrap">
                      <label className="input-label" htmlFor="newPassword">New password</label>
                      <input id="newPassword" type="password" className="input-field" placeholder="Min. 6 characters" value={pwForm.newPassword} onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))} required />
                    </div>
                    <div className="input-wrap">
                      <label className="input-label" htmlFor="confirm">Confirm new password</label>
                      <input id="confirm" type="password" className="input-field" value={pwForm.confirm} onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))} required />
                    </div>
                    <div className="profile-actions-row">
                      <button type="submit" className="btn btn-primary" disabled={pwLoading}>
                        {pwLoading ? <Spinner size="sm" /> : 'Update password'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
