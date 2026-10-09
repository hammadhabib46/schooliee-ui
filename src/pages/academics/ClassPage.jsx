import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import { Circle } from '../../components/Bento.jsx';
import { Avatar, Chips, Empty, Field, Modal, Search, Seg } from '../../components/ui.jsx';
import { useSchool, dueOf, code } from '../../lib/store.jsx';
import { cx, dateShort, fmt } from '../../lib/format.js';
import { exportCsv } from '../../lib/exporter.js';
import { AcademicsTabs } from './Attendance.jsx';
import { Row } from '../students/StudentProfile.jsx';
import { ClassModal, FeeModal, MergeModal, useClassStats } from './Classes.jsx';

const VIEW_KEY = 'schooliee-class-students-view';
const PAGE = 50;
const ATT = { P: ['Present', 'ok'], L: ['Late', 'warn'], A: ['Absent', 'danger'], V: ['Leave', 'info'] };

// One class: every student in it, by section, with the tools a class needs at scale.
export default function ClassPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const { db, familyById, todayAtt, open, toast } = useSchool();
  const c = useClassStats().find((x) => x.id === id);
  const section = params.get('section') || 'all';
  const setSection = (v) => { const p = new URLSearchParams(params); if (v === 'all') p.delete('section'); else p.set('section', v); setParams(p, { replace: true }); setSel({}); };
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState({ k: 'roll', dir: 1 });
  const [view, setViewRaw] = useState(() => { try { return localStorage.getItem(VIEW_KEY) || 'list'; } catch { return 'list'; } });
  const setView = (v) => { setViewRaw(v); try { localStorage.setItem(VIEW_KEY, v); } catch { /* private mode */ } };
  const [sel, setSel] = useState({});
  const phone = typeof window !== 'undefined' && window.innerWidth < 760; // tables don't fit a phone — cards do
  const [limit, setLimit] = useState(PAGE);
  const [modal, setModal] = useState(null);

  const inSection = useMemo(() => (c ? c.kids.filter((s) => section === 'all' || s.section === section) : []), [c, section]);
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    const fam = (s) => familyById[s.familyId];
    const val = { roll: (s) => Number(s.roll) || 9999, name: (s) => s.name.toLowerCase(), father: (s) => (fam(s)?.name || '').toLowerCase(), due: (s) => -dueOf(s), section: (s) => s.section };
    return inSection
      .filter((s) => filter === 'all' || (filter === 'due' ? dueOf(s) > 0 : filter === 'absent' ? todayAtt[s.id] === 'A' : filter === 'unmarked' ? !todayAtt[s.id] : filter === 'new' ? s.isNew : true))
      .filter((s) => !t || s.name.toLowerCase().includes(t) || code(s).toLowerCase().includes(t) || String(s.roll) === t || fam(s)?.name.toLowerCase().includes(t) || fam(s)?.phone.includes(t) || fam(s)?.cnic?.includes(t))
      .sort((a, b) => { const x = val[sort.k](a), y = val[sort.k](b); return (x > y ? 1 : x < y ? -1 : 0) * sort.dir; });
  }, [inSection, q, filter, sort, familyById, todayAtt]);

  if (!c) return <div className="page"><Empty icon="layers" title="Class not found"><Link to="/academics/classes" className="link">Back to classes</Link></Empty></div>;

  const selIds = Object.keys(sel).filter((k) => sel[k]);
  const shown = rows.slice(0, limit);
  const allSel = shown.length > 0 && shown.every((s) => sel[s.id]);
  const marked = inSection.filter((s) => todayAtt[s.id]).length;
  const present = inSection.filter((s) => ['P', 'L'].includes(todayAtt[s.id])).length;
  const due = inSection.reduce((a, s) => a + dueOf(s), 0);
  const hist = db.classFeeHistory[c.id] || [{ date: '2026-04-01', fee: c.fee, kind: 'created', by: 'Demo school' }];
  const created = hist[0];
  const sortBy = (k) => setSort((s) => (s.k === k ? { k, dir: -s.dir } : { k, dir: 1 }));
  const Th = ({ k, children, className }) => (
    <th className={className}><button className={cx('th-sort', sort.k === k && 'on')} onClick={() => sortBy(k)}>{children}{sort.k === k && <Icon name={sort.dir > 0 ? 'arrowUp' : 'arrowDown'} size={11} />}</button></th>
  );
  const attSection = section === 'all' ? c.sections.find((x) => c.kids.some((k) => k.section === x)) || c.sections[0] : section;
  const famIds = [...new Set(selIds.map((sid) => c.kids.find((k) => k.id === sid)?.familyId).filter(Boolean))];

  return (
    <div className="page">
      <AcademicsTabs />
      <div className="cls-head">
        <div style={{ minWidth: 0 }}>
          <Link to="/academics/classes" className="back-pill"><span className="circle xs"><Icon name="arrowLeft" size={13} /></span>Classes</Link>
          <h1 className="h1 sm" style={{ marginTop: 14 }}>{c.name}</h1>
          <div className="small muted" style={{ marginTop: 10 }}>{c.sections.length} section{c.sections.length > 1 ? 's' : ''} · {c.kids.length} students · {fmt(c.fee)} PKR a month</div>
        </div>
        <div className="row wrap gap-8">
          <div className="toolrow">
            <Circle icon="edit" label="Edit class & sections" onClick={() => setModal('edit')} />
            <Circle icon="family" label="Merge sections" onClick={() => setModal('merge')} />
            <Circle icon="fund" label="Change fee" onClick={() => setModal('fee')} />
            <Circle icon="download" label="Export students" onClick={() => (exportCsv(`${c.name} students exported`), toast(`${c.name} — ${rows.length} students exported`, { icon: 'download' }))} />
          </div>
          {c.kids.length > 0 && <button className="btn primary" onClick={() => nav(`/academics/attendance?section=${encodeURIComponent(`${c.id}|${attSection}`)}`)}><Icon name="check" size={16} stroke={2.2} />Mark attendance</button>}
        </div>
      </div>

      <div className="cls-stats">
        <div><span>Students{section !== 'all' ? ` · ${section}` : ''}</span><b>{inSection.length}</b><em>{inSection.filter((s) => s.gender === 'Male').length} boys · {inSection.filter((s) => s.gender === 'Female').length} girls</em></div>
        <div><span>Today</span><b>{marked ? `${present}/${inSection.length}` : '—'}</b><em>{marked < inSection.length ? `${inSection.length - marked} not marked yet` : 'Attendance done'}</em></div>
        <div><span>Fees due</span><b className={due ? 'danger-text' : ''}>{fmt(due)} <small>PKR</small></b><em>{inSection.filter((s) => dueOf(s) > 0).length} students owe</em></div>
        <div><span>Monthly fee</span><b>{fmt(c.fee)} <small>PKR</small></b><em>since {dateShort(hist[hist.length - 1].date)}</em></div>
      </div>

      <div className="cls-body">
        <section className="card pad-s" style={{ borderRadius: 28, minWidth: 0 }}>
          <div className="cls-sections" role="tablist" aria-label="Sections">
            <button role="tab" aria-selected={section === 'all'} className={cx('cls-sec', section === 'all' && 'on')} onClick={() => setSection('all')}>All sections<span>{c.kids.length}</span></button>
            {c.perSection.map((x) => (
              <button key={x.name} role="tab" aria-selected={section === x.name} className={cx('cls-sec', section === x.name && 'on')} onClick={() => setSection(x.name)}>Section {x.name}<span>{x.n}</span></button>
            ))}
            {section !== 'all' && <button className="link small" onClick={() => setModal('rename')}><Icon name="edit" size={13} />Rename section</button>}
          </div>

          <div className="toolbar">
            <Chips value={filter} onChange={setFilter} items={[
              { key: 'all', label: 'All', count: inSection.length },
              { key: 'due', label: 'Fee due', count: inSection.filter((s) => dueOf(s) > 0).length },
              { key: 'absent', label: 'Absent today', count: inSection.filter((s) => todayAtt[s.id] === 'A').length },
              { key: 'unmarked', label: 'Not marked', count: inSection.filter((s) => !todayAtt[s.id]).length },
              { key: 'new', label: 'New', count: inSection.filter((s) => s.isNew).length },
            ]} />
            <div className="grow" />
            <Search value={q} onChange={(v) => { setQ(v); setLimit(PAGE); }} placeholder="Name, roll no., father, phone, CNIC" />
            <Seg value={view} onChange={setView} items={[{ key: 'list', label: <Icon name="list" size={15} />, title: 'List view' }, { key: 'cards', label: <Icon name="grid" size={15} />, title: 'Card view' }]} />
          </div>

          {selIds.length > 0 && (
            <div className="bulk-bar">
              <b>{selIds.length} selected</b>
              {c.sections.length > 1 && <button className="btn sm" onClick={() => setModal('move')}><Icon name="layers" size={14} />Move section</button>}
              <button className="btn sm" onClick={() => setModal('promote')}><Icon name="arrowUpRight" size={14} />Promote</button>
              <button className="btn sm" onClick={() => open('compose', { familyIds: famIds })}><Icon name="whatsapp" size={14} />Message parents</button>
              <button className="btn sm" onClick={() => (exportCsv(`${selIds.length} students exported`), toast(`${selIds.length} students exported`, { icon: 'download' }))}><Icon name="download" size={14} />Export</button>
              <div className="grow" />
              <button className="link small" onClick={() => setSel({})}>Clear</button>
            </div>
          )}

          {!rows.length ? (
            <Empty icon="people" title={inSection.length ? 'No students match' : 'No students in this class yet'}>
              {inSection.length ? 'Try another filter or search.' : <Link className="link" to="/students/new">Admit a student</Link>}
            </Empty>
          ) : view === 'list' && !phone ? (
            <div className="table-wrap">
              <table className="table resp" style={{ minWidth: 760 }}>
                <thead><tr>
                  <th style={{ width: 36 }}><input type="checkbox" className="check" aria-label="Select all shown" checked={allSel} onChange={() => setSel(allSel ? {} : Object.fromEntries(shown.map((s) => [s.id, true])))} /></th>
                  <Th k="roll" className="num">Roll</Th>
                  <Th k="name">Student</Th>
                  <Th k="father" className="hide-sm">Father · family</Th>
                  {section === 'all' && c.sections.length > 1 && <Th k="section">Section</Th>}
                  <th className="hide-sm">Today</th>
                  <Th k="due" className="num">Fee due</Th>
                  <th style={{ width: 80 }} />
                </tr></thead>
                <tbody>{shown.map((s) => {
                  const f = familyById[s.familyId];
                  const a = ATT[todayAtt[s.id]];
                  return (
                    <tr key={s.id} className={cx('click', sel[s.id] && 'hi')} onClick={() => nav(`/students/${s.id}`)}>
                      <td onClick={(e) => e.stopPropagation()}><input type="checkbox" className="check" aria-label={`Select ${s.name}`} checked={!!sel[s.id]} onChange={() => setSel({ ...sel, [s.id]: !sel[s.id] })} /></td>
                      <td className="num muted">{s.roll || '—'}</td>
                      <td><span className="person"><Avatar name={s.name} id={s.id} size={34} /><span><span className="nm">{s.name}{s.isNew && <span className="pill ok" style={{ height: 18, fontSize: 10, marginLeft: 6 }}>New</span>}</span><span className="id">{code(s)}{s.dob ? ` · born ${dateShort(s.dob)}` : ''}</span></span></span></td>
                      <td className="hide-sm">{f ? <><Link to={`/students/families/${f.id}`} className="small medium" onClick={(e) => e.stopPropagation()}>{f.name}</Link><span className="xs muted" style={{ display: 'block' }}>{f.id} · {f.phone}</span></> : '—'}</td>
                      {section === 'all' && c.sections.length > 1 && <td><span className="tag">{s.section}</span></td>}
                      <td className="hide-sm">{a ? <span className={`pill ${a[1]}`}>{a[0]}</span> : <span className="xs muted">Not marked</span>}</td>
                      <td className="num">{dueOf(s) ? <span className="danger-text strong">{fmt(dueOf(s))}</span> : <span className="ok-text small">Clear</span>}</td>
                      <td className="right" onClick={(e) => e.stopPropagation()}>{dueOf(s) > 0 && <button className="btn xs" onClick={() => open('collect', { studentId: s.id })}>Pay</button>}</td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          ) : (
            <div className="stu-cards">
              {shown.map((s) => {
                const f = familyById[s.familyId];
                const a = ATT[todayAtt[s.id]];
                return (
                  <div key={s.id} className={cx('stu-card', sel[s.id] && 'on')}>
                    <input type="checkbox" className="check stu-card-check" aria-label={`Select ${s.name}`} checked={!!sel[s.id]} onChange={() => setSel({ ...sel, [s.id]: !sel[s.id] })} />
                    <Link to={`/students/${s.id}`} className="stu-card-main">
                      <Avatar name={s.name} id={s.id} size={52} />
                      <b>{s.name}</b>
                      <em>Roll {s.roll || '—'} · {code(s)}{section === 'all' && c.sections.length > 1 ? ` · ${s.section}` : ''}</em>
                      <span className="xs muted">{f?.name} · {f?.phone}</span>
                    </Link>
                    <div className="stu-card-foot">
                      {a ? <span className={`pill ${a[1]}`}>{a[0]}</span> : <span className="pill">Not marked</span>}
                      {dueOf(s) ? <button className="btn xs" onClick={() => open('collect', { studentId: s.id })}>Pay {fmt(dueOf(s))}</button> : <span className="ok-text xs strong">Fees clear</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {rows.length > limit && <button className="btn" style={{ alignSelf: 'center', marginTop: 12 }} onClick={() => setLimit(limit + PAGE)}>Show {Math.min(PAGE, rows.length - limit)} more · {rows.length - limit} left</button>}
          {rows.length > 0 && <div className="xs muted" style={{ padding: '10px 6px 2px' }}>Showing {shown.length} of {rows.length}{rows.length !== inSection.length ? ` (filtered from ${inSection.length})` : ''}</div>}
        </section>

        <aside className="card col gap-16 cls-about" style={{ borderRadius: 28, padding: 22 }} aria-label="About this class">
          <div className="small muted">About this class</div>
          <div className="grid g2" style={{ gap: 8 }}>
            <div className="tile"><div className="k">Fee</div><div className="v">{fmt(c.fee)}</div></div>
            <div className="tile"><div className="k">Created</div><div className="v small">{dateShort(created.date)}</div></div>
            <div className="tile"><div className="k">Latest session</div><div className="v small">{dateShort([...hist].reverse().find((h) => h.kind === 'session')?.date || created.date)}</div></div>
            <div className="tile"><div className="k">Created by</div><div className="v small">{created.by}</div></div>
          </div>
          <div className="col gap-6">
            <span className="xs muted">Sections</span>
            {c.perSection.map((x) => (
              <button key={x.name} className="row between small cls-sec-row" onClick={() => setSection(x.name)}>
                <span>Section {x.name}</span>
                <span className="row gap-8"><span className="cls-mini"><i style={{ width: `${c.kids.length ? (x.n / c.kids.length) * 100 : 0}%` }} /></span><b>{x.n}</b></span>
              </button>
            ))}
          </div>
          <div className="col gap-4">
            <span className="xs muted">Fee timeline</span>
            {[...hist].reverse().map((h, i) => <Row key={i} icon={h.kind === 'created' ? 'plus' : h.kind === 'session' ? 'calendar' : 'fund'} tone={h.kind === 'changed' || h.kind === 'corrected' ? 'warn' : 'muted'} title={`${({ created: 'Class created', session: 'Session started', changed: 'Fee changed', corrected: 'Fee corrected (retroactive)' })[h.kind]} · ${fmt(h.fee)} PKR`} sub={`${dateShort(h.date)} · by ${h.by}`} />)}
          </div>
        </aside>
      </div>

      {modal === 'edit' && <ClassModal c={c} onClose={() => setModal(null)} />}
      {modal === 'fee' && <FeeModal c={c} onClose={() => setModal(null)} />}
      {modal === 'merge' && <MergeModal c={c} kids={c.kids} onClose={() => setModal(null)} />}
      {modal === 'rename' && <RenameSection c={c} section={section} onDone={(to) => { setModal(null); if (to) setSection(to); }} />}
      {modal === 'move' && <MoveModal c={c} ids={selIds} onClose={() => { setModal(null); setSel({}); }} />}
      {modal === 'promote' && <PromoteModal c={c} ids={selIds} onClose={() => { setModal(null); setSel({}); }} />}
    </div>
  );
}

function RenameSection({ c, section, onDone }) {
  const { renameSection, toast } = useSchool();
  const [name, setName] = useState(section);
  const taken = name !== section && c.sections.includes(name);
  return (
    <Modal open onClose={() => onDone()} title="Rename section" sub={`${c.name} · section ${section}`}
      footer={<><button className="btn ghost" onClick={() => onDone()}>Cancel</button><button className="btn primary" disabled={!name.trim() || name === section || taken} onClick={() => { renameSection(c.id, section, name.trim()); toast(`Section renamed to ${name.trim()}`); onDone(name.trim()); }}>Rename</button></>}>
      <Field label="Section name" hint={taken ? 'This class already has a section with that name — use Merge sections instead.' : undefined}><input className="input" autoFocus value={name} onChange={(e) => setName(e.target.value)} /></Field>
    </Modal>
  );
}

function MoveModal({ c, ids, onClose }) {
  const { updateStudent, toast } = useSchool();
  const [to, setTo] = useState(c.sections[0]);
  return (
    <Modal open onClose={onClose} title={`Move ${ids.length} student${ids.length > 1 ? 's' : ''}`} sub={`${c.name} — choose the new section`}
      footer={<><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" onClick={() => { const before = ids.map((id) => [id, c.kids.find((k) => k.id === id)?.section]); ids.forEach((id) => updateStudent(id, { section: to })); toast(`${ids.length} moved to section ${to}`, { undo: () => before.forEach(([id, sec]) => updateStudent(id, { section: sec })) }); onClose(); }}>Move to {to}</button></>}>
      <div className="row wrap gap-6">{c.sections.map((x) => <button key={x} className={cx('chip', to === x && 'on')} onClick={() => setTo(x)}>Section {x}</button>)}</div>
    </Modal>
  );
}

// Same as promoting one student on live (class, section, promotion fee received now), for many at once.
function PromoteModal({ c, ids, onClose }) {
  const { db, promote, toast } = useSchool();
  const ordered = [...db.classes].sort((a, b) => a.order - b.order);
  const next = ordered[Math.min(ordered.length - 1, ordered.findIndex((x) => x.id === c.id) + 1)];
  const [classId, setClassId] = useState(next.id);
  const cls = db.classes.find((x) => x.id === classId);
  const [section, setSection] = useState(cls.sections[0]);
  const [fee, setFee] = useState('');
  return (
    <Modal open onClose={onClose} title={`Promote ${ids.length} student${ids.length > 1 ? 's' : ''}`} sub={`From ${c.name}`}
      footer={<><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" disabled={classId === c.id} onClick={() => { ids.forEach((id) => promote(id, { classId, section, fee })); toast(`${ids.length} promoted to ${cls.name} ${section}`); onClose(); }}>Promote to {cls.name}</button></>}>
      <div className="form-grid">
        <Field label="New class"><select className="select" value={classId} onChange={(e) => { setClassId(e.target.value); setSection(db.classes.find((x) => x.id === e.target.value).sections[0]); }}>{ordered.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></Field>
        <Field label="Section"><select className="select" value={section} onChange={(e) => setSection(e.target.value)}>{cls.sections.map((x) => <option key={x}>{x}</option>)}</select></Field>
        <Field label="Promotion fee per student (PKR)" optional span hint="Received now as income for each student, like on a single promotion."><input className="input" inputMode="numeric" value={fee} onChange={(e) => setFee(e.target.value.replace(/\D/g, ''))} placeholder="0" /></Field>
      </div>
      {Number(fee) > 0 && <div className="small muted">Total received: {fmt(Number(fee) * ids.length)} PKR.</div>}
    </Modal>
  );
}
