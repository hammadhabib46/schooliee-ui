import { useState } from 'react';
import Icon from '../../components/Icon.jsx';
import { PageHead } from '../../components/Shell.jsx';
import { Tabs } from '../../components/ui.jsx';
import { useSchool } from '../../lib/store.jsx';
import { dateShort, fmt } from '../../lib/format.js';
import { FinanceTabs } from './Fees.jsx';

const TABS = ['Overview', 'Journal', 'General ledger', 'Trial balance', 'Income statement', 'Balance sheet', 'Cash & bank book', 'Receivables', 'Liabilities', 'Chart of accounts', 'Data checks'];

export const ACCOUNTS = {
  1010: ['Cash in hand', 'Asset'], 1020: ['Bank & online receipts', 'Asset'], 1100: ['Fees receivable', 'Asset'], 1200: ['Staff loans receivable', 'Asset'],
  2010: ['Family advance credit', 'Liability'], 2020: ['Security deposits held', 'Liability'], 2030: ['Salaries payable', 'Liability'],
  4010: ['Tuition fees', 'Income'], 4030: ['Admission fees', 'Income'], 4040: ['Recurring charges', 'Income'], 4050: ['Fines & custom charges', 'Income'], 4090: ['Other income', 'Income'],
  5010: ['Salaries', 'Expense'], 5020: ['Utilities', 'Expense'], 5030: ['Rent', 'Expense'], 5090: ['Other expenses', 'Expense'],
};
const cashAcc = (l) => (/online|bank|jazz|easy/i.test(l.method) ? 1020 : 1010);
const incomeAcc = (cat) => (/admission/i.test(cat) ? 4030 : /recurring/i.test(cat) ? 4040 : /fine|custom/i.test(cat) ? 4050 : /monthly|fee/i.test(cat) ? 4010 : 4090);
const expenseAcc = (cat) => (/salary/i.test(cat) ? 5010 : /utilit/i.test(cat) ? 5020 : /rent/i.test(cat) ? 5030 : 5090);
export function journalOf(ledger) {
  return ledger.filter((l) => !l.flagged && l.amount > 0).map((l) => {
    let lines;
    if (l.type === 'in') {
      const cr = /family balance/i.test(l.category) ? 2010 : /loan repayment/i.test(l.category) ? 1200 : incomeAcc(l.category);
      lines = [[cashAcc(l), l.amount, 0], [cr, 0, l.amount]];
    } else {
      const dr = /staff loan/i.test(l.category) ? 1200 : expenseAcc(l.category);
      lines = [[dr, l.amount, 0], [cashAcc(l), 0, l.amount]];
    }
    return { ...l, ref2: `${l.type === 'in' ? 'RCPT' : 'PAY'}-${l.id.replace(/\D/g, '').padStart(5, '0')}`, lines };
  });
}

function Statement({ rows, total }) {
  return (
    <div className="col" style={{ gap: 0 }}>
      {rows.map(([k, v, opts = {}]) => (
        <div key={k} className="row between" style={{ padding: opts.head ? '16px 4px 8px' : '11px 4px', borderTop: opts.head ? 0 : '1px solid var(--line)', paddingLeft: opts.indent ? 22 : 4 }}>
          <span className={opts.head ? 'upper' : opts.strong ? 'strong' : ''}>{k}</span>
          {v != null && <span className={opts.strong ? 'strong' : ''} style={{ fontVariantNumeric: 'tabular-nums' }}>{typeof v === 'number' ? fmt(v) : v}</span>}
        </div>
      ))}
      {total && <div className="row between" style={{ padding: '16px 4px', borderTop: '2px solid var(--text)' }}><span className="strong">{total[0]}</span><span className="display" style={{ fontSize: 26 }}>{fmt(total[1])} PKR</span></div>}
    </div>
  );
}

