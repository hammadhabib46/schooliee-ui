import { useState } from 'react';
import Icon from './Icon.jsx';
import { useSchool } from '../lib/store.jsx';
import { cx, fmt } from '../lib/format.js';

// Round icon button with a hover tooltip — the reference's main action primitive.
export function Circle({ icon, label, onClick, size, tone, iconSize = 18, children, ...rest }) {
  // Without an action it's a decorative icon, not a button.
  if (!onClick && !label) {
    const { tabIndex, ...pass } = rest; // eslint-disable-line no-unused-vars
    return <span className={cx('circle', size, tone)} aria-hidden="true" {...pass}>{children || <Icon name={icon} size={iconSize} stroke={1.7} />}</span>;
  }
  return (
    <button type="button" className={cx('circle', size, tone)} aria-label={label} onClick={onClick} {...rest}>
      {children || <Icon name={icon} size={iconSize} stroke={1.7} />}
      {label && <span className="tip">{label}</span>}
    </button>
  );
}

export function Widget({ icon, title, count, action, children, className, style }) {
  return (
    <section className={cx('widget', className)} style={style}>
      {(icon || title) && (
        <div className="widget-head">
          {icon && <Circle icon={icon} size="sm" tone="ghost" iconSize={16} tabIndex={-1} />}
          <span className="w-title">{title}</span>
          {count != null && <span className="count">{count}</span>}
          {action}
        </div>
      )}
      <div className="widget-body">{children}</div>
    </section>
  );
}

export function OnOff({ value, onChange, labels = ['On', 'Off'] }) {
  return (
    <div className="onoff" role="radiogroup">
      <button className={cx(value && 'on')} role="radio" aria-checked={value} onClick={() => onChange(true)}>{labels[0]}</button>
      <button className={cx(!value && 'on')} role="radio" aria-checked={!value} onClick={() => onChange(false)}>{labels[1]}</button>
    </div>
  );
}

export function PillGroup({ items, value, onChange }) {
  return (
    <div className="pillgroup" role="tablist">
      {items.map((it) => {
        const k = it.key ?? it;
        const l = it.label ?? it;
        return (
          <button key={k} role="tab" aria-selected={value === k} className={cx(value === k && 'on')} onClick={() => onChange(k)}>
            {value === k && <span className="live" />}{l}
            {it.count != null && <span className="count" style={{ height: 20, minWidth: 20 }}>{it.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

// Lime stats strip: dark identity segment + lime numbers with proportional black/olive pill bars.
export function StatStrip({ id, stats, corner }) {
  const max = Math.max(1, ...stats.map((s) => s.bar ?? 0));
  return (
    <section className="stat-strip">
      {id && <div className="ss-id">{id}</div>}
      <div className="ss-main">
        <div className="ss-nums">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="ss-num">{s.value}{s.unit && <span style={{ fontSize: 13, opacity: .6 }}> {s.unit}</span>}</div>
              <div className="ss-lab">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="ss-bars">
          {stats.filter((s) => s.bar != null).map((s, i) => (
            <span key={s.label} title={s.label} style={{ flex: Math.max(0.6, (s.bar / max) * 4), background: i % 2 ? 'rgba(20,20,20,.22)' : '#141414' }} />
          ))}
        </div>
        {corner && <div className="ss-corner">{corner}</div>}
      </div>
    </section>
  );
}

// Inline payment widget (the reference's "Quick Trade"): no drawer for the common case.
export function QuickCollect({ familyId, students, monthLabel = 'Oct 2026', onMore }) {
  const { db, collectPayment, toast } = useSchool();
  const fam = db.families.find((f) => f.id === familyId);
  const items = students.flatMap((s) => s.dues.map((d) => ({ studentId: s.id, dueId: d.id, amount: d.amount, month: d.month })));
  const total = items.reduce((a, i) => a + i.amount, 0);
  const month = items.filter((i) => i.month === monthLabel).reduce((a, i) => a + i.amount, 0);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Cash');
  const [receipt, setReceipt] = useState(!!fam?.waVerified);
  const pay = (amt, onlyThisMonth) => {
    if (!amt) return;
    const no = `RCP-${Math.floor(10000 + Math.random() * 89999)}`;
    const target = onlyThisMonth ? items.filter((i) => i.month === monthLabel) : items;
    collectPayment({ familyId, items: target.map(({ studentId, dueId }) => ({ studentId, dueId })), amount: amt, method, receipt: no });
    toast(`Collected ${fmt(amt)} PKR · ${no}${receipt ? ' · receipt on WhatsApp' : ''}`);
    setAmount('');
  };
  const custom = Math.min(Number(amount) || 0, total || Number(amount) || 0);

  if (!total) {
    return (
      <div className="col gap-12">
        <div className="row gap-8 small"><span className="circle xs lime" style={{ width: 24, height: 24 }}><Icon name="check" size={13} stroke={2.6} /></span>Nothing due — all clear.</div>
        <button className="outline-act alt" onClick={onMore}><span>Take an advance payment</span><Icon name="arrowRight" size={15} /></button>
      </div>
    );
  }
  return (
    <div className="col gap-12">
      <div className="grid g2" style={{ gap: 8 }}>
        <label className="field"><span>Amount</span><input className="input" inputMode="numeric" placeholder={fmt(total)} value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))} style={{ borderRadius: 999 }} /></label>
        <label className="field"><span>Method</span>
          <select aria-label="Payment method" className="select" value={method} onChange={(e) => setMethod(e.target.value)} style={{ height: 46, borderRadius: 999 }}>{['Cash', 'Online transfer'].map((m) => <option key={m}>{m}</option>)}</select>
        </label>
      </div>
      <div className="row between"><span className="small muted">WhatsApp receipt</span><OnOff value={receipt} onChange={setReceipt} /></div>
      {amount ? (
        <button className="outline-act go" onClick={() => pay(custom)}><span>Collect</span><span className="strong">{fmt(custom)}</span></button>
      ) : (<>
        <button className="outline-act go" onClick={() => pay(total)}><span>Collect full due</span><span className="strong">{fmt(total)}</span></button>
        {month > 0 && month < total && <button className="outline-act alt" onClick={() => pay(month, true)}><span>This month only</span><span className="strong">{fmt(month)}</span></button>}
      </>)}
      <button className="link small muted" style={{ alignSelf: 'flex-start' }} onClick={onMore}>Choose items · partial · notes →</button>
    </div>
  );
}
