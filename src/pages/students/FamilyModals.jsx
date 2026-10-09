import { useState } from 'react';
import Icon from '../../components/Icon.jsx';
import { Field, Modal } from '../../components/ui.jsx';
import { useSchool } from '../../lib/store.jsx';
import { cx, fmt } from '../../lib/format.js';

export function EditFamily({ f, onClose }) {
  const { updateFamily, toast } = useSchool();
  const [v, setV] = useState(f);
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  return (
    <Modal open onClose={onClose} title="Edit family" sub={f.id} wide footer={<><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" onClick={() => { updateFamily(f.id, v); toast('Family updated'); onClose(); }}>Save</button></>}>
      <div className="upper">Father / guardian</div>
      <div className="form-grid">
        {[['name', 'Name'], ['cnic', 'CNIC'], ['occupation', 'Occupation'], ['caste', 'Caste']].map(([k, l]) => <Field key={k} label={l}><input className="input" value={v[k] || ''} onChange={set(k)} /></Field>)}
      </div>
      <div className="upper">Mother</div>
      <div className="form-grid">
        {[['mother', 'Name'], ['motherCnic', 'CNIC'], ['motherOccupation', 'Occupation']].map(([k, l]) => <Field key={k} label={l} optional><input className="input" value={v[k] || ''} onChange={set(k)} /></Field>)}
      </div>
      <div className="upper">Contact</div>
      <div className="form-grid">
        {[['phone', 'Phone'], ['whatsapp', 'WhatsApp'], ['email', 'Email'], ['address', 'Address']].map(([k, l]) => <Field key={k} label={l}><input className="input" value={v[k] || ''} onChange={(e) => setV({ ...v, [k]: e.target.value, ...(k === 'whatsapp' && e.target.value !== f.whatsapp ? { waVerified: false } : {}) })} /></Field>)}
      </div>
      {v.whatsapp !== f.whatsapp && <div className="banner warn small"><Icon name="whatsapp" size={16} />Changing the WhatsApp number needs re-verification before messages are sent.</div>}
    </Modal>
  );
}

export function CreditModal({ f, onClose }) {
  const { addCredit, toast } = useSchool();
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('Advance payment');
  const [method, setMethod] = useState('Cash');
  return (
    <Modal open onClose={onClose} title="Add credit" sub={`${f.name} family · current credit ${fmt(f.credit)} PKR`}
      footer={<><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" disabled={!Number(amount)} onClick={() => { addCredit(f.id, { amount, reason, method }); toast(`${fmt(amount)} PKR added to ${f.name}'s balance`); onClose(); }}>Add {amount ? fmt(amount) : ''} PKR</button></>}>
      <Field label="Amount (PKR)"><input className="input big" autoFocus inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))} placeholder="0" /></Field>
      <div className="row wrap gap-8">{['Advance payment', 'Overpayment', 'Refund adjustment', 'Scholarship'].map((r) => <button key={r} className={cx('chip sm', reason === r && 'on')} onClick={() => setReason(r)}>{r}</button>)}</div>
      <div className="row wrap gap-8">{['Cash', 'Online transfer'].map((m) => <button key={m} className={cx('chip sm', method === m && 'on')} onClick={() => setMethod(m)}>{m}</button>)}</div>
      <label className="dropzone" style={{ cursor: 'pointer' }}><Icon name="paperclip" size={18} />Attach a receipt <span className="xs faint">optional</span><input type="file" hidden /></label>
      <div className="small muted">Credit is used automatically on the next challan.</div>
    </Modal>
  );
}
