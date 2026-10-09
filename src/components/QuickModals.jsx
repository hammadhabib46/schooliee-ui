import { useEffect, useState } from 'react';
import { Field, Modal } from './ui.jsx';
import { useSchool, code } from '../lib/store.jsx';
import { cx, fmt } from '../lib/format.js';

export function FineModal({ state, onClose }) {
  const { active, addFine, toast, classById } = useSchool();
  const [studentId, setStudentId] = useState('');
  const [label, setLabel] = useState('Late fee fine');
  const [amount, setAmount] = useState('200');
  useEffect(() => { if (state) { setStudentId(state.studentId || active[0]?.id); setLabel('Late fee fine'); setAmount('200'); } }, [state]); // eslint-disable-line
  if (!state) return null;
  return (
    <Modal open onClose={onClose} title="Add fine" sub="Added to the student's dues for October"
      footer={<><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" disabled={!Number(amount)} onClick={() => { addFine({ studentId, label, amount: Number(amount) }); toast(`Fine of ${fmt(amount)} PKR added`); onClose(); }}>Add fine</button></>}>
      <Field label="Student">
        <select aria-label="Student" className="select" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
          {active.map((s) => <option key={s.id} value={s.id}>{s.name} ({code(s)}) · {classById[s.classId]?.name}</option>)}
        </select>
      </Field>
      <div className="row wrap gap-8">
        {['Late fee fine', 'Absent fine', 'Uniform', 'Lost book'].map((l) => <button key={l} className={cx('chip sm', label === l && 'on')} onClick={() => setLabel(l)}>{l}</button>)}
      </div>
      <div className="form-grid">
        <Field label="Reason"><input className="input" value={label} onChange={(e) => setLabel(e.target.value)} /></Field>
        <Field label="Amount (PKR)"><input className="input" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))} /></Field>
      </div>
    </Modal>
  );
}

const IN_CATS = ['Donation', 'Canteen', 'Uniform sales', 'Book sales', 'Other income'];
const OUT_CATS = ['Utilities', 'Rent', 'Stationery', 'Maintenance', 'Transport', 'Events', 'Other expense'];

export function RecordModal({ state, onClose }) {
  const { db, recordLedger, toast } = useSchool();
  const [type, setType] = useState('out');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Utilities');
  const [reason, setReason] = useState('');
  const [method, setMethod] = useState('Cash');
  const [date, setDate] = useState('2026-10-09');
  useEffect(() => { if (state) { const t = state.type || 'out'; setType(t); setCategory(t === 'in' ? IN_CATS[0] : OUT_CATS[0]); setAmount(''); setReason(''); } }, [state]);
  if (!state) return null;
  const cats = type === 'in' ? IN_CATS : OUT_CATS;
  return (
    <Modal open onClose={onClose} title={type === 'in' ? 'Record income' : 'Record expense'} sub="Finance · cash book"
      footer={<><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" disabled={!Number(amount)} onClick={() => { recordLedger({ type, amount: Number(amount), category, reason: reason || category, method, ...(date !== '2026-10-09' ? { date: `${date}T12:00` } : {}) }); toast(`${type === 'in' ? 'Income' : 'Expense'} of ${fmt(amount)} PKR recorded`); onClose(); }}>Save</button></>}>
      <div className="seg ink lg" style={{ alignSelf: 'flex-start' }}>
        <button className={cx(type === 'out' && 'on')} onClick={() => { setType('out'); setCategory(OUT_CATS[0]); }}>Money out</button>
        <button className={cx(type === 'in' && 'on')} onClick={() => { setType('in'); setCategory(IN_CATS[0]); }}>Money in</button>
      </div>
      <Field label="Amount (PKR)"><input className="input big" autoFocus inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))} placeholder="0" /></Field>
      <div className="col gap-8">
        <span className="label">Category</span>
        <input className="input" list="ledger-cats" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Select or type a category" />
        <datalist id="ledger-cats">{[...new Set([...cats, ...db.ledger.filter((l) => l.type === type).map((l) => l.category)])].map((c) => <option key={c} value={c} />)}</datalist>
        <div className="row wrap gap-6">{cats.slice(0, 5).map((c) => <button key={c} className={cx('chip sm', category === c && 'on')} style={{ height: 28 }} onClick={() => setCategory(c)}>{c}</button>)}</div>
      </div>
      <div className="form-grid">
        <Field label="Description" optional><input className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. October electricity bill" /></Field>
        <Field label="Paid via">
          <select aria-label="Payment method" className="select" value={method} onChange={(e) => setMethod(e.target.value)}>{['Cash', 'Online transfer'].map((m) => <option key={m}>{m}</option>)}</select>
        </Field>
      </div>
      <Field label="Date"><input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      <label className="dropzone" style={{ cursor: 'pointer' }}>Attach a bill or receipt <span className="xs faint">optional · JPG, PNG or PDF</span><input type="file" hidden /></label>
    </Modal>
  );
}
