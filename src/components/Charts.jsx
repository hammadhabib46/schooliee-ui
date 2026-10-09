// Small SVG charts in the app's colour language: collected = lime, billed = ink,
// outstanding = danger tint. No chart library; everything scales to its box.
import { fmt } from '../lib/format.js';

const short = (n) => (n >= 100000 ? `${(n / 100000).toFixed(n >= 1000000 ? 0 : 1)}L` : n >= 1000 ? `${Math.round(n / 1000)}k` : String(Math.round(n)));

// Paired columns per period: e.g. billed vs collected by month.
export function PairBars({ data, keys, height = 220 }) {
  const max = Math.max(1, ...data.flatMap((d) => keys.map((k) => d[k.key] || 0)));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(max * t));
  return (
    <div className="chart">
      <div className="chart-legend">{keys.map((k) => <span key={k.key}><i style={{ background: k.color }} />{k.label}</span>)}</div>
      <div className="chart-area" style={{ height }}>
        <div className="chart-grid">{ticks.slice().reverse().map((t) => <div key={t}><span>{short(t)}</span></div>)}</div>
        <div className="chart-cols">
          {data.map((d) => (
            <div key={d.label} className="chart-col">
              <div className="chart-bars">
                {keys.map((k) => <span key={k.key} title={`${d.label} · ${k.label}: ${fmt(d[k.key] || 0)} PKR`} style={{ height: `${((d[k.key] || 0) / max) * 100}%`, background: k.color }} />)}
              </div>
              <span className="chart-x">{d.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Horizontal bars with a value and an optional rate pill.
export function HBars({ rows, max, color = 'var(--accent)', unit = '' }) {
  const m = max || Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="hbars">
      {rows.map((r) => (
        <div key={r.label} className="hbar">
          <span className="hbar-label">{r.label}</span>
          <span className="hbar-track"><span style={{ width: `${Math.max(1.5, (r.value / m) * 100)}%`, background: r.color || color }} /></span>
          <span className="hbar-val">{r.display ?? `${fmt(r.value)}${unit}`}</span>
        </div>
      ))}
    </div>
  );
}

// Donut with a centre figure.
export function Donut({ parts, size = 170, center, sub }) {
  const total = parts.reduce((a, p) => a + p.value, 0) || 1;
  const r = 15.9155; let acc = 0;
  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 42 42" width={size} height={size} role="img" aria-label={parts.map((p) => `${p.label} ${Math.round((p.value / total) * 100)}%`).join(', ')}>
        <circle cx="21" cy="21" r={r} fill="none" stroke="var(--track)" strokeWidth="5" />
        {parts.map((p) => { const len = (p.value / total) * 100; const el = <circle key={p.label} cx="21" cy="21" r={r} fill="none" stroke={p.color} strokeWidth="5" strokeDasharray={`${len} ${100 - len}`} strokeDashoffset={25 - acc} />; acc += len; return el; })}
        <text x="21" y="21" textAnchor="middle" className="donut-c">{center}</text>
        {sub && <text x="21" y="26" textAnchor="middle" className="donut-s">{sub}</text>}
      </svg>
      <div className="col gap-6">
        {parts.map((p) => <div key={p.label} className="row gap-8 small"><i className="dot-sq" style={{ background: p.color }} /><span className="grow">{p.label}</span><span className="strong">{fmt(p.value)}</span><span className="xs muted">{Math.round((p.value / total) * 100)}%</span></div>)}
      </div>
    </div>
  );
}

// Thin daily columns (e.g. collection per day this month).
export function DayColumns({ data, height = 120, color = 'var(--accent)' }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="daycols" style={{ height }}>
      {data.map((d) => (
        <div key={d.label} className="daycol" title={`${d.label}: ${fmt(d.value)} PKR`}>
          <span style={{ height: `${d.value ? Math.max(3, (d.value / max) * 100) : 0}%`, background: d.value ? color : 'transparent' }} />
          <i>{d.label}</i>
        </div>
      ))}
    </div>
  );
}
