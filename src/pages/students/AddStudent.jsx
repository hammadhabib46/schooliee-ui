import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import { BackBar } from '../../components/Profile.jsx';
import { Avatar, Field, Search, Seg, SwitchRow } from '../../components/ui.jsx';
import { useSchool } from '../../lib/store.jsx';
import { cx, fmt, initials } from '../../lib/format.js';
import { printView } from '../../lib/exporter.js';

const STEPS = ['Student', 'Family', 'Fees & review'];

export default function AddStudent() {
  const { db, kidsOf, addStudent, collectPayment, moveInquiry, toast } = useSchool();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const pre = db.classes.find((c) => c.name === params.get('class'));
  const [step, setStep] = useState(0);
  const [more, setMore] = useState(false);
  const [st, setSt] = useState({ name: params.get('name') || '', gender: params.get('gender') || 'Male', classId: pre?.id || '', section: pre?.sections[0] || '', dob: '', roll: '', religion: 'Islam', bform: '', prevSchool: '', prevClass: '', prevResult: '', note: '' });
  const [famMode, setFamMode] = useState(params.get('family') ? 'existing' : 'existing');
  const [familyId, setFamilyId] = useState(params.get('family') || null);
  const [fq, setFq] = useState('');
  const [nf, setNf] = useState({ name: params.get('guardian') || '', phone: params.get('phone') || '', whatsapp: '', sameWa: true, cnic: '', mother: '', occupation: '', address: '' });
  const [discount, setDiscount] = useState('0');
  const [admFee, setAdmFee] = useState('2000');
  const [admPaid, setAdmPaid] = useState(true);
  const [welcome, setWelcome] = useState(true);
  const [charges, setCharges] = useState([]);
  const [done, setDone] = useState(null);

  const cls = db.classes.find((c) => c.id === st.classId);
  const set = (k) => (e) => setSt({ ...st, [k]: e.target.value });
  const setN = (k) => (e) => setNf({ ...nf, [k]: e.target.value });

  const matches = useMemo(() => {
    const t = fq.trim().toLowerCase();
    const phoneHit = nf.phone.replace(/\D/g, '');
    return db.families
      .filter((f) => !t || f.name.toLowerCase().includes(t) || f.id.toLowerCase().includes(t) || f.phone.replace(/\D/g, '').includes(t.replace(/\D/g, '') || '§') || f.cnic.includes(t))
      .map((f) => ({ ...f, kids: kidsOf(f.id), samePhone: phoneHit.length > 6 && f.phone.replace(/\D/g, '').endsWith(phoneHit.slice(-7)) }));
  }, [db.families, fq, kidsOf, nf.phone]);
  const phoneMatch = famMode === 'new' && matches.find((m) => m.samePhone);

  const fam = familyId ? db.families.find((f) => f.id === familyId) : null;
  const ok0 = st.name.trim() && st.classId;
  const ok1 = famMode === 'existing' ? !!familyId : nf.name.trim() && nf.phone.trim();
  const monthly = (cls?.fee || 0) - (Number(discount) || 0);

  const submit = () => {
    const newFamily = famMode === 'new' ? { name: nf.name, phone: nf.phone, whatsapp: nf.sameWa ? nf.phone : nf.whatsapp, cnic: nf.cnic, mother: nf.mother, occupation: nf.occupation, address: nf.address } : null;
    const dues = [];
    if (Number(admFee) && !admPaid) dues.push({ id: 'd1', label: 'Admission fee', month: 'Oct 2026', amount: Number(admFee) });
    charges.filter((c) => c.label && Number(c.amount)).forEach((c, i) => dues.push({ id: 'c' + i, label: c.label, month: 'Oct 2026', amount: Number(c.amount) }));
    dues.push({ id: 'm1', label: 'Monthly fee', month: 'Oct 2026', amount: monthly });
    const id = addStudent({ ...st, familyId, discount: Number(discount) || 0, dues, paid: admPaid ? Number(admFee) || 0 : 0 }, newFamily);
    if (params.get('inquiry')) moveInquiry(params.get('inquiry'), 'enrolled');
    toast(`${st.name} added to ${cls.name} ${st.section}`);
    setDone({ id, name: st.name });
  };

  if (done) {
    return (
      <div className="page" style={{ maxWidth: 720, margin: '24px auto 0', width: '100%' }}>
        <section className="card-hero col gap-16" style={{ padding: 32 }}>
          <span style={{ width: 56, height: 56, borderRadius: 999, background: 'var(--hero-accent)', color: 'var(--on-hero-accent)', display: 'grid', placeItems: 'center' }}><Icon name="check" size={28} stroke={2.6} /></span>
          <div>
            <h1 className="h1 sm">{done.name} is enrolled</h1>
            <p className="muted mt-8" style={{ fontSize: 15 }}>{cls.name} · {st.section} · {done.id}{welcome ? ' · welcome message sent to parents on WhatsApp' : ''}</p>
          </div>
        </section>
        <div className="grid g2">
          {[
            ['print', 'Print admission form', () => (printView(), toast('Admission form sent to printer', { icon: 'print' }))],
            ['idcard', 'Print ID card', () => toast('ID card sent to printer', { icon: 'idcard' })],
            ['userPlus', 'Add another student', () => { setDone(null); setStep(0); setSt({ ...st, name: '', dob: '', roll: '' }); }],
            ['arrowUpRight', 'Open profile', () => nav(`/students/${done.id}`)],
          ].map(([i, l, fn]) => (
            <button key={l} className="card row gap-12" style={{ textAlign: 'left', padding: 18, font: 'inherit' }} onClick={fn}>
              <span className="icon-btn" style={{ background: 'var(--surface-2)', borderColor: 'transparent' }}><Icon name={i} size={17} /></span>
              <span className="medium">{l}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <BackBar to="/students" label="Students" />
      <div className="page-head">
        <div>
          <div className="eyebrow">Step {step + 1} of 3 · {STEPS[step]}</div>
          <h1 className="h1 sm" style={{ marginTop: 4 }}>New student</h1>
        </div>
        <div className="row gap-6" style={{ width: 320, maxWidth: '100%' }}>
          {STEPS.map((x, i) => (
            <button key={x} onClick={() => (i < step || (i === 1 && ok0) || (i === 2 && ok0 && ok1)) && setStep(i)} style={{ flex: 1, border: 0, background: 'none', padding: 0, textAlign: 'left' }}>
              <div style={{ height: 4, borderRadius: 999, background: i <= step ? 'var(--sel)' : 'var(--track)' }} />
              <div className={cx('xs mt-8', i === step ? 'strong' : 'muted')}>{x}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="split">
        <section className="card main" style={{ padding: 28 }}>
          {step === 0 && (
            <div className="col gap-16">
              <div className="form-grid">
                <Field label="Student's full name" span><input className="input big" autoFocus value={st.name} onChange={set('name')} placeholder="e.g. Ayesha Khan" /></Field>
                <Field label="Gender"><Seg lg ink value={st.gender} onChange={(g) => setSt({ ...st, gender: g })} items={['Male', 'Female']} /></Field>
                <Field label="Date of birth" optional><input className="input" type="date" value={st.dob} onChange={set('dob')} /></Field>
              </div>
              <div className="col gap-8">
                <span className="label">Class</span>
                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(118px, 1fr))', gap: 8 }}>
                  {db.classes.map((c) => (
                    <button key={c.id} className={cx('chip', st.classId === c.id && 'on')} style={{ height: 52, borderRadius: 16, flexDirection: 'column', gap: 0, justifyContent: 'center' }} onClick={() => setSt({ ...st, classId: c.id, section: c.sections[0] })}>
                      <span>{c.name}</span><span className="xs" style={{ opacity: .65 }}>{fmt(c.fee)} / mo</span>
                    </button>
                  ))}
                </div>
              </div>
              {cls && cls.sections.length > 1 && (
                <div className="col gap-8">
                  <span className="label">Section</span>
                  <div className="row gap-8">{cls.sections.map((x) => <button key={x} className={cx('chip sm', st.section === x && 'on')} onClick={() => setSt({ ...st, section: x })}>{x}</button>)}</div>
                </div>
              )}
              <button className="link small" style={{ alignSelf: 'flex-start' }} onClick={() => setMore(!more)}>{more ? '− Hide extra details' : '+ Add more details (religion, B-Form, previous school…)'}</button>
              {more && (
                <div className="form-grid">
                  <Field label="Roll no." optional><input className="input" value={st.roll} onChange={set('roll')} /></Field>
                  <Field label="Religion"><input className="input" value={st.religion} onChange={set('religion')} /></Field>
                  <Field label="B-Form / CNIC" optional><input className="input" value={st.bform} onChange={set('bform')} placeholder="00000-0000000-0" /></Field>
                  <Field label="Previous school" optional><input className="input" value={st.prevSchool} onChange={set('prevSchool')} /></Field>
                  <Field label="Previous class" optional><input className="input" value={st.prevClass} onChange={set('prevClass')} /></Field>
                  <Field label="Previous result" optional><input className="input" value={st.prevResult} onChange={set('prevResult')} placeholder="e.g. 85%" /></Field>
                  <Field label="Note" optional span><textarea className="textarea" value={st.note} onChange={set('note')} /></Field>
                  <div className="dropzone span-2" style={{ gridColumn: '1 / -1' }}><Icon name="image" size={20} />Add a photo <span className="xs faint">JPG or PNG · used on ID card</span></div>
                </div>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="col gap-16">
              <Seg lg ink value={famMode} onChange={setFamMode} items={[{ key: 'existing', label: 'Existing family' }, { key: 'new', label: 'New family' }]} />
              {famMode === 'existing' ? (
                <>
                  <Search value={fq} onChange={setFq} placeholder="Guardian name, phone, CNIC or family ID" lg autoFocus />
                  <p className="small muted" style={{ marginTop: -6 }}>Siblings share one family, so fees and messages go to the parent once.</p>
                  <div className="col gap-8">
                    {matches.map((f) => (
                      <button key={f.id} onClick={() => setFamilyId(f.id)} className="row" style={{ gap: 12, padding: 12, borderRadius: 18, textAlign: 'left', border: `1.5px solid ${familyId === f.id ? 'var(--text)' : 'var(--border)'}`, background: familyId === f.id ? 'var(--surface-2)' : 'var(--surface)' }}>
                        <Avatar name={f.name} id={f.id} />
                        <span className="grow">
                          <span className="medium" style={{ display: 'block' }}>{f.name} <span className="muted small">· {f.id}</span></span>
                          <span className="small muted">{f.phone} · {f.kids.length ? f.kids.map((k) => k.name).join(', ') : 'no students yet'}</span>
                        </span>
                        {familyId === f.id ? <span className="av s30 ink"><Icon name="check" size={14} stroke={2.6} /></span> : <span className="icon-btn xs" />}
                      </button>
                    ))}
                    {!matches.length && <div className="empty">No family found. <button className="link" onClick={() => { setFamMode('new'); setNf({ ...nf, name: fq }); }}>Create “{fq}” as a new family</button></div>}
                  </div>
                </>
              ) : (
                <>
                  <div className="form-grid">
                    <Field label="Guardian / father name"><input className="input" autoFocus value={nf.name} onChange={setN('name')} /></Field>
                    <Field label="Phone"><input className="input" value={nf.phone} onChange={setN('phone')} placeholder="03XX XXXXXXX" /></Field>
                  </div>
                  {phoneMatch && (
                    <div className="banner info">
                      <Icon name="family" size={18} />
                      <span className="grow small">This number belongs to <strong>{phoneMatch.name}</strong> ({phoneMatch.id}) with {phoneMatch.kids.map((k) => k.name).join(', ')}. Add as a sibling instead?</span>
                      <button className="btn xs" onClick={() => { setFamMode('existing'); setFamilyId(phoneMatch.id); }}>Use this family</button>
                    </div>
                  )}
                  <SwitchRow on={nf.sameWa} onChange={(v) => setNf({ ...nf, sameWa: v })} title="WhatsApp is the same number" sub="Receipts, reminders and attendance alerts go here" />
                  <div className="form-grid">
                    {!nf.sameWa && <Field label="WhatsApp number"><input className="input" value={nf.whatsapp} onChange={setN('whatsapp')} /></Field>}
                    <Field label="Guardian CNIC" optional><input className="input" value={nf.cnic} onChange={setN('cnic')} placeholder="00000-0000000-0" /></Field>
                    <Field label="Mother's name" optional><input className="input" value={nf.mother} onChange={setN('mother')} /></Field>
                    <Field label="Occupation" optional><input className="input" value={nf.occupation} onChange={setN('occupation')} /></Field>
                    <Field label="Address" optional span><input className="input" value={nf.address} onChange={setN('address')} /></Field>
                  </div>
                </>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="col gap-16">
              <div className="grid g2">
                <div className="tile"><div className="k">Class fee · {cls?.name}</div><div className="v">{fmt(cls?.fee)} PKR / month</div></div>
                <Field label="Monthly discount (PKR)"><input className="input" inputMode="numeric" value={discount} onChange={(e) => setDiscount(e.target.value.replace(/\D/g, ''))} /></Field>
              </div>
              <div className="row wrap gap-8" style={{ marginTop: -6 }}>
                {[0, 500, 1000, Math.round((cls?.fee || 0) / 2)].map((d) => <button key={d} className={cx('chip sm', Number(discount) === d && 'on')} onClick={() => setDiscount(String(d))}>{d ? (d === Math.round((cls?.fee || 0) / 2) ? '50% · ' : '') + fmt(d) : 'No discount'}</button>)}
              </div>
              <div className="divider" />
              <div className="form-grid">
                <Field label="Admission fee (PKR)"><input className="input" inputMode="numeric" value={admFee} onChange={(e) => setAdmFee(e.target.value.replace(/\D/g, ''))} /></Field>
                <div className="field"><span>Paid today?</span><Seg lg ink value={admPaid ? 'yes' : 'no'} onChange={(v) => setAdmPaid(v === 'yes')} items={[{ key: 'yes', label: 'Yes, collected' }, { key: 'no', label: 'No, add to dues' }]} /></div>
              </div>
              <div className="col gap-8">
                <div className="row between"><span className="label">One-time charges</span><button className="link small" onClick={() => setCharges([...charges, { label: '', amount: '' }])}>+ Add charge</button></div>
                {charges.map((c, i) => (
                  <div key={i} className="row gap-8">
                    <input className="input grow" placeholder="e.g. Security, books, uniform" value={c.label} onChange={(e) => setCharges(charges.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
                    <input className="input" style={{ width: 140 }} placeholder="Amount" value={c.amount} onChange={(e) => setCharges(charges.map((x, j) => (j === i ? { ...x, amount: e.target.value.replace(/\D/g, '') } : x)))} />
                    <button className="icon-btn" aria-label="Remove charge" onClick={() => setCharges(charges.filter((_, j) => j !== i))}><Icon name="close" size={13} /></button>
                  </div>
                ))}
                {!charges.length && <span className="small faint">Security deposit, books or uniform — optional.</span>}
              </div>
              <SwitchRow on={welcome} onChange={setWelcome} title="Send welcome message to parents" sub="Admission confirmation on WhatsApp and the parent app" />
            </div>
          )}

          <div className="row between mt-20" style={{ paddingTop: 20, borderTop: '1px solid var(--line)' }}>
            {step > 0 ? <button className="btn ghost" onClick={() => setStep(step - 1)}><Icon name="arrowLeft" size={15} />Back</button> : <Link to="/students" className="btn ghost">Cancel</Link>}
            {step < 2 ? (
              <button className="btn primary" disabled={step === 0 ? !ok0 : !ok1} onClick={() => setStep(step + 1)}>Continue<Icon name="arrowRight" size={15} /></button>
            ) : (
              <button className="btn primary" onClick={submit}><Icon name="check" size={15} stroke={2.4} />Enroll {st.name.split(' ')[0]}</button>
            )}
          </div>
        </section>

        <aside className="side" style={{ position: 'sticky', top: 16 }}>
          <section className="card-hero col gap-16">
            <div className="row gap-12">
              <span className="av s64" style={{ background: 'var(--hero-chip)', color: 'inherit' }}>{st.name ? initials(st.name) : <Icon name="user" size={24} />}</span>
              <div style={{ minWidth: 0 }}>
                <div className="display ellipsis" style={{ fontSize: 26 }}>{st.name || 'New student'}</div>
                <div className="small muted">{cls ? `${cls.name} · ${st.section}` : 'Choose a class'} · {st.gender}</div>
              </div>
            </div>
            <div className="col" style={{ gap: 0, borderTop: '1px solid var(--hero-track)' }}>
              {[
                ['Family', famMode === 'existing' ? (fam ? `${fam.name} · ${fam.id}` : '—') : nf.name || '—'],
                ['Phone', famMode === 'existing' ? fam?.phone || '—' : nf.phone || '—'],
                ['Monthly fee', cls ? `${fmt(monthly)} PKR` : '—'],
                ['Due on admission', step === 2 ? `${fmt((admPaid ? 0 : Number(admFee) || 0) + charges.reduce((a, c) => a + (Number(c.amount) || 0), 0) + monthly)} PKR` : '—'],
              ].map(([k, v]) => (
                <div key={k} className="row between small" style={{ padding: '10px 0', borderBottom: '1px solid var(--hero-track)' }}><span className="muted">{k}</span><span className="medium ellipsis" style={{ maxWidth: '60%' }}>{v}</span></div>
              ))}
            </div>
            <div className="xs muted">The ID is assigned automatically. You can complete the rest of the profile later.</div>
          </section>
        </aside>
      </div>
    </div>
  );
}
