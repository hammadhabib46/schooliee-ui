import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import { BackBar } from '../../components/Profile.jsx';
import { Field, Seg } from '../../components/ui.jsx';
import { useSchool } from '../../lib/store.jsx';
import { cx, fmt } from '../../lib/format.js';

const ROLES = ['Teacher', 'Principal', 'Accountant', 'Admin', 'Driver', 'Guard', 'Cleaner', 'Other'];

export default function AddStaff() {
  const { addStaff, toast } = useSchool();
  const nav = useNavigate();
  const [v, setV] = useState({ name: '', father: '', phone: '', whatsapp: '', cnic: '', role: 'Teacher', subject: '', pay: '', joined: '2026-10-09', payFrom: '2026-10-09', email: '', address: '', note: '' });
  const [same, setSame] = useState('same');
  const [more, setMore] = useState(false);
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  const ok = v.name && v.phone && Number(v.pay);
  const save = () => {
    const id = addStaff({ ...v, pay: Number(v.pay), whatsapp: same === 'same' ? v.phone : v.whatsapp, type: v.role === 'Teacher' ? 'teacher' : 'other' });
    toast(`${v.name} added to staff`);
    nav(`/staff/${id}`);
  };
  return (
    <div className="page" style={{ maxWidth: 900 }}>
      <BackBar to="/staff" label="Staff" />
      <h1 className="h1 sm">New staff member</h1>
      <section className="card col gap-16" style={{ padding: 28 }}>
        <div className="col gap-8">
          <span className="label">Role</span>
          <div className="row wrap gap-8">{ROLES.map((r) => <button key={r} className={cx('chip sm', v.role === r && 'on')} onClick={() => setV({ ...v, role: r })}>{r}</button>)}</div>
        </div>
        <div className="form-grid">
          <Field label="Full name"><input className="input" autoFocus value={v.name} onChange={set('name')} /></Field>
          <Field label="Father name" optional><input className="input" value={v.father} onChange={set('father')} /></Field>
          <Field label="Phone"><input className="input" value={v.phone} onChange={set('phone')} /></Field>
          <Field label="WhatsApp"><Seg ink lg value={same} onChange={setSame} items={[{ key: 'same', label: 'Same as phone' }, { key: 'other', label: 'Different' }]} /></Field>
          {same === 'other' && <Field label="WhatsApp number"><input className="input" value={v.whatsapp} onChange={set('whatsapp')} /></Field>}
          <Field label="CNIC"><input className="input" value={v.cnic} onChange={set('cnic')} placeholder="00000-0000000-0" /></Field>
          {v.role === 'Teacher' && <Field label="Subject"><input className="input" value={v.subject} onChange={set('subject')} placeholder="e.g. Mathematics" /></Field>}
        </div>
        <div className="divider" />
        <div className="form-grid">
          <Field label="Monthly pay (PKR)" hint={Number(v.pay) ? `${fmt(v.pay)} PKR a month · ${fmt(Number(v.pay) * 12)} a year` : null}><input className="input big" inputMode="numeric" value={v.pay} onChange={(e) => setV({ ...v, pay: e.target.value.replace(/\D/g, '') })} placeholder="0" /></Field>
          <Field label="Pay starts from"><input className="input" type="date" value={v.payFrom} onChange={set('payFrom')} /></Field>
        </div>
        <button className="link small" style={{ alignSelf: 'flex-start' }} onClick={() => setMore(!more)}>{more ? '− Fewer details' : '+ Joining date, email, address and documents'}</button>
        {more && (
          <div className="form-grid">
            <Field label="Joining date" optional><input className="input" type="date" value={v.joined} onChange={set('joined')} /></Field>
            <Field label="Email" optional><input className="input" value={v.email} onChange={set('email')} /></Field>
            <Field label="Address" optional span><input className="input" value={v.address} onChange={set('address')} /></Field>
            <Field label="Note" optional span><textarea className="textarea" value={v.note} onChange={set('note')} /></Field>
            <div className="dropzone"><Icon name="image" size={18} />Photo</div>
            <div className="dropzone"><Icon name="doc" size={18} />CNIC, degree, contract</div>
          </div>
        )}
        <div className="row between" style={{ paddingTop: 20, borderTop: '1px solid var(--line)' }}>
          <Link className="btn ghost" to="/staff">Cancel</Link>
          <button className="btn primary" disabled={!ok} onClick={save}><Icon name="check" size={15} stroke={2.4} />Add staff member</button>
        </div>
      </section>
    </div>
  );
}
