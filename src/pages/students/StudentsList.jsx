import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import QuickPayPanel from '../../components/QuickPayPanel.jsx';
import { PageHead } from '../../components/Shell.jsx';
import { Circle } from '../../components/Bento.jsx';
import { BatchPrintModal, BulkUploadModal } from '../../components/ListDialogs.jsx';
import { Avatar, Chips, Empty, ListCount, Menu, Search, SubNav, useSort } from '../../components/ui.jsx';
import { useSchool, dueOf, code } from '../../lib/store.jsx';
import { fmt } from '../../lib/format.js';
import { monthlyBill } from '../../lib/student.js';
import { workspaces } from '../../lib/nav.js';
import { HBars } from '../../components/Charts.jsx';
import { historyFor } from './StudentProfile.jsx';
import { downloadIdCardsZip, exportCsv, printView } from '../../lib/exporter.js';

const ATT = { P: ['Present', 'ok'], L: ['Late', 'warn'], A: ['Absent', 'danger'], V: ['Leave', 'info'] };

export function feeTone(due) {
  return due > 3000 ? 'danger' : due ? 'warn' : 'ok';
}

export function StudentsTabs() {
  const { db } = useSchool();
  const ws = workspaces.find((w) => w.key === 'students');
  return <SubNav tabs={ws.tabs} counts={{ '/students': db.students.filter((s) => s.status === 'active').length, '/students/families': db.families.length, '/students/admissions': db.inquiries.filter((q) => q.stage !== 'enrolled').length }} />;
}