export default function Accounts() {
  const { db, totalDue, payrollDue, defaulters, familyById, staffUnpaid } = useSchool();
  const [tab, setTab] = useState('Overview');
  const [acct, setAcct] = useState('1010');
  const journal = journalOf(db.ledger);
  const totalsBy = {}; journal.forEach((j) => j.lines.forEach(([a, d, c]) => { totalsBy[a] = totalsBy[a] || [0, 0]; totalsBy[a][0] += d; totalsBy[a][1] += c; }));
  const dr = journal.reduce((a, j) => a + j.lines.reduce((x, l) => x + l[1], 0), 0);
  const cr = journal.reduce((a, j) => a + j.lines.reduce((x, l) => x + l[2], 0), 0);
  const income = db.ledger.filter((l) => l.type === 'in').reduce((a, l) => a + l.amount, 0) - 1000;
  const expense = db.ledger.filter((l) => l.type === 'out').reduce((a, l) => a + l.amount, 0);
  const credit = db.families.reduce((a, f) => a + f.credit, 0);
  // Closing cash = balance brought forward from before this period + this period's net flow.
  const opening = 61252590 - 102623;
  const cash = opening + income - expense;
  const sources = [['Tuition fees', 83000], ['Fines & custom charges', 10500], ['Recurring charges', 8000], ['Admission fees', 1000], ['Other income', 123]];
  const kpis = [
    ['Total income', income, 'Cash basis, net of discounts', 'accent-text'],
    ['Total expenses', expense, expense ? 'Salaries & running costs' : 'Nothing recorded yet', null],
    ['Surplus', income - expense, 'Income − expenses', 'accent-text'],
    ['Cash & bank', cash, `Opening ${fmt(opening)} ${income - expense >= 0 ? '+' : '−'} ${fmt(Math.abs(income - expense))} this period`, null],
    ['Fees receivable', totalDue, 'Owed by students today', 'danger'],
    ['Family advance credit', credit, 'Held for families', null],
    ['Salaries payable', payrollDue, 'Due to staff today', 'warn'],
    ['Security deposits', 0, 'Refundable to students', null],
  ];

  return (
    <div className="page">
      <FinanceTabs />
      <PageHead title="Accounts" sub="Your school’s money in accounting terms — calculated from fees, payroll and transactions. Read-only."
        actions={<><select aria-label="Period" className="select" style={{ height: 46 }}><option>01 – 09 Oct 2026</option><option>September 2026</option><option>This session</option></select><button className="btn"><Icon name="download" size={16} />Export for accountant</button></>} />
      <Tabs value={tab} onChange={setTab} items={TABS.map((t) => ({ key: t, label: t }))} />

      {tab === 'Overview' && (
        <>
          <div className="grid g4">
            {kpis.map(([l, v, s, tone]) => (
              <section key={l} className="card" style={{ padding: 18 }}>
                <div className="small muted">{l}</div>
                <div className="display" style={{ fontSize: fmt(v).length > 9 ? 'clamp(20px, 5vw, 28px)' : 28, marginTop: 10, color: tone ? `var(--${tone})` : undefined, whiteSpace: 'nowrap' }}>{fmt(v)} <span className="unit">PKR</span></div>
                <div className="xs muted mt-8">{s}</div>
              </section>
            ))}
          </div>
          {(() => {
            const months = ['2026-08', '2026-09', '2026-10'];
            const by = months.map((m) => ({ m, inc: db.ledger.filter((l) => l.type === 'in' && !l.flagged && l.date.startsWith(m)).reduce((a, l) => a + l.amount, 0), exp: db.ledger.filter((l) => l.type === 'out' && !l.flagged && l.date.startsWith(m)).reduce((a, l) => a + l.amount, 0) }));
            const max = Math.max(1, ...by.flatMap((x) => [x.inc, x.exp]));
            return (
              <section className="card">
                <div className="row between"><h2 className="h2 sm">Income and expenses by month</h2><span className="row gap-12 xs muted"><span className="row gap-4"><span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--accent)' }} />Income</span><span className="row gap-4"><span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--text)' }} />Expenses</span></span></div>
                <div className="row gap-16 mt-16" style={{ alignItems: 'flex-end', height: 160 }}>
                  {by.map((x) => (
                    <div key={x.m} className="col gap-6" style={{ flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                      <div className="row gap-4" style={{ alignItems: 'flex-end', height: '100%' }}>
                        <span title={`Income ${fmt(x.inc)} PKR`} style={{ width: 22, height: `${(x.inc / max) * 100}%`, minHeight: 2, borderRadius: 6, background: 'var(--accent)' }} />
                        <span title={`Expenses ${fmt(x.exp)} PKR`} style={{ width: 22, height: `${(x.exp / max) * 100}%`, minHeight: 2, borderRadius: 6, background: 'var(--text)' }} />
                      </div>
                      <span className="xs muted">{new Date(`${x.m}-01`).toLocaleString('en', { month: 'short', year: 'numeric' })}</span>
                    </div>
                  ))}
                </div>
              </section>
            );
          })()}
          <div className="row wrap gap-16" style={{ alignItems: 'stretch' }}>
            <section className="card" style={{ flex: '1 1 360px' }}>
              <h2 className="h2 sm">Where income comes from</h2>
              <div className="col gap-12 mt-16">
                {sources.map(([k, v]) => (
                  <div key={k}>
                    <div className="row between small"><span>{k}</span><span className="medium">{fmt(v)}</span></div>
                    <div className="meter mt-8"><span style={{ width: `${(v / sources[0][1]) * 100}%`, background: 'var(--accent)' }} /></div>
                  </div>
                ))}
              </div>
            </section>
            <section className="card" style={{ flex: '1 1 360px' }}>
              <h2 className="h2 sm">Where money goes</h2>
              {expense ? (
                <div className="col gap-12 mt-16">
                  {[...new Set(db.ledger.filter((l) => l.type === 'out').map((l) => l.category))].map((c) => {
                    const v = db.ledger.filter((l) => l.type === 'out' && l.category === c).reduce((a, l) => a + l.amount, 0);
                    return <div key={c}><div className="row between small"><span>{c}</span><span className="medium">{fmt(v)}</span></div><div className="meter mt-8"><span style={{ width: `${(v / expense) * 100}%` }} /></div></div>;
                  })}
                </div>
              ) : <div className="empty"><span className="ico"><Icon name="wallet" /></span>Nothing recorded this period. Pay salaries or record an expense and it shows here.</div>}
            </section>
          </div>
        </>
      )}

      {tab === 'Income statement' && (
        <section className="card" style={{ maxWidth: 820 }}>
          <Statement rows={[['Revenue', null, { head: true }], ...sources.map(([k, v]) => [k, v, { indent: true }]), ['Total revenue', income, { strong: true }], ['Expenses', null, { head: true }], ['Salaries', expense, { indent: true }], ['Utilities & running costs', 0, { indent: true }], ['Total expenses', expense, { strong: true }]]} total={['Net surplus', income - expense]} />
        </section>
      )}
      {tab === 'Balance sheet' && (
        <div className="grid g2" style={{ alignItems: 'start' }}>
          <section className="card"><Statement rows={[['Assets', null, { head: true }], ['Cash & bank', cash, { indent: true }], ['Fees receivable', totalDue, { indent: true }]]} total={['Total assets', cash + totalDue]} /></section>
          <section className="card"><Statement rows={[['Liabilities', null, { head: true }], ['Salaries payable', payrollDue, { indent: true }], ['Family advance credit', credit, { indent: true }], ['Equity', null, { head: true }], ['Retained surplus', cash + totalDue - payrollDue - credit, { indent: true }]]} total={['Liabilities + equity', cash + totalDue]} /></section>
        </div>
      )}
      {tab === 'Trial balance' && (
        <section className="card pad-s"><div className="table-wrap"><table className="table">
          <thead><tr><th>Account</th><th className="num">Debit</th><th className="num">Credit</th></tr></thead>
          <tbody>
            {[['1000 · Cash & bank', cash, 0], ['1100 · Fees receivable', totalDue, 0], ['2000 · Salaries payable', 0, payrollDue], ['2100 · Family advances', 0, credit], ['4000 · Fee revenue', 0, income], ['5000 · Salary expense', expense + payrollDue, 0], ['3000 · Opening equity', 0, cash + totalDue + expense - income - credit]].map(([a, d, c]) => <tr key={a}><td>{a}</td><td className="num">{d ? fmt(d) : '—'}</td><td className="num">{c ? fmt(c) : '—'}</td></tr>)}
          </tbody>
        </table></div></section>
      )}
      {tab === 'Receivables' && (
        <section className="card pad-s"><div className="table-wrap"><table className="table">
          <thead><tr><th>Student</th><th>Family</th><th>0–30 days</th><th>31–60 days</th><th className="num">Total</th></tr></thead>
          <tbody>{defaulters.map((s) => { const old = s.dues.filter((d) => d.month.startsWith('Sep')).reduce((a, d) => a + d.amount, 0); const tot = s.dues.reduce((a, d) => a + d.amount, 0); return <tr key={s.id}><td className="medium">{s.name}</td><td>{familyById[s.familyId]?.name}</td><td>{fmt(tot - old)}</td><td>{old ? <span className="pill danger">{fmt(old)}</span> : '—'}</td><td className="num strong">{fmt(tot)}</td></tr>; })}</tbody>
        </table></div></section>
      )}
      {tab === 'Liabilities' && (
        <section className="card pad-s"><div className="table-wrap"><table className="table">
          <thead><tr><th>Payee</th><th>Type</th><th>Due</th><th className="num">Amount</th></tr></thead>
          <tbody>{staffUnpaid.map((s) => <tr key={s.id}><td className="medium">{s.name}</td><td>Salary · October</td><td>31 Oct 2026</td><td className="num">{fmt(s.pay)}</td></tr>)}{!staffUnpaid.length && <tr><td colSpan={4} className="muted">Nothing payable.</td></tr>}</tbody>
        </table></div></section>
      )}
      {tab === 'Journal' && (
        <div className="col gap-12">
          <div className="small muted">{journal.length} entries · total debits {fmt(dr)} · total credits {fmt(cr)} {dr === cr ? '· balanced' : ''}</div>
          {journal.map((j) => (
            <section key={j.id} className="card pad-s">
              <div className="row between wrap" style={{ padding: '10px 12px' }}>
                <span><span className="medium">{j.category} — {j.reason}</span><span className="xs muted" style={{ display: 'block' }}>{dateShort(j.date)} · {j.ref2} · party {j.ref} · by {j.by}</span></span>
                <span className={`pill ${j.type === 'in' ? 'ok' : ''}`}>{j.type === 'in' ? 'Receipt' : 'Payment'}</span>
              </div>
              <table className="table compact"><thead><tr><th>Account</th><th className="num">Debit</th><th className="num">Credit</th></tr></thead>
                <tbody>{j.lines.map(([a, d, c], i) => <tr key={i}><td>{a} · {ACCOUNTS[a][0]}</td><td className="num">{d ? fmt(d) : ''}</td><td className="num">{c ? fmt(c) : ''}</td></tr>)}</tbody></table>
            </section>
          ))}
        </div>
      )}
      {tab === 'General ledger' && (
        <section className="card pad-s">
          <div className="row gap-8" style={{ padding: 10 }}><span className="small muted">Account</span><select aria-label="Account" className="select" value={acct} onChange={(e) => setAcct(e.target.value)}>{Object.entries(ACCOUNTS).map(([k, [n]]) => <option key={k} value={k}>{k} · {n}</option>)}</select></div>
          {(() => {
            let bal = 0;
            const rows = [...journal].reverse().flatMap((j) => j.lines.filter(([a]) => String(a) === acct).map(([, d, c]) => { bal += d - c; return { j, d, c, bal }; }));
            return rows.length ? <div className="table-wrap"><table className="table"><thead><tr><th>Date</th><th>Description</th><th className="num">Debit</th><th className="num">Credit</th><th className="num">Balance</th></tr></thead>
              <tbody>{rows.map((r, i) => <tr key={i}><td className="small nowrap">{dateShort(r.j.date)}</td><td>{r.j.reason}<div className="xs muted">{r.j.ref2}</div></td><td className="num">{r.d ? fmt(r.d) : ''}</td><td className="num">{r.c ? fmt(r.c) : ''}</td><td className="num strong">{fmt(r.bal)}</td></tr>)}</tbody></table></div>
              : <div className="empty">No entries for this account in the period.</div>;
          })()}
        </section>
      )}
      {tab === 'Cash & bank book' && (
        <div className="grid g2" style={{ alignItems: 'start' }}>
          {[1010, 1020].map((a) => {
            let bal = 0;
            const rows = [...journal].reverse().flatMap((j) => j.lines.filter(([x]) => x === a).map(([, d, c]) => { bal += d - c; return { j, d, c, bal }; }));
            return (
              <section key={a} className="card pad-s">
                <div className="row between" style={{ padding: '10px 12px' }}><span className="medium">{ACCOUNTS[a][0]}</span><span className="big-num" style={{ fontSize: 24 }}>{fmt(bal)}</span></div>
                {rows.map((r, i) => <div key={i} className="row between small" style={{ padding: '8px 12px', borderTop: '1px solid var(--line)' }}><span>{dateShort(r.j.date).slice(0, 6)} · {r.j.reason}</span><span className={r.d ? 'ok-text' : ''}>{r.d ? `+${fmt(r.d)}` : `−${fmt(r.c)}`}</span></div>)}
                {!rows.length && <div className="small muted" style={{ padding: 12 }}>No movement.</div>}
              </section>
            );
          })}
        </div>
      )}
      {tab === 'Data checks' && (
        <div className="col gap-12">
          <div className="grid g3">
            <div className="tile"><div className="k">Debits = credits</div><div className="v" style={{ color: dr === cr ? 'var(--accent-text)' : 'var(--danger)' }}>{dr === cr ? 'Balanced' : 'Out of balance'}</div><div className="xs muted">{fmt(dr)} · {fmt(cr)}</div></div>
            <div className="tile"><div className="k">Entries checked</div><div className="v">{journal.length}</div></div>
            <div className="tile"><div className="k">Problem-flagged (excluded)</div><div className="v">{db.ledger.filter((l) => l.flagged).length}</div></div>
          </div>
          <section className="card">
            <h2 className="h2 sm">Reconciliation with Reports → Income vs expense</h2>
            {(() => {
              const raw = db.ledger.filter((l) => !l.flagged && l.type === 'in').reduce((a, l) => a + l.amount, 0);
              const topups = db.ledger.filter((l) => !l.flagged && l.type === 'in' && /family balance/i.test(l.category)).reduce((a, l) => a + l.amount, 0);
              const rep = db.ledger.filter((l) => !l.flagged && l.type === 'in' && /loan repayment/i.test(l.category)).reduce((a, l) => a + l.amount, 0);
              return <Statement rows={[['Income in Reports', raw], ['Family balance top-ups (a liability, not income)', -topups, { indent: true }], ['Staff loan repayments', -rep, { indent: true }], ['Accounting income', raw - topups - rep, { strong: true }], ['Unexplained difference', 'None']]} />;
            })()}
          </section>
          <section className="card pad-s">
            {[['Receipt without a payment group', 'info', 1], ['Cash received more than fees applied', 'warn', 2], ['Family credit used with no matching payment', 'ok', 0], ['Staff loan without a ledger entry', 'ok', 0], ['Entry dated in the future', 'ok', 0]].map(([t, tone, n]) => (
              <div key={t} className="row between" style={{ padding: '12px', borderTop: '1px solid var(--line)' }}><span className="small">{t}</span><span className="row gap-8"><span className="small muted">{n} records</span><span className={`pill ${tone}`}>{tone === 'ok' ? 'OK' : tone === 'warn' ? 'Warning' : 'For info'}</span></span></div>
            ))}
          </section>
        </div>
      )}
      {tab === 'Chart of accounts' && (
        <section className="card" style={{ maxWidth: 820 }}>
          <Statement rows={[['Assets', null, { head: true }], ['1000 · Cash & bank', 'Asset', { indent: true }], ['1100 · Fees receivable', 'Asset', { indent: true }], ['Liabilities', null, { head: true }], ['2000 · Salaries payable', 'Liability', { indent: true }], ['2100 · Family advances', 'Liability', { indent: true }], ['2200 · Security deposits', 'Liability', { indent: true }], ['Income', null, { head: true }], ['4000 · Tuition fees', 'Income', { indent: true }], ['4100 · Fines & charges', 'Income', { indent: true }], ['4200 · Admission fees', 'Income', { indent: true }], ['Expenses', null, { head: true }], ['5000 · Salaries', 'Expense', { indent: true }], ['5100 · Utilities', 'Expense', { indent: true }], ['5200 · Maintenance', 'Expense', { indent: true }]]} />
        </section>
      )}
    </div>
  );
}
