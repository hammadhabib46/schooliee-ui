import { useMemo, useState } from 'react';
import Icon from '../../components/Icon.jsx';
import { Avatar, Field, Modal, Search, Seg, SwitchRow } from '../../components/ui.jsx';
import { useSchool, dueOf, code } from '../../lib/store.jsx';
import { cx, fmt } from '../../lib/format.js';
import { discountAmount, netFee } from '../../lib/student.js';
import { printView } from '../../lib/exporter.js';

const Foot = ({ onClose, children }) => <><button className="btn ghost" onClick={onClose}>Cancel</button>{children}</>;

export function ChangeFamilyModal({ s, onClose }) {
  const { db, kidsOf, updateStudent, toast } = useSchool();
  const [q, setQ] = useState('');
  const [pick, setPick] = useState(null);
  const cur = db.families.find((f) => f.id === s.familyId);
  const list = db.families.filter((f) => f.id !== s.familyId).filter((f) => { const t = q.toLowerCase(); return !t || `${f.name} ${f.id} ${f.phone} ${f.cnic}`.toLowerCase().includes(t); });
  const to = db.families.find((f) => f.id === pick);
  return (
    <Modal open onClose={onClose} title="Change family" sub={`${s.name} · currently ${cur.name} (${cur.id})`}
      footer={<Foot onClose={onClose}><button className="btn primary" disabled={!pick} onClick={() => { updateStudent(s.id, { familyId: pick }); toast(`${s.name} moved to ${to.name} family`, { undo: () => updateStudent(s.id, { familyId: s.familyId }) }); onClose(); }}>Move to {to?.name || 'family'}</button></Foot>}>
      <Search value={q} onChange={setQ} placeholder="Guardian, phone, CNIC or ID" lg autoFocus />
      <div className="col gap-6" style={{ maxHeight: 300, overflowY: 'auto' }}>
        {list.map((f) => (
          <button key={f.id} onClick={() => setPick(f.id)} className="row" style={{ gap: 12, padding: 10, borderRadius: 16, textAlign: 'left', border: `1.5px solid ${pick === f.id ? 'var(--text)' : 'var(--border)'}`, background: pick === f.id ? 'var(--surface-2)' : 'transparent' }}>
            <Avatar name={f.name} id={f.id} size={34} />
            <span className="grow"><span className="medium">{f.name}</span> <span className="small muted">· {f.id}</span><span className="xs muted" style={{ display: 'block' }}>{f.phone} · {kidsOf(f.id).map((k) => k.name).join(', ') || 'no students'}</span></span>
          </button>
        ))}
      </div>
      {dueOf(s) > 0 && <div className="banner warn small"><Icon name="warn" size={16} />{fmt(dueOf(s))} PKR of unpaid dues will move with {s.name} to the new family.</div>}
    </Modal>
  );
}

