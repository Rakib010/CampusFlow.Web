import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Topbar from '../../components/layout/Topbar.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { eventsService } from '../../services/events.service.js';
import useToastStore from '../../stores/useToastStore.js';
import { PageSpinner, Spinner } from '../../components/ui/Spinner.jsx';

const MAX_BANNER_MB = 5;

const CATEGORIES = ['Technology', 'Arts & Culture', 'Sports', 'Academic', 'Social', 'Charity', 'Workshop', 'Conference', 'Other'];

function toDatetimeLocal(d) {
  if (!d) return '';
  const dt = new Date(d);
  return new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export default function EditEventPage() {
  const { id } = useParams();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bannerUrl, setBannerUrl] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [bannerUploading, setBannerUploading] = useState(false);
  const toast = useToastStore();
  const navigate = useNavigate();

  useEffect(() => {
    eventsService.getEvent(id)
      .then((r) => {
        const ev = r.data;
        setForm({
          title: ev.title || '',
          description: ev.description || '',
          category: ev.category || '',
          location: ev.venue || '',
          start_date: toDatetimeLocal(ev.start_date),
          end_date: toDatetimeLocal(ev.end_date),
          max_capacity: ev.max_volunteers || '',
          is_paid: !!ev.is_paid,
        });
        setBannerUrl(ev.banner_url || null);
      })
      .catch(() => { toast.error('Event not found.'); navigate('/events'); })
      .finally(() => setLoading(false));
  }, [id, navigate, toast]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleBannerSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\//.test(file.type)) {
      toast.error('Please select an image file (JPG, PNG, WebP).');
      return;
    }
    if (file.size > MAX_BANNER_MB * 1024 * 1024) {
      toast.error(`Image must be smaller than ${MAX_BANNER_MB}MB.`);
      return;
    }
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));

    // Upload immediately
    setBannerUploading(true);
    try {
      const r = await eventsService.uploadBanner(id, file);
      setBannerUrl(r.data?.bannerUrl || URL.createObjectURL(file));
      toast.success('Banner uploaded.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload banner.');
      setBannerFile(null);
      setBannerPreview(null);
    } finally {
      setBannerUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.start_date) { toast.error('Title and start date are required.'); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description || undefined,
        category: form.category || undefined,
        venue: form.location || undefined,
        startDate: form.start_date,
        endDate: form.end_date || form.start_date,
        isPaid: !!form.is_paid,
        maxVolunteers: form.max_capacity ? parseInt(form.max_capacity) : 0,
      };
      await eventsService.updateEvent(id, payload);
      toast.success('Event updated.');
      navigate(`/events/${id}`);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

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
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div className="page-header">
            <div>
              <div className="page-title">Edit Event</div>
              <div className="page-subtitle">Update event details</div>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" style={{ marginBottom: 20 }} onClick={() => navigate(`/events/${id}`)}>← Back</button>
          <form onSubmit={handleSubmit}>
            {/* Banner */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-title" style={{ marginBottom: 14 }}>Cover Image</div>
              {(bannerPreview || bannerUrl) ? (
                <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                  <img
                    src={bannerPreview || bannerUrl}
                    alt="Event banner"
                    style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block', opacity: bannerUploading ? 0.5 : 1, transition: 'opacity 0.2s' }}
                  />
                  {bannerUploading && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Spinner />
                    </div>
                  )}
                  <div style={{ position: 'absolute', top: 10, right: 10 }}>
                    <label className="btn btn-secondary btn-sm" style={{ cursor: bannerUploading ? 'wait' : 'pointer' }}>
                      <Icon name="edit" size={14} /> {bannerUploading ? 'Uploading…' : 'Replace'}
                      <input type="file" accept="image/*" onChange={handleBannerSelect} style={{ display: 'none' }} disabled={bannerUploading} />
                    </label>
                  </div>
                </div>
              ) : (
                <label style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 10, padding: '36px 20px',
                  border: '2px dashed var(--border-soft)', borderRadius: 'var(--radius-md)',
                  background: 'rgba(34,211,238,0.03)',
                  cursor: bannerUploading ? 'wait' : 'pointer',
                  transition: 'all var(--transition-fast)',
                }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(34,211,238,0.1)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {bannerUploading ? <Spinner size="sm" /> : <Icon name="download" size={22} style={{ transform: 'rotate(180deg)' }} />}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>
                      {bannerUploading ? 'Uploading…' : 'Click to upload event banner'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                      JPG, PNG or WebP · Max {MAX_BANNER_MB}MB · Recommended 1600 × 600
                    </div>
                  </div>
                  <input type="file" accept="image/*" onChange={handleBannerSelect} style={{ display: 'none' }} disabled={bannerUploading} />
                </label>
              )}
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-title" style={{ marginBottom: 20 }}>Event Details</div>
              <div className="form-grid">
                <div className="input-wrap span-2">
                  <label className="input-label" htmlFor="title">Title *</label>
                  <input id="title" name="title" className="input-field" value={form.title} onChange={handleChange} required />
                </div>
                <div className="input-wrap">
                  <label className="input-label" htmlFor="category">Category</label>
                  <select id="category" name="category" className="input-field select-field" value={form.category} onChange={handleChange}>
                    <option value="">Select category</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="input-wrap">
                  <label className="input-label" htmlFor="location">Location</label>
                  <input id="location" name="location" className="input-field" value={form.location} onChange={handleChange} />
                </div>
                <div className="input-wrap">
                  <label className="input-label" htmlFor="start_date">Start Date *</label>
                  <input id="start_date" name="start_date" type="datetime-local" className="input-field" value={form.start_date} onChange={handleChange} required />
                </div>
                <div className="input-wrap">
                  <label className="input-label" htmlFor="end_date">End Date</label>
                  <input id="end_date" name="end_date" type="datetime-local" className="input-field" value={form.end_date} onChange={handleChange} />
                </div>
                <div className="input-wrap">
                  <label className="input-label" htmlFor="max_capacity">Max Capacity</label>
                  <input id="max_capacity" name="max_capacity" type="number" min="1" className="input-field" value={form.max_capacity} onChange={handleChange} />
                </div>
                <div className="input-wrap span-2">
                  <label className="input-label" htmlFor="description">Description</label>
                  <textarea id="description" name="description" className="textarea-field" value={form.description} onChange={handleChange} rows={4} />
                </div>
              </div>
            </div>
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-title" style={{ marginBottom: 16 }}>Ticketing</div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 16 }}>
                <input type="checkbox" name="is_paid" checked={form.is_paid} onChange={handleChange} style={{ accentColor: 'var(--accent)', width: 16, height: 16 }} />
                <span style={{ fontSize: 14, color: 'var(--text-default)' }}>Paid event</span>
              </label>
              {form.is_paid && (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '8px 12px', background: 'rgba(34,211,238,0.06)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--accent)' }}>
                  Set ticket type prices in the event's <strong>Manage → Tickets</strong> page.
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={() => navigate(`/events/${id}`)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <Spinner size="sm" /> : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
