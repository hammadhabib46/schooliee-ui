import { useMemo, useState } from 'react';
import Icon from '../../components/Icon.jsx';
import { PageHead } from '../../components/Shell.jsx';
import { Chips, Empty, Field, Modal, Search, useSort } from '../../components/ui.jsx';
import { Circle } from '../../components/Bento.jsx';
import { useSchool } from '../../lib/store.jsx';
import { compact, dateShort, fmt, time } from '../../lib/format.js';
import { FinanceTabs } from './Fees.jsx';
import { exportCsv } from '../../lib/exporter.js';

export default function Transactions() {
  const { db, open, toast, flagLedger } = useSchool();
  const [problem, setProblem] = useState(null);
  const [problemWhy, setProblemWhy] = useState('');
  const [view, setView] = useState('all');
  const [cat, setCat] = useState('all');
  const [q, setQ] = useState('');
  const [user, setUser] = useState('all');
  const [method, setMethod] = useState('all');
  const valid = db.ledger.filter((l) => !l.flagged);
  const income = valid.filter((l) => l.type === 'in').reduce((a, l) => a + l.amount, 0);
  const expense = valid.filter((l) => l.type === 'out').reduce((a, l) => a + l.amount, 0);
  const cats = [...new Set(db.ledger.map((l) => l.category))];
  const rows = db.ledger
    .filter((l) => (view === 'flagged' ? l.flagged : !l.flagged && (view === 'system' ? l.by === 'System' : view === 'all' || l.type === view)))
    .filter((l) => user === 'all' || l.by === user)
    .filter((l) => method === 'all' || l.method === method)
    .filter((l) => cat === 'all' || l.category === cat)
    .filter((l) => { const t = q.toLowerCase(); return !t || `${l.reason} ${l.ref} ${l.category} ${l.by} ${l.note || ""} ${l.method} ${l.amount} ${fmt(l.amount)}`.toLowerCase().includes(t); });

  const byDay = useMemo(() => {
    const m = {};
    db.ledger.forEach((l) => { const d = l.date.slice(8, 10); m[d] = m[d] || { in: 0, out: 0 }; m[d][l.type] += l.amount; });
    return Array.from({ length: 9 }, (_, i) => { const d = String(i + 1).padStart(2, '0'); return { d, ...(m[d] || { in: 0, out: 0 }) }; });
  }, [db.ledger]);
  const max = Math.max(...byDay.map((x) => Math.max(x.in, x.out)), 1);
  const { sorted, th } = useSort(rows, { date: (l) => `~${9999999999999 - new Date(l.date).getTime()}`, cat: (l) => l.category, amt: (l) => -(l.type === 'in' ? l.amount : -l.amount) }, 'date');
  const total = rows.filter((l) => !l.flagged).reduce((a, l) => a + (l.type === 'in' ? l.amount : -l.amount), 0);

  return (
    <div className="page">
      <FinanceTabs />
      <PageHead title="Transactions" sub="Every rupee in and out — fees, salaries and expenses in one cash book"
        actions={<>
          <div className="toolrow"><Circle icon="download" label="Export cash book" onClick={() => (exportCsv('Cash book exported'), toast('Cash book exported', { icon: 'download' }))} /></div>
          <button className="btn" onClick={() => open('record', { type: 'in' })}><Icon name="arrowDown" size={16} />Record income</button>
          <button className="btn primary" onClick={() => open('record', { type: 'out' })}><Icon name="arrowUp" size={16} />Record expense</button>
        </>} />

      <div className="row wrap gap-16" style={{ alignItems: 'stretch' }}>
        <section className="card-hero" style={{ flex: '1 1 300px' }}>
          <div className="small muted">Net cash flow · 01 – 09 Oct</div>
          <div className="display" style={{ fontSize: 52, marginTop: 8 }}>{fmt(income - expense)}<span style={{ fontSize: 18, opacity: .6 }}> PKR</span></div>
          <div className="row gap-16 mt-16" style={{ paddingTop: 14, borderTop: '1px solid var(--hero-track)' }}>
            <div><div className="small muted">Money in</div><div className="strong mt-4">+{fmt(income)}</div></div>
            <div><div className="small muted">Money out</div><div className="strong mt-4">−{fmt(expense)}</div></div>
          </div>
        </section>
        <section className="card" style={{ flex: '2 1 480px' }}>
          <div className="row between"><h2 className="h2 sm">Daily cash flow</h2><span className="row gap-12"><span className="legend"><i style={{ background: 'var(--accent)' }} />In</span><span className="legend"><i className="hatch-ink" />Out</span></span></div>
          <div className="bars mt-16" style={{ height: 150 }}>
            {byDay.map((x) => (
              <div key={x.d} className="bar-col">
                <div className="row grow" style={{ width: '100%', gap: 3, alignItems: 'flex-end' }}>
                  <span title={`In ${fmt(x.in)}`} style={{ flex: 1, height: `${Math.max(3, (x.in / max) * 100)}%`, borderRadius: 8, background: 'var(--accent)' }} />
                  <span title={`Out ${fmt(x.out)}`} className={x.out ? 'hatch-ink' : ''} style={{ flex: 1, height: `${Math.max(3, (x.out / max) * 100)}%`, borderRadius: 8, background: x.out ? undefined : 'var(--track)' }} />
                </div>
                <span className="xs muted">{x.d}</span>
              </div>
            ))}
          </div>
          <div className="xs faint mt-8">Peak {compact(max)} PKR</div>
        </section>
      </div>

      <section className="card pad-s" style={{ borderRadius: 28 }}>
        <div className="toolbar">
          <Chips value={view} onChange={setView} items={[{ key: 'all', label: 'All', count: db.ledger.length }, { key: 'in', label: 'Money in', count: db.ledger.filter((l) => l.type === 'in').length }, { key: 'out', label: 'Money out', count: db.ledger.filter((l) => l.type === 'out').length }, { key: 'system', label: 'System', count: db.ledger.filter((l) => l.by === 'System').length }, { key: 'flagged', label: 'Flagged', count: db.ledger.filter((l) => l.flagged).length }]} />
          <div className="grow" />
          <select className="select" value={user} onChange={(e) => setUser(e.target.value)} aria-label="User"><option value="all">User: All</option>{[...new Set(db.ledger.map((l) => l.by))].map((u) => <option key={u}>{u}</option>)}</select>
          <select className="select" value={method} onChange={(e) => setMethod(e.target.value)} aria-label="Payment"><option value="all">Payment: All</option>{[...new Set(db.ledger.map((l) => l.method))].map((m) => <option key={m}>{m}</option>)}</select>
          <select aria-label="Category" className="select" value={cat} onChange={(e) => setCat(e.target.value)}><option value="all">Category: All</option>{cats.map((c) => <option key={c}>{c}</option>)}</select>
          <Search value={q} onChange={setQ} placeholder="Reason, category, user, note, amount…" />
        </div>
        {rows.length ? (
          <div className="table-wrap"><table className="table resp" style={{ minWidth: 860 }}>
            <thead><tr>{th('date', 'Date', 'hide-sm')}<th>Description</th>{th('cat', 'Category', 'hide-sm')}<th className="hide-sm">Method</th><th className="hide-sm">By</th>{th('amt', 'Amount', 'num')}<th className="hide-sm" /></tr></thead>
            <tbody>{sorted.map((l) => (
              <tr key={l.id} style={l.flagged ? { opacity: 0.5, textDecoration: 'line-through' } : undefined}>
                <td className="nowrap hide-sm">{dateShort(l.date)}<div className="xs muted">{time(l.date)}</div></td>
                <td><span className="medium">{l.reason}</span><div className="xs muted">{l.ref}<span className="show-sm"> · {dateShort(l.date)}</span></div></td>
                <td className="hide-sm"><span className="tag">{l.category}</span></td>
                <td className="hide-sm">{l.method}</td>
                <td className="small hide-sm">{l.by}</td>
                <td className="num"><span className={`pill ${l.type === 'in' ? 'ok' : 'danger'}`}>{l.type === 'in' ? '+' : '−'}{fmt(l.amount)}</span></td>
                <td className="right hide-sm" style={{ textDecoration: 'none' }}><span className="row gap-6" style={{ justifyContent: 'flex-end' }}>{l.doc ? <button className="btn xs" onClick={() => toast(`${l.doc} opened`, { icon: 'doc' })}>{l.doc}</button> : <span className="xs faint">No receipt</span>}<Circle icon={l.flagged ? 'refresh' : 'warn'} size="xs" iconSize={12} tone={l.flagged ? undefined : 'ghost'} label={l.flagged ? 'Restore record' : 'Mark as problematic'} onClick={() => (l.flagged ? (flagLedger(l.id, false), toast('Record restored')) : setProblem(l))} /></span></td>
              </tr>
            ))}</tbody>
          </table></div>
        ) : <Empty icon="wallet" title="No transactions match" />}
        <div className="row between" style={{ padding: '14px 18px', borderTop: '1px solid var(--line)' }}><span className="muted">{rows.length === db.ledger.length ? `${rows.length} transactions` : `Showing ${rows.length} of ${db.ledger.length} transactions`}</span><span className="strong">Net {total < 0 ? '−' : ''}{fmt(Math.abs(total))} PKR</span></div>
      </section>
      {problem && (
        <Modal open onClose={() => setProblem(null)} title="Mark as problematic?" sub={`${problem.category} · ${fmt(problem.amount)} PKR · ${problem.reason}`}
          footer={<><button className="btn ghost" onClick={() => setProblem(null)}>Cancel</button><button className="btn" style={{ background: 'var(--danger)', color: '#fff', borderColor: 'transparent' }} onClick={() => { flagLedger(problem.id, true, problemWhy); toast('Marked as problematic — hidden and left out of all totals'); setProblem(null); setProblemWhy(''); }}>Mark as problematic</button></>}>
          <div className="small">This hides the record from every list and total, and reverses any credit it used. You can restore it from the Flagged view.</div>
          <Field label="Problem reason" optional><input className="input" autoFocus value={problemWhy} onChange={(e) => setProblemWhy(e.target.value)} placeholder="e.g. Entered twice" /></Field>
        </Modal>
      )}
    </div>
  );
}