export function SectionModal({ s, mode, onClose }) {
  const { db, updateStudent, promote, toast } = useSchool();
  const promoteMode = mode === 'promote';
  const curIdx = db.classes.findIndex((c) => c.id === s.classId);
  const next = promoteMode ? db.classes[Math.min(db.classes.length - 1, curIdx + 1)] : db.classes[curIdx];
  const [classId, setClassId] = useState(next.id);
  const cls = db.classes.find((c) => c.id === classId);
  const [section, setSection] = useState(cls.sections.find((x) => x !== s.section) || cls.sections[0]);
  const [fee, setFee] = useState(promoteMode ? '1000' : '');
  const sections = cls.sections;
  const same = classId === s.classId && section === s.section;
  const save = () => {
    if (promoteMode) promote(s.id, { classId, section, fee });
    else updateStudent(s.id, { section });
    toast(promoteMode ? `${s.name} promoted to ${cls.name} ${section}` : `${s.name} moved to section ${section}`);
    onClose();
  };
  return (
    <Modal open onClose={onClose} title={promoteMode ? 'Promote student' : 'Change section'} sub={`${s.name} · now ${db.classes[curIdx].name} ${s.section}`}
      footer={<Foot onClose={onClose}><button className="btn primary" disabled={same} onClick={save}>{promoteMode ? `Promote to ${cls.name}` : `Move to ${section}`}</button></Foot>}>
      {promoteMode && (
        <Field label="New class">
          <select aria-label="Class" className="select" value={classId} onChange={(e) => { const c = db.classes.find((x) => x.id === e.target.value); setClassId(c.id); setSection(c.sections[0]); }}>
            {db.classes.map((c) => <option key={c.id} value={c.id}>{c.name} · {fmt(c.fee)} / month</option>)}
          </select>
        </Field>
      )}
      <div className="col gap-8">
        <span className="label">Section</span>
        <div className="row wrap gap-8">{sections.map((x) => <button key={x} className={cx('chip', section === x && 'on')} onClick={() => setSection(x)}>{x}{x === s.section && classId === s.classId && <span className="xs" style={{ opacity: .6 }}>current</span>}</button>)}</div>
      </div>
      {promoteMode && (
        <>
          <Field label="Promotion fee (PKR)" optional hint="Received now — recorded as income in Transactions"><input className="input" value={fee} onChange={(e) => setFee(e.target.value.replace(/\D/g, ''))} /></Field>
          <div className="grid g2">
            <div className="tile"><div className="k">Monthly fee now</div><div className="v">{fmt(netFee(s, db.classes[curIdx]))} PKR</div></div>
            <div className="tile"><div className="k">From November</div><div className="v">{fmt(netFee(s, cls))} PKR</div></div>
          </div>
        </>
      )}
    </Modal>
  );
}

export function TerminateModal({ s, onClose }) {
  const { terminate, readmit, toast } = useSchool();
  const [date, setDate] = useState('2026-10-09');
  const due = dueOf(s);
  return (
    <Modal open onClose={onClose} title={`Terminate ${s.name}?`} sub="They move to Terminated. You can activate them again any time."
      footer={<Foot onClose={onClose}><button className="btn" style={{ background: 'var(--danger)', color: '#fff', borderColor: 'transparent' }} onClick={() => { terminate(s.id, { date }); toast(`${s.name} terminated`, { undo: () => readmit(s.id) }); onClose(); }}>Terminate</button></Foot>}>
      <Field label="Termination date"><input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      {due > 0 && <div className="banner warn small"><Icon name="warn" size={16} />{fmt(due)} PKR is still due. It stays on the family until collected or waived.</div>}
      <div className="small muted">Monthly fees stop from next month. Attendance, results and documents are kept.</div>
    </Modal>
  );
}

export function ChargeModal({ s, onClose }) {
  const { addCharge, toast } = useSchool();
  const [label, setLabel] = useState('Books');
  const [amount, setAmount] = useState('');
  const [paidNow, setPaidNow] = useState(false);
  return (
    <Modal open onClose={onClose} title="Add one-time charge" sub={s.name}
      footer={<Foot onClose={onClose}><button className="btn primary" disabled={!Number(amount) || !label} onClick={() => { addCharge(s.id, { label, amount, paidNow }); toast(`${label} · ${fmt(amount)} PKR ${paidNow ? 'collected' : 'added to dues'}`); onClose(); }}>Add charge</button></Foot>}>
      <div className="row wrap gap-8">{['Books', 'Uniform', 'Security', 'Exam fee', 'Trip', 'Sports'].map((l) => <button key={l} className={cx('chip sm', label === l && 'on')} onClick={() => setLabel(l)}>{l}</button>)}</div>
      <div className="form-grid">
        <Field label="Charge"><input className="input" value={label} onChange={(e) => setLabel(e.target.value)} /></Field>
        <Field label="Amount (PKR)"><input className="input" autoFocus inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))} /></Field>
      </div>
      <SwitchRow on={paidNow} onChange={setPaidNow} title="Already paid" sub="Records the payment now and prints a receipt" />
    </Modal>
  );
}