export default function StudentsList() {
  const { db, active, classById, familyById, studentById, todayAtt, open, toast } = useSchool();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const view = params.get('view') || 'all';
  const cls = params.get('class') || 'all';
  const [q, setQ] = useState('');
  const [sel, setSel] = useState({});
  const [preview, setPreview] = useState(null);
  const [limit, setLimit] = useState(50); // big schools: show 50 at a time
  const [payFor, setPayFor] = useState(null);
  // Pay swaps the side panel to quick pay (drawer on narrow screens).
  const pay = (studentId) => {
    const st = db.students.find((x) => x.id === studentId);
    if (window.innerWidth < 1100) { open('collect', { studentId }); return; }
    setPreview(studentId); setPayFor({ familyId: st.familyId, studentId });
  };
  const [dialog, setDialog] = useState(null);

  const setParam = (k, v) => { const p = new URLSearchParams(params); if (v === 'all') p.delete(k); else p.set(k, v); setParams(p, { replace: true }); };

  const inactive = db.students.filter((s) => s.status !== 'active');
  const base = view === 'inactive' ? inactive : active;
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return base
      .filter((s) => (view === 'due' ? dueOf(s) > 0 : view === 'new' ? s.isNew : true))
      .filter((s) => cls === 'all' || s.classId === cls)
      .filter((s) => !t || s.name.toLowerCase().includes(t) || code(s).toLowerCase().includes(t) || familyById[s.familyId]?.name.toLowerCase().includes(t))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [base, view, cls, q, familyById]);

  const views = [
    { key: 'all', label: 'All', count: active.length },
    { key: 'due', label: 'Fees due', count: active.filter((s) => dueOf(s) > 0).length },
    { key: 'new', label: 'New admissions', count: active.filter((s) => s.isNew).length },
    { key: 'inactive', label: 'Terminated', count: inactive.length },
  ];
  const selIds = Object.keys(sel).filter((k) => sel[k]);
  const { sorted, th } = useSort(rows, { name: (s) => s.name.toLowerCase(), cls: (s) => `${String(classById[s.classId]?.order).padStart(3, '0')}${s.section}`, fam: (s) => (familyById[s.familyId]?.name || '').toLowerCase(), fees: (s) => -dueOf(s) }, 'name');
  const allSel = rows.length > 0 && rows.every((r) => sel[r.id]);
  const p = preview ? db.students.find((s) => s.id === preview) : null;
  const pf = p ? familyById[p.familyId] : null;

  return (
    <div className="page">
      <StudentsTabs />
      {dialog === 'upload' && <BulkUploadModal onClose={() => setDialog(null)} />}
      {(dialog === 'forms' || dialog === 'idcards') && <BatchPrintModal kind={dialog} onClose={() => setDialog(null)} />}
      <PageHead
        title="Students"
        sub={`${active.length} active · ${inactive.length} terminated · ${active.filter((s) => s.isNew).length} new admissions`}
        actions={<>
          <div className="toolrow">
            <Menu trigger={({ toggle }) => <Circle icon="print" label="Print" onClick={toggle} />}
              groups={[{ label: 'Print', items: [{ label: 'Admission forms', icon: 'doc', onClick: () => setDialog('forms') }, { label: 'ID cards (ZIP)', icon: 'idcard', onClick: () => setDialog('idcards') }, { label: 'Student list', icon: 'list', onClick: () => nav('/reports') }] }]} />
            <Circle icon="upload" label="Bulk upload" onClick={() => setDialog('upload')} />
            <Menu trigger={({ toggle }) => <Circle icon="download" label="Export" onClick={toggle} />}
              groups={[{ label: 'Export students', items: [{ label: 'CSV (Excel)', icon: 'sheet', onClick: () => { exportCsv(`${active.length} students`); toast(`Exported ${active.length} students as CSV`, { icon: 'download' }); } }, { label: 'PDF', icon: 'doc', onClick: () => { printView(); toast('Choose “Save as PDF” in the print dialog', { icon: 'print' }); } }] }]} />
            <Circle icon="sliders" label="Student settings" onClick={() => nav('/settings/students')} />
          </div>
          <button className="btn primary" onClick={() => nav('/students/new')}><Icon name="plus" size={16} stroke={2} />Add student</button>
        </>}
      />

      <div className="split">
        <section className="card pad-s wide" style={{ borderRadius: 28 }}>
          <div className="toolbar">
            <Chips items={views} value={view} onChange={(v) => setParam('view', v)} />
            <div className="grow" />
            <select className="select" value={cls} onChange={(e) => setParam('class', e.target.value)} aria-label="Filter by class">
              <option value="all">Class: All</option>
              {db.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <Search value={q} onChange={setQ} placeholder="Name, ID or family" />
          </div>

          {selIds.length > 0 && (
            <div className="bulkbar">
              <span className="strong" style={{ marginRight: 'auto' }}>{selIds.length} selected</span>
              <button className="b" onClick={() => open('compose', {})}><Icon name="whatsapp" size={14} />Send WhatsApp</button>
              <button className="b" onClick={() => downloadIdCardsZip({ school: db.school.short || db.school.name, title: 'Student ID cards', people: selIds.map((id) => studentById[id]).filter(Boolean).map((x) => ({ code: code(x), name: x.name, lines: [code(x), `${classById[x.classId]?.name} · ${x.section}`] })) }).then((n) => toast(`${n} PNG files zipped`, { icon: 'download' }))}><Icon name="idcard" size={14} />Print ID cards</button>
              <button className="b" onClick={() => toast('Choose the new class in the next step')}><Icon name="arrowUpRight" size={14} />Promote / change class</button>
              <button className="b" onClick={() => (exportCsv('Exported'), toast('Exported', { icon: 'download' }))}><Icon name="download" size={14} />Export</button>
              <button className="b" aria-label="Clear selection" style={{ width: 36, padding: 0, justifyContent: 'center' }} onClick={() => setSel({})}><Icon name="close" size={14} stroke={2} /></button>
            </div>
          )}

          {rows.length ? (
            <div className="table-wrap">
              <table className="table resp" style={{ minWidth: 760 }}>
                <thead>
                  <tr>
                    <th className="hide-sm" style={{ width: 28 }}><input type="checkbox" className="check" aria-label="Select all" checked={allSel} onChange={() => setSel(allSel ? {} : Object.fromEntries(rows.map((r) => [r.id, true])))} /></th>
                    {th('name', 'Student')}{th('cls', 'Class', 'hide-sm')}{th('fam', 'Family', 'hide-sm')}{th('fees', 'Fees')}<th className="hide-sm">Today</th><th className="hide-sm" style={{ width: 40 }}><span className="sr-only" /></th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.slice(0, limit).map((s) => {
                    const due = dueOf(s);
                    const fam = familyById[s.familyId];
                    const a = todayAtt[s.id];
                    return (
                      <tr key={s.id} className={preview === s.id || sel[s.id] ? 'hi click' : 'click'} onClick={() => (window.innerWidth < 760 ? nav(`/students/${s.id}`) : (setPreview(s.id), setPayFor(null)))}>
                        <td className="hide-sm" onClick={(e) => e.stopPropagation()}><input type="checkbox" className="check" aria-label={`Select ${s.name}`} checked={!!sel[s.id]} onChange={() => setSel({ ...sel, [s.id]: !sel[s.id] })} /></td>
                        <td>
                          <Link to={`/students/${s.id}`} className="person" onClick={(e) => e.stopPropagation()}>
                            <Avatar name={s.name} id={s.id} />
                            <span><span className="nm">{s.name}{s.isNew && <span className="pill info" style={{ height: 18, fontSize: 10, marginLeft: 8, padding: '0 7px' }}>New</span>}</span><span className="id">{code(s)}<span className="show-sm"> · {classById[s.classId]?.name} {s.section}</span></span></span>
                          </Link>
                        </td>
                        <td className="hide-sm">{classById[s.classId]?.name} <span className="muted">· {s.section}</span></td>
                        <td className="hide-sm"><div>{fam?.name}</div><div className="small muted mt-4">{fam?.id}</div></td>
                        <td><span className={`pill ${feeTone(due)}`}>{due ? `${fmt(due)} PKR due` : 'Clear'}</span></td>
                        <td className="small hide-sm">{a ? <span className={`pill ${ATT[a][1]}`}>{ATT[a][0]}</span> : <span className="muted">Not marked</span>}</td>
                        <td className="hide-sm"><button className="icon-btn sm" aria-label={`Quick view ${s.name}`} onClick={(e) => { e.stopPropagation(); setPreview(s.id); }}><Icon name="chevRight" size={14} stroke={2} /></button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {rows.length > limit && <div className="row" style={{ justifyContent: 'center', padding: 10 }}><button className="btn" onClick={() => setLimit(limit + 50)}>Show {Math.min(50, rows.length - limit)} more · {rows.length - limit} left</button></div>}
              <ListCount shown={Math.min(limit, rows.length)} total={base.length} what="students" />
            </div>
          ) : (
            <Empty icon="search" title="No students match" action={<button className="btn sm" onClick={() => { setQ(''); setParam('view', 'all'); setParam('class', 'all'); }}>Clear filters</button>}>
              {view === 'inactive' ? 'No inactive students. Terminated students will appear here.' : 'Try a different name, ID or class.'}
            </Empty>
          )}
        </section>

        {payFor ? <QuickPayPanel key={payFor.studentId} familyId={payFor.familyId} studentId={payFor.studentId} onClose={() => setPayFor(null)} /> : p ? (
          <aside className="card panel col gap-16 quick-panel" style={{ borderRadius: 28, padding: 22 }} aria-label="Student quick view">
            <div className="row between">
              <span className="small muted">Quick view</span>
              <button className="icon-btn" aria-label="Close quick view" onClick={() => setPreview(null)}><Icon name="close" size={14} stroke={2} /></button>
            </div>
            <div className="row gap-12">
              <Avatar name={p.name} id={p.id} size={64} />
              <div>
                <div className="display" style={{ fontSize: 28, fontWeight: 400, lineHeight: 1.1 }}>{p.name}</div>
                <div className="small muted mt-4">{code(p)} · {classById[p.classId]?.name} · {p.section}{p.roll ? ` · Roll ${p.roll}` : ''}</div>
              </div>
            </div>
            {(() => {
              const h = historyFor(p.id, p.admitted, 10); const n = Object.keys(h).length;
              const rate = n ? Math.round((Object.values(h).filter((v) => v === 'P' || v === 'L').length / n) * 100) : null;
              const ex = db.exams.filter((e) => e.results[p.id]).sort((a, b) => b.date.localeCompare(a.date))[0];
              const res = ex ? Math.round((ex.subjects.reduce((a, [sn]) => a + (ex.results[p.id][sn] || 0), 0) / ex.subjects.reduce((a, [, m]) => a + m, 0)) * 100) : null;
              return (
                <div className="grid g2" style={{ gap: 8 }}>
                  <div className="tile"><div className="k">Fees</div><div className="v" style={{ color: dueOf(p) ? 'var(--danger)' : 'var(--accent-text)' }}>{dueOf(p) ? `${fmt(dueOf(p))} due` : 'Clear'}</div></div>
                  <div className="tile"><div className="k">Today</div><div className="v">{todayAtt[p.id] ? ATT[todayAtt[p.id]][0] : 'Not marked'}</div></div>
                  <div className="tile"><div className="k">Attendance · Oct</div><div className="v">{rate == null ? '—' : `${rate}%`}</div></div>
                  <div className="tile"><div className="k">Last result</div><div className="v">{res == null ? '—' : `${res}%`}</div></div>
                </div>
              );
            })()}
            <dl className="dl">
              <div><dt>Family</dt><dd><Link className="link" to={`/students/families/${pf.id}`}>{pf.name} · {pf.id}</Link></dd></div>
              <div><dt>Guardian phone</dt><dd>{pf.phone}</dd></div>
              <div><dt>Monthly bill</dt><dd>{fmt(monthlyBill(p, classById[p.classId]))} PKR</dd></div>
              <div><dt>Siblings</dt><dd>{db.students.filter((k) => k.familyId === p.familyId && k.id !== p.id).map((k) => k.name).join(', ') || '—'}</dd></div>
              <div><dt>Status</dt><dd>{p.status === 'active' ? 'Active' : 'Terminated'}</dd></div>
            </dl>
            <div className="row gap-8">
              <button className="btn grow" onClick={() => open('compose', { familyId: pf.id })}><Icon name="whatsapp" size={15} />Message</button>
              <button className="btn grow" onClick={() => pay(p.id)}><Icon name="cash" size={15} />Pay</button>
            </div>
            <Link to={`/students/${p.id}`} className="row between" style={{ height: 50, padding: '0 6px 0 20px', borderRadius: 999, background: 'var(--quiet)', color: 'var(--on-quiet)', fontWeight: 500 }}>
              Open full profile
              <span style={{ width: 38, height: 38, borderRadius: 999, background: 'var(--surface)', color: 'var(--text)', display: 'grid', placeItems: 'center' }}><Icon name="arrowUpRight" size={15} stroke={2} /></span>
            </Link>
          </aside>
        ) : <StudentInsights onPay={pay} />}
      </div>
    </div>
  );
}

// Shown beside the list until a student is picked: the class at a glance.
function StudentInsights({ onPay }) {
  const { db, active, todayAtt, classById, open } = useSchool();
  const marked = active.filter((s) => todayAtt[s.id]);
  const absent = marked.filter((s) => todayAtt[s.id] === 'A' || todayAtt[s.id] === 'V').length;
  const girls = active.filter((s) => s.gender === 'Female').length;
  const owing = active.filter((s) => dueOf(s) > 0);
  const byClass = db.classes.map((c) => ({ label: c.name, value: active.filter((s) => s.classId === c.id).length })).filter((x) => x.value);
  const newOnes = active.filter((s) => s.admitted >= '2026-10-01');
  const missing = active.filter((s) => !s.dob || !s.bform).length;
  return (
    <aside className="card panel col gap-16 quick-panel" style={{ borderRadius: 28, padding: 22 }} aria-label="Students at a glance">
      <div className="row between"><span className="small muted">At a glance</span><span className="xs muted">Click a student for quick view</span></div>
      <div><div className="display" style={{ fontSize: 44, lineHeight: 1 }}>{active.length}</div><div className="small muted">active students · {db.classes.length} classes</div></div>
      <div className="col gap-6">
        <div className="row between xs muted"><span>Boys {active.length - girls}</span><span>Girls {girls}</span></div>
        <div className="split-bar"><span style={{ width: `${((active.length - girls) / Math.max(1, active.length)) * 100}%` }} /></div>
      </div>
      <div className="grid g2" style={{ gap: 8 }}>
        <div className="tile"><div className="k">Today</div><div className="v">{marked.length ? `${marked.length - absent}/${marked.length} in` : 'Not marked'}</div></div>
        <div className="tile"><div className="k">Owe fees</div><div className="v" style={{ color: owing.length ? 'var(--danger)' : undefined }}>{owing.length}</div></div>
        <div className="tile"><div className="k">New this month</div><div className="v">{newOnes.length}</div></div>
        <div className="tile"><div className="k">Profiles incomplete</div><div className="v">{missing}</div></div>
      </div>
      <div className="col gap-8"><span className="xs muted">Students per class</span><HBars rows={byClass} max={Math.max(...byClass.map((x) => x.value), 1)} unit="" /></div>
      {owing.length > 0 && (
        <div className="col gap-6"><span className="xs muted">Owing the most</span>
          {owing.sort((a, b) => dueOf(b) - dueOf(a)).slice(0, 3).map((s) => <button key={s.id} className="row between small" style={{ border: 0, background: 'none', padding: '4px 0', cursor: 'pointer', color: 'inherit', font: 'inherit' }} onClick={() => onPay(s.id)}><span>{s.name} <span className="xs muted">· {classById[s.classId]?.name}</span></span><span className="danger-text strong">{fmt(dueOf(s))}</span></button>)}
        </div>
      )}
    </aside>
  );
}
