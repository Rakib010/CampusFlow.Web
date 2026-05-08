import DatePicker from 'react-datepicker';

function toLocalInputValue(date) {
  if (!date) return '';
  const d = new Date(date);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function fromLocalInputValue(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export default function DateTimePicker({ value, onChange, min, max, placeholder = 'Select date & time…' }) {
  return (
    <DatePicker
      selected={fromLocalInputValue(value)}
      onChange={(d) => onChange(toLocalInputValue(d))}
      showTimeSelect
      timeIntervals={15}
      dateFormat="dd/MM/yyyy, h:mm aa"
      placeholderText={placeholder}
      minDate={min ? fromLocalInputValue(min) : undefined}
      maxDate={max ? fromLocalInputValue(max) : undefined}
      className="input-field dtp-input"
      popperPlacement="bottom-start"
    />
  );
}

