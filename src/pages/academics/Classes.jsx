import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import { Circle } from '../../components/Bento.jsx';
import { PageHead } from '../../components/Shell.jsx';
import { Chips, Empty, Field, Modal, Ring, Search, Seg } from '../../components/ui.jsx';
import { useSchool, dueOf } from '../../lib/store.jsx';
import { cx, dateShort, fmt } from '../../lib/format.js';
import { AcademicsTabs } from './Attendance.jsx';
import { exportCsv } from '../../lib/exporter.js';

const VIEW_KEY = 'schooliee-classes-view';
const readView = () => { try { return localStorage.getItem(VIEW_KEY) || 'list'; } catch { return 'list'; } };

// Per-class numbers used by both views and the class page.
export function useClassStats() {
  const { db, active, todayAtt } = useSchool();
  return useMemo(() => [...db.classes].sort((a, b) => a.order - b.order).map((c) => {
    const kids = active.filter((s) => s.classId === c.id);
    const marked = kids.filter((s) => todayAtt[s.id]).length;
    const present = kids.filter((s) => todayAtt[s.id] === 'P' || todayAtt[s.id] === 'L').length;
    const owing = kids.filter((s) => dueOf(s) > 0);
    return {
      ...c, kids, marked, present,
      boys: kids.filter((s) => s.gender === 'Male').length,
      girls: kids.filter((s) => s.gender === 'Female').length,
      due: owing.reduce((a, s) => a + dueOf(s), 0), owing: owing.length,
      perSection: c.sections.map((x) => ({ name: x, n: kids.filter((k) => k.section === x).length })),
    };
  }), [db.classes, active, todayAtt]);
}

