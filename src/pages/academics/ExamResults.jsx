import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import { Circle, PillGroup, StatStrip, Widget } from '../../components/Bento.jsx';
import { Avatar, Modal } from '../../components/ui.jsx';
import { useSchool, code } from '../../lib/store.jsx';
import { dateShort } from '../../lib/format.js';
import NotFound from '../NotFound.jsx';
import { printView } from '../../lib/exporter.js';

export const gradeOf = (pct, scheme) => (scheme.find(([, min]) => pct >= min) || scheme[scheme.length - 1])[0];

export default function ExamResults() {
  const { id } = useParams();
  const nav = useNavigate();
  const { db, active, classById, saveResults, updateExam, duplicateExam, deleteExam, restoreItem, setGrading, toast } = useSchool();
  const exam = db.exams.find((e) => e.id === id);
  const [marks, setMarks] = useState(() => JSON.parse(JSON.stringify(exam?.results || {})));
  const [view, setView] = useState('Marks');
  const [modal, setModal] = useState(null);
  useEffect(() => { setMarks(JSON.parse(JSON.stringify(exam?.results || {}))); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!exam) return <NotFound />;

  const scheme = db.grading;
  const passMark = scheme[scheme.length - 2]?.[1] ?? 33;
  const cls = classById[exam.classId];
  const students = active.filter((s) => s.classId === exam.classId && s.section === exam.section);
  const max = exam.subjects.reduce((a, [, m]) => a + m, 0);
  const total = (sid) => exam.subjects.reduce((a, [n]) => a + (Number(marks[sid]?.[n]) || 0), 0);
  const complete = (sid) => exam.subjects.every(([n]) => marks[sid]?.[n] !== undefined && marks[sid]?.[n] !== '');
  const done = students.filter((s) => complete(s.id));
  const ranked = [...done].sort((a, b) => total(b.id) - total(a.id));
  const pos = (sid) => { const i = ranked.findIndex((s) => s.id === sid); return i >= 0 ? i + 1 : null; };
  const pcts = done.map((s) => Math.round((total(s.id) / max) * 100));
  const avg = pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0;
  const passed = pcts.filter((p) => p >= passMark).length;
  const dist = Object.fromEntries(scheme.map(([g]) => [g, 0]));
  pcts.forEach((p) => { dist[gradeOf(p, scheme)] += 1; });

  const set = (sid, n, v) => {
    const m = exam.subjects.find(([x]) => x === n)[1];
    const num = v === '' ? '' : Math.min(m, Number(v.replace(/\D/g, '')));
    setMarks({ ...marks, [sid]: { ...(marks[sid] || {}), [n]: num } });
  };
  const clean = () => Object.fromEntries(Object.entries(marks).filter(([sid]) => complete(sid)).map(([sid, r]) => [sid, Object.fromEntries(Object.entries(r).map(([k, v]) => [k, Number(v)]))]));
  const schedule = exam.schedule || Object.fromEntries(exam.subjects.map(([n], i) => [n, exam.date.slice(0, 8) + String(Number(exam.date.slice(8)) + i).padStart(2, '0')]));

  return (
    <div className="page">
      <div className="row gap-8">
        <Circle icon="arrowLeft" label="All exams" onClick={() => nav('/academics/exams')} />
        <span className="small muted">Exams / <span style={{ color: 'var(--text)' }}>{exam.name}</span></span>
      </div>

      <section className="row wrap" style={{ gap: '16px 24px', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 380px', minWidth: 0 }}>
          <div className="eyebrow">{cls?.name} · {exam.section} · {exam.subjects.length} subjects · created {dateShort(exam.created)} by {exam.by}</div>
          <h1 className="h1 sm" style={{ marginTop: 4 }}>{exam.name}</h1>
          <div className="row wrap gap-6 mt-8">{exam.published ? <span className="pill ok">Published</span> : <span className="pill warn">Not published</span>}{(exam.tags || []).map((t) => <span key={t} className="tag">#{t}</span>)}</div>
        </div>
        <div className="row wrap gap-8">
          <div className="toolrow">
            <Circle icon="send" label="Send exam schedule to parents" onClick={() => toast(`Schedule sent to ${new Set(students.map((s) => s.familyId)).size} families`, { icon: 'send' })} />
            <Circle icon="sheet" label="Blank mark sheet" onClick={() => (printView(), toast('Mark sheet PDF ready', { icon: 'print' }))} />
            <Circle icon="idcard" label="Roll number slips" onClick={() => (printView(), toast('Roll number slips ready — instructions from Settings → Exams', { icon: 'print' }))} />
            <Circle icon="print" label="Result cards" onClick={() => (printView(), toast('Result cards PDF ready', { icon: 'print' }))} />
            <Circle icon="copy" label="Duplicate" onClick={() => { const nid = duplicateExam(exam.id); toast('Exam duplicated'); nav(`/academics/exams/${nid}`); }} />
            <Circle icon="trash" tone="danger" label="Delete exam" onClick={() => { const i = db.exams.findIndex((x) => x.id === exam.id); deleteExam(exam.id); toast(`${exam.name} deleted`, { undo: () => restoreItem('exams', exam, i) }); nav('/academics/exams'); }} />
          </div>
          <button className="btn primary lg" disabled={!done.length} onClick={() => { saveResults(exam.id, clean(), true); toast(`Results published · ${done.length} families notified`); }}><Icon name="send" size={15} />{exam.published ? 'Update & notify' : 'Publish results'}</button>
        </div>
      </section>

      <StatStrip
        id={<><span className="circle lg"><Icon name="exam" size={20} /></span><span><span className="medium" style={{ display: 'block' }}>{done.length} of {students.length} entered</span><span className="xs muted">Pass mark {passMark}%</span></span></>}
        stats={[
          { label: 'Class average', value: `${avg}%`, bar: avg },
          { label: 'Highest', value: pcts.length ? `${Math.max(...pcts)}%` : '—', bar: pcts.length ? Math.max(...pcts) : 0 },
          { label: 'Lowest', value: pcts.length ? `${Math.min(...pcts)}%` : '—', bar: pcts.length ? Math.min(...pcts) : 0 },
          { label: 'Passed', value: `${passed}/${done.length || 0}`, bar: passed * 20 },
        ]}
      />

      <section className="widget" style={{ padding: 12 }}>
        <div className="panel-bar" style={{ padding: 2 }}>
          <PillGroup value={view} onChange={setView} items={['Marks', 'Summary', 'Schedule', 'Subjects & grading']} />
          <div className="grow" />
          {view === 'Marks' && <button className="btn sm" onClick={() => { saveResults(exam.id, clean()); toast('Draft saved'); }}>Save draft</button>}
        </div>
        <div style={{ padding: '14px 6px 6px' }}>
          {view === 'Marks' && (students.length ? (
            <div className="table-wrap"><table className="table" style={{ minWidth: 760 }}>
              <thead><tr><th>Student</th>{exam.subjects.map(([n, m]) => <th key={n}>{n} <span className="faint">/ {m}</span></th>)}<th>Total</th><th>Grade</th><th>Result</th><th>Rank</th></tr></thead>
              <tbody>{students.map((s) => {
                const t = total(s.id); const ok = complete(s.id); const p = Math.round((t / max) * 100);
                return (
                  <tr key={s.id}>
                    <td><Link to={`/students/${s.id}`} className="person"><Avatar name={s.name} id={s.id} size={34} /><span><span className="nm">{s.name}</span><span className="id">{code(s)}</span></span></Link></td>
                    {exam.subjects.map(([n]) => <td key={n}><input className="input" aria-label={`${s.name} ${n}`} style={{ height: 38, width: 74, borderRadius: 999, textAlign: 'center' }} inputMode="numeric" value={marks[s.id]?.[n] ?? ''} placeholder="—" onChange={(e) => set(s.id, n, e.target.value)} /></td>)}
                    <td className="strong">{ok ? `${t}/${max}` : '—'}</td>
                    <td>{ok ? <span className={`pill ${p >= 80 ? 'ok' : p >= passMark + 17 ? 'warn' : 'danger'}`}>{gradeOf(p, scheme)} · {p}%</span> : '—'}</td>
                    <td>{ok ? (p >= passMark ? <span className="pill ok">Pass</span> : <span className="pill danger">Fail</span>) : '—'}</td>
                    <td>{pos(s.id) ? (pos(s.id) <= 3 ? <span className="pill outline">#{pos(s.id)}</span> : `#${pos(s.id)}`) : '—'}</td>
                  </tr>
                );
              })}</tbody>
            </table></div>
          ) : <div className="empty">No students in {cls?.name} · {exam.section}.</div>)}

          {view === 'Summary' && (
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
              <Widget icon="reports" title="Grade distribution">
                {scheme.map(([g]) => <div key={g}><div className="row between small"><span>{g}</span><span className="medium">{dist[g]}</span></div><div className="meter thin mt-4"><span style={{ width: `${done.length ? (dist[g] / done.length) * 100 : 0}%`, background: 'var(--accent-dim)' }} /></div></div>)}
              </Widget>
              <Widget icon="book" title="Subject performance">
                {exam.subjects.map(([n, m]) => {
                  const v = done.map((s) => Number(marks[s.id]?.[n]) || 0);
                  const a = v.length ? Math.round((v.reduce((x, y) => x + y, 0) / v.length / m) * 100) : 0;
                  return <div key={n}><div className="row between small"><span>{n}</span><span className="muted">high {v.length ? Math.max(...v) : '—'} · low {v.length ? Math.min(...v) : '—'} · <strong style={{ color: 'var(--text)' }}>{a}%</strong></span></div><div className="meter thin mt-4"><span style={{ width: `${a}%`, background: a >= 80 ? 'var(--accent)' : 'var(--accent-dim)' }} /></div></div>;
                })}
              </Widget>
              <Widget icon="trophy" title="Top performers">
                {ranked.slice(0, 3).map((s, i) => <div key={s.id} className="stack-card" style={{ marginTop: i ? -6 : 0 }}><span className="circle sm" style={{ fontWeight: 600 }}>#{i + 1}</span><span className="grow medium">{s.name}</span><span className="big-num" style={{ fontSize: 22 }}>{Math.round((total(s.id) / max) * 100)}%</span></div>)}
                {!ranked.length && <div className="small muted">Enter marks to see the ranking.</div>}
              </Widget>
            </div>
          )}

          {view === 'Schedule' && (
            <div className="col" style={{ gap: 0 }}>
              {exam.subjects.map(([n, m]) => (
                <div key={n} className="row wrap" style={{ gap: 12, padding: '10px 0', borderTop: '1px solid var(--line)' }}>
                  <span className="circle sm"><Icon name="calendar" size={15} /></span>
                  <span className="grow medium">{n} <span className="muted small" style={{ fontWeight: 400 }}>· {m} marks</span></span>
                  <input className="input" type="date" style={{ width: 170, height: 40, borderRadius: 999 }} value={schedule[n] || exam.date} onChange={(e) => updateExam(exam.id, { schedule: { ...schedule, [n]: e.target.value } })} />
                  <input className="input" type="time" style={{ width: 120, height: 40, borderRadius: 999 }} defaultValue="08:00" />
                </div>
              ))}
              <button className="outline-act alt mt-12" onClick={() => toast('Schedule sent to parents', { icon: 'send' })}><span>Send schedule to parents</span><Icon name="send" size={15} /></button>
            </div>
          )}

          {view === 'Subjects & grading' && (
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
              <Widget icon="book" title="Subject totals">
                {exam.subjects.map(([n, m], i) => (
                  <div key={n} className="row between"><span className="small">{n}</span><input className="input" style={{ width: 90, height: 38, borderRadius: 999, textAlign: 'center' }} value={m} onChange={(e) => updateExam(exam.id, { subjects: exam.subjects.map((x, j) => (j === i ? [x[0], Number(e.target.value.replace(/\D/g, '')) || 0] : x)) })} /></div>
                ))}
                <div className="xs muted">Used to calculate percentages and grades.</div>
              </Widget>
              <Widget icon="sliders" title="Grading scheme" action={<Circle icon="edit" size="sm" label="Edit grading" onClick={() => setModal('grading')} />}>
                <div className="row wrap gap-6">{scheme.map(([g, min]) => <span key={g} className="tag">{g} ≥ {min}%</span>)}</div>
                <div className="xs muted">Changing it recalculates every grade.</div>
              </Widget>
            </div>
          )}
        </div>
      </section>

      {modal === 'grading' && <GradingModal scheme={scheme} onClose={() => setModal(null)} onSave={(g) => { setGrading(g); toast('Grading scheme saved'); setModal(null); }} />}
    </div>
  );
}

function GradingModal({ scheme, onClose, onSave }) {
  const [g, setG] = useState(scheme.map((x) => [...x]));
  return (
    <Modal open onClose={onClose} title="Grading scheme" sub="Minimum percentage for each grade (highest first)"
      footer={<><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" onClick={() => onSave(g.map(([a, b]) => [a, Number(b) || 0]))}>Save</button></>}>
      {g.map(([grade, min], i) => (
        <div key={i} className="row gap-8">
          <input className="input" style={{ width: 90 }} value={grade} onChange={(e) => setG(g.map((x, j) => (j === i ? [e.target.value, x[1]] : x)))} />
          <span className="muted">≥</span>
          <input className="input" style={{ width: 90 }} value={min} onChange={(e) => setG(g.map((x, j) => (j === i ? [x[0], e.target.value.replace(/\D/g, '')] : x)))} />
          <span className="muted">%</span>
        </div>
      ))}
    </Modal>
  );
}
