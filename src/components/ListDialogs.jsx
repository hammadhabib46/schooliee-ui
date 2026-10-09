import { useState } from 'react';
import Icon from './Icon.jsx';
import { Field, Modal } from './ui.jsx';
import { useSchool } from '../lib/store.jsx';
import { cx, fmt } from '../lib/format.js';
import { downloadIdCardsZip, printHtml } from '../lib/exporter.js';
import { code } from '../lib/store.jsx';

const SAMPLES = {
  families: 'guardian_name,phone,whatsapp,cnic,address\nMuhammad Aslam,03001112233,03001112233,35202-1234567-1,Street 4 Samundri\n',
  students: 'student_name,gender,class,section,guardian_name,guardian_phone,date_of_birth\nAli Raza,Male,Class One,new A,Muhammad Aslam,03001112233,2018-04-12\n',
};

function downloadText(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const parseCsv = (text) => {
  const [head, ...lines] = text.trim().split(/\r?\n/);
  const keys = head.split(',').map((k) => k.trim());
  return lines.filter(Boolean).map((l) => Object.fromEntries(l.split(',').map((v, i) => [keys[i], v.trim()])));
};

// Bulk upload: pick what you're uploading → get the sample → upload → check rows → import.
export function BulkUploadModal({ onClose, initial = 'students' }) {
  const { db, addFamily, addStudent, toast } = useSchool();
  const [kind, setKind] = useState(initial);
  const [rows, setRows] = useState(null);
  const [file, setFile] = useState('');
  const classOf = (n) => db.classes.find((c) => c.name.toLowerCase() === (n || '').toLowerCase());
  const problems = (r) => {
    if (kind === 'families') return [!r.guardian_name && 'name missing', !r.phone && 'phone missing', db.families.some((f) => f.phone === r.phone) && 'phone already exists'].filter(Boolean);
    const c = classOf(r.class);
    return [!r.student_name && 'name missing', !c && `class “${r.class}” not found`, c && r.section && !c.sections.includes(r.section) && `section “${r.section}” not in ${c.name}`].filter(Boolean);
  };
  const good = rows ? rows.filter((r) => !problems(r).length) : [];
  const run = () => {
    const famByPhone = {};
    good.forEach((r) => {
      if (kind === 'families') addFamily({ name: r.guardian_name, phone: r.phone, whatsapp: r.whatsapp || r.phone, cnic: r.cnic || '', address: r.address || '', mother: '', occupation: '', email: '' });
      else {
        const c = classOf(r.class);
        const ph = r.guardian_phone || '';
        const familyId = famByPhone[ph] || db.families.find((f) => ph && f.phone === ph)?.id || addFamily({ name: r.guardian_name || 'Guardian', phone: ph, whatsapp: ph, cnic: '', address: '', mother: '', occupation: '', email: '' });
        if (ph) famByPhone[ph] = familyId;
        addStudent({ name: r.student_name, gender: r.gender || 'Male', classId: c.id, section: r.section || c.sections[0], dob: r.date_of_birth || '', roll: '', bform: '', prevSchool: '', note: '', familyId, dues: [{ id: 'm1', label: 'Monthly fee', month: 'Oct 2026', amount: c.fee }] });
      }
    });
    toast(`${good.length} ${kind} imported`, { icon: 'upload' });
    onClose();
  };
  return (
    <Modal open wide onClose={onClose} title="Bulk upload" sub="Add many families or students from a spreadsheet"
      footer={<><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" disabled={!good.length} onClick={run}>Import {good.length || ''} {kind}</button></>}>
      <div className="onoff" style={{ alignSelf: 'flex-start' }}>{['families', 'students'].map((k) => <button key={k} className={cx(kind === k && 'on')} onClick={() => { setKind(k); setRows(null); setFile(''); }}>{k[0].toUpperCase() + k.slice(1)}</button>)}</div>
      <div className="grid g2" style={{ gap: 10 }}>
        <button className="stack-card" style={{ marginTop: 0, textAlign: 'left', font: 'inherit', color: 'inherit', cursor: 'pointer' }} onClick={() => downloadText(`schooliee-${kind}-sample.csv`, SAMPLES[kind])}>
          <span className="circle sm">1</span><span className="grow"><span className="medium" style={{ display: 'block' }}>Download the sample</span><span className="xs muted">CSV with the right columns{kind === 'students' ? ' — upload families first' : ''}</span></span><Icon name="download" size={16} />
        </button>
        <label className="stack-card" style={{ marginTop: 0, cursor: 'pointer' }}>
          <span className="circle sm">2</span><span className="grow"><span className="medium" style={{ display: 'block' }}>{file || 'Upload your file'}</span><span className="xs muted">CSV saved from Excel or Google Sheets</span></span><Icon name="upload" size={16} />
          <input type="file" accept=".csv,text/csv" hidden onChange={(e) => { const f = e.target.files[0]; if (!f) return; setFile(f.name); f.text().then((t) => setRows(parseCsv(t))); }} />
        </label>
      </div>
      {!rows && <button className="btn sm ghost" style={{ alignSelf: 'flex-start' }} onClick={() => { setFile('sample (demo)'); setRows(parseCsv(SAMPLES[kind] + (kind === 'students' ? 'Hira,Female,Class Two,A,Bilal Khan,03214445566,2017-09-01\nZain,Male,Class Nine,A,Bilal Khan,03214445566,\n' : 'Bilal Khan,03214445566,,,Main bazar\n'))); }}>Try with sample rows</button>}
      {rows && (
        <div className="col gap-6">
          <div className="row between small"><span className="medium">{rows.length} rows found</span><span className="muted">{good.length} ready · {rows.length - good.length} need fixing</span></div>
          <div className="table-wrap" style={{ maxHeight: 260, overflow: 'auto' }}>
            <table className="table"><thead><tr><th>Row</th><th>{kind === 'families' ? 'Guardian' : 'Student'}</th><th>{kind === 'families' ? 'Phone' : 'Class'}</th><th>Check</th></tr></thead>
              <tbody>{rows.map((r, i) => { const p = problems(r); return <tr key={i}><td className="muted">{i + 2}</td><td className="medium">{r.guardian_name && kind === 'families' ? r.guardian_name : r.student_name}</td><td>{kind === 'families' ? r.phone : `${r.class} ${r.section || ''}`}</td><td>{p.length ? <span className="pill danger">{p[0]}</span> : <span className="pill ok">Ready</span>}</td></tr>; })}</tbody></table>
          </div>
        </div>
      )}
    </Modal>
  );
}

// One dialog for every "print a batch" action: admission forms, ID cards, salary slips.
export function BatchPrintModal({ kind, onClose }) {
  const { db, sections, toast } = useSchool();
  const isStaff = kind === 'staffIds' || kind === 'slips';
  const [scope, setScope] = useState(isStaff ? 'all' : 'class');
  const [picked, setPicked] = useState(sections.slice(0, 1).map((s) => s.key));
  const [copies, setCopies] = useState(kind === 'forms' ? '10' : '1');
  const [month, setMonth] = useState('Oct 2026');
  const [side, setSide] = useState('Front & back');
  const cfg = {
    forms: ['Admission forms', 'Blank forms with your logo — or pre-filled for a section', 'doc'],
    idcards: ['Student ID cards', 'A ZIP with front and back PNGs for every card', 'idcard'],
    staffIds: ['Staff ID cards', 'A ZIP with front and back PNGs for every card', 'idcard'],
    slips: ['Salary slips', 'Every staff member’s slip for the month', 'receipt'],
  }[kind];
  const staff = db.staff.filter((s) => s.status === 'active');
  const count = isStaff ? (kind === 'slips' ? staff.filter((s) => db.payroll[s.id] || month !== 'Oct 2026').length : staff.length)
    : kind === 'forms' && scope === 'blank' ? Number(copies) || 0
      : scope === 'all' ? db.students.filter((s) => s.status === 'active').length
        : sections.filter((s) => picked.includes(s.key)).reduce((a, s) => a + s.students.length, 0);
  const isCards = kind === 'idcards' || kind === 'staffIds';
  const [orient, setOrient] = useState('Portrait');
  const zipCards = () => {
    const people = kind === 'staffIds'
      ? staff.map((s) => ({ code: s.id, name: s.name, lines: [s.id, s.role, s.phone] }))
      : (scope === 'all' ? db.students.filter((s) => s.status === 'active') : sections.filter((s) => picked.includes(s.key)).flatMap((s) => s.students))
        .map((s) => ({ code: code(s), name: s.name, lines: [code(s), `${db.classes.find((c) => c.id === s.classId)?.name} · ${s.section}`] }));
    return downloadIdCardsZip({ school: db.school.short || db.school.name, title: cfg[0], people, sides: side === 'Front & back' ? 'both' : 'front', landscape: orient === 'Landscape' });
  };
  const printBatch = () => {
    const row = (k, v) => `<div class="row"><span>${k}</span><b>${v ?? ''}</b></div>`;
    const head = `<h2>${db.school.name}</h2>`;
    let pages;
    if (kind === 'slips') pages = staff.map((s) => `<div class="pg">${head}<div>Salary slip · ${month}</div>${row('Name', s.name)}${row('ID', s.id)}${row('Role', s.role)}${row('Pay', `${fmt(s.pay)} PKR`)}${row('Loan deduction', fmt(s.loanDeduction || 0))}${row('Net', `${fmt(s.pay - (s.loanDeduction || 0))} PKR`)}</div>`);
    else if (kind === 'staffIds') pages = staff.map((s) => `<div class="pg">${head}<div>Staff ID card</div>${row('Name', s.name)}${row('ID', s.id)}${row('Role', s.role)}${row('Phone', s.phone)}</div>`);
    else {
      const list = scope === 'all' ? db.students.filter((s) => s.status === 'active') : sections.filter((s) => picked.includes(s.key)).flatMap((s) => s.students);
      if (kind === 'forms' && scope === 'blank') pages = Array.from({ length: Number(copies) || 0 }, () => `<div class="pg">${head}<div>Admission form</div>${['Student name', 'Date of birth', 'B-Form', 'Class', 'Guardian', 'Phone', 'Address', 'Previous school'].map((k) => row(k, '______________________')).join('')}</div>`);
      else pages = list.map((s) => `<div class="pg">${head}<div>${kind === 'forms' ? 'Admission form' : 'Student ID card'}</div>${row('Name', s.name)}${row('Class', `${db.classes.find((c) => c.id === s.classId)?.name} ${s.section}`)}${row('Gender', s.gender)}${row('Date of birth', s.dob)}</div>`);
    }
    printHtml(cfg[0], pages);
  };
  return (
    <Modal open onClose={onClose} title={cfg[0]} sub={cfg[1]}
      footer={<><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" disabled={!count} onClick={() => { if (isCards) { zipCards().then((n) => toast(`${n} PNG files zipped · ${count} ${cfg[0].toLowerCase()}`, { icon: 'download' })); } else { printBatch(); toast(`${count} ${cfg[0].toLowerCase()} ready · choose “Save as PDF” to keep a copy`, { icon: 'print' }); } onClose(); }}><Icon name={isCards ? 'download' : 'print'} size={15} />{isCards ? 'Download ZIP of' : 'Print'} {count}</button></>}>
      {!isStaff && (
        <div className="onoff" style={{ alignSelf: 'flex-start' }}>
          {(kind === 'forms' ? [['blank', 'Blank'], ['class', 'Pre-filled · sections'], ['all', 'Pre-filled · everyone']] : [['class', 'Sections'], ['all', 'Whole school']]).map(([k, l]) => <button key={k} className={cx(scope === k && 'on')} onClick={() => setScope(k)}>{l}</button>)}
        </div>
      )}
      {!isStaff && scope === 'class' && (
        <div className="row wrap gap-6" style={{ padding: 10, borderRadius: 16, background: 'var(--surface-2)' }}>
          {sections.map((s) => { const on = picked.includes(s.key); return <button key={s.key} className={cx('chip sm', on && 'on')} style={{ height: 28 }} onClick={() => setPicked(on ? picked.filter((x) => x !== s.key) : [...picked, s.key])}>{s.label} · {s.students.length}</button>; })}
        </div>
      )}
      <div className="form-grid">
        {kind === 'forms' && scope === 'blank' && <Field label="Copies"><input className="input" inputMode="numeric" value={copies} onChange={(e) => setCopies(e.target.value.replace(/\D/g, ''))} /></Field>}
        {isCards && <Field label="Layout"><select className="select" value={orient} onChange={(e) => setOrient(e.target.value)}><option>Portrait</option><option>Landscape</option></select></Field>}
        {isCards && <Field label="Sides"><select className="select" value={side} onChange={(e) => setSide(e.target.value)}><option>Front & back</option><option>Front only</option></select></Field>}
        {kind === 'slips' && <Field label="Month"><select className="select" value={month} onChange={(e) => setMonth(e.target.value)}>{['Oct 2026', 'Sep 2026', 'Aug 2026'].map((m) => <option key={m}>{m}</option>)}</select></Field>}
      </div>
      {kind === 'slips' && month === 'Oct 2026' && count < staff.length && <div className="banner warn"><Icon name="warn" size={16} />{staff.length - count} staff not paid for October yet — their slips are skipped.</div>}
      <div className="row between small" style={{ padding: '12px 14px', borderRadius: 16, background: 'var(--surface-2)' }}><span className="row gap-8"><Icon name={cfg[2]} size={16} />{count} {count === 1 ? 'page' : 'pages'}</span><span className="muted">{kind === 'slips' ? `${fmt(staff.reduce((a, s) => a + s.pay, 0))} PKR total pay` : 'Uses your template in Settings'}</span></div>
    </Modal>
  );
}
