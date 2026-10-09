import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import { Circle, PillGroup } from '../../components/Bento.jsx';
import { PageHead } from '../../components/Shell.jsx';
import { DayColumns, Donut, HBars, PairBars } from '../../components/Charts.jsx';
import { Avatar } from '../../components/ui.jsx';
import { useSchool, dueOf, code } from '../../lib/store.jsx';
import { cx, fmt } from '../../lib/format.js';
import { monthlyBill } from '../../lib/student.js';
import { downloadCsv, printView } from '../../lib/exporter.js';
import { historyFor } from '../students/StudentProfile.jsx';
import { FinanceTabs } from './Fees.jsx';

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS = ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'];
const labelOf = (k) => `${MON[Number(k.slice(5, 7)) - 1]} ${k.slice(0, 4)}`;
const keyOfLabel = (l) => { const [m, y] = l.split(' '); return `${y}-${String(MON.indexOf(m.slice(0, 3)) + 1).padStart(2, '0')}`; };
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const CAT = { monthly: ['Monthly fee', 'var(--text)'], recurring: ['Recurring (bus, tuition)', 'var(--info)'], onetime: ['One-time charges', 'var(--accent-dim)'], fine: ['Fines', 'var(--warn)'], other: ['Funds', 'var(--accent)'] };

// Everything the fee charts and the monthly report need, derived from the same records the app uses.
function useFeeFacts() {
  const { db, classById, familyDue } = useSchool();
  return useMemo(() => {
    const students = db.students;
    const charges = students.flatMap((s) => (s.history || []).filter((h) => h.kind === 'charge').map((h) => ({ ...h, s, key: h.month ? keyOfLabel(h.month) : h.date.slice(0, 7) })));
    const payments = students.flatMap((s) => (s.history || []).filter((h) => h.kind === 'payment').map((h) => ({ ...h, s, key: h.date.slice(0, 7) })));
    const waivers = students.flatMap((s) => (s.history || []).filter((h) => h.kind === 'waiver').map((h) => ({ ...h, s, key: h.date.slice(0, 7) })));
    const sum = (list) => list.reduce((a, x) => a + x.amount, 0);
    const byMonth = MONTHS.map((k) => ({ key: k, label: MON[Number(k.slice(5, 7)) - 1], billed: sum(charges.filter((c) => c.key === k)), collected: sum(payments.filter((p) => p.key === k)) }));
    const dues = students.filter((s) => s.status === 'active').flatMap((s) => s.dues.map((d) => ({ ...d, s })));
    const outstanding = sum(dues);
    const ageing = [['This month', (d) => d.month === 'Oct 2026'], ['1 month late', (d) => d.month === 'Sep 2026'], ['2–3 months late', (d) => ['Aug 2026', 'Jul 2026'].includes(d.month)], ['Older', (d) => !['Oct 2026', 'Sep 2026', 'Aug 2026', 'Jul 2026'].includes(d.month)]]
      .map(([label, fn], i) => ({ label, value: sum(dues.filter(fn)), color: ['var(--accent)', 'var(--warn)', 'var(--danger)', 'var(--danger)'][i] }));
    const byCat = Object.entries(CAT).map(([k, [label, color]]) => ({ label, color, value: sum(dues.filter((d) => (d.cat || 'other') === k)) })).filter((x) => x.value);
    const byClass = db.classes.map((c) => {
      const ss = students.filter((s) => s.classId === c.id);
      const billed = sum(charges.filter((x) => x.s.classId === c.id));
      const collected = sum(payments.filter((x) => x.s.classId === c.id));
      return { c, students: ss.filter((s) => s.status === 'active').length, billed, collected, due: ss.reduce((a, s) => a + dueOf(s), 0), rate: pct(collected, billed) };
    }).filter((x) => x.students || x.billed);
    const methods = {};
    payments.forEach((p) => { const m = /cash/i.test(p.method || 'Cash') ? 'Cash' : 'Online transfer'; methods[m] = (methods[m] || 0) + p.amount; });
    const families = db.families.map((f) => ({ f, due: familyDue(f.id) })).filter((x) => x.due > 0).sort((a, b) => b.due - a.due);
    const credit = db.families.reduce((a, f) => a + (f.credit || 0), 0);
    const nextBill = students.filter((s) => s.status === 'active').reduce((a, s) => a + monthlyBill(s, classById[s.classId]), 0);
    const finesCharged = sum(charges.filter((c) => c.cat === 'fine'));
    const finesOpen = sum(dues.filter((d) => d.cat === 'fine'));
    return { charges, payments, waivers, byMonth, dues, outstanding, ageing, byCat, byClass, methods, families, credit, nextBill, finesCharged, finesOpen, sum };
  }, [db, classById, familyDue]);
}

