import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import { Circle } from '../../components/Bento.jsx';
import { Avatar, Empty } from '../../components/ui.jsx';
import { useSchool, dueOf, code } from '../../lib/store.jsx';
import { avClass, cx, dateShort, fmt, initials, relative, time } from '../../lib/format.js';
import { discountAmount, discountLabel, monthlyBill } from '../../lib/student.js';
import NotFound from '../NotFound.jsx';
import { Row, historyFor } from './StudentProfile.jsx';
import { CreditModal, EditFamily } from './FamilyModals.jsx';
import { exportCsv, printView } from '../../lib/exporter.js';

const ATT = { P: 'Present', L: 'Late', A: 'Absent', V: 'Leave' };

export default function FamilyProfile() {
  const { id } = useParams();
  const nav = useNavigate();
  const { db, kidsOf, familyDue, classById, todayAtt, open, toast, updateFamily, addNote, updateNote } = useSchool();
  const [view, setView] = useState('All');
  const [modal, setModal] = useState(null);
  const [hideCredit, setHideCredit] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteView, setNoteView] = useState('active');
  const [histMonth, setHistMonth] = useState('Oct 2026');
  const [link, setLink] = useState(null);
  const [hideInsight, setHideInsight] = useState(false);
  const f = db.families.find((x) => x.id === id);
  if (!f) return <NotFound />;

  const kids = kidsOf(f.id);
  const allKids = db.students.filter((s) => s.familyId === f.id);
  const due = familyDue(f.id);
  const bill = kids.reduce((a, k) => a + monthlyBill(k, classById[k.classId]), 0);
  const payments = db.ledger.filter((l) => l.ref.startsWith(f.id));
  const notes = (f.notes || []).filter((n) => (noteView === 'active' ? !n.archived : n.archived)).sort((a, b) => (b.pinned - a.pinned) || b.at.localeCompare(a.at));
  const messages = db.announcements.filter((a) => a.body.includes(f.name) || kids.some((k) => a.body.includes(k.name)));
  const months = [...new Set(allKids.flatMap((k) => (k.history || []).map((h) => h.month).filter(Boolean)))];
  const missing = [['Mother’s name', f.mother], ['Address', f.address], ['Occupation', f.occupation], ['Email', f.email]].filter(([, v]) => !v).map(([k]) => k);
  const activity = [
    ...payments.map((p) => ({ k: p.id, icon: 'cash', tone: 'ok', title: `Paid ${fmt(p.amount)} PKR`, sub: `${p.method} · ${p.category}`, when: p.date })),
    ...messages.map((m) => ({ k: m.id, icon: 'whatsapp', tone: f.waVerified ? 'ok' : 'warn', title: `“${m.title}”`, sub: f.waVerified ? 'Delivered on WhatsApp and app' : 'WhatsApp skipped — number not verified', when: `${m.date}T09:00` })),
    ...db.activity.filter((a) => a.what.includes(f.id) || a.what.includes(f.name)).map((a) => ({ k: a.id, icon: 'edit', tone: 'muted', title: `${a.who} ${a.what}`, sub: '', when: a.when })),
    ...(f.notes || []).map((n) => ({ k: n.id, icon: 'doc', tone: 'muted', title: `Note by ${n.by}`, sub: n.text, when: n.at })),
  ].sort((a, b) => b.when.localeCompare(a.when));

  const MONTHS6 = ['May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026', 'Sep 2026', 'Oct 2026'];
  const cellOf = (k, m) => {
    const billed = (k.history || []).filter((h) => h.kind === 'charge' && h.month === m).reduce((x, h) => x + h.amount, 0);
    if (!billed) return null;
    const open = k.dues.filter((d) => d.month === m).reduce((x, d) => x + d.amount, 0);
    return { billed, open, state: !open ? 'paid' : open < billed ? 'part' : 'due' };
  };
  const collect = () => nav(`/finance/fees/${f.id}`);

  return (
    <div className="page family-page">
      <div className="row between wrap gap-12">
        <Link to="/students/families" className="back-pill"><span className="circle xs"><Icon name="chevLeft" size={14} /></span>Families</Link>
        <div className="row wrap gap-8">
          <div className="toolrow">
            <Circle icon="edit" label="Edit family" onClick={() => setModal('edit')} />
            <Circle icon="userPlus" label="Add child" onClick={() => nav(`/students/new?family=${f.id}`)} />
            <Circle icon="whatsapp" label="Message parents" onClick={() => open('compose', { familyId: f.id })} />
            {f.whatsapp && !f.waVerified && <Circle icon="check" label="Verify WhatsApp" onClick={() => { updateFamily(f.id, { waVerified: true }); toast('Verification code sent · marked verified'); }} />}
            <Circle icon="print" label="Fee statement" onClick={() => { printView(); toast('Family fee statement — choose Save as PDF', { icon: 'print' }); }} />
            <Circle icon="idcard" label="Family card" onClick={() => toast('Family card sent to printer', { icon: 'idcard' })} />
          </div>
          {due > 0
            ? <button className="btn primary" onClick={collect}><Icon name="cash" size={16} />Collect {fmt(due)}</button>
            : <button className="btn" onClick={collect}><Icon name="receipt" size={16} />Fee page</button>}
        </div>
      </div>

      <header className="family-head">
        <div className="eyebrow">Family · {f.id}</div>
        <h1 className="family-name">The {f.name} family</h1>
        <div className="row wrap gap-8 mt-12">
          <span className="chip-static"><Icon name="phone" size={13} />{f.phone}</span>
          {f.whatsapp ? <span className={cx('chip-static', !f.waVerified && 'warn-chip')}><Icon name="whatsapp" size={13} />{f.waVerified ? 'WhatsApp verified' : 'WhatsApp not verified'}</span> : <span className="chip-static">No WhatsApp</span>}
          <span className="chip-static">{f.app ? 'Parent app installed' : 'No parent app'}</span>
          {f.address && <span className="chip-static"><Icon name="pin" size={13} />{f.address}</span>}
        </div>
      </header>

      {f.emailInvalidOn && f.email && (
        <div className="banner warn"><Icon name="mail" size={16} /><span className="grow">Email <b>{f.email}</b> was marked invalid on {dateShort(f.emailInvalidOn)}, so emails to this family are skipped.</span><button className="btn sm" onClick={() => { updateFamily(f.id, { emailInvalidOn: null }); toast('Email marked valid'); }}>Mark email valid</button></div>
      )}

      {/* The children are the heart of a family page */}
      <section className="family-kids">
        {kids.map((k) => {
          const kc = classById[k.classId];
          const kd = dueOf(k);
          const att = historyFor(k.id, k.admitted, 10);
          const n = Object.keys(att).length;
          const rate = n ? Math.round((Object.values(att).filter((v) => v === 'P' || v === 'L').length / n) * 100) : null;
          const ex = db.exams.filter((e) => e.results[k.id]).sort((x, y) => y.date.localeCompare(x.date))[0];
          const pct = ex ? Math.round((ex.subjects.reduce((x, [sn]) => x + (ex.results[k.id][sn] || 0), 0) / ex.subjects.reduce((x, [, m]) => x + m, 0)) * 100) : null;
          return (
            <Link key={k.id} to={`/students/${k.id}`} className="kid-card">
              <div className="row gap-12">
                <Avatar name={k.name} id={k.id} size={56} />
                <div className="grow" style={{ minWidth: 0 }}><div className="kid-name">{k.name}</div><div className="xs muted">{code(k)} · {kc?.name} {k.section}{k.roll ? ` · Roll ${k.roll}` : ''}</div></div>
                <span className="circle xs" style={{ boxShadow: 'none' }}><Icon name="arrowUpRight" size={12} /></span>
              </div>
              <div className="kid-stats">
                <div><span className="xs muted">Attendance</span><b>{rate == null ? '—' : `${rate}%`}</b></div>
                <div><span className="xs muted">Last result</span><b>{pct == null ? '—' : `${pct}%`}</b></div>
                <div><span className="xs muted">Owes</span><b className={kd ? 'danger-text' : ''}>{kd ? fmt(kd) : 'Clear'}</b></div>
              </div>
              <div className="xs muted">{todayAtt[k.id] ? `Today: ${ATT[todayAtt[k.id]]}` : 'Today: not marked'} · {fmt(monthlyBill(k, kc))}/month{discountAmount(k, kc) ? ` · ${discountLabel(k)} off` : ''}</div>
            </Link>
          );
        })}
        <Link to={`/students/new?family=${f.id}`} className="kid-card add">
          <span className="circle"><Icon name="plus" size={18} /></span><span className="small medium">Add a sibling</span>
        </Link>
      </section>

      <div className="family-cols">
        <div className="col gap-16" style={{ minWidth: 0 }}>
          <section className="record-sec">
            <div className="record-head"><h2 className="h2 sm">Money</h2><div className="grow" /><button className="btn sm ghost" onClick={() => setModal('credit')}><Icon name="plus" size={14} />Add credit</button><button className="btn sm" onClick={collect}>Open fee page</button></div>
            <div className="record-numbers">
              <div><span className="xs muted">Owes today</span><span className={cx('display', due && 'danger-text')}>{fmt(due)}</span><span className="xs muted">{kids.filter((k) => dueOf(k)).length} of {kids.length} children</span></div>
              <div><span className="xs muted">Credit</span><span className="display">{hideCredit ? '••••' : fmt(f.credit)}</span><button className="link xs" style={{ alignSelf: 'flex-start' }} onClick={() => setHideCredit(!hideCredit)}>{hideCredit ? 'Show' : 'Hide'}</button></div>
              <div><span className="xs muted">Paid to date</span><span className="display">{fmt(f.paidTotal)}</span><span className="xs muted">{payments.length} payments</span></div>
              <div><span className="xs muted">Monthly bill</span><span className="display">{fmt(bill)}</span><span className="xs muted">all children</span></div>
            </div>
            <div className="fee-grid mt-16" style={{ gridTemplateColumns: `140px repeat(${MONTHS6.length}, minmax(60px, 1fr))` }}>
              <span />{MONTHS6.map((m) => <span key={m} className="xs muted" style={{ textAlign: 'center' }}>{m.slice(0, 3)}</span>)}
              {allKids.map((k) => [
                <span key={k.id} className="small medium ellipsis">{k.name}</span>,
                ...MONTHS6.map((m) => { const c = cellOf(k, m); return <span key={k.id + m} className={cx('fee-cell', c?.state)} title={c ? `${m}: billed ${fmt(c.billed)}${c.open ? ` · ${fmt(c.open)} due` : ' · paid'}` : `${m}: not enrolled`}>{c ? (c.state === 'paid' ? '✓' : fmt(c.open)) : ''}</span>; }),
              ])}
            </div>
            <div className="row gap-12 xs muted mt-8"><span className="row gap-4"><span className="fee-cell paid dot" />Paid</span><span className="row gap-4"><span className="fee-cell part dot" />Part paid</span><span className="row gap-4"><span className="fee-cell due dot" />Due</span></div>
          </section>

          <section className="record-sec">
            <div className="record-head"><h2 className="h2 sm">Payments</h2><div className="grow" /><Circle icon="download" size="sm" label="Export" onClick={() => { exportCsv('Family payments'); toast('Payments exported', { icon: 'download' }); }} /></div>
            {payments.length ? payments.map((p) => (
              <Row key={p.id} icon="arrowDown" tone="ok" title={`${fmt(p.amount)} PKR · ${p.method}`} sub={`${dateShort(p.date)} ${time(p.date)} · ${p.category} · ${p.reason}${p.receipt ? ` · ${p.receipt}` : ''}`}
                right={<Circle icon="print" size="xs" iconSize={12} label="Receipt" onClick={() => { printView(); toast('Receipt — choose Save as PDF', { icon: 'print' }); }} />} />
            )) : <Empty icon="receipt" title="No payments yet" />}
          </section>

          <section className="record-sec">
            <div className="record-head"><h2 className="h2 sm">Timeline</h2><div className="grow" /><div className="onoff">{['All', 'Messages'].map((x) => <button key={x} className={cx(view === x && 'on')} onClick={() => setView(x)}>{x}</button>)}</div></div>
            {(view === 'Messages' ? activity.filter((a) => a.icon === 'whatsapp') : activity).slice(0, 25).map((a) => <Row key={a.k} icon={a.icon} tone={a.tone} title={a.title} sub={a.sub} right={<span className="xs muted nowrap">{relative(a.when)}</span>} />)}
          </section>
        </div>

        <div className="col gap-16" style={{ minWidth: 0 }}>
          <section className="record-sec">
            <div className="record-head"><h2 className="h2 sm">Guardians</h2><div className="grow" /></div>
            <div className="guardian-pair">
              <div><div className="xs muted">Father / guardian</div><div className="medium mt-4">{f.name}</div><div className="xs muted mt-4">{f.cnic || 'CNIC not added'}{f.occupation ? ` · ${f.occupation}` : ''}</div></div>
              <div><div className="xs muted">Mother</div><div className="medium mt-4">{f.mother || <button className="link small" onClick={() => setModal('edit')}>+ Add</button>}</div><div className="xs muted mt-4">{f.motherCnic || ''}{f.motherOccupation ? ` · ${f.motherOccupation}` : ''}</div></div>
            </div>
            <dl className="student-dl mt-12">
              {[['Phone', f.phone], ['WhatsApp', f.whatsapp], ['Email', f.email], ['Caste', f.caste], ['Address', f.address]].map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v || <button className="add" onClick={() => setModal('edit')}>+ Add</button>}</dd></div>)}
            </dl>
            <div className="row gap-6 mt-12">
              <a className="btn sm ghost" href={`tel:${f.phone}`}><Icon name="phone" size={14} />Call</a>
              {f.whatsapp && <a className="btn sm ghost" href={`https://wa.me/${f.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"><Icon name="whatsapp" size={14} />WhatsApp</a>}
              {!f.app && <button className="btn sm ghost" onClick={() => toast('App invite sent on WhatsApp')}>Invite to app</button>}
            </div>
          </section>

          <section className="record-sec">
            <div className="record-head"><h2 className="h2 sm">Notes</h2><div className="grow" /><div className="onoff sm"><button className={cx(noteView === 'active' && 'on')} onClick={() => setNoteView('active')}>Active</button><button className={cx(noteView === 'archived' && 'on')} onClick={() => setNoteView('archived')}>Archived</button></div></div>
            {noteView === 'active' && (
              <div className="row gap-6">
                <input className="input" style={{ height: 40 }} placeholder="Log a call or a promise…" value={noteText} onChange={(e) => setNoteText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && noteText.trim()) { addNote(f.id, noteText.trim()); setNoteText(''); } }} />
                <Circle icon="plus" size="sm" label="Add note" onClick={() => { if (noteText.trim()) { addNote(f.id, noteText.trim()); setNoteText(''); toast('Note added'); } }} />
              </div>
            )}
            {notes.map((n) => (
              <div key={n.id} className="row top gap-8" style={{ padding: '10px 0', borderTop: '1px solid var(--line)' }}>
                <div className="grow small" style={{ lineHeight: 1.5 }}>{n.pinned && <Icon name="pin" size={12} />} {n.text}<div className="xs muted">{n.by} · {relative(n.at)}</div></div>
                {!n.archived && <Circle icon="pin" size="xs" iconSize={12} label={n.pinned ? 'Unpin' : 'Pin'} tone={n.pinned ? 'solid' : undefined} onClick={() => updateNote(f.id, n.id, { pinned: !n.pinned })} />}
                <Circle icon={n.archived ? 'refresh' : 'folder'} size="xs" iconSize={12} label={n.archived ? 'Restore' : 'Archive'} onClick={() => updateNote(f.id, n.id, { archived: !n.archived, pinned: false })} />
              </div>
            ))}
            {!notes.length && <div className="small muted mt-8">{noteView === 'active' ? 'No notes yet.' : 'Nothing archived.'}</div>}
          </section>

          <section className="record-sec">
            <div className="record-head"><h2 className="h2 sm">WhatsApp AI</h2></div>
            <p className="small muted" style={{ lineHeight: 1.5 }}>Parents ask about fees, attendance and results on WhatsApp — answered from this family’s records.</p>
            {link
              ? <div className="row gap-6 mt-8"><input className="input" style={{ height: 40, fontSize: 12 }} readOnly value={link} /><Circle icon="copy" size="sm" label="Copy link" onClick={() => { navigator.clipboard?.writeText(link).catch(() => {}); toast('Link copied', { icon: 'copy' }); }} /></div>
              : <button className="btn sm mt-8" onClick={() => setLink(`https://wa.me/923001234567?text=JOIN-${f.id}`)}><Icon name="link" size={14} />Generate link</button>}
          </section>
        </div>
      </div>

      {modal === 'edit' && <EditFamily f={f} onClose={() => setModal(null)} />}
      {modal === 'credit' && <CreditModal f={f} onClose={() => setModal(null)} />}
    </div>
  );
}
