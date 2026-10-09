import Icon from './Icon.jsx';
import { Avatar } from './ui.jsx';

export const ATT_OPTS = [
  ['P', 'Present', 'var(--accent-soft)', 'var(--accent-text)'],
  ['L', 'Late', 'var(--warn-soft)', 'var(--warn)'],
  ['A', 'Absent', 'var(--danger-soft)', 'var(--danger)'],
  ['V', 'Leave', 'var(--info-soft)', 'var(--info)'],
];

export default function MarkRow({ id, name, sub, idLabel, value, onChange, readOnly, extra, note }) {
  const onKey = (e) => {
    const k = e.key.toUpperCase();
    const map = { P: 'P', L: 'L', A: 'A', V: 'V' };
    if (map[k] && !readOnly) { e.preventDefault(); onChange(value === map[k] ? null : map[k]); }
  };
  return (
    <div tabIndex={0} onKeyDown={onKey} className={`mark-row ${value ? `is-${value}` : ''}`}>
      <Avatar name={name} id={id} size={36} />
      <div className="mark-who">
        <div className="medium mark-name">{name} <span className="muted small mark-id" style={{ fontWeight: 400 }}>· {idLabel}</span></div>
        <div className="xs muted ellipsis">{sub}</div>
        {note && <div className="xs ellipsis" style={{ color: 'var(--accent-text)', marginTop: 2 }}>{note}</div>}
      </div>
      <div role="radiogroup" aria-label={`Attendance for ${name}`} className="mark-seg">
        {ATT_OPTS.map(([k, label, bg, fg]) => {
          const on = value === k;
          return (
            <button key={k} role="radio" aria-checked={on} aria-label={label} title={label} disabled={readOnly && !on} onClick={() => onChange(on ? null : k)}
              style={on ? { background: bg, color: fg, fontWeight: 600 } : undefined}>
              <span className="mark-full">{label}</span><span className="mark-short">{k === 'V' ? 'Lv' : k}</span>
            </button>
          );
        })}
      </div>
      {extra ?? <button className="icon-btn sm" aria-label={`More for ${name}`}><Icon name="more" size={16} stroke={2.4} /></button>}
    </div>
  );
}
