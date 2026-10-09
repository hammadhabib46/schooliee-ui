import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import Icon from './Icon.jsx';
import { avClass, cx, initials } from '../lib/format.js';

export function Avatar({ name, id, size, tone, className }) {
  return <span className={cx('av', size && `s${size}`, tone || avClass(id || name), className)}>{initials(name)}</span>;
}

export function Person({ name, sub, id, size = 40, onClick, to }) {
  const inner = (
    <>
      <Avatar name={name} id={id} size={size === 40 ? undefined : size} />
      <span className="grow" style={{ minWidth: 0 }}>
        <span className="nm">{name}</span>
        {sub && <span className="id">{sub}</span>}
      </span>
    </>
  );
  if (onClick) return <button type="button" className="person" onClick={onClick}>{inner}</button>;
  return <span className="person">{inner}</span>;
}

export function Tabs({ items, value, onChange, size }) {
  return (
    <div className={cx('tabs', size)} role="tablist">
      {items.map((t) => {
        const k = t.key ?? t.label;
        const on = value === k;
        return (
          <button key={k} role="tab" aria-selected={on} className={cx('tab', on && 'on', t.count != null && 'has-count')} onClick={() => onChange(k)}>
            {t.label}
            {t.count != null && <span className="count">{t.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function SubNav({ tabs, counts = {} }) {
  if (!tabs?.length) return null;
  return (
    <nav className="tabs subnav-tabs" aria-label="Section">
      {tabs.map((t) => (
        <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => cx('tab', isActive && 'on', counts[t.to] != null && 'has-count')}>
          {t.label}
          {counts[t.to] != null && <span className="count">{counts[t.to]}</span>}
        </NavLink>
      ))}
    </nav>
  );
}

export function Chips({ items, value, onChange }) {
  return (
    <div className="row wrap gap-8">
      {items.map((c) => (
        <button key={c.key} className={cx('chip', value === c.key && 'on', c.count != null && 'has-count')} aria-pressed={value === c.key} onClick={() => onChange(c.key)}>
          {c.label}
          {c.count != null && <span className="count">{c.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Seg({ items, value, onChange, ink, lg }) {
  return (
    <div className={cx('seg', ink && 'ink', lg && 'lg')}>
      {items.map((i) => {
        const k = typeof i === 'string' ? i : i.key;
        const l = typeof i === 'string' ? i : i.label;
        return <button key={k} className={cx(value === k && 'on')} onClick={() => onChange(k)} title={i.title} aria-label={i.title} aria-pressed={value === k}>{l}</button>;
      })}
    </div>
  );
}

export function Search({ value, onChange, placeholder, lg, autoFocus }) {
  return (
    <label className={cx('search', lg && 'lg')}>
      <Icon name="search" size={15} />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} autoFocus={autoFocus} />
      {value && <button className="icon-btn xs plain" onClick={() => onChange('')} aria-label="Clear search"><Icon name="close" size={12} /></button>}
    </label>
  );
}

export function Select({ value, onChange, options, label, className }) {
  return (
    <select className={cx('select', className)} value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
      {options.map((o) => {
        const v = typeof o === 'string' ? o : o.value;
        const l = typeof o === 'string' ? o : o.label;
        return <option key={v} value={v}>{l}</option>;
      })}
    </select>
  );
}

export function Field({ label, optional, hint, children, span }) {
  return (
    <label className={cx('field', span && 'span-2')}>
      <span>{label}{optional && <span className="opt"> · optional</span>}</span>
      {children}
      {hint && <span className="hint">{hint}</span>}
    </label>
  );
}

export function Switch({ on, onChange, label }) {
  return <button type="button" role="switch" aria-checked={on} aria-label={label} className={cx('switch', on && 'on')} onClick={() => onChange(!on)} />;
}

export function SwitchRow({ on, onChange, title, sub }) {
  return (
    <button type="button" className="switch-row" role="switch" aria-checked={on} onClick={() => onChange(!on)}>
      <span>
        <span className="medium" style={{ display: 'block' }}>{title}</span>
        {sub && <span className="small muted">{sub}</span>}
      </span>
      <span className={cx('switch', on && 'on')} />
    </button>
  );
}

export function Pill({ tone, children, lg, dot }) {
  return <span className={cx('pill', tone, lg && 'lg')}>{dot && <span className="dot" />}{children}</span>;
}

export function Empty({ icon = 'inbox', title, children, action }) {
  return (
    <div className="empty">
      <span className="ico"><Icon name={icon} size={22} /></span>
      {title && <div className="t">{title}</div>}
      {children && <div className="small" style={{ maxWidth: 360 }}>{children}</div>}
      {action}
    </div>
  );
}

export function useOutside(ref, onOut, active = true) {
  useEffect(() => {
    if (!active) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onOut(); };
    const k = (e) => { if (e.key === 'Escape') onOut(); };
    document.addEventListener('mousedown', h);
    document.addEventListener('keydown', k);
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('keydown', k); };
  }, [ref, onOut, active]);
}

// Dropdown menu anchored to a trigger. groups: [{ label?, items: [{ label, icon, onClick, danger, hint }] }]
export function Menu({ trigger, groups, align = 'right', width, up }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOutside(ref, () => setOpen(false), open);
  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div className="menu" role="menu" style={up ? { bottom: 0, left: 'calc(100% + 10px)', minWidth: width || 220 } : { top: 'calc(100% + 8px)', [align]: 0, minWidth: width || 220 }}>
          {groups.map((g, gi) => (
            <div key={gi}>
              {gi > 0 && <div className="menu-sep" />}
              {g.label && <div className="menu-label" style={g.danger ? { color: 'var(--danger)' } : undefined}>{g.label}</div>}
              {g.items.map((it) => (
                <button key={it.label} role="menuitem" className={cx('menu-item', it.danger && 'danger')} onClick={() => { setOpen(false); it.onClick?.(); }}>
                  {it.icon && <Icon name={it.icon} size={16} />}
                  {it.label}
                  {it.hint && <span className="hint">{it.hint}</span>}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Drawer({ open, onClose, title, sub, children, footer, wide }) {
  useEffect(() => {
    if (!open) return;
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className={cx('drawer', wide && 'wide')} role="dialog" aria-label={typeof title === 'string' ? title : undefined}>
        <div className="drawer-head">
          <div style={{ minWidth: 0 }}>
            {sub && <div className="small muted">{sub}</div>}
            <div className="h2" style={{ fontSize: 24, fontWeight: 400 }}>{title}</div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="close" size={14} stroke={2} /></button>
        </div>
        <div className="drawer-body">{children}</div>
        {footer && <div className="drawer-foot">{footer}</div>}
      </aside>
    </>
  );
}

export function Modal({ open, onClose, title, sub, children, footer, wide }) {
  useEffect(() => {
    if (!open) return;
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="modal-wrap">
        <div className={cx('modal', wide && 'wide')} role="dialog">
          <div className="drawer-head">
            <div>
              {sub && <div className="small muted">{sub}</div>}
              <div className="h2" style={{ fontSize: 24, fontWeight: 400 }}>{title}</div>
            </div>
            <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="close" size={14} stroke={2} /></button>
          </div>
          <div className="modal-body">{children}</div>
          {footer && <div className="drawer-foot" style={{ justifyContent: 'flex-end' }}>{footer}</div>}
        </div>
      </div>
    </>
  );
}

export function Ring({ value, size = 34, stroke = 4, track = 'var(--track)', color = 'var(--accent-text)', children }) {
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  return (
    <span style={{ position: 'relative', width: size, height: size, display: 'inline-grid', placeItems: 'center', flex: 'none' }}>
      <svg width={size} height={size} className="progress-ring" style={{ position: 'absolute', inset: 0 }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${(Math.min(100, value) / 100) * C} ${C}`} style={{ transition: 'stroke-dasharray .4s' }} />
      </svg>
      {children}
    </span>
  );
}

export function Stat({ label, value, sub, tone }) {
  return (
    <div className="tile">
      <div className="k">{label}</div>
      <div className="v" style={tone ? { color: `var(--${tone})` } : undefined}>{value}</div>
      {sub && <div className="xs muted mt-4">{sub}</div>}
    </div>
  );
}

export function DL({ rows }) {
  return (
    <dl className="dl">
      {rows.map(([k, v, extra]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{v === '' || v == null || v === '-' ? <button className="add">+ Add</button> : v}{extra}</dd>
        </div>
      ))}
    </dl>
  );
}

// Sortable table header + sorting hook, shared by every list.
// const { sorted, th } = useSort(rows, { name: (r) => r.name, due: (r) => -r.due }, 'name');
export function useSort(rows, keys, initial) {
  const [sort, setSort] = useState({ k: initial, dir: 1 });
  const get = keys[sort.k];
  const sorted = get ? [...rows].sort((a, b) => { const x = get(a), y = get(b); return (x > y ? 1 : x < y ? -1 : 0) * sort.dir; }) : rows;
  const th = (k, label, className) => (
    <th className={className} aria-sort={sort.k === k ? (sort.dir > 0 ? 'ascending' : 'descending') : undefined}>
      <button type="button" className={cx('th-sort', sort.k === k && 'on')} onClick={() => setSort((s) => (s.k === k ? { k, dir: -s.dir } : { k, dir: 1 }))}>
        {label}{sort.k === k && <Icon name={sort.dir > 0 ? 'arrowUp' : 'arrowDown'} size={11} />}
      </button>
    </th>
  );
  return { sorted, th };
}

export function ListCount({ shown, total, what = 'items' }) {
  return <div className="list-count">{shown === total ? `${total} ${what}` : `Showing ${shown} of ${total} ${what}`}</div>;
}
