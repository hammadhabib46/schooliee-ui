import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import QuickPayPanel from '../../components/QuickPayPanel.jsx';
import { PageHead } from '../../components/Shell.jsx';
import { Circle } from '../../components/Bento.jsx';
import { BulkUploadModal } from '../../components/ListDialogs.jsx';
import { Avatar, Chips, Empty, ListCount, Search, useSort } from '../../components/ui.jsx';
import { useSchool, dueOf } from '../../lib/store.jsx';
import { fmt, initials, avClass } from '../../lib/format.js';
import { StudentsTabs, feeTone } from './StudentsList.jsx';
import { exportCsv } from '../../lib/exporter.js';

export default function Families() {
  const { db, kidsOf, familyDue, open, toast } = useSchool();
  const nav = useNavigate();
  const [view, setView] = useState('all');
  const [q, setQ] = useState('');
  const [upload, setUpload] = useState(false);
  const [preview, setPreview] = useState(null);
  const [limit, setLimit] = useState(50);
  const [payFor, setPayFor] = useState(null);
  const pay = (familyId) => {
    if (window.innerWidth < 1100) { open('collect', { familyId }); return; }
    setPreview(familyId); setPayFor(familyId);
  };

  const all = useMemo(() => db.families.map((f) => ({ ...f, kids: kidsOf(f.id), due: familyDue(f.id) })), [db.families, kidsOf, familyDue]);
  const rows = all
    .filter((f) => (view === 'due' ? f.due > 0 : view === 'nowa' ? !f.waVerified : view === 'noapp' ? !f.app : view === 'empty' ? !f.kids.length : true))
    .filter((f) => { const t = q.trim().toLowerCase(); return !t || f.name.toLowerCase().includes(t) || f.id.toLowerCase().includes(t) || f.phone.includes(t) || f.cnic.includes(t) || f.kids.some((k) => k.name.toLowerCase().includes(t)); })
    .sort((a, b) => b.due - a.due || a.name.localeCompare(b.name));

  const { sorted, th } = useSort(rows, { name: (f) => f.name.toLowerCase(), kids: (f) => -f.kids.length, due: (f) => -f.due }, 'due');
  return (
    <div className="page">
      <StudentsTabs />
      <PageHead
        title="Families"
        sub={`${all.length} families · ${all.filter((f) => f.kids.length).length} with students · ${all.filter((f) => f.waVerified).length} on WhatsApp`}
        actions={<>
          <div className="toolrow">
            <Circle icon="upload" label="Bulk upload families" onClick={() => setUpload(true)} />
            <Circle icon="download" label="Export" onClick={() => (exportCsv('Exported families'), toast('Exported families', { icon: 'download' }))} />
          </div>
          <button className="btn primary" onClick={() => nav('/students/families/new')}><Icon name="plus" size={16} stroke={2} />Add family</button>
        </>}
      />
      {upload && <BulkUploadModal initial="families" onClose={() => setUpload(false)} />}
      <div className="split">
      <section className="card pad-s wide" style={{ borderRadius: 28 }}>
        <div className="toolbar">
          <Chips value={view} onChange={setView} items={[
            { key: 'all', label: 'All', count: all.length },
            { key: 'due', label: 'Dues pending', count: all.filter((f) => f.due > 0).length },
            { key: 'nowa', label: 'WhatsApp not verified', count: all.filter((f) => !f.waVerified).length },
            { key: 'noapp', label: 'App not installed', count: all.filter((f) => !f.app).length },
            { key: 'empty', label: 'No students', count: all.filter((f) => !f.kids.length).length },
          ]} />
          <div className="grow" />
          <Search value={q} onChange={setQ} placeholder="Guardian, phone, CNIC or child" />
        </div>
        {rows.length ? (
          <div className="table-wrap">
            <table className="table resp" style={{ minWidth: 820 }}>
              <thead><tr>{th('name', 'Family')}<th className="hide-sm">Phone</th><th className="hide-sm">WhatsApp</th>{th('kids', 'Children', 'hide-sm')}{th('due', 'Fees')}<th className="hide-sm" style={{ width: 120 }} /></tr></thead>
              <tbody>
                {sorted.slice(0, limit).map((f) => (
                  <tr key={f.id} className={preview === f.id ? 'hi click' : 'click'} onClick={() => (window.innerWidth < 760 ? nav(`/students/families/${f.id}`) : (setPreview(f.id), setPayFor(null)))}>
                    <td><span className="person"><Avatar name={f.name} id={f.id} /><span><span className="nm">{f.name}</span><span className="id">{f.id} · CNIC {f.cnic}</span></span></span></td>
                    <td className="hide-sm">{f.phone}</td>
                    <td className="hide-sm">{f.whatsapp ? <span className="row gap-6">{f.whatsapp}{f.waVerified && <Icon name="check" size={14} stroke={2.4} className="ok-text" />}</span> : <span className="muted">—</span>}</td>
                    <td className="hide-sm">
                      {f.kids.length ? (
                        <span className="row gap-8">
                          <span className="row" style={{ gap: 0 }}>{f.kids.map((k, i) => <span key={k.id} className={`av s30 ${avClass(k.id)}`} style={{ marginLeft: i ? -8 : 0, border: '2px solid var(--surface)' }} title={k.name}>{initials(k.name)}</span>)}</span>
                          <span className="small muted">{f.kids.map((k) => k.name).join(', ')}</span>
                        </span>
                      ) : <span className="muted small">No students</span>}
                    </td>
                    <td><span className={`pill ${feeTone(f.due)}`}>{f.due ? `${fmt(f.due)} PKR due` : 'Clear'}</span></td>
                    <td className="right hide-sm" onClick={(e) => e.stopPropagation()}>
                      {f.due > 0 ? <button className="btn xs" onClick={() => pay(f.id)}>Pay</button> : <button className="btn xs" onClick={() => nav(`/students/new?family=${f.id}`)}>+ Child</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > limit && <div className="row" style={{ justifyContent: 'center', padding: 10 }}><button className="btn" onClick={() => setLimit(limit + 50)}>Show {Math.min(50, rows.length - limit)} more · {rows.length - limit} left</button></div>}
            <ListCount shown={Math.min(limit, rows.length)} total={all.length} what="families" />
          </div>
        ) : <Empty icon="family" title="No families match" />}
      </section>
      {payFor ? <QuickPayPanel key={payFor} familyId={payFor} onClose={() => setPayFor(null)} /> : preview ? <FamilyQuick f={all.find((x) => x.id === preview)} onClose={() => setPreview(null)} onPay={pay} /> : <FamilyInsights all={all} onPay={pay} />}
      </div>
    </div>
  );
}

function FamilyQuick({ f, onClose, onPay }) {
  const { open, classById } = useSchool();
  if (!f) return null;
  return (
    <aside className="card panel col gap-16 quick-panel" style={{ borderRadius: 28, padding: 22 }} aria-label="Family quick view">
      <div className="row between"><span className="small muted">Quick view</span><button className="icon-btn" aria-label="Close quick view" onClick={onClose}><Icon name="close" size={14} stroke={2} /></button></div>
      <div className="row gap-12"><Avatar name={f.name} id={f.id} size={64} /><div><div className="display" style={{ fontSize: 28, fontWeight: 400, lineHeight: 1.1 }}>{f.name}</div><div className="small muted mt-4">{f.id} · {f.phone}</div></div></div>
      <div className="grid g2" style={{ gap: 8 }}>
        <div className="tile"><div className="k">Owes</div><div className="v" style={{ color: f.due ? 'var(--danger)' : 'var(--accent-text)' }}>{f.due ? fmt(f.due) : 'Clear'}</div></div>
        <div className="tile"><div className="k">Credit</div><div className="v">{fmt(f.credit || 0)}</div></div>
        <div className="tile"><div className="k">Paid to date</div><div className="v">{fmt(f.paidTotal)}</div></div>
        <div className="tile"><div className="k">Channels</div><div className="v small">{f.waVerified ? 'WhatsApp ✓' : 'No WhatsApp'}{f.app ? ' · App' : ''}</div></div>
      </div>
      <div className="col gap-6"><span className="xs muted">Children</span>
        {f.kids.map((k) => <Link key={k.id} to={`/students/${k.id}`} className="row gap-8 small"><Avatar name={k.name} id={k.id} size={28} /><span className="grow">{k.name} <span className="xs muted">· {classById[k.classId]?.name} {k.section}</span></span>{dueOf(k) ? <span className="danger-text strong">{fmt(dueOf(k))}</span> : <span className="ok-text xs">Clear</span>}</Link>)}
        {!f.kids.length && <span className="small muted">No students yet.</span>}
      </div>
      <div className="row gap-8">
        <button className="btn grow" onClick={() => open('compose', { familyId: f.id })}><Icon name="whatsapp" size={15} />Message</button>
        {f.due > 0 ? <button className="btn grow" onClick={() => onPay(f.id)}><Icon name="cash" size={15} />Pay</button> : <Link className="btn grow" to={`/students/new?family=${f.id}`}><Icon name="plus" size={15} />Add child</Link>}
      </div>
      <Link to={`/students/families/${f.id}`} className="row between" style={{ height: 50, padding: '0 6px 0 20px', borderRadius: 999, background: 'var(--quiet)', color: 'var(--on-quiet)', fontWeight: 500 }}>
        Open family
        <span style={{ width: 38, height: 38, borderRadius: 999, background: 'var(--surface)', color: 'var(--text)', display: 'grid', placeItems: 'center' }}><Icon name="arrowUpRight" size={15} stroke={2} /></span>
      </Link>
    </aside>
  );
}

function FamilyInsights({ all, onPay }) {
  const { open } = useSchool();
  const withKids = all.filter((f) => f.kids.length);
  const owing = withKids.filter((f) => f.due > 0).sort((a, b) => b.due - a.due);
  const verified = withKids.filter((f) => f.waVerified).length;
  const app = withKids.filter((f) => f.app).length;
  const siblings = withKids.filter((f) => f.kids.length > 1).length;
  const ring = (v, n) => `${Math.round((v / Math.max(1, n)) * 100)}%`;
  return (
    <aside className="card panel col gap-16 quick-panel" style={{ borderRadius: 28, padding: 22 }} aria-label="Families at a glance">
      <div className="row between"><span className="small muted">At a glance</span><span className="xs muted">Click a family for quick view</span></div>
      <div><div className="display" style={{ fontSize: 44, lineHeight: 1 }}>{withKids.length}</div><div className="small muted">families with children · {siblings} with siblings</div></div>
      <div className="col gap-10">
        {[['WhatsApp verified', verified, 'Gets receipts & alerts'], ['Parent app installed', app, 'Sees diary & results']].map(([k, v, h]) => (
          <div key={k} className="col gap-4"><div className="row between small"><span>{k}</span><span className="strong">{v}/{withKids.length} · {ring(v, withKids.length)}</span></div><div className="hbar-track"><span style={{ width: ring(v, withKids.length), background: 'var(--accent)' }} /></div><span className="xs muted">{h}</span></div>
        ))}
      </div>
      <div className="grid g2" style={{ gap: 8 }}>
        <div className="tile"><div className="k">Owe fees</div><div className="v" style={{ color: owing.length ? 'var(--danger)' : undefined }}>{owing.length}</div></div>
        <div className="tile"><div className="k">Total owed</div><div className="v">{fmt(owing.reduce((a, f) => a + f.due, 0))}</div></div>
        <div className="tile"><div className="k">Credit held</div><div className="v">{fmt(all.reduce((a, f) => a + (f.credit || 0), 0))}</div></div>
        <div className="tile"><div className="k">No students</div><div className="v">{all.length - withKids.length}</div></div>
      </div>
      {owing.length > 0 && (
        <div className="col gap-6"><span className="xs muted">Owing the most</span>
          {owing.slice(0, 3).map((f) => <button key={f.id} className="row between small" style={{ border: 0, background: 'none', padding: '4px 0', cursor: 'pointer', color: 'inherit', font: 'inherit' }} onClick={() => onPay(f.id)}><span>{f.name} <span className="xs muted">· {f.id}</span></span><span className="danger-text strong">{fmt(f.due)}</span></button>)}
        </div>
      )}
    </aside>
  );
}
