import { useEffect, useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { PageHead } from '../components/Shell.jsx';
import { Drawer, Field, Modal, Seg, SwitchRow } from '../components/ui.jsx';
import { Circle, OnOff, Widget } from '../components/Bento.jsx';
import { PERMISSIONS } from '../data/seed.js';
import { downloadCsv, exportCsv } from '../lib/exporter.js';
import { useSchool } from '../lib/store.jsx';
import { cx, dateShort, fmt, relative } from '../lib/format.js';
import { SETTINGS_SECTIONS } from '../lib/nav.js';

const SECTIONS = SETTINGS_SECTIONS;

function Card({ title, sub, children, onSave }) {
  const { toast } = useSchool();
  return (
    <section className="card col gap-16" style={{ padding: 24 }}>
      <div><h2 className="h2">{title}</h2>{sub && <p className="sub">{sub}</p>}</div>
      {children}
      {onSave !== false && <div className="row" style={{ justifyContent: 'flex-end', paddingTop: 12, borderTop: '1px solid var(--line)' }}><button className="btn primary" onClick={() => { onSave?.(); toast('Settings saved'); }}>Save</button></div>}
    </section>
  );
}

export default function Settings() {
  const { section = 'school' } = useParams();
  const { db, toast } = useSchool();
  const [lateType, setLateType] = useState('fixed');
  const [toggles, setToggles] = useState({ perStudentLate: false, schoolCopy: true, trackAdmission: true, parentPhotos: true, classOnCard: true });
  const tg = (k) => (v) => setToggles({ ...toggles, [k]: v });
  const [cardColor, setCardColor] = useState('#141414');
  const cur = SECTIONS.find((s) => s[0] === section) || SECTIONS[0];
  // On phones the section list is a scrolling chip row — keep the open one visible.
  // Centre the active chip inside the strip only — scrollIntoView would also shift the page sideways.
  useEffect(() => {
    const a = document.querySelector('.settings-nav .menu-item.active');
    const strip = a?.closest('.settings-nav');
    if (a && strip && strip.scrollWidth > strip.clientWidth) strip.scrollLeft += a.getBoundingClientRect().left - strip.getBoundingClientRect().left - strip.clientWidth / 2 + a.offsetWidth / 2;
  }, [section]);

  return (
    <div className="page">
      <PageHead title="Settings" sub="Everything about how your school runs in Schooliee" />
      <div className="split">
        <nav className="card pad-s settings-nav" style={{ flex: '0 1 260px', minWidth: 220, position: 'sticky', top: 16 }}>
          {SECTIONS.map(([k, l, i]) => (
            <NavLink key={k} to={`/settings/${k}`} className={() => cx('menu-item', cur[0] === k && 'active')} style={{ height: 42 }}>
              <Icon name={i} size={16} />{l}{k === 'billing' && db.school.subscriptionOverdue && <span className="pill warn" style={{ marginLeft: 'auto', height: 20, fontSize: 10 }}>Overdue</span>}
            </NavLink>
          ))}
        </nav>
        <div className="col gap-16" style={{ flex: '1 1 560px', minWidth: 0 }}>
          {cur[0] === 'school' && (
            <Card title="School profile" sub="Shown on challans, receipts, letters and your public site.">
              <div className="row gap-16"><span className="rail-logo" style={{ width: 72, height: 72, borderRadius: 22 }}><Icon name="check" size={32} stroke={2.4} /></span><button className="btn sm">Change logo</button></div>
              <div className="form-grid">
                <Field label="School name"><input className="input" defaultValue={db.school.name} /></Field>
                <Field label="Email"><input className="input" defaultValue={db.school.email} /></Field>
                <Field label="Phone"><input className="input" defaultValue={db.school.phone} /></Field>
                <Field label="WhatsApp"><input className="input" defaultValue={db.school.whatsapp} /></Field>
                <Field label="Address" span><input className="input" defaultValue={db.school.address} /></Field>
              </div>
              <SwitchRow on={toggles.parentPhotos} onChange={tg('parentPhotos')} title="Parents can upload student photos" sub="From the parent app; you approve before they appear" />
            </Card>
          )}
          {cur[0] === 'fees' && (<>
            <Card title="Fees & challans" sub="Defaults for collection dates, late fees and challan layout.">
              <div className="form-grid">
                <Field label="Fee collection day" hint="Day of the month fees are due"><input className="input" defaultValue="6" /></Field>
                <Field label="Challan style"><select className="select" defaultValue="Detailed"><option>Detailed</option><option>Summary</option></select></Field>
                <Field label="Late fee"><Seg ink lg value={lateType} onChange={setLateType} items={[{ key: 'fixed', label: 'Fixed amount' }, { key: 'pct', label: 'Percentage' }]} /></Field>
                <Field label={lateType === 'fixed' ? 'Late fee amount (PKR)' : 'Late fee (%)'} hint="Set 0 to turn off"><input key={lateType} className="input" defaultValue={lateType === 'fixed' ? '500' : '5'} /></Field>
                <Field label="Challan expires after (days)"><input className="input" defaultValue="15" /></Field>
                <Field label="Online payments prefix" optional hint="Leave blank to turn off online payments"><input className="input" defaultValue="1234" /></Field>
                <Field label="Note printed on every challan" span><textarea className="textarea" defaultValue="Fee once paid is not refundable. Please keep this challan for your record." /></Field>
              </div>
              <SwitchRow on={toggles.perStudentLate} onChange={tg('perStudentLate')} title="Charge late fee per student on family challans" sub="Off = one late fee on the whole family challan" />
              <SwitchRow on={toggles.schoolCopy} onChange={tg('schoolCopy')} title="Print a school copy on challans" sub="Family copy + school copy on one page" />
              <SwitchRow on={toggles.trackAdmission} onChange={tg('trackAdmission')} title="Track admission fees & custom charges as dues" sub="They stay unpaid until collected through Fees" />
            </Card>
            <Card title="Bank accounts" sub="Printed on challans so parents can pay at the bank." onSave={false}>
              {db.bankAccounts.map((b) => (
                <div key={b.id} className="row gap-12" style={{ padding: 14, borderRadius: 18, border: '1px solid var(--border)' }}>
                  <span className="icon-btn" style={{ background: 'var(--surface-2)', borderColor: 'transparent' }}><Icon name="bank" size={16} /></span>
                  <span className="grow"><span className="medium" style={{ display: 'block' }}>{b.bank}</span><span className="small muted">A/C {b.account} · code {b.code} · {b.branch}</span></span>
                  <button className="btn xs">Edit</button>
                </div>
              ))}
              <button className="btn sm" style={{ alignSelf: 'flex-start' }} onClick={() => toast('Add the account details')}><Icon name="plus" size={14} />Add bank account</button>
            </Card>
          </>)}
          {cur[0] === 'idcards' && (
            <Card title="ID cards" sub="Design for student, staff and family cards.">
              <div className="row wrap gap-20">
                <div style={{ width: 200, borderRadius: 18, overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <div style={{ background: cardColor, color: '#fff', padding: 14 }} className="small medium">{db.school.short}</div>
                  <div className="col gap-8" style={{ padding: 16, alignItems: 'center', textAlign: 'center' }}>
                    <span className="av s64 c1">SA</span><span className="medium">saim</span><span className="xs muted">S0006{toggles.classOnCard ? ' · Class Three a' : ''}</span>
                    <span style={{ width: 56, height: 56, background: 'repeating-linear-gradient(90deg, var(--text) 0 3px, transparent 3px 6px)', borderRadius: 6 }} />
                  </div>
                </div>
                <div className="col gap-12" style={{ flex: '1 1 260px', minWidth: 0 }}>
                  <Field label="Orientation"><Seg ink lg value="portrait" onChange={() => {}} items={[{ key: 'portrait', label: 'Portrait' }, { key: 'landscape', label: 'Landscape' }]} /></Field>
                  <Field label="Student ID format"><select className="select"><option>Automatic school IDs (S0001)</option><option>Roll numbers</option></select></Field>
                  <Field label="Card colour" optional hint="Leave as is to use the default"><span className="row gap-8">{['#141414', '#1F4D3A', '#1E3A8A', '#7C2D12', '#6B21A8'].map((c) => <button key={c} aria-label={`Card colour ${c}`} onClick={() => setCardColor(c)} style={{ width: 32, height: 32, borderRadius: 999, border: 0, background: c, boxShadow: cardColor === c ? '0 0 0 2px var(--surface), 0 0 0 4px var(--text)' : 'none', cursor: 'pointer' }} />)}<input type="color" value={cardColor} onChange={(e) => setCardColor(e.target.value)} aria-label="Custom colour" style={{ width: 36, height: 32, border: 0, background: 'none' }} /></span></Field>
                  <SwitchRow on={toggles.classOnCard} onChange={tg('classOnCard')} title="Show class & section on the card" />
                </div>
              </div>
            </Card>
          )}
          {cur[0] === 'sessions' && <Sessions />}
          {cur[0] === 'funds' && <Funds />}
          {cur[0] === 'templates' && (
            <Card title="Print templates" sub="Pick the layout used for each printed document." onSave={false}>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
                {['Fee challan', 'Receipt', 'Admission form', 'Result card', 'Character certificate', 'Salary slip', 'Letter pad', 'ID card'].map((t, i) => (
                  <button key={t} className="card col gap-8" style={{ padding: 14, textAlign: 'left', font: 'inherit' }} onClick={() => toast(`${t} template editor opens here`)}>
                    <div className="tile" style={{ height: 90, background: i % 2 ? 'var(--surface-2)' : 'var(--accent-soft)' }} />
                    <span className="medium small">{t}</span><span className="xs muted">Classic · A4</span>
                  </button>
                ))}
              </div>
            </Card>
          )}
          {cur[0] === 'team' && <Team />}
          {cur[0] === 'students' && <StudentSettings />}
          {cur[0] === 'attendance' && <AttendanceSettings />}
          {cur[0] === 'exams' && <ExamSettings />}
          {cur[0] === 'whatsapp' && (
            <Card title="WhatsApp AI" sub="Ask about fees, attendance and staff straight from WhatsApp." onSave={false}>
              <div className="banner ok"><Icon name="sparkle" size={16} fill="currentColor" />Try: “How much fee is pending in Class Two?” or “Who was absent today?”</div>
              <div className="form-grid">
                <Field label="Owner name" optional><input className="input" placeholder="e.g. Principal" /></Field>
                <Field label="WhatsApp number"><input className="input" placeholder="+92 3XX XXXXXXX" /></Field>
              </div>
              <button className="btn primary" style={{ alignSelf: 'flex-start' }} onClick={() => toast('Verification code sent on WhatsApp')}><Icon name="whatsapp" size={15} />Connect WhatsApp</button>
            </Card>
          )}
          {cur[0] === 'activity' && <Activity />}
          {cur[0] === 'billing' && (
            <Card title="Billing & plan" onSave={false}>
              <div className="banner warn"><Icon name="warn" size={18} /><span className="grow"><strong>Payment overdue.</strong> Settle your Schooliee subscription to keep WhatsApp messages and the parent app running.</span><button className="btn sm" onClick={() => toast('Payment instructions sent to your email')}>Pay now</button></div>
              <div className="grid g3">
                <div className="tile"><div className="k">Plan</div><div className="v">Growth · up to 300 students</div></div>
                <div className="tile"><div className="k">Amount due</div><div className="v">4,500 PKR</div></div>
                <div className="tile"><div className="k">Due since</div><div className="v">1 Oct 2026</div></div>
              </div>
            </Card>
          )}
          {cur[0] === 'support' && (
            <Card title="Help & support" onSave={false}>
              <div className="grid g3">
                {[['whatsapp', 'WhatsApp us', 'Replies in minutes, 9 am – 9 pm'], ['book', 'Guides', 'Step-by-step help for every page'], ['phone', 'Call', '+92 300 0000000']].map(([i, t, d]) => (
                  <button key={t} className="card col gap-8" style={{ padding: 18, textAlign: 'left', font: 'inherit' }} onClick={() => toast(`${t} — opening`)}><Icon name={i} size={20} /><span className="medium">{t}</span><span className="small muted">{d}</span></button>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

const ROLES = ['Owner', 'Administrator', 'Accountant', 'Teacher', 'Computer operator', 'Receptionist'];
const ROLE_PRESETS = {
  Accountant: { Fees: ['view', 'collect', 'stats', 'send reminders', 'export'], Ledger: ['view', 'create income', 'create expense', 'export'], Accounting: ['view', 'export'], Reports: ['view'] },
  Teacher: { Attendance: ['view', 'mark'], Diary: ['view', 'create', 'update'], Exams: ['view', 'update'], Observations: ['view', 'create'], Timetable: ['view'] },
  'Computer operator': { Students: ['view', 'create', 'update'], Attendance: ['view', 'mark', 'scan qr'], Inquiries: ['view', 'create', 'update'] },
  Receptionist: { Inquiries: ['view', 'create', 'update', 'comment'], Students: ['view'] },
};
const permCount = (u) => (u.perms === 'all' ? 'Full control' : `${Object.values(u.perms || {}).flat().length} permissions · ${Object.keys(u.perms || {}).length} modules`);

function Team() {
  const { db, toast } = useSchool();
  const [filter, setFilter] = useState('active');
  const [edit, setEdit] = useState(null);
  const list = db.users.filter((u) => filter === 'all' || u.status === filter);
  return (
    <section className="widget" style={{ padding: 20 }}>
      <div className="row between wrap gap-12">
        <div><h2 className="h2">Team & access</h2><p className="sub">Who can sign in, what they can do, and which classes they see.</p></div>
        <div className="row gap-8">
          <div className="onoff">{['active', 'terminated', 'all'].map((k) => <button key={k} className={cx(filter === k && 'on')} onClick={() => setFilter(k)}>{k[0].toUpperCase() + k.slice(1)}</button>)}</div>
          <Circle icon="download" label="Export" onClick={() => { downloadCsv('Employees', [['Name', 'Email', 'Phone', 'Role', 'Status', 'Linked staff', 'Sections', 'Permissions'], ...db.users.map((u) => [u.name, u.email, u.phone, u.role, u.status, u.staffId || '', (u.sections || []).join(' '), permCount(u)])]); toast('Employees exported', { icon: 'download' }); }} />
          <button className="btn primary" onClick={() => setEdit({})}><Icon name="userPlus" size={15} />Add employee</button>
        </div>
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, margin: '12px 0 4px' }}>
        {[['Total employees', db.users.length], ['Active', db.users.filter((u) => u.status === 'active').length], ['Terminated', db.users.filter((u) => u.status === 'terminated').length], ['Linked to staff', db.users.filter((u) => u.staffId).length]].map(([k, v]) => <div key={k} className="tile"><div className="k">{k}</div><div className="v">{v}</div></div>)}
      </div>
      <div className="col" style={{ marginTop: 8 }}>
        {list.map((u) => {
          const staff = db.staff.find((s) => s.id === u.staffId);
          return (
            <button key={u.id} className="row gap-12" style={{ padding: '12px 4px', borderTop: '1px solid var(--line)', background: 'none', border: 0, borderTopStyle: 'solid', textAlign: 'left', font: 'inherit', color: 'inherit', cursor: 'pointer' }} onClick={() => setEdit(u)}>
              <span className="av c2">{u.name.slice(0, 2).toUpperCase()}</span>
              <span className="grow" style={{ minWidth: 0 }}><span className="medium" style={{ display: 'block' }}>{u.name}{staff && <span className="muted small" style={{ fontWeight: 400 }}> · linked to {staff.name}</span>}</span><span className="small muted ellipsis" style={{ display: 'block' }}>{u.email} · {permCount(u)}{u.sections?.length ? ` · ${u.sections.length} sections only` : ''}</span></span>
              <span className={cx('pill', u.status === 'terminated' ? 'danger' : 'outline')}>{u.status === 'terminated' ? 'Terminated' : u.role}</span>
              <Icon name="chevRight" size={16} />
            </button>
          );
        })}
      </div>
      {edit && <UserDrawer user={edit} onClose={() => setEdit(null)} />}
    </section>
  );
}

function UserDrawer({ user, onClose }) {
  const { db, addUser, updateUser, toast, classById } = useSchool();
  const isNew = !user.id;
  const [v, setV] = useState({ name: '', email: '', phone: '', role: 'Teacher', staffId: '', sections: [], perms: ROLE_PRESETS.Teacher, ...user });
  const full = v.perms === 'all';
  const perms = full ? {} : v.perms;
  const has = (m, p) => full || perms[m]?.includes(p);
  const toggle = (m, p) => { if (full) return; const cur = perms[m] || []; const next = cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]; setV({ ...v, perms: { ...perms, [m]: next } }); };
  const toggleModule = (m, all) => { if (full) return; const allOn = (perms[m] || []).length === all.length; setV({ ...v, perms: { ...perms, [m]: allOn ? [] : [...all] } }); };
  const sections = db.classes.flatMap((c) => c.sections.map((s) => [`${c.id}|${s}`, `${classById[c.id]?.name} · ${s}`]));
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  const save = () => {
    if (isNew) { addUser(v); toast(`${v.name} can now sign in — invite sent to ${v.email || 'their phone'}`); } else { updateUser(user.id, v); toast('Access updated'); }
    onClose();
  };
  return (
    <Drawer open wide onClose={onClose} title={isNew ? 'Add employee' : v.name} sub={isNew ? 'They get a sign-in invite by email & WhatsApp' : `${v.role} · ${permCount(v)}`}
      footer={<>{!isNew && (v.status === 'terminated'
        ? <button className="btn ghost" onClick={() => { updateUser(user.id, { status: 'active' }); toast('Access restored'); onClose(); }}>Restore access</button>
        : <button className="btn danger" onClick={() => { updateUser(user.id, { status: 'terminated' }); toast('Access removed'); onClose(); }}><Icon name="lock" size={15} />Remove access</button>)}
        <div className="grow" /><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" disabled={!v.name} onClick={save}>{isNew ? 'Add & invite' : 'Save'}</button></>}>
      <div className="form-grid">
        <Field label="Name"><input className="input" value={v.name} onChange={set('name')} /></Field>
        <Field label="Role"><select className="select" value={v.role} onChange={(e) => { const r = e.target.value; setV({ ...v, role: r, perms: r === 'Owner' || r === 'Administrator' ? 'all' : ROLE_PRESETS[r] || {} }); }}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select></Field>
        <Field label="Email"><input className="input" value={v.email} onChange={set('email')} /></Field>
        <Field label="Phone"><input className="input" value={v.phone} onChange={set('phone')} /></Field>
        <Field label="Linked staff member" optional hint="Their attendance and timetable come from this profile" span><select className="select" value={v.staffId || ''} onChange={set('staffId')}><option value="">Not linked</option>{db.staff.filter((s) => s.status === 'active').map((s) => <option key={s.id} value={s.id}>{s.name} · {s.role}</option>)}</select></Field>
      </div>
      <div className="col gap-8">
        <div className="row between"><span className="label">Restrict to sections</span><span className="xs muted">{v.sections.length ? `${v.sections.length} selected` : 'All sections'}</span></div>
        <div className="row wrap gap-6">{sections.map(([k, l]) => { const on = v.sections.includes(k); return <button key={k} className={cx('chip sm', on && 'on')} onClick={() => setV({ ...v, sections: on ? v.sections.filter((x) => x !== k) : [...v.sections, k] })}>{l}</button>; })}</div>
      </div>
      <div className="row between" style={{ padding: '12px 14px', borderRadius: 16, background: 'var(--surface-2)' }}>
        <span><span className="medium" style={{ display: 'block' }}>Full control</span><span className="xs muted">Everything, including settings and billing</span></span>
        <OnOff value={full} onChange={(on) => setV({ ...v, perms: on ? 'all' : ROLE_PRESETS[v.role] || {} })} />
      </div>
      <div className="col" style={{ opacity: full ? 0.45 : 1, pointerEvents: full ? 'none' : 'auto' }}>
        {PERMISSIONS.map(([m, list]) => {
          const n = full ? list.length : (perms[m] || []).length;
          return (
            <div key={m} className="row wrap gap-8" style={{ padding: '10px 0', borderTop: '1px solid var(--line)' }}>
              <button className="row gap-8" style={{ width: 150, background: 'none', border: 0, font: 'inherit', color: 'inherit', textAlign: 'left', cursor: 'pointer', padding: 0 }} onClick={() => toggleModule(m, list)}>
                <span className={cx('check-dot', n === list.length && 'on')} style={{ width: 16, height: 16, borderRadius: 5, border: '1.5px solid var(--border-strong, var(--border))', background: n === list.length ? 'var(--sel)' : n ? 'var(--quiet)' : 'transparent' }} />
                <span className="medium small">{m}</span>
              </button>
              <div className="row wrap gap-4 grow">{list.map((p) => <button key={p} className={cx('chip sm', has(m, p) && 'on')} style={{ height: 28, fontSize: 12 }} onClick={() => toggle(m, p)}>{p}</button>)}</div>
            </div>
          );
        })}
      </div>
    </Drawer>
  );
}

function Funds() {
  const { db, addFund, updateFund, toast, classById } = useSchool();
  const [edit, setEdit] = useState(null);
  const total = (f) => db.classes.reduce((s, c) => s + (f.amounts[c.id] || 0) * db.students.filter((x) => x.classId === c.id && x.status === 'active').length, 0);
  return (
    <section className="widget" style={{ padding: 20 }}>
      <div className="row between wrap gap-12">
        <div><h2 className="h2">Funds</h2><p className="sub">One-off amounts per class — paper fund, annual fund. Added to each student’s dues when charged.</p></div>
        <div className="row gap-8"><Circle icon="download" label="Export" onClick={() => { downloadCsv('Funds', [['Fund', ...db.classes.map((c) => c.name), 'Created by', 'Created'], ...db.funds.map((f) => [f.name, ...db.classes.map((c) => f.amounts?.[c.id] || ''), f.by, f.created])]); toast('Funds exported', { icon: 'download' }); }} />
        <button className="btn primary" onClick={() => setEdit({ name: '', amounts: {} })}><Icon name="plus" size={15} />New fund</button></div>
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, marginTop: 12 }}>
        {[['Total funds', db.funds.length], ['Assigned', db.funds.filter((f) => Object.values(f.amounts || {}).some(Boolean)).length], ['Unassigned', db.funds.filter((f) => !Object.values(f.amounts || {}).some(Boolean)).length], ['Class assignments', db.funds.reduce((a, f) => a + Object.values(f.amounts || {}).filter(Boolean).length, 0)]].map(([k, v]) => <div key={k} className="tile"><div className="k">{k}</div><div className="v">{v}</div></div>)}
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10, marginTop: 8 }}>
        {db.funds.map((f) => {
          const cls = Object.entries(f.amounts || {}).filter(([, a]) => a);
          return (
            <button key={f.id} className="tile col gap-8" style={{ textAlign: 'left', font: 'inherit', color: 'inherit', border: 0, cursor: 'pointer' }} onClick={() => setEdit(f)}>
              <div className="row between"><span className="medium">{f.name}</span><span className="circle sm"><Icon name="fund" size={14} /></span></div>
              <div className="xs muted">{cls.length ? cls.map(([c, a]) => `${classById[c]?.name}: ${fmt(a)}`).join(' · ') : 'No class amounts yet'}</div>
              <div className="row between xs"><span className="muted">Expected</span><span className="strong">{fmt(total(f))} PKR</span></div>
              <div className="xs faint">by {f.by} · {f.created}</div>
            </button>
          );
        })}
      </div>
      {edit && (
        <Modal open wide onClose={() => setEdit(null)} title={edit.id ? edit.name : 'New fund'} sub="Leave a class blank if it doesn’t pay this fund"
          footer={<><button className="btn ghost" onClick={() => setEdit(null)}>Cancel</button><button className="btn primary" disabled={!edit.name || !Object.values(edit.amounts || {}).some(Boolean)} title="Give at least one class an amount" onClick={() => { if (edit.id) updateFund(edit.id, edit); else addFund(edit); toast(edit.id ? 'Fund updated' : `${edit.name} created`); setEdit(null); }}>{edit.id ? 'Save' : 'Create fund'}</button></>}>
          <Field label="Fund name"><input className="input" autoFocus value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} placeholder="e.g. Paper fund" /></Field>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 10 }}>
            {db.classes.map((c) => <Field key={c.id} label={c.name}><input className="input" inputMode="numeric" placeholder="0" value={edit.amounts[c.id] || ''} onChange={(e) => setEdit({ ...edit, amounts: { ...edit.amounts, [c.id]: Number(e.target.value.replace(/\D/g, '')) } })} /></Field>)}
          </div>
          <button className="btn sm ghost" style={{ alignSelf: 'flex-start' }} onClick={() => { const first = Object.values(edit.amounts).find(Boolean) || 0; setEdit({ ...edit, amounts: Object.fromEntries(db.classes.map((c) => [c.id, first])) }); }}>Same amount for every class</button>
        </Modal>
      )}
    </section>
  );
}

function ListEditor({ items, onChange, placeholder, render }) {
  return (
    <div className="col gap-6">
      {items.map((it, i) => (
        <div key={i} className="row gap-8" style={{ padding: '8px 10px 8px 14px', borderRadius: 14, background: 'var(--surface-2)' }}>
          <span className="grow small">{render ? render(it) : it}</span>
          <Circle icon="close" size="xs" iconSize={11} label="Remove" onClick={() => onChange(items.filter((_, j) => j !== i))} />
        </div>
      ))}
      <form className="row gap-6" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.target); const val = f.get('v')?.toString().trim(); if (val) { onChange([...items, render ? { label: val, amount: Number(f.get('a')) || 0 } : val]); e.target.reset(); } }}>
        <input name="v" className="input" style={{ height: 40 }} placeholder={placeholder} />
        {render && <input name="a" className="input" style={{ height: 40, width: 120 }} inputMode="numeric" placeholder="Amount" />}
        <Circle icon="plus" size="sm" label="Add" type="submit" />
      </form>
    </div>
  );
}