export function RecurringModal({ s, onClose }) {
  const { addRecurring, toast } = useSchool();
  const [v, setV] = useState({ name: 'Bus', amount: '', day: '6', end: '' });
  return (
    <Modal open onClose={onClose} title="Add recurring charge" sub={`${s.name} · billed every month with the fee`}
      footer={<Foot onClose={onClose}><button className="btn primary" disabled={!Number(v.amount) || !v.name} onClick={() => { addRecurring(s.id, v); toast(`${v.name} added — starts November`); onClose(); }}>Add recurring charge</button></Foot>}>
      <div className="row wrap gap-8">{['Bus', 'Van', 'Tuition (evening)', 'Lunch', 'Computer lab'].map((l) => <button key={l} className={cx('chip sm', v.name === l && 'on')} onClick={() => setV({ ...v, name: l })}>{l}</button>)}</div>
      <div className="form-grid">
        <Field label="Name"><input className="input" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} /></Field>
        <Field label="Monthly amount (PKR)"><input className="input" autoFocus inputMode="numeric" value={v.amount} onChange={(e) => setV({ ...v, amount: e.target.value.replace(/\D/g, '') })} /></Field>
        <Field label="Day of month" hint="1 – 28"><input className="input" inputMode="numeric" value={v.day} onChange={(e) => setV({ ...v, day: String(Math.min(28, Number(e.target.value.replace(/\D/g, '')) || 1)) })} /></Field>
        <Field label="Ends on" optional hint="Leave empty to keep charging"><input className="input" type="date" value={v.end} onChange={(e) => setV({ ...v, end: e.target.value })} /></Field>
      </div>
    </Modal>
  );
}

export function DiscountModal({ s, cls, onClose }) {
  const { updateStudent, toast } = useSchool();
  const [type, setType] = useState(s.discountType || 'amount');
  const [value, setValue] = useState(String(s.discount || ''));
  const [reason, setReason] = useState(s.discountReason || '');
  const preview = { ...s, discountType: type, discount: Number(value) || 0 };
  return (
    <Modal open onClose={onClose} title="Fee discount" sub={`${s.name} · ${cls.name} fee ${fmt(cls.fee)} PKR`}
      footer={<Foot onClose={onClose}><button className="btn primary" onClick={() => { updateStudent(s.id, { discountType: type, discount: Number(value) || 0, discountReason: reason }); toast('Discount saved · applies from November'); onClose(); }}>Save discount</button></Foot>}>
      <Seg ink lg value={type} onChange={setType} items={[{ key: 'amount', label: 'Fixed amount' }, { key: 'percent', label: 'Percentage' }]} />
      <div className="form-grid">
        <Field label={type === 'percent' ? 'Discount (%)' : 'Discount (PKR / month)'}><input className="input" inputMode="numeric" value={value} onChange={(e) => setValue(e.target.value.replace(/\D/g, ''))} /></Field>
        <Field label="Reason" optional><input className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. sibling, staff child, merit" /></Field>
      </div>
      <div className="row wrap gap-8">{['Sibling discount', 'Staff child', 'Merit scholarship', 'Hardship'].map((r) => <button key={r} className={cx('chip sm', reason === r && 'on')} onClick={() => setReason(r)}>{r}</button>)}</div>
      <div className="grid g3">
        <div className="tile"><div className="k">Class fee</div><div className="v">{fmt(cls.fee)}</div></div>
        <div className="tile"><div className="k">Discount</div><div className="v">−{fmt(discountAmount(preview, cls))}</div></div>
        <div className="tile"><div className="k">Net / month</div><div className="v">{fmt(netFee(preview, cls))} PKR</div></div>
      </div>
    </Modal>
  );
}

export function UploadDocModal({ s, onClose }) {
  const { addDocument, toast } = useSchool();
  const [name, setName] = useState('');
  const [file, setFile] = useState(null);
  return (
    <Modal open onClose={onClose} title="Upload document" sub={s.name}
      footer={<Foot onClose={onClose}><button className="btn primary" disabled={!name} onClick={() => { addDocument({ title: name, type: 'Student upload', owner: `${s.name} (${code(s)})` }); toast(`${name} uploaded`); onClose(); }}>Upload</button></Foot>}>
      <div className="row wrap gap-8">{['B-Form', 'Previous result card', 'Birth certificate', 'Medical record', 'Leaving certificate'].map((l) => <button key={l} className={cx('chip sm', name === l && 'on')} onClick={() => setName(l)}>{l}</button>)}</div>
      <Field label="Document name"><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <label className="dropzone" style={{ cursor: 'pointer' }}>
        <Icon name={file ? 'check' : 'upload'} size={20} />
        {file ? file : 'Drop an image or PDF here, or click to browse'}
        <span className="xs faint">Up to 10 MB</span>
        <input type="file" hidden onChange={(e) => setFile(e.target.files?.[0]?.name || null)} />
      </label>
    </Modal>
  );
}