export default function Classes() {
  const { db, active, toast } = useSchool();
  const nav = useNavigate();
  const all = useClassStats();
  const [q, setQ] = useState('');
  const [view, setViewRaw] = useState(readView);
  const setView = (v) => { setViewRaw(v); try { localStorage.setItem(VIEW_KEY, v); } catch { /* private mode */ } };
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('order');
  const [edit, setEdit] = useState(null);
  const [reorder, setReorder] = useState(false);

  const t = q.trim().toLowerCase();
  const list = all
    .filter((c) => !t || c.name.toLowerCase().includes(t) || c.sections.some((x) => x.toLowerCase() === t))
    .filter((c) => filter === 'all' || (filter === 'dues' ? c.due > 0 : filter === 'empty' ? !c.kids.length : filter === 'unmarked' ? c.kids.length && c.marked < c.kids.length : true))
    .sort((a, b) => (sort === 'students' ? b.kids.length - a.kids.length : sort === 'due' ? b.due - a.due : sort === 'name' ? a.name.localeCompare(b.name) : a.order - b.order));
  const sections = db.classes.reduce((a, c) => a + c.sections.length, 0);
  const billed = all.reduce((a, c) => a + c.fee * c.kids.length, 0);
  const due = all.reduce((a, c) => a + c.due, 0);
  const open = (c) => nav(`/academics/classes/${c.id}`);
  const attTone = (c) => (!c.kids.length ? 'muted' : c.marked < c.kids.length ? 'warn' : 'ok');

  return (
    <div className="page">
      <AcademicsTabs />
      <PageHead title="Classes" sub={`${db.classes.length} classes · ${sections} sections · ${active.length} students`}
        actions={<>
          <div className="toolrow">
            <Circle icon="drag" label="Reorder classes" onClick={() => setReorder(true)} />
            <Circle icon="download" label="Export CSV / PDF" onClick={() => (exportCsv('Classes exported'), toast('Classes exported', { icon: 'download' }))} />
          </div>
          <button className="btn primary" onClick={() => setEdit({})}><Icon name="plus" size={16} stroke={2} />Add class</button>
        </>} />

      <div className="cls-stats">
        <div><span>Students</span><b>{active.length}</b><em>{all.reduce((a, c) => a + c.boys, 0)} boys · {all.reduce((a, c) => a + c.girls, 0)} girls</em></div>
        <div><span>Classes · sections</span><b>{db.classes.length} <small>· {sections}</small></b><em>{all.filter((c) => !c.kids.length).length} empty</em></div>
        <div><span>Monthly fee billed</span><b>{fmt(billed)} <small>PKR</small></b><em>class fee × students</em></div>
        <div><span>Fees due</span><b className={due ? 'danger-text' : ''}>{fmt(due)} <small>PKR</small></b><em>{all.reduce((a, c) => a + c.owing, 0)} students owe</em></div>
      </div>

      <section className="card pad-s" style={{ borderRadius: 28 }}>
        <div className="toolbar">
          <Chips value={filter} onChange={setFilter} items={[
            { key: 'all', label: 'All', count: all.length },
            { key: 'dues', label: 'With dues', count: all.filter((c) => c.due > 0).length },
            { key: 'unmarked', label: 'Attendance pending', count: all.filter((c) => c.kids.length && c.marked < c.kids.length).length },
            { key: 'empty', label: 'No students', count: all.filter((c) => !c.kids.length).length },
          ]} />
          <div className="grow" />
          <select className="select" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort classes">
            <option value="order">Class order</option><option value="students">Most students</option><option value="due">Most dues</option><option value="name">Name A–Z</option>
          </select>
          <Search value={q} onChange={setQ} placeholder="Find a class or section" />
          <Seg value={view} onChange={setView} items={[{ key: 'list', label: <Icon name="list" size={15} />, title: 'List view' }, { key: 'cards', label: <Icon name="grid" size={15} />, title: 'Card view' }]} />
        </div>

        {!list.length ? <Empty icon="layers" title="No classes match">{q ? `Nothing for “${q}”.` : 'Try another filter.'}</Empty> : view === 'list' ? (
          <div className="table-wrap">
            <table className="table resp cls-table" style={{ minWidth: 860 }}>
              <thead><tr><th>Class</th><th>Sections</th><th className="num">Students</th><th className="num hide-sm">Monthly fee</th><th className="hide-sm">Today</th><th className="num">Fees due</th><th style={{ width: 96 }} /></tr></thead>
              <tbody>{list.map((c) => (
                <tr key={c.id} className="click" onClick={() => open(c)}>
                  <td><span className="person"><span className="cls-badge">{c.short}</span><span><span className="nm">{c.name}</span><span className="id">{c.boys} boys · {c.girls} girls</span></span></span></td>
                  <td><span className="row wrap gap-4">{c.perSection.map((x) => <Link key={x.name} to={`/academics/classes/${c.id}?section=${encodeURIComponent(x.name)}`} className="tag" onClick={(e) => e.stopPropagation()}>{x.name}<span className="muted"> · {x.n}</span></Link>)}</span></td>
                  <td className="num"><b>{c.kids.length}</b></td>
                  <td className="num hide-sm">{fmt(c.fee)}</td>
                  <td className="hide-sm">{c.kids.length ? <span className={`row gap-6 small ${attTone(c)}-text`}><Ring value={(c.marked / c.kids.length) * 100} size={20} stroke={3} />{c.marked < c.kids.length ? `${c.marked}/${c.kids.length} marked` : `${c.present}/${c.kids.length} present`}</span> : <span className="muted small">—</span>}</td>
                  <td className="num">{c.due ? <span className="danger-text strong">{fmt(c.due)}<span className="xs muted" style={{ display: 'block', fontWeight: 400 }}>{c.owing} student{c.owing > 1 ? 's' : ''}</span></span> : <span className="muted">—</span>}</td>
                  <td className="right" onClick={(e) => e.stopPropagation()}>
                    <span className="row gap-4" style={{ justifyContent: 'flex-end' }}>
                      {c.kids.length > 0 && <Circle icon="check" size="sm" label="Mark attendance" onClick={() => nav(`/academics/attendance?section=${encodeURIComponent(`${c.id}|${c.sections[0]}`)}`)} />}
                      <Circle icon="edit" size="sm" label="Edit class" onClick={() => setEdit(c)} />
                    </span>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : (
          <div className="cls-cards">
            {list.map((c) => (
              <button key={c.id} className="cls-card" onClick={() => open(c)}>
                <span className="row gap-10"><span className="cls-badge lg">{c.short}</span><span className="grow" style={{ minWidth: 0 }}><b>{c.name}</b><em>{c.sections.length} section{c.sections.length > 1 ? 's' : ''} · {fmt(c.fee)} PKR / month</em></span><Icon name="arrowUpRight" size={15} className="faint" /></span>
                <span className="cls-card-big"><b>{c.kids.length}</b><em>students<br />{c.boys} boys · {c.girls} girls</em></span>
                <span className="cls-bar" aria-hidden="true">{c.perSection.map((x) => <i key={x.name} style={{ flex: Math.max(x.n, 0.3) }} title={`${x.name}: ${x.n}`} />)}</span>
                <span className="row wrap gap-4">{c.perSection.map((x) => <span key={x.name} className="tag">{x.name} · {x.n}</span>)}</span>
                <span className="cls-card-foot">
                  <span className={`${attTone(c)}-text`}>{c.kids.length ? `${c.marked}/${c.kids.length} marked today` : 'No students'}</span>
                  <span className={c.due ? 'danger-text strong' : 'muted'}>{c.due ? `${fmt(c.due)} due` : 'No dues'}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </section>
      {edit && <ClassModal c={edit} onClose={() => setEdit(null)} />}
      {reorder && <ReorderModal onClose={() => setReorder(false)} />}
    </div>
  );
}

export function FeeModal({ c, onClose }) {
  const { changeClassFee, toast, active } = useSchool();
  const [mode, setMode] = useState('new');
  const [amount, setAmount] = useState(String(c.fee));
  const [from, setFrom] = useState('2026-11-01');
  const n = active.filter((s) => s.classId === c.id).length;
  return (
    <Modal open onClose={onClose} title={`Change fee — ${c.name}`} sub={`Current fee ${fmt(c.fee)} PKR · ${n} students`}
      footer={<><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" disabled={!Number(amount) || Number(amount) === c.fee} onClick={() => { changeClassFee(c.id, { mode, amount, from }); toast(mode === 'retro' ? 'Fee corrected for all months' : `New fee from ${dateShort(from)}`); onClose(); }}>Save fee</button></>}>
      <div className="col gap-8">
        {[['new', 'New fee from a date', 'Adds a new fee version. Past months keep the old fee.'], ['retro', 'Correct the current fee', 'Changes the amount for every existing month too. Use only to fix a mistake.']].map(([k, t, d]) => (
          <button key={k} onClick={() => setMode(k)} className="row top" style={{ gap: 12, padding: 14, borderRadius: 18, textAlign: 'left', border: `1.5px solid ${mode === k ? 'var(--text)' : 'var(--border)'}`, background: mode === k ? 'var(--surface-2)' : 'transparent' }}>
            <span className={cx('circle xs', mode === k && 'solid')} style={{ boxShadow: 'none' }}>{mode === k && <Icon name="check" size={12} stroke={2.6} />}</span>
            <span><span className="medium" style={{ display: 'block' }}>{t}</span><span className="small muted">{d}</span></span>
          </button>
        ))}
      </div>
      <div className="form-grid">
        <Field label="New monthly fee (PKR)"><input className="input" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))} /></Field>
        {mode === 'new' && <Field label="Effective from"><input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>}
      </div>
      {mode === 'retro' && <div className="banner warn small"><Icon name="warn" size={16} />Existing unpaid monthly fees for {n} students will be recalculated.</div>}
    </Modal>
  );
}

export function MergeModal({ c, kids, onClose }) {
  const { mergeSections, toast } = useSchool();
  const [pick, setPick] = useState([]);
  const [name, setName] = useState('');
  const count = kids.filter((k) => pick.includes(k.section)).length;
  return (
    <Modal open onClose={onClose} title="Merge sections" sub={c.name}
      footer={<><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" disabled={pick.length < 2 || !name} onClick={() => { mergeSections(c.id, pick, name); toast(`${pick.length} sections merged into ${name}`); onClose(); }}>Merge</button></>}>
      <div className="col gap-6">{c.sections.map((x) => (
        <label key={x} className="row gap-12" style={{ padding: 10, borderRadius: 14, border: '1px solid var(--border)', cursor: 'pointer' }}>
          <input type="checkbox" className="check" checked={pick.includes(x)} onChange={() => setPick(pick.includes(x) ? pick.filter((y) => y !== x) : [...pick, x])} />
          <span className="grow">Section {x}</span><span className="small muted">{kids.filter((k) => k.section === x).length} students</span>
        </label>
      ))}</div>
      {c.sections.length < 2 && <div className="small muted">This class has only one section.</div>}
      <Field label="New section name"><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. A" /></Field>
      {pick.length > 1 && <div className="small muted">{count} students will move into section “{name || '…'}”.</div>}
    </Modal>
  );
}

function ReorderModal({ onClose }) {
  const { db, reorderClasses, toast } = useSchool();
  const [ids, setIds] = useState([...db.classes].sort((a, b) => a.order - b.order).map((c) => c.id));
  const [drag, setDrag] = useState(null);
  const move = (i, j) => { if (j < 0 || j >= ids.length) return; const a = [...ids]; [a[i], a[j]] = [a[j], a[i]]; setIds(a); };
  return (
    <Modal open onClose={onClose} title="Reorder classes" sub="Drag or use the arrows. This order is used on challans, reports and promotions."
      footer={<><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" onClick={() => { reorderClasses(ids); toast('Class order saved'); onClose(); }}>Save order</button></>}>
      <div className="col gap-6">{ids.map((id, i) => {
        const c = db.classes.find((x) => x.id === id);
        return (
          <div key={id} draggable onDragStart={() => setDrag(i)} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (drag == null) return; const a = [...ids]; const [m] = a.splice(drag, 1); a.splice(i, 0, m); setIds(a); setDrag(null); }}
            className="row gap-10" style={{ padding: '8px 10px', borderRadius: 14, background: 'var(--surface-2)', cursor: 'grab' }}>
            <Icon name="drag" size={16} className="faint" /><span className="small faint" style={{ width: 20 }}>{i + 1}</span><span className="grow medium">{c.name}</span>
            <Circle icon="chevUp" size="xs" iconSize={12} label="Up" onClick={() => move(i, i - 1)} /><Circle icon="chevDown" size="xs" iconSize={12} label="Down" onClick={() => move(i, i + 1)} />
          </div>
        );
      })}</div>
    </Modal>
  );
}

export function ClassModal({ c, onClose }) {
  const { addClass, updateClass, toast } = useSchool();
  const isNew = !c.id;
  const [v, setV] = useState({ name: c.name || '', short: c.short || '', fee: String(c.fee || ''), teacher: c.teacher || '', sections: c.sections || ['A'] });
  const [sec, setSec] = useState('');
  const save = () => {
    const data = { name: v.name, sections: v.sections, fee: Number(v.fee) || 0, short: v.short || v.name.replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase() };
    if (isNew) addClass(data); else updateClass(c.id, data);
    toast(isNew ? `${v.name} added` : `${v.name} updated`);
    onClose();
  };
  const addSec = () => { if (sec && !v.sections.includes(sec)) { setV({ ...v, sections: [...v.sections, sec] }); setSec(''); } };
  return (
    <Modal open onClose={onClose} title={isNew ? 'Add class' : `Edit ${c.name}`} footer={<><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" disabled={!v.name || !v.sections.length} onClick={save}>{isNew ? 'Add class' : 'Save'}</button></>}>
      <div className="form-grid">
        <Field label="Class name"><input className="input" autoFocus value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} placeholder="e.g. Class Seven" /></Field>
        <Field label="Monthly fee (PKR)"><input className="input" value={v.fee} disabled={!isNew} onChange={(e) => setV({ ...v, fee: e.target.value.replace(/\D/g, '') })} /></Field>
      </div>
      {!isNew && <div className="xs muted" style={{ marginTop: -8 }}>To change the fee, use Change fee — it keeps the fee history right.</div>}
      <div className="col gap-8">
        <span className="label">Sections</span>
        <div className="row wrap gap-6">
          {v.sections.map((x) => <span key={x} className="tag" style={{ paddingRight: 4 }}>{x}<button className="icon-btn xs plain" aria-label={`Remove ${x}`} onClick={() => setV({ ...v, sections: v.sections.filter((y) => y !== x) })}><Icon name="close" size={11} /></button></span>)}
        </div>
        <div className="row gap-8">
          <input className="input" value={sec} onChange={(e) => setSec(e.target.value)} placeholder="New section, e.g. B" onKeyDown={(e) => { if (e.key === 'Enter') addSec(); }} />
          <Circle icon="plus" size="sm" label="Add section" onClick={addSec} />
        </div>
      </div>
    </Modal>
  );
}
