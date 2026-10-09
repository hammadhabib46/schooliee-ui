import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import { BackBar } from '../../components/Profile.jsx';
import { Field, SwitchRow } from '../../components/ui.jsx';
import { useSchool } from '../../lib/store.jsx';

export default function AddFamily() {
  const { db, addFamily, toast } = useSchool();
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', phone: '', whatsapp: '', cnic: '', email: '', occupation: '', mother: '', motherCnic: '', address: '', note: '' });
  const [same, setSame] = useState(true);
  const [more, setMore] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const dup = f.phone.replace(/\D/g, '').length > 6 && db.families.find((x) => x.phone.replace(/\D/g, '').endsWith(f.phone.replace(/\D/g, '').slice(-7)));
  // Same required fields as the live form: guardian, phone, CNIC and email.
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim());
  const ok = f.name.trim() && f.phone.trim() && f.cnic.trim() && emailOk;

  const save = (thenChild) => {
    const id = addFamily({ ...f, whatsapp: same ? f.phone : f.whatsapp });
    toast(`${f.name} family created`);
    nav(thenChild ? `/students/new?family=${id}` : `/students/families/${id}`);
  };

  return (
    <div className="page" style={{ maxWidth: 860 }}>
      <BackBar to="/students/families" label="Families" />
      <div>
        <div className="eyebrow">A family groups siblings under one guardian for fees and messages</div>
        <h1 className="h1 sm" style={{ marginTop: 4 }}>New family</h1>
      </div>
      <section className="card col gap-16" style={{ padding: 28 }}>
        <div className="form-grid">
          <Field label="Guardian / father name"><input className="input" autoFocus value={f.name} onChange={set('name')} /></Field>
          <Field label="Phone"><input className="input" value={f.phone} onChange={set('phone')} placeholder="03XX XXXXXXX" /></Field>
        </div>
        {dup && <div className="banner info"><Icon name="family" size={18} /><span className="grow small">{dup.name} ({dup.id}) already uses this number.</span><Link className="btn xs" to={`/students/families/${dup.id}`}>Open family</Link></div>}
        <SwitchRow on={same} onChange={setSame} title="WhatsApp is the same number" sub="Used for receipts, reminders and attendance alerts" />
        <div className="form-grid">
          {!same && <Field label="WhatsApp number"><input className="input" value={f.whatsapp} onChange={set('whatsapp')} /></Field>}
          <Field label="Guardian CNIC"><input className="input" value={f.cnic} onChange={set('cnic')} placeholder="00000-0000000-0" /></Field>
          <Field label="Email" hint={f.email && !emailOk ? 'Enter a valid email' : 'For receipts and the parent app login'}><input className="input" type="email" value={f.email} onChange={set('email')} placeholder="parent@example.com" /></Field>
        </div>
        <button className="link small" style={{ alignSelf: 'flex-start' }} onClick={() => setMore(!more)}>{more ? '− Fewer details' : '+ Mother, occupation, address and documents'}</button>
        {more && (
          <div className="form-grid">
            <Field label="Mother's name" optional><input className="input" value={f.mother} onChange={set('mother')} /></Field>
            <Field label="Mother's CNIC" optional><input className="input" value={f.motherCnic} onChange={set('motherCnic')} /></Field>
            <Field label="Occupation" optional><input className="input" value={f.occupation} onChange={set('occupation')} /></Field>
            <Field label="Address" optional span><input className="input" value={f.address} onChange={set('address')} /></Field>
            <div className="dropzone"><Icon name="idcard" size={18} />CNIC front</div>
            <div className="dropzone"><Icon name="idcard" size={18} />CNIC back</div>
          </div>
        )}
        <div className="row between wrap" style={{ paddingTop: 20, borderTop: '1px solid var(--line)' }}>
          <Link className="btn ghost" to="/students/families">Cancel</Link>
          <div className="row gap-8">
            <button className="btn" disabled={!ok} onClick={() => save(false)}>Save family</button>
            <button className="btn primary" disabled={!ok} onClick={() => save(true)}>Save & add a child<Icon name="arrowRight" size={15} /></button>
          </div>
        </div>
      </section>
    </div>
  );
}
