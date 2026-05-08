import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../../components/layout/Topbar.jsx';
import Icon from '../../components/ui/Icon.jsx';
import PaymentMethodsManager from '../../components/events/PaymentMethodsManager.jsx';
import SelectMenu from '../../components/ui/SelectMenu.jsx';
import DateTimePicker from '../../components/ui/DateTimePicker.jsx';
import { eventsService } from '../../services/events.service.js';
import { paymentMethodsService } from '../../services/paymentMethods.service.js';
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
    attendee_registration_deadline: '',
    volunteer_registration_deadline: '',
    max_capacity: '',
    is_paid: false,
    ticket_price: '',
    tags: '',
  });
  const [loading, setLoading] = useState(false);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]); // collected locally before event exists
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
    if (!form.title || !form.start_date || !form.end_date) {
      toast.error('Title, start date, and end date are required.');
      return;
    }

    const start = new Date(form.start_date);
    const end = new Date(form.end_date);
    const now = new Date();

    if (end <= start) {
      toast.error('End date must be after start date.');
      return;
    }
    if (start < now) {
      toast.error('Start date cannot be in the past.');
      return;
    }
    if (form.attendee_registration_deadline) {
      const ad = new Date(form.attendee_registration_deadline);
      if (ad < now) {
        toast.error('Ticket sales deadline cannot be in the past.');
        return;
      }
      if (ad > start) {
        toast.error('Ticket sales must close on or before the event starts.');
        return;
      }
    }
    if (form.volunteer_registration_deadline) {
      const vd = new Date(form.volunteer_registration_deadline);
      if (vd < now) {
        toast.error('Volunteer application deadline cannot be in the past.');
        return;
      }
      if (vd > end) {
        toast.error('Volunteer application deadline must be on or before the event ends.');
        return;
      }
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
        attendeeRegistrationDeadline: form.attendee_registration_deadline || undefined,
        volunteerRegistrationDeadline: form.volunteer_registration_deadline || undefined,
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

      // Persist payment methods collected before the event existed
      if (form.is_paid && paymentMethods.length > 0) {
        for (const m of paymentMethods) {
          try {
            await paymentMethodsService.create(newId, {
              methodType: m.methodType,
              accountName: m.accountName || undefined,
              accountNumber: m.accountNumber,
              accountLabel: m.accountLabel || undefined,
              instructions: m.instructions || undefined,
            });
          } catch {
            toast.warning(`Failed to save the ${m.methodType} payment method. You can re-add it from the Edit page.`);
          }
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
        <div className="event-form-shell">
          <div className="page-header">
            <div>
              <div className="page-title">Create Event</div>
              <div className="page-subtitle">Set up a new campus event</div>
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
                        Set ticket type prices (General, Student, VIP) in the event&apos;s <strong>Manage</strong> page after creating it.
                      </div>
                      <PaymentMethodsManager onLocalChange={setPaymentMethods} />
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
                        min={new Date().toISOString().slice(0, 16)}
                      />
                    </div>
                    <div className="input-wrap">
                      <label className="input-label" htmlFor="end_date">End Date <span className="required-star">*</span></label>
                      <DateTimePicker
                        value={form.end_date}
                        onChange={(v) => setForm((f) => ({ ...f, end_date: v }))}
                        min={form.start_date || new Date().toISOString().slice(0, 16)}
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
                        min={new Date().toISOString().slice(0, 16)}
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
                        min={new Date().toISOString().slice(0, 16)}
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
              {bannerPreview ? (
                <div className="event-banner-preview">
                  <img src={bannerPreview} alt="Banner preview" className="event-banner-img" />
                  <div className="event-banner-actions">
                    <label className="btn btn-secondary btn-sm">
                      <Icon name="edit" size={14} /> Change
                      <input type="file" accept="image/*" onChange={handleBannerSelect} className="event-file-hidden" />
                    </label>
                    <button type="button" className="btn btn-danger btn-sm" onClick={removeBanner}>
                      <Icon name="trash" size={14} /> Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label className="event-upload-drop">
                  <div className="event-upload-icon">
                    <Icon name="download" size={22} />
                  </div>
                  <div className="event-upload-text">
                    <div className="event-upload-title">Click to upload event banner</div>
                    <div className="event-upload-sub">JPG, PNG or WebP · Max {MAX_BANNER_MB}MB · Recommended 1600 × 600</div>
                  </div>
                  <input type="file" accept="image/*" onChange={handleBannerSelect} className="event-file-hidden" />
                </label>
              )}
            </div>

            <div className="event-actions event-actions-bottom">
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/events')}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <Spinner size="sm" /> : 'Create Event'}
              </button>
            </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
