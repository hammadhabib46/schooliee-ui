import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import { Avatar, useOutside } from './ui.jsx';
import { cx, initials } from '../lib/format.js';

export function BackBar({ to, label, pager }) {
  return (
    <div className="row between wrap">
      <Link to={to} className="row gap-10 medium" style={{ height: 42, padding: '0 16px 0 6px', borderRadius: 999, background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <span style={{ width: 30, height: 30, borderRadius: 999, background: 'var(--surface-2)', display: 'grid', placeItems: 'center' }}><Icon name="arrowLeft" size={14} stroke={2} /></span>
        {label}
      </Link>
      {pager && (
        <div className="row gap-8 small muted">
          {pager.index + 1} of {pager.total}
          <Link to={pager.prev} className="icon-btn" aria-label="Previous"><Icon name="chevLeft" size={14} stroke={2} /></Link>
          <Link to={pager.next} className="icon-btn" aria-label="Next"><Icon name="chevRight" size={14} stroke={2} /></Link>
        </div>
      )}
    </div>
  );
}

export function ProfileHero({ name, id, chips, actions, avTone }) {
  return (
    <section className="row wrap" style={{ gap: '20px 24px', padding: '8px 4px' }}>
      <span className={cx('av', avTone)} style={{ width: 96, height: 96, fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 500, border: '3px solid var(--surface)' }}>
        {initials(name)}
      </span>
      <div style={{ flex: '1 1 320px', minWidth: 0 }}>
        <h1 className="h1" style={{ fontSize: 'clamp(40px, 6vw, 60px)', letterSpacing: '-0.03em' }}>{name}</h1>
        <div className="row wrap gap-6 mt-12">{chips}</div>
      </div>
      <div className="row wrap gap-8">{actions}</div>
    </section>
  );
}

export function Chip({ children, tone, to }) {
  const style = { display: 'inline-flex', alignItems: 'center', height: 30, padding: '0 12px', borderRadius: 999, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 13 };
  const toned = tone === 'ok' ? { background: 'var(--accent-soft)', color: 'var(--accent-text)', borderColor: 'transparent' } : tone === 'danger' ? { background: 'var(--danger-soft)', color: 'var(--danger)', borderColor: 'transparent' } : {};
  if (to) return <Link to={to} style={{ ...style, ...toned }}>{children}</Link>;
  return <span style={{ ...style, ...toned }}>{children}</span>;
}

export function MegaMenu({ label = 'More actions', groups }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOutside(ref, () => setOpen(false), open);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="btn" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen(!open)}>
        {label}<Icon name={open ? 'chevUp' : 'chevDown'} size={14} stroke={2} />
      </button>
      {open && (
        <div role="menu" className="menu" style={{ top: 54, right: 0, width: 600, maxWidth: '86vw', padding: 10, borderRadius: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(160px, 100%), 1fr))', gap: 6 }}>
          {groups.map((g) => (
            <div key={g.label} className="col" style={{ gap: 2, padding: 6 }}>
              <div className="menu-label" style={{ padding: '4px 8px 6px', fontWeight: 600, color: g.danger ? 'var(--danger)' : undefined }}>{g.label}</div>
              {g.items.map((it) => (
                <button key={it.label} role="menuitem" className={cx('menu-item', g.danger && 'danger')} style={{ height: 36, padding: '0 8px', borderRadius: 10 }} onClick={() => { setOpen(false); it.onClick?.(); }}>
                  {it.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function HeroFact({ label, chip, value, unit, sub }) {
  return (
    <section className="card-hero" style={{ borderRadius: 26, padding: '20px 22px' }}>
      <div className="row between">
        <span className="small muted">{label}</span>
        {chip && <span className="pill" style={{ background: 'var(--hero-chip)', color: 'inherit' }}>{chip}</span>}
      </div>
      <div className="display" style={{ fontSize: 36, marginTop: 16 }}>{value} <span className="muted" style={{ fontSize: 14 }}>{unit}</span></div>
      {sub && <div className="small muted mt-8">{sub}</div>}
    </section>
  );
}

export function Fact({ label, value, sub, onClick }) {
  const El = onClick ? 'button' : 'section';
  return (
    <El className="card" style={{ borderRadius: 26, padding: '20px 22px', textAlign: 'left', width: '100%', font: 'inherit' }} onClick={onClick}>
      <div className="small muted">{label}</div>
      <div className="display" style={{ fontSize: 28, marginTop: 16, lineHeight: 1.1 }}>{value}</div>
      {sub && <div className="small muted mt-8">{sub}</div>}
    </El>
  );
}

export function InfoCard({ title, actions, children }) {
  return (
    <section className="card" style={{ padding: '20px 22px' }}>
      <div className="row between wrap" style={{ marginBottom: 8, gap: 8 }}>
        <h2 className="h2 sm">{title}</h2>
        <div className="row wrap gap-6">{actions}</div>
      </div>
      {children}
    </section>
  );
}

export function PhoneLinks({ phone }) {
  if (!phone) return null;
  return (
    <span className="row gap-4">
      <a className="icon-btn xs" href={`tel:${phone}`} aria-label="Call"><Icon name="phone" size={12} /></a>
      <a className="icon-btn xs" href={`https://wa.me/${phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" aria-label="WhatsApp"><Icon name="engage" size={12} /></a>
    </span>
  );
}

export { Avatar };
