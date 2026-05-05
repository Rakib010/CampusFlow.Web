export function Spinner({ size = 'md', color }) {
  return (
    <span
      className={`spinner spinner-${size}`}
      style={color ? { color, borderTopColor: color } : undefined}
    />
  );
}

export function PageSpinner() {
  return (
    <div className="spinner-page">
      <Spinner size="lg" />
    </div>
  );
}
