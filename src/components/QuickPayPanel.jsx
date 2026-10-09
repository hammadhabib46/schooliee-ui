import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon.jsx';
import { OnOff } from './Bento.jsx';
import { useSchool } from '../lib/store.jsx';
import { cx, fmt } from '../lib/format.js';
import { printView } from '../lib/exporter.js';

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const idx = (m) => { const [a, y] = m.split(' '); return Number(y) * 12 + MON.indexOf(a.slice(0, 3)); };
const THIS_MONTH = 'Oct 2026';

// Quick pay as a side panel: amount, shortcuts, method, receipt — oldest dues
// settle first. "Open fee details" goes to the full fee page for anything more.
// Used inline beside the Fees / Families / Students lists, and inside a drawer elsewhere.
export default function QuickPayPanel({ familyId, studentId, onClose, bare = false }) {
  const { db, kidsOf, collectFees, toast } = useSchool();
  const nav = useNavigate();
  const fam = db.families.find((f) => f.id === familyId);
  const kids = kidsOf(familyId).filter((s) => !studentId || s.id === studentId);
  const lines = useMemo(() => kids.flatMap((s) => s.dues.map((d) => ({ s, d }))).sort((a, b) => idx(a.d.month) - idx(b.d.month)), [kids]);
  const max = lines.reduce((a, l) => a + l.d.amount, 0);
  const month = lines.filter((l) => l.d.month === THIS_MONTH).reduce((a, l) => a + l.d.amount, 0);
  const [amount, setAmountRaw] = useState(String(max));
  // Until the user types, the amount follows the full due (it can arrive a render late).
  const typed = useRef(false);
  const setAmount = (v) => { typed.current = true; setAmountRaw(v); };
  useEffect(() => { if (!typed.current) setAmountRaw(String(max)); }, [max]);
  const [method, setMethod] = useState('Cash');
  const [date, setDate] = useState('2026-10-09');
  const [note, setNote] = useState('');
  const [wa, setWa] = useState(true);
  const [more, setMore] = useState(false);
  const [showPlan, setShowPlan] = useState(false);
  const [done, setDone] = useState(null);
  if (!fam) return null;

  const amt = Math.min(Number(amount) || 0, max);
  let left = amt;
  const plan = lines.map((l) => { const pay = Math.max(0, Math.min(left, l.d.amount)); left -= pay; return { ...l, pay }; }).filter((l) => l.pay > 0);
  const who = studentId ? kids[0]?.name : `${fam.name} family`;
  const details = () => { nav(`/finance/fees/${familyId}${studentId ? `?student=${studentId}` : ''}`); onClose?.(); };
  const Wrap = bare ? 'div' : 'aside';

  const head = (kicker) => (
    <div className="qp-head">
      <div style={{ minWidth: 0 }}>
        <div className="small muted">{kicker}</div>
        <div className="qp-title">{who}</div>
        <div className="xs muted">{fam.id} · {fam.phone}{studentId ? ` · ${fam.name} family` : ''}</div>
      </div>
      {onClose && <button className="icon-btn" aria-label="Close" onClick={onClose}><Icon name="close" size={14} stroke={2} /></button>}
    </div>
  );

  if (done) {
    return (
      <Wrap className={cx(!bare && 'card panel quick-panel', 'qp')} aria-label="Payment received">
        {head('Payment received')}
        <div className="qp-done">
          <span className="circle lime" style={{ width: 48, height: 48 }}><Icon name="check" size={22} stroke={2.4} /></span>
          <div><div className="display" style={{ fontSize: 34 }}>{fmt(done.amount)} <span className="unit">PKR</span></div><div className="xs muted">Receipt {done.receipt} · {done.method}</div></div>
        </div>
        <div className="qp-plan">
          {done.plan.map((l) => <div key={l.s.id + l.d.id} className="row between small"><span>{kids.length > 1 ? `${l.s.name} · ` : ''}{l.d.label} <span className="muted">{l.d.month}</span></span><span className="strong">{fmt(l.pay)}</span></div>)}
        </div>
        <div className={cx('banner', done.left ? 'warn' : 'ok')}><Icon name={done.left ? 'clock' : 'check'} size={15} />{done.left ? `${fmt(done.left)} PKR still due.` : 'Everything is cleared.'}{done.wa ? ' Receipt sent on WhatsApp.' : ''}</div>
        <div className="row gap-8">
          <button className="btn grow" onClick={() => { printView(); toast('Receipt — choose Save as PDF', { icon: 'print' }); }}><Icon name="print" size={15} />Print receipt</button>
          <button className="btn primary grow" onClick={onClose}>Done</button>
        </div>
        <button className="qp-link" onClick={details}>Open fee details<Icon name="arrowRight" size={14} /></button>
      </Wrap>
    );
  }

  return (
    <Wrap className={cx(!bare && 'card panel quick-panel', 'qp')} aria-label={`Collect payment from ${who}`}>
      {head('Collect payment')}
      {max === 0 ? (
        <>
          <div className="banner ok"><Icon name="check" size={16} />Nothing is due right now.</div>
          <button className="btn" onClick={details}>Collect months ahead on the fee page<Icon name="arrowRight" size={14} /></button>
        </>
      ) : (<>
        <label className="qp-amount">
          <span className="xs muted">Amount (PKR)</span>
          <input className="display" inputMode="numeric" autoFocus value={amount ? Number(amount).toLocaleString('en-PK') : ''} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))} aria-label="Amount to collect" />
          {Number(amount) > max && <span className="xs danger-text">Only {fmt(max)} PKR is due — the rest can be kept as credit on the fee page.</span>}
        </label>
        <div className="qp-chips">
          <button className={cx('chip', amt === max && 'on')} onClick={() => setAmount(String(max))}>Full due · {fmt(max)}</button>
          {month > 0 && month !== max && <button className={cx('chip', amt === month && 'on')} onClick={() => setAmount(String(month))}>This month · {fmt(month)}</button>}
        </div>

        <div className="qp-plan">
          <button className="row between xs muted qp-plan-h" onClick={() => setShowPlan(!showPlan)} aria-expanded={showPlan}>
            <span>Settles oldest first · {plan.length} of {lines.length} charges</span><Icon name={showPlan ? 'chevUp' : 'chevDown'} size={13} />
          </button>
          {(showPlan ? plan : plan.slice(0, 3)).map((l) => (
            <div key={l.s.id + l.d.id} className="row between small">
              <span className="ellipsis">{kids.length > 1 ? `${l.s.name} · ` : ''}{l.d.label} <span className="muted">{l.d.month}</span></span>
              <span>{fmt(l.pay)}{l.pay < l.d.amount && <span className="xs muted"> of {fmt(l.d.amount)}</span>}</span>
            </div>
          ))}
          {!showPlan && plan.length > 3 && <button className="xs muted qp-more" onClick={() => setShowPlan(true)}>+ {plan.length - 3} more</button>}
          {!plan.length && <div className="small muted">Enter an amount.</div>}
        </div>

        <div>
          <div className="xs muted" style={{ marginBottom: 8 }}>Method</div>
          <div className="qp-chips">{['Cash', 'Online transfer'].map((m) => <button key={m} className={cx('chip', method === m && 'on')} onClick={() => setMethod(m)}>{m}</button>)}</div>
        </div>

        {more ? (
          <div className="col gap-8">
            <label className="col gap-4"><span className="xs muted">Payment date</span><input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
            <label className="col gap-4"><span className="xs muted">Note</span><input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note for this payment…" /></label>
          </div>
        ) : <button className="qp-link left" onClick={() => setMore(true)}><Icon name="plus" size={13} />Date or note</button>}

        {fam.waVerified ? (
          <div className="qp-wa"><div><div className="small medium">Send receipt on WhatsApp</div><div className="xs muted">{fam.whatsapp || fam.phone}</div></div><OnOff value={wa} onChange={setWa} /></div>
        ) : <div className="xs muted">WhatsApp isn’t verified for this family — print the receipt instead.</div>}

        <button className="btn primary lg qp-go" disabled={!amt} onClick={() => {
          const rcp = collectFees({ familyId, lines: plan.map((l) => ({ studentId: l.s.id, dueId: l.d.id, pay: l.pay })), method, date, note, sendReceipt: wa && fam.waVerified });
          toast(`${fmt(amt)} PKR received from ${who}`);
          setDone({ amount: amt, receipt: rcp, plan, method, left: max - amt, wa: wa && fam.waVerified });
        }}>Collect {fmt(amt)} PKR</button>
      </>)}
      <button className="qp-link" onClick={details}>Open fee details<Icon name="arrowRight" size={14} /></button>
    </Wrap>
  );
}
