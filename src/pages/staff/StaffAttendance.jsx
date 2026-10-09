import { useState } from 'react';
import Icon from '../../components/Icon.jsx';
import MarkRow, { ATT_OPTS } from '../../components/MarkRow.jsx';
import { Circle } from '../../components/Bento.jsx';
import { Modal } from '../../components/ui.jsx';
import { PageHead } from '../../components/Shell.jsx';
import { useSchool } from '../../lib/store.jsx';
import { dateLong } from '../../lib/format.js';
import { Link } from 'react-router-dom';
import { AcademicsTabs, WEEK } from '../academics/Attendance.jsx';
import { exportCsv } from '../../lib/exporter.js';

export default function StaffAttendance() {
  const { db, markStaff, toast, setRemark } = useSchool();
  const [remarkFor, setRemarkFor] = useState(null);
  const [remarkText, setRemarkText] = useState('');
  const [day, setDay] = useState(9);
  const date = `2026-10-${String(day).padStart(2, '0')}`;
  const marks = db.staffAttendance[date] || {};
  const staff = db.staff.filter((s) => s.status === 'active');
  const unmarked = staff.filter((s) => !marks[s.id]).length;

  return (
    <div className="page">
      <AcademicsTabs />
      <PageHead title="Attendance" sub={`${dateLong(date)} · ${staff.length - unmarked} of ${staff.length} staff marked · feeds into payroll deductions`}
        actions={<button className="btn" onClick={() => (exportCsv('Monthly staff sheet exported'), toast('Monthly staff sheet exported', { icon: 'download' }))}><Icon name="download" size={16} />Monthly sheet</button>} />
      <div className="seg ink lg" style={{ alignSelf: 'flex-start' }}>
        <Link to="/academics/attendance" style={{ height: 36, padding: '0 16px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', color: 'var(--muted)', fontSize: 13, fontWeight: 500 }}>Students</Link>
        <button className="on">Staff</button>
      </div>
      <div className="row wrap gap-6">
        {WEEK.map(([w, n]) => (
          <button key={n} onClick={() => setDay(n)} className="chip" style={{ height: 52, width: 52, padding: 0, borderRadius: 16, flexDirection: 'column', gap: 0, justifyContent: 'center', ...(day === n ? { background: 'var(--quiet)', color: 'var(--on-quiet)', borderColor: 'transparent' } : {}) }}>
            <span className="xs" style={{ opacity: .7 }}>{w}</span><span className="strong">{n}</span>
          </button>
        ))}
      </div>
      <section className="card col gap-12">
        <div className="row between wrap">
          <div className="row wrap gap-8">{ATT_OPTS.map(([k, l, bg, fg]) => <span key={k} className="pill lg" style={{ background: bg, color: fg }}>{l} {staff.filter((s) => marks[s.id] === k).length}</span>)}</div>
          <div className="row wrap gap-6">
            <button className="btn sm" disabled={day > 9} onClick={() => { staff.forEach((s) => markStaff(date, s.id, 'V')); toast('Marked as holiday', { icon: 'calendar' }); }}><Icon name="calendar" size={14} />Holiday</button>
            <button className="btn sm" disabled={!unmarked || day > 9} onClick={() => { const left = staff.filter((s) => !marks[s.id]); left.forEach((s) => markStaff(date, s.id, 'A')); toast(`${unmarked} marked absent`, { undo: () => left.forEach((s) => markStaff(date, s.id, null)) }); }}>Rest absent</button>
            <button className="btn sm" disabled={!unmarked || day > 9} onClick={() => { const left = staff.filter((s) => !marks[s.id]); left.forEach((s) => markStaff(date, s.id, 'P')); toast(`${unmarked} marked present`, { undo: () => left.forEach((s) => markStaff(date, s.id, null)) }); }}>Rest present ({unmarked})</button>
          </div>
        </div>
        {staff.map((s) => <MarkRow key={s.id} id={s.id} name={s.name} idLabel={s.id} sub={`${s.role} · ${s.subject} · ${s.phone}`} value={marks[s.id]} readOnly={day > 9} onChange={(v) => markStaff(date, s.id, v)}
          note={db.remarks[date]?.[s.id]}
          extra={<Circle icon="edit" size="sm" iconSize={14} label="Remark" onClick={() => { setRemarkText(db.remarks[date]?.[s.id] || ''); setRemarkFor(s); }} />} />)}
        {remarkFor && (
          <Modal open onClose={() => setRemarkFor(null)} title="Remark" sub={remarkFor.name} footer={<><button className="btn ghost" onClick={() => setRemarkFor(null)}>Cancel</button><button className="btn primary" onClick={() => { setRemark(date, remarkFor.id, remarkText); toast('Remark saved'); setRemarkFor(null); }}>Save</button></>}>
            <div className="row wrap gap-6">{['Sick', 'On duty outside', 'Late — traffic', 'Informed in advance'].map((x) => <button key={x} className="chip sm" onClick={() => setRemarkText(x)}>{x}</button>)}</div>
            <input className="input" autoFocus value={remarkText} onChange={(e) => setRemarkText(e.target.value)} />
            <div className="xs muted">Absent teachers’ classes are flagged for cover in the timetable.</div>
          </Modal>
        )}
        <div className="row between" style={{ paddingTop: 12, borderTop: '1px solid var(--line)' }}>
          <span className="small muted">Check-in by QR or the staff app is recorded automatically.</span>
          <button className="btn primary" disabled={unmarked > 0} onClick={() => toast('Staff attendance saved')}>Save</button>
        </div>
      </section>
    </div>
  );
}
