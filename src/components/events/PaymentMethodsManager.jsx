import { useEffect, useState } from 'react';
import { paymentMethodsService, PAYMENT_METHOD_TYPES } from '../../services/paymentMethods.service.js';
import useToastStore from '../../stores/useToastStore.js';
import Icon from '../ui/Icon.jsx';
import { Spinner } from '../ui/Spinner.jsx';

const blank = { methodType: 'bkash', accountName: '', accountNumber: '', accountLabel: '', instructions: '' };

/**
 * Manage payment methods for an event.
 * - When `eventId` is provided, fetches/creates/updates/deletes against the API.
 * - When omitted (event not yet created), keeps everything in local state and
 *   exposes the list via `onLocalChange` so the parent can persist after the
 *   event is created.
 */
export default function PaymentMethodsManager({ eventId, onLocalChange }) {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null); // null | 'new' | { id, ...method }
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);

  const fetchMethods = async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const r = await paymentMethodsService.list(eventId);
      setMethods(r.data || []);
    } catch {
      useToastStore.getState().error('Failed to load payment methods.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchMethods(); /* eslint-disable-next-line */ }, [eventId]);

  const startCreate = () => { setForm(blank); setEditing('new'); };
  const startEdit = (m) => {
    setForm({
      methodType: m.method_type,
      accountName: m.account_name || '',
      accountNumber: m.account_number,
      accountLabel: m.account_label || '',
      instructions: m.instructions || '',
    });
    setEditing(m);
  };
  const cancel = () => { setEditing(null); setForm(blank); };

  const save = async (e) => {
    e?.preventDefault();
    if (!form.methodType || !form.accountNumber) {
      useToastStore.getState().error('Method type and account number are required.');
      return;
    }
    setSaving(true);
    try {
      if (eventId) {
        if (editing === 'new') {
          await paymentMethodsService.create(eventId, form);
          useToastStore.getState().success('Payment method added.');
        } else {
          await paymentMethodsService.update(editing.id, form);
          useToastStore.getState().success('Payment method updated.');
        }
        await fetchMethods();
      } else {
        // Local-only mode (event not yet created)
        const next = editing === 'new'
          ? [...methods, { ...form, _localId: Date.now() }]
          : methods.map((m) => m._localId === editing._localId ? { ...form, _localId: editing._localId } : m);
        setMethods(next);
        onLocalChange?.(next);
      }
      cancel();
    } catch (err) {
      useToastStore.getState().error(err.response?.data?.message || 'Save failed.');
    } finally { setSaving(false); }
  };

  const remove = async (m) => {
    if (!window.confirm(`Remove this ${m.method_type || m.methodType} payment method?`)) return;
    try {
      if (eventId && m.id) {
        await paymentMethodsService.remove(m.id);
        useToastStore.getState().success('Payment method removed.');
        await fetchMethods();
      } else {
        const next = methods.filter((x) => x._localId !== m._localId);
        setMethods(next);
        onLocalChange?.(next);
      }
    } catch {
      useToastStore.getState().error('Remove failed.');
    }
  };

  const typeLabel = (t) => PAYMENT_METHOD_TYPES.find((x) => x.value === t)?.label || t;
  const typeColor = (t) => PAYMENT_METHOD_TYPES.find((x) => x.value === t)?.color || '#64748b';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>Payment Methods</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            How attendees pay you for online tickets (bKash, Nagad, bank transfer, etc.). They send money directly to your account; you confirm each ticket after verifying.
          </div>
        </div>
        {!editing && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={startCreate}>
            <Icon name="plus" size={13} /> Add
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ padding: 14, textAlign: 'center' }}><Spinner /></div>
      ) : methods.length === 0 && !editing ? (
        <div style={{
          padding: '20px 16px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: 13,
          background: 'rgba(34,211,238,0.04)',
          border: '1px dashed var(--border-soft)',
          borderRadius: 'var(--radius-md)',
        }}>
          No payment methods yet. Without one, attendees can only pay in cash at the venue.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {methods.map((m) => {
            const type = m.method_type || m.methodType;
            const num = m.account_number || m.accountNumber;
            const name = m.account_name || m.accountName;
            const label = m.account_label || m.accountLabel;
            const instr = m.instructions;
            return (
              <div
                key={m.id || m._localId}
                style={{
                  padding: '12px 14px',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                <span style={{
                  background: typeColor(type),
                  color: 'white',
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: 4,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  flexShrink: 0,
                }}>{typeLabel(type)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                    {num} {label && <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 400 }}>· {label}</span>}
                  </div>
                  {(name || instr) && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {name}{name && instr ? ' · ' : ''}{instr}
                    </div>
                  )}
                </div>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => startEdit(m)} title="Edit">
                  <Icon name="edit" size={13} />
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => remove(m)} title="Remove" style={{ color: 'var(--red-400)' }}>
                  <Icon name="trash" size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <form onSubmit={save} style={{
          marginTop: 12,
          padding: 16,
          background: 'rgba(34,211,238,0.04)',
          border: '1px solid rgba(34,211,238,0.2)',
          borderRadius: 'var(--radius-md)',
        }}>
          <div className="form-grid">
            <div className="input-wrap">
              <label className="input-label">Method type *</label>
              <select
                className="input-field select-field"
                value={form.methodType}
                onChange={(e) => setForm((f) => ({ ...f, methodType: e.target.value }))}
              >
                {PAYMENT_METHOD_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="input-wrap">
              <label className="input-label">Account number *</label>
              <input
                className="input-field"
                placeholder="01712345678"
                value={form.accountNumber}
                onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value }))}
                required
              />
            </div>
            <div className="input-wrap">
              <label className="input-label">Account name</label>
              <input
                className="input-field"
                placeholder="Test event committee"
                value={form.accountName}
                onChange={(e) => setForm((f) => ({ ...f, accountName: e.target.value }))}
              />
            </div>
            <div className="input-wrap">
              <label className="input-label">Account type / label</label>
              <input
                className="input-field"
                placeholder="Personal, Merchant, Savings…"
                value={form.accountLabel}
                onChange={(e) => setForm((f) => ({ ...f, accountLabel: e.target.value }))}
              />
            </div>
            <div className="input-wrap span-2">
              <label className="input-label">Instructions (optional)</label>
              <textarea
                className="textarea-field"
                rows={2}
                placeholder="Send via Send Money — no fee"
                value={form.instructions}
                onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={cancel}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? <Spinner size="sm" /> : (editing === 'new' ? 'Add Method' : 'Save Changes')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
