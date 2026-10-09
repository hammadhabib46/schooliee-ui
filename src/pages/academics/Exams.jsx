import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import { Circle } from '../../components/Bento.jsx';
import { PageHead } from '../../components/Shell.jsx';
import { Chips, Empty, Field, Menu, Modal, Search } from '../../components/ui.jsx';
import { useSchool } from '../../lib/store.jsx';
import { cx, dateShort } from '../../lib/format.js';
import { AcademicsTabs } from './Attendance.jsx';
import { exportCsv, printView } from '../../lib/exporter.js';

export default function Exams() {
  const { db, classById, active, duplicateExam, deleteExam, restoreItem, toast } = useSchool();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState('all');
  const [q, setQ] = useState('');
  const [cls, setCls] = useState('all');
  const [tag, setTag] = useState('all');
  const [sec, setSec] = useState('all');
  const [subj, setSubj] = useState('all');
  const [range, setRange] = useState('all');
  const [creating, setCreating] = useState(false);
  const [openGroups, setOpenGroups] = useState({});
  useEffect(() => { if (params.get('new')) { setCreating(true); setParams({}, { replace: true }); } }, [params, setParams]);

  const withMeta = db.exams.map((e) => {
    const students = active.filter((s) => s.classId === e.classId && s.section === e.section);
    const entered = Object.keys(e.results).length;
    return { ...e, students, entered, state: e.published ? 'published' : entered ? 'draft' : 'pending' };
  });
  const subjects = [...new Set(db.exams.flatMap((e) => e.subjects.map(([n]) => n)))];
  const secs = [...new Set(db.exams.filter((e) => cls === 'all' || e.classId === cls).map((e) => e.section))];
  const since = { week: '2026-10-03', month: '2026-10-01', all: '' }[range];
  const tags = [...new Set(db.exams.flatMap((e) => e.tags || []))];
  const rows = withMeta
    .filter((e) => view === 'all' || e.state === view)
    .filter((e) => cls === 'all' || e.classId === cls)
    .filter((e) => tag === 'all' || (e.tags || []).includes(tag))
    .filter((e) => sec === 'all' || e.section === sec)
    .filter((e) => subj === 'all' || e.subjects.some(([n]) => n === subj))
    .filter((e) => !since || (e.created || e.date || '') >= since)
    .filter((e) => { const t = q.toLowerCase(); return !t || e.name.toLowerCase().includes(t) || e.subjects.some(([n]) => n.toLowerCase().includes(t)); });

  // Exams created together for several sections show as one row that expands.
  const groups = [];
  rows.forEach((e) => {
    const key = `${e.name}|${e.date}|${e.created || ''}`;
    const g = groups.find((x) => x.key === key);
    if (g) g.items.push(e); else groups.push({ key, items: [e] });
  });
  const renderRow = (e, child = false) => (
<tr key={e.id} className={cx('click', child && 'exam-child')} onClick={() => nav(`/academics/exams/${e.id}`)}>
                <td>{child ? <span className="small" style={{ paddingLeft: 22 }}>Section {e.section}</span> : <><span className="medium">{e.name}</span><div className="xs muted">{(e.tags || []).map((t) => `#${t} `)}by {e.by}</div></>}</td>
                <td>{classById[e.classId]?.name} <span className="muted">· {e.section}</span></td>
                <td className="hide-sm"><span className="row wrap gap-4">{e.subjects.map(([n]) => <span key={n} className="tag" style={{ height: 22, fontSize: 11 }}>{n}</span>)}</span></td>
                <td className="hide-sm">{dateShort(e.date)}</td>
                <td><span className="row gap-8"><span className="meter thin" style={{ width: 70 }}><span style={{ width: `${e.students.length ? (e.entered / e.students.length) * 100 : 0}%`, background: 'var(--accent-dim)' }} /></span><span className="small muted">{e.entered}/{e.students.length || 0}</span></span></td>
                <td>{e.state === 'published' ? <span className="pill ok">Published</span> : e.state === 'draft' ? <span className="pill warn">Draft</span> : <span className="pill">Pending</span>}</td>
                <td className="right" onClick={(ev) => ev.stopPropagation()}>
                  <Menu width={200} trigger={({ toggle }) => <Circle icon="moreV" size="xs" iconSize={14} label="More" onClick={toggle} />}
                    groups={[{ items: [
                      { label: 'Enter marks', icon: 'edit', onClick: () => nav(`/academics/exams/${e.id}`) },
                      { label: 'Mark sheet', icon: 'sheet', onClick: () => (printView(), toast('Blank mark sheet PDF ready', { icon: 'print' })) },
                      { label: 'Duplicate', icon: 'copy', onClick: () => { const id = duplicateExam(e.id); toast('Exam duplicated', { undo: () => deleteExam(id) }); } },
                    ] }, { items: [{ label: 'Delete', icon: 'trash', danger: true, onClick: () => { const orig = db.exams.find((x) => x.id === e.id); const i = db.exams.indexOf(orig); deleteExam(e.id); toast(`${e.name} deleted`, { undo: () => restoreItem('exams', orig, i) }); } }] }]} />
                </td>
              </tr>
  );
  return (
    <div className="page">
      <AcademicsTabs />
      <PageHead title="Exams" sub={`${db.exams.length} exams · ${withMeta.filter((e) => e.state !== 'published').length} need results · ${db.exams.reduce((a, e) => a + Object.keys(e.results).length, 0)} results entered`}
        actions={<>
          <div className="toolrow">
            <Circle icon="sliders" label="Exam settings" onClick={() => nav('/settings/exams')} />
            <Circle icon="download" label="Export" onClick={() => (exportCsv('Exams exported'), toast('Exams exported', { icon: 'download' }))} />
          </div>
          <button className="btn primary" onClick={() => setCreating(true)}><Icon name="plus" size={16} stroke={2} />Create exam</button>
        </>} />
      <section className="card pad-s" style={{ borderRadius: 28 }}>
        <div className="toolbar">
          <Chips value={view} onChange={setView} items={[
            { key: 'all', label: 'All', count: withMeta.length },
            { key: 'pending', label: 'Results pending', count: withMeta.filter((e) => e.state === 'pending').length },
            { key: 'draft', label: 'Draft', count: withMeta.filter((e) => e.state === 'draft').length },
            { key: 'published', label: 'Published', count: withMeta.filter((e) => e.state === 'published').length },
          ]} />
          <div className="grow" />
          <select aria-label="Filter by class" className="select" value={cls} onChange={(e) => { setCls(e.target.value); setSec('all'); }}><option value="all">Class: All</option>{db.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <select className="select" value={sec} onChange={(e) => setSec(e.target.value)} aria-label="Section"><option value="all">Section: All</option>{secs.map((x) => <option key={x}>{x}</option>)}</select>
          <select className="select" value={subj} onChange={(e) => setSubj(e.target.value)} aria-label="Subject"><option value="all">Subject: All</option>{subjects.map((x) => <option key={x}>{x}</option>)}</select>
          <select className="select" value={range} onChange={(e) => setRange(e.target.value)} aria-label="Created"><option value="all">Any date</option><option value="week">Last 7 days</option><option value="month">This month</option></select>
          {tags.length > 0 && <select aria-label="Filter by tag" className="select" value={tag} onChange={(e) => setTag(e.target.value)}><option value="all">Tag: All</option>{tags.map((t) => <option key={t}>{t}</option>)}</select>}
          <Search value={q} onChange={setQ} placeholder="Exam or subject" />
        </div>
        {rows.length ? (
          <div className="table-wrap"><table className="table resp" style={{ minWidth: 820 }}>
            <thead><tr><th>Exam</th><th>Class</th><th className="hide-sm">Subjects</th><th className="hide-sm">Date</th><th>Results</th><th>Status</th><th /></tr></thead>
            <tbody>{groups.map((g) => {
              if (g.items.length === 1) return renderRow(g.items[0]);
              const open = openGroups[g.key];
              const entered = g.items.reduce((a, e) => a + e.entered, 0);
              const total = g.items.reduce((a, e) => a + e.students.length, 0);
              const pub = g.items.filter((e) => e.state === 'published').length;
              return [
                <tr key={g.key} className="click exam-group" onClick={() => setOpenGroups({ ...openGroups, [g.key]: !open })} aria-expanded={!!open}>
                  <td><span className="row gap-8"><Icon name={open ? 'chevUp' : 'chevDown'} size={14} className="muted" /><span><span className="medium">{g.items[0].name}</span><div className="xs muted">{g.items.length} sections · by {g.items[0].by}</div></span></span></td>
                  <td><span className="row wrap gap-4">{[...new Set(g.items.map((e) => e.classId))].map((c) => <span key={c} className="tag" style={{ height: 22, fontSize: 11 }}>{classById[c]?.name}</span>)}</span></td>
                  <td className="hide-sm"><span className="row wrap gap-4">{g.items[0].subjects.map(([n]) => <span key={n} className="tag" style={{ height: 22, fontSize: 11 }}>{n}</span>)}</span></td>
                  <td className="hide-sm">{dateShort(g.items[0].date)}</td>
                  <td><span className="row gap-8"><span className="meter thin" style={{ width: 70 }}><span style={{ width: `${total ? (entered / total) * 100 : 0}%`, background: 'var(--accent-dim)' }} /></span><span className="small muted">{entered}/{total}</span></span></td>
                  <td>{pub === g.items.length ? <span className="pill ok">Published</span> : <span className={`pill ${pub ? 'warn' : ''}`}>{pub}/{g.items.length} published</span>}</td>
                  <td />
                </tr>,
                ...(open ? g.items.map((e) => renderRow(e, true)) : []),
              ];
            })}</tbody>
          </table></div>
        ) : <Empty icon="exam" title="No exams match" />}
      </section>
      {creating && <CreateExam onClose={() => setCreating(false)} />}
    </div>
  );
}

// Bulk create: one exam per selected class-section, same subjects and schedule.
function CreateExam({ onClose }) {
  const { db, addExams, toast } = useSchool();
  const [name, setName] = useState('Monthly test');
  const [picked, setPicked] = useState({});
  const [subjects, setSubjects] = useState([['English', 100, '2026-10-15'], ['Urdu', 100, '2026-10-16'], ['Maths', 100, '2026-10-17']]);
  const [tags, setTags] = useState('');
  const keys = Object.keys(picked).filter((k) => picked[k]);
  const save = () => {
    const list = keys.map((k) => { const [classId, section] = k.split('|'); return { name, classId, section, date: subjects[0]?.[2] || '2026-10-15', subjects: subjects.filter(([n]) => n).map(([n, m]) => [n, Number(m) || 100]), schedule: Object.fromEntries(subjects.map(([n, , d]) => [n, d])), tags: tags.split(',').map((t) => t.trim()).filter(Boolean) }; });
    addExams(list);
    toast(`${list.length} exam${list.length > 1 ? 's' : ''} created · schedule ready to send`);
    onClose();
  };
  return (
    <Modal open onClose={onClose} wide title="Create exam" sub="Create it once for many classes — one exam per section"
      footer={<><span className="small muted grow">{keys.length} section{keys.length === 1 ? '' : 's'} selected</span><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" disabled={!name || !keys.length || !subjects.length} onClick={save}>Create {keys.length || ''} exam{keys.length === 1 ? '' : 's'}</button></>}>
      <div className="form-grid">
        <Field label="Exam name"><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Tags" optional hint="Comma separated, e.g. mid-term, 2026"><input className="input" value={tags} onChange={(e) => setTags(e.target.value)} /></Field>
      </div>
      <div className="col gap-8">
        <div className="row between"><span className="label">Classes & sections</span><button className="link small" onClick={() => setPicked(keys.length ? {} : Object.fromEntries(db.classes.flatMap((c) => c.sections.map((s) => [`${c.id}|${s}`, true]))))}>{keys.length ? 'Clear' : 'Select all'}</button></div>
        <div className="row wrap gap-6">
          {db.classes.flatMap((c) => c.sections.map((s) => {
            const k = `${c.id}|${s}`;
            return <button key={k} className={cx('chip sm', picked[k] && 'on')} onClick={() => setPicked({ ...picked, [k]: !picked[k] })}>{picked[k] && <Icon name="check" size={12} stroke={2.6} />}{c.name} · {s}</button>;
          }))}
        </div>
      </div>
      <div className="col gap-8">
        <div className="row between"><span className="label">Subjects · total marks · date</span><button className="link small" onClick={() => setSubjects([...subjects, ['', 100, '2026-10-18']])}>+ Add subject</button></div>
        {subjects.map(([n, m, d], i) => (
          <div key={i} className="row gap-8">
            <input className="input grow" value={n} placeholder="Subject" onChange={(e) => setSubjects(subjects.map((x, j) => (j === i ? [e.target.value, x[1], x[2]] : x)))} />
            <input className="input" style={{ width: 90 }} value={m} onChange={(e) => setSubjects(subjects.map((x, j) => (j === i ? [x[0], e.target.value.replace(/\D/g, ''), x[2]] : x)))} />
            <input className="input" type="date" style={{ width: 170 }} value={d} onChange={(e) => setSubjects(subjects.map((x, j) => (j === i ? [x[0], x[1], e.target.value] : x)))} />
            <Circle icon="close" size="sm" iconSize={13} label="Remove" onClick={() => setSubjects(subjects.filter((_, j) => j !== i))} />
          </div>
        ))}
      </div>
    </Modal>
  );
}