export default function Analytics() {
  const [view, setView] = useState('Analytics');
  return (
    <div className="page">
      <FinanceTabs />
      <div className="no-print">
        <PageHead title={view === 'Analytics' ? 'Analytics' : 'Monthly report'} sub={view === 'Analytics' ? 'Where the money comes from, what is late and who owes it' : 'A one-page summary of the whole school for any month — export it as PDF'}
          actions={<PillGroup value={view} onChange={setView} items={['Analytics', 'Monthly report']} />} />
      </div>
      {view === 'Analytics' ? <FeeCharts /> : <MonthlyReport />}
    </div>
  );
}

function FeeCharts() {
  const { db, open } = useSchool();
  const F = useFeeFacts();
  const oct = F.byMonth.find((m) => m.key === '2026-10');
  const sep = F.byMonth.find((m) => m.key === '2026-09');
  const sessionBilled = F.byMonth.reduce((a, m) => a + m.billed, 0);
  const sessionCollected = F.byMonth.reduce((a, m) => a + m.collected, 0);
  const days = Array.from({ length: 9 }, (_, i) => {
    const d = `2026-10-${String(i + 1).padStart(2, '0')}`;
    return { label: String(i + 1), value: db.ledger.filter((l) => l.type === 'in' && !l.flagged && l.date.startsWith(d) && /fee|fine|admission|recurring|promotion|balance/i.test(l.category)).reduce((a, l) => a + l.amount, 0) };
  });
  const discounts = F.sum(F.waivers);
  const standing = db.students.filter((s) => s.status === 'active' && s.discount).length;
  const kpis = [
    ['Collected in October', fmt(oct?.collected || 0), `${(oct?.collected || 0) >= (sep?.collected || 0) ? '▲' : '▼'} vs ${fmt(sep?.collected || 0)} in September`],
    ['Due now', fmt(F.outstanding), `${F.families.length} families · ${F.dues.length} unpaid items`],
    ['Collection rate (session)', `${pct(sessionCollected, sessionBilled)}%`, `${fmt(sessionCollected)} of ${fmt(sessionBilled)} billed`],
    ['Expected next month', fmt(F.nextBill), `${db.students.filter((s) => s.status === 'active').length} students · monthly + recurring`],
  ];
  return (
    <div className="col gap-16">
      <section className="hero-panel analytics-hero">
        {kpis.map(([k, v, s], i) => (
          <div key={k} className={cx('a-kpi', i === 0 && 'lead')}>
            <span className="xs" style={{ color: 'var(--hero-muted)' }}>{k}</span>
            <span className="display" style={{ fontSize: i === 0 ? 44 : 30, color: i === 0 ? 'var(--hero-accent)' : 'var(--hero-text)' }}>{v}{i !== 2 && <span className="unit" style={{ color: 'var(--hero-muted)' }}> PKR</span>}</span>
            <span className="xs" style={{ color: 'var(--hero-muted)' }}>{s}</span>
          </div>
        ))}
      </section>

      <div className="a-grid">
        <section className="widget a-wide">
          <div className="widget-head"><span className="circle sm"><Icon name="reports" size={15} /></span><span className="grow medium">Billed vs collected by month</span><span className="xs muted">Collected counts the day money came in</span></div>
          <div className="widget-body"><PairBars data={F.byMonth} keys={[{ key: 'billed', label: 'Billed', color: 'var(--text)' }, { key: 'collected', label: 'Collected', color: 'var(--accent)' }]} /></div>
        </section>

        <section className="widget">
          <div className="widget-head"><span className="circle sm"><Icon name="clock" size={15} /></span><span className="grow medium">How late is the money owed?</span></div>
          <div className="widget-body"><Donut parts={F.ageing.filter((a) => a.value)} center={fmt(F.outstanding)} sub="PKR owed" /></div>
        </section>

        <section className="widget">
          <div className="widget-head"><span className="circle sm"><Icon name="layers" size={15} /></span><span className="grow medium">What is owed, by type</span></div>
          <div className="widget-body"><HBars rows={F.byCat.map((c) => ({ label: c.label, value: c.value, color: c.color }))} /></div>
        </section>

        <section className="widget a-wide">
          <div className="widget-head"><span className="circle sm"><Icon name="school" size={15} /></span><span className="grow medium">Collection rate by class</span><span className="xs muted">Collected ÷ billed this session</span></div>
          <div className="widget-body">
            <div className="table-wrap"><table className="table">
              <thead><tr><th>Class</th><th className="num">Students</th><th className="num">Billed</th><th className="num">Collected</th><th className="num">Owed now</th><th style={{ width: '32%' }}>Rate</th></tr></thead>
              <tbody>{F.byClass.sort((a, b) => a.rate - b.rate).map((r) => (
                <tr key={r.c.id}><td className="medium">{r.c.name}</td><td className="num">{r.students}</td><td className="num">{fmt(r.billed)}</td><td className="num">{fmt(r.collected)}</td><td className={cx('num', r.due && 'danger-text')}>{fmt(r.due)}</td>
                  <td><span className="row gap-8"><span className="hbar-track grow"><span style={{ width: `${r.rate}%`, background: r.rate >= 90 ? 'var(--accent)' : r.rate >= 70 ? 'var(--warn)' : 'var(--danger)' }} /></span><span className="small strong" style={{ width: 40, textAlign: 'right' }}>{r.rate}%</span></span></td></tr>
              ))}</tbody>
            </table></div>
          </div>
        </section>

        <section className="widget">
          <div className="widget-head"><span className="circle sm"><Icon name="wallet" size={15} /></span><span className="grow medium">How parents pay</span></div>
          <div className="widget-body"><Donut parts={Object.entries(F.methods).map(([label, value], i) => ({ label, value, color: i ? 'var(--info)' : 'var(--accent)' }))} center={`${pct(F.methods.Cash || 0, F.sum(F.payments))}%`} sub="cash" size={150} /></div>
        </section>

        <section className="widget">
          <div className="widget-head"><span className="circle sm"><Icon name="calendar" size={15} /></span><span className="grow medium">Collected each day · October</span></div>
          <div className="widget-body"><DayColumns data={days} /><div className="row between xs muted"><span>Best day: {days.reduce((a, d) => (d.value > a.value ? d : a), days[0]).label} Oct</span><span>{fmt(days.reduce((a, d) => a + d.value, 0))} PKR so far</span></div></div>
        </section>

        <section className="widget a-wide">
          <div className="widget-head"><span className="circle sm"><Icon name="family" size={15} /></span><span className="grow medium">Families who owe the most</span><Link to="/finance/fees" className="xs link">All fees</Link></div>
          <div className="widget-body col gap-6">
            {F.families.slice(0, 6).map(({ f, due }) => (
              <div key={f.id} className="row gap-12" style={{ padding: '6px 0', borderTop: '1px solid var(--line)' }}>
                <Avatar name={f.name} id={f.id} size={32} />
                <Link to={`/finance/fees/${f.id}`} className="grow medium">{f.name} <span className="xs muted">· {f.id}</span></Link>
                <span className="hbar-track" style={{ width: '30%' }}><span style={{ width: `${(due / F.families[0].due) * 100}%`, background: 'var(--danger)' }} /></span>
                <span className="small strong" style={{ width: 90, textAlign: 'right' }}>{fmt(due)}</span>
                <button className="btn xs" onClick={() => open('collect', { familyId: f.id })}>Pay</button>
              </div>
            ))}
          </div>
        </section>

        <section className="widget">
          <div className="widget-head"><span className="circle sm"><Icon name="fine" size={15} /></span><span className="grow medium">Fines, discounts & credit</span></div>
          <div className="widget-body col gap-8">
            {[['Fines charged this session', F.finesCharged], ['Fines still unpaid', F.finesOpen], ['Extra discounts given at collection', discounts], ['Family credit held (paid ahead)', F.credit]].map(([k, v]) => <div key={k} className="row between small"><span className="muted">{k}</span><span className="strong">{fmt(v)} PKR</span></div>)}
            <div className="row between small"><span className="muted">Students on a standing discount</span><span className="strong">{standing}</span></div>
          </div>
        </section>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// One-month whole-school report — printable (Save as PDF) and exportable.

function MonthlyReport() {
  const { db, classById } = useSchool();
  const F = useFeeFacts();
  const [month, setMonth] = useState('2026-09');
  const label = labelOf(month);
  const inMonth = (d) => (d || '').startsWith(month);
  const mNum = Number(month.slice(5, 7));
  const active = db.students.filter((s) => s.status === 'active' || (s.terminatedOn && s.terminatedOn >= `${month}-01`));

  const billed = F.sum(F.charges.filter((c) => c.key === month));
  const collected = F.sum(F.payments.filter((p) => p.key === month));
  const ledgerIn = db.ledger.filter((l) => l.type === 'in' && !l.flagged && inMonth(l.date));
  const ledgerOut = db.ledger.filter((l) => l.type === 'out' && !l.flagged && inMonth(l.date));
  const income = month === '2026-10' ? F.sum(ledgerIn) : collected;
  const payroll = db.staff.flatMap((s) => (s.salaryHistory || []).filter((h) => h.month === month).map((h) => ({ s, ...h })));
  const salaries = F.sum(payroll);
  const expenses = F.sum(ledgerOut.filter((l) => l.category !== 'Salary')) + salaries;
  const byCat = {};
  ledgerOut.forEach((l) => { byCat[l.category] = (byCat[l.category] || 0) + l.amount; });
  if (salaries) byCat.Salaries = salaries;
  const admitted = db.students.filter((s) => inMonth(s.admitted));
  const left = db.students.filter((s) => inMonth(s.terminatedOn));
  const att = active.filter((s) => s.admitted <= `${month}-31`).map((s) => { const h = historyFor(s.id, s.admitted, mNum); const n = Object.keys(h).length; const present = Object.values(h).filter((v) => v === 'P' || v === 'L').length; return { s, n, rate: n ? pct(present, n) : null, absent: Object.values(h).filter((v) => v === 'A').length }; }).filter((x) => x.n);
  const avgAtt = att.length ? Math.round(att.reduce((a, x) => a + x.rate, 0) / att.length) : null;
  const chronic = att.filter((x) => x.absent >= 3).sort((a, b) => b.absent - a.absent);
  const exams = db.exams.filter((e) => inMonth(e.date) || inMonth(e.created));
  const results = exams.flatMap((e) => Object.values(e.results).map((r) => { const tot = e.subjects.reduce((a, [n]) => a + (r[n] || 0), 0); const max = e.subjects.reduce((a, [, m]) => a + m, 0); return pct(tot, max); }));
  const msgs = db.announcements.filter((a) => inMonth(a.date));
  const inquiries = db.inquiries.filter((q) => inMonth(q.date));
  const classRows = db.classes.map((c) => {
    const ss = db.students.filter((s) => s.classId === c.id);
    const b = F.sum(F.charges.filter((x) => x.key === month && x.s.classId === c.id));
    const col = F.sum(F.payments.filter((x) => x.key === month && x.s.classId === c.id));
    const a = att.filter((x) => x.s.classId === c.id);
    return { c, students: ss.filter((s) => s.status === 'active').length, billed: b, collected: col, att: a.length ? Math.round(a.reduce((x, y) => x + y.rate, 0) / a.length) : null };
  }).filter((r) => r.students || r.billed);

  const exportCsvAll = () => downloadCsv(`School report ${label}`, [
    ['Schooliee monthly report', label], [],
    ['Fees billed', billed], ['Fees collected', collected], ['Collection rate %', pct(collected, billed)], ['Income', income], ['Expenses', expenses], ['Net', income - expenses], [],
    ['Class', 'Students', 'Billed', 'Collected', 'Attendance %'], ...classRows.map((r) => [r.c.name, r.students, r.billed, r.collected, r.att ?? '']), [],
    ['Staff', 'Salary paid'], ...payroll.map((p) => [p.s.name, p.amount]),
  ]);

  return (
    <div className="col gap-16">
      <div className="row wrap gap-8 no-print">
        <div className="onoff">{MONTHS.slice(-4).map((k) => <button key={k} className={cx(month === k && 'on')} onClick={() => setMonth(k)}>{labelOf(k)}{k === '2026-10' ? ' (so far)' : ''}</button>)}</div>
        <div className="grow" />
        <Circle icon="download" label="Export CSV" onClick={exportCsvAll} />
        <button className="btn primary" onClick={printView}><Icon name="print" size={15} />Export as PDF</button>
      </div>

      <article className="report-sheet">
        <header className="report-head">
          <div><div className="eyebrow">Monthly school report</div><h2 className="report-title">{label}</h2><div className="small muted">{db.school.name} · {db.school.address}</div></div>
          <div className="xs muted right">Generated 9 Oct 2026<br />{month === '2026-10' ? 'Month to date (1–9 Oct)' : 'Full month'}</div>
        </header>

        <section className="report-kpis">
          {[['Fees collected', fmt(collected), `${pct(collected, billed)}% of ${fmt(billed)} billed`], ['Total income', fmt(income), `${fmt(Math.max(0, income - collected))} other income`], ['Expenses', fmt(expenses), `incl. ${fmt(salaries)} salaries`], ['Net', fmt(income - expenses), income - expenses >= 0 ? 'surplus' : 'deficit'],
            ['Students', String(active.filter((s) => s.status === 'active').length), `+${admitted.length} admitted · −${left.length} left`], ['Attendance', avgAtt == null ? '—' : `${avgAtt}%`, `${chronic.length} chronic absentee${chronic.length === 1 ? '' : 's'}`], ['Exams', String(exams.length), results.length ? `avg result ${Math.round(results.reduce((a, b) => a + b, 0) / results.length)}%` : 'no results entered'], ['Messages sent', String(msgs.length), `${inquiries.length} new admission inquiries`]]
            .map(([k, v, s]) => <div key={k}><span className="xs muted">{k}</span><b>{v}</b><span className="xs muted">{s}</span></div>)}
        </section>

        <section className="report-sec">
          <h3>Fees by class</h3>
          <table className="table compact"><thead><tr><th>Class</th><th className="num">Students</th><th className="num">Billed</th><th className="num">Collected</th><th className="num">Rate</th><th className="num">Attendance</th></tr></thead>
            <tbody>{classRows.map((r) => <tr key={r.c.id}><td>{r.c.name}</td><td className="num">{r.students}</td><td className="num">{fmt(r.billed)}</td><td className="num">{fmt(r.collected)}</td><td className="num">{r.billed ? `${pct(r.collected, r.billed)}%` : '—'}</td><td className="num">{r.att == null ? '—' : `${r.att}%`}</td></tr>)}
              <tr className="strong"><td>Total</td><td className="num">{classRows.reduce((a, r) => a + r.students, 0)}</td><td className="num">{fmt(billed)}</td><td className="num">{fmt(collected)}</td><td className="num">{pct(collected, billed)}%</td><td className="num">{avgAtt == null ? '—' : `${avgAtt}%`}</td></tr></tbody></table>
        </section>

        <div className="report-two">
          <section className="report-sec">
            <h3>Still owed at report time</h3>
            {F.families.slice(0, 5).map(({ f, due }) => <div key={f.id} className="report-line"><span>{f.name} ({f.id})</span><span>{fmt(due)}</span></div>)}
            <div className="report-line strong"><span>Total outstanding</span><span>{fmt(F.outstanding)}</span></div>
          </section>
          <section className="report-sec">
            <h3>Expenses by category</h3>
            {Object.entries(byCat).map(([k, v]) => <div key={k} className="report-line"><span>{k}</span><span>{fmt(v)}</span></div>)}
            {!Object.keys(byCat).length && <div className="small muted">No expenses recorded.</div>}
          </section>
        </div>

        <div className="report-two">
          <section className="report-sec">
            <h3>Payroll</h3>
            {payroll.map((p) => <div key={p.s.id} className="report-line"><span>{p.s.name} · {p.s.role}</span><span>{fmt(p.amount)}{p.amount < p.s.pay ? ` / ${fmt(p.s.pay)}` : ''}</span></div>)}
            {!payroll.length && <div className="small muted">No salaries paid in {label}.</div>}
            {payroll.length > 0 && <div className="report-line strong"><span>Total salaries</span><span>{fmt(salaries)}</span></div>}
          </section>
          <section className="report-sec">
            <h3>Students</h3>
            <div className="report-line"><span>Active at month end</span><span>{active.filter((s) => s.status === 'active').length}</span></div>
            <div className="report-line"><span>New admissions</span><span>{admitted.length}{admitted.length ? ` — ${admitted.map((s) => s.name).join(', ')}` : ''}</span></div>
            <div className="report-line"><span>Left / terminated</span><span>{left.length}</span></div>
            <div className="report-line"><span>Admission inquiries</span><span>{inquiries.length}</span></div>
          </section>
        </div>

        <div className="report-two">
          <section className="report-sec">
            <h3>Attendance</h3>
            <div className="report-line"><span>Average student attendance</span><span>{avgAtt == null ? '—' : `${avgAtt}%`}</span></div>
            {chronic.slice(0, 5).map((x) => <div key={x.s.id} className="report-line"><span>{x.s.name} ({code(x.s)}) · {classById[x.s.classId]?.name}</span><span>{x.absent} absent</span></div>)}
            {!chronic.length && <div className="small muted">No student was absent 3 or more days.</div>}
          </section>
          <section className="report-sec">
            <h3>Academics & communication</h3>
            <div className="report-line"><span>Exams held / created</span><span>{exams.length}</span></div>
            <div className="report-line"><span>Results entered</span><span>{results.length}{results.length ? ` · avg ${Math.round(results.reduce((a, b) => a + b, 0) / results.length)}%` : ''}</span></div>
            <div className="report-line"><span>Diary entries</span><span>{db.diary.filter((d) => inMonth(d.date)).length}</span></div>
            <div className="report-line"><span>Observations</span><span>{db.observations.filter((o) => inMonth(o.date)).length}</span></div>
            <div className="report-line"><span>Messages to parents</span><span>{msgs.length} · WhatsApp {msgs.reduce((a, m) => a + m.wa[0], 0)}/{msgs.reduce((a, m) => a + m.wa[1], 0)} delivered</span></div>
          </section>
        </div>
        <footer className="xs muted">Figures come from fee records, the cash book, payroll, attendance, exams and messages in Schooliee.</footer>
      </article>
    </div>
  );
}
