import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Topbar from '../../components/layout/Topbar.jsx';
import Icon from '../../components/ui/Icon.jsx';
import PaymentMethodsManager from '../../components/events/PaymentMethodsManager.jsx';
import SelectMenu from '../../components/ui/SelectMenu.jsx';
import DateTimePicker from '../../components/ui/DateTimePicker.jsx';
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
          attendee_registration_deadline: toDatetimeLocal(ev.attendee_registration_deadline),
          volunteer_registration_deadline: toDatetimeLocal(ev.volunteer_registration_deadline),
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
    if (!form.title || !form.start_date || !form.end_date) {
      toast.error('Title, start date, and end date are required.');
      return;
    }
    const start = new Date(form.start_date);
    const end = new Date(form.end_date);
    if (end <= start) {
      toast.error('End date must be after start date.');
      return;
    }
    if (form.attendee_registration_deadline) {
      const ad = new Date(form.attendee_registration_deadline);
      if (ad > start) {
        toast.error('Ticket sales must close on or before the event starts.');
        return;
      }
    }
    if (form.volunteer_registration_deadline) {
      const vd = new Date(form.volunteer_registration_deadline);
      if (vd > end) {
        toast.error('Volunteer application deadline must be on or before the event ends.');
        return;
      }
    }
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
        attendeeRegistrationDeadline: form.attendee_registration_deadline || undefined,
        volunteerRegistrationDeadline: form.volunteer_registration_deadline || undefined,
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

  if (!form) return null;

  return (
    <>
      <Topbar />
      <div className="page-content">
        <div className="event-form-shell">
          <div className="page-header">
            <div>
              <div className="page-title">Edit Event</div>
              <div className="page-subtitle">Update event details</div>
            </div>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="event-form-bg">
              <div className="event-create-grid">
                {/* Left column */}
                <div className="event-create-left">
                  <div className="event-section">
                    <div className="event-section-title">Event Details</div>
                    <div className="form-grid">
                      <div className="input-wrap span-2">
                        <label className="input-label" htmlFor="title">Title <span className="required-star">*</span></label>
                        <input id="title" name="title" className="input-field" placeholder="Event title" value={form.title} onChange={handleChange} required />
                      </div>
                      <div className="input-wrap span-2">
                        <label className="input-label" htmlFor="category">Category</label>
                        <SelectMenu
                          value={form.category}
                          onChange={(v) => setForm((f) => ({ ...f, category: v }))}
                          placeholder="Select category"
                          width="100%"
                          options={[
                            { value: '', label: 'Select category' },
                            ...CATEGORIES.map((c) => ({ value: c, label: c })),
                          ]}
                          allowClear={false}
                        />
                      </div>
                      <div className="input-wrap span-2">
                        <label className="input-label" htmlFor="description">Description</label>
                        <textarea id="description" name="description" className="textarea-field event-description" placeholder="Describe your event…" value={form.description} onChange={handleChange} rows={5} />
                      </div>
                    </div>
                  </div>

                  {/* Ticketing */}
                  <div className="event-section">
                    <div className="event-section-title">Ticketing</div>
                    <label className="ticketing-check">
                      <input type="checkbox" name="is_paid" checked={form.is_paid} onChange={handleChange} />
                      <span>This is a paid event</span>
                    </label>
                    {form.is_paid && (
                      <>
                        <div className="ticketing-note">
                          Set ticket type prices (General, Student, VIP) in the event&apos;s <strong>Manage</strong> page.
                        </div>
                        <PaymentMethodsManager eventId={id} />
                      </>
                    )}
                  </div>
                </div>

                {/* Right column */}
                <div className="event-create-right">
                  <div className="event-section">
                    <div className="event-section-title">Schedule & Capacity</div>
                    <div className="form-grid">
                      <div className="input-wrap span-2">
                        <label className="input-label">Location</label>
                        {(() => {
                          const currentMode = form.location_mode || (form.location?.match(/^https?:\/\//) ? 'online' : 'in_person');
                          return (
                            <div className="location-choice" role="radiogroup" aria-label="Location mode">
                              {[
                                { value: 'in_person', label: 'In person' },
                                { value: 'online', label: 'Zoom / Online' },
                              ].map((opt) => {
                                const active = currentMode === opt.value;
                                return (
                                  <label key={opt.value} className={`location-pill${active ? ' is-active' : ''}`}>
                                    <input
                                      type="radio"
                                      name="location_mode"
                                      value={opt.value}
                                      checked={active}
                                      onChange={() => setForm((f) => ({ ...f, location_mode: opt.value, location: '' }))}
                                    />
                                    <span className="location-pill__dot" aria-hidden="true" />
                                    <span className="location-pill__label">{opt.label}</span>
                                  </label>
                                );
                              })}
                            </div>
                          );
                        })()}
                        {(form.location_mode || (form.location?.match(/^https?:\/\//) ? 'online' : 'in_person')) === 'online' ? (
                          <input
                            id="location"
                            name="location"
                            type="url"
                            className="input-field"
                            placeholder="https://zoom.us/j/123…  or  https://meet.google.com/…"
                            value={form.location}
                            onChange={handleChange}
                          />
                        ) : (
                          <input
                            id="location"
                            name="location"
                            className="input-field"
                            placeholder="Conference Hall A, Building 3"
                            value={form.location}
                            onChange={handleChange}
                          />
                        )}
                      </div>

                      <div className="input-wrap">
                        <label className="input-label" htmlFor="start_date">Start Date <span className="required-star">*</span></label>
                        <DateTimePicker
                          value={form.start_date}
                          onChange={(v) => setForm((f) => ({ ...f, start_date: v }))}
                        />
                      </div>
                      <div className="input-wrap">
                        <label className="input-label" htmlFor="end_date">End Date <span className="required-star">*</span></label>
                        <DateTimePicker
                          value={form.end_date}
                          onChange={(v) => setForm((f) => ({ ...f, end_date: v }))}
                          min={form.start_date || undefined}
                        />
                      </div>

                      <div className="input-wrap span-2">
                        <label className="input-label" htmlFor="max_capacity">Max Capacity</label>
                        <input id="max_capacity" name="max_capacity" type="number" min="1" className="input-field" placeholder="Leave blank for unlimited" value={form.max_capacity} onChange={handleChange} />
                      </div>

                      <div className="input-wrap span-2">
                        <label className="input-label" htmlFor="attendee_registration_deadline">Ticket Sales Deadline</label>
                        <DateTimePicker
                          value={form.attendee_registration_deadline}
                          onChange={(v) => setForm((f) => ({ ...f, attendee_registration_deadline: v }))}
                          max={form.start_date || undefined}
                          placeholder="Select deadline…"
                        />
                        <div className="field-hint">
                          Last date attendees can buy tickets. Must be on or before the event starts.
                        </div>
                      </div>

                      <div className="input-wrap span-2">
                        <label className="input-label" htmlFor="volunteer_registration_deadline">Volunteer Application Deadline</label>
                        <DateTimePicker
                          value={form.volunteer_registration_deadline}
                          onChange={(v) => setForm((f) => ({ ...f, volunteer_registration_deadline: v }))}
                          max={form.end_date || undefined}
                          placeholder="Select deadline…"
                        />
                        <div className="field-hint">
                          Last date volunteers can apply. Can stay open until the event ends.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Banner upload (bottom) */}
              <div className="event-section event-cover-bottom">
                <div className="event-section-title">Cover Image</div>
                {(bannerPreview || bannerUrl) ? (
                  <div className={`event-banner-preview${bannerUploading ? ' is-uploading' : ''}`}>
                    <img src={bannerPreview || bannerUrl} alt="Banner preview" className="event-banner-img" />
                    {bannerUploading && (
                      <div className="event-banner-actions">
                        <span className="btn btn-secondary btn-sm btn-wait">
                          <Spinner size="sm" /> Uploading…
                        </span>
                      </div>
                    )}
                    {!bannerUploading && (
                      <div className="event-banner-actions">
                        <label className="btn btn-secondary btn-sm">
                          <Icon name="edit" size={14} /> Replace
                          <input type="file" accept="image/*" onChange={handleBannerSelect} className="event-file-hidden" />
                        </label>
                      </div>
                    )}
                  </div>
                ) : (
                  <label className={`event-upload-drop${bannerUploading ? ' is-uploading' : ''}`}>
                    <div className="event-upload-icon">
                      {bannerUploading ? <Spinner size="sm" /> : <Icon name="download" size={22} />}
                    </div>
                    <div className="event-upload-text">
                      <div className="event-upload-title">{bannerUploading ? 'Uploading…' : 'Click to upload event banner'}</div>
                      <div className="event-upload-sub">JPG, PNG or WebP · Max {MAX_BANNER_MB}MB · Recommended 1600 × 600</div>
                    </div>
                    <input type="file" accept="image/*" onChange={handleBannerSelect} className="event-file-hidden" disabled={bannerUploading} />
                  </label>
                )}
              </div>

              <div className="event-actions event-actions-bottom">
                <button type="button" className="btn btn-secondary" onClick={() => navigate(`/events/${id}`)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <Spinner size="sm" /> : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
