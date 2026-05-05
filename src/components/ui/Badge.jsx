const colorMap = {
  SUPER_ADMIN: 'cyan',
  ADMIN: 'purple',
  ORGANIZER: 'amber',
  VOLUNTEER: 'green',
  ATTENDEE: 'slate',
  published: 'green',
  ongoing: 'cyan',
  completed: 'slate',
  draft: 'amber',
  cancelled: 'red',
  active: 'green',
  inactive: 'red',
  approved: 'green',
  pending: 'amber',
  rejected: 'red',
  confirmed: 'green',
  cash: 'amber',
  online: 'cyan',
};

export default function Badge({ label, color, dot }) {
  const c = color || colorMap[label] || 'slate';
  return (
    <span className={`badge badge-${c}`}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />}
      {label}
    </span>
  );
}
