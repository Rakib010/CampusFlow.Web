import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Topbar from '../../components/layout/Topbar.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import { PageSpinner } from '../../components/ui/Spinner.jsx';
import { usersService } from '../../services/users.service.js';
import useToastStore from '../../stores/useToastStore.js';

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
      <span style={{ width: 140, flexShrink: 0, fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 14, color: 'var(--text-default)' }}>{value || '—'}</span>
    </div>
  );
}

export default function UserDetailPage() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToastStore();
  const navigate = useNavigate();

  useEffect(() => {
    usersService.getUserById(id)
      .then((r) => setUser(r.data))
      .catch((e) => {
        toast.error(e.response?.data?.message || 'User not found.');
        navigate('/users');
      })
      .finally(() => setLoading(false));
  }, [id, navigate, toast]);

  const handleApprove = async () => {
    try {
      await usersService.approveOrganizer(id);
      toast.success('Organizer approved!');
      setUser((u) => ({ ...u, is_approved: true }));
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to approve.');
    }
  };

  const handleToggleActive = async () => {
    try {
      await usersService.toggleActive(id, !user.is_active);
      toast.success(`User ${!user.is_active ? 'activated' : 'deactivated'}.`);
      setUser((u) => ({ ...u, is_active: !u.is_active }));
    } catch (e) {
      toast.error(e.response?.data?.message || 'Action failed.');
    }
  };

  if (loading) return (
    <>
      <Topbar />
      <div className="page-content"><PageSpinner /></div>
    </>
  );

  if (!user) return null;

  const name = user.full_name || user.email?.split('@')[0] || 'Unknown';

  return (
    <>
      <Topbar />
      <div className="page-content">
        <div className="page-header">
          <div>
            <div className="page-title">{name}</div>
            <div className="page-subtitle">User details and account info</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/users')}>← Back</button>
          {user.role === 'ORGANIZER' && !user.is_approved && (
            <button className="btn btn-success btn-sm" onClick={handleApprove}>Approve Organizer</button>
          )}
          {user.role !== 'SUPER_ADMIN' && (
            <button
              className={`btn btn-sm ${user.is_active ? 'btn-danger' : 'btn-success'}`}
              onClick={handleToggleActive}
            >{user.is_active ? 'Deactivate' : 'Activate'}</button>
          )}
        </div>

        <div className="content-grid">
          {/* Profile Card */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <Avatar name={name} src={user.photo_url} size="xl" />
              <div>
                <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--text-primary)' }}>{name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 3 }}>{user.email}</div>
                <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                  <Badge label={user.role} />
                  <Badge label={user.is_active ? 'active' : 'inactive'} />
                </div>
              </div>
            </div>
            <InfoRow label="Student ID" value={user.student_id} />
            <InfoRow label="Department" value={user.department} />
            <InfoRow label="Batch" value={user.batch} />
            <InfoRow label="Section" value={user.section} />
            <InfoRow label="Phone" value={user.phone} />
          </div>

          {/* Account Card */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>Account Info</div>
            <InfoRow label="Email verified" value={<Badge label={user.is_email_verified ? 'Verified' : 'Unverified'} color={user.is_email_verified ? 'green' : 'amber'} />} />
            <InfoRow label="Approved" value={<Badge label={user.is_approved ? 'Approved' : 'Pending'} color={user.is_approved ? 'green' : 'amber'} />} />
            <InfoRow label="Active" value={<Badge label={user.is_active ? 'Active' : 'Inactive'} color={user.is_active ? 'green' : 'red'} />} />
            <InfoRow label="Member since" value={user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'} />
            {user.bio && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>Bio</div>
                <p style={{ fontSize: 14, color: 'var(--text-default)', lineHeight: 1.6 }}>{user.bio}</p>
              </div>
            )}
            {user.skills?.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Skills</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {user.skills.map((s) => (
                    <span key={s} className="badge badge-cyan">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