export function AchievementModal({ s, onClose }) {
  const { addDocument, toast } = useSchool();
  const [v, setV] = useState({ purpose: 'Best performance', description: '', date: '2026-10-09', n1: 'Demo school', d1: 'Principal', n2: '', d2: '' });
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  return (
    <Modal open onClose={onClose} wide title="Achievement certificate" sub={s.name}
      footer={<Foot onClose={onClose}><button className="btn" onClick={() => { addDocument({ title: `${v.purpose} certificate`, type: 'Certificate', owner: `${s.name} (${code(s)})` }); toast('Certificate saved'); onClose(); }}>Save</button><button className="btn primary" onClick={() => { addDocument({ title: `${v.purpose} certificate`, type: 'Certificate', owner: `${s.name} (${code(s)})` }); (printView(), toast('Certificate saved · sent to printer', { icon: 'print' })); onClose(); }}><Icon name="print" size={15} />Save & print</button></Foot>}>
      <div className="split" style={{ gap: 20 }}>
        <div className="col gap-12" style={{ flex: '1 1 300px' }}>
          <div className="row wrap gap-6">{['Best performance', 'Sports day winner', 'Perfect attendance', 'Science fair', 'Hifz e Quran'].map((l) => <button key={l} className={cx('chip sm', v.purpose === l && 'on')} onClick={() => setV({ ...v, purpose: l })}>{l}</button>)}</div>
          <Field label="Purpose"><input className="input" value={v.purpose} onChange={set('purpose')} /></Field>
          <Field label="Description" optional><textarea className="textarea" rows={3} value={v.description} onChange={set('description')} placeholder="For outstanding performance in…" /></Field>
          <Field label="Issued on"><input className="input" type="date" value={v.date} onChange={set('date')} /></Field>
          <div className="form-grid">
            <Field label="Signatory 1"><input className="input" value={v.n1} onChange={set('n1')} /></Field>
            <Field label="Designation"><input className="input" value={v.d1} onChange={set('d1')} /></Field>
            <Field label="Signatory 2" optional><input className="input" value={v.n2} onChange={set('n2')} /></Field>
            <Field label="Designation" optional><input className="input" value={v.d2} onChange={set('d2')} /></Field>
          </div>
        </div>
        <div style={{ flex: '1 1 240px', alignSelf: 'flex-start', border: '1px solid var(--border)', borderRadius: 18, padding: 22, textAlign: 'center', background: 'var(--surface-2)' }}>
          <div className="upper">Certificate of achievement</div>
          <div className="display mt-12" style={{ fontSize: 26 }}>{s.name}</div>
          <div className="small muted mt-8">{v.purpose}</div>
          <p className="xs mt-12" style={{ minHeight: 32 }}>{v.description}</p>
          <div className="row between xs mt-16" style={{ borderTop: '1px solid var(--line)', paddingTop: 10 }}><span>{v.n1}<br /><span className="faint">{v.d1}</span></span>{v.n2 && <span>{v.n2}<br /><span className="faint">{v.d2}</span></span>}</div>
        </div>
      </div>
    </Modal>
  );
}

