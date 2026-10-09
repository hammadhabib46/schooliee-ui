import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { Seg } from '../components/ui.jsx';
import { TodoRow, useTodos } from '../components/Drawers.jsx';
import { useSchool, dueOf, code } from '../lib/store.jsx';
import { dateLong, fmt, initials } from '../lib/format.js';
import { attendanceTrend, dailyCollection } from '../data/seed.js';

const calm = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Counts from 0 to the value once, on first paint.
function useCount(to, dur = 1100, delay = 0) {
  const [v, setV] = useState(calm() ? to : 0);
  const first = useRef(true);
  useEffect(() => {
    if (!first.current || calm()) { setV(to); return; }
    first.current = false;
    let raf; const t0 = performance.now() + delay;
    const tick = (t) => { const p = Math.max(0, Math.min(1, (t - t0) / dur)); setV(to * (1 - Math.pow(1 - p, 3))); if (p < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, dur, delay]);
  return v;
}

function Gauge({ value }) {
  const N = 29;
  const on = Math.round((value / 100) * N);
  const shown = useCount(value, 1300, 300);
  return (
    <div style={{ position: 'relative', width: 300, height: 168, margin: '16px auto 0', maxWidth: '100%' }}>
      {Array.from({ length: N }, (_, i) => (
        <span key={i} style={{
          position: 'absolute', left: 144, top: 10, width: 12, height: 32, borderRadius: 999,
          background: i < on ? 'var(--hero-accent)' : 'var(--hero-track)',
          transformOrigin: '6px 140px', transform: `rotate(${-90 + (180 / (N - 1)) * i}deg)`,
          animationDelay: `${300 + i * 32}ms`,
        }} className={i < on ? 'g-seg on' : 'g-seg'} />
      ))}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, textAlign: 'center' }}>
        <div className="display" style={{ fontSize: 44 }}>{shown.toFixed(2)}<span style={{ fontSize: 22, color: 'var(--hero-muted)' }}>%</span></div>
      </div>
    </div>
  );
}

