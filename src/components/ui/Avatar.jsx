export default function Avatar({ src, name, size = 'md' }) {
  const initials = (name || '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className={`avatar avatar-${size}`}>
      {src ? <img src={src} alt={name || 'avatar'} /> : initials}
    </div>
  );
}