export function CertificateModal({ s, cls, fam, onClose, kind = 'character' }) {
  const { db, addDocument, toast } = useSchool();
  const he = s.gender === 'Female' ? 'her' : 'his';
  const leaving = kind === 'leaving';
  const [title, setTitle] = useState(leaving ? 'School leaving certificate' : 'Character certificate');
  const [body, setBody] = useState(leaving ? `This is to certify that ${s.name} (${code(s)}), ${s.gender === 'Female' ? 'daughter' : 'son'} of ${fam.name}, was a student of ${db.school.name} from ${s.admitted} to ${s.terminatedOn || '[last day]'}, last studying in ${cls.name}.\n\nAll dues [have been cleared / are pending].\n\nWe wish ${s.gender === 'Female' ? 'her' : 'him'} every success.` : `This is to certify that ${s.name} (${code(s)}), ${s.gender === 'Female' ? 'daughter' : 'son'} of ${fam.name}, bearing Registration # ${code(s)}, was a bonafide student of ${db.school.name} in ${cls.name}.\n\n${s.gender === 'Female' ? 'She' : 'He'} got [marks obtained] in the examination.\n\nDuring ${he} stay at this institution, ${he} conduct, character and behaviour remained [satisfactory / very good / excellent].`);
  const holes = (body.match(/\[[^\]]+\]/g) || []).length;
  return (
    <Modal open onClose={onClose} wide title={leaving ? 'Leaving certificate' : 'Character certificate'} sub="Student details are filled in. Complete the highlighted placeholders."
      footer={<Foot onClose={onClose}><button className="btn primary" disabled={holes > 0} title={holes ? 'Fill all placeholders first' : ''} onClick={() => { addDocument({ title, type: leaving ? 'Leaving certificate' : 'Character certificate', owner: `${s.name} (${code(s)})` }); toast('Character certificate created', { icon: 'doc' }); onClose(); }}>{holes ? `${holes} placeholder${holes > 1 ? 's' : ''} left` : 'Create certificate'}</button></Foot>}>
      <Field label="Title"><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
      <Field label="Content"><textarea className="textarea" rows={8} value={body} onChange={(e) => setBody(e.target.value)} /></Field>
      <div className="row wrap gap-6">
        {leaving && ['have been cleared', 'are pending'].map((w) => <button key={w} className="chip sm" onClick={() => setBody(body.replace('[have been cleared / are pending]', w))}>Dues {w}</button>)}
        {!leaving && ['satisfactory', 'very good', 'excellent'].map((w) => <button key={w} className="chip sm" onClick={() => setBody(body.replace('[satisfactory / very good / excellent]', w))}>Conduct: {w}</button>)}
        {!leaving && <button className="chip sm" onClick={() => setBody(body.replace('[marks obtained]', '420/500 (84%)'))}>Use last result</button>}
      </div>
    </Modal>
  );
}

// Questions come from Academics → Observations → Questions (db.obsQuestions).
export const obsScore = (o) => {
  if (o.scores) return Object.values(o.scores).reduce((a, v) => a + v, 0) / Object.values(o.scores).length;
  const vals = Object.values(o.answers || {}).map((v) => (v === 'Yes' ? 5 : v === 'No' ? 2 : typeof v === 'number' ? v : null)).filter((v) => v !== null);
  return vals.length ? vals.reduce((a, v) => a + v, 0) / vals.length : 0;
};

