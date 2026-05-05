import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Topbar from '../../components/layout/Topbar.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Modal, { ConfirmModal } from '../../components/ui/Modal.jsx';
import { PageSpinner, Spinner } from '../../components/ui/Spinner.jsx';
import { eventsService } from '../../services/events.service.js';
import { volunteersService } from '../../services/volunteers.service.js';
import { ticketsService } from '../../services/tickets.service.js';
import { attendanceService } from '../../services/attendance.service.js';
import { certificatesService } from '../../services/certificates.service.js';
import useToastStore from '../../stores/useToastStore.js';
import Icon from '../../components/ui/Icon.jsx';

const TABS = [
  { key: 'volunteers', label: 'Volunteers' },
  { key: 'tickets', label: 'Tickets' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'certificates', label: 'Certificates' },
];

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Volunteers Tab ────────────────────────────────────────────────────────────
function VolunteersTab({ eventId }) {
  const [needs, setNeeds] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loadingNeeds, setLoadingNeeds] = useState(true);
  const [loadingApps, setLoadingApps] = useState(true);
  const [needModal, setNeedModal] = useState(false);
  const [needForm, setNeedForm] = useState({ roleName: '', headcount: '', description: '' });
  const [savingNeed, setSavingNeed] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');

  const loadNeeds = () => {
    setLoadingNeeds(true);
    volunteersService.getNeedsByEvent(eventId)
      .then((r) => setNeeds(r.data || []))
      .catch(() => useToastStore.getState().error('Failed to load volunteer needs.'))
      .finally(() => setLoadingNeeds(false));
  };

  const loadApps = () => {
    setLoadingApps(true);
    volunteersService.getApplications(eventId)
      .then((r) => setApplications(r.data || []))
      .catch(() => useToastStore.getState().error('Failed to load applications.'))
      .finally(() => setLoadingApps(false));
  };

  useEffect(() => { loadNeeds(); loadApps(); }, [eventId]);

  const handleCreateNeed = async (e) => {
    e.preventDefault();
    if (!needForm.roleName) { useToastStore.getState().error('Role name is required.'); return; }
    setSavingNeed(true);
    try {
      await volunteersService.createNeed(eventId, {
        roleName: needForm.roleName,
        headcount: needForm.headcount ? parseInt(needForm.headcount) : undefined,
        description: needForm.description || undefined,
      });
      useToastStore.getState().success('Volunteer role created.');
      setNeedModal(false);
      setNeedForm({ roleName: '', headcount: '', description: '' });
      loadNeeds();
    } catch (e) {
      useToastStore.getState().error(e.response?.data?.message || 'Failed to create need.');
    } finally { setSavingNeed(false); }
  };

  const handleDeleteNeed = async (id) => {
    try {
      await volunteersService.deleteNeed(id);
      useToastStore.getState().success('Role deleted.');
      loadNeeds();
    } catch (e) {
      useToastStore.getState().error(e.response?.data?.message || 'Failed to delete.');
    }
  };

  const handleReview = async (appId, status) => {
    try {
      await volunteersService.reviewApplication(appId, { status });
      useToastStore.getState().success(`Application ${status}.`);
      loadApps();
    } catch (e) {
      useToastStore.getState().error(e.response?.data?.message || 'Review failed.');
    }
  };

  const filteredApps = filterStatus
    ? applications.filter((a) => a.status === filterStatus)
    : applications;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Needs */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Volunteer Roles</div>
            <div className="card-subtitle">Define the roles you need volunteers for</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setNeedModal(true)}>+ Add Role</button>
        </div>

        {loadingNeeds ? <PageSpinner /> : needs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon" style={{ color: 'var(--text-muted)' }}><Icon name="users" size={40} strokeWidth={1.4} /></div>
            <div className="empty-state-title">No volunteer roles yet</div>
            <div className="empty-state-desc">Add roles to accept volunteer applications.</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Role</th><th>Slots</th><th>Filled</th><th>Description</th><th>Action</th></tr>
              </thead>
              <tbody>
                {needs.map((n) => (
                  <tr key={n.id}>
                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{n.role_name}</td>
                    <td>{n.headcount ?? 'Unlimited'}</td>
                    <td>{n.filled_count ?? 0}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{n.description || '—'}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteNeed(n.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Applications */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Applications</div>
            <div className="card-subtitle">{applications.length} total</div>
          </div>
          <select
            className="input-field select-field"
            style={{ height: 36, width: 140, fontSize: 13 }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {loadingApps ? <PageSpinner /> : filteredApps.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon" style={{ color: "var(--text-muted)" }}><Icon name="clipboard" size={40} strokeWidth={1.4} /></div>
            <div className="empty-state-title">No applications</div>
            <div className="empty-state-desc">{filterStatus ? 'None with this status.' : 'No one has applied yet.'}</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Volunteer</th><th>Role</th><th>Status</th><th>Applied</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filteredApps.map((app) => (
                  <tr key={app.id}>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                        {app.full_name || app.volunteer_name || app.email || app.volunteer_email || '—'}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{app.email || app.volunteer_email}</div>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{app.role_name || '—'}</td>
                    <td>
                      <Badge label={app.status} color={app.status === 'approved' ? 'green' : app.status === 'rejected' ? 'red' : 'amber'} />
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{fmtDate(app.applied_at || app.created_at)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {app.status === 'pending' && (
                          <>
                            <button className="btn btn-success btn-sm" onClick={() => handleReview(app.id, 'approved')}>Approve</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleReview(app.id, 'rejected')}>Reject</button>
                          </>
                        )}
                        {app.status !== 'pending' && (
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Reviewed</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Need modal */}
      <Modal
        isOpen={needModal}
        onClose={() => setNeedModal(false)}
        title="Add Volunteer Role"
        footer={
          <>
            <button className="btn btn-secondary btn-sm" onClick={() => setNeedModal(false)}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={handleCreateNeed} disabled={savingNeed}>
              {savingNeed ? <Spinner size="sm" /> : 'Create Role'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="input-wrap">
            <label className="input-label">Role Name *</label>
            <input className="input-field" placeholder="e.g. Registration Desk" value={needForm.roleName}
              onChange={(e) => setNeedForm((f) => ({ ...f, roleName: e.target.value }))} />
          </div>
          <div className="input-wrap">
            <label className="input-label">Headcount (slots available)</label>
            <input type="number" min="1" className="input-field" placeholder="Leave blank for unlimited"
              value={needForm.headcount} onChange={(e) => setNeedForm((f) => ({ ...f, headcount: e.target.value }))} />
          </div>
          <div className="input-wrap">
            <label className="input-label">Description</label>
            <textarea className="textarea-field" rows={3} placeholder="What will volunteers do in this role?"
              value={needForm.description} onChange={(e) => setNeedForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── Tickets Tab ────────────────────────────────────────────────────────────────
function TicketsTab({ eventId }) {
  const [types, setTypes] = useState([]);
  const [sold, setSold] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [loadingSold, setLoadingSold] = useState(true);
  const [typeModal, setTypeModal] = useState(false);
  const [typeForm, setTypeForm] = useState({ name: 'General', price: '', totalQuantity: '', description: '' });
  const [savingType, setSavingType] = useState(false);

  const loadTypes = () => {
    setLoadingTypes(true);
    ticketsService.getTicketTypes(eventId)
      .then((r) => setTypes(r.data || []))
      .catch(() => {})
      .finally(() => setLoadingTypes(false));
  };

  const loadSold = () => {
    setLoadingSold(true);
    ticketsService.getEventTickets(eventId)
      .then((r) => setSold(r.data || []))
      .catch(() => {})
      .finally(() => setLoadingSold(false));
  };

  useEffect(() => { loadTypes(); loadSold(); }, [eventId]);

  const handleCreateType = async (e) => {
    e.preventDefault();
    if (!typeForm.price) { useToastStore.getState().error('Price is required.'); return; }
    setSavingType(true);
    try {
      if (!typeForm.totalQuantity) { useToastStore.getState().error('Quantity is required.'); setSavingType(false); return; }
      await ticketsService.createTicketType(eventId, {
        name: typeForm.name,
        price: parseFloat(typeForm.price),
        quantity: parseInt(typeForm.totalQuantity),
        description: typeForm.description || undefined,
      });
      useToastStore.getState().success('Ticket type created.');
      setTypeModal(false);
      setTypeForm({ name: 'General', price: '', totalQuantity: '', description: '' });
      loadTypes();
    } catch (e) {
      useToastStore.getState().error(e.response?.data?.message || 'Failed to create ticket type.');
    } finally { setSavingType(false); }
  };

  const handleDeleteType = async (id) => {
    try {
      await ticketsService.deleteTicketType(id);
      useToastStore.getState().success('Ticket type deleted.');
      loadTypes();
    } catch (e) {
      useToastStore.getState().error(e.response?.data?.message || 'Failed to delete.');
    }
  };

  const handleConfirmCash = async (id) => {
    try {
      await ticketsService.confirmCashPayment(id);
      useToastStore.getState().success('Cash payment confirmed.');
      loadSold();
    } catch (e) {
      useToastStore.getState().error(e.response?.data?.message || 'Failed to confirm.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Ticket Types */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Ticket Types</div>
            <div className="card-subtitle">General, Student, Guest, VIP tiers</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setTypeModal(true)}>+ Add Type</button>
        </div>
        {loadingTypes ? <PageSpinner /> : types.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon" style={{ color: "var(--text-muted)" }}><Icon name="ticket" size={40} strokeWidth={1.4} /></div>
            <div className="empty-state-title">No ticket types yet</div>
            <div className="empty-state-desc">Add ticket tiers for attendees to purchase.</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Type</th><th>Price</th><th>Qty Available</th><th>Sold</th><th>Action</th></tr>
              </thead>
              <tbody>
                {types.map((t) => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{t.name}</td>
                    <td>{Number(t.price || 0).toFixed(2)} ৳</td>
                    <td>{t.available_quantity != null ? `${t.available_quantity} / ${t.quantity}` : (t.quantity ?? 'Unlimited')}</td>
                    <td>{t.quantity != null && t.available_quantity != null ? (t.quantity - t.available_quantity) : (t.sold_count ?? 0)}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteType(t.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sold Tickets */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Sold Tickets</div>
          <div className="card-subtitle">{sold.length} tickets sold</div>
        </div>
        {loadingSold ? <PageSpinner /> : sold.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <div className="empty-state-title">No tickets sold yet</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Buyer</th><th>Type</th><th>Payment</th><th>Status</th><th>Date</th><th>Action</th></tr>
              </thead>
              <tbody>
                {sold.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{t.buyer_name || t.buyer_email || '—'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.buyer_email}</div>
                    </td>
                    <td style={{ fontSize: 13 }}>{t.ticket_type_name || '—'}</td>
                    <td>
                      <Badge label={t.payment_type || 'cash'} color={t.payment_type === 'online' ? 'cyan' : 'amber'} />
                    </td>
                    <td>
                      <Badge label={t.payment_status || 'pending'} color={t.payment_status === 'confirmed' ? 'green' : 'amber'} />
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{fmtDate(t.purchased_at)}</td>
                    <td>
                      {t.payment_type === 'cash' && t.payment_status !== 'confirmed' && (
                        <button className="btn btn-success btn-sm" onClick={() => handleConfirmCash(t.id)}>
                          Confirm Cash
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Type Modal */}
      <Modal isOpen={typeModal} onClose={() => setTypeModal(false)} title="Add Ticket Type"
        footer={
          <>
            <button className="btn btn-secondary btn-sm" onClick={() => setTypeModal(false)}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={handleCreateType} disabled={savingType}>
              {savingType ? <Spinner size="sm" /> : 'Create'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="input-wrap">
            <label className="input-label">Ticket Type *</label>
            <select className="input-field select-field" value={typeForm.name}
              onChange={(e) => setTypeForm((f) => ({ ...f, name: e.target.value }))}>
              {['General', 'Student', 'Guest', 'VIP'].map((n) => <option key={n}>{n}</option>)}
            </select>
          </div>
          <div className="input-wrap">
            <label className="input-label">Price (৳ BDT) *</label>
            <input type="number" min="0" step="0.01" className="input-field" placeholder="0.00"
              value={typeForm.price} onChange={(e) => setTypeForm((f) => ({ ...f, price: e.target.value }))} />
          </div>
          <div className="input-wrap">
            <label className="input-label">Total Quantity</label>
            <input type="number" min="1" className="input-field" placeholder="Leave blank for unlimited"
              value={typeForm.totalQuantity} onChange={(e) => setTypeForm((f) => ({ ...f, totalQuantity: e.target.value }))} />
          </div>
          <div className="input-wrap">
            <label className="input-label">Description</label>
            <input className="input-field" placeholder="Optional details"
              value={typeForm.description} onChange={(e) => setTypeForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── Attendance Tab ─────────────────────────────────────────────────────────────
function AttendanceTab({ eventId }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [manualForm, setManualForm] = useState({ userId: '', userType: 'attendee' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    attendanceService.getEventAttendance(eventId)
      .then((r) => setRecords(r.data || []))
      .catch(() => useToastStore.getState().error('Failed to load attendance.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [eventId]);

  const handleCheckIn = async (e) => {
    e.preventDefault();
    if (!manualForm.userId) { useToastStore.getState().error('User ID is required.'); return; }
    setSaving(true);
    try {
      await attendanceService.checkInManual(eventId, manualForm.userId, manualForm.userType);
      useToastStore.getState().success('Check-in successful.');
      setManualForm({ userId: '', userType: 'attendee' });
      load();
    } catch (e) {
      useToastStore.getState().error(e.response?.data?.message || 'Check-in failed.');
    } finally { setSaving(false); }
  };

  const handleCheckOut = async (userId) => {
    try {
      await attendanceService.checkOut(eventId, userId);
      useToastStore.getState().success('Check-out recorded.');
      load();
    } catch (e) {
      useToastStore.getState().error(e.response?.data?.message || 'Check-out failed.');
    }
  };

  const checkedIn = records.filter((r) => r.checked_in_at && !r.checked_out_at).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon cyan"><Icon name="users" size={20} /></div>
          <div className="stat-card-body">
            <div className="stat-card-value">{records.length}</div>
            <div className="stat-card-label">Total Records</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon green"><Icon name="checkCircle" size={20} /></div>
          <div className="stat-card-body">
            <div className="stat-card-value">{checkedIn}</div>
            <div className="stat-card-label">Currently In</div>
          </div>
        </div>
      </div>

      {/* Manual check-in */}
      <div className="card">
        <div className="card-title" style={{ marginBottom: 16 }}>Manual Check-in</div>
        <form onSubmit={handleCheckIn} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div className="input-wrap" style={{ flex: 1, minWidth: 200 }}>
            <label className="input-label">User ID (UUID)</label>
            <input className="input-field" placeholder="Paste user UUID…"
              value={manualForm.userId} onChange={(e) => setManualForm((f) => ({ ...f, userId: e.target.value }))} />
          </div>
          <div className="input-wrap" style={{ width: 140 }}>
            <label className="input-label">User Type</label>
            <select className="input-field select-field" value={manualForm.userType}
              onChange={(e) => setManualForm((f) => ({ ...f, userType: e.target.value }))}>
              <option value="attendee">Attendee</option>
              <option value="volunteer">Volunteer</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <Spinner size="sm" /> : 'Check In'}
            </button>
          </div>
        </form>
      </div>

      {/* Records */}
      <div className="card">
        <div className="card-title" style={{ marginBottom: 16 }}>Attendance Records</div>
        {loading ? <PageSpinner /> : records.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon" style={{ color: "var(--text-muted)" }}><Icon name="clipboard" size={40} strokeWidth={1.4} /></div>
            <div className="empty-state-title">No attendance records</div>
            <div className="empty-state-desc">Check-ins will appear here.</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Name</th><th>Type</th><th>Check-in</th><th>Check-out</th><th>Action</th></tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{r.user_name || '—'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.user_email}</div>
                    </td>
                    <td><Badge label={r.user_type || 'attendee'} color="slate" /></td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{r.checked_in_at ? new Date(r.checked_in_at).toLocaleTimeString() : '—'}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{r.checked_out_at ? new Date(r.checked_out_at).toLocaleTimeString() : '—'}</td>
                    <td>
                      {r.checked_in_at && !r.checked_out_at && (
                        <button className="btn btn-secondary btn-sm" onClick={() => handleCheckOut(r.user_id)}>
                          Check Out
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Certificates Tab ───────────────────────────────────────────────────────────
function CertificatesTab({ eventId }) {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    volunteersService.getApplications(eventId)
      .then((r) => setVolunteers((r.data || []).filter((a) => a.status === 'approved')))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [eventId]);

  const handleGenerate = async (volunteerId, name) => {
    try {
      await certificatesService.generateForVolunteer(eventId, volunteerId);
      useToastStore.getState().success(`Certificate generated for ${name}.`);
    } catch (e) {
      useToastStore.getState().error(e.response?.data?.message || 'Failed to generate.');
    }
  };

  const handleBulkGenerate = async () => {
    setGenerating(true);
    try {
      const r = await certificatesService.generateBulk(eventId);
      useToastStore.getState().success(`Bulk generation complete: ${r.data?.generated ?? 0} certificates.`);
    } catch (e) {
      useToastStore.getState().error(e.response?.data?.message || 'Bulk generation failed.');
    } finally { setGenerating(false); }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">Volunteer Certificates</div>
          <div className="card-subtitle">Generate certificates for approved volunteers</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={handleBulkGenerate} disabled={generating || volunteers.length === 0}>
          {generating ? <Spinner size="sm" /> : 'Bulk Generate All'}
        </button>
      </div>

      {loading ? <PageSpinner /> : volunteers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon" style={{ color: "var(--text-muted)" }}><Icon name="award" size={40} strokeWidth={1.4} /></div>
          <div className="empty-state-title">No approved volunteers</div>
          <div className="empty-state-desc">Approve volunteer applications first.</div>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Volunteer</th><th>Role</th><th>Action</th></tr>
            </thead>
            <tbody>
              {volunteers.map((v) => (
                <tr key={v.id}>
                  <td>
                    <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{v.volunteer_name || v.volunteer_email || '—'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{v.volunteer_email}</div>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{v.role_name || '—'}</td>
                  <td>
                    <button className="btn btn-success btn-sm"
                      onClick={() => handleGenerate(v.volunteer_id || v.user_id, v.volunteer_name)}>
                      Generate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function EventManagePage() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('volunteers');
  const navigate = useNavigate();

  useEffect(() => {
    eventsService.getEvent(id)
      .then((r) => setEvent(r.data))
      .catch(() => { useToastStore.getState().error('Event not found.'); navigate('/events'); })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return (
    <>
      <Topbar />
      <div className="page-content"><PageSpinner /></div>
    </>
  );

  return (
    <>
      <Topbar />
      <div className="page-content">
        <div className="page-header">
          <div>
            <div className="page-title">Manage: {event?.title || ''}</div>
            <div className="page-subtitle">Volunteers · Tickets · Attendance · Certificates</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/events/${id}`)}>← Back to Event</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, marginBottom: 24, borderBottom: '1px solid var(--border-subtle)' }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              className="btn btn-ghost"
              style={{
                borderRadius: '8px 8px 0 0',
                borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
                color: tab === t.key ? 'var(--accent)' : 'var(--text-muted)',
                fontWeight: tab === t.key ? 600 : 400,
              }}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'volunteers' && <VolunteersTab eventId={id} />}
        {tab === 'tickets' && <TicketsTab eventId={id} />}
        {tab === 'attendance' && <AttendanceTab eventId={id} />}
        {tab === 'certificates' && <CertificatesTab eventId={id} />}
      </div>
    </>
  );
}
