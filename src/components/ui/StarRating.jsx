import Icon from './Icon.jsx';

/**
 * Display-only star rating (no interaction).
 * Shows 5 stars with the first N filled, plus optional numeric value and count.
 */
export default function StarRating({ value, count, size = 14, showValue = true }) {
  const v = Number(value) || 0;
  const rounded = Math.round(v);
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <div style={{ display: 'flex', gap: 2 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} style={{ color: n <= rounded ? 'var(--amber-400)' : 'var(--border-default)', display: 'inline-flex' }}>
            <Icon name={n <= rounded ? 'starFilled' : 'star'} size={size} strokeWidth={1.6} />
          </span>
        ))}
      </div>
      {showValue && v > 0 && (
        <span style={{ fontSize: size - 2, color: 'var(--amber-400)', fontWeight: 600 }}>{v.toFixed(1)}</span>
      )}
      {count != null && count > 0 && (
        <span style={{ fontSize: size - 3, color: 'var(--text-muted)' }}>({count})</span>
      )}
    </div>
  );
}