export function ObservationModal({ s, onClose }) {
  const { db, active, addObservation, toast, classById } = useSchool();
  const [sid, setSid] = useState(s?.id || active[0]?.id);
  const [fc, setFc] = useState('all');
  const [fs, setFs] = useState('all');
  const [extra, setExtra] = useState('');
  const pool = active.filter((x) => (fc === 'all' || x.classId === fc) && (fs === 'all' || x.section === fs));
  const fcls = db.classes.find((c) => c.id === fc);
  const [date, setDate] = useState('2026-10-09');
  const [mode, setMode] = useState('staff');
  const [reviewer, setReviewer] = useState(db.staff.find((x) => x.type === 'teacher')?.name || '');
  const [ans, setAns] = useState({});
  const qs = db.obsQuestions.filter((q) => q.active);
  const done = qs.filter((q) => ans[q.text] !== undefined && ans[q.text] !== '').length;
  const student = s || active.find((x) => x.id === sid);
  const save = () => {
    const note = [...qs.filter((q) => q.type === 'text').map((q) => ans[q.text]), extra].filter(Boolean).join(' ');
    addObservation({ studentId: student.id, reviewer, date, answers: ans, note });
    toast('Observation saved · shared with parents');
    onClose();
  };
  return (
    <Modal open onClose={onClose} wide title="New observation" sub={`${student?.name} · ${done}/${qs.length} answered`}
      footer={<Foot onClose={onClose}><button className="btn primary" disabled={!reviewer || done < Math.min(3, qs.length)} onClick={save}>Save observation</button></Foot>}>
      <div className="form-grid">
        {!s && <Field label="Filter by class" optional><select className="select" value={fc} onChange={(e) => { setFc(e.target.value); setFs('all'); const first = active.find((x) => e.target.value === 'all' || x.classId === e.target.value); if (first) setSid(first.id); }}><option value="all">All classes</option>{db.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>}
        {!s && <Field label="Filter by section" optional><select className="select" value={fs} disabled={fc === 'all'} onChange={(e) => { setFs(e.target.value); const first = pool.find((x) => e.target.value === 'all' || x.section === e.target.value); if (first) setSid(first.id); }}><option value="all">All sections</option>{fcls?.sections.map((x) => <option key={x}>{x}</option>)}</select></Field>}
        {!s && <Field label="Student" span><select className="select" value={sid} onChange={(e) => setSid(e.target.value)}>{pool.map((x) => <option key={x.id} value={x.id}>{x.name} ({code(x)}) · {classById[x.classId]?.name} {x.section}</option>)}</select></Field>}
        <Field label="Date"><input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <div className="field"><span>Reviewer</span>
          <div className="row gap-8">
            <Seg ink value={mode} onChange={setMode} items={[{ key: 'staff', label: 'Staff' }, { key: 'custom', label: 'Other' }]} />
            {mode === 'staff'
              ? <select aria-label="Reviewer" className="select grow" value={reviewer} onChange={(e) => setReviewer(e.target.value)}>{db.staff.map((x) => <option key={x.id}>{x.name}</option>)}</select>
              : <input className="input grow" style={{ height: 40 }} placeholder="Name" value={reviewer} onChange={(e) => setReviewer(e.target.value)} />}
          </div>
        </div>
      </div>
      <div className="col" style={{ gap: 0 }}>
        {qs.map(({ id, text: q, type: t }) => (
          <div key={id} className="row between wrap" style={{ gap: 10, padding: '12px 0', borderTop: '1px solid var(--line)' }}>
            <span className="medium">{q}</span>
            {t === 'yesno' && <Seg ink value={ans[q]} onChange={(v) => setAns({ ...ans, [q]: v })} items={['Yes', 'No']} />}
            {t === 'rating' && <span className="row gap-4">{[1, 2, 3, 4, 5].map((n) => <button key={n} aria-label={`${n} stars`} onClick={() => setAns({ ...ans, [q]: n })} className="icon-btn xs plain" style={{ color: n <= (ans[q] || 0) ? 'var(--warn)' : 'var(--faint)' }}><Icon name="star" size={18} fill={n <= (ans[q] || 0) ? 'currentColor' : 'none'} /></button>)}</span>}
            {t === 'text' && <input className="input" style={{ flex: '1 1 260px', height: 40 }} placeholder="Write your observation…" value={ans[q] || ''} onChange={(e) => setAns({ ...ans, [q]: e.target.value })} />}
          </div>
        ))}
        {!qs.length && <div className="small muted" style={{ padding: 12 }}>No active questions — add them in Academics → Observations → Questions.</div>}
      </div>
      <Field label="Additional notes" optional><textarea className="textarea" rows={2} value={extra} onChange={(e) => setExtra(e.target.value)} /></Field>
    </Modal>
  );
}

export function EditStudentModal({ s, onClose }) {
  const { db, updateStudent, toast } = useSchool();
  const [f, setF] = useState({ ...s, customFields: s.customFields || [] });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const cls = db.classes.find((c) => c.id === f.classId);
  const hasTx = (s.history || []).some((h) => h.kind === 'payment');
  const [tab, setTab] = useState('Student');
  return (
    <Modal open onClose={onClose} wide title="Edit student" sub={`${s.name} · ${code(s)}`}
      footer={<Foot onClose={onClose}><button className="btn primary" onClick={() => { updateStudent(s.id, { ...f, customFields: f.customFields.filter(([k]) => k) }); toast('Student updated'); onClose(); }}>Save changes</button></Foot>}>
      <Seg ink lg value={tab} onChange={setTab} items={['Student', 'Enrollment', 'History', 'Custom fields']} />
      {tab === 'Student' && (
        <div className="form-grid">
          <Field label="Full name"><input className="input" value={f.name} onChange={set('name')} /></Field>
          <Field label="Gender"><Seg ink lg value={f.gender} onChange={(g) => setF({ ...f, gender: g })} items={['Male', 'Female']} /></Field>
          <Field label="Date of birth" optional><input className="input" type="date" value={f.dob} onChange={set('dob')} /></Field>
          <Field label="B-Form / CNIC" optional><input className="input" value={f.bform} onChange={set('bform')} placeholder="00000-0000000-0" /></Field>
          <Field label="Religion"><input className="input" value={f.religion} onChange={set('religion')} /></Field>
          <Field label="Blood group" optional><select className="select" value={f.blood} onChange={set('blood')}>{['', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((b) => <option key={b} value={b}>{b || '—'}</option>)}</select></Field>
          <Field label="Note" optional span><textarea className="textarea" rows={2} value={f.note || ''} onChange={set('note')} /></Field>
        </div>
      )}
      {tab === 'Enrollment' && (
        <div className="form-grid">
          <Field label="Class"><select className="select" value={f.classId} onChange={(e) => { const c = db.classes.find((x) => x.id === e.target.value); setF({ ...f, classId: c.id, section: c.sections[0] }); }}>{db.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
          <Field label="Section"><select className="select" value={f.section} onChange={set('section')}>{cls?.sections.map((x) => <option key={x}>{x}</option>)}</select></Field>
          <Field label="Roll no." optional><input className="input" value={f.roll || ''} onChange={set('roll')} /></Field>
          <Field label="Admission date"><input className="input" type="date" value={f.admitted} onChange={set('admitted')} /></Field>
          <Field label="Fee starts from" hint={hasTx ? 'Locked — this student already has fee payments' : null}>
            <div className="row gap-8"><input className="input" type="date" value={f.admitted} disabled={hasTx} readOnly={hasTx} style={hasTx ? { opacity: .55 } : undefined} />{hasTx && <Icon name="lock" size={16} className="faint" />}</div>
          </Field>
          <Field label="Reference" optional><input className="input" value={f.reference || ''} onChange={set('reference')} placeholder="Who referred this family?" /></Field>
        </div>
      )}
      {tab === 'History' && (
        <div className="form-grid">
          <Field label="Previous school" optional><input className="input" value={f.prevSchool || ''} onChange={set('prevSchool')} /></Field>
          <Field label="Previous class" optional><input className="input" value={f.prevClass || ''} onChange={set('prevClass')} /></Field>
          <Field label="Previous result" optional><input className="input" value={f.prevResult || ''} onChange={set('prevResult')} /></Field>
        </div>
      )}
      {tab === 'Custom fields' && (
        <div className="col gap-8">
          <p className="small muted">Extra details your school tracks. Links become clickable on the profile.</p>
          {f.customFields.map(([k, v], i) => (
            <div key={i} className="row gap-8">
              <input className="input" placeholder="Label" value={k} onChange={(e) => setF({ ...f, customFields: f.customFields.map((x, j) => (j === i ? [e.target.value, x[1]] : x)) })} />
              <input className="input grow" placeholder="Value" value={v} onChange={(e) => setF({ ...f, customFields: f.customFields.map((x, j) => (j === i ? [x[0], e.target.value] : x)) })} />
              <button className="icon-btn" aria-label="Remove field" onClick={() => setF({ ...f, customFields: f.customFields.filter((_, j) => j !== i) })}><Icon name="close" size={13} /></button>
            </div>
          ))}
          <button className="btn sm" style={{ alignSelf: 'flex-start' }} onClick={() => setF({ ...f, customFields: [...f.customFields, ['', '']] })}><Icon name="plus" size={14} />Add field</button>
        </div>
      )}
    </Modal>
  );
}

export function useStudentModals() {
  const [m, setM] = useState(null);
  return useMemo(() => ({ m, open: (name) => setM(name), close: () => setM(null) }), [m]);
}
