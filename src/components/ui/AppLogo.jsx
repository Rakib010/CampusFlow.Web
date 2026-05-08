const LogoIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

export default function AppLogo({ size = 'md', variant = 'full' }) {
  const subText = size === 'lg' ? 'University Volunteer Management' : 'UVMS';
  const sz = size === 'sm' || size === 'lg' ? size : 'md';

  return (
    <div className={`app-logo app-logo--${sz}`}>
      {/* Icon box */}
      <div className="app-logo__icon-box">
        <LogoIcon className={`app-logo__icon-svg--${sz}`} />
      </div>

      {variant !== 'icon-only' && (
        <div className="app-logo__text">
          <div className="app-logo__name">CampusFlow</div>
          <div className="app-logo__sub">{subText}</div>
        </div>
      )}
    </div>
  );
}
