import { Fragment, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import { Circle, OnOff, PillGroup } from '../../components/Bento.jsx';
import { PageHead } from '../../components/Shell.jsx';
import { Avatar, Field, Modal } from '../../components/ui.jsx';
import { BatchPrintModal } from '../../components/ListDialogs.jsx';
import { useSchool } from '../../lib/store.jsx';
import { cx, dateShort, fmt } from '../../lib/format.js';
import { ADD_KINDS, CUT_KINDS, DEFAULT_POLICY, payslip } from '../../lib/payroll.js';
import { downloadCsv, printView } from '../../lib/exporter.js';
import { StaffTabs } from './StaffList.jsx';

const MONTH = '2026-10';
const MONTH_LABEL = 'October 2026';
const METHODS = ['Cash', 'Online transfer'];
const STATUS = { unpaid: ['Unpaid', 'warn'], partial: ['Part paid', 'info'], paid: ['Paid', 'ok'], held: ['On hold', 'outline'] };

export default function Payroll() {
  const { db, toast } = useSchool();
  const [view, setView] = useState('Pay run');
  const [dialog, setDialog] = useState(null);
  const policy = { ...DEFAULT_POLICY, ...(db.settings.payroll || {}) };
  const staff = db.staff.filter((s) => s.status === 'active');
  const run = db.payruns?.[MONTH] || {};
  const slips = useMemo(() => Object.fromEntries(staff.map((s) => [s.id, payslip(s, run[s.id], policy)])), [staff, run, policy]); // eslint-disable-line react-hooks/exhaustive-deps
  const unpaid = staff.filter((s) => slips[s.id].status === 'unpaid' || slips[s.id].status === 'partial');

  return (
    <div className="page">
      <StaffTabs />
      <PageHead title="Payroll" sub={`${MONTH_LABEL} · ${unpaid.length ? `${unpaid.length} of ${staff.length} still to pay` : 'everyone is paid'} · pay day ${policy.payDay}${['st', 'nd', 'rd'][policy.payDay - 1] || 'th'}`}
        actions={<div className="toolrow">
          <Circle icon="receipt" label="Salary slips" onClick={() => setDialog('slips')} />
          <Circle icon="download" label="Export pay sheet" onClick={() => { downloadCsv(`Payroll ${MONTH}`, [['Staff', 'Role', 'Gross', 'Deductions', 'Net', 'Paid', 'Status'], ...staff.map((s) => [s.name, s.role, slips[s.id].gross, slips[s.id].deductions, slips[s.id].net, slips[s.id].paid, slips[s.id].status])]); toast('Pay sheet exported', { icon: 'download' }); }} />
          <Circle icon="sliders" label="Payroll rules" onClick={() => setDialog('rules')} />
        </div>} />

      <PillGroup value={view} onChange={setView} items={['Pay run', 'History', 'Loans']} />

      {view === 'Pay run' && <PayRun staff={staff} slips={slips} policy={policy} />}
      {view === 'History' && <History staff={staff} />}
      {view === 'Loans' && <Advances staff={staff} />}

      {dialog === 'slips' && <BatchPrintModal kind="slips" onClose={() => setDialog(null)} />}
      {dialog === 'rules' && <RulesModal policy={policy} onClose={() => setDialog(null)} />}
    </div>
  );
}

function PayRun({ staff, slips, policy }) {
  const { payrunUpdate, payrunAddLine, payrunPay, toast } = useSchool();
  const payable = staff.filter((s) => slips[s.id].remaining > 0 && !slips[s.id].hold);
  const [sel, setSel] = useState(() => Object.fromEntries(payable.map((s) => [s.id, true])));
  const [open, setOpen] = useState(null);
  const [payNow, setPayNow] = useState({});
  const [method, setMethod] = useState('Cash');
  const [date, setDate] = useState('2026-10-09');
  const [note, setNote] = useState('');
  const [bulk, setBulk] = useState({ kind: '+Bonus', label: 'Eid bonus', amount: '', unit: 'pkr' });
  const [done, setDone] = useState(null);

  const chosen = payable.filter((s) => sel[s.id]);
  const nowFor = (s) => Math.min(Number(payNow[s.id] ?? slips[s.id].remaining) || 0, slips[s.id].remaining);
  const total = chosen.reduce((a, s) => a + nowFor(s), 0);
  const totals = staff.reduce((a, s) => ({ gross: a.gross + slips[s.id].gross, cuts: a.cuts + slips[s.id].deductions, net: a.net + slips[s.id].net, paid: a.paid + slips[s.id].paid }), { gross: 0, cuts: 0, net: 0, paid: 0 });
  const selectedIds = staff.filter((s) => sel[s.id]).map((s) => s.id);

  const pay = () => {
    payrunPay(MONTH, chosen.map((s) => ({ staffId: s.id, amount: nowFor(s), slip: slips[s.id] })), method, date, note);
    setDone({ total, count: chosen.length, partial: chosen.filter((s) => nowFor(s) < slips[s.id].remaining).length });
    toast(`Paid ${fmt(total)} PKR to ${chosen.length} staff · slips sent on WhatsApp`);
    setSel({}); setPayNow({}); setNote('');
  };

  return (
    <div className="payroll-grid">
      <div className="col gap-12" style={{ minWidth: 0 }}>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
          {[['Gross salaries', totals.gross], ['Deductions', -totals.cuts], ['Net payable', totals.net], ['Paid so far', totals.paid]].map(([k, v]) => <div key={k} className="tile"><div className="k">{k}</div><div className="v">{v < 0 ? `− ${fmt(-v)}` : fmt(v)} <span className="xs muted">PKR</span></div></div>)}
        </div>

        {selectedIds.length > 0 && (
          <div className="bulk-line">
            <span className="small medium nowrap">Add to {selectedIds.length} selected</span>
            <select className="select" value={bulk.kind} onChange={(e) => setBulk({ ...bulk, kind: e.target.value, label: e.target.value === '+Bonus' ? 'Eid bonus' : e.target.value.slice(1) })} aria-label="Line type">{[...ADD_KINDS.map((k) => `+${k}`), ...CUT_KINDS.map((k) => `−${k}`)].map((k) => <option key={k} value={k}>{k[0] === '+' ? '+ ' : '− '}{k.slice(1)}</option>)}</select>
            <input className="input" style={{ height: 40, flex: '1 1 140px' }} value={bulk.label} onChange={(e) => setBulk({ ...bulk, label: e.target.value })} placeholder="Label on payslip" aria-label="Label" />
            <input className="input" style={{ height: 40, width: 110 }} inputMode="numeric" value={bulk.amount} onChange={(e) => setBulk({ ...bulk, amount: e.target.value.replace(/\D/g, '') })} placeholder="Amount" aria-label="Amount" />
            <div className="onoff sm"><button className={cx(bulk.unit === 'pkr' && 'on')} onClick={() => setBulk({ ...bulk, unit: 'pkr' })}>PKR</button><button className={cx(bulk.unit === 'pct' && 'on')} onClick={() => setBulk({ ...bulk, unit: 'pct' })}>% salary</button></div>
            <button className="btn sm" disabled={!Number(bulk.amount) || !bulk.label.trim()} onClick={() => {
              const isCut = bulk.kind.startsWith('−');
              payrunAddLine(MONTH, selectedIds, isCut ? 'cuts' : 'adds', { label: bulk.label, kind: bulk.kind.slice(1), amount: bulk.unit === 'pkr' ? Number(bulk.amount) : 0, percent: bulk.unit === 'pct' ? Number(bulk.amount) : 0, note: bulk.unit === 'pct' ? `${bulk.amount}% of salary` : '' });
              toast(`${bulk.label} added to ${selectedIds.length} payslip${selectedIds.length > 1 ? 's' : ''}`); setBulk({ ...bulk, amount: '' });
            }}>Add</button>
          </div>
        )}

        <section className="widget" style={{ padding: 6 }}>
          <div className="pay-row pay-head">
            <input type="checkbox" className="check" aria-label="Select all" checked={payable.length > 0 && payable.every((s) => sel[s.id])} onChange={(e) => setSel(e.target.checked ? Object.fromEntries(payable.map((s) => [s.id, true])) : {})} />
            <span>Staff</span><span className="hide-md">This month</span><span className="num hide-md">Gross</span><span className="num hide-sm">Deductions</span><span className="num net-col">Net</span><span>Status</span><span />
          </div>
          {staff.map((s) => {
            const p = slips[s.id];
            const isOpen = open === s.id;
            const canPay = p.remaining > 0 && !p.hold;
            return (
              <Fragment key={s.id}>
                <div className={cx('pay-row', isOpen && 'open', sel[s.id] && 'on')} onClick={() => setOpen(isOpen ? null : s.id)}>
                  <input type="checkbox" className="check" disabled={!canPay} checked={!!sel[s.id] && canPay} onClick={(e) => e.stopPropagation()} onChange={() => setSel({ ...sel, [s.id]: !sel[s.id] })} aria-label={`Select ${s.name}`} />
                  <span className="person"><Avatar name={s.name} id={s.id} size={36} /><span><Link to={`/staff/${s.id}`} className="nm" onClick={(e) => e.stopPropagation()}>{s.name}</Link><span className="id">{s.role}<span className="net-inline"> · {fmt(p.net)} PKR</span></span></span></span>
                  <span className="row gap-4 hide-md">{['P', 'L', 'A', 'V'].filter((k) => s.att?.[k]).map((k) => <span key={k} className={`pill ${{ P: 'ok', L: 'warn', A: 'danger', V: 'info' }[k]}`} style={{ height: 22 }}>{s.att[k]}{k}</span>)}</span>
                  <span className="num hide-md">{fmt(p.gross)}</span>
                  <span className="num hide-sm" style={{ color: p.deductions ? 'var(--danger)' : 'var(--muted)' }}>{p.deductions ? `− ${fmt(p.deductions)}` : '—'}</span>
                  <span className="num strong net-col">{fmt(p.net)}</span>
                  <span><span className={`pill ${STATUS[p.status][1]}`}>{STATUS[p.status][0]}{p.status === 'partial' ? ` · ${fmt(p.remaining)} left` : ''}</span></span>
                  <Icon name={isOpen ? 'chevUp' : 'chevDown'} size={16} />
                </div>
                {isOpen && <SlipEditor s={s} p={p} policy={policy} payNow={payNow[s.id]} setPayNow={(v) => setPayNow({ ...payNow, [s.id]: v })} onUpdate={(patch) => payrunUpdate(MONTH, s.id, patch)} />}
              </Fragment>
            );
          })}
        </section>
      </div>

      <aside className="payroll-side">
        <section className="hero-panel collect-checkout">
          {done ? (
            <>
              <span className="circle lime" style={{ width: 52, height: 52 }}><Icon name="check" size={24} stroke={2.4} /></span>
              <div className="display" style={{ fontSize: 40, marginTop: 14 }}>{fmt(done.total)}<span className="unit"> PKR</span></div>
              <div className="small" style={{ color: 'var(--hero-muted)' }}>Paid to {done.count} staff for {MONTH_LABEL}{done.partial ? ` · ${done.partial} part payment${done.partial > 1 ? 's' : ''} — the rest stays due` : ''}</div>
              <div className="small mt-8" style={{ color: 'var(--hero-muted)' }}>Recorded in Finance → Transactions as salary expense. Payslips sent on WhatsApp.</div>
              <div className="col gap-8 mt-16">
                <button className="btn accent block" onClick={() => { printView(); toast('Payslips — choose Save as PDF', { icon: 'print' }); }}><Icon name="print" size={15} />Print payslips</button>
                <button className="btn ghost block on-hero" onClick={() => setDone(null)}>Back to pay run</button>
              </div>
            </>
          ) : (
            <>
              <div className="row between"><span className="small" style={{ color: 'var(--hero-muted)' }}>Pay {MONTH_LABEL}</span><span className="xs" style={{ color: 'var(--hero-muted)' }}>{chosen.length} selected</span></div>
              <div className="display" style={{ fontSize: 46, marginTop: 6, color: 'var(--hero-accent)' }}>{fmt(total)}<span className="unit" style={{ color: 'var(--hero-muted)' }}> PKR</span></div>
              <div className="checkout-rows">
                {chosen.map((s) => <div key={s.id}><span>{s.name}{nowFor(s) < slips[s.id].remaining ? ' · part' : ''}</span><span>{fmt(nowFor(s))}</span></div>)}
                {!chosen.length && <div><span>Select staff to pay</span><span /></div>}
              </div>
              <div className="hero-methods">{METHODS.map((m) => <button key={m} className={cx(method === m && 'on')} onClick={() => setMethod(m)}>{m}</button>)}</div>
              
              <label className="hero-field"><span>Payment date</span><input className="hero-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
              <label className="hero-field"><span>Note · optional</span><input className="hero-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Paid before Eid" /></label>
              <button className="btn accent block mt-16" style={{ height: 52, fontSize: 15 }} disabled={!chosen.length || !total} onClick={pay}>Pay {chosen.length} staff · {fmt(total)} PKR</button>
              <div className="xs mt-12" style={{ color: 'var(--hero-muted)', textAlign: 'center' }}>Open a row to change pay, excuse a cut or pay part now</div>
            </>
          )}
        </section>
      </aside>
    </div>
  );
}

function SlipEditor({ s, p, policy, payNow, setPayNow, onUpdate }) {
  const { toast } = useSchool();
  const [addE, setAddE] = useState({ kind: 'Bonus', label: '', amount: '' });
  const [addC, setAddC] = useState({ kind: 'Fine', label: '', amount: '' });
  const line = (l, kind) => (
    <div key={l.key} className={cx('slip-line', l.waived && 'waived')}>
      <span className="grow" style={{ minWidth: 0 }}>
        <span className="medium small">{l.label}</span>
        <span className="xs muted" style={{ display: 'block' }}>{l.why || l.note || (l.fixed ? 'From salary structure' : l.kind || '')}{l.waived ? ' · excused' : ''}</span>
      </span>
      <span className={cx('small strong nowrap', kind === 'cuts' && !l.waived && 'danger-text')}>{kind === 'cuts' ? '− ' : '+ '}{fmt(l.amount)}</span>
      {l.waivable && <button className="btn xs ghost" onClick={() => onUpdate((cur) => ({ waived: { ...(cur.waived || {}), [l.key]: !l.waived } }))}>{l.waived ? 'Apply' : 'Excuse'}</button>}
      {!l.fixed && !l.auto && <Circle icon="close" size="xs" iconSize={11} label="Remove line" onClick={() => onUpdate((cur) => ({ [kind]: (cur[kind] || []).filter((x) => x.id !== l.key) }))} />}
    </div>
  );
  const addForm = (v, setV, kinds, kind) => (
    <form className="row gap-6 mt-8" onSubmit={(e) => { e.preventDefault(); if (!Number(v.amount)) return; onUpdate((cur) => ({ [kind]: [...(cur[kind] || []), { id: `m${Date.now()}`, kind: v.kind, label: v.label || v.kind, amount: Number(v.amount) }] })); setV({ ...v, label: '', amount: '' }); toast(`${v.label || v.kind} added to ${s.name}'s payslip`); }}>
      <select className="select" style={{ height: 36 }} value={v.kind} onChange={(e) => setV({ ...v, kind: e.target.value })} aria-label="Type">{kinds.map((k) => <option key={k}>{k}</option>)}</select>
      <input className="input" style={{ height: 36, flex: 1, minWidth: 80 }} placeholder="Reason" value={v.label} onChange={(e) => setV({ ...v, label: e.target.value })} />
      <input className="input" style={{ height: 36, width: 90 }} inputMode="numeric" placeholder="PKR" value={v.amount} onChange={(e) => setV({ ...v, amount: e.target.value.replace(/\D/g, '') })} />
      <Circle icon="plus" size="xs" iconSize={12} label="Add" type="submit" />
    </form>
  );
  return (
    <div className="slip-editor">
      <div className="slip-cols">
        <div>
          <div className="upper">Earnings · {fmt(p.gross)}</div>
          {p.earnings.map((l) => line(l, 'adds'))}
          {addForm(addE, setAddE, ADD_KINDS, 'adds')}
        </div>
        <div>
          <div className="upper">Deductions · {fmt(p.deductions)}</div>
          {p.cuts.map((l) => line(l, 'cuts'))}
          {!p.cuts.length && <div className="xs muted" style={{ padding: '8px 0' }}>No deductions this month.</div>}
          {addForm(addC, setAddC, CUT_KINDS, 'cuts')}
          <div className="xs muted mt-8">Per day {fmt(p.perDay)} = salary ÷ {policy.workingDays} working days. Change in Payroll rules.</div>
        </div>
      </div>
      <div className="slip-foot">
        <span className="row gap-8 small">Hold this salary <OnOff value={p.hold} onChange={(v) => onUpdate({ hold: v })} /></span>
        {p.remaining > 0 && !p.hold && <label className="row gap-8 small">Pay now <input className="input" style={{ height: 36, width: 120, textAlign: 'right' }} inputMode="numeric" value={payNow ?? String(p.remaining)} onChange={(e) => setPayNow(e.target.value.replace(/\D/g, ''))} aria-label={`Pay now for ${s.name}`} /><span className="xs muted">of {fmt(p.remaining)}</span></label>}
        {p.paid > 0 && <span className="xs muted">Paid {fmt(p.paid)} so far</span>}
        <div className="grow" />
        <span className="small">Net <b>{fmt(p.net)} PKR</b></span>
        <button className="btn sm ghost" onClick={() => { printView(); toast(`${s.name}'s payslip — choose Save as PDF`, { icon: 'print' }); }}><Icon name="print" size={14} />Payslip</button>
      </div>
    </div>
  );
}

function History({ staff }) {
  const months = useMemo(() => {
    const m = {};
    staff.forEach((s) => (s.salaryHistory || []).forEach((h) => { (m[h.month] = m[h.month] || []).push({ s, ...h }); }));
    return Object.entries(m).sort((a, b) => b[0].localeCompare(a[0]));
  }, [staff]);
  const [open, setOpen] = useState(months[0]?.[0]);
  const label = (k) => new Date(`${k}-01`).toLocaleString('en', { month: 'long', year: 'numeric' });
  return (
    <section className="widget" style={{ padding: 6 }}>
      {months.map(([k, rows]) => (
        <Fragment key={k}>
          <button className={cx('pay-row', open === k && 'open')} style={{ gridTemplateColumns: '1fr auto auto 24px' }} onClick={() => setOpen(open === k ? null : k)}>
            <span className="medium">{label(k)}</span><span className="small muted">{rows.length} staff</span><span className="strong">{fmt(rows.reduce((a, r) => a + r.amount, 0))} PKR</span><Icon name={open === k ? 'chevUp' : 'chevDown'} size={16} />
          </button>
          {open === k && <div className="slip-editor">{rows.map((r) => <div key={r.s.id} className="slip-line"><Avatar name={r.s.name} id={r.s.id} size={28} /><span className="grow small medium">{r.s.name}</span><span className="xs muted">{dateShort(r.date)}</span><span className="small strong">{fmt(r.amount)}</span>{r.amount < r.s.pay && <span className="pill warn" style={{ height: 20, fontSize: 10 }}>{fmt(r.s.pay - r.amount)} less than salary</span>}</div>)}</div>}
        </Fragment>
      ))}
    </section>
  );
}

function Advances({ staff }) {
  const { giveAdvance, issueLoan, repayLoan, toast } = useSchool();
  const [modal, setModal] = useState(null);
  const [v, setV] = useState({ amount: '', method: 'Cash', date: '2026-10-09', reason: '', months: '5' });
  const openModal = (kind, s) => { setV({ amount: '', method: 'Cash', date: '2026-10-09', reason: '', months: '5' }); setModal({ kind, s }); };
  return (
    <>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
        {staff.map((s) => (
          <section key={s.id} className="widget">
            <div className="widget-head"><Avatar name={s.name} id={s.id} size={36} /><span className="grow"><Link to={`/staff/${s.id}`} className="medium">{s.name}</Link><span className="xs muted" style={{ display: 'block' }}>{s.role} · {fmt(s.pay)} PKR/month</span></span></div>
            <div className="widget-body col gap-8">
              <div className="row between small"><span>Loan</span><span className="strong">{s.loan ? `${fmt(s.loan)} PKR` : '—'}</span></div>
              {s.loan > 0 && <div className="xs muted">{fmt(s.loanDeduction || 0)} cut each month</div>}
              <div className="row gap-6 wrap mt-4">
                <button className="btn sm" onClick={() => openModal('loan', s)}>Issue loan</button>
                {s.loan > 0 && <button className="btn sm ghost" onClick={() => openModal('repay', s)}>Repay</button>}
              </div>
            </div>
          </section>
        ))}
      </div>
      {modal && (
        <Modal open onClose={() => setModal(null)} title={{ advance: 'Give salary advance', loan: 'Issue loan', repay: 'Loan repayment' }[modal.kind]} sub={`${modal.s.name} · ${fmt(modal.s.pay)} PKR/month`}
          footer={<><button className="btn ghost" onClick={() => setModal(null)}>Cancel</button><button className="btn primary" disabled={!Number(v.amount)} onClick={() => {
            if (modal.kind === 'advance') { giveAdvance(modal.s.id, v); toast(`${fmt(v.amount)} PKR advance given · recovered from ${MONTH_LABEL} salary`); }
            if (modal.kind === 'loan') { issueLoan(modal.s.id, { amount: Number(v.amount), reason: v.reason, months: Number(v.months) || 1 }); toast(`Loan of ${fmt(v.amount)} PKR issued`); }
            if (modal.kind === 'repay') { repayLoan(modal.s.id, Number(v.amount)); toast(`${fmt(v.amount)} PKR repaid`); }
            setModal(null);
          }}>{modal.kind === 'advance' ? 'Give advance' : modal.kind === 'loan' ? 'Issue loan' : 'Record repayment'}</button></>}>
          <Field label="Amount (PKR)"><input className="input big" autoFocus inputMode="numeric" value={v.amount} onChange={(e) => setV({ ...v, amount: e.target.value.replace(/\D/g, '') })} placeholder="0" /></Field>
          {modal.kind === 'advance' && Number(v.amount) > modal.s.pay && <div className="banner warn"><Icon name="warn" size={16} />More than one month's salary — consider a loan with instalments instead.</div>}
          <div className="form-grid">
            {modal.kind === 'loan' && <Field label="Repay over (months)" hint={Number(v.amount) ? `${fmt(Math.ceil(Number(v.amount) / (Number(v.months) || 1)))} cut each month` : ''}><input className="input" inputMode="numeric" value={v.months} onChange={(e) => setV({ ...v, months: e.target.value.replace(/\D/g, '') })} /></Field>}
            <Field label="Paid via"><select className="select" value={v.method} onChange={(e) => setV({ ...v, method: e.target.value })}>{METHODS.map((m) => <option key={m}>{m}</option>)}</select></Field>
            <Field label="Date"><input className="input" type="date" value={v.date} onChange={(e) => setV({ ...v, date: e.target.value })} /></Field>
            <Field label="Reason" optional span><input className="input" value={v.reason} onChange={(e) => setV({ ...v, reason: e.target.value })} /></Field>
          </div>
        </Modal>
      )}
    </>
  );
}

function RulesModal({ policy, onClose }) {
  const { db, updateSettings, toast } = useSchool();
  const [v, setV] = useState(policy);
  const num = (k) => (e) => setV({ ...v, [k]: Number(e.target.value.replace(/\D/g, '')) || 0 });
  return (
    <Modal open onClose={onClose} title="Payroll rules" sub="How attendance turns into salary cuts"
      footer={<><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" onClick={() => { updateSettings({ payroll: v }); toast('Payroll rules saved · pay run recalculated'); onClose(); }}>Save rules</button></>}>
      <div className="row between" style={{ padding: '10px 14px', borderRadius: 16, background: 'var(--surface-2)' }}><span><span className="medium" style={{ display: 'block' }}>Cut salary for absent days</span><span className="xs muted">You can still excuse a day on any payslip</span></span><OnOff value={v.cutAbsent} onChange={(x) => setV({ ...v, cutAbsent: x })} /></div>
      <div className="form-grid">
        <Field label="Working days in a month" hint={`Per-day rate = salary ÷ ${v.workingDays || 1}`}><input className="input" inputMode="numeric" value={v.workingDays} onChange={num('workingDays')} /></Field>
        <Field label="Lates that count as one absent" hint="0 = never cut for lates"><input className="input" inputMode="numeric" value={v.latesPerAbsent} onChange={num('latesPerAbsent')} /></Field>
        <Field label="Paid leave days per month" hint="Leave beyond this is cut"><input className="input" inputMode="numeric" value={v.paidLeaves} onChange={num('paidLeaves')} /></Field>
        <Field label="Pay day" hint="Day of the month salaries are due"><input className="input" inputMode="numeric" value={v.payDay} onChange={num('payDay')} /></Field>
      </div>
      <div className="xs muted">Example: {db.staff[0]?.name} earns {fmt(db.staff[0]?.pay)} → {fmt(Math.round((db.staff[0]?.pay || 0) / (v.workingDays || 1)))} per day.</div>
    </Modal>
  );
}
