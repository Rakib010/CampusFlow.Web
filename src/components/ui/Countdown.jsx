import { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';

/**
 * Live countdown rendered as a "scoreboard" of D · H · M · S, ticking every second.
 *
 * Variants:
 *   "starts"   — counts down to event start (cyan)
 *   "ends"     — counts down to event end (amber, urgency)
 *   "deadline" — counts down to a deadline (red, strong urgency)
 */

const VARIANTS = {
  starts: {
    bg: 'linear-gradient(135deg, rgba(139,92,246,0.10), rgba(139,92,246,0.04))',
    border: 'rgba(139,92,246,0.30)',
    fg: 'rgba(139,92,246,1)',
    fgDim: 'rgba(139,92,246,0.60)',
    glow: '0 0 20px rgba(139,92,246,0.18)',
    icon: 'clock',
  },
  ends: {
    bg: 'linear-gradient(135deg, rgba(245,158,11,0.10), rgba(245,158,11,0.04))',
    border: 'rgba(245,158,11,0.45)',
    fg: 'var(--amber-400)',
    fgDim: 'rgba(245,158,11,0.65)',
    glow: '0 0 20px rgba(245,158,11,0.25)',
    icon: 'clock',
  },
  deadline: {
    bg: 'linear-gradient(135deg, rgba(239,68,68,0.10), rgba(239,68,68,0.04))',
    border: 'rgba(239,68,68,0.45)',
    fg: 'var(--red-400)',
    fgDim: 'rgba(239,68,68,0.65)',
    glow: '0 0 20px rgba(239,68,68,0.25)',
    icon: 'warning',
  },
};

const pad2 = (n) => String(Math.max(0, n)).padStart(2, '0');

function compute(target) {
  if (!target) return null;
  const t = new Date(target).getTime();
  if (isNaN(t)) return null;
  const ms = Math.max(0, t - Date.now());
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return { ms, days, hours, minutes, seconds, expired: ms <= 0 };
}

export default function Countdown({
  target,
  variant = 'starts',
  label,
  expiredLabel,
  size = 'md', // 'sm' | 'md' | 'lg'
}) {
  const [now, setNow] = useState(() => compute(target));
  const tickRef = useRef(null);

  useEffect(() => {
    if (!target) return;
    setNow(compute(target));
    // Always tick every second — battery cost is negligible compared to user
    // expectation that this is a real, live counter.
    tickRef.current = setInterval(() => {
      const next = compute(target);
      setNow(next);
      if (next?.expired) clearInterval(tickRef.current);
    }, 1000);
    return () => clearInterval(tickRef.current);
  }, [target]);

  if (!target || !now) return null;

  const v = VARIANTS[variant] || VARIANTS.starts;

  if (now.expired) {
    return expiredLabel ? (
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '8px 14px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        fontSize: 13, color: 'var(--text-muted)',
      }}>
        <Icon name={v.icon} size={14} />
        {expiredLabel}
      </div>
    ) : null;
  }

  const sizes = {
    sm: { num: 18, unit: 9,  pad: '8px 12px', gap: 6,  sep: 14 },
    md: { num: 26, unit: 10, pad: '10px 16px', gap: 10, sep: 20 },
    lg: { num: 36, unit: 11, pad: '14px 22px', gap: 14, sep: 24 },
  };
  const s = sizes[size] || sizes.md;

  // Hide leading days when zero (cleaner display for short countdowns)
  const showDays = now.days > 0;
  const cells = [];
  if (showDays) cells.push({ value: pad2(now.days), unit: now.days === 1 ? 'DAY' : 'DAYS' });
  cells.push({ value: pad2(now.hours),   unit: 'HRS' });
  cells.push({ value: pad2(now.minutes), unit: 'MIN' });
  cells.push({ value: pad2(now.seconds), unit: 'SEC', live: true });

  return (
    <div style={{
      display: 'inline-flex',
      flexDirection: 'column',
      gap: 6,
      padding: s.pad,
      background: v.bg,
      border: `1px solid ${v.border}`,
      borderRadius: 'var(--radius-md)',
      boxShadow: v.glow,
    }}>
      {label && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 10,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          fontWeight: 600,
        }}>
          <Icon name={v.icon} size={12} color={v.fg} />
          {label}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 0 }}>
        {cells.map((c, i) => (
          <div key={c.unit} style={{ display: 'flex', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: s.num + 8 }}>
              <div
                key={c.live ? c.value : undefined /* re-mount on each tick to retrigger animation */}
                style={{
                  fontSize: s.num,
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  color: v.fg,
                  letterSpacing: '0.02em',
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                  animation: c.live ? 'cf-tick 1s linear' : undefined,
                }}
              >
                {c.value}
              </div>
              <div style={{
                fontSize: s.unit,
                color: v.fgDim,
                letterSpacing: '0.1em',
                marginTop: 4,
                fontWeight: 600,
              }}>
                {c.unit}
              </div>
            </div>
            {i < cells.length - 1 && (
              <div style={{
                fontSize: s.num * 0.7,
                color: v.fgDim,
                fontWeight: 700,
                margin: `0 ${s.sep / 2}px`,
                opacity: 0.5,
                lineHeight: 1,
                paddingBottom: s.unit + 8,
                animation: 'cf-blink 1s linear infinite',
              }}>
                :
              </div>
            )}
          </div>
        ))}
      </div>
      {/* Inline keyframes (kept here so the component is self-contained) */}
      <style>{`
        @keyframes cf-tick {
          0%   { transform: translateY(-2px); opacity: 0.5; }
          15%  { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes cf-blink {
          0%, 49%   { opacity: 0.5; }
          50%, 100% { opacity: 0.15; }
        }
      `}</style>
    </div>
  );
}
