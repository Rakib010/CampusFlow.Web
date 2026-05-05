const LogoIcon = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

export default function AppLogo({ size = 'md', variant = 'full' }) {
  const config = {
    sm:  { iconBox: 32, iconSvg: 18, name: 14, sub: 9,  gap: 8 },
    md:  { iconBox: 36, iconSvg: 20, name: 16, sub: 10, gap: 10 },
    lg:  { iconBox: 46, iconSvg: 26, name: 22, sub: 11, gap: 12 },
  };
  const c = config[size] || config.md;

  const subText = size === 'lg' ? 'University Volunteer Management' : 'UVMS';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: c.gap, textDecoration: 'none' }}>
      {/* Icon box */}
      <div style={{
        width: c.iconBox,
        height: c.iconBox,
        borderRadius: 10,
        background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 60%, #0e7490 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: '0 0 16px rgba(6,182,212,0.45), 0 2px 8px rgba(0,0,0,0.3)',
      }}>
        <LogoIcon size={c.iconSvg} />
      </div>

      {variant !== 'icon-only' && (
        <div>
          <div style={{
            fontSize: c.name,
            fontWeight: 700,
            color: '#f1f5f9',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}>
            CampusFlow
          </div>
          <div style={{
            fontSize: c.sub,
            color: '#22d3ee',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginTop: 2,
            lineHeight: 1,
          }}>
            {subText}
          </div>
        </div>
      )}
    </div>
  );
}
