import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../../components/layout/Topbar.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { PageSpinner } from '../../components/ui/Spinner.jsx';
import { ConfirmModal } from '../../components/ui/Modal.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { usersService } from '../../services/users.service.js';
import useToastStore from '../../stores/useToastStore.js';

const ROLES = ['', 'SUPER_ADMIN', 'ADMIN', 'ORGANIZER', 'VOLUNTEER', 'ATTENDEE'];

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const toast = useToastStore();
  const navigate = useNavigate();

  const load = useCallback(() => {
    setLoading(true);
    const params = { page, limit: 15 };
    if (search) params.search = search;
    if (role) params.role = role;
    usersService.listUsers(params)
      .then((r) => {
        setUsers(r.data || []);
        if (r.pagination) {
          setPagination({ ...r.pagination, totalPages: r.pagination.pages || 1 });
        }
      })
      .catch((e) => useToastStore.getState().error(e.response?.data?.message || 'Failed to load users'))
      .finally(() => setLoading(false));
  }, [page, search, role]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id, name) => {
    try {
      await usersService.approveOrganizer(id);
      toast.success(`${name} approved as organizer.`);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Approval failed.');
    }
  };

  const handleToggleActive = async (id, current) => {
    try {
      await usersService.toggleActive(id, !current);
      toast.success(`User ${!current ? 'activated' : 'deactivated'}.`);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Action failed.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await usersService.deleteUser(id);
      toast.success('User deleted.');
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Delete failed.');
    }
  };

  const debouncedSearch = (val) => {
    setSearch(val);
    setPage(1);
  };

  return (
    <>
      <Topbar />
      <div className="page-content">
        <div className="page-header">
          <div>
            <div className="page-title">Users</div>
            <div className="page-subtitle">Manage platform members{pagination.total != null ? ` · ${pagination.total} total` : ''}</div>
          </div>
          <div className="page-actions">
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/users/create-admin')}>
              + Create Admin
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="filter-bar">
          <div className="search-wrap" style={{ flex: 1 }}>
            <span className="search-icon">
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
              </svg>
            </span>
            <input
              className="search-input"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => debouncedSearch(e.target.value)}
            />
          </div>
          <select
            className="input-field select-field"
            style={{ height: 40, width: 160 }}
            value={role}
            onChange={(e) => { setRole(e.target.value); setPage(1); }}
          >
            <option value="">All roles</option>
            {ROLES.filter(Boolean).map((r) => (
              <option key={r} value={r}>{r.replace('_', ' ')}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="table-wrap">
          {loading ? (
            <PageSpinner />
          ) : users.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon" style={{ color: 'var(--text-muted)' }}>
                <Icon name="users" size={40} strokeWidth={1.4} />
              </div>
              <div className="empty-state-title">No users found</div>
              <div className="empty-state-desc">Try adjusting your search or filters.</div>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Approved</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const name = u.full_name || u.email?.split('@')[0] || 'Unknown';
                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar name={name} src={u.photo_url} size="sm" />
                          <div>
                            <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><Badge label={u.role} /></td>
                      <td>
                        <Badge label={u.is_active ? 'active' : 'inactive'} />
                      </td>
                      <td>
                        {u.role === 'ORGANIZER'
                          ? <Badge label={u.is_approved ? 'approved' : 'pending'} />
                          : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>N/A</span>}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => navigate(`/users/${u.id}`)}
                          >View</button>
                          {u.role === 'ORGANIZER' && !u.is_approved && (
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleApprove(u.id, name)}
                            >Approve</button>
                          )}
                          {u.role !== 'SUPER_ADMIN' && (
                            <button
                              className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-success'}`}
                              onClick={() => handleToggleActive(u.id, u.is_active)}
                            >{u.is_active ? 'Deactivate' : 'Activate'}</button>
                          )}
                          {u.role !== 'SUPER_ADMIN' && (
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => setConfirmDelete(u)}
                            >Delete</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <Pagination
          page={pagination.page || page}
          totalPages={pagination.totalPages || 1}
          onPageChange={(p) => setPage(p)}
        />

        {/* Confirm delete */}
        <ConfirmModal
          isOpen={!!confirmDelete}
          onClose={() => setConfirmDelete(null)}
          onConfirm={() => handleDelete(confirmDelete.id)}
          title="Delete User"
          message={`Are you sure you want to permanently delete ${confirmDelete?.full_name || confirmDelete?.email}? This cannot be undone.`}
          confirmText="Delete"
          danger
        />
      </div>
    </>
  );
}
