import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import { Circle, OnOff } from '../../components/Bento.jsx';
import { Avatar, Field, Modal } from '../../components/ui.jsx';
import { useSchool, code } from '../../lib/store.jsx';
import { cx, dateShort, fmt, relative } from '../../lib/format.js';
import { netFee } from '../../lib/student.js';
import { printView } from '../../lib/exporter.js';
import NotFound from '../NotFound.jsx';

// The cashier's workspace for one family: what's due, what's being paid now, and how.
// Two ways to fill the bill: tick lines (and edit amounts), or type what the parent
// is handing over and let it settle the oldest charges first.

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthIdx = (label) => { const [m, y] = label.split(' '); return Number(y) * 12 + MON.indexOf(m.slice(0, 3)); };
const NOW_IDX = monthIdx('Oct 2026');
const labelOf = (idx) => `${MON[idx % 12]} ${Math.floor(idx / 12)}`;
const CAT = { monthly: 'Monthly fee', recurring: 'Recurring', onetime: 'Custom charge', fine: 'Fine', other: 'Fund' };
const METHODS = ['Cash', 'Online transfer'];

export default function FeeCollect() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const { db, classById, kidsOf, open, toast, collectFees, createChallan, addCredit, addNote, updateNote } = useSchool();
  const fam = db.families.find((f) => f.id === id);
  const kids = useMemo(() => (fam ? kidsOf(fam.id).filter((s) => s.status === 'active') : []), [fam, kidsOf]);
  const [only, setOnly] = useState(params.get('student') || 'all');
  const [ahead, setAhead] = useState(0);
  // Remembered per user, so discounts open by themselves next time.
  const [showDisc, setShowDiscRaw] = useState(() => { try { return localStorage.getItem('schooliee-show-discount') === '1'; } catch (e) { return false; } });
  const setShowDisc = (v) => { setShowDiscRaw(v); try { localStorage.setItem('schooliee-show-discount', v ? '1' : '0'); } catch (e) { /* ignore */ } };
  const [folded, setFolded] = useState({});
  const [sel, setSel] = useState({});
  const [pay, setPay] = useState({});
  const [disc, setDisc] = useState({});
  const [byAmount, setByAmount] = useState('');
  const [useCredit, setUseCredit] = useState(false);
  const [creditAmt, setCreditAmt] = useState('');
  const [method, setMethod] = useState('Cash');
  const [date, setDate] = useState('2026-10-09');
  const [note, setNote] = useState('');
  const [received, setReceived] = useState('');
  const [sendReceipt, setSendReceipt] = useState(true);
  const [done, setDone] = useState(null);
  const [invoice, setInvoice] = useState(false);
  const [modal, setModal] = useState(null);
  const [showOld, setShowOld] = useState(false);
  const [noteTab, setNoteTab] = useState('active');
  const [draftNote, setDraftNote] = useState('');

  // Every payable line for the family, plus months billed ahead when asked.
  const lines = useMemo(() => {
    const out = [];
    kids.forEach((s) => {
      s.dues.forEach((d) => out.push({ key: `${s.id}:${d.id}`, studentId: s.id, dueId: d.id, label: d.label, month: d.month, amount: d.amount, orig: d.orig, cat: d.cat, added: d.added, by: d.by, idx: monthIdx(d.month) }));
      for (let k = 1; k <= ahead; k += 1) {
        const month = labelOf(NOW_IDX + k);
        if (out.some((l) => l.studentId === s.id && l.month === month)) continue;
        const cls = classById[s.classId];
        out.push({ key: `${s.id}:adv:${month}:m`, studentId: s.id, advance: { label: 'Monthly fee', month, amount: netFee(s, cls), cat: 'monthly' }, label: 'Monthly fee', month, amount: netFee(s, cls), cat: 'monthly', idx: NOW_IDX + k, isAdvance: true });
        (s.recurring || []).filter((r) => r.status === 'active').forEach((r) => out.push({ key: `${s.id}:adv:${month}:${r.id}`, studentId: s.id, advance: { label: r.name, month, amount: r.amount, cat: 'recurring' }, label: r.name, month, amount: r.amount, cat: 'recurring', idx: NOW_IDX + k, isAdvance: true }));
      }
    });
    return out.sort((a, b) => a.idx - b.idx);
  }, [kids, ahead, classById]);

  // New lines start selected for their full amount; stale keys are dropped.
  const linesKey = lines.map((l) => `${l.key}=${l.amount}`).join('|');
  useEffect(() => {
    setSel((cur) => Object.fromEntries(lines.map((l) => [l.key, cur[l.key] ?? true])));
    setPay((cur) => Object.fromEntries(lines.map((l) => [l.key, cur[l.key] !== undefined && Number(cur[l.key]) <= l.amount ? cur[l.key] : String(l.amount)])));
  }, [linesKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!fam) return <NotFound />;

  const visible = lines.filter((l) => only === 'all' || l.studentId === only);
  const dOf = (l) => Math.min(Number(disc[l.key]) || 0, l.amount);
  const pOf = (l) => (sel[l.key] ? (/admission/i.test(l.label) ? l.amount - dOf(l) : Math.min(Number(pay[l.key]) || 0, l.amount - dOf(l))) : 0);
  const chosen = visible.filter((l) => sel[l.key]);
  const subtotal = chosen.reduce((a, l) => a + pOf(l), 0);
  const discTotal = chosen.reduce((a, l) => a + dOf(l), 0);
  const credit = useCredit ? Math.min(Number(creditAmt) || 0, fam.credit, subtotal) : 0;
  const toCollect = subtotal - credit;
  const owedNow = lines.filter((l) => !l.isAdvance).reduce((a, l) => a + l.amount, 0);
  const leftAfter = lines.filter((l) => !l.isAdvance).reduce((a, l) => a + (l.amount - (sel[l.key] && (only === 'all' || l.studentId === only) ? pOf(l) + dOf(l) : 0)), 0);
  const cashIn = Number(received) || 0;

  const fillByAmount = (v) => {
    setByAmount(v);
    let left = Number(v) || 0;
    const nextSel = {}; const nextPay = {};
    visible.forEach((l) => { const full = l.amount - dOf(l); let take = Math.max(0, Math.min(left, full)); if (/admission/i.test(l.label) && take < full) take = 0; left -= take; nextSel[l.key] = take > 0; nextPay[l.key] = String(take || l.amount); });
    setSel({ ...sel, ...nextSel }); setPay({ ...pay, ...nextPay });
  };
  const selectWhere = (fn) => { setByAmount(''); setSel({ ...sel, ...Object.fromEntries(visible.map((l) => [l.key, fn(l)])) }); setPay({ ...pay, ...Object.fromEntries(visible.map((l) => [l.key, String(l.amount - dOf(l))])) }); };

  const collect = () => {
    const payload = chosen.filter((l) => pOf(l) > 0 || dOf(l) > 0).map((l) => ({ studentId: l.studentId, dueId: l.dueId, advance: l.advance, pay: pOf(l), discount: dOf(l) }));
    const rcp = collectFees({ familyId: fam.id, lines: payload, creditUsed: credit, method, date, note, sendReceipt: sendReceipt && fam.waVerified });
    setDone({ amount: subtotal, cash: toCollect, credit, receipt: rcp, change: method === 'Cash' && cashIn > toCollect ? cashIn - toCollect : 0, items: payload.length, method, note, date, lines: chosen.filter((l) => pOf(l) > 0 || dOf(l) > 0).map((l) => ({ student: kids.find((k) => k.id === l.studentId), label: l.label, month: l.month, cat: l.cat, paid: pOf(l), disc: dOf(l), total: l.orig || l.amount, owedBefore: l.amount })) });
    setInvoice(true);
    setByAmount(''); setReceived(''); setNote(''); setAhead(0); setUseCredit(false); setDisc({});
  };

  const famChallans = (db.challans || []).filter((c) => c.familyId === fam.id && (showOld || c.status !== 'superseded'));
  const notes = (fam.notes || []).filter((n) => (noteTab === 'active' ? !n.archived : n.archived));
  const groups = (only === 'all' ? kids : kids.filter((s) => s.id === only)).map((s) => ({ s, rows: visible.filter((l) => l.studentId === s.id) }));

  return (
    <div className="page collect-page">
      <div className="row between wrap gap-12">
        <Link to="/finance/fees" className="back-pill"><span className="circle xs"><Icon name="chevLeft" size={14} /></span>Fees</Link>
        <div className="toolrow">
          <Circle icon="plus" label="Record a due" onClick={() => setModal('due')} />
          <Circle icon="print" label="Print statement" onClick={() => { printView(); toast('Statement ready — choose Save as PDF', { icon: 'print' }); }} />
          <Circle icon="whatsapp" label="Send reminder" onClick={() => open('compose', { preset: 'reminder', familyId: fam.id })} />
          <Circle icon="phone" label={`Call ${fam.phone}`} onClick={() => { window.location.href = `tel:${fam.phone.replace(/\s/g, '')}`; }} />
          <Circle icon="family" label="Family profile" onClick={() => nav(`/students/families/${fam.id}`)} />
        </div>
      </div>

      <header className="collect-head">
        <Avatar name={fam.name} id={fam.id} size={64} />
        <div className="grow" style={{ minWidth: 0 }}>
          <h1 className="h1 sm" style={{ margin: 0 }}>{fam.name}</h1>
          <div className="row wrap gap-6 small muted mt-8">
            <span>{fam.id}</span><span>·</span><span>{fam.phone}</span>
            {fam.waVerified ? <span className="pill ok" style={{ height: 22 }}><Icon name="whatsapp" size={12} />Verified</span> : <span className="pill warn" style={{ height: 22 }}>WhatsApp not verified</span>}
            {fam.app && <span className="pill outline" style={{ height: 22 }}>Parent app</span>}
          </div>
        </div>
        <div className="collect-owed">
          <span className="xs muted">Owes today</span>
          <span className="display" style={{ fontSize: 34 }}>{fmt(owedNow)}<span className="unit"> PKR</span></span>
        </div>
      </header>

      <div className="row wrap gap-6">
        <button className={cx('chip', only === 'all' && 'on')} onClick={() => setOnly('all')}>All children · {kids.length}</button>
        {kids.map((s) => <button key={s.id} className={cx('chip', only === s.id && 'on')} onClick={() => setOnly(s.id)}><Avatar name={s.name} id={s.id} size={22} />{s.name} <span className="muted">· {classById[s.classId]?.name} {s.section}</span></button>)}
      </div>

      <div className="collect-grid">
        <section className="widget collect-bill">
          <div className="bill-tools">
            <label className="bill-amount">
              <span className="xs muted">Parent is paying</span>
              <span className="row gap-6"><input inputMode="numeric" placeholder="Type an amount" value={byAmount} onChange={(e) => fillByAmount(e.target.value.replace(/\D/g, ''))} aria-label="Amount the parent is paying" /><span className="small muted">PKR</span></span>
              <span className="xs muted">Settles the oldest charges first</span>
            </label>
            <div className="col gap-8" style={{ flex: '1 1 260px' }}>
              <div className="row wrap gap-6">
                <button className="chip sm" onClick={() => selectWhere(() => true)}>Everything</button>
                <button className="chip sm" onClick={() => selectWhere((l) => l.idx === NOW_IDX)}>October only</button>
                <button className="chip sm" onClick={() => selectWhere((l) => l.idx < NOW_IDX)}>Overdue only</button>
                <button className="chip sm" onClick={() => selectWhere(() => false)}>Clear</button>
              </div>
              <div className="row wrap gap-12 small">
                <span className="row gap-6">Pay ahead
                  <span className="stepper"><button aria-label="Fewer months ahead" disabled={!ahead} onClick={() => setAhead(Math.max(0, ahead - 1))}>−</button><b>{ahead ? `${ahead} mo` : 'Off'}</b><button aria-label="More months ahead" disabled={ahead >= 12} onClick={() => setAhead(ahead + 1)}>+</button></span>
                </span>
                <span className="row gap-6" title="Adds an additional-discount box to every line · remembered">Additional discounts <OnOff value={showDisc} onChange={setShowDisc} /></span>
              </div>
            </div>
          </div>

          {groups.map(({ s, rows }) => {
            const cls = classById[s.classId];
            const months = [...new Set(rows.map((r) => r.month))];
            const due = rows.filter((r) => !r.isAdvance).reduce((a, r) => a + r.amount, 0);
            return (
              <div key={s.id} className="bill-student">
                <div className="bill-student-head" onClick={(e) => { if (!e.target.closest('a')) setFolded({ ...folded, [s.id]: !folded[s.id] }); }} style={{ cursor: 'pointer' }}>
                  <Avatar name={s.name} id={s.id} size={40} />
                  <div className="grow" style={{ minWidth: 0 }}>
                    <Link to={`/students/${s.id}`} className="medium">{s.name}</Link>
                    <div className="xs muted">{code(s)} · {cls?.name} {s.section} · fee {fmt(netFee(s, cls))}{s.discount ? ` (discount ${s.discountType === 'percent' ? `${s.discount}%` : fmt(s.discount)})` : ''}</div>
                  </div>
                  <span className={cx('pill', due ? 'danger' : 'ok')}>{due ? `${fmt(due)} due` : 'Clear'}</span>
                  <Icon name={folded[s.id] ? 'chevDown' : 'chevUp'} size={16} />
                </div>
                {!folded[s.id] && months.map((m) => {
                  const mi = monthIdx(m);
                  const tag = mi < NOW_IDX ? ['Overdue', 'danger'] : mi === NOW_IDX ? ['This month', 'outline'] : ['Advance', 'info'];
                  return (
                    <div key={m} className="bill-month">
                      <div className="bill-month-label"><span className="medium small">{m}</span><span className={`pill ${tag[1]}`} style={{ height: 20, fontSize: 10 }}>{tag[0]}</span></div>
                      {rows.filter((r) => r.month === m).map((l) => (
                        <div key={l.key} className={cx('bill-line', sel[l.key] && 'on')}>
                          <input type="checkbox" className="check" checked={!!sel[l.key]} onChange={() => { setByAmount(''); setSel({ ...sel, [l.key]: !sel[l.key] }); }} aria-label={`Pay ${l.label} ${l.month}`} />
                          <div className="grow" style={{ minWidth: 0 }}>
                            <div className="row gap-6 wrap"><span className="medium">{l.label}</span><span className="tag">{CAT[l.cat] || 'Charge'}</span></div>
                            <div className="xs muted">{l.orig ? `${fmt(l.orig)} billed · ${fmt(l.orig - l.amount)} paid · ` : ''}{l.added ? `Added ${relative(l.added)} by ${l.by}` : l.isAdvance ? 'Billed ahead — added when you collect' : ''}</div>
                          </div>
                          <span className="bill-amt">{fmt(l.amount)}</span>
                          {showDisc && <input className="bill-input disc" inputMode="numeric" placeholder="− disc." value={disc[l.key] || ''} onChange={(e) => setDisc({ ...disc, [l.key]: e.target.value.replace(/\D/g, '') })} aria-label={`Discount on ${l.label}`} />}
                          <input className="bill-input" inputMode="numeric" disabled={!sel[l.key] || /admission/i.test(l.label)} title={/admission/i.test(l.label) ? 'Admission fee is paid in full' : ''} value={sel[l.key] ? (/admission/i.test(l.label) ? String(l.amount - dOf(l)) : pay[l.key] ?? '') : ''} placeholder="0" onChange={(e) => { setByAmount(''); setPay({ ...pay, [l.key]: e.target.value.replace(/\D/g, '') }); }} aria-label={`Paying for ${l.label}`} />
                        </div>
                      ))}
                    </div>
                  );
                })}
                {!rows.length && <div className="small muted" style={{ padding: '14px 4px' }}>Nothing due for {s.name}. Use <b>Pay ahead</b> to collect future months.</div>}
              </div>
            );
          })}
        </section>

        <aside className="collect-side">
          {done ? (
            <section className="hero-panel collect-checkout">
              <span className="circle lime" style={{ width: 52, height: 52 }}><Icon name="check" size={24} stroke={2.4} /></span>
              <div className="display" style={{ fontSize: 40, marginTop: 14 }}>{fmt(done.amount)}<span className="unit"> PKR</span></div>
              <div className="small" style={{ color: 'var(--hero-muted)' }}>Collected from {fam.name} · {done.items} item{done.items > 1 ? 's' : ''} · {done.receipt}</div>
              {done.credit > 0 && <div className="small mt-8" style={{ color: 'var(--hero-muted)' }}>{fmt(done.cash)} cash + {fmt(done.credit)} from family credit</div>}
              {done.change > 0 && <div className="checkout-change">Give back {fmt(done.change)} PKR change</div>}
              <div className="col gap-8 mt-16">
                <button className="btn accent block" onClick={() => setInvoice(true)}><Icon name="receipt" size={15} />View invoice</button>
                {fam.waVerified && <button className="btn ghost block on-hero" onClick={() => toast(`Receipt sent to ${fam.whatsapp || fam.phone} on WhatsApp`, { icon: 'whatsapp' })}><Icon name="whatsapp" size={15} />Send on WhatsApp</button>}
                <button className="btn ghost block on-hero" onClick={() => setDone(null)}>{owedNow ? `Collect more · ${fmt(owedNow)} left` : 'Done'}</button>
              </div>
            </section>
          ) : (
            <section className="hero-panel collect-checkout">
              <div className="row between"><span className="small" style={{ color: 'var(--hero-muted)' }}>Collect now</span><span className="xs" style={{ color: 'var(--hero-muted)' }}>{chosen.length} item{chosen.length === 1 ? '' : 's'}</span></div>
              <div className="display" style={{ fontSize: 46, marginTop: 6, color: 'var(--hero-accent)' }}>{fmt(toCollect)}<span className="unit" style={{ color: 'var(--hero-muted)' }}> PKR</span></div>
              <div className="checkout-rows">
                <div><span>Selected</span><span>{fmt(subtotal + discTotal)}</span></div>
                {discTotal > 0 && <div><span>Discounts</span><span>− {fmt(discTotal)}</span></div>}
                {credit > 0 && <div><span>Family credit</span><span>− {fmt(credit)}</span></div>}
                <div><span>Still due after this</span><span>{fmt(leftAfter)}</span></div>
              </div>
              {fam.credit > 0 && (
                <div className="checkout-credit">
                  <div className="row between"><span className="small">Use family credit <span style={{ color: 'var(--hero-muted)' }}>· {fmt(fam.credit)} available</span></span><OnOff value={useCredit} onChange={(v) => { setUseCredit(v); setCreditAmt(v ? String(Math.min(fam.credit, subtotal)) : ''); }} /></div>
                  {useCredit && <input className="hero-input mt-8" inputMode="numeric" value={creditAmt} onChange={(e) => setCreditAmt(e.target.value.replace(/\D/g, ''))} aria-label="Credit to use" />}
                </div>
              )}
              <div className="hero-methods">{METHODS.map((m) => <button key={m} className={cx(method === m && 'on')} onClick={() => setMethod(m)}>{m}</button>)}</div>
              {method === 'Cash' && (
                <label className="hero-field"><span>Cash received</span><input className="hero-input" inputMode="numeric" placeholder={fmt(toCollect)} value={received} onChange={(e) => setReceived(e.target.value.replace(/\D/g, ''))} />
                  {cashIn > toCollect && <span className="checkout-change sm">Give back {fmt(cashIn - toCollect)}</span>}
                  {cashIn > 0 && cashIn < toCollect && <span className="xs" style={{ color: 'var(--hero-muted)' }}>Short by {fmt(toCollect - cashIn)} — <button className="link xs" style={{ color: 'var(--hero-accent)' }} onClick={() => fillByAmount(String(cashIn + credit))}>collect {fmt(cashIn)} only</button></span>}
                </label>
              )}
              <div className="row gap-8">
                <label className="hero-field" style={{ flex: 1 }}><span>Date</span><input className="hero-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
              </div>
              <label className="hero-field"><span>Note · optional</span><input className="hero-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note for this payment…" /></label>
              {fam.waVerified && <div className="row between small mt-8"><span>WhatsApp the receipt</span><OnOff value={sendReceipt} onChange={setSendReceipt} /></div>}
              <button className="btn accent block mt-16" style={{ height: 52, fontSize: 15 }} disabled={!chosen.length || (subtotal === 0 && discTotal === 0) || (method === 'Cash' && cashIn > 0 && cashIn < toCollect)} onClick={collect}>Collect {fmt(toCollect)} PKR</button>
              <button className="link small mt-12" style={{ color: 'var(--hero-muted)', alignSelf: 'center' }} disabled={!chosen.length} onClick={() => setModal('challan')}>Create a challan instead</button>
            </section>
          )}

          <section className="widget">
            <div className="widget-head"><span className="circle sm"><Icon name="wallet" size={15} /></span><span className="grow medium">Family credit</span><Circle icon="plus" size="sm" label="Add balance" onClick={() => setModal('credit')} /></div>
            <div className="widget-body"><div className="display" style={{ fontSize: 26 }}>{fmt(fam.credit)}<span className="unit"> PKR</span></div><div className="xs muted">Paid in advance — use it from the checkout</div></div>
          </section>

          <section className="widget">
            <div className="widget-head"><span className="circle sm"><Icon name="receipt" size={15} /></span><span className="grow medium">Challans</span><span className="row gap-6 xs muted">Superseded <OnOff value={showOld} onChange={setShowOld} /></span></div>
            <div className="widget-body col gap-6">
              {famChallans.map((c) => (
                <div key={c.id} className="row gap-8" style={{ padding: '8px 0', borderTop: '1px solid var(--line)', opacity: c.status === 'superseded' ? 0.6 : 1 }}>
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div className="row gap-6 wrap"><span className="mono small">{c.id}</span><span className={cx('pill', c.status === 'paid' ? 'ok' : c.status === 'unpaid' ? 'warn' : c.status === 'partly paid' ? 'info' : 'outline')} style={{ height: 20, fontSize: 10 }}>{c.status}</span>{c.advance > 0 && <span className="tag">+{c.advance}m</span>}{c.custom && <span className="tag">Custom</span>}</div>
                    <div className="xs muted">{c.scope} · issued {dateShort(c.issued)}{c.due ? ` · due ${dateShort(c.due)}` : ''}{c.paidOn ? ` · paid ${dateShort(c.paidOn)}` : ''}</div>
                  </div>
                  <span className="small strong">{fmt(c.amount)}</span>
                  <Circle icon="download" size="xs" iconSize={12} label={`Download ${c.id}`} onClick={() => { printView(); toast(`${c.id} — choose Save as PDF`, { icon: 'print' }); }} />
                </div>
              ))}
              {!famChallans.length && <div className="xs muted">No challans yet.</div>}
            </div>
          </section>

          <section className="widget">
            <div className="widget-head"><span className="circle sm"><Icon name="edit" size={15} /></span><span className="grow medium">Notes</span><div className="onoff sm"><button className={cx(noteTab === 'active' && 'on')} onClick={() => setNoteTab('active')}>Active</button><button className={cx(noteTab === 'archived' && 'on')} onClick={() => setNoteTab('archived')}>Archived</button></div></div>
            <div className="widget-body col gap-6">
              {noteTab === 'active' && <form className="row gap-6" onSubmit={(e) => { e.preventDefault(); if (draftNote.trim()) { addNote(fam.id, draftNote.trim()); setDraftNote(''); toast('Note added'); } }}><input className="input" style={{ height: 38 }} placeholder="e.g. Promised to pay on the 15th" value={draftNote} onChange={(e) => setDraftNote(e.target.value)} /><Circle icon="plus" size="sm" label="Add note" type="submit" /></form>}
              {notes.map((n) => (
                <div key={n.id} className="row top gap-8" style={{ padding: '8px 0', borderTop: '1px solid var(--line)' }}>
                  <div className="grow small">{n.text}<div className="xs muted">{n.by} · {relative(n.at)}</div></div>
                  <Circle icon={n.archived ? 'refresh' : 'inbox'} size="xs" iconSize={12} label={n.archived ? 'Restore' : 'Archive'} onClick={() => updateNote(fam.id, n.id, { archived: !n.archived })} />
                </div>
              ))}
              {!notes.length && <div className="xs muted">No {noteTab} notes.</div>}
            </div>
          </section>
        </aside>
      </div>

      <div className="collect-bar">
        <div><div className="xs muted">Collect now</div><div className="strong">{fmt(toCollect)} PKR</div></div>
        <button className="btn primary" disabled={!chosen.length || done} onClick={() => document.querySelector('.collect-checkout')?.scrollIntoView({ behavior: 'smooth' })}>Review & collect</button>
      </div>

      {invoice && done && <InvoiceModal fam={fam} school={db.school} done={done} onClose={() => setInvoice(false)} />}
      {modal === 'due' && <RecordDueModal kids={kids} onClose={() => setModal(null)} />}
      {modal === 'credit' && (
        <CreditModal onClose={() => setModal(null)} onSave={(v) => { addCredit(fam.id, v); toast(`${fmt(v.amount)} PKR added to ${fam.name}'s credit`); setModal(null); }} />
      )}
      {modal === 'challan' && (
        <ChallanModal amount={subtotal} items={chosen.length} ahead={ahead} onClose={() => setModal(null)} onSave={(dueDate) => {
          const cid = createChallan({ familyId: fam.id, scope: only === 'all' ? 'Family' : kids.find((k) => k.id === only)?.name, amount: subtotal, due: dueDate, advance: ahead });
          toast(`Challan ${cid} created · earlier unpaid challans superseded`, { icon: 'receipt' }); setModal(null); setShowOld(false);
        }} />
      )}
    </div>
  );
}

