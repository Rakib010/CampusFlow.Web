import { useEffect, useState } from 'react';
import { paymentMethodsService, PAYMENT_METHOD_TYPES } from '../../services/paymentMethods.service.js';
import useToastStore from '../../stores/useToastStore.js';
import Icon from '../ui/Icon.jsx';
import { Spinner } from '../ui/Spinner.jsx';
import SelectMenu from '../ui/SelectMenu.jsx';

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
  const [editing, setEditing] = useState(null); 
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
    e?.preventDefault?.();
    e?.stopPropagation?.();
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
      <div className="pm-header">
        <div>
          <div className="pm-title">Payment Methods</div>
        </div>
        {!editing && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={startCreate}>
            <Icon name="plus" size={13} /> Add
          </button>
        )}
      </div>

      {loading ? (
        <div className="pm-loading"><Spinner /></div>
      ) : methods.length === 0 && !editing ? (
        <div className="pm-empty">
          No payment methods yet. Without one, attendees can only pay in cash at the venue.
        </div>
      ) : (
        <div className="pm-list">
          {methods.map((m) => {
            const type = m.method_type || m.methodType;
            const num = m.account_number || m.accountNumber;
            const name = m.account_name || m.accountName;
            const label = m.account_label || m.accountLabel;
            const instr = m.instructions;
            return (
              <div
                key={m.id || m._localId}
                className="pm-item"
              >
                <span className="pm-type-pill" style={{ background: typeColor(type), display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px 3px 5px' }}>
                  {(() => { const t = PAYMENT_METHOD_TYPES.find((x) => x.value === type); return t?.icon ? <img src={t.icon} alt="" style={{ width: 20, height: 20, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} /> : null; })()}
                  {typeLabel(type)}
                </span>
                <div className="pm-body">
                  <div className="pm-main">
                    {num} {label && <span className="pm-label">· {label}</span>}
                  </div>
                  {(name || instr) && (
                    <div className="pm-sub">
                      {name}{name && instr ? ' · ' : ''}{instr}
                    </div>
                  )}
                </div>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => startEdit(m)} title="Edit">
                  <Icon name="edit" size={13} />
                </button>
                <button type="button" className="btn btn-ghost btn-sm pm-remove" onClick={() => remove(m)} title="Remove">
                  <Icon name="trash" size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        // NOTE: This is a <div> (not a <form>) because this component is often rendered
        // inside a parent <form> (e.g. CreateEventPage). Nested forms are invalid HTML
        // and would cause the parent form to submit when "Add Method" is clicked.
        <div className="pm-editor">
          <div className="form-grid">
            <div className="input-wrap">
              <label className="input-label">Method type *</label>
              <SelectMenu
                value={form.methodType}
                onChange={(v) => setForm((f) => ({ ...f, methodType: v }))}
                placeholder="Select method"
                width="100%"
                options={PAYMENT_METHOD_TYPES.map((t) => ({ value: t.value, label: t.label }))}
                allowClear={false}
              />
            </div>
            <div className="input-wrap">
              <label className="input-label">Account number *</label>
              <input
                type="text"
                className="input-field"
                placeholder="01712345678"
                value={form.accountNumber}
                onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value }))}
                onKeyDown={(e) => {
                  // Enter inside this field would submit the OUTER form — block it
                  if (e.key === 'Enter') { e.preventDefault(); save(e); }
                }}
              />
            </div>
            <div className="input-wrap">
              <label className="input-label">Account name</label>
              <input
                type="text"
                className="input-field"
                placeholder="Test event committee"
                value={form.accountName}
                onChange={(e) => setForm((f) => ({ ...f, accountName: e.target.value }))}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); save(e); } }}
              />
            </div>
            <div className="input-wrap">
              <label className="input-label">Account type / label</label>
              <input
                type="text"
                className="input-field"
                placeholder="Personal, Merchant, Savings…"
                value={form.accountLabel}
                onChange={(e) => setForm((f) => ({ ...f, accountLabel: e.target.value }))}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); save(e); } }}
              />
            </div>
            <div className="input-wrap span-2">
              <label className="input-label">Instructions (optional)</label>
              <textarea
                className="textarea-field pm-instructions"
                rows={2}
                placeholder="Send via Send Money — no fee"
                value={form.instructions}
                onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
              />
            </div>
          </div>
          <div className="pm-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={cancel}>Cancel</button>
            <button type="button" className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
              {saving ? <Spinner size="sm" /> : (editing === 'new' ? 'Add Method' : 'Save Changes')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
