import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import { PageHead } from '../../components/Shell.jsx';
import { Circle, PillGroup } from '../../components/Bento.jsx';
import { Empty, Field, Modal, Search } from '../../components/ui.jsx';
import { useSchool, code } from '../../lib/store.jsx';
import { dateShort } from '../../lib/format.js';
import { WebsiteTabs } from './Site.jsx';
import { printView } from '../../lib/exporter.js';

const TEMPLATES = [
  ['Letter pad', 'Official letter on school letterhead', 'doc'],
  ['Character certificate', 'For students leaving the school', 'award'],
  ['Experience letter', 'For staff', 'briefcase'],
  ['Certificate', 'Achievements, prizes, sports', 'trophy'],
  ['Fee reminder letter', 'Printed reminder for a family', 'receipt'],
];

export default function Documents() {
  const { db, addDocument, toast, active, sections, classById } = useSchool();
  const [view, setView] = useState('All files');
  const [open, setOpen] = useState(null);
  const [params, setParams] = useSearchParams();
  const [type, setType] = useState('all');
  const [q, setQ] = useState('');
  const [creating, setCreating] = useState(null);
  useEffect(() => { if (params.get('new')) { setCreating('Letter pad'); setParams({}, { replace: true }); } }, [params, setParams]);
  const types = [...new Set(db.documents.map((d) => d.type))];
  const rows = db.documents.filter((d) => type === 'all' || d.type === type).filter((d) => { const t = q.toLowerCase(); return !t || `${d.title} ${d.owner}`.toLowerCase().includes(t); });

  return (
    <div className="page">
      <WebsiteTabs />
      <PageHead title="Documents" sub={`${db.documents.length} files · letters, certificates and uploads in one place`}
        actions={<button className="btn primary" onClick={() => setCreating('Letter pad')}><Icon name="plus" size={16} stroke={2} />New document</button>} />
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
        {TEMPLATES.map(([t, d, i]) => (
          <button key={t} className="card col gap-8" style={{ padding: 16, textAlign: 'left', font: 'inherit' }} onClick={() => setCreating(t)}>
            <span className="icon-btn" style={{ background: 'var(--accent-soft)', color: 'var(--accent-text)', borderColor: 'transparent' }}><Icon name={i} size={16} /></span>
            <span className="medium">{t}</span><span className="xs muted">{d}</span>
          </button>
        ))}
      </div>
      <section className="widget" style={{ padding: 12 }}>
        <div className="panel-bar" style={{ padding: 2 }}>
          <PillGroup value={view} onChange={setView} items={['All files', 'By class', 'By person']} />
          <select aria-label="Document type" className="select" value={type} onChange={(e) => setType(e.target.value)}><option value="all">All types · {db.documents.length}</option>{types.map((t) => <option key={t} value={t}>{t} · {db.documents.filter((d) => d.type === t).length}</option>)}</select>
          <div className="grow" />
          <div style={{ width: 240 }}><Search value={q} onChange={setQ} placeholder="Title or person" /></div>
        </div>
        <div style={{ padding: '12px 4px 4px' }}>
          {rows.length ? groupDocs(rows, view, db, classById).map(([g, items]) => (
            <div key={g} className="col gap-8" style={{ marginBottom: 14 }}>
              {view !== 'All files' && <div className="row gap-8"><span className="upper">{g}</span><span className="xs muted">{items.length}</span></div>}
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 8 }}>
                {items.map((d) => (
                  <article key={d.id} className="stack-card" style={{ marginTop: 0, cursor: 'pointer' }} onClick={() => setOpen(d)}>
                    <span className="circle sm"><Icon name={d.type === 'Student upload' ? 'paperclip' : 'doc'} size={15} /></span>
                    <span className="grow" style={{ minWidth: 0 }}><span className="medium ellipsis" style={{ display: 'block' }}>{d.title}</span><span className="xs muted ellipsis" style={{ display: 'block' }}>{d.owner} · {d.type} · {dateShort(d.date)}</span></span>
                    <Circle icon="download" size="xs" iconSize={13} label={`Download ${d.title}`} onClick={(e) => { e.stopPropagation(); (printView(), toast(`${d.title} downloaded`, { icon: 'download' })); }} />
                  </article>
                ))}
              </div>
            </div>
          )) : <Empty icon="folder" title="No documents" />}
        </div>
      </section>
      {open && (
        <Modal open wide onClose={() => setOpen(null)} title={open.title} sub={`${open.type} · ${open.owner} · ${dateShort(open.date)}`}
          footer={<><button className="btn ghost" onClick={() => setOpen(null)}>Close</button><button className="btn" onClick={() => (printView(), toast('Downloaded', { icon: 'download' }))}><Icon name="download" size={15} />Download</button><button className="btn primary" onClick={() => (printView(), toast('Sent to printer', { icon: 'print' }))}><Icon name="print" size={15} />Print</button></>}>
          <Letterhead school={db.school}><div style={{ fontWeight: 600, marginBottom: 10 }}>{open.title}</div>{open.html ? <div dangerouslySetInnerHTML={{ __html: open.html }} /> : <p style={{ opacity: 0.6 }}>{open.type === 'Student upload' ? 'Uploaded file preview' : 'Generated document preview'}</p>}</Letterhead>
        </Modal>
      )}
      {creating && (
        <CreateDoc type={creating} onClose={() => setCreating(null)} people={[...active.map((s) => `${s.name} (${code(s)})`), ...db.staff.map((s) => `${s.name} (${s.id})`)]} onSave={(doc) => { addDocument(doc); toast(`${doc.title} created`, { icon: 'doc' }); setCreating(null); }} sections={sections} />
      )}
    </div>
  );
}

