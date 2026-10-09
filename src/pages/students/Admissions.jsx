import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import { PageHead } from '../../components/Shell.jsx';
import { Avatar, Drawer, Field, Modal, Search, Seg } from '../../components/ui.jsx';
import { Circle } from '../../components/Bento.jsx';
import { useSchool } from '../../lib/store.jsx';
import { cx, dateShort, relative } from '../../lib/format.js';
import { StudentsTabs } from './StudentsList.jsx';
import { exportCsv } from '../../lib/exporter.js';

const STAGES = [
  { key: 'new', label: 'New', hint: 'Just applied' },
  { key: 'contacted', label: 'Contacted', hint: 'Called or messaged' },
  { key: 'visit', label: 'Visit / test', hint: 'Campus visit or entry test' },
  { key: 'approved', label: 'Approved', hint: 'Ready to enroll' },
  { key: 'enrolled', label: 'Enrolled', hint: 'Now a student' },
];

export default function Admissions() {
  const { db, moveInquiry, addInquiry, toast } = useSchool();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const [mode, setMode] = useState(() => (typeof window !== 'undefined' && window.innerWidth < 760 ? 'list' : 'board'));
  const [q, setQ] = useState('');
  const [type, setType] = useState('all');
  const [adding, setAdding] = useState(false);
  const [drag, setDrag] = useState(null);
  const [openId, setOpenId] = useState(null);

  useEffect(() => { if (params.get('new')) { setAdding(true); setParams({}, { replace: true }); } }, [params, setParams]);

  const list = db.inquiries.filter((x) => type === 'all' || (x.type || 'Student Admission') === type).filter((x) => { const t = q.trim().toLowerCase(); return !t || x.name.toLowerCase().includes(t) || x.guardian.toLowerCase().includes(t) || x.phone.includes(t); });
  const next = (stage) => STAGES[Math.min(STAGES.length - 2, STAGES.findIndex((s) => s.key === stage) + 1)].key;
  const enroll = (x) => nav(`/students/new?name=${encodeURIComponent(x.name)}&class=${encodeURIComponent(x.classWanted)}&gender=${x.gender}&guardian=${encodeURIComponent(x.guardian === '—' ? '' : x.guardian)}&phone=${encodeURIComponent(x.phone)}&inquiry=${x.id}`);
  const advance = (x) => {
    const n = next(x.stage);
    moveInquiry(x.id, n);
    toast(`${x.name} moved to ${STAGES.find((s) => s.key === n).label}`, { undo: () => moveInquiry(x.id, x.stage) });
  };

  const Card = ({ x }) => (
    <article draggable onDragStart={() => setDrag(x.id)} onDragEnd={() => setDrag(null)} onClick={(e) => { if (!e.target.closest('button,a')) setOpenId(x.id); }} className="card" style={{ padding: 14, borderRadius: 20, display: 'flex', flexDirection: 'column', gap: 10, cursor: 'pointer', opacity: drag === x.id ? 0.4 : 1 }}>
      <div className="row gap-10">
        <Avatar name={x.name} id={x.id} size={34} />
        <span className="grow" style={{ minWidth: 0 }}><span className="medium clamp-2" style={{ display: 'block' }}>{x.name}</span><span className="xs muted">{x.id} · {x.gender} · for {x.classWanted}</span></span>
      </div>
      <div className="row between xs muted"><span className="ellipsis">{x.guardian !== '—' ? x.guardian : 'No guardian'} · {x.phone || 'no phone'}</span><span className="nowrap">{relative(x.date)}</span></div>
      <div className="row gap-6">
        <span className="tag" style={{ fontSize: 11, height: 22 }}>{x.source}</span>
        <span className="grow" />
        {x.phone && <a className="icon-btn xs" href={`tel:${x.phone}`} aria-label="Call"><Icon name="phone" size={12} /></a>}
        {x.phone && <a className="icon-btn xs" href={`https://wa.me/${x.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" aria-label="WhatsApp"><Icon name="engage" size={12} /></a>}
        {x.stage === 'approved' ? <button className="btn xs" onClick={() => enroll(x)}>Enroll</button> : x.stage !== 'enrolled' && <button className="btn xs" onClick={() => advance(x)}>Next<Icon name="arrowRight" size={12} /></button>}
      </div>
    </article>
  );

  return (
    <div className="page">
      <StudentsTabs />
      <PageHead
        title="Admissions"
        sub={`${db.inquiries.filter((x) => x.stage === 'new').length} new · ${db.inquiries.filter((x) => !['enrolled'].includes(x.stage)).length} in progress · public form at ${db.school.site}/apply`}
        actions={<>
          <div className="toolrow">
            <Circle icon="link" label="Copy public form link" onClick={() => { navigator.clipboard?.writeText(`https://${db.school.site}/apply`).catch(() => {}); toast('Admission form link copied', { icon: 'link' }); }} />
            <Circle icon="download" label="Export" onClick={() => { exportCsv('Inquiries'); toast('Inquiries exported', { icon: 'download' }); }} />
          </div>
          <button className="btn primary" onClick={() => setAdding(true)}><Icon name="plus" size={16} stroke={2} />Add inquiry</button>
        </>}
      />
      <div className="row wrap gap-8">
        <Seg ink lg value={mode} onChange={setMode} items={[{ key: 'board', label: 'Pipeline' }, { key: 'list', label: 'List' }]} />
        <div className="grow" />
        <select className="select" value={type} onChange={(e) => setType(e.target.value)} aria-label="Inquiry type"><option value="all">All types</option>{['Student Admission', 'Teacher Hiring', 'Staff Hiring'].map((t) => <option key={t}>{t}</option>)}</select>
        <Search value={q} onChange={setQ} placeholder="Applicant, guardian or phone" />
      </div>

      {mode === 'board' ? (
        <div className="adm-board">
          {STAGES.map((st) => {
            const items = list.filter((x) => x.stage === st.key);
            return (
              <section key={st.key} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (drag) { moveInquiry(drag, st.key); setDrag(null); } }}
                className="adm-col" style={{ background: drag ? 'var(--surface-2)' : 'transparent', borderRadius: 26, padding: 8, border: '1.5px dashed ' + (drag ? 'var(--hatch)' : 'transparent'), display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="row between" style={{ padding: '4px 6px 6px' }}>
                  <span className="row gap-8"><span className="medium">{st.label}</span><span className="count">{items.length}</span></span>
                  <span className="xs faint">{st.hint}</span>
                </div>
                {items.map((x) => <Card key={x.id} x={x} />)}
                {!items.length && <div className="small faint" style={{ padding: 18, textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 18 }}>Drop here</div>}
              </section>
            );
          })}
        </div>
      ) : (
        <section className="card pad-s">
          <div className="table-wrap adm-table"><table className="table" style={{ minWidth: 760 }}>
            <thead><tr><th>Applicant</th><th>Class</th><th>Guardian</th><th>Source</th><th>Stage</th><th>Applied</th><th /></tr></thead>
            <tbody>{list.map((x) => (
              <tr key={x.id}>
                <td><span className="person"><Avatar name={x.name} id={x.id} size={34} /><span><span className="nm">{x.name}</span><span className="id">{x.id} · {x.gender}</span></span></span></td>
                <td>{x.classWanted}</td><td>{x.guardian}<div className="xs muted">{x.phone}</div></td><td>{x.source}</td>
                <td><select aria-label="Stage" className="select" style={{ height: 32 }} value={x.stage} onChange={(e) => moveInquiry(x.id, e.target.value)}>{STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}</select></td>
                <td className="small muted">{relative(x.date)}</td>
                <td className="right">{x.stage === 'approved' && <button className="btn xs" onClick={() => enroll(x)}>Enroll</button>}</td>
              </tr>
            ))}</tbody>
          </table></div>
          <div className="adm-cards">{list.map((x) => <Card key={x.id} x={x} />)}{!list.length && <div className="small muted" style={{ padding: 16 }}>No inquiries match.</div>}</div>
        </section>
      )}

      {openId && <InquiryDrawer id={openId} onClose={() => setOpenId(null)} onEnroll={enroll} />}
      {adding && <AddInquiry onClose={() => setAdding(false)} onSave={(v) => { addInquiry(v); toast(`Inquiry for ${v.name} added`); setAdding(false); }} classes={db.classes} />}
    </div>
  );
}

function AddInquiry({ onClose, onSave, classes }) {
  const [v, setV] = useState({ type: 'Student Admission', name: '', gender: 'Male', dob: '', bform: '', classWanted: classes[3].name, section: classes[3].sections[0], guardian: '', phone: '', email: '', source: 'Not specified', prevSchool: '', note: '' });
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  const cls = classes.find((c) => c.name === v.classWanted);
  return (
    <Modal open onClose={onClose} wide title="New inquiry" footer={<><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" disabled={!v.name || !v.phone} onClick={() => onSave(v)}>Add to pipeline</button></>}>
      <div className="row wrap gap-6">{['Student Admission', 'Teacher Hiring', 'Staff Hiring'].map((t) => <button key={t} className={cx('chip sm', v.type === t && 'on')} onClick={() => setV({ ...v, type: t })}>{t}</button>)}</div>
      <div className="form-grid">
        <Field label="Applicant name"><input className="input" autoFocus value={v.name} onChange={set('name')} /></Field>
        <Field label="Gender"><Seg ink lg value={v.gender} onChange={(g) => setV({ ...v, gender: g })} items={['Male', 'Female']} /></Field>
        <Field label="Class"><select className="select" value={v.classWanted} onChange={(e) => { const c = classes.find((x) => x.name === e.target.value); setV({ ...v, classWanted: c.name, section: c.sections[0] }); }}>{classes.map((c) => <option key={c.id}>{c.name}</option>)}</select></Field>
        <Field label="Section"><select className="select" value={v.section} onChange={set('section')}>{cls?.sections.map((x) => <option key={x}>{x}</option>)}</select></Field>
        <Field label="Guardian name"><input className="input" value={v.guardian} onChange={set('guardian')} /></Field>
        <Field label="Phone"><input className="input" value={v.phone} onChange={set('phone')} /></Field>
        <Field label="How did they contact you?"><select className="select" value={v.source} onChange={set('source')}>{['Not specified', 'Physical visit', 'Phone call', 'WhatsApp'].map((x) => <option key={x}>{x}</option>)}</select></Field>
        <Field label="Email" optional><input className="input" value={v.email} onChange={set('email')} /></Field>
        <Field label="Date of birth" optional><input className="input" type="date" value={v.dob} onChange={set('dob')} /></Field>
        <Field label="B-Form / CNIC" optional><input className="input" value={v.bform} onChange={set('bform')} /></Field>
        <Field label="Previous school" optional><input className="input" value={v.prevSchool} onChange={set('prevSchool')} /></Field>
        <Field label="Note" optional><input className="input" value={v.note} onChange={set('note')} /></Field>
      </div>
      <div className="banner info small"><Icon name="bolt" size={16} />When approved, one click turns this into a student with these details filled in.</div>
    </Modal>
  );
}

function InquiryDrawer({ id, onClose, onEnroll }) {
  const [admit, setAdmit] = useState(false);
  const { db, moveInquiry, updateInquiry, addComment, toast } = useSchool();
  const q = db.inquiries.find((x) => x.id === id);
  const [text, setText] = useState('');
  const [edit, setEdit] = useState(false);
  if (!q) return null;
  const stage = STAGES.find((s) => s.key === q.stage);
  const rows = [['Gender', q.gender], ['Date of birth', q.dob ? dateShort(q.dob) : ''], ['B-Form / CNIC', q.bform], ['Phone', q.phone], ['WhatsApp', q.whatsapp], ['Email', q.email], ['Guardian', q.guardian], ['Mother', q.mother], ['Address', q.address], ['Previous school', q.prevSchool], ['Applying for', `${q.classWanted}${q.section ? ' · ' + q.section : ''}`], ['Contacted via', q.contact || q.source], ['Applied', relative(q.date)]];
  return (
    <Drawer open onClose={onClose} wide title={q.name} sub={`${q.type || 'Student Admission'} · #${q.id}`}
      footer={q.stage === 'declined' ? <button className="btn block" onClick={() => { moveInquiry(q.id, 'new'); toast('Inquiry reopened'); }}>Reopen</button> : <>
        <button className="btn" style={{ color: 'var(--danger)' }} onClick={() => { moveInquiry(q.id, 'declined'); toast(`${q.name} declined`, { undo: () => moveInquiry(q.id, q.stage) }); onClose(); }}>Decline</button>
        <div className="grow" />
        {q.stage === 'enrolled' ? <span className="pill ok lg">Admitted</span>
          : (q.type || 'Student Admission') === 'Student Admission' ? <button className="btn primary" onClick={() => setAdmit(true)}><Icon name="check" size={15} stroke={2.4} />Approve & admit</button>
            : <button className="btn primary" onClick={() => { moveInquiry(q.id, 'approved'); toast(`${q.name} approved`); }}><Icon name="check" size={15} stroke={2.4} />Approve</button>}
      </>}>
      <div className="row wrap gap-8">
        <span className={`pill lg ${q.stage === 'declined' ? 'danger' : q.stage === 'approved' ? 'ok' : 'outline'}`}>{q.stage === 'declined' ? 'Declined' : stage?.label}</span>
        <div className="grow" />
        <div className="toolrow">
          {q.phone && <a className="circle sm" href={`tel:${q.phone}`} aria-label="Call"><Icon name="phone" size={15} /><span className="tip">Call</span></a>}
          {q.phone && <a className="circle sm" href={`https://wa.me/${q.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" aria-label="WhatsApp"><Icon name="whatsapp" size={15} /><span className="tip">WhatsApp</span></a>}
          <select className="select" value={q.stage} onChange={(e) => moveInquiry(q.id, e.target.value)} aria-label="Stage">{[...STAGES, { key: 'declined', label: 'Declined' }].map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}</select>
        </div>
      </div>
      <dl className="dl">
        {rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v || <button className="add" onClick={() => setEdit(true)}>+ Add</button>}</dd></div>)}
      </dl>
      <section className="widget">
        <div className="widget-head"><span className="circle sm"><Icon name="engage" size={15} /></span><span className="w-title">Discussion</span><span className="count">{(q.comments || []).length}</span></div>
        <div className="widget-body">
          {(q.comments || []).map((c, i) => <div key={i} className="stack-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4, marginTop: 0 }}><span className="small">{c.text}</span><span className="xs muted">{c.by} · {relative(c.at)}</span></div>)}
          {!(q.comments || []).length && <div className="small muted">No comments yet — visible to everyone who handles inquiries.</div>}
          <div className="row gap-6">
            <input className="input" style={{ borderRadius: 999, height: 42 }} placeholder="Write a comment…" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && text.trim()) { addComment(q.id, text.trim()); setText(''); } }} />
            <Circle icon="send" size="sm" label="Post" onClick={() => { if (text.trim()) { addComment(q.id, text.trim()); setText(''); } }} />
          </div>
        </div>
      </section>
      {edit && <EditInquiry q={q} onClose={() => setEdit(false)} onSave={(v) => { updateInquiry(q.id, v); toast('Inquiry updated'); setEdit(false); }} />}
      {admit && <AdmitModal q={q} onClose={() => setAdmit(false)} onDone={onClose} />}
    </Drawer>
  );
}

function EditInquiry({ q, onClose, onSave }) {
  const [v, setV] = useState(q);
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  return (
    <Modal open onClose={onClose} wide title="Edit inquiry" sub={`#${q.id}`} footer={<><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" onClick={() => onSave(v)}>Save</button></>}>
      <div className="form-grid">
        {[['name', 'Applicant name'], ['guardian', 'Guardian'], ['mother', 'Mother'], ['phone', 'Phone'], ['whatsapp', 'WhatsApp'], ['email', 'Email'], ['dob', 'Date of birth'], ['bform', 'B-Form / CNIC'], ['address', 'Address'], ['prevSchool', 'Previous school']].map(([k, l]) => (
          <Field key={k} label={l}><input className="input" type={k === 'dob' ? 'date' : 'text'} value={v[k] || ''} onChange={set(k)} /></Field>
        ))}
      </div>
    </Modal>
  );
}

// Live "Approve & Admit": the applicant becomes a student straight away, with the
// school's one-time fees. The family is matched by phone, or created from the guardian.
function AdmitModal({ q, onClose, onDone }) {
  const { db, addStudent, moveInquiry, toast } = useSchool();
  const nav = useNavigate();
  const cls = db.classes.find((c) => c.name === q.classWanted) || db.classes[0];
  const [section, setSection] = useState(q.section && cls.sections.includes(q.section) ? q.section : cls.sections[0]);
  const [fees, setFees] = useState({ admission: '', fund: '', security: '' });
  const fam = q.phone && db.families.find((f) => f.phone.replace(/\D/g, '').slice(-10) === q.phone.replace(/\D/g, '').slice(-10));
  const set = (k) => (e) => setFees({ ...fees, [k]: e.target.value.replace(/\D/g, '') });
  const admit = () => {
    const dues = [['Admission fee', fees.admission, 'onetime'], ['Student fund', fees.fund, 'other'], ['Security fee', fees.security, 'onetime']].filter(([, a]) => Number(a)).map(([label, a, cat], i) => ({ id: `ad${i}`, label, month: 'Oct 2026', amount: Number(a), cat }));
    dues.push({ id: 'm1', label: 'Monthly fee', month: 'Oct 2026', amount: cls.fee, cat: 'monthly' });
    const id = addStudent({ name: q.name, gender: q.gender || 'Male', classId: cls.id, section, dob: q.dob || '', bform: q.bform || '', prevSchool: q.prevSchool || '', note: q.note || '', roll: '', familyId: fam?.id, dues },
      fam ? null : { name: q.guardian && q.guardian !== '—' ? q.guardian : q.name, phone: q.phone || '', whatsapp: q.whatsapp || q.phone || '', cnic: '', email: q.email || '' });
    moveInquiry(q.id, 'enrolled');
    toast(`${q.name} admitted to ${cls.name} ${section}`, { icon: 'userPlus' });
    onClose(); onDone?.(); nav(`/students/${id}`);
  };
  return (
    <Modal open onClose={onClose} title="Approve & admit" sub={`${q.name} joins ${cls.name}. Add the one-time fees your school charges.`}
      footer={<><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" onClick={admit}><Icon name="userPlus" size={15} />Approve & admit</button></>}>
      <div className="form-grid">
        <Field label="Class"><input className="input" value={cls.name} readOnly /></Field>
        <Field label="Section"><select className="select" value={section} onChange={(e) => setSection(e.target.value)}>{cls.sections.map((x) => <option key={x}>{x}</option>)}</select></Field>
        <Field label="Admission fee" optional><input className="input" inputMode="numeric" value={fees.admission} onChange={set('admission')} placeholder="0" /></Field>
        <Field label="Student fund" optional><input className="input" inputMode="numeric" value={fees.fund} onChange={set('fund')} placeholder="0" /></Field>
        <Field label="Security fee" optional><input className="input" inputMode="numeric" value={fees.security} onChange={set('security')} placeholder="0" /></Field>
      </div>
      <div className={`banner ${fam ? 'info' : ''}`}><Icon name="family" size={16} />{fam ? <>Joins the existing <b>{fam.name}</b> family ({fam.id}) — same phone number.</> : <>A new family is created for {q.guardian && q.guardian !== '—' ? q.guardian : q.name}.</>}</div>
      <div className="xs muted">{cls.name} monthly fee {cls.fee.toLocaleString('en-US')} PKR is billed from this month. Collect the fees on the family’s fee page.</div>
    </Modal>
  );
}