function StudentSettings() {
  const { db, updateSettings, toast } = useSchool();
  const st = db.settings;
  return (
    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
      <Widget icon="edit" title="Custom fields" count={st.customFieldKeys.length}>
        <div className="xs muted">Extra fields on every student profile — van route, previous school…</div>
        <ListEditor items={st.customFieldKeys} placeholder="New field name" onChange={(v) => { updateSettings({ customFieldKeys: v }); toast('Custom fields updated'); }} />
      </Widget>
      <Widget icon="receipt" title="Charge presets" count={st.chargePresets.length}>
        <div className="xs muted">One-tap charges when adding a student or a one-time charge.</div>
        <ListEditor items={st.chargePresets} placeholder="Charge name" render={(c) => <span className="row between"><span>{c.label}</span><span className="strong">{fmt(c.amount)} PKR</span></span>} onChange={(v) => { updateSettings({ chargePresets: v }); toast('Charge presets updated'); }} />
      </Widget>
    </div>
  );
}

function AttendanceSettings() {
  const { db, updateSettings, toast } = useSchool();
  const st = db.settings;
  const [v, setV] = useState({ schoolStart: st.schoolStart, schoolEnd: st.schoolEnd, lateAfter: st.lateAfter });
  return (
    <Card title="Attendance" sub="Used by QR check-in and staff attendance to decide who is late." onSave={() => updateSettings(v)}>
      <div className="form-grid">
        <Field label="School starts"><input className="input" type="time" value={v.schoolStart} onChange={(e) => setV({ ...v, schoolStart: e.target.value })} /></Field>
        <Field label="School ends"><input className="input" type="time" value={v.schoolEnd} onChange={(e) => setV({ ...v, schoolEnd: e.target.value })} /></Field>
        <Field label="Mark late after" hint="Check-ins after this time are marked Late"><input className="input" type="time" value={v.lateAfter} onChange={(e) => setV({ ...v, lateAfter: e.target.value })} /></Field>
      </div>
      <SwitchRow on={st.alerts['Attendance alerts']?.[0]} onChange={(on) => { updateSettings({ alerts: { ...st.alerts, 'Attendance alerts': [on, ...st.alerts['Attendance alerts'].slice(1)] } }); toast(on ? 'Parents will be alerted' : 'Alerts off'); }} title="WhatsApp parents when a child is absent or late" sub="The app always notifies — more channels in Messages → Automations" />
    </Card>
  );
}

