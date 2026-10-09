import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import { PageHead } from '../../components/Shell.jsx';
import { Empty, Field } from '../../components/ui.jsx';
import { useSchool } from '../../lib/store.jsx';
import { cx, dateLong, dateShort } from '../../lib/format.js';
import { AcademicsTabs } from './Attendance.jsx';
import { Circle } from '../../components/Bento.jsx';
import { exportCsv } from '../../lib/exporter.js';

const SUBJECTS = ['English', 'Urdu', 'Maths', 'Science', 'Islamiat', 'Social studies', 'General'];

export default function Diary() {
  const { db, classById, addDiary, updateDiary, removeDiary, restoreItem, toast, sections } = useSchool();
  const [editing, setEditing] = useState(null);
  const [params, setParams] = useSearchParams();
  const ref = useRef(null);
  const [targets, setTargets] = useState(sections[0] ? [sections[0].key] : []);
  const [date, setDate] = useState('2026-10-09');
  const [image, setImage] = useState(null);
  const [subject, setSubject] = useState('English');
  const [body, setBody] = useState('');
  const [filter, setFilter] = useState('all');
  useEffect(() => { if (params.get('new')) { ref.current?.focus(); setParams({}, { replace: true }); } }, [params, setParams]);

  const rows = db.diary.filter((d) => filter === 'all' || `${d.classId}|${d.section}` === filter);
  const byDate = rows.reduce((a, d) => ({ ...a, [d.date]: [...(a[d.date] || []), d] }), {});
  const todayDone = new Set(db.diary.filter((d) => d.date === '2026-10-09').map((d) => `${d.classId}|${d.section}`));

  const toggle = (k) => setTargets(targets.includes(k) ? targets.filter((x) => x !== k) : [...targets, k]);
  const post = () => {
    targets.forEach((t) => { const [classId, section] = t.split('|'); addDiary({ title: subject, classId, section, body, date, image: image?.name }); });
    toast(targets.length === 1 ? `Diary posted to ${sections.find((x) => x.key === targets[0])?.label} parents` : `Diary posted to ${targets.length} sections`);
    setBody(''); setImage(null);
  };

  return (
    <div className="page">
      <AcademicsTabs />
      <PageHead title="Diary" sub={`Homework & notes for parents · ${todayDone.size} of ${sections.length} sections posted today`}
        actions={<div className="toolrow"><Circle icon="download" label="Export" onClick={() => { exportCsv('Diary'); toast('Diary exported', { icon: 'download' }); }} /></div>} />
      <div className="split">
        <section className="card main col gap-12">
          <h2 className="h2">Today’s homework</h2>
          <div className="row wrap gap-6">
            {sections.map((s) => (
              <button key={s.key} className={cx('chip sm', targets.includes(s.key) && 'on')} onClick={() => toggle(s.key)}>
                {todayDone.has(s.key) && <Icon name="check" size={13} stroke={2.6} />}{s.label}
              </button>
            ))}
          </div>
          <div className="row wrap gap-6">
            {SUBJECTS.map((s) => <button key={s} className={cx('chip sm', subject === s && 'on')} style={{ height: 30 }} onClick={() => setSubject(s)}>{s}</button>)}
          </div>
          <div className="row gap-8 xs muted"><button className="btn xs ghost" onClick={() => setTargets(sections.map((x) => x.key))}>Select all</button><button className="btn xs ghost" onClick={() => setTargets(sections.filter((x) => !todayDone.has(x.key)).map((x) => x.key))}>Only missing</button><span>{targets.length} selected</span></div>
          <Field label={`${subject} · ${targets.length === 1 ? sections.find((x) => x.key === targets[0])?.label : `${targets.length} sections`}`}>
            <textarea ref={ref} className="textarea" rows={4} value={body} onChange={(e) => setBody(e.target.value)} placeholder="e.g. Learn spellings on page 24 and complete exercise 3B." />
          </Field>
          <div className="row between wrap gap-8">
            <span className="row gap-8 wrap">
              <input className="input" type="date" style={{ height: 40, width: 160 }} value={date} onChange={(e) => setDate(e.target.value)} aria-label="Diary date" />
              <label className="btn sm ghost" style={{ cursor: 'pointer' }}><Icon name="image" size={14} />{image ? image.name : 'Add photo'}<input type="file" accept="image/*" hidden onChange={(e) => setImage(e.target.files[0] || null)} /></label>
            </span>
            <button className="btn primary" disabled={!body.trim() || !targets.length} onClick={post}><Icon name="send" size={15} />Post to parents</button>
          </div>
        </section>
        <aside className="side">
          <section className="card pad-m">
            <div className="row between"><h2 className="h2 sm">This week</h2><span className="small muted">{db.diary.length} entries</span></div>
            <div className="grid g3 mt-12" style={{ gap: 8 }}>
              <div className="tile"><div className="k">Today</div><div className="v">{db.diary.filter((d) => d.date === '2026-10-09').length}</div></div>
              <div className="tile"><div className="k">Week</div><div className="v">{db.diary.length}</div></div>
              <div className="tile"><div className="k">Missing</div><div className="v" style={{ color: 'var(--warn)' }}>{sections.length - todayDone.size}</div></div>
            </div>
          </section>
        </aside>
      </div>

      <section className="card">
        <div className="row between wrap">
          <h2 className="h2">Earlier entries</h2>
          <select aria-label="Filter by section" className="select" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">All sections</option>{sections.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}</select>
        </div>
        {Object.keys(byDate).length ? Object.entries(byDate).map(([date, items]) => (
          <div key={date} className="mt-16">
            <div className="upper" style={{ marginBottom: 8 }}>{date === '2026-10-09' ? 'Today' : dateLong(date)}</div>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
              {items.map((d) => (
                <article key={d.id} className="tile" style={{ padding: 16 }}>
                  <div className="row between"><span className="pill outline">{d.title}</span><span className="xs muted">{classById[d.classId]?.name} · {d.section}</span></div>
                  <p className="mt-12" style={{ lineHeight: 1.5 }}>{d.body}</p>
                  {d.image && <div className="row gap-6 xs muted mt-8"><Icon name="image" size={13} />{d.image}</div>}
                  {editing?.id === d.id ? (
                    <div className="col gap-6 mt-8">
                      <textarea className="textarea" rows={3} value={editing.body} onChange={(e) => setEditing({ ...editing, body: e.target.value })} />
                      <div className="row gap-6"><button className="btn sm ghost" onClick={() => setEditing(null)}>Cancel</button><button className="btn sm primary" onClick={() => { updateDiary(d.id, { body: editing.body }); toast('Diary updated · parents see the new text'); setEditing(null); }}>Save</button></div>
                    </div>
                  ) : (
                    <div className="row between mt-12">
                      <span className="xs muted">{d.by} · {dateShort(d.date)}{d.editedBy ? ` · edited by ${d.editedBy}` : ''}</span>
                      <span className="row gap-4">
                        <Circle icon="edit" size="xs" iconSize={12} label="Edit entry" onClick={() => setEditing({ id: d.id, body: d.body })} />
                        <Circle icon="trash" size="xs" iconSize={12} label="Delete entry" onClick={() => { const i = db.diary.findIndex((x) => x.id === d.id); removeDiary(d.id); toast('Diary entry deleted', { undo: () => restoreItem('diary', d, i) }); }} />
                      </span>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>
        )) : <Empty icon="diary" title="No diary entries" />}
      </section>
    </div>
  );
}