function RecordDueModal({ kids, onClose }) {
  const { recordDue, toast } = useSchool();
  const [v, setV] = useState({ studentId: kids[0]?.id, type: 'fine', label: '', amount: '', date: '2026-10-09', day: '6', end: '' });
  const types = [['fine', 'Fine', 'Late fee, lost book…'], ['custom', 'Custom charge', 'Uniform, trip, books'], ['recurring', 'Recurring', 'Bills every month'], ['fund', 'Fund', 'Paper fund, annual fund']];
  return (
    <Modal open onClose={onClose} title="Record a due" sub="Adds a charge to the bill — collect it now or later"
      footer={<><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" disabled={!Number(v.amount) || !v.label.trim()} onClick={() => { recordDue(v); toast(`${v.label} · ${fmt(v.amount)} PKR added`); onClose(); }}>Add to bill</button></>}>
      <div className="row wrap gap-6">{kids.map((s) => <button key={s.id} className={cx('chip', v.studentId === s.id && 'on')} onClick={() => setV({ ...v, studentId: s.id })}><Avatar name={s.name} id={s.id} size={22} />{s.name}</button>)}</div>
      <div className="grid g2" style={{ gap: 8 }}>{types.map(([k, l, h]) => <button key={k} className={cx('tile', v.type === k && 'sel-tile')} style={{ textAlign: 'left', cursor: 'pointer' }} onClick={() => setV({ ...v, type: k })}><div className="medium small">{l}</div><div className="xs muted">{h}</div></button>)}</div>
      <div className="form-grid">
        <Field label={v.type === 'fund' ? 'Fund name' : 'Reason'}><input className="input" autoFocus value={v.label} onChange={(e) => setV({ ...v, label: e.target.value })} placeholder={v.type === 'fine' ? 'Late fee fine' : v.type === 'recurring' ? 'Van' : v.type === 'fund' ? 'Paper fund' : 'Uniform'} /></Field>
        <Field label="Amount (PKR)"><input className="input" inputMode="numeric" value={v.amount} onChange={(e) => setV({ ...v, amount: e.target.value.replace(/\D/g, '') })} /></Field>
        <Field label={v.type === 'recurring' ? 'Starts' : 'Date'}><input className="input" type="date" value={v.date} onChange={(e) => setV({ ...v, date: e.target.value })} /></Field>
        {v.type === 'recurring' && <Field label="Bill on day"><input className="input" inputMode="numeric" value={v.day} onChange={(e) => setV({ ...v, day: e.target.value.replace(/\D/g, '').slice(0, 2) })} /></Field>}
        {v.type === 'recurring' && <Field label="Ends" optional><input className="input" type="date" value={v.end} onChange={(e) => setV({ ...v, end: e.target.value })} /></Field>}
      </div>
    </Modal>
  );
}

function CreditModal({ onClose, onSave }) {
  const [v, setV] = useState({ amount: '', reason: '', method: 'Cash', file: '' });
  return (
    <Modal open onClose={onClose} title="Add to family credit" sub="Money paid ahead — used later at checkout"
      footer={<><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" disabled={!Number(v.amount)} onClick={() => onSave({ amount: Number(v.amount), reason: v.reason || 'Advance', method: v.method })}>Add credit</button></>}>
      <Field label="Amount (PKR)"><input className="input big" autoFocus inputMode="numeric" value={v.amount} onChange={(e) => setV({ ...v, amount: e.target.value.replace(/\D/g, '') })} placeholder="0" /></Field>
      <div className="form-grid">
        <Field label="Reason"><input className="input" value={v.reason} onChange={(e) => setV({ ...v, reason: e.target.value })} placeholder="e.g. Advance for winter term" /></Field>
        <Field label="Received via"><select className="select" value={v.method} onChange={(e) => setV({ ...v, method: e.target.value })}>{METHODS.map((m) => <option key={m}>{m}</option>)}</select></Field>
      </div>
      <label className="dropzone" style={{ cursor: 'pointer' }}>{v.file || 'Attach a slip or screenshot'} <span className="xs faint">optional</span><input type="file" hidden onChange={(e) => setV({ ...v, file: e.target.files[0]?.name || '' })} /></label>
    </Modal>
  );
}

function ChallanModal({ amount, items, ahead, onClose, onSave }) {
  const [due, setDue] = useState('2026-10-15');
  return (
    <Modal open onClose={onClose} title="Create challan" sub={`${items} item${items > 1 ? 's' : ''} · ${fmt(amount)} PKR${ahead ? ` · includes ${ahead} month${ahead > 1 ? 's' : ''} ahead` : ''}`}
      footer={<><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" onClick={() => onSave(due)}><Icon name="receipt" size={15} />Create & print</button></>}>
      <Field label="Due date" hint="The late fee from Settings applies after this date"><input className="input" type="date" value={due} onChange={(e) => setDue(e.target.value)} /></Field>
      <div className="banner"><Icon name="receipt" size={16} />Any earlier unpaid challan for this family is marked superseded, so parents can only pay the latest.</div>
    </Modal>
  );
}

// Shown right after collecting, like the live invoice page: one row per paid line,
// "paid / total" for part payments, subtotal, paid amount and the payment note.
export function InvoiceModal({ fam, school, done, onClose }) {
  const { toast } = useSchool();
  const groups = [...new Set(done.lines.map((l) => l.student?.id))].map((sid) => ({ s: done.lines.find((l) => l.student?.id === sid).student, rows: done.lines.filter((l) => l.student?.id === sid) }));
  return (
    <Modal open wide onClose={onClose} title="Invoice" sub={`No. ${done.receipt} · ${dateShort(done.date)} · ${done.method}`}
      footer={<><button className="btn ghost" onClick={() => toast(`Invoice sent to ${fam.whatsapp || fam.phone} on WhatsApp`, { icon: 'whatsapp' })}><Icon name="whatsapp" size={15} />Send</button><button className="btn primary" onClick={() => { printView(); toast('Choose Save as PDF or print', { icon: 'print' }); }}><Icon name="print" size={15} />Print invoice</button></>}>
      <div className="invoice">
        <div className="row between top">
          <div><div className="medium">{school.name}</div><div className="xs muted">{school.address} · {school.phone}</div></div>
          <div className="right"><span className="pill ok">Paid</span><div className="mono small mt-4">{done.receipt}</div></div>
        </div>
        <div className="row between small mt-16"><span className="muted">Invoice to</span><span className="medium">{fam.name} ({fam.id}) · {fam.phone}</span></div>
        {groups.map(({ s, rows }) => (
          <div key={s?.id} className="mt-12">
            <span className="tag">{s?.name} ({s ? code(s) : ''})</span>
            <table className="table compact mt-8"><thead><tr><th>Purpose</th><th>Month</th><th className="num">Fee</th></tr></thead>
              <tbody>{rows.map((r, i) => <tr key={i}><td>{r.label}{r.disc ? <span className="xs muted"> · −{fmt(r.disc)} discount</span> : ''}</td><td>{r.month}</td><td className="num">{r.paid < r.owedBefore - r.disc ? `${fmt(r.paid)} / ${fmt(r.total)}` : fmt(r.paid)} PKR</td></tr>)}</tbody></table>
          </div>
        ))}
        <div className="col gap-4 mt-16" style={{ marginLeft: 'auto', width: 260 }}>
          <div className="row between small"><span className="muted">Subtotal</span><span>{fmt(done.amount)} PKR</span></div>
          {done.credit > 0 && <div className="row between small"><span className="muted">From family credit</span><span>− {fmt(done.credit)} PKR</span></div>}
          <div className="row between"><span className="medium">Paid amount</span><span className="strong ok-text">{fmt(done.cash)} PKR</span></div>
        </div>
        {done.note && <div className="mt-16 small"><div className="upper">Notes</div>{done.note}</div>}
      </div>
    </Modal>
  );
}