function ExamSettings() {
  const { db, updateSettings, toast } = useSchool();
  return (
    <Card title="Exams & roll slips" sub="Instructions printed on every roll number slip." onSave={false}>
      <ListEditor items={db.settings.slipInstructions} placeholder="New instruction" onChange={(v) => { updateSettings({ slipInstructions: v }); toast('Slip instructions updated'); }} />
      <div className="xs muted">Grading scheme lives on each exam’s “Subjects & grading” tab.</div>
    </Card>
  );
}

const SESSION_START = { n1: '2026-07-08T09:51', n2: '2026-10-09T00:06', kg: '2026-10-09T00:07', c1: '2026-09-19T10:38', c2: '2026-05-23T12:45', c3: '2026-05-23T12:45', c4: '2025-10-08T14:29', c5: '2026-10-09T00:07', c6: '2026-10-09T00:08', c9: '2026-10-06T10:44' };

function Sessions() {
  const { db, toast, endClassSession } = useSchool();
  const [cls, setCls] = useState('all');
  const [status, setStatus] = useState('all');
  const [ending, setEnding] = useState(null);
  const resultPct = (cid) => {
    const ex = db.exams.filter((e) => e.classId === cid && Object.keys(e.results).length);
    const vals = ex.flatMap((e) => Object.values(e.results).map((r) => { const got = Object.values(r).reduce((a, v) => a + (Number(v) || 0), 0); const max = e.subjects.reduce((a, [, m]) => a + m, 0); return max ? (got / max) * 100 : 0; }));
    return vals.length ? Math.round(vals.reduce((a, v) => a + v, 0) / vals.length) : 0;
  };
  const rows = db.classes.flatMap((c) => {
    const ended = (db.sessionLog || []).filter((x) => x.classId === c.id);
    const starts = [SESSION_START[c.id] || '2026-04-01T08:00', ...ended.map((x) => x.ended)];
    return starts.map((st, i) => ({ c, start: st, end: ended[i]?.ended || null, current: i === starts.length - 1 }));
  }).filter((r) => (cls === 'all' || r.c.id === cls) && (status === 'all' || (status === 'current') === r.current))
    .sort((a, b) => b.start.localeCompare(a.start));
  const all = db.classes.length + (db.sessionLog || []).length;
  const avg = Math.round(db.classes.reduce((a, c) => a + resultPct(c.id), 0) / db.classes.length);
  return (
    <section className="widget" style={{ padding: 20 }}>
      <div className="row between wrap gap-12">
        <div><h2 className="h2">Sessions</h2><p className="sub">Each class runs its own session. End it after promotion — results and fee history stay with the old session.</p></div>
        <Circle icon="download" label="Export" onClick={() => { exportCsv('Sessions'); toast('Sessions exported', { icon: 'download' }); }} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, margin: '12px 0' }}>
        {[['Total sessions', all], ['Current', db.classes.length], ['Previous', (db.sessionLog || []).length], ['Average results', `${avg}%`]].map(([k, v]) => <div key={k} className="tile"><div className="k">{k}</div><div className="v">{v}</div></div>)}
      </div>
      <div className="row gap-8 wrap" style={{ marginBottom: 8 }}>
        <select className="select" value={cls} onChange={(e) => setCls(e.target.value)} aria-label="Class"><option value="all">All classes</option>{db.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <div className="onoff">{[['all', 'All'], ['current', 'Current'], ['previous', 'Previous']].map(([k, l]) => <button key={k} className={cx(status === k && 'on')} onClick={() => setStatus(k)}>{l}</button>)}</div>
      </div>
      <div className="table-wrap"><table className="table"><thead><tr><th>Class</th><th className="num">Sections</th><th>Session started</th><th>Session ended</th><th>Status</th><th className="num">Results</th><th /></tr></thead>
        <tbody>{rows.map((r) => (
          <tr key={r.c.id + r.start}>
            <td className="medium">{r.c.name}</td><td className="num">{r.c.sections.length}</td>
            <td className="nowrap">{dateShort(r.start)}</td><td className="nowrap muted">{r.end ? dateShort(r.end) : '—'}</td>
            <td>{r.current ? <span className="pill ok">Current</span> : <span className="pill outline">Previous</span>}</td>
            <td className="num">{r.current ? `${resultPct(r.c.id)}%` : '—'}</td>
            <td className="num">{r.current && <button className="btn xs ghost" onClick={() => setEnding(r.c)}>End session</button>}</td>
          </tr>
        ))}</tbody></table></div>
      {ending && (
        <Modal open onClose={() => setEnding(null)} title={`End ${ending.name} session?`} sub="A new session starts today. Promote students first from Classes."
          footer={<><button className="btn ghost" onClick={() => setEnding(null)}>Cancel</button><button className="btn primary" onClick={() => { endClassSession(ending.id); toast(`${ending.name}: new session started`); setEnding(null); }}>End & start new</button></>}>
          <div className="small muted">Results ({resultPct(ending.id)}% average) and fee history stay attached to the old session and remain in Reports.</div>
        </Modal>
      )}
    </section>
  );
}

