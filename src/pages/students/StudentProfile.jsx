import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import { Circle, OnOff } from '../../components/Bento.jsx';
import { Avatar, Empty, Menu } from '../../components/ui.jsx';
import { useSchool, dueOf, code } from '../../lib/store.jsx';
import { avClass, cx, dateLong, dateShort, fmt, initials, time } from '../../lib/format.js';
import { discountAmount, discountLabel, monthlyBill, netFee, recurringTotal, remarkFor, statement } from '../../lib/student.js';
import { periods } from '../../data/seed.js';
import NotFound from '../NotFound.jsx';
import { exportCsv, printView } from '../../lib/exporter.js';
import {
  AchievementModal, CertificateModal, ChangeFamilyModal, ChargeModal, DiscountModal, EditStudentModal,
  ObservationModal, RecurringModal, SectionModal, TerminateModal, UploadDocModal,
} from './StudentModals.jsx';

// Deterministic sample attendance history (days before today), from admission day.
export function historyFor(id, admitted, month = 10) {
  const days = {};
  const start = admitted && admitted.startsWith(`2026-${String(month).padStart(2, '0')}`) ? Number(admitted.slice(8, 10)) : 1;
  if (admitted && admitted > `2026-${String(month).padStart(2, '0')}-31`) return days;
  let h = month * 131; for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const last = month === 10 ? 8 : new Date(2026, month, 0).getDate();
  for (let d = 1; d <= last; d++) {
    const dt = new Date(2026, month - 1, d);
    h = (h * 1103515245 + 12345) >>> 0;
    if (dt.getDay() === 0 || d < start) continue;
    const r = h % 100;
    days[d] = r < 78 ? 'P' : r < 87 ? 'L' : r < 95 ? 'A' : 'V';
  }
  return days;
}

const ATT = { P: ['Present', 'ok'], L: ['Late', 'warn'], A: ['Absent', 'danger'], V: ['Leave', 'info'] };
const softOf = (tone) => (tone === 'ok' ? 'var(--accent-soft)' : tone === 'muted' ? 'var(--surface-2)' : `var(--${tone}-soft)`);
const fgOf = (tone) => (tone === 'ok' ? 'var(--accent-text)' : tone === 'muted' ? 'var(--text)' : `var(--${tone})`);
const grade = (p) => (p >= 90 ? 'A+' : p >= 80 ? 'A' : p >= 70 ? 'B' : p >= 60 ? 'C' : p >= 50 ? 'D' : 'F');
const CAT = { monthly: 'Monthly fee', recurring: 'Recurring', onetime: 'One-time', fine: 'Fine', other: 'Charge' };
const CAT_ICON = { monthly: 'receipt', recurring: 'repeat', onetime: 'doc', fine: 'fine', other: 'receipt' };

export function Row({ icon, title, sub, right, tone = 'muted' }) {
  return (
    <div className="row" style={{ gap: 12, padding: '10px 0', borderTop: '1px solid var(--line)' }}>
      <span className="circle xs" style={{ background: softOf(tone), color: fgOf(tone), boxShadow: 'none' }}><Icon name={icon} size={13} /></span>
      <span className="grow" style={{ minWidth: 0 }}><span className="small medium ellipsis" style={{ display: 'block' }}>{title}</span>{sub && <span className="xs muted ellipsis" style={{ display: 'block' }}>{sub}</span>}</span>
      {right}
    </div>
  );
}