export default function Today() {
  const s = useSchool();
  const { db, active, defaulters, totalDue, familiesWithDue, staffUnpaid, payrollDue, sections, todayAtt, classById, familyById, open, kidsOf } = s;
  const nav = useNavigate();
  const todos = useTodos();
  const [period, setPeriod] = useState('month');
  const [attMode, setAttMode] = useState('Monthly');

  const collected = db.ledger.filter((l) => l.type === 'in' && l.category !== 'Promotion').reduce((a, l) => a + l.amount, 0) - 123;
  const billed = collected + totalDue;
  const rate = billed ? (collected / billed) * 100 : 0;
  const paidOut = db.ledger.filter((l) => l.type === 'out').reduce((a, l) => a + l.amount, 0);
  const payrollTotal = db.staff.filter((x) => x.status === 'active').reduce((a, x) => a + x.pay, 0);
  const net = collected - payrollTotal;
  // Entrance: cards rise in order, numbers count up (see .today-in in app.css).
  const root = useRef(null);
  useEffect(() => { root.current?.querySelectorAll('.card, .card-accent, .card-hero').forEach((el, i) => el.style.setProperty('--i', Math.min(i, 14))); }, []);
  const collectedC = useCount(collected, 1200, 450);
  const payrollC = useCount(payrollTotal, 1200, 550);
  const netC = useCount(net, 1300, 400);
  const coverage = Math.min(100, (collected / payrollTotal) * 100);
  const markedToday = active.filter((x) => todayAtt[x.id]).length;
  const presentToday = active.filter((x) => todayAtt[x.id] === 'P' || todayAtt[x.id] === 'L').length;
  const newAdmissions = active.filter((x) => x.isNew).length;
  const lastIn = db.ledger.find((l) => l.type === 'in' && l.amount > 0);
  const lastFam = lastIn ? familyById[lastIn.ref.split(' ')[0]] : null;
  const lastOut = db.ledger.find((l) => l.type === 'out');

  // fees by class
  const byClass = db.classes.map((c) => {
    const kids = active.filter((x) => x.classId === c.id);
    if (!kids.length) return null;
    const due = kids.reduce((a, x) => a + dueOf(x), 0);
    const paid = kids.reduce((a, x) => a + x.paid, 0);
    return { c, due, paid, pct: paid + due ? (paid / (paid + due)) * 100 : 100 };
  }).filter(Boolean).sort((a, b) => b.due - a.due);

  const stackColors = [
    ['var(--solid)', 'var(--on-solid)', 'rgba(127,127,127,.25)'],
    ['var(--surface-3)', 'var(--text)', 'var(--surface)'],
    ['var(--surface-3)', 'var(--text)', 'var(--surface)'],
    ['var(--surface-2)', 'var(--text)', 'var(--surface)'],
    ['var(--surface)', 'var(--text)', 'var(--surface-2)'],
  ];
  const sev = (d) => (d > 10000 ? 'High' : d > 3000 ? 'Critical' : 'Low');
  const families = db.families.filter((f) => kidsOf(f.id).length);
  const appCount = families.filter((f) => f.app).length;
  const waCount = families.filter((f) => f.waVerified).length;
  const maxDaily = Math.max(...dailyCollection);

  return (
    <div className="page today-in" ref={root}>
      <div className="page-head" style={{ marginBottom: -2 }}>
        <div>
          <div className="eyebrow">{dateLong(s.today)}</div>
          <h1 className="h1 sm" style={{ marginTop: 4 }}>Good morning</h1>
        </div>
        <Seg ink lg value={period} onChange={setPeriod} items={[{ key: 'today', label: 'Today' }, { key: 'month', label: '01 – 09 Oct 2026' }, { key: 'term', label: 'This term' }]} />
      </div>

      {todos.length > 0 && (
        <section id="needs" className="card" style={{ padding: 16 }}>
          <div className="row between" style={{ padding: '4px 6px 12px' }}>
            <div className="row gap-8">
              <h2 className="h2">Needs you today</h2>
              <span className="count">{todos.length}</span>
            </div>
            <span className="small muted hide-sm">Ranked by urgency · clears as you work</span>
          </div>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 440px), 1fr))', gap: 8 }}>
            {todos.slice(0, 4).map((t) => <TodoRow key={t.key} t={t} />)}
          </div>
          {todos.length > 4 && <button className="link small mt-12" style={{ marginLeft: 6 }} onClick={() => open('todos')}>+ {todos.length - 4} more</button>}
        </section>
      )}

      <div className="split">
        <main className="main">
          {/* Fee collection + daily */}
          <section id="fees" className="card flush" style={{ display: 'flex', flexWrap: 'wrap' }}>
            <div className="hero-panel" style={{ flex: '1 1 320px', padding: '22px 24px', background: 'var(--hero-bg)', color: 'var(--hero-text)', borderRadius: 26 }}>
              <div className="row between">
                <h2 className="h2">Fee collection</h2>
                <span className="small" style={{ color: 'var(--hero-muted)' }}>{fmt(collected)} / {fmt(billed)} PKR</span>
              </div>
              <Gauge value={rate} />
              <div className="small" style={{ textAlign: 'center', marginTop: 4, color: 'var(--hero-muted)' }}>{fmt(totalDue)} PKR still due</div>
              <div className="grid g3 mt-16" style={{ textAlign: 'center', gap: 8 }}>
                <button className="quick on" onClick={() => open('collect', {})}><span className="qi"><Icon name="arrowUp" size={18} /></span>Collect</button>
                <button className="quick" onClick={() => nav('/finance/fees?challans=1')}><span className="qi"><Icon name="receipt" size={18} /></span>Challans</button>
                <button className="quick" onClick={() => nav('/reports/daily-collection')}><span className="qi"><Icon name="print" size={18} /></span>Print</button>
              </div>
            </div>
            <div style={{ flex: '1.3 1 360px', padding: '22px 24px', display: 'flex', flexDirection: 'column' }}>
              <h2 className="h2">Daily collection</h2>
              <p className="sub">01 – 09 Oct 2026 · tap a day to see receipts</p>
              <div className="bars" style={{ flex: 1, minHeight: 220, marginTop: 10 }}>
                {dailyCollection.map((v, i) => (
                  <Link to="/finance/transactions" key={i} className="bar-col" title={`${i + 1} Oct`}>
                    <div style={{ height: 22, display: 'flex', alignItems: 'flex-end' }}>{v === maxDaily && <span className="peak">Peak</span>}</div>
                    <div className="bar-track">
                      <div className={v === maxDaily ? 'bar-fill hatch-ink grow-up' : 'bar-fill grow-up'} style={{ height: `${Math.max(v, 4)}%`, background: v === maxDaily ? undefined : 'var(--hatch)', animationDelay: `${500 + i * 60}ms` }} />
                    </div>
                    <span className="xs muted">0{i + 1}</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* Income vs expenses */}
          <section id="money" className="card">
            <div className="row between top wrap">
              <div>
                <h2 className="h2">Income vs expenses</h2>
                <p className="sub">What came in and what's committed to go out this month</p>
              </div>
              <div className="right">
                <div className="small muted">Net if payroll is paid</div>
                <div className="display" style={{ fontSize: 32, fontWeight: 400, color: net < 0 ? 'var(--danger)' : 'var(--accent-text)', lineHeight: 1.1 }}>{net < 0 ? '−' : '+'}{fmt(Math.abs(Math.round(netC)))} PKR</div>
              </div>
            </div>
            <div className="row wrap gap-12 mt-16" style={{ alignItems: 'stretch' }}>
              <div className="card" style={{ flex: '1 1 240px', borderRadius: 22, padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="row between">
                  <span className="row gap-8 medium" style={{ fontSize: 13 }}><span className="av s30 lime"><Icon name="arrowDown" size={13} stroke={2.2} /></span>Money in</span>
                  <span className="small muted">Fee collections</span>
                </div>
                <div className="display" style={{ fontSize: 38, fontWeight: 400 }}>{fmt(Math.round(collectedC))}<span className="unit"> PKR</span></div>
                <div className="row gap-4" style={{ height: 54, alignItems: 'flex-end' }}>
                  {dailyCollection.map((v, i) => <span key={i} style={{ flex: 1, height: `${Math.max(v, 8)}%`, borderRadius: 999, background: i === 0 ? 'var(--accent)' : 'var(--accent-dim)' }} />)}
                </div>
                <div className="row between xs faint" style={{ marginTop: -6 }}><span>01 Oct</span><span>09 Oct</span></div>
                {lastIn && lastFam && (
                  <div className="col gap-6">
                    <div className="upper">Latest</div>
                    <div className="item-card">
                      <span className="av s30 lime">{initials(lastFam.name)}</span>
                      <span className="grow"><span className="medium" style={{ display: 'block', fontSize: 13 }}>{lastFam.name}</span><span className="xs muted">{lastIn.category} · {lastFam.id}</span></span>
                      <span className="right"><span className="strong" style={{ display: 'block', fontSize: 13 }}>+{fmt(lastIn.amount)}</span><span className="ok-text strong" style={{ fontSize: 10 }}>Received</span></span>
                    </div>
                  </div>
                )}
                <Link to="/finance/transactions" className="row between small muted mt-auto"><span>Collected 01 – 09 Oct</span><span className="medium" style={{ color: 'var(--text)' }}>All collections →</span></Link>
              </div>
              <div className="card" style={{ flex: '1 1 260px', borderRadius: 22, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="row between">
                  <span className="row gap-8 medium" style={{ fontSize: 13 }}><span className="av s30 ink"><Icon name="arrowUp" size={13} stroke={2.2} /></span>Money out</span>
                  <span className="small muted">Staff payroll</span>
                </div>
                <div className="display" style={{ fontSize: 38 }}>{fmt(Math.round(payrollC))}<span className="unit"> PKR</span></div>
                <div className="row gap-4" style={{ height: 54, alignItems: 'flex-end' }}>
                  {[38, 12, 64, 20, 9, 46, 15, 30, 100].map((v, i) => <span key={i} className={i === 8 ? 'hatch-ink' : 'hatch-soft'} style={{ flex: 1, height: `${v}%`, borderRadius: 999 }} />)}
                </div>
                <div className="row between xs faint" style={{ marginTop: -6 }}><span>01 Oct</span><span>09 Oct</span></div>
                <div className="col gap-6">
                  <div className="upper">Next up</div>
                  {staffUnpaid[0] ? (
                    <div className="item-card">
                      <span className="av s30 c4">{initials(staffUnpaid[0].name)}</span>
                      <span className="grow"><span className="medium" style={{ display: 'block', fontSize: 13 }}>{staffUnpaid[0].name}</span><span className="xs muted">Salary · {staffUnpaid[0].role}</span></span>
                      <span className="right"><span className="strong" style={{ display: 'block', fontSize: 13 }}>{fmt(staffUnpaid[0].pay)}</span><span className="warn-text strong" style={{ fontSize: 10 }}>Pending</span></span>
                    </div>
                  ) : lastOut && (
                    <div className="item-card"><span className="grow small">{lastOut.reason}</span><span className="strong small">−{fmt(lastOut.amount)}</span></div>
                  )}
                </div>
                <div className="small muted mt-auto">{paidOut ? `${fmt(paidOut)} PKR paid so far` : 'No payments made yet this period'}</div>
              </div>
            </div>
            <div className="mt-20">
              <div className="row between wrap" style={{ alignItems: 'baseline' }}>
                <span className="muted">Payroll coverage</span>
                <span className="small muted">Fees collected vs payroll due</span>
              </div>
              <div className="row gap-6 mt-12" style={{ alignItems: 'flex-end' }}>
                <div style={{ flex: coverage, minWidth: 0 }}>
                  <div className="medium" style={{ fontSize: 15, paddingLeft: 8, borderLeft: '1.5px solid var(--hatch)', height: 28 }}>{Math.round(coverage)}% covered</div>
                  <div className="row" style={{ gap: 3, height: 38 }}>{Array.from({ length: 10 }, (_, i) => <span key={i} style={{ flex: 1, height: '100%', borderRadius: 8, background: i === 9 ? 'var(--accent)' : 'var(--accent-dim)' }} />)}</div>
                </div>
                {coverage < 100 && (
                  <div style={{ flex: 100 - coverage, minWidth: 64 }}>
                    <div className="medium nowrap" style={{ fontSize: 15, paddingLeft: 8, borderLeft: '1.5px solid var(--hatch)', height: 28 }}>{Math.round(100 - coverage)}% short</div>
                    <div className="hatch-lines" style={{ height: 38, borderRadius: 8 }} />
                  </div>
                )}
              </div>
              <div className="row wrap gap-16 mt-12 small">
                <span className="legend" style={{ color: 'var(--text)' }}><i style={{ background: 'var(--accent)', border: '1px solid var(--accent-edge)' }} />Covered by fees · {fmt(Math.min(collected, payrollTotal))}</span>
                {net < 0 && <span className="legend" style={{ color: 'var(--text)' }}><i style={{ background: 'var(--ink)' }} />Still to find · {fmt(-net)}</span>}
              </div>
            </div>
          </section>

          {/* Attendance */}
          <section id="attendance" className="card">
            <div className="row between">
              <div>
                <h2 className="h2">Attendance rate</h2>
                <p className="sub">Today {markedToday ? `${Math.round((presentToday / active.length) * 100)}% · ${markedToday}/${active.length} marked` : '· not marked yet'}</p>
              </div>
              <Seg value={attMode} onChange={setAttMode} items={['Monthly', 'Daily']} />
            </div>
            <div className="row gap-10" style={{ height: 240, marginTop: 20, alignItems: 'stretch' }}>
              <div className="col xs faint" style={{ justifyContent: 'space-between', paddingBottom: 22, width: 30, textAlign: 'right', gap: 0 }}><span>100%</span><span>50%</span><span>0%</span></div>
              <div className="bars grow">
                {(attMode === 'Monthly' ? attendanceTrend : [['Mon', 88], ['Tue', 92], ['Wed', 71], ['Thu', 80], ['Fri', 0]].map(([m, v]) => ({ m, v }))).map((m, i, arr) => {
                  const hi = i === arr.length - 1 && attMode === 'Monthly';
                  return (
                    <div key={m.m} className="bar-col">
                      <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', position: 'relative' }}>
                        {hi && (
                          <div style={{ position: 'absolute', bottom: `calc(${m.v}% + 14px)`, left: '50%', transform: 'translateX(-50%)', padding: '8px 12px', borderRadius: 14, background: 'rgba(20,20,20,.88)', color: '#fff', whiteSpace: 'nowrap', zIndex: 2 }}>
                            <div className="xs" style={{ color: '#A3A39C' }}>October 2026</div><div className="display" style={{ fontSize: 20 }}>{m.v}%</div>
                          </div>
                        )}
                        <div key={attMode} className={hi ? 'grow-up' : 'hatch-soft grow-up'} style={{ animationDelay: `${200 + i * 70}ms`, position: 'relative', width: '100%', maxWidth: 60, height: `${Math.max(m.v, 2)}%`, borderRadius: 999, background: hi ? 'var(--accent)' : undefined, border: `1px solid ${hi ? 'var(--accent-edge)' : 'var(--border)'}` }}>
                          <span style={{ position: 'absolute', left: '50%', top: -7, transform: 'translateX(-50%)', width: 14, height: 14, borderRadius: 999, background: hi ? 'var(--ink)' : 'var(--hatch)', border: '2px solid var(--surface)' }} />
                        </div>
                      </div>
                      <span className="xs" style={{ color: hi ? 'var(--text)' : 'var(--faint)', fontWeight: hi ? 600 : 400 }}>{m.m}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Fees by class */}
          <section id="classfees" className="card">
            <div className="row between wrap">
              <div>
                <h2 className="h2">Fees by class</h2>
                <p className="sub">Sorted by what's still owed · {fmt(totalDue)} PKR outstanding</p>
              </div>
              <div className="row gap-16">
                <span className="legend"><i style={{ background: 'var(--accent)', border: '1px solid var(--accent-edge)' }} />Collected</span>
                <span className="legend"><i className="hatch-lines" style={{ border: '1px solid var(--text)' }} />Due</span>
              </div>
            </div>
            <div className="col mt-20" style={{ gap: 10 }}>
              {byClass.map((f, i) => (
                <Link to={`/students?class=${f.c.id}`} key={f.c.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(110px,130px) minmax(0,1fr) auto', alignItems: 'center', gap: 16, padding: '8px 8px 8px 14px', borderRadius: 20, background: i === 0 && f.due ? 'var(--surface-2)' : 'transparent' }}>
                  <span className="row gap-10 medium">
                    <span style={{ width: 32, height: 32, borderRadius: 10, background: i === 0 && f.due ? 'var(--solid)' : 'var(--surface-2)', color: i === 0 && f.due ? 'var(--accent)' : 'var(--text)', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 600, flex: 'none' }}>{f.c.short}</span>
                    <span className="ellipsis">{f.c.name}</span>
                  </span>
                  <div className="row" style={{ gap: 4, height: 32 }}>
                    {f.pct > 0 && <div className="grow-x" style={{ animationDelay: `${400 + i * 80}ms`, width: f.pct >= 100 ? '100%' : `calc(${f.pct}% - 4px)`, height: '100%', borderRadius: 10, background: i === 0 ? 'var(--accent)' : 'var(--accent-dim)', color: i === 0 ? 'var(--on-accent)' : 'var(--text)', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', paddingLeft: 12, whiteSpace: 'nowrap' }}>{f.pct >= 12 ? `${Math.round(f.pct)}%` : ''}</div>}
                    {f.pct < 100 && <div className="hatch-lines" style={{ flex: 1, minWidth: 6, height: '100%', borderRadius: 10 }} />}
                  </div>
                  <span className="row gap-10 small" style={{ justifyContent: 'flex-end' }}>
                    <span className="muted hide-sm">{fmt(f.paid)} in</span>
                    <span className={f.due ? 'pill ink' : 'pill ok'} style={{ height: 26 }}>{f.due ? `${fmt(f.due)} due` : 'Paid'}</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </main>

        <aside className="side">
          <section className="grid g2" style={{ gap: 10 }}>
            {[
              { label: 'Students', n: active.length, sub: `${active.length} active · ${db.students.filter((x) => x.status !== 'active').length} terminated`, to: '/students' },
              { label: 'Families', n: families.length, sub: `${familiesWithDue.length} with fees pending`, to: '/students/families' },
              { label: 'Staff', n: db.staff.length, sub: `${staffUnpaid.length} payments due`, to: '/staff' },
              { label: 'New admissions', n: newAdmissions, sub: 'This period', to: '/students?view=new', dot: true },
            ].map((c) => (
              <Link key={c.label} to={c.to} className={c.accent ? 'card-accent' : 'card'} style={{ borderRadius: 22, padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="row between">
                  <span className="medium row gap-6" style={{ fontSize: 13 }}>{c.dot && <span className="dot" style={{ color: 'var(--accent-edge)' }} />}{c.label}</span>
                  <span style={{ width: 30, height: 30, borderRadius: 999, background: c.accent ? 'var(--ink)' : 'var(--surface-2)', color: c.accent ? 'var(--accent)' : 'var(--text)', display: 'grid', placeItems: 'center' }}><Icon name="arrowUpRight" size={12} stroke={2.2} /></span>
                </div>
                <div>
                  <div className="kpi">{c.n}</div>
                  <div className="xs mt-4" style={{ opacity: .75 }}>{c.sub}</div>
                </div>
              </Link>
            ))}
          </section>

          <section id="payroll" className="card pad-m">
            <div className="row between">
              <span className="small muted">Staff payroll</span>
              <span className="pill outline">October</span>
            </div>
            <div className="display" style={{ fontSize: 36, marginTop: 14 }}>{fmt(payrollDue)}<span className="unit"> PKR</span></div>
            <div className="small muted">due to {staffUnpaid.length} staff</div>
            <div className="row" style={{ gap: 3, height: 34, marginTop: 16 }}>
              {Array.from({ length: 30 }, (_, i) => <span key={i} style={{ flex: 1, height: '100%', borderRadius: 2, background: i < Math.round(((db.staff.length - staffUnpaid.length) / db.staff.length) * 30) ? 'var(--accent-dim)' : 'var(--track)' }} />)}
            </div>
            <div className="row between xs muted mt-8"><span>{db.staff.length - staffUnpaid.length} paid</span><span>{staffUnpaid.length} pending</span></div>
            {!staffUnpaid.length && <button className="btn block mt-16" style={{ height: 44 }} onClick={() => nav('/staff/payroll')}>View payslips</button>}
          </section>

          <section className="card pad-m">
            <div className="row between">
              <h2 className="h2 sm">Fee defaulters</h2>
            </div>
            <div className="row mt-16" style={{ gap: 3, height: 10 }}>
              {defaulters.slice(0, 4).map((d, i) => <span key={d.id} style={{ flex: dueOf(d), borderRadius: 999, background: ['var(--ink)', 'var(--accent)', 'var(--hatch)', 'var(--border)'][i] }} />)}
            </div>
            <div className="row between xs muted mt-8"><span>{defaulters.length} students</span><span>{fmt(totalDue)} PKR</span></div>
            <div className="col mt-12" style={{ gap: 0 }}>
              {defaulters.slice(0, 5).map((d, i) => {
                const [bg, fg, avBg] = stackColors[i];
                return (
                  <Link to={`/students/${d.id}`} key={d.id} className="row" style={{ gap: 12, padding: '14px 16px', borderRadius: 20, background: bg, color: fg, marginTop: i ? -12 : 0, position: 'relative', zIndex: 10 - i, boxShadow: '0 -6px 16px rgba(20,20,20,.05)', border: i === 4 ? '1px solid var(--border)' : 0 }}>
                    <span className="av s38" style={{ background: avBg, color: 'inherit' }}>{initials(d.name)}</span>
                    <div className="grow"><div className="strong">{d.name}</div><div className="small ellipsis" style={{ opacity: .7 }}>{classById[d.classId]?.name} · {d.section} · {familyById[d.familyId]?.name}</div></div>
                    <div className="right"><div className="strong">{fmt(dueOf(d))}</div><div className="xs" style={{ opacity: .75 }}>{sev(dueOf(d))}</div></div>
                  </Link>
                );
              })}
            </div>
            <Link to="/finance/fees" className="link small mt-12" style={{ display: 'inline-block' }}>See all dues →</Link>
          </section>

          <section className="card pad-s">
            <div className="row between" style={{ padding: '12px 12px 4px' }}>
              <h2 className="h2 sm">Classes today</h2>
              <span className="small muted">{sections.filter((x) => x.students.every((st) => todayAtt[st.id])).length}/{sections.length} marked</span>
            </div>
            {sections.map((x, i) => {
              const done = x.students.filter((st) => todayAtt[st.id]).length;
              return (
                <Link key={x.key} to={`/academics/attendance?section=${encodeURIComponent(x.key)}`} className="row between" style={{ padding: '11px 12px', borderTop: i ? '1px solid var(--line)' : 0, fontSize: 13 }}>
                  <span className="medium">{x.label}</span>
                  <span className="row gap-8 muted">
                    {done === x.students.length ? <span className="pill ok">Done</span> : `${done}/${x.students.length} marked`}
                    <span className="icon-btn xs"><Icon name="arrowUpRight" size={11} stroke={2.4} /></span>
                  </span>
                </Link>
              );
            })}
          </section>

          <section className="card pad-m col gap-12">
            <h2 className="h2 sm">Parent reach</h2>
            {[['App installed', appCount], ['WhatsApp verified', waCount]].map(([l, n]) => (
              <div key={l}>
                <div className="row between small"><span>{l}</span><span className="strong">{n}/{families.length}</span></div>
                <div className="row gap-4 mt-8">{families.map((f, i) => <span key={f.id} style={{ flex: 1, height: 24, borderRadius: 8, background: i < n ? 'var(--ink)' : 'var(--line)' }} />)}</div>
              </div>
            ))}
          </section>
        </aside>
      </div>
    </div>
  );
}
