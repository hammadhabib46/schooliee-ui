import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Circle } from '../../components/Bento.jsx';
import Icon from '../../components/Icon.jsx';
import MarkRow, { ATT_OPTS } from '../../components/MarkRow.jsx';
import { PageHead } from '../../components/Shell.jsx';
import { Drawer, Field, Menu, Modal, Ring, Search, Seg, SubNav } from '../../components/ui.jsx';
import { useSchool, code } from '../../lib/store.jsx';
import { cx, dateLong, demoIso } from '../../lib/format.js';
import { workspaces } from '../../lib/nav.js';
import { historyFor } from '../students/StudentProfile.jsx';
import { exportCsv, printView } from '../../lib/exporter.js';

export function AcademicsTabs() {
  const { unmarkedSections, db } = useSchool();
  const ws = workspaces.find((w) => w.key === 'academics');
  return <SubNav tabs={ws.tabs} counts={{ '/academics/attendance': unmarkedSections.length || undefined, '/academics/exams': db.exams.filter((e) => !e.published).length || undefined }} />;
}

export const WEEK = [['Mon', 5], ['Tue', 6], ['Wed', 7], ['Thu', 8], ['Fri', 9], ['Sat', 10]];

export default function Attendance() {
  const { db, sections, familyById, mark, markMany, seedDay, saveAttendance, toast, today, checkIn, setRemark } = useSchool();
  const [params] = useSearchParams();
  // Open on the first class that still needs marking today — the teacher's next job.
  const [cls, setCls] = useState(() => params.get('section') || sections.find((x) => x.students.some((st) => !(db.attendance[today] || {})[st.id]))?.key || 'all');
  const [day, setDay] = useState(9);
  const [q, setQ] = useState('');
  const [leaves, setLeaves] = useState(false);
  const [qr, setQr] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [remarkFor, setRemarkFor] = useState(null);
  const nav = useNavigate();
  const date = `2026-10-${String(day).padStart(2, '0')}`;
  const isPast = day < 9;
  const isFuture = day > 9;

  const marks = useMemo(() => {
    if (db.attendance[date]) return db.attendance[date];
    if (isPast) {
      const m = {};
      db.students.forEach((s) => { const h = historyFor(s.id, s.admitted)[day]; if (h) m[s.id] = h; });
      return m;
    }
    return {};
  }, [db.attendance, date, isPast, day, db.students]);

  const students = sections.flatMap((s) => s.students);
  const shown = (cls === 'all' ? students : sections.find((s) => s.key === cls)?.students || [])
    .filter((s) => { const t = q.trim().toLowerCase(); return !t || s.name.toLowerCase().includes(t) || code(s).toLowerCase().includes(t); });
  const markedHere = shown.filter((s) => marks[s.id]).length;
  const unmarked = shown.length - markedHere;
  const count = (k) => shown.filter((s) => marks[s.id] === k).length;
  const saved = db.attendanceSaved[date];
  const markedAll = students.filter((s) => marks[s.id]).length;
  const setMark = (id, v) => {
    if (isPast && !db.attendance[date]) seedDay(date, marks);
    mark(date, id, v);
  };

  const classes = [{ key: 'all', label: 'All classes', students }, ...sections];
  const current = classes.find((c) => c.key === cls) || classes[0];

  // Bulk marks can be undone: restore exactly what each student had before.
  const bulk = (status, label) => {
    seedDay(date, marks);
    const before = Object.fromEntries(shown.map((s) => [s.id, marks[s.id] || null]));
    markMany(date, shown.map((s) => s.id), status);
    toast(label, { undo: () => Object.entries(before).forEach(([id, v]) => mark(date, id, v)) });
  };

  const save = () => {
    saveAttendance(date);
    const absent = shown.filter((s) => marks[s.id] === 'A').length;
    toast(absent ? `Saved · ${absent} parent${absent > 1 ? 's' : ''} notified on WhatsApp` : 'Attendance saved');
  };

  return (
    <div className="page">
      <AcademicsTabs />
      <PageHead
        title="Attendance"
        sub={`${dateLong(date)} · ${markedAll} of ${students.length} students marked${saved ? ' · saved' : ''}`}
        actions={<>
          <div className="toolrow">
            <Circle icon="leave" label="Leave requests (1)" onClick={() => setLeaves(true)} />
            <Circle icon="sheet" label="Weekly attendance sheet" onClick={() => setSheet(true)} />
            <Circle icon="download" label="Export" onClick={() => (exportCsv('Attendance exported'), toast('Attendance exported', { icon: 'download' }))} />
            <Circle icon="sliders" label="Attendance settings" onClick={() => nav('/settings/attendance')} />
          </div>
          <button className="btn" onClick={() => setQr(true)}><Icon name="qr" size={16} />Scan QR</button>
        </>}
      />

      <div className="row wrap gap-12">
        <div className="seg ink lg">
          <button className="on">Students</button>
          <Link to="/academics/attendance/staff" style={{ height: 36, padding: '0 16px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', color: 'var(--muted)', fontSize: 13, fontWeight: 500 }}>Staff</Link>
        </div>
        <div className="grow" />
        <div className="row gap-6 week-strip">
          <button className="icon-btn" aria-label="Previous week" onClick={() => toast('Showing this week only in the demo')}><Icon name="chevLeft" size={14} stroke={2} /></button>
          {WEEK.map(([w, n]) => (
            <button key={n} onClick={() => setDay(n)} className={cx('chip', 'week-day')} style={{ height: 52, width: 52, padding: 0, borderRadius: 16, flexDirection: 'column', gap: 0, justifyContent: 'center', ...(day === n ? { background: 'var(--quiet)', color: 'var(--on-quiet)', borderColor: 'transparent' } : {}) }}>
              <span className="xs" style={{ opacity: .7 }}>{w}</span><span className="strong">{n}</span>
            </button>
          ))}
          <button className="icon-btn" aria-label="Next week" onClick={() => toast('Showing this week only in the demo')}><Icon name="chevRight" size={14} stroke={2} /></button>
        </div>
      </div>

      <div className="split">
        <aside className="card pad-s att-classes" style={{ flex: '1 1 240px', maxWidth: 300, minWidth: 0, position: 'sticky', top: 76 }}>
          <div className="upper" style={{ padding: '12px 12px 8px' }}>Classes to mark</div>
          {classes.map((c) => {
            const done = c.students.filter((s) => marks[s.id]).length;
            const on = cls === c.key;
            return (
              <button key={c.key} onClick={() => setCls(c.key)} className="row" style={{ width: '100%', gap: 12, padding: '10px 12px', borderRadius: 16, border: 0, background: on ? 'var(--quiet)' : 'transparent', color: on ? 'var(--on-quiet)' : 'var(--text)', textAlign: 'left' }}>
                <Ring value={(done / c.students.length) * 100} size={34} stroke={4} track={on ? 'var(--surface)' : 'var(--track)'} color={'var(--accent-text)'}>
                  {done === c.students.length && <Icon name="check" size={13} stroke={2.6} />}
                </Ring>
                <span className="grow"><span className="medium" style={{ display: 'block' }}>{c.label}</span><span className="xs" style={{ opacity: .7 }}>{done === c.students.length ? `All ${done} marked` : `${done}/${c.students.length} marked`}</span></span>
              </button>
            );
          })}
        </aside>

        <section className="card wide col gap-16" style={{ flex: '3 1 560px' }}>
          <select className="select att-picker" value={cls} onChange={(e) => setCls(e.target.value)} aria-label="Class to mark">
            {classes.map((c) => { const done = c.students.filter((s) => marks[s.id]).length; return <option key={c.key} value={c.key}>{c.label} — {done === c.students.length ? 'done' : `${done}/${c.students.length} marked`}</option>; })}
          </select>
          <div className="row between wrap top">
            <div>
              <h2 className="h2">{current.label}</h2>
              <p className="sub">{isFuture ? 'This day hasn’t happened yet.' : isPast ? 'Past day — changes are logged.' : <>Mark exceptions, then fill the rest as present.<span className="hide-sm"> Keys: P · L · A · V</span></>}</p>
            </div>
            {!isFuture && (
              <div className="row gap-8">
                <button className="btn sm" onClick={() => bulk('V', `${current.label} marked as holiday`)}><Icon name="calendar" size={14} />Mark holiday</button>
                <button className="btn sm" disabled={!unmarked} onClick={() => bulk('A', `${unmarked} marked absent`)}><Icon name="close" size={14} />Rest absent</button>
                <button className="btn sm" disabled={!unmarked} onClick={() => bulk('P', `${unmarked} marked present`)}><Icon name="check" size={14} stroke={2.4} />Mark rest present ({unmarked})</button>
              </div>
            )}
          </div>
          <div className="row wrap gap-8">
            {ATT_OPTS.map(([k, label, bg, fg]) => <span key={k} className="pill lg" style={{ background: bg, color: fg }}><span className="dot" />{label} {count(k)}</span>)}
            <span className="pill lg"><span className="dot" />Not marked {unmarked}</span>
            <div className="grow" />
            <Search value={q} onChange={setQ} placeholder="Find a student" />
          </div>
          <div className="mark-list">
            {shown.map((s) => {
              const f = familyById[s.familyId];
              return <MarkRow key={s.id} id={s.id} name={s.name} idLabel={code(s)} sub={[s.roll && `Roll ${s.roll}`, cls === 'all' && `${db.classes.find((c) => c.id === s.classId)?.name} ${s.section}`, f && `${f.name} · ${f.phone}`].filter(Boolean).join(' · ')} value={marks[s.id]} readOnly={isFuture} onChange={(v) => setMark(s.id, v)}
                note={[db.checkins[date]?.[s.id] && `Checked in ${db.checkins[date][s.id]}`, db.remarks[date]?.[s.id]].filter(Boolean).join(' · ')}
                extra={<Menu width={210} trigger={({ toggle }) => <Circle icon="moreV" size="sm" iconSize={15} label="More" onClick={toggle} />}
                  groups={[{ items: [
                    { label: 'Check in now', icon: 'clock', onClick: () => { const late = demoIso().slice(11) > db.settings.lateAfter; checkIn(date, s.id, late); toast(`${s.name} checked in at ${demoIso().slice(11)}${late ? ' · late' : ''}`); } },
                    { label: db.remarks[date]?.[s.id] ? 'Edit remark' : 'Add remark', icon: 'edit', onClick: () => setRemarkFor(s) },
                    { label: 'Open profile', icon: 'arrowUpRight', onClick: () => nav(`/students/${s.id}`) },
                  ] }]} />} />;
            })}
          </div>
          {!isFuture && (
            <div className="row between wrap att-save" style={{ gap: 12 }}>
              <div className="row gap-12" style={{ flex: '1 1 220px' }}>
                <div className="meter accent grow" style={{ maxWidth: 260 }}><span style={{ width: `${shown.length ? (markedHere / shown.length) * 100 : 0}%`, background: 'var(--accent)' }} /></div>
                <span className="small muted">{markedHere} of {shown.length} marked</span>
              </div>
              <button className="btn primary" disabled={unmarked > 0} onClick={save}>{unmarked > 0 ? `Mark ${unmarked} more to save` : saved ? 'Saved — save again' : 'Save & notify parents of absentees'}</button>
            </div>
          )}
        </section>
      </div>

      {qr && <QrModal date={date} onClose={() => setQr(false)} />}
      {sheet && <SheetModal onClose={() => setSheet(false)} />}
      {remarkFor && <RemarkModal s={remarkFor} value={db.remarks[date]?.[remarkFor.id] || ''} onClose={() => setRemarkFor(null)} onSave={(t) => { setRemark(date, remarkFor.id, t); toast('Remark saved'); setRemarkFor(null); }} />}
      <Drawer open={leaves} onClose={() => setLeaves(false)} title="Leave requests" sub="From the parent app">
        <div className="card" style={{ padding: 16 }}>
          <div className="row gap-12"><span className="av c3">FI</span><span className="grow"><span className="medium" style={{ display: 'block' }}>Fatima Iqbal</span><span className="small muted">Class One · new A · Fri 9 Oct</span></span><span className="pill info">Sick</span></div>
          <p className="small muted mt-12">“Fatima has fever, she will not come today.” — Usman</p>
          <div className="row gap-8 mt-12">
            <button className="btn sm grow" onClick={() => { toast('Leave declined'); setLeaves(false); }}>Decline</button>
            <button className="btn sm grow" onClick={() => { mark(today, 'S-00010', 'V'); toast('Leave approved · marked on Leave'); setLeaves(false); }}>Approve</button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}

function QrModal({ date, onClose }) {
  const { db, sections, checkIn, toast } = useSchool();
  const pool = sections.flatMap((x) => x.students).filter((s) => !db.attendance[date]?.[s.id]);
  const [log, setLog] = useState([]);
  const simulate = () => {
    const s = pool.find((p) => !log.some((l) => l.id === p.id));
    if (!s) { toast('Everyone is checked in'); return; }
    const t = demoIso().slice(11);
    checkIn(date, s.id, t > db.settings.lateAfter);
    setLog([{ id: s.id, name: s.name, t }, ...log]);
  };
  return (
    <Modal open onClose={onClose} title="Scan QR" sub={`Marking attendance for ${date.split('-').reverse().join('/')}`} footer={<button className="btn primary" onClick={onClose}>Done · {log.length} checked in</button>}>
      <select className="select" aria-label="Camera"><option>Front camera</option><option>Back camera</option></select>
      <button onClick={simulate} style={{ aspectRatio: '4/3', borderRadius: 22, border: 0, background: 'var(--ink)', display: 'grid', placeItems: 'center', position: 'relative', overflow: 'hidden', cursor: 'pointer' }} aria-label="Simulate a scan">
        <span style={{ width: '55%', aspectRatio: '1', border: '3px solid var(--accent)', borderRadius: 18 }} />
        <span className="small" style={{ position: 'absolute', bottom: 14, color: '#bbb' }}>Point at the QR on an ID card · tap to simulate</span>
      </button>
      <div className="small muted">After {db.settings.lateAfter} check-ins are marked Late. Change it in Settings → Attendance.</div>
      {log.map((l) => <div key={l.id} className="row between small"><span className="row gap-8"><Icon name="check" size={14} className="ok-text" />{l.name}</span><span className="muted">{l.t}</span></div>)}
    </Modal>
  );
}

function SheetModal({ onClose }) {
  const { db, toast } = useSchool();
  const [who, setWho] = useState('Students');
  const [week, setWeek] = useState('2026-10-05');
  const [scope, setScope] = useState('all');
  return (
    <Modal open onClose={onClose} title="Weekly attendance sheet" sub="Printable sheet to mark by hand"
      footer={<><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" onClick={() => { (printView(), toast('Attendance sheet PDF ready', { icon: 'print' })); onClose(); }}><Icon name="print" size={15} />Generate PDF</button></>}>
      <Seg ink lg value={who} onChange={setWho} items={['Students', 'Staff']} />
      <Field label="Week starting (Monday)"><input className="input" type="date" value={week} onChange={(e) => setWeek(e.target.value)} /></Field>
      <Field label={who === 'Students' ? 'Class' : 'Role'}>
        <select aria-label="Sheet scope" className="select" value={scope} onChange={(e) => setScope(e.target.value)}>
          <option value="all">{who === 'Students' ? 'All classes (one page each)' : 'All roles'}</option>
          {who === 'Students' ? db.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>) : ['Teacher', 'Accountant', 'Other'].map((r) => <option key={r}>{r}</option>)}
        </select>
      </Field>
    </Modal>
  );
}

function RemarkModal({ s, value, onClose, onSave }) {
  const [t, setT] = useState(value);
  return (
    <Modal open onClose={onClose} title="Remark" sub={s.name} footer={<><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" onClick={() => onSave(t)}>Save</button></>}>
      <div className="row wrap gap-6">{['Sick', 'Family event', 'Van late', 'Informed by parent', 'No reason given'].map((x) => <button key={x} className="chip sm" onClick={() => setT(x)}>{x}</button>)}</div>
      <Field label="Remark"><input className="input" autoFocus value={t} onChange={(e) => setT(e.target.value)} /></Field>
    </Modal>
  );
}
