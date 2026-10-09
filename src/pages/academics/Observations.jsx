import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import { Circle, OnOff, PillGroup } from '../../components/Bento.jsx';
import { PageHead } from '../../components/Shell.jsx';
import { Avatar, Empty, Search } from '../../components/ui.jsx';
import { useSchool, code } from '../../lib/store.jsx';
import { dateShort } from '../../lib/format.js';
import { ObservationModal, obsScore } from '../students/StudentModals.jsx';
import { AcademicsTabs } from './Attendance.jsx';
import { exportCsv } from '../../lib/exporter.js';

const TYPES = [['yesno', 'Yes / No'], ['rating', 'Rating ★'], ['text', 'Written']];

export default function Observations() {
  const { db, studentById, classById, toast } = useSchool();
  const [params, setParams] = useSearchParams();
  const [adding, setAdding] = useState(null);
  const [view, setView] = useState('Observations');
  const [q, setQ] = useState('');
  const [cls, setCls] = useState('all');
  useEffect(() => { const s = params.get('new'); if (s) { setAdding(s === '1' ? 'pick' : s); setParams({}, { replace: true }); } }, [params, setParams]);

  const list = db.observations.filter((o) => {
    const s = studentById[o.studentId];
    return s && (cls === 'all' || s.classId === cls) && (!q || `${s.name} ${code(s)} ${o.reviewer}`.toLowerCase().includes(q.toLowerCase()));
  });
  const activeQs = db.obsQuestions.filter((x) => x.active).length;

  return (
    <div className="page">
      <AcademicsTabs />
      <PageHead title="Observations" sub={`${db.observations.length} recorded · ${activeQs} active questions · shared with parents in the app`}
        actions={<>
          <div className="toolrow"><Circle icon="download" label="Export" onClick={() => (exportCsv('Observations exported'), toast('Observations exported', { icon: 'download' }))} /></div>
          <button className="btn primary" onClick={() => setAdding('pick')}><Icon name="plus" size={16} stroke={2} />Add observation</button>
        </>} />

      <section className="widget" style={{ padding: 12 }}>
        <div className="panel-bar" style={{ padding: 2 }}>
          <PillGroup value={view} onChange={setView} items={['Observations', 'Questions']} />
          <div className="grow" />
          {view === 'Observations' && <>
            <select aria-label="Filter by class" className="select" value={cls} onChange={(e) => setCls(e.target.value)}><option value="all">All classes</option>{db.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            <div style={{ width: 240 }}><Search value={q} onChange={setQ} placeholder="Student or reviewer" /></div>
          </>}
        </div>

        <div style={{ padding: '14px 4px 4px' }}>
          {view === 'Observations' && (list.length ? (
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
              {list.map((o) => {
                const s = studentById[o.studentId];
                const avg = obsScore(o);
                return (
                  <article key={o.id} className="tile col gap-12" style={{ padding: 18 }}>
                    <div className="row between">
                      <Link to={`/students/${s.id}`} className="person"><Avatar name={s.name} id={s.id} /><span><span className="nm">{s.name}</span><span className="id">{code(s)} · {classById[s.classId]?.name} {s.section}</span></span></Link>
                      <span className={`pill ${avg >= 4 ? 'ok' : avg >= 3 ? 'warn' : 'danger'}`}>{avg.toFixed(1)} / 5</span>
                    </div>
                    <div className="col gap-6">
                      {o.answers
                        ? Object.entries(o.answers).filter(([, a]) => typeof a !== 'string' || a === 'Yes' || a === 'No').map(([k, a]) => <div key={k} className="row between small gap-12"><span className="muted ellipsis">{k}</span><span className="medium nowrap">{typeof a === 'number' ? '★'.repeat(a) : a}</span></div>)
                        : Object.entries(o.scores).map(([c, v]) => (
                          <div key={c} className="row gap-12 small">
                            <span className="muted" style={{ width: 100 }}>{c}</span>
                            <span className="row grow" style={{ gap: 3 }}>{[1, 2, 3, 4, 5].map((n) => <span key={n} style={{ flex: 1, height: 8, borderRadius: 999, background: n <= v ? 'var(--text)' : 'var(--line)' }} />)}</span>
                          </div>
                        ))}
                    </div>
                    {o.note && <p className="small" style={{ padding: 12, borderRadius: 14, background: 'var(--surface)' }}>{o.note}</p>}
                    <div className="xs muted">By {o.reviewer} · {dateShort(o.date)}</div>
                  </article>
                );
              })}
            </div>
          ) : <Empty icon="observe" title="No observations match" />)}
          {view === 'Questions' && <QuestionBank />}
        </div>
      </section>
      {adding && <ObservationModal s={adding === 'pick' ? null : studentById[adding]} onClose={() => setAdding(null)} />}
    </div>
  );
}

function QuestionBank() {
  const { db, addObsQuestion, updateObsQuestion, moveObsQuestion, toast } = useSchool();
  const [text, setText] = useState('');
  const [type, setType] = useState('yesno');
  return (
    <div className="col gap-8" style={{ maxWidth: 820 }}>
      <div className="small muted">Teachers answer these on every observation. Turn a question off to hide it without losing past answers.</div>
      {db.obsQuestions.map((x, i) => (
        <div key={x.id} className="row gap-8 wrap" style={{ padding: '8px 10px', borderRadius: 16, background: 'var(--surface-2)', opacity: x.active ? 1 : 0.55 }}>
          <span className="row" style={{ gap: 2 }}>
            <Circle icon="arrowUp" size="xs" iconSize={12} label="Move up" disabled={i === 0} onClick={() => moveObsQuestion(x.id, -1)} />
            <Circle icon="arrowDown" size="xs" iconSize={12} label="Move down" disabled={i === db.obsQuestions.length - 1} onClick={() => moveObsQuestion(x.id, 1)} />
          </span>
          <input className="input grow" style={{ height: 38, flex: '1 1 260px', background: 'var(--surface)' }} defaultValue={x.text} onBlur={(e) => { if (e.target.value.trim() && e.target.value !== x.text) { updateObsQuestion(x.id, { text: e.target.value.trim() }); toast('Question updated'); } }} aria-label="Question" />
          <select className="select" value={x.type} onChange={(e) => updateObsQuestion(x.id, { type: e.target.value })} aria-label="Answer type">{TYPES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          <OnOff value={x.active} onChange={(v) => updateObsQuestion(x.id, { active: v })} />
        </div>
      ))}
      <form className="row gap-8 wrap" style={{ marginTop: 6 }} onSubmit={(e) => { e.preventDefault(); if (!text.trim()) return; addObsQuestion({ text: text.trim(), type }); setText(''); toast('Question added'); }}>
        <input className="input" style={{ flex: '1 1 260px' }} placeholder="New question, e.g. Does the student participate in class?" value={text} onChange={(e) => setText(e.target.value)} />
        <select aria-label="Answer type" className="select" value={type} onChange={(e) => setType(e.target.value)}>{TYPES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        <button className="btn" disabled={!text.trim()}><Icon name="plus" size={14} />Add question</button>
      </form>
    </div>
  );
}