function Activity() {
  const { db, toast } = useSchool();
  const [role, setRole] = useState('All');
  const roleOf = (who) => db.users.find((u) => u.name === who)?.role || 'Owner';
  const roles = ['All', ...new Set(db.users.map((u) => u.role))];
  const [range, setRange] = useState('all');
  const since = { today: '2026-10-09', week: '2026-10-03', month: '2026-10-01', all: '' }[range];
  const list = db.activity.filter((a) => (role === 'All' || roleOf(a.who) === role) && a.when >= since);
  const people = [...new Set(list.map((a) => a.who))];
  return (
    <section className="widget" style={{ padding: 20 }}>
      <div className="row between wrap gap-12">
        <div><h2 className="h2">Activity log</h2><p className="sub">Every change made by your team.</p></div>
        <div className="row gap-8"><select className="select" value={range} onChange={(e) => setRange(e.target.value)} aria-label="Date range"><option value="today">Today</option><option value="week">Last 7 days</option><option value="month">This month</option><option value="all">All time</option></select><select className="select" value={role} onChange={(e) => setRole(e.target.value)} aria-label="Role">{roles.map((r) => <option key={r}>{r}</option>)}</select><Circle icon="download" label="Export" onClick={() => { exportCsv('Activity log'); toast('Activity log exported', { icon: 'download' }); }} /></div>
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, margin: '12px 0' }}>
        {[['Total activities', list.length], ['Active users', people.length], ['Activity types', new Set(list.map((a) => a.what.split(' ').slice(0, 2).join(' '))).size], ['Today', list.filter((a) => a.when.startsWith('2026-10-09')).length]].map(([k, v]) => <div key={k} className="tile"><div className="k">{k}</div><div className="v">{v}</div></div>)}
      </div>
      {list.length > 0 && (
        <div className="table-wrap"><table className="table"><thead><tr><th>Created by</th><th>Activity</th><th>Date</th></tr></thead>
          <tbody>{list.map((a) => <tr key={a.id}><td><span className="medium">{a.who}</span><div className="xs muted">{roleOf(a.who)}</div></td><td>{a.what}</td><td className="nowrap muted">{relative(a.when)}</td></tr>)}</tbody></table></div>
      )}
      {!list.length && <div className="small muted" style={{ padding: 20 }}>Nothing from this role yet.</div>}
    </section>
  );
}
