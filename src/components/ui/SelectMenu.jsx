import { useEffect, useId, useRef, useState } from 'react';
import Icon from './Icon.jsx';

/**
 * Custom select/dropdown menu.
 * - No native <select> UI
 * - Click outside / ESC to close
 * - Optional clear button
 */
export default function SelectMenu({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  width = 160,
  allowClear = true,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const id = useId();

  const current = options.find((o) => o.value === value);
  const label = current?.label || placeholder;

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onEsc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  return (
    <div className="select-menu" style={{ width }} ref={ref}>
      <button
        type="button"
        className="select-menu__btn"
        aria-expanded={open}
        aria-controls={id}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="select-menu__label">{label}</span>
        <span className="select-menu__icons">
          {allowClear && !!value && (
            <button
              type="button"
              className="select-menu__clear"
              title="Clear"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
                setOpen(false);
              }}
            >
              <Icon name="x" size={14} />
            </button>
          )}
          <Icon name="chevronDown" size={16} />
        </span>
      </button>

      {open && (
        <div className="select-menu__menu" id={id} role="listbox">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`select-menu__item${opt.value === value ? ' is-active' : ''}`}
              onClick={() => { onChange(opt.value); setOpen(false); }}
            >
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

