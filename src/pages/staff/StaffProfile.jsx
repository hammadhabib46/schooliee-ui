import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import { Circle } from '../../components/Bento.jsx';
import { Field, Modal } from '../../components/ui.jsx';
import { useSchool } from '../../lib/store.jsx';
import { avClass, cx, dateShort, fmt, initials, relative } from '../../lib/format.js';
import { historyFor, Row } from '../students/StudentProfile.jsx';
import { periods } from '../../data/seed.js';
import NotFound from '../NotFound.jsx';
import { exportCsv, printView } from '../../lib/exporter.js';
import { payslip, salaryOf } from '../../lib/payroll.js';

const ATT = { P: ['Present', 'ok'], L: ['Late', 'warn'], A: ['Absent', 'danger'], V: ['Leave', 'info'] };
const soft = (t) => (t === 'ok' ? 'var(--accent-soft)' : `var(--${t}-soft)`);
const fg = (t) => (t === 'ok' ? 'var(--accent-text)' : `var(--${t})`);
const monthLabel = (k) => dateShort(`${k}-01`).slice(3);

export default function StaffProfile() {
  const { id } = useParams();
  const nav = useNavigate();
  const { db, classById, toast, updateStaff, repayLoan } = useSchool();
  const [view, setView] = useState('Salary history');
  const [modal, setModal] = useState(null);
  const [q, setQ] = useState('');
  const [range, setRange] = useState('all');
  const [termDate, setTermDate] = useState('2026-10-09');
  const s = db.staff.find((x) => x.id === id);
  if (!s) return <NotFound />;

  const list = db.staff.filter((x) => x.status === 'active');
  const idx = Math.max(0, list.findIndex((x) => x.id === s.id));
  const policy = db.settings.payroll;
  const slip = payslip(s, db.payruns?.['2026-10']?.[s.id], policy);
  const sal = salaryOf(s);
  const history = [
    ...(slip.paid ? [] : [{ month: '2026-10', amount: 0, date: null, net: slip.net }]),
    ...(s.salaryHistory || []),
  ];
  const paidYear = history.reduce((a, h) => a + (h.amount || 0), 0);
  const att = historyFor(s.id, s.joined > '2026-10' ? s.joined : '2026-01-01', 10);
  const attCount = Object.values(att).reduce((a, v) => ({ ...a, [v]: (a[v] || 0) + 1 }), {});
  const attRate = Object.keys(att).length ? Math.round((((attCount.P || 0) + (attCount.L || 0)) / Object.keys(att).length) * 100) : null;
  const slots = db.timetable.filter((t) => t.teacher === s.name);
  const docs = db.documents.filter((d) => d.owner.includes(s.id) || d.owner.includes(s.name));
  const tx = db.ledger.filter((l) => l.ref.includes(s.id)).filter((l) => !q || `${l.reason} ${l.category} ${l.amount}`.toLowerCase().includes(q.toLowerCase())).filter((l) => range === 'all' || l.date >= '2026-07');
  const acts = db.activity.filter((a) => a.what.includes(s.name) || a.what.includes(s.id));
  const login = db.users.find((u) => u.staffId === s.id);
  const terminated = s.status !== 'active';
  const STATUS = { unpaid: ['Not paid yet', 'warn'], partial: [`${fmt(slip.remaining)} still to pay`, 'info'], paid: ['Paid', 'ok'], held: ['On hold', 'outline'] };
  const info = [['Full name', s.name], ['Father name', s.father], ['WhatsApp number', s.whatsapp, 'wa'], ['Phone number', s.phone, 'tel'], ['CNIC', s.cnic], ['Subject', s.subject], ['Joining date', s.joined && dateShort(s.joined)], ['Address', s.address], ['Note', s.note]];
  const tabs = ['Salary history', 'Transactions', 'Attendance', 'Timetable', 'Documents', 'Activities'];

  return (
    <div className="page staff-page">
      <div className="row between">
        <Link to="/staff" className="back-pill"><span className="circle xs"><Icon name="chevLeft" size={14} /></span>Staff</Link>
        <div className="row gap-6 small muted">
          {idx + 1} of {list.length}
          <Circle icon="chevLeft" size="sm" label="Previous" onClick={() => nav(`/staff/${list[(idx - 1 + list.length) % list.length].id}`)} />
          <Circle icon="chevRight" size="sm" label="Next" onClick={() => nav(`/staff/${list[(idx + 1) % list.length].id}`)} />
        </div>
      </div>

      <section className="staff-hero">
        <span className={cx('av', avClass(s.id))} style={{ width: 96, height: 96, fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 500 }}>{initials(s.name)}</span>
        <div style={{ flex: '1 1 320px', minWidth: 0 }}>
          <h1 className="staff-name">{s.name}</h1>
          <div className="row wrap gap-6 mt-12">
            <span className="chip-static">{s.role}</span>
            <span className="chip-static">{s.id}</span>
            {s.subject && <span className="chip-static">{s.subject}</span>}
            {attRate != null && <span className="chip-static">{attRate}% attendance</span>}
            {terminated ? <span className="pill danger lg">Terminated</span> : <span className="pill ok lg">Active</span>}
          </div>
        </div>
        <div className="row wrap gap-8">
          <button className="btn" onClick={() => setModal('edit')}><Icon name="edit" size={15} />Edit details</button>
          <div className="toolrow">
            <Circle icon="doc" label="Experience letter" onClick={() => setModal('letter')} />
            <Circle icon="idcard" label="ID card" onClick={() => toast('ID card ZIP downloaded (front + back)', { icon: 'idcard' })} />
            <Circle icon="upload" label="Upload document" onClick={() => setModal('upload')} />
            <Circle icon="whatsapp" label="Message on WhatsApp" onClick={() => window.open(`https://wa.me/${(s.whatsapp || '').replace(/\D/g, '')}`, '_blank')} />
            {terminated
              ? <Circle icon="refresh" label="Activate" onClick={() => { updateStaff(s.id, { status: 'active' }); toast(`${s.name} re-activated`); }} />
              : <Circle icon="logout" tone="danger" label="Terminate" onClick={() => setModal('terminate')} />}
          </div>
          <button className="btn primary" onClick={() => setModal('slip')}><Icon name="receipt" size={15} />Salary slip</button>
        </div>
      </section>

      <div className="staff-layout">
        <div className="staff-left">
          <section className="hero-panel staff-pay">
            <div className="small" style={{ color: 'var(--hero-muted)' }}>Monthly salary</div>
            <div className="display" style={{ fontSize: 44, marginTop: 6 }}>{fmt(sal.gross)} <span className="unit" style={{ color: 'var(--hero-muted)' }}>PKR</span></div>

            <div className="hero-chip-block">
              <div className="grow">
                <div className="xs" style={{ color: 'var(--hero-muted)' }}>October payslip</div>
                <div className="display" style={{ fontSize: 22, marginTop: 2 }}>{fmt(slip.net)} PKR</div>
                <div className="xs" style={{ color: 'var(--hero-muted)' }}>{slip.deductions ? `${fmt(slip.gross)} − ${fmt(slip.deductions)} deductions · ` : ''}{STATUS[slip.status][0]}</div>
              </div>
              <button className="btn sm accent" onClick={() => nav('/staff/payroll')}>{slip.status === 'paid' ? 'View' : 'Pay'}</button>
            </div>

            <div className="hero-chip-block">
              <div className="grow">
                <div className="xs" style={{ color: 'var(--hero-muted)' }}>Loan balance{s.advance ? ' · advance' : ''}</div>
                <div className="display" style={{ fontSize: 22, marginTop: 2 }}>{fmt(s.loan || 0)} PKR{s.advance ? <span className="small" style={{ color: 'var(--hero-muted)' }}> · {fmt(s.advance)} adv.</span> : null}</div>
                {s.loanDeduction > 0 && s.loan > 0 && <div className="xs" style={{ color: 'var(--hero-muted)' }}>{fmt(s.loanDeduction)} cut from each salary</div>}
              </div>
              <div className="row gap-6">
                <button className="btn sm ghost on-hero" disabled={!s.loan} title={s.loan ? '' : 'No loan to repay'} onClick={() => setModal('repay')}>Repay</button>
                <button className="btn sm ghost on-hero" onClick={() => setModal('loan')}>Issue loan</button>
              </div>
            </div>
          </section>

          <section className="widget staff-info">
            <div className="row between"><h2 className="h2 sm">Staff information</h2></div>
            <dl>
              {info.map(([k, v, kind]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>
                    {v ? <span>{v}</span> : <button className="add" onClick={() => setModal('edit')}>+ Add</button>}
                    {v && kind === 'tel' && <a className="circle xs ghost" href={`tel:${v}`} aria-label={`Call ${v}`}><Icon name="phone" size={12} /></a>}
                    {v && kind === 'wa' && <a className="circle xs ghost" href={`https://wa.me/${v.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" aria-label={`WhatsApp ${v}`}><Icon name="whatsapp" size={12} /></a>}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="widget staff-info">
            <div className="row between"><h2 className="h2 sm">App login</h2><button className="btn xs ghost" onClick={() => nav('/settings/team')}>{login ? 'Manage' : 'Create login'}</button></div>
            <div className="small mt-8">{login ? <>{login.email} · <span className="muted">{login.role}{login.perms === 'all' ? ' · full access' : ` · ${Object.keys(login.perms).length} modules`}</span></> : <span className="muted">{s.name} can’t sign in yet.</span>}</div>
          </section>
        </div>

        <section className="widget staff-records">
          <div className="pillgroup" role="tablist" aria-label="Staff records" style={{ alignSelf: 'flex-start' }}>
            {tabs.map((t) => <button key={t} role="tab" aria-selected={view === t} className={cx(view === t && 'on')} onClick={() => setView(t)}>{t}</button>)}
          </div>
          <div className="row wrap gap-8">
            <div className="onoff"><button className={cx(range === 'all' && 'on')} onClick={() => setRange('all')}>All time</button><button className={cx(range === '3m' && 'on')} onClick={() => setRange('3m')}>Last 3 months</button></div>
            <label className="search" style={{ flex: '1 1 240px' }}><Icon name="search" size={15} /><input aria-label={`Search ${view.toLowerCase()}`} placeholder={`Search ${view.toLowerCase()}`} value={q} onChange={(e) => setQ(e.target.value)} /></label>
            {view === 'Salary history' && <Circle icon="download" size="sm" label="Export salary history" onClick={() => { exportCsv(`${s.name} salary history`); toast('Salary history exported', { icon: 'download' }); }} />}
          </div>

          {view === 'Salary history' && (
            <div className="table-wrap"><table className="table">
              <thead><tr><th>Month</th><th className="num">Salary</th><th className="num">Net</th><th className="num">Paid</th><th>Paid on</th><th>Status</th></tr></thead>
              <tbody>{history.filter((h) => range === 'all' || h.month >= '2026-07').map((h) => {
                const net = h.net ?? s.pay;
                const st = h.amount >= net ? ['Paid', 'ok'] : h.amount ? ['Part paid', 'info'] : ['Pending', 'warn'];
                return <tr key={h.month}><td className="medium">{monthLabel(h.month)}</td><td className="num muted">{fmt(s.pay)}</td><td className="num">{fmt(net)}</td><td className="num strong">{fmt(h.amount)}</td><td className="muted">{h.date ? dateShort(h.date) : '—'}</td><td><span className={`pill ${st[1]}`}>{st[0]}</span></td></tr>;
              })}</tbody>
            </table></div>
          )}
          {view === 'Transactions' && (tx.length ? (
            <div className="table-wrap"><table className="table">
              <thead><tr><th>Created by</th><th className="num">Amount</th><th>Reason</th><th>Payment</th><th>Type</th><th>Created at</th></tr></thead>
              <tbody>{tx.map((l) => <tr key={l.id}><td>{l.by}</td><td className="num strong">{l.type === 'in' ? '+' : '−'}{fmt(l.amount)}</td><td>{l.reason}</td><td>{l.method}</td><td>{l.category}</td><td className="muted">{dateShort(l.date)}</td></tr>)}</tbody>
            </table></div>
          ) : <StaffEmpty what="transactions" onWide={() => setRange('all')} />)}
          {view === 'Attendance' && (
            <div className="col gap-12">
              <div className="row wrap gap-6">{Object.keys(ATT).map((k) => <span key={k} className="pill lg" style={{ background: soft(ATT[k][1]), color: fg(ATT[k][1]) }}>{ATT[k][0]} {attCount[k] || 0}</span>)}</div>
              <div className="att-cal">{Object.entries(att).map(([d, v]) => <div key={d} title={`${d} Oct · ${ATT[v][0]}`} style={{ background: soft(ATT[v][1]), color: fg(ATT[v][1]) }}><b>{d}</b><span>{v}</span></div>)}</div>
              {Object.entries(att).reverse().filter(([d]) => db.remarks?.[`2026-10-${String(d).padStart(2, '0')}`]?.[s.id]).map(([d, v]) => <Row key={d} icon="edit" tone={ATT[v][1]} title={`${d} October · ${ATT[v][0]}`} sub={db.remarks[`2026-10-${String(d).padStart(2, '0')}`][s.id]} />)}
            </div>
          )}
          {view === 'Timetable' && (slots.length ? (
            <div style={{ overflowX: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '64px repeat(6, minmax(90px, 1fr))', gap: 6, minWidth: 640 }}>
                <div />{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d} className="small medium" style={{ textAlign: 'center', padding: 6 }}>{d}</div>)}
                {periods.map((p) => [
                  <div key={'l' + p.n} className="xs muted" style={{ padding: 6 }}>P{p.n}<br />{p.start}</div>,
                  ...[1, 2, 3, 4, 5, 6].map((d) => { const t = slots.find((x) => x.day === d && x.period === p.n); return <div key={`${d}-${p.n}`} className="tile" style={{ padding: 8, minHeight: 48, background: t ? 'var(--accent-soft)' : 'var(--surface-2)' }}>{t && <><div className="xs strong">{t.subject}</div><div className="xs muted ellipsis">{classById[t.classId]?.name} {t.section}</div></>}</div>; }),
                ])}
              </div>
            </div>
          ) : <StaffEmpty what="classes on the timetable" action={<button className="btn sm" onClick={() => nav('/academics/timetable')}>Open timetable</button>} />)}
          {view === 'Documents' && (docs.length ? docs.map((d) => <Row key={d.id} icon="doc" title={d.title} sub={`${d.type} · ${dateShort(d.date)}`} right={<Circle icon="download" size="xs" iconSize={12} label="Download" onClick={() => { printView(); toast(`${d.title} — choose Save as PDF`, { icon: 'print' }); }} />} />)
            : <StaffEmpty what="documents" action={<button className="btn sm" onClick={() => setModal('upload')}>Upload CNIC, degree or contract</button>} />)}
          {view === 'Activities' && (acts.length ? acts.map((a) => <Row key={a.id} icon="history" title={`${a.who} ${a.what}`} sub={relative(a.when)} />) : <StaffEmpty what="activities" onWide={() => setRange('all')} />)}
        </section>
      </div>

      {modal === 'loan' && <LoanModal s={s} onClose={() => setModal(null)} />}
      {modal === 'repay' && <RepayModal s={s} onClose={() => setModal(null)} onRepay={(a) => { repayLoan(s.id, a); toast(`${fmt(a)} PKR repayment recorded`); setModal(null); }} />}
      {modal === 'edit' && <EditStaff s={s} onClose={() => setModal(null)} />}
      {modal === 'slip' && <SlipModal s={s} slip={slip} onClose={() => setModal(null)} />}
      {modal === 'letter' && <LetterModal s={s} onClose={() => setModal(null)} />}
      {modal === 'upload' && <UploadModal s={s} onClose={() => setModal(null)} />}
      {modal === 'terminate' && (
        <Modal open onClose={() => setModal(null)} title={`Terminate ${s.name}?`} sub="Salary stops from next month. Records are kept."
          footer={<><button className="btn ghost" onClick={() => setModal(null)}>Cancel</button><button className="btn" style={{ background: 'var(--danger)', color: '#fff', borderColor: 'transparent' }} onClick={() => { updateStaff(s.id, { status: 'terminated', terminatedOn: termDate }); toast(`${s.name} terminated`, { undo: () => updateStaff(s.id, { status: 'active' }) }); setModal(null); }}>Terminate</button></>}>
          <Field label="Termination date"><input className="input" type="date" value={termDate} onChange={(e) => setTermDate(e.target.value)} /></Field>
          {s.loan > 0 && <div className="banner warn small"><Icon name="warn" size={16} />{fmt(s.loan)} PKR loan is still outstanding.</div>}
          {slip.remaining > 0 && <div className="banner info small"><Icon name="cash" size={16} />October salary — {fmt(slip.remaining)} PKR — hasn’t been paid yet.</div>}
        </Modal>
      )}
    </div>
  );
}

function StaffEmpty({ what, onWide, action }) {
  return (
    <div className="col gap-12" style={{ alignItems: 'center', padding: '56px 24px', textAlign: 'center' }}>
      <span className="circle lg" style={{ width: 64, height: 64 }}><Icon name="receipt" size={24} /></span>
      <div><div className="medium">No {what} yet</div><div className="small muted mt-4">{onWide ? 'Try a wider date range.' : 'They’ll show here once added.'}</div></div>
      {action || (onWide && <button className="btn sm ghost" onClick={onWide}>All time</button>)}
    </div>
  );
}

function LoanModal({ s, onClose }) {
  const { issueLoan, toast } = useSchool();
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [months, setMonths] = useState('5');
  const per = Math.ceil(((Number(amount) || 0) + s.loan) / (Number(months) || 1));
  return (
    <Modal open onClose={onClose} title="Issue loan" sub={`${s.name} · current balance ${fmt(s.loan)} PKR`}
      footer={<><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" disabled={!Number(amount)} onClick={() => { issueLoan(s.id, { amount, reason, months }); toast(`Loan of ${fmt(amount)} PKR issued`); onClose(); }}>Issue loan</button></>}>
      <Field label="Amount (PKR)"><input className="input big" autoFocus inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))} placeholder="0" /></Field>
      <div className="form-grid">
        <Field label="Reason"><input className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. medical, wedding" /></Field>
        <Field label="Deduct over (months)"><input className="input" value={months} onChange={(e) => setMonths(e.target.value.replace(/\D/g, ''))} /></Field>
      </div>
      <label className="dropzone" style={{ cursor: 'pointer' }}><Icon name="paperclip" size={18} />Attach signed agreement <span className="xs faint">optional</span><input type="file" hidden /></label>
      {Number(amount) > 0 && <div className="banner info small"><Icon name="repeat" size={16} />{fmt(per)} PKR will be deducted from each salary. Recorded as a loan (asset) in Accounts, not an expense.</div>}
    </Modal>
  );
}

function RepayModal({ s, onClose, onRepay }) {
  const [amount, setAmount] = useState(String(s.loan));
  return (
    <Modal open onClose={onClose} title="Record loan repayment" sub={`${s.name} · ${fmt(s.loan)} PKR outstanding`}
      footer={<><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" disabled={!Number(amount)} onClick={() => onRepay(Math.min(Number(amount), s.loan))}>Record {fmt(Math.min(Number(amount) || 0, s.loan))}</button></>}>
      <Field label="Amount repaid (PKR)"><input className="input big" autoFocus inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))} /></Field>
    </Modal>
  );
}

function SlipModal({ s, slip, onClose }) {
  const { db, toast } = useSchool();
  return (
    <Modal open onClose={onClose} wide title="Salary slip · October 2026" sub={s.name}
      footer={<><button className="btn" onClick={() => toast('Slip sent on WhatsApp', { icon: 'whatsapp' })}><Icon name="whatsapp" size={15} />Send</button><button className="btn primary" onClick={() => { printView(); toast('Slip — choose Save as PDF', { icon: 'print' }); }}><Icon name="print" size={15} />Print</button></>}>
      <div style={{ border: '1px solid var(--border)', borderRadius: 18, padding: 20 }}>
        <div className="row between"><div><div className="medium">{db.school.name}</div><div className="xs muted">{db.school.address}</div></div><span className="pill outline">Salary slip</span></div>
        <div className="grid g3 mt-16">
          <div className="tile"><div className="k">Staff</div><div className="v">{s.name}</div><div className="xs muted">{s.id} · {s.role}</div></div>
          <div className="tile"><div className="k">Attendance</div><div className="v">{s.att?.P || 0}P · {s.att?.L || 0}L · {s.att?.A || 0}A · {s.att?.V || 0}V</div></div>
          <div className="tile"><div className="k">Paid</div><div className="v">{fmt(slip.paid)} of {fmt(slip.net)}</div></div>
        </div>
        <div className="grid g2 mt-16" style={{ gap: 20 }}>
          <div><div className="upper">Earnings</div>{slip.earnings.map((l) => <div key={l.key} className="row between small" style={{ padding: '6px 0', borderTop: '1px solid var(--line)' }}><span>{l.label}</span><span>{fmt(l.amount)}</span></div>)}<div className="row between small strong" style={{ padding: '6px 0', borderTop: '1px solid var(--line)' }}><span>Gross</span><span>{fmt(slip.gross)}</span></div></div>
          <div><div className="upper">Deductions</div>{slip.cuts.filter((c) => !c.waived).map((l) => <div key={l.key} className="row between small" style={{ padding: '6px 0', borderTop: '1px solid var(--line)' }}><span>{l.label}</span><span>− {fmt(l.amount)}</span></div>)}{!slip.cuts.filter((c) => !c.waived).length && <div className="xs muted" style={{ padding: '6px 0' }}>None</div>}<div className="row between small strong" style={{ padding: '6px 0', borderTop: '1px solid var(--line)' }}><span>Net pay</span><span>{fmt(slip.net)} PKR</span></div></div>
        </div>
      </div>
    </Modal>
  );
}

function LetterModal({ s, onClose }) {
  const { db, addDocument, toast } = useSchool();
  const [title, setTitle] = useState('Experience letter');
  const [body, setBody] = useState(`This is to certify that ${s.name}, ${s.father ? `son/daughter of ${s.father}, ` : ''}has been working at ${db.school.name} as ${s.role}${s.subject ? ` (${s.subject})` : ''} since ${dateShort(s.joined)}.\n\nDuring this period we found ${s.name} hard-working, punctual and dedicated. We wish them every success.`);
  return (
    <Modal open onClose={onClose} wide title="Experience letter" sub="Printed on the school letterhead with date and signature"
      footer={<><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" onClick={() => { addDocument({ title, type: 'Letter pad', owner: `${s.name} (${s.id})` }); toast('Letter created', { icon: 'doc' }); onClose(); }}>Create letter</button></>}>
      <Field label="Letter title"><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
      <Field label="Content"><textarea className="textarea" rows={8} value={body} onChange={(e) => setBody(e.target.value)} /></Field>
    </Modal>
  );
}

function UploadModal({ s, onClose }) {
  const { addDocument, toast } = useSchool();
  const [name, setName] = useState('CNIC');
  return (
    <Modal open onClose={onClose} title="Upload document" sub={s.name}
      footer={<><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" disabled={!name} onClick={() => { addDocument({ title: name, type: 'Staff upload', owner: `${s.name} (${s.id})` }); toast(`${name} uploaded`); onClose(); }}>Upload</button></>}>
      <div className="row wrap gap-6">{['CNIC', 'Degree', 'Contract', 'Experience certificate', 'Photo'].map((x) => <button key={x} className={cx('chip sm', name === x && 'on')} onClick={() => setName(x)}>{x}</button>)}</div>
      <Field label="Document name"><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <label className="dropzone" style={{ cursor: 'pointer' }}><Icon name="upload" size={18} />Drop a file or click to browse<input type="file" hidden /></label>
    </Modal>
  );
}

function EditStaff({ s, onClose }) {
  const { updateStaff, toast } = useSchool();
  const [v, setV] = useState(s);
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  return (
    <Modal open onClose={onClose} title="Edit staff" sub={s.id} wide footer={<><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" onClick={() => { updateStaff(s.id, { ...v, pay: Number(v.pay) || 0 }); toast('Saved'); onClose(); }}>Save</button></>}>
      <div className="form-grid">
        {[['name', 'Full name'], ['father', 'Father name'], ['role', 'Role'], ['subject', 'Subject'], ['phone', 'Phone'], ['whatsapp', 'WhatsApp'], ['cnic', 'CNIC'], ['pay', 'Monthly pay (PKR)'], ['joined', 'Joining date'], ['address', 'Address'], ['note', 'Note']].map(([k, l]) => <Field key={k} label={l}><input className="input" type={k === 'joined' ? 'date' : 'text'} value={v[k] || ''} onChange={set(k)} /></Field>)}
      </div>
    </Modal>
  );
}