export function groupDocs(rows, view, db, classById) {
  if (view === 'All files') return [['All', rows]];
  const keyOf = (d) => {
    const id = (d.owner.match(/\(([^)]+)\)/) || [])[1];
    const st = db.students.find((x) => x.id === id || code(x) === id);
    const staff = db.staff.find((x) => x.id === id);
    if (view === 'By class') return st ? `${classById[st.classId]?.name} ${st.section}` : staff ? 'Staff' : 'School';
    return st ? 'Students' : staff ? 'Staff' : 'School';
  };
  const m = {};
  rows.forEach((d) => { const k = keyOf(d); (m[k] = m[k] || []).push(d); });
  return Object.entries(m).sort((a, b) => b[1].length - a[1].length);
}

function Letterhead({ school, children }) {
  return (
    <div style={{ borderRadius: 16, background: '#fff', color: '#141414', padding: '22px 26px', boxShadow: 'inset 0 0 0 1px var(--border)', fontSize: 14, lineHeight: 1.6 }}>
      <div className="row between" style={{ borderBottom: '2px solid #141414', paddingBottom: 10, marginBottom: 16 }}>
        <span><strong style={{ fontSize: 16 }}>{school.name}</strong><span style={{ display: 'block', fontSize: 11, opacity: 0.6 }}>{school.address} · {school.phone}</span></span>
        <span style={{ fontSize: 11, opacity: 0.6 }}>9 Oct 2026</span>
      </div>
      {children}
      <div style={{ marginTop: 28, fontSize: 12, opacity: 0.7 }}>Principal’s signature ____________</div>
    </div>
  );
}

function CreateDoc({ type, onClose, onSave, people }) {
  const { db } = useSchool();
  const ed = useRef(null);
  const [t, setT] = useState(type);
  const [owner, setOwner] = useState(type === 'Letter pad' ? 'School' : people[0]);
  const [title, setTitle] = useState(type);
  const init = type === 'Character certificate' ? 'This is to certify that the above-named student has been a student of this school and bears a good moral character.' : '';
  useEffect(() => { if (ed.current) ed.current.innerHTML = init; }, []); // eslint-disable-line
  const cmd = (c) => { document.execCommand(c); ed.current?.focus(); };
  const save = () => onSave({ title, type: t, owner, html: ed.current?.innerHTML || '' });
  return (
    <Modal open onClose={onClose} title={`New ${t.toLowerCase()}`} wide footer={<><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn" onClick={save}><Icon name="download" size={15} />Save</button><button className="btn primary" onClick={save}><Icon name="print" size={15} />Save & print</button></>}>
      <div className="row wrap gap-6">{TEMPLATES.map(([x]) => <button key={x} className={`chip sm ${t === x ? 'on' : ''}`} onClick={() => { setT(x); setTitle(x); }}>{x}</button>)}</div>
      <div className="form-grid">
        <Field label="Title"><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
        <Field label="For"><select className="select" value={owner} onChange={(e) => setOwner(e.target.value)}><option>School</option>{people.map((p) => <option key={p}>{p}</option>)}</select></Field>
      </div>
      <div className="col gap-6">
        <div className="row gap-4">
          {[['bold', 'B', { fontWeight: 700 }], ['italic', 'I', { fontStyle: 'italic' }], ['underline', 'U', { textDecoration: 'underline' }]].map(([c, l, st]) => <button key={c} type="button" className="circle xs ghost" style={st} aria-label={c} onMouseDown={(e) => { e.preventDefault(); cmd(c); }}>{l}</button>)}
          <button type="button" className="circle xs ghost" aria-label="Bulleted list" onMouseDown={(e) => { e.preventDefault(); cmd('insertUnorderedList'); }}><Icon name="list" size={14} /></button>
          <span className="xs muted" style={{ marginLeft: 8 }}>Letterhead, date and signature are added automatically</span>
        </div>
        <Letterhead school={db.school}>
          <div style={{ fontWeight: 600, marginBottom: 10 }}>{title}</div>
          <div ref={ed} contentEditable suppressContentEditableWarning data-placeholder="Write the letter…" style={{ minHeight: 160, outline: 'none' }} />
        </Letterhead>
      </div>
    </Modal>
  );
}