export default function StudentProfile() {
  const { id } = useParams();
  const nav = useNavigate();
  const school = useSchool();
  const { db, active, classById, familyById, kidsOf, todayAtt, open, toast, readmit, mark, today, waiveFine } = school;
  const s = db.students.find((x) => x.id === id);
  const [feeView, setFeeView] = useState('Statement');
  const [acad, setAcad] = useState('Results');
  const [modal, setModal] = useState(null);
  const [attMonth, setAttMonth] = useState(10);
  const [actFilter, setActFilter] = useState('All');
  const [stFilter, setStFilter] = useState('All');
  const [hideInsight, setHideInsight] = useState(false);

  const list = active.length ? active : db.students;
  const idx = Math.max(0, list.findIndex((x) => x.id === id));
  const oct = useMemo(() => (s ? historyFor(s.id, s.admitted, 10) : {}), [s]);
  const sep = useMemo(() => (s ? historyFor(s.id, s.admitted, 9) : {}), [s]);
  if (!s) return <NotFound />;

  const fam = familyById[s.familyId];
  const cls = classById[s.classId];
  const due = dueOf(s);
  const siblings = kidsOf(s.familyId).filter((k) => k.id !== s.id);
  const rows = statement(s.history || []);
  const payments = rows.filter((r) => r.kind === 'payment');
  const lastPay = payments[payments.length - 1];
  const totalPaid = payments.reduce((a, r) => a + r.amount, 0);
  const totalCharged = rows.filter((r) => r.kind === 'charge').reduce((a, r) => a + r.amount, 0);
  const octMarks = { ...oct, ...(todayAtt[s.id] ? { 9: todayAtt[s.id] } : {}) };
  const marks = attMonth === 10 ? octMarks : sep;
  const counts = Object.values(marks).reduce((a, v) => ({ ...a, [v]: (a[v] || 0) + 1 }), {});
  const rate = (m) => { const n = Object.keys(m).length; if (!n) return null; const c = Object.values(m).filter((v) => v === 'P' || v === 'L').length; return Math.round((c / n) * 100); };
  const attRate = rate(marks);
  const octRate = rate(octMarks);
  const missing = [['Date of birth', s.dob], ['B-Form', s.bform], ['Blood group', s.blood], ['Mother’s name', fam.mother], ['Address', fam.address]].filter(([, v]) => !v).map(([k]) => k);
  const exams = db.exams.filter((e) => e.results[s.id]).map((e) => {
    const r = e.results[s.id];
    const tot = e.subjects.reduce((a, [n]) => a + (r[n] || 0), 0);
    const max = e.subjects.reduce((a, [, m]) => a + m, 0);
    return { ...e, r, tot, max, pct: Math.round((tot / max) * 100) };
  }).sort((a, b) => b.date.localeCompare(a.date));
  const obs = db.observations.filter((o) => o.studentId === s.id);
  const docs = db.documents.filter((d) => d.owner.includes(code(s)));
  const slots = db.timetable.filter((t) => t.classId === s.classId && t.section === s.section);
  const terminated = s.status !== 'active';

  const payByMonth = {};
  payments.forEach((p) => { const k = p.date.slice(0, 7); payByMonth[k] = (payByMonth[k] || 0) + p.amount; });
  const payMonths = [...new Set(rows.map((r) => r.date.slice(0, 7)))].sort();
  const payMax = Math.max(1, ...Object.values(payByMonth));

  const activity = (() => {
    const out = [];
    (s.history || []).forEach((h) => {
      if (h.kind === 'payment') out.push({ k: 'p' + h.id, type: 'Fees', icon: 'cash', tone: 'ok', title: `Paid ${fmt(h.amount)} PKR`, sub: `${h.method}${h.receipt ? ` · ${h.receipt}` : ''}`, when: h.date });
      else if (h.kind === 'waiver') out.push({ k: 'w' + h.id, type: 'Fees', icon: 'check', tone: 'info', title: h.label, sub: `${fmt(h.amount)} PKR`, when: h.date });
      else if (h.cat === 'fine') out.push({ k: 'f' + h.id, type: 'Fees', icon: 'fine', tone: 'warn', title: h.label, sub: `${fmt(h.amount)} PKR added to dues`, when: h.date });
      else if (h.cat === 'monthly') out.push({ k: 'm' + h.id, type: 'Fees', icon: 'receipt', tone: 'muted', title: `${h.label} billed`, sub: `${fmt(h.amount)} PKR`, when: h.date });
    });
    Object.entries(octMarks).forEach(([d, v]) => { if (v !== 'P') out.push({ k: 'a' + d, type: 'Attendance', icon: v === 'V' ? 'leave' : 'clock', tone: ATT[v][1], title: `Marked ${ATT[v][0].toLowerCase()}`, sub: remarkFor(s.id, Number(d), v) || '—', when: `2026-10-${String(d).padStart(2, '0')}T08:10` }); });
    db.announcements.filter((a) => a.body.includes(s.name)).forEach((a) => out.push({ k: 'n' + a.id, type: 'Messages', icon: 'whatsapp', tone: fam.waVerified ? 'ok' : 'warn', title: `“${a.title}” sent to parents`, sub: fam.waVerified ? 'Delivered on WhatsApp and the app' : 'WhatsApp skipped — number not verified · app only', when: `${a.date}T09:00` }));
    exams.forEach((e) => out.push({ k: 'e' + e.id, type: 'Academics', icon: 'exam', tone: 'muted', title: `Result: ${e.name}`, sub: `${e.tot}/${e.max} · ${e.pct}% · grade ${grade(e.pct)}`, when: `${e.date}T12:00` }));
    obs.forEach((o) => out.push({ k: 'o' + o.id, type: 'Academics', icon: 'observe', tone: 'muted', title: `Observation by ${o.reviewer}`, sub: o.note || 'No note', when: `${o.date}T13:00` }));
    docs.forEach((d) => out.push({ k: 'd' + d.id, type: 'Profile', icon: 'doc', tone: 'muted', title: `${d.title} created`, sub: d.type, when: d.date }));
    db.activity.filter((a) => a.what.includes(s.name) || a.what.includes(code(s)) || a.what.includes(s.id)).forEach((a) => out.push({ k: a.id, type: 'Profile', icon: 'edit', tone: 'muted', title: `${a.who} ${a.what}`, sub: '', when: a.when }));
    out.push({ k: 'adm', type: 'Profile', icon: 'userPlus', tone: 'ok', title: `Admitted to ${cls?.name} · ${s.section}`, sub: `Family ${fam.name} (${fam.id})`, when: `${s.admitted}T09:00` });
    return out.sort((a, b) => b.when.localeCompare(a.when));
  })();

  const months = [...new Set(rows.map((r) => r.date.slice(0, 7)))];
  const shownRows = stFilter === 'All' ? rows : rows.filter((r) => r.date.startsWith(stFilter));

  const SECTIONS = [['overview', 'Overview'], ['attendance', 'Attendance'], ['academics', 'Academics'], ['fees', 'Fees'], ['documents', 'Documents'], ['activity', 'Activity']];
  const jump = (k) => document.getElementById(`sec-${k}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const collect = () => nav(`/finance/fees/${fam.id}?student=${s.id}`);

  return (
    <div className="page student-page">
      <div className="row between">
        <Link to="/students" className="back-pill"><span className="circle xs"><Icon name="chevLeft" size={14} /></span>Students</Link>
        <div className="row gap-6 small muted">
          {idx + 1} of {list.length}
          <Circle icon="chevLeft" size="sm" label="Previous" onClick={() => nav(`/students/${list[(idx - 1 + list.length) % list.length].id}`)} />
          <Circle icon="chevRight" size="sm" label="Next" onClick={() => nav(`/students/${list[(idx + 1) % list.length].id}`)} />
        </div>
      </div>

      <div className="student-layout">
        {/* The child's card: who they are, who to call, and every action */}
        <aside className="student-card">
          <div className="student-card-top">
            <span className={cx('av', avClass(s.id))} style={{ width: 112, height: 112, fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 500, opacity: terminated ? 0.6 : 1 }}>{initials(s.name)}</span>
            <h1 className="student-name">{s.name}</h1>
            <div className="row wrap gap-6" style={{ justifyContent: 'center' }}>
              <span className="chip-static">{code(s)}</span>
              <span className="chip-static">{cls?.name} · {s.section}</span>
              {s.roll && <span className="chip-static">Roll {s.roll}</span>}
              {terminated ? <span className="pill danger lg">Terminated</span> : <span className="pill ok lg">Active</span>}
            </div>
          </div>

          <div className="student-main-acts">
            {terminated
              ? <button className="btn grow" onClick={() => { readmit(s.id); toast(`${s.name} is active again`); }}><Icon name="refresh" size={15} />Activate</button>
              : due > 0 ? <button className="btn primary grow" onClick={collect}><Icon name="cash" size={15} />Collect {fmt(due)}</button>
                : <button className="btn grow" onClick={() => setModal('edit')}><Icon name="edit" size={15} />Edit</button>}
            <button className="btn grow" onClick={() => open('compose', { familyId: fam.id })}><Icon name="whatsapp" size={15} />Message</button>
            <Menu
              align="right"
              width={240}
              trigger={({ toggle }) => <Circle icon="more" label="More actions" onClick={toggle} />}
              groups={[
                { label: 'Record', items: [
                  ...(due > 0 || terminated ? [{ label: 'Edit details', icon: 'edit', onClick: () => setModal('edit') }] : []),
                  { label: 'Change section', icon: 'layers', onClick: () => setModal('section') },
                  { label: 'Promote', icon: 'arrowUpRight', onClick: () => setModal('promote') },
                  { label: 'Change family', icon: 'family', onClick: () => setModal('family') },
                ] },
                { label: 'Fees', items: [
                  { label: 'Discount', icon: 'fund', onClick: () => setModal('discount') },
                  ...(terminated ? [] : [{ label: 'Add fine', icon: 'fine', onClick: () => open('fine', { studentId: s.id }) }]),
                  { label: 'Recurring charge', icon: 'repeat', onClick: () => setModal('recurring') },
                  { label: 'One-time charge', icon: 'plus', onClick: () => setModal('charge') },
                  { label: 'Fee statement', icon: 'print', onClick: () => { printView(); toast('Fee statement — choose Save as PDF', { icon: 'print' }); } },
                ] },
                { label: 'Documents', items: [
                  { label: 'Upload document', icon: 'upload', onClick: () => setModal('upload') },
                  terminated ? { label: 'Leaving certificate', icon: 'doc', onClick: () => setModal('leaving') } : { label: 'Certificate', icon: 'award', onClick: () => setModal('certificate') },
                  { label: 'Observation', icon: 'observe', onClick: () => setModal('observation') },
                ] },
                ...(terminated ? [] : [{ items: [{ label: 'Terminate', icon: 'logout', danger: true, onClick: () => setModal('terminate') }] }]),
              ]}
            />
          </div>

          <div className="student-fam">
            <div className="row between"><span className="xs muted">Family</span><Link to={`/students/families/${fam.id}`} className="xs link">Open</Link></div>
            <div className="medium mt-4">{fam.name} <span className="xs muted">· {fam.id}</span></div>
            <div className="row between mt-8">
              <span className="small">{fam.phone}</span>
              <span className="row gap-6">
                <a className="circle xs ghost" href={`tel:${fam.phone}`} aria-label="Call"><Icon name="phone" size={12} /></a>
                <a className="circle xs ghost" href={`https://wa.me/${(fam.whatsapp || fam.phone).replace(/\D/g, '')}`} target="_blank" rel="noreferrer" aria-label="WhatsApp"><Icon name="whatsapp" size={12} /></a>
                <Circle icon="send" size="xs" iconSize={12} label="Send message" onClick={() => open('compose', { familyId: fam.id })} />
              </span>
            </div>
            <div className="row wrap gap-6 mt-8">{fam.waVerified ? <span className="pill ok">WhatsApp verified</span> : <span className="pill warn">WhatsApp not verified</span>}{fam.app && <span className="pill outline">Parent app</span>}</div>
            {siblings.length > 0 && <div className="row gap-6 mt-12 xs muted">Siblings {siblings.map((k) => <Link key={k.id} to={`/students/${k.id}`} title={k.name}><Avatar name={k.name} id={k.id} size={26} /></Link>)}</div>}
          </div>

          <dl className="student-dl">
            {[['Gender', s.gender], ['Date of birth', s.dob ? dateShort(s.dob) : null], ['B-Form', s.bform], ['Blood group', s.blood], ['Religion', s.religion], ['Admitted', dateShort(s.admitted)], ['Previous school', s.prevSchool], ...(s.customFields || [])].map(([k, v]) => (
              <div key={k}><dt>{k}</dt><dd>{v || <button className="add" onClick={() => setModal('edit')}>+ Add</button>}</dd></div>
            ))}
          </dl>
        </aside>

        <div className="student-record">
          <nav className="student-jump" aria-label="Sections">
            {SECTIONS.map(([k, l]) => <button key={k} onClick={() => jump(k)}>{l}</button>)}
            <div className="grow" />
          </nav>

          <section id="sec-overview" className="record-sec">
            {terminated && (
              <div className="insight" style={{ marginBottom: 12 }}>
                <Circle icon="warn" tone="danger" size="sm" tabIndex={-1} />
                <div className="grow"><h3>Terminated {s.terminatedOn ? `on ${dateShort(s.terminatedOn)}` : ''}</h3><p className="small muted mt-4">Monthly fees have stopped. Anything still owed stays on the family; records are kept.</p></div>
                <button className="btn sm" onClick={() => { readmit(s.id); toast(`${s.name} is active again`); }}>Activate</button>
              </div>
            )}
            <div className="record-numbers">
              <div><span className="xs muted">Attendance · October</span><span className="display">{octRate == null ? '—' : `${octRate}%`}</span><span className="xs muted">{todayAtt[s.id] ? `Today: ${ATT[todayAtt[s.id]][0]}` : 'Today not marked'}</span></div>
              <div><span className="xs muted">Last result</span><span className="display">{exams[0] ? `${exams[0].pct}%` : '—'}</span><span className="xs muted">{exams[0] ? `${exams[0].name} · grade ${grade(exams[0].pct)}` : 'No results yet'}</span></div>
              <div><span className="xs muted">Fees due</span><span className={cx('display', due && 'danger-text')}>{fmt(due)}</span><span className="xs muted">{s.dues.length} item{s.dues.length === 1 ? '' : 's'} · paid {fmt(totalPaid)} so far</span></div>
              <div><span className="xs muted">Monthly fee</span><span className="display">{fmt(monthlyBill(s, cls))}</span><span className="xs muted">{discountAmount(s, cls) ? `${discountLabel(s)} discount` : 'No discount'}{recurringTotal(s) ? ` · incl. ${fmt(recurringTotal(s))} recurring` : ''}</span></div>
            </div>
            {!hideInsight && (missing.length > 0 || !fam.waVerified) && (
              <div className="insight mt-12">
                <Circle icon="close" size="sm" label="Dismiss" onClick={() => setHideInsight(true)} />
                <div className="grow" style={{ minWidth: 0 }}>
                  <h3>{!fam.waVerified ? 'Parents aren’t getting WhatsApp messages' : `Profile is missing ${missing.length} details`}</h3>
                  <p className="small muted mt-4" style={{ lineHeight: 1.5 }}>{!fam.waVerified ? 'The family’s number isn’t verified, so receipts and absence alerts are skipped. ' : ''}{missing.length > 0 && <>Missing: {missing.join(', ')}.</>}</p>
                </div>
                {!fam.waVerified ? <Circle icon="whatsapp" label="Verify number" onClick={() => nav(`/students/families/${fam.id}`)} /> : <Circle icon="edit" label="Complete profile" onClick={() => setModal('edit')} />}
              </div>
            )}
          </section>

          <section id="sec-attendance" className="record-sec">
            <div className="record-head"><h2 className="h2 sm">Attendance</h2><div className="grow" />
              <Circle icon="chevLeft" size="sm" label="September" onClick={() => setAttMonth(9)} />
              <span className="small medium" style={{ minWidth: 92, textAlign: 'center' }}>{attMonth === 10 ? 'October' : 'September'}</span>
              <Circle icon="chevRight" size="sm" label="October" onClick={() => setAttMonth(10)} />
            </div>
            {(
                <div className="col gap-16">
                  <div className="row wrap gap-6">
                    <span className="pill outline lg">{attRate == null ? '—' : `${attRate}%`} present</span>
                    {Object.keys(ATT).map((k) => <span key={k} className="pill lg" style={{ background: softOf(ATT[k][1]), color: fgOf(ATT[k][1]) }}>{ATT[k][0]} {counts[k] || 0}</span>)}
                    <span className="grow" />
                    {attMonth === 10 && !todayAtt[s.id] && !terminated && (
                      <span className="row gap-6"><span className="small muted">Today</span>{Object.keys(ATT).map((k) => <button key={k} className="chip sm" style={{ height: 32 }} onClick={() => { mark(today, s.id, k); toast(`${s.name} marked ${ATT[k][0].toLowerCase()}`, { undo: () => mark(today, s.id, null) }); }}>{ATT[k][0]}</button>)}</span>
                    )}
                  </div>
                  <div className="grid" style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 6 }}>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <div key={d} className="xs faint" style={{ textAlign: 'center' }}>{d}</div>)}
                    {Array.from({ length: (new Date(2026, attMonth - 1, 1).getDay() + 6) % 7 }, (_, i) => <div key={'b' + i} />)}
                    {Array.from({ length: new Date(2026, attMonth, 0).getDate() }, (_, i) => {
                      const d = i + 1;
                      const v = marks[d];
                      const sunday = new Date(2026, attMonth - 1, d).getDay() === 0;
                      const isToday = attMonth === 10 && d === 9;
                      const future = attMonth === 10 && d > 9;
                      const rmk = v ? remarkFor(s.id, d, v) : '';
                      return (
                        <div key={d} title={v ? `${ATT[v][0]}${rmk ? ' · ' + rmk : ''}` : ''} style={{ aspectRatio: '1.2', borderRadius: 16, padding: 8, background: v && v !== 'P' ? softOf(ATT[v][1]) : v === 'P' ? 'var(--surface-2)' : 'transparent', color: v && v !== 'P' ? fgOf(ATT[v][1]) : v ? 'var(--text)' : 'var(--faint)', border: isToday ? '1.5px solid var(--text)' : future || (!v && !sunday) ? '1px dashed var(--border)' : '1px solid transparent', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
                          <span className="small medium">{d}</span>
                          <span className={cx('xs ellipsis', v && v !== 'P' && 'strong', v === 'P' && 'muted')}>{v ? ATT[v][0] : sunday ? 'Sun' : isToday ? 'Today' : ''}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}


          </section>

          <section id="sec-academics" className="record-sec">
            <div className="record-head"><h2 className="h2 sm">Academics</h2><div className="grow" />
              <div className="onoff">{['Results', 'Observations', 'Timetable'].map((x) => <button key={x} className={cx(acad === x && 'on')} onClick={() => setAcad(x)}>{x}</button>)}</div>
            </div>
            {acad === 'Results' && (exams.length ? (
                <div className="col gap-8">
                  {exams.map((e) => (
                    <Link key={e.id} to={`/academics/exams/${e.id}`} className="stack-card" style={{ alignItems: 'flex-start', marginTop: 0 }}>
                      <span className="circle sm" style={{ boxShadow: 'none' }}><Icon name="exam" size={15} /></span>
                      <span className="grow" style={{ minWidth: 0 }}>
                        <span className="medium" style={{ display: 'block' }}>{e.name}</span>
                        <span className="xs muted">{dateShort(e.date)} · {e.tot}/{e.max}</span>
                        <span className="row wrap gap-4 mt-8">{e.subjects.map(([n, m]) => <span key={n} className="tag" style={{ height: 24, fontSize: 11 }}>{n} {e.r[n]}/{m}</span>)}</span>
                      </span>
                      <span className="right"><span className="big-num" style={{ fontSize: 30 }}>{e.pct}%</span><span className={`pill ${e.pct >= 80 ? 'ok' : e.pct >= 60 ? 'warn' : 'danger'}`} style={{ display: 'flex', marginTop: 6 }}>Grade {grade(e.pct)}</span></span>
                    </Link>
                  ))}
                </div>
              ) : <Empty icon="exam" title="No results yet">Results appear once marks are entered for {cls?.name} {s.section}.</Empty>)}
              {acad === 'Observations' && (
                <div className="col gap-8">
                  {obs.map((o) => (
                    <div key={o.id} className="stack-card" style={{ flexDirection: 'column', alignItems: 'stretch', marginTop: 0 }}>
                      <div className="row between"><span className="medium">{o.reviewer}</span><span className="xs muted">{dateShort(o.date)}</span></div>
                      {o.answers
                        ? Object.entries(o.answers).map(([q, a]) => <div key={q} className="row between small"><span className="muted">{q}</span><span className="medium">{typeof a === 'number' ? '★'.repeat(a) : a}</span></div>)
                        : <div className="row wrap gap-6">{Object.entries(o.scores).map(([k, v]) => <span key={k} className="tag">{k} {'★'.repeat(v)}</span>)}</div>}
                    </div>
                  ))}
                  {!obs.length && <Empty icon="observe" title="No observations yet" action={<button className="btn sm" onClick={() => setModal('observation')}>Add observation</button>} />}
                </div>
              )}
              {acad === 'Timetable' && (
                <div style={{ overflowX: 'auto' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '64px repeat(6, minmax(90px, 1fr))', gap: 6, minWidth: 640 }}>
                    <div />{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d} className="small medium" style={{ textAlign: 'center', padding: 6 }}>{d}</div>)}
                    {periods.map((p) => [
                      <div key={'l' + p.n} className="xs muted" style={{ padding: 6 }}>P{p.n}<br />{p.start}</div>,
                      ...[1, 2, 3, 4, 5, 6].map((d) => { const t = slots.find((x) => x.day === d && x.period === p.n); return <div key={`${d}-${p.n}`} className="tile" style={{ padding: 8, minHeight: 48, background: t ? 'var(--accent-soft)' : 'var(--surface-2)' }}>{t && <><div className="xs strong">{t.subject}</div><div className="xs muted ellipsis">{t.teacher}</div></>}</div>; }),
                    ])}
                  </div>
                </div>
              )}


          </section>

          <section id="sec-fees" className="record-sec">
            <div className="record-head"><h2 className="h2 sm">Fees</h2><div className="grow" />
              <select className="select" value={feeView} onChange={(e) => setFeeView(e.target.value)} aria-label="Fee view">{['Statement', 'One-time charges', 'Recurring', 'Fines', 'Discount'].map((x) => <option key={x}>{x}</option>)}</select>
              <Circle icon="download" size="sm" label="Export statement" onClick={() => { exportCsv(`${s.name} statement`); toast('Statement exported', { icon: 'download' }); }} />
            </div>
            {s.dues.length > 0 && (
              <div className="due-strip">
                <div className="grow"><div className="small medium">{fmt(due)} PKR outstanding</div><div className="xs muted">{s.dues.map((d) => `${d.label} (${d.month}) ${fmt(d.amount)}`).join(' · ')}</div></div>
                <button className="btn sm" onClick={collect}>Open collection</button>
              </div>
            )}
            {feeView === 'Statement' && (<>
                <div className="row wrap gap-6" style={{ marginBottom: 10 }}>
                  {['All', ...months].map((m) => <button key={m} className={cx('chip sm', stFilter === m && 'on')} style={{ height: 30 }} onClick={() => setStFilter(m)}>{m === 'All' ? 'All months' : dateShort(`${m}-01`).slice(3)}</button>)}
                  <span className="grow" />
                  <span className="small muted">Billed {fmt(totalCharged)} · Paid {fmt(totalPaid)}</span>
                </div>
                <div className="table-wrap"><table className="table resp" style={{ minWidth: 620 }}>
                  <thead><tr><th>Date</th><th>Description</th><th className="num">Charge</th><th className="num">Payment</th><th className="num">Balance</th></tr></thead>
                  <tbody>{[...shownRows].reverse().map((r) => (
                    <tr key={r.id}>
                      <td className="nowrap small">{dateShort(r.date)}</td>
                      <td><span className="row gap-8"><span className="circle xs" style={{ boxShadow: 'none', background: r.kind === 'payment' ? 'var(--accent-soft)' : 'var(--surface-2)', color: r.kind === 'payment' ? 'var(--accent-text)' : r.cat === 'fine' ? 'var(--warn)' : 'var(--muted)' }}><Icon name={r.kind === 'payment' ? 'arrowDown' : r.kind === 'waiver' ? 'check' : CAT_ICON[r.cat] || 'receipt'} size={12} /></span>
                        <span><span className="medium">{r.kind === 'payment' ? `Payment · ${r.method}` : r.label}</span>{(r.note || r.receipt) && <span className="xs muted" style={{ display: 'block' }}>{r.note || r.receipt}</span>}</span></span></td>
                      <td className="num">{r.kind === 'charge' ? fmt(r.amount) : ''}</td>
                      <td className="num ok-text">{r.kind !== 'charge' ? `−${fmt(r.amount)}` : ''}</td>
                      <td className="num strong">{fmt(r.balance)}</td>
                    </tr>
                  ))}</tbody>
                </table></div>
              </>)}
              {feeView === 'One-time charges' && (
                <div className="col gap-8">
                  {(s.charges || []).map((c) => {
                    const left = s.dues.find((d) => d.cat === 'onetime' && d.label === c.label)?.amount ?? Math.max(0, c.amount - c.paid);
                    return <Row key={c.id} icon="doc" title={c.label} sub={`${c.month} · ${fmt(c.amount)} PKR`} right={left ? <span className="pill danger">{fmt(left)} due</span> : <span className="pill ok">Paid</span>} />;
                  })}
                  <button className="outline-act alt mt-8" onClick={() => setModal('charge')}><span>Add one-time charge</span><Icon name="plus" size={15} /></button>
                </div>
              )}
              {feeView === 'Recurring' && (
                <div className="col gap-8">
                  {(s.recurring || []).map((r) => (
                    <div key={r.id} className="stack-card" style={{ marginTop: 0 }}>
                      <span className="circle sm" style={{ boxShadow: 'none' }}><Icon name="repeat" size={15} /></span>
                      <span className="grow"><span className="medium" style={{ display: 'block' }}>{r.name}</span><span className="xs muted">Day {r.day} · from {dateShort(`${r.from}-01`).slice(3)}{r.end ? ` · ends ${dateShort(r.end)}` : ''}</span></span>
                      <span className="big-num" style={{ fontSize: 22 }}>{fmt(r.amount)}</span>
                      <OnOff value={r.status === 'active'} onChange={(v) => { school.setRecurring(s.id, r.id, v ? 'active' : 'stopped'); toast(v ? `${r.name} resumed` : `${r.name} stopped`); }} />
                    </div>
                  ))}
                  {!(s.recurring || []).length && <div className="small muted">No recurring charges.</div>}
                  <div className="small muted">Adds {fmt(recurringTotal(s))} PKR to each monthly bill.</div>
                  <button className="outline-act alt" onClick={() => setModal('recurring')}><span>Add bus, van or tuition</span><Icon name="plus" size={15} /></button>
                </div>
              )}
              {feeView === 'Fines' && (
                <div className="col gap-4">
                  {[...(s.fines || [])].reverse().map((f) => (
                    <Row key={f.id} icon="fine" tone={f.status === 'unpaid' ? 'warn' : 'muted'} title={`${f.label} · ${fmt(f.amount)} PKR`} sub={`${dateShort(f.date)} · ${f.by}`}
                      right={f.status === 'unpaid' ? <button className="btn xs" onClick={() => { waiveFine(s.id, f.id); toast('Fine waived'); }}>Waive</button> : <span className={`pill ${f.status === 'paid' ? 'ok' : 'info'}`}>{f.status === 'paid' ? 'Paid' : 'Waived'}</span>} />
                  ))}
                  {!(s.fines || []).length && <div className="small muted">No fines.</div>}
                  <button className="outline-act alt mt-8" onClick={() => open('fine', { studentId: s.id })}><span>Add fine</span><Icon name="plus" size={15} /></button>
                </div>
              )}
              {feeView === 'Discount' && (
                <div className="col gap-12">
                  <div className="grid g3">
                    <div className="tile"><div className="k">{cls?.name} fee</div><div className="v">{fmt(cls?.fee)}</div></div>
                    <div className="tile"><div className="k">Discount · {discountLabel(s)}</div><div className="v">−{fmt(discountAmount(s, cls))}</div></div>
                    <div className="tile"><div className="k">Net / month</div><div className="v">{fmt(netFee(s, cls))}</div></div>
                  </div>
                  <div className="small muted">{s.discount ? `Reason: ${s.discountReason || 'not recorded'}. ` : ''}Changes apply from next month’s bill.</div>
                  <button className="outline-act alt" onClick={() => setModal('discount')}><span>Change discount</span><Icon name="edit" size={15} /></button>
                </div>
              )}


          </section>

          <section id="sec-documents" className="record-sec">
            <div className="record-head"><h2 className="h2 sm">Documents</h2><div className="grow" />
              <Circle icon="upload" size="sm" label="Upload" onClick={() => setModal('upload')} />
              <Circle icon="award" size="sm" label="Character certificate" onClick={() => setModal('certificate')} />
              <Circle icon="trophy" size="sm" label="Achievement" onClick={() => setModal('achievement')} />
            </div>
            {(docs.length ? (
                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                  {docs.map((d) => (
                    <div key={d.id} className="stack-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10, marginTop: 0 }}>
                      <div className="row between"><span className="circle sm" style={{ boxShadow: 'none' }}><Icon name={d.type.includes('ertificate') ? 'award' : 'doc'} size={15} /></span><span className="row gap-4"><Circle icon="download" size="xs" iconSize={12} label="Download" onClick={() => (exportCsv(`${d.title} downloaded`), toast(`${d.title} downloaded`, { icon: 'download' }))} /><Circle icon="print" size="xs" iconSize={12} label="Print" onClick={() => (printView(), toast('Sent to printer', { icon: 'print' }))} /></span></div>
                      <div><div className="medium ellipsis">{d.title}</div><div className="xs muted">{d.type} · {dateShort(d.date)}</div></div>
                    </div>
                  ))}
                </div>
              ) : <Empty icon="folder" title="No documents yet">Upload the B-Form or a previous result card, or create a certificate.</Empty>)}


          </section>

          <section id="sec-activity" className="record-sec">
            <div className="record-head"><h2 className="h2 sm">Activity</h2><div className="grow" />
              <select className="select" value={actFilter} onChange={(e) => setActFilter(e.target.value)} aria-label="Filter activity">{['All', 'Fees', 'Attendance', 'Messages', 'Academics', 'Profile'].map((f) => <option key={f}>{f}</option>)}</select>
            </div>
            {(() => {
                const items = activity.filter((a) => actFilter === 'All' || a.type === actFilter);
                const byDay = items.reduce((acc, a) => { const d = a.when.slice(0, 10); (acc[d] = acc[d] || []).push(a); return acc; }, {});
                return Object.entries(byDay).map(([d, list2]) => (
                  <div key={d}>
                    <div className="upper" style={{ margin: '10px 0 2px' }}>{d === '2026-10-09' ? 'Today' : dateLong(d)}</div>
                    {list2.map((a) => <Row key={a.k} icon={a.icon} tone={a.tone} title={a.title} sub={a.sub} right={<span className="xs muted nowrap">{a.when.length > 10 ? time(a.when) : ''}</span>} />)}
                  </div>
                ));
              })()}

          </section>
        </div>
      </div>

      {modal === 'edit' && <EditStudentModal s={s} onClose={() => setModal(null)} />}
      {modal === 'family' && <ChangeFamilyModal s={s} onClose={() => setModal(null)} />}
      {modal === 'section' && <SectionModal s={s} mode="section" onClose={() => setModal(null)} />}
      {modal === 'promote' && <SectionModal s={s} mode="promote" onClose={() => setModal(null)} />}
      {modal === 'terminate' && <TerminateModal s={s} onClose={() => setModal(null)} />}
      {modal === 'charge' && <ChargeModal s={s} onClose={() => setModal(null)} />}
      {modal === 'recurring' && <RecurringModal s={s} onClose={() => setModal(null)} />}
      {modal === 'discount' && <DiscountModal s={s} cls={cls} onClose={() => setModal(null)} />}
      {modal === 'upload' && <UploadDocModal s={s} onClose={() => setModal(null)} />}
      {modal === 'achievement' && <AchievementModal s={s} onClose={() => setModal(null)} />}
      {modal === 'certificate' && <CertificateModal s={s} cls={cls} fam={fam} onClose={() => setModal(null)} />}
      {modal === 'leaving' && <CertificateModal kind="leaving" s={s} cls={cls} fam={fam} onClose={() => setModal(null)} />}
      {modal === 'observation' && <ObservationModal s={s} onClose={() => setModal(null)} />}
    </div>
  );
}
