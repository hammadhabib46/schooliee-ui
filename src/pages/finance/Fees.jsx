import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import { PageHead } from '../../components/Shell.jsx';
import { Avatar, Empty, Field, Menu, Modal, Search, Seg, SubNav } from '../../components/ui.jsx';
import { Circle, OnOff } from '../../components/Bento.jsx';
import { useSchool, dueOf, code } from '../../lib/store.jsx';
import { cx, fmt } from '../../lib/format.js';
import { workspaces } from '../../lib/nav.js';
import { exportCsv, printView } from '../../lib/exporter.js';

export function FinanceTabs() {
  const { familiesWithDue } = useSchool();
  const ws = workspaces.find((w) => w.key === 'finance');
  return <SubNav tabs={ws.tabs} counts={{ '/finance/fees': familiesWithDue.length || undefined }} />;
}

export default function Fees() {
  const { db, kidsOf, familyDue, classById, totalDue, open, toast } = useSchool();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const [filter, setFilter] = useState('all');
  const [by, setBy] = useState('family');
  const [cls, setCls] = useState('all');
  const [q, setQ] = useState('');
  const [openRow, setOpenRow] = useState(null);
  const [limit, setLimit] = useState(40); // big schools: 40 families / students at a time
  const [challans, setChallans] = useState(false);
  const [lookup, setLookup] = useState(false);
  const [remind, setRemind] = useState(false);
  const payFor = null;
  // Quick pay slides in from the side; the family's name opens the full fee page.
  const pay = (familyId, studentId) => open('collect', { familyId, studentId });
  useEffect(() => { if (params.get('challans')) { setChallans(true); setParams({}, { replace: true }); } }, [params, setParams]);

  const fams = useMemo(() => db.families.map((f) => {
    const kids = kidsOf(f.id);
    const due = familyDue(f.id);
    const status = !kids.length ? 'none' : !due ? 'paid' : f.paidTotal ? 'partial' : 'unpaid';
    return { ...f, kids, due, status };
  }).filter((f) => f.status !== 'none'), [db.families, kidsOf, familyDue]);

  const t = q.trim().toLowerCase();
  const famRows = fams
    .filter((f) => filter === 'all' ? f.status !== 'paid' : f.status === filter)
    .filter((f) => cls === 'all' || f.kids.some((k) => k.classId === cls))
    .filter((f) => !t || f.name.toLowerCase().includes(t) || f.id.toLowerCase().includes(t) || f.kids.some((k) => k.name.toLowerCase().includes(t) || code(k).toLowerCase().includes(t)))
    .sort((a, b) => b.due - a.due);
  const stuRows = fams.flatMap((f) => f.kids.map((k) => ({ ...k, fam: f })))
    .filter((s) => (filter === 'paid' ? !dueOf(s) : filter === 'all' ? dueOf(s) > 0 : filter === 'unpaid' ? dueOf(s) && !s.paid : dueOf(s) && s.paid))
    .filter((s) => cls === 'all' || s.classId === cls)
    .filter((s) => !t || s.name.toLowerCase().includes(t) || code(s).toLowerCase().includes(t))
    .sort((a, b) => dueOf(b) - dueOf(a));

  const collected = db.ledger.filter((l) => l.type === 'in').reduce((a, l) => a + l.amount, 0);
  const totalCollected = 1225393 + (collected - 103623);
  const rate = (totalCollected / (totalCollected + totalDue)) * 100;
  const filters = [['all', 'Due', fams.filter((f) => f.status !== 'paid').length], ['unpaid', 'Unpaid', fams.filter((f) => f.status === 'unpaid').length], ['partial', 'Partially paid', fams.filter((f) => f.status === 'partial').length], ['paid', 'Paid', fams.filter((f) => f.status === 'paid').length]];
  const tone = (s) => (s === 'unpaid' ? 'danger' : s === 'partial' ? 'warn' : 'ok');
  const label = (s) => (s === 'unpaid' ? 'Unpaid' : s === 'partial' ? 'Partially paid' : 'Paid');

  return (
    <div className="page">
      <FinanceTabs />
      <PageHead title="Fees" sub={`October 2026 · ${fams.filter((f) => f.status !== 'paid').length} families have something due`}
        actions={<>
          <div className="toolrow">
            <Circle icon="search" label="Get challan by ID" onClick={() => setLookup(true)} />
            <Menu trigger={({ toggle }) => <Circle icon="print" label="Print" onClick={toggle} />}
              groups={[{ items: [{ label: 'Fee register', icon: 'sheet', onClick: () => (printView(), toast('Fee register PDF ready', { icon: 'print' })) }, { label: 'Defaulter list', icon: 'list', onClick: () => nav('/reports/defaulters') }, { label: 'Daily collection', icon: 'receipt', onClick: () => nav('/reports/daily-collection') }] }]} />
            <Circle icon="download" label="Export CSV / PDF" onClick={() => (exportCsv('Fee data exported'), toast('Fee data exported', { icon: 'download' }))} />
            <Circle icon="sliders" label="Fee settings" onClick={() => nav('/settings/fees')} />
          </div>
          <button className="btn primary" onClick={() => setChallans(true)}><Icon name="receipt" size={16} />Generate challans</button>
        </>} />

      <div className="row wrap gap-16" style={{ alignItems: 'stretch' }}>
        <section className="card-hero" style={{ flex: '2 1 520px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="row wrap between top" style={{ gap: 20 }}>
            <div>
              <div className="small muted">Collection rate</div>
              <div className="display" style={{ fontSize: 64, marginTop: 6 }}>{rate.toFixed(2)}<span style={{ fontSize: 24, opacity: .6 }}>%</span></div>
            </div>
            <div className="row gap-20">
              <div><div className="small muted">This month</div><div className="display" style={{ fontSize: 24, marginTop: 4 }}>{fmt(102500 + (collected - 103623))} PKR</div></div>
              <div><div className="small muted">All-time collected</div><div className="display" style={{ fontSize: 24, marginTop: 4 }}>{fmt(totalCollected)} PKR</div></div>
            </div>
          </div>
          <div className="row" style={{ gap: 3, height: 40 }}>{Array.from({ length: 64 }, (_, i) => <span key={i} style={{ flex: 1, height: '100%', borderRadius: 3, background: i < Math.round((rate / 100) * 64) ? 'var(--hero-accent)' : 'var(--hero-track)' }} />)}</div>
        </section>
        <section className="card" style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div className="small muted">Total due</div>
            <div className="display" style={{ fontSize: 48, marginTop: 6 }}>{fmt(totalDue)} <span className="unit">PKR</span></div>
            <div className="small muted mt-8">{fams.filter((f) => f.status === 'unpaid').length} unpaid · {fams.filter((f) => f.status === 'partial').length} partially paid families</div>
          </div>
          <button className="btn" disabled={!totalDue} onClick={() => setRemind(true)}><Icon name="send" size={15} />Send reminders to {fams.filter((f) => f.due).length} families</button>
        </section>
      </div>

      <div className="row wrap gap-8">
        <div className="tabs" role="tablist">
          {filters.map(([k, l, n]) => <button key={k} role="tab" className={cx('tab has-count', filter === k && 'on')} onClick={() => setFilter(k)}>{l}<span className="count">{n}</span></button>)}
        </div>
        <Seg ink lg value={by} onChange={setBy} items={[{ key: 'family', label: 'By family' }, { key: 'student', label: 'By student' }]} />
        <div className="grow" />
        <select aria-label="Filter by class" className="select" style={{ height: 44 }} value={cls} onChange={(e) => setCls(e.target.value)}><option value="all">Class: All</option>{db.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <Search value={q} onChange={setQ} placeholder="Family, student, roll number" lg />
      </div>

      <div className="split">
      <div className="wide col gap-8">
      {by === 'family' ? (
        <section className="col gap-8">
          {famRows.slice(0, limit).map((f) => {
            const isOpen = openRow === f.id;
            return (
              <article key={f.id} className={cx('card', payFor?.familyId === f.id && 'paying')} style={{ padding: 0, overflow: 'hidden' }}>
                <div className="row wrap" style={{ gap: 18, padding: '16px 18px' }}>
                  <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                    <div className="row gap-8"><Link to={`/finance/fees/${f.id}`} className="medium" style={{ fontSize: 16 }}>{f.name}</Link><span className={`pill ${tone(f.status)}`}>{label(f.status)}</span></div>
                    <div className="small muted mt-4 row gap-6">{f.id} · {f.phone}{f.waVerified && <span className="pill ok" style={{ height: 20, fontSize: 10 }}>WhatsApp</span>}</div>
                  </div>
                  <div style={{ flex: '2 1 300px', minWidth: 0 }}>
                    <div className="row between small"><span className="muted">Paid {fmt(f.paidTotal)} PKR</span><span className={cx('strong', f.due ? 'danger-text' : 'ok-text')}>{f.due ? `${fmt(f.due)} PKR due` : 'All paid'}</span></div>
                    <div className="meter mt-8" style={{ background: f.due ? 'var(--danger-soft)' : 'var(--track)' }}><span style={{ width: `${Math.max(2, (f.paidTotal / (f.paidTotal + f.due || 1)) * 100)}%`, background: 'var(--accent-dim)' }} /></div>
                    <div className="row between xs muted mt-8"><span>{f.kids.length} child{f.kids.length > 1 ? 'ren' : ''} · {f.kids.map((k) => k.name).join(', ')}</span>{f.credit > 0 && <span>Credit {fmt(f.credit)} PKR</span>}</div>
                  </div>
                  <div className="row gap-6">
                    {f.due > 0 ? <button className={cx('btn sm', payFor?.familyId === f.id && !payFor.studentId && 'primary')} onClick={() => pay(f.id)}>Pay</button> : <Link className="btn sm ghost" to={`/finance/fees/${f.id}`}>Details</Link>}
                    <button className="icon-btn sm" aria-label="Print challan" onClick={() => (printView(), toast(`Challan for ${f.name} ready`, { icon: 'print' }))}><Icon name="print" size={15} /></button>
                    <button className="icon-btn sm" aria-label="Send reminder" onClick={() => open('compose', { preset: 'reminder', familyId: f.id })}><Icon name="whatsapp" size={15} /></button>
                    <button className="icon-btn sm" aria-label={isOpen ? 'Hide children' : 'Show children'} aria-expanded={isOpen} onClick={() => setOpenRow(isOpen ? null : f.id)}><Icon name={isOpen ? 'chevUp' : 'chevDown'} size={15} /></button>
                  </div>
                </div>
                {isOpen && (
                  <div style={{ padding: '4px 18px 16px', borderTop: '1px solid var(--line)', background: 'var(--surface-2)', overflowX: 'auto' }}>
                    <div className="kid-head xs muted"><span>Student</span><span>Class</span><span className="num">Total fee</span><span className="num">Paid</span><span className="num">Remaining</span><span className="num">This month</span><span>Status</span><span /></div>
                    {f.kids.map((k) => {
                      const billed = (k.history || []).filter((h) => h.kind === 'charge').reduce((a, h) => a + h.amount, 0);
                      const paid = (k.history || []).filter((h) => h.kind === 'payment').reduce((a, h) => a + h.amount, 0);
                      const month = (k.history || []).filter((h) => h.kind === 'payment' && h.date.startsWith('2026-10')).reduce((a, h) => a + h.amount, 0);
                      const due = dueOf(k);
                      return (
                        <div key={k.id} className="kid-row">
                          <span className="person"><Avatar name={k.name} id={k.id} size={30} /><span><Link to={`/finance/fees/${f.id}?student=${k.id}`} className="nm">{k.name}</Link><span className="id">{code(k)}</span></span></span>
                          <span className="small">{classById[k.classId]?.name}<span className="xs muted" style={{ display: 'block' }}>{k.section}</span></span>
                          <span className="num small">{fmt(billed)}</span>
                          <span className="num small ok-text">{fmt(paid)}</span>
                          <span className={cx('num small', due && 'danger-text')}>{fmt(due)}</span>
                          <span className="num small">{fmt(month)}</span>
                          <span><span className={`pill ${!due ? 'ok' : paid ? 'warn' : 'danger'}`}>{!due ? 'Paid' : paid ? 'Partial' : 'Unpaid'}</span></span>
                          <span className="row gap-4">
                            {due > 0 && <button className={cx('btn xs', payFor?.studentId === k.id && 'primary')} onClick={() => pay(f.id, k.id)}>Pay</button>}
                            <button className="icon-btn xs" aria-label={`Print challan for ${k.name}`} onClick={() => { printView(); toast(`Challan for ${k.name} — choose Save as PDF`, { icon: 'print' }); }}><Icon name="print" size={13} /></button>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </article>
            );
          })}
          {famRows.length > limit && <div className="row" style={{ justifyContent: 'center' }}><button className="btn" onClick={() => setLimit(limit + 40)}>Show {Math.min(40, famRows.length - limit)} more families · {famRows.length - limit} left</button></div>}
          {!famRows.length && <section className="card"><Empty icon="check" title={filter === 'paid' ? 'No fully-paid families yet' : 'Nothing to collect here'}>{filter !== 'paid' && `${fams.filter((f) => f.status === 'paid').length} families are fully paid.`}</Empty></section>}
        </section>
      ) : (
        <section className="card pad-s">
          <div className="table-wrap"><table className="table" style={{ minWidth: 760 }}>
            <thead><tr><th>Student</th><th>Class</th><th>Family</th><th>Unpaid items</th><th>Due</th><th /></tr></thead>
            <tbody>{stuRows.slice(0, limit * 2).map((s) => (
              <tr key={s.id}>
                <td><Link to={`/finance/fees/${s.fam.id}?student=${s.id}`} className="person"><Avatar name={s.name} id={s.id} size={34} /><span><span className="nm">{s.name}</span><span className="id">{code(s)}</span></span></Link></td>
                <td>{classById[s.classId]?.name} · {s.section}</td>
                <td><Link to={`/finance/fees/${s.fam.id}?student=${s.id}`}>{s.fam.name}</Link><div className="xs muted">{s.fam.id}</div></td>
                <td className="small muted">{s.dues.map((d) => d.label).join(', ') || '—'}</td>
                <td><span className={`pill ${dueOf(s) ? 'danger' : 'ok'}`}>{dueOf(s) ? `${fmt(dueOf(s))} PKR` : 'Clear'}</span></td>
                <td className="right">{dueOf(s) > 0 && <button className={cx('btn xs', payFor?.studentId === s.id && 'primary')} onClick={() => pay(s.fam.id, s.id)}>Pay</button>}</td>
              </tr>
            ))}</tbody>
          </table></div>
          {stuRows.length > limit * 2 && <div className="row" style={{ justifyContent: 'center', padding: 10 }}><button className="btn" onClick={() => setLimit(limit + 40)}>Show more students · {stuRows.length - limit * 2} left</button></div>}
          {!stuRows.length && <Empty icon="check" title="Nothing here" />}
        </section>
      )}
      </div>
      </div>

      {challans && <ChallanWizard onClose={() => setChallans(false)} fams={fams} />}
      {lookup && <ChallanLookup onClose={() => setLookup(false)} />}
      {remind && <ReminderWizard fams={fams} onClose={() => setRemind(false)} />}
    </div>
  );
}

function ChallanWizard({ onClose, fams }) {
  const { db, toast } = useSchool();
  const [step, setStep] = useState(0);
  const [scope, setScope] = useState('school');
  const [months, setMonths] = useState(['Oct 2026']);
  const [due, setDue] = useState('2026-10-15');
  const [pick, setPick] = useState(() => Object.fromEntries(fams.map((f) => [f.id, true])));
  const steps = ['Scope', 'Fee months', 'Who', 'Confirm'];
  const chosen = fams.filter((f) => pick[f.id]);
  const scopes = [['school', 'Full school', 'Every family with students', 'school'], ['family', 'By family', 'Pick specific families', 'family'], ['class', 'By class', 'One class or section', 'academics']];
  return (
    <Modal open onClose={onClose} wide title="Generate challans" sub={`Step ${step + 1} of 4 · ${steps[step]}`}
      footer={<>
        {step > 0 && <button className="btn ghost" onClick={() => setStep(step - 1)}>Back</button>}
        <div className="grow" />
        {step < 3 ? <button className="btn primary" onClick={() => setStep(step + 1)}>Continue<Icon name="arrowRight" size={15} /></button>
          : <button className="btn primary" onClick={() => { toast(`${chosen.length} challans generated · sent on WhatsApp`, { icon: 'receipt' }); onClose(); }}><Icon name="download" size={15} />Generate {chosen.length} challans</button>}
      </>}>
      <div className="steps">{steps.map((s, i) => <span key={s} className={cx(i <= step && 'on')} />)}</div>
      {step === 0 && (
        <div className="grid g3">
          {scopes.map(([k, l, d, i]) => (
            <button key={k} onClick={() => setScope(k)} className="card col gap-8" style={{ padding: 18, textAlign: 'left', borderColor: scope === k ? 'var(--text)' : 'var(--border)', borderWidth: scope === k ? 1.5 : 1, font: 'inherit' }}>
              <Icon name={i} size={22} /><span className="medium">{l}</span><span className="small muted">{d}</span>
            </button>
          ))}
        </div>
      )}
      {step === 1 && (
        <div className="col gap-12">
          <span className="label">Include fees for</span>
          <div className="row wrap gap-8">{['Sep 2026', 'Oct 2026', 'Nov 2026', 'Dec 2026'].map((m) => <button key={m} className={cx('chip', months.includes(m) && 'on')} onClick={() => setMonths(months.includes(m) ? months.filter((x) => x !== m) : [...months, m])}>{m}</button>)}</div>
          <div className="form-grid">
            <label className="field"><span>Due date</span><input className="input" type="date" value={due} onChange={(e) => setDue(e.target.value)} /></label>
            <div className="tile"><div className="k">Late fee after due date</div><div className="v">500 PKR · fixed</div><Link to="/settings/fees" className="xs link">Change in settings</Link></div>
          </div>
          <div className="banner info small"><Icon name="bolt" size={16} />Arrears and fines already on each family are added automatically.</div>
        </div>
      )}
      {step === 2 && (
        <div className="col gap-4">
          <div className="row between"><span className="label">{chosen.length} of {fams.length} families</span><button className="link small" onClick={() => setPick(Object.fromEntries(fams.map((f) => [f.id, chosen.length !== fams.length])))}>{chosen.length === fams.length ? 'Clear all' : 'Select all'}</button></div>
          {fams.map((f) => (
            <label key={f.id} className="row" style={{ gap: 12, padding: '10px 6px', borderBottom: '1px solid var(--line)', cursor: 'pointer' }}>
              <input type="checkbox" className="check" checked={!!pick[f.id]} onChange={() => setPick({ ...pick, [f.id]: !pick[f.id] })} />
              <span className="grow"><span className="medium">{f.name}</span> <span className="small muted">· {f.id} · {f.kids.length} child{f.kids.length > 1 ? 'ren' : ''}</span></span>
              <span className="small">{fmt(f.due + f.kids.reduce((a, k) => a + (db.classes.find((c) => c.id === k.classId)?.fee || 0), 0) * (months.length - 1))} PKR</span>
            </label>
          ))}
        </div>
      )}
      {step === 3 && (
        <div className="grid g3">
          <div className="tile"><div className="k">Challans</div><div className="v">{chosen.length}</div></div>
          <div className="tile"><div className="k">Months</div><div className="v">{months.join(', ')}</div></div>
          <div className="tile"><div className="k">Due on</div><div className="v">{due.split('-').reverse().join('/')}</div></div>
          <div className="banner ok small" style={{ gridColumn: '1 / -1' }}><Icon name="whatsapp" size={16} />Each family gets their challan on WhatsApp. A combined PDF downloads for printing.</div>
        </div>
      )}
    </Modal>
  );
}

function ChallanLookup({ onClose }) {
  const { db, open } = useSchool();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [res, setRes] = useState(null);
  const find = () => {
    const ids = q.split(/[\s,]+/).map((x) => x.trim().toUpperCase()).filter(Boolean);
    setRes(ids.map((id) => {
      const c = (db.challans || []).find((x) => x.id.toUpperCase() === id || x.id.toUpperCase().endsWith(id.replace(/^SN7-?/, '').padStart(8, '0')));
      return c ? { ...c, fam: db.families.find((f) => f.id === c.familyId) } : { id, missing: true };
    }));
  };
  const tone = { paid: 'ok', unpaid: 'danger', 'partly paid': 'info', superseded: 'outline' };
  return (
    <Modal open onClose={onClose} title="Get challan" sub="Type or scan one or more challan IDs, separated by commas"
      footer={<><button className="btn ghost" onClick={onClose}>Close</button><button className="btn primary" disabled={!q.trim()} onClick={find}><Icon name="search" size={15} />Look up</button></>}>
      <Field label="Challan ID(s)"><input className="input" autoFocus value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') find(); }} placeholder="SN7-00000096, 95" /></Field>
      {res && res.map((r) => (r.missing ? (
        <div key={r.id} className="banner warn"><Icon name="warn" size={16} />No challan found with ID {r.id}.</div>
      ) : (
        <div key={r.id} className="stack-card" style={{ marginTop: 0 }}>
          <span className="circle sm"><Icon name="receipt" size={15} /></span>
          <span className="grow"><span className="medium" style={{ display: 'block' }}>{r.id} · {r.fam?.name} ({r.familyId})</span><span className="xs muted">{r.scope} · {fmt(r.amount)} PKR · issued {r.issued}{r.due ? ` · due ${r.due}` : ''}{r.paidOn ? ` · paid ${r.paidOn}` : ''}</span></span>
          <span className={`pill ${tone[r.status] || 'outline'}`}>{r.status}</span>
          {r.status === 'superseded' && <span className="xs muted">A newer challan replaced it</span>}
          {(r.status === 'unpaid' || r.status === 'partly paid') && <button className="btn xs" onClick={() => { onClose(); open('collect', { familyId: r.familyId }); }}>Pay</button>}
          <button className="btn xs ghost" onClick={() => { onClose(); nav(`/finance/fees/${r.familyId}`); }}>Details</button>
        </div>
      )))}
    </Modal>
  );
}

function ReminderWizard({ fams, onClose }) {
  const { db, sendAnnouncement, toast } = useSchool();
  const [step, setStep] = useState(0);
  const [range, setRange] = useState(0);
  const [who, setWho] = useState('all');
  const [wa, setWa] = useState(true);
  const [sms, setSms] = useState(false);
  const [email, setEmail] = useState(false);
  const due = fams.filter((f) => f.due > 0);
  const chosen = due.filter((f) => (who === 'unpaid' ? f.status === 'unpaid' : who === 'partial' ? f.status === 'partial' : true));
  const sample = chosen[0];
  const extra = (f) => range ? f.kids.reduce((a, k) => a + (db.classes.find((c) => c.id === k.classId)?.fee || 0), 0) * range : 0;
  const skipped = chosen.filter((f) => wa && !f.waVerified).length;
  const steps = ['Fee range', 'Channels & preview', 'Confirm'];
  return (
    <Modal open onClose={onClose} wide title="Send fee reminders" sub={`Step ${step + 1} of 3 · ${steps[step]}`}
      footer={<>{step > 0 && <button className="btn ghost" onClick={() => setStep(step - 1)}>Back</button>}<div className="grow" />
        {step < 2 ? <button className="btn primary" disabled={!chosen.length} onClick={() => setStep(step + 1)}>Continue<Icon name="arrowRight" size={15} /></button>
          : <button className="btn primary" onClick={() => { sendAnnouncement({ title: 'Fee reminder', type: 'Fee reminder', body: `Fee reminder sent to ${chosen.length} families`, app: [chosen.length, chosen.length], wa: wa ? [chosen.length - skipped, chosen.length] : [0, 0] }); toast(`Reminders sent to ${chosen.length} families${skipped ? ` · ${skipped} WhatsApp skipped (not verified)` : ''}`, { icon: 'send' }); onClose(); }}><Icon name="send" size={15} />Send to {chosen.length}</button>}
      </>}>
      <div className="steps">{steps.map((x, i) => <span key={x} className={cx(i <= step && 'on')} />)}</div>
      {step === 0 && (<>
        <div className="col gap-8"><span className="label">Include</span>
          <div className="row wrap gap-6">{[[0, 'Current pending only'], [1, '+ next month'], [2, '+ 2 months'], [3, '+ 3 months'], [6, '+ 6 months'], [12, '+ 1 year']].map(([k, l]) => <button key={k} className={cx('chip sm', range === k && 'on')} onClick={() => setRange(k)}>{l}</button>)}</div>
        </div>
        <div className="col gap-8"><span className="label">Families</span>
          <div className="row wrap gap-6">{[['all', `All pending · ${due.length}`], ['unpaid', `Unpaid only · ${due.filter((f) => f.status === 'unpaid').length}`], ['partial', `Partially paid · ${due.filter((f) => f.status === 'partial').length}`]].map(([k, l]) => <button key={k} className={cx('chip sm', who === k && 'on')} onClick={() => setWho(k)}>{l}</button>)}</div>
        </div>
        <div className="col" style={{ gap: 0 }}>{chosen.map((f) => <div key={f.id} className="row between small" style={{ padding: '8px 0', borderTop: '1px solid var(--line)' }}><span>{f.name} <span className="muted">· {f.id}</span></span><span className="medium">{fmt(f.due + extra(f))} PKR</span></div>)}</div>
      </>)}
      {step === 1 && (
        <div className="split" style={{ gap: 16 }}>
          <div className="col gap-10" style={{ flex: '1 1 260px' }}>
            <div className="row between"><span className="small">App notification</span><span className="pill ok">Always</span></div>
            <div className="row between"><span className="small">WhatsApp</span><OnOff value={wa} onChange={setWa} /></div>
            <div className="row between"><span className="small">SMS (phone SIM)</span><OnOff value={sms} onChange={setSms} /></div>
            <div className="row between"><span className="small">Email</span><OnOff value={email} onChange={setEmail} /></div>
            {skipped > 0 && wa && <div className="banner warn small"><Icon name="warn" size={16} />{skipped} families aren’t WhatsApp-verified and will get the app notification only.</div>}
          </div>
          <div style={{ flex: '1 1 240px', borderRadius: 24, background: '#0B141A', padding: 14 }}>
            <div style={{ background: '#005C4B', color: '#E9EDEF', padding: '10px 12px', borderRadius: '14px 14px 4px 14px', fontSize: 13, lineHeight: 1.5 }}>
              Assalam o Alaikum, dear family of {sample?.kids.map((k) => k.name).join(', ')}.<br />Pending dues: <strong>{fmt((sample?.due || 0) + (sample ? extra(sample) : 0))} PKR</strong>{range ? ` (incl. next ${range} month${range > 1 ? 's' : ''})` : ''}.<br />Kindly clear them at your earliest. JazakAllah!
            </div>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="grid g3">
          <div className="tile"><div className="k">Families</div><div className="v">{chosen.length}</div></div>
          <div className="tile"><div className="k">Total requested</div><div className="v">{fmt(chosen.reduce((a, f) => a + f.due + extra(f), 0))} PKR</div></div>
          <div className="tile"><div className="k">Channels</div><div className="v">{['App', wa && 'WhatsApp', sms && 'SMS', email && 'Email'].filter(Boolean).join(', ')}</div></div>
        </div>
      )}
    </Modal>
  );
}
