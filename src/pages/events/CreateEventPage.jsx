import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../../components/layout/Topbar.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { eventsService } from '../../services/events.service.js';
import useToastStore from '../../stores/useToastStore.js';
import { Spinner } from '../../components/ui/Spinner.jsx';

const MAX_BANNER_MB = 5;

const CATEGORIES = ['Technology', 'Arts & Culture', 'Sports', 'Academic', 'Social', 'Charity', 'Workshop', 'Conference', 'Other'];

export default function CreateEventPage() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    start_date: '',
    end_date: '',
    max_capacity: '',
    is_paid: false,
    ticket_price: '',
    tags: '',
  });
  const [loading, setLoading] = useState(false);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const toast = useToastStore();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleBannerSelect = (e) => {
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
  };

  const removeBanner = () => {
    setBannerFile(null);
    if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    setBannerPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.start_date) {
      toast.error('Title and start date are required.');
      return;
    }
    if (form.end_date && form.end_date < form.start_date) {
      toast.error('End date must be after start date.');
      return;
    }
    setLoading(true);
    try {
      // Map UI fields → backend (camelCase + correct names)
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
      const res = await eventsService.createEvent(payload);
      const newId = res.data.id;

      // Upload banner if one was selected
      if (bannerFile) {
        try {
          await eventsService.uploadBanner(newId, bannerFile);
        } catch {
          toast.warning('Event created, but banner upload failed. You can retry from the Edit page.');
        }
      }

      toast.success('Event created successfully!');
      navigate(`/events/${newId}`);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to create event.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Topbar />
      <div className="page-content">
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div className="page-header">
            <div>
              <div className="page-title">Create Event</div>
              <div className="page-subtitle">Set up a new campus event</div>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" style={{ marginBottom: 20 }} onClick={() => navigate('/events')}>← Back</button>
          <form onSubmit={handleSubmit}>
            {/* Banner upload */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-title" style={{ marginBottom: 14 }}>Cover Image</div>
              {bannerPreview ? (
                <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                  <img src={bannerPreview} alt="Banner preview" style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }} />
                  <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6 }}>
                    <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                      <Icon name="edit" size={14} /> Change
                      <input type="file" accept="image/*" onChange={handleBannerSelect} style={{ display: 'none' }} />
                    </label>
                    <button type="button" className="btn btn-danger btn-sm" onClick={removeBanner}>
                      <Icon name="trash" size={14} /> Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 10, padding: '36px 20px',
                  border: '2px dashed var(--border-soft)', borderRadius: 'var(--radius-md)',
                  background: 'rgba(34,211,238,0.03)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'rgba(34,211,238,0.06)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-soft)'; e.currentTarget.style.background = 'rgba(34,211,238,0.03)'; }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(34,211,238,0.1)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="download" size={22} style={{ transform: 'rotate(180deg)' }} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>Click to upload event banner</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>JPG, PNG or WebP · Max {MAX_BANNER_MB}MB · Recommended 1600 × 600</div>
                  </div>
                  <input type="file" accept="image/*" onChange={handleBannerSelect} style={{ display: 'none' }} />
                </label>
              )}
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-title" style={{ marginBottom: 20 }}>Event Details</div>
              <div className="form-grid">
                <div className="input-wrap span-2">
                  <label className="input-label" htmlFor="title">Title <span style={{ color: 'var(--red-400)' }}>*</span></label>
                  <input id="title" name="title" className="input-field" placeholder="Event title" value={form.title} onChange={handleChange} required />
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
                  <input id="location" name="location" className="input-field" placeholder="Venue or online" value={form.location} onChange={handleChange} />
                </div>
                <div className="input-wrap">
                  <label className="input-label" htmlFor="start_date">Start Date <span style={{ color: 'var(--red-400)' }}>*</span></label>
                  <input id="start_date" name="start_date" type="datetime-local" className="input-field" value={form.start_date} onChange={handleChange} required />
                </div>
                <div className="input-wrap">
                  <label className="input-label" htmlFor="end_date">End Date</label>
                  <input id="end_date" name="end_date" type="datetime-local" className="input-field" value={form.end_date} onChange={handleChange} />
                </div>
                <div className="input-wrap">
                  <label className="input-label" htmlFor="max_capacity">Max Capacity</label>
                  <input id="max_capacity" name="max_capacity" type="number" min="1" className="input-field" placeholder="Leave blank for unlimited" value={form.max_capacity} onChange={handleChange} />
                </div>
                <div className="input-wrap span-2">
                  <label className="input-label" htmlFor="description">Description</label>
                  <textarea id="description" name="description" className="textarea-field" placeholder="Describe your event…" value={form.description} onChange={handleChange} rows={4} />
                </div>
              </div>
            </div>

            {/* Ticketing */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-title" style={{ marginBottom: 16 }}>Ticketing</div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 16 }}>
                <input type="checkbox" name="is_paid" checked={form.is_paid} onChange={handleChange} style={{ accentColor: 'var(--accent)', width: 16, height: 16 }} />
                <span style={{ fontSize: 14, color: 'var(--text-default)' }}>This is a paid event</span>
              </label>
              {form.is_paid && (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '8px 12px', background: 'rgba(34,211,238,0.06)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--accent)' }}>
                  After creating the event, set up ticket types (General, Student, VIP, etc.) with their prices in the event's <strong>Manage</strong> page.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/events')}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <Spinner size="sm" /> : 'Create Event'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
