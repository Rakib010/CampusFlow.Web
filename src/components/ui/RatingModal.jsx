import { useState } from 'react';
import Icon from './Icon.jsx';
import useToastStore from '../../stores/useToastStore.js';

/**
 * Reusable star-rating + comment modal.
 *
 * Props:
 *   title, subtitle  — header text
 *   onClose          — called when the user dismisses
 *   onSubmit({ rating, comment })  — async; returns the API response or throws
 *   submitLabel      — button label (default "Submit Rating")
 */
export default function RatingModal({ title, subtitle, onClose, onSubmit, submitLabel = 'Submit Rating' }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      useToastStore.getState().error('Please select a star rating.');
      return;
    }
    setSaving(true);
    try {
      await onSubmit({ rating, comment: comment.trim() || undefined });
      useToastStore.getState().success('Rating submitted. Thank you!');
      onClose();
    } catch (err) {
      useToastStore.getState().error(err.response?.data?.message || 'Failed to submit rating.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => !saving && onClose()}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <div className="card-header">
          <div>
            <div className="card-title">{title}</div>
            {subtitle && <div className="card-subtitle">{subtitle}</div>}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} disabled={saving}>
            <Icon name="x" size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 8 }}>
          {/* Stars */}
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, fontWeight: 600 }}>
              Your rating
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[1, 2, 3, 4, 5].map((n) => {
                const filled = n <= (hover || rating);
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    onMouseEnter={() => setHover(n)}
                    onMouseLeave={() => setHover(0)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 4,
                      color: filled ? 'var(--amber-400)' : 'var(--border-default)',
                      transition: 'transform 0.1s, color 0.1s',
                      transform: hover === n ? 'scale(1.15)' : 'scale(1)',
                    }}
                  >
                    <Icon name={filled ? 'starFilled' : 'star'} size={36} strokeWidth={1.6} />
                  </button>
                );
              })}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, minHeight: 16 }}>
              {rating > 0 && ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'][rating]}
            </div>
          </div>

          {/* Comment */}
          <div className="input-wrap">
            <label className="input-label">Comment <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
            <textarea
              className="textarea-field"
              rows={3}
              placeholder="Share your experience…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={1000}
            />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textAlign: 'right' }}>
              {comment.length}/1000
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving || !rating}>
              {saving ? 'Submitting…' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
