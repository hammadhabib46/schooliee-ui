import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Icon from '../components/Icon.jsx';
import { Logo, WA } from './Home.jsx';
import { Phone } from './devices.jsx';
import { ParentAppTour, useParentTour } from './screens.jsx';
import { ALL_FEATURES, CITIES, GROUPS, INCLUDED, KINDS, MIN_BILLED, priceOf } from './data.js';
import { useSeo } from './seo.js';
import './site.css';
import './signup.css';

const KEY = 'schooliee-signup-v2';
const pk = (n) => Math.round(n).toLocaleString('en-PK');
const ease = [0.2, 0.75, 0.15, 1];

// What the owner wants help with → which features we switch on for them.
const GOALS = [
  { key: 'fees', title: 'Collect fees on time', sub: 'Challans, reminders and receipts on WhatsApp', icon: 'cash', on: ['challans', 'online', 'reminders', 'whatsapp'] },
  { key: 'attendance', title: 'Attendance & parent alerts', sub: 'Mark in seconds, parents told instantly', icon: 'check', on: ['attendance', 'whatsapp', 'app'] },
  { key: 'classroom', title: 'Exams, diary & classroom', sub: 'Result cards, homework, timetable', icon: 'exam', on: ['exams', 'diary', 'observation', 'timetable', 'staff', 'app'] },
  { key: 'staff', title: 'Staff & salaries', sub: 'Payroll, loans and salary slips', icon: 'people', on: ['staff', 'payroll'] },
  { key: 'growth', title: 'More admissions', sub: 'Online admission form and a school website', icon: 'userPlus', on: ['admissions', 'website'] },
  { key: 'insight', title: 'Know my numbers', sub: 'Owner reports, AI on WhatsApp, staff logins', icon: 'sparkle', on: ['advanced', 'ai', 'logins'] },
];
const PRESETS = {
  pro: ['challans', 'online', 'staff', 'payroll', 'reminders', 'ai', 'logins'],
  elite: ALL_FEATURES.map((f) => f.key),
};
const SIZES = [[150, 'Under 200'], [350, '200–500'], [750, '500–1,000'], [1500, '1,000+']];

const STEPS = [
  { key: 'you', label: 'You', title: 'First, who are we building this for?', sub: 'We only use your number if you need help — never for spam.' },
  { key: 'school', label: 'School', title: 'Tell us about your school.', sub: 'Just the basics. Everything else can wait until you’re inside.' },
  { key: 'goals', label: 'Goals', title: 'What should Schooliee take off your plate first?', sub: 'Pick as many as you like. We’ll switch on the right features — you can change them next.' },
  { key: 'plan', label: 'Plan', title: 'Here’s the plan we recommend.', sub: 'Based on what you picked. Switch anything on or off and the price follows.' },
  { key: 'signin', label: 'Sign-in', title: 'Last step: your sign-in.', sub: 'You’ll use this to open your school.' },
];

const blank = { name: '', phone: '', school: '', logo: '', kind: 'School', city: '', students: 350, goals: [], on: {}, touchedPlan: false, yearly: true, email: '', password: '' };
const load = () => { try { return { ...blank, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return blank; } };
const digits = (p) => p.replace(/\D/g, '');
const fmtPhone = (p) => { const d = digits(p).slice(0, 11); return d.length > 4 ? `${d.slice(0, 4)} ${d.slice(4)}` : d; };
const phoneOk = (p) => /^03\d{9}$/.test(digits(p));
const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());
const strength = (p) => Math.min(4, [p.length >= 8, /[A-Z]/.test(p) && /[a-z]/.test(p), /\d/.test(p), /[^A-Za-z0-9]/.test(p), p.length >= 12].filter(Boolean).length);

function onFromGoals(goals) {
  const on = {};
  goals.forEach((g) => GOALS.find((x) => x.key === g)?.on.forEach((k) => { on[k] = true; }));
  ALL_FEATURES.forEach((f) => { if (on[f.key] && f.needs) on[f.needs] = true; });
  return on;
}

export default function SignUp() {
  useSeo('/sign-up');
  const [params] = useSearchParams();
  const [f, setF] = useState(() => {
    const s = load();
    const plan = params.get('plan');
    if (PRESETS[plan]) return { ...s, on: Object.fromEntries(PRESETS[plan].map((k) => [k, true])), touchedPlan: true };
    return s;
  });
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [tried, setTried] = useState(false);
  const [done, setDone] = useState(false);
  const set = (patch) => setF((x) => ({ ...x, ...(typeof patch === 'function' ? patch(x) : patch) }));
  const id = STEPS[step].key;
  const price = useMemo(() => priceOf(f.students, f.on), [f.students, f.on]);
  const onKeys = ALL_FEATURES.filter((x) => f.on[x.key]).map((x) => x.key);
  const tour = useParentTour(onKeys);

  useEffect(() => { try { const { password, ...rest } = f; localStorage.setItem(KEY, JSON.stringify(rest)); } catch { /* private mode */ } }, [f]);

  const errors = {
    you: { name: !f.name.trim() && 'Tell us your name', phone: !phoneOk(f.phone) && 'Use a mobile number like 0300 1234567' },
    school: { school: !f.school.trim() && 'Your school needs a name', city: !f.city.trim() && 'Which city is it in?' },
    goals: { goals: !f.goals.length && !f.touchedPlan && 'Pick at least one — you can change it later' },
    signin: { email: !emailOk(f.email) && 'Enter a valid email address', password: f.password.length < 8 && 'Use at least 8 characters' },
  }[id] || {};
  const err = (k) => tried && errors[k];
  const blocked = Object.values(errors).some(Boolean);

  const go = (d) => {
    if (d > 0 && blocked) { setTried(true); return; }
    setTried(false); setDir(d);
    if (d > 0 && id === 'goals' && !f.touchedPlan) set({ on: onFromGoals(f.goals) });
    if (d > 0 && id === 'signin') { setDone(true); return; }
    setStep((s) => Math.max(0, Math.min(STEPS.length - 1, s + d)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const toggle = (key) => {
    const on = { ...f.on, [key]: !f.on[key] };
    const feat = ALL_FEATURES.find((x) => x.key === key);
    if (on[key] && feat.needs) on[feat.needs] = true;
    if (!on[key]) ALL_FEATURES.filter((x) => x.needs === key).forEach((x) => { on[x.key] = false; });
    set({ on, touchedPlan: true });
  };
  const onEnter = (e) => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); go(1); } };
  const left = STEPS.length - step - 1;

  return (
    <div className="mk su">
      <div className="su-main" onKeyDown={onEnter}>
        <header className="su-head">
          <Logo />
          <div className="su-head-r">
            <a className="su-help" href={WA} target="_blank" rel="noreferrer"><Icon name="whatsapp" size={15} /><span>Need help?</span></a>
            <Link to="/site" className="su-x" aria-label="Leave and go back to the home page"><Icon name="close" size={16} /></Link>
          </div>
        </header>

        {!done && (
          <nav className="su-steps" aria-label="Progress">
            {STEPS.map((s, i) => (
              <button key={s.key} type="button" className={`${i === step ? 'on' : ''} ${i < step ? 'past' : ''}`} disabled={i > step} onClick={() => { setDir(-1); setStep(i); setTried(false); }} aria-current={i === step ? 'step' : undefined}>
                <i>{i < step ? <Icon name="check" size={12} stroke={3} /> : i + 1}</i><span>{s.label}</span>
              </button>
            ))}
            <em className="su-left">{left ? `${left} step${left > 1 ? 's' : ''} left · about ${left * 1 + 1} min` : 'Last step'}</em>
          </nav>
        )}

        <main className="su-body">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div key={done ? 'done' : id} className="su-step" custom={dir}
              initial={{ opacity: 0, x: dir * 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -30 }} transition={{ duration: 0.35, ease }}>
              {done ? <Done f={f} price={price} /> : (
                <>
                  <div className="su-step-head">
                    <h1>{STEPS[step].title}</h1>
                    <p>{STEPS[step].sub}</p>
                  </div>
                  {id === 'you' && <You f={f} set={set} err={err} />}
                  {id === 'school' && <School f={f} set={set} err={err} />}
                  {id === 'goals' && <Goals f={f} set={set} err={err} />}
                  {id === 'plan' && <Plan f={f} set={set} price={price} toggle={toggle} />}
                  {id === 'signin' && <SignIn f={f} set={set} err={err} price={price} />}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {!done && (
          <footer className="su-foot">
            {step > 0 ? <button type="button" className="su-back" onClick={() => go(-1)}><Icon name="arrowLeft" size={15} /><span>Back</span></button> : <span />}
            <div className="su-foot-price" aria-live="polite">{step >= 3 && <><em>{f.yearly ? 'Yearly · 30% off' : 'Monthly'}</em><b>Rs {pk(f.yearly ? price.yearly : price.monthly)}</b></>}</div>
            <button type="button" className="mk-btn ink" onClick={() => go(1)}>
              {id === 'plan' ? 'Looks good' : id === 'signin' ? 'Create my school' : 'Continue'}<Icon name="arrowRight" size={15} stroke={2.2} />
            </button>
          </footer>
        )}
      </div>

      <aside className="su-side" aria-label="Preview of your parent app">
        <div className="su-side-in">
          <p className="su-side-cap">{done ? 'Your school, ready for parents' : 'What your parents will see'}</p>
          <div onMouseEnter={() => tour.setPaused(true)} onMouseLeave={() => tour.setPaused(false)}>
            <Phone className="su-side-phone"><ParentAppTour school={f.school} logo={f.logo} city={f.city} features={onKeys} step={tour.steps[tour.at]} /></Phone>
          </div>
          <div className="su-tour">
            <AnimatePresence mode="wait"><motion.p key={tour.steps[tour.at].key} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>{tour.steps[tour.at].caption}</motion.p></AnimatePresence>
            <div className="su-tour-dots" role="tablist" aria-label="Parent app screens">
              {tour.steps.map((st, n) => <button key={st.key} role="tab" aria-selected={n === tour.at} aria-label={st.caption} className={n === tour.at ? 'on' : ''} onClick={() => tour.setAt(n)} />)}
            </div>
          </div>
          <div className="su-side-card">
            <div><em>{f.school || 'Your school'}</em><b>{onKeys.length} features · {pk(Math.max(MIN_BILLED, f.students))} students</b></div>
            <strong>{step >= 3 || done ? `Rs ${pk(f.yearly ? price.yearly : price.monthly)}` : '—'}<small>{step >= 3 || done ? (f.yearly ? '/yr' : '/mo') : ''}</small></strong>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Fld({ label, err, hint, children, optional }) {
  return (
    <label className={`su-fld ${err ? 'err' : ''}`}>
      <span className="su-label">{label}{optional && <i> · optional</i>}</span>
      {children}
      <AnimatePresence initial={false}>{(err || hint) && <motion.span key={err || hint} className="su-hint" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{err || hint}</motion.span>}</AnimatePresence>
    </label>
  );
}

function You({ f, set, err }) {
  return (
    <div className="su-fields">
      <Fld label="Your full name" err={err('name')}>
        <input className="su-in" autoFocus value={f.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Ayesha Malik" autoComplete="name" />
      </Fld>
      <Fld label="WhatsApp number" err={err('phone')} hint={phoneOk(f.phone) ? '✓ Looks right' : undefined}>
        <div className="su-phone"><span>+92</span><input className="su-in" inputMode="tel" value={fmtPhone(f.phone)} onChange={(e) => set({ phone: digits(e.target.value) })} placeholder="0300 1234567" autoComplete="tel" /></div>
      </Fld>
    </div>
  );
}

function School({ f, set, err }) {
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const fileRef = useRef(null);
  const matches = f.city ? CITIES.filter((c) => c.toLowerCase().includes(f.city.toLowerCase()) && c !== f.city).slice(0, 6) : [];
  const onLogo = (e) => { const file = e.target.files?.[0]; if (!file) return; const r = new FileReader(); r.onload = () => set({ logo: r.result }); r.readAsDataURL(file); };
  const pick = (c) => { set({ city: c }); setOpen(false); };
  return (
    <div className="su-fields">
      <div className="su-namerow">
        <Fld label="School name" err={err('school')}>
          <input className="su-in" autoFocus value={f.school} onChange={(e) => set({ school: e.target.value })} placeholder="e.g. Al-Noor Grammar School" />
        </Fld>
        <button type="button" className="su-logo-up" onClick={() => fileRef.current?.click()} aria-label={f.logo ? 'Change logo' : 'Add your logo'}>
          {f.logo ? <img src={f.logo} alt="" /> : <><Icon name="image" size={18} /><em>Logo</em></>}
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onLogo} />
      </div>
      <div className="su-fld">
        <span className="su-label">It’s a…</span>
        <div className="su-chips">{KINDS.map((k) => <button key={k} type="button" className={f.kind === k ? 'on' : ''} onClick={() => set({ kind: k })} aria-pressed={f.kind === k}>{k}</button>)}</div>
      </div>
      <Fld label="City" err={err('city')}>
        <div className="su-ac">
          <input className="su-in" value={f.city} placeholder="Start typing — Lahore, Karachi…" autoComplete="off" role="combobox" aria-expanded={open && matches.length > 0}
            onChange={(e) => { set({ city: e.target.value }); setOpen(true); setHi(0); }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 120)}
            onKeyDown={(e) => {
              if (!open || !matches.length) return;
              if (e.key === 'ArrowDown') { e.preventDefault(); setHi((h) => (h + 1) % matches.length); }
              if (e.key === 'ArrowUp') { e.preventDefault(); setHi((h) => (h - 1 + matches.length) % matches.length); }
              if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); pick(matches[hi]); }
            }} />
          {open && matches.length > 0 && <ul role="listbox">{matches.map((c, i) => <li key={c} role="option" aria-selected={i === hi}><button type="button" className={i === hi ? 'hi' : ''} onMouseDown={(e) => { e.preventDefault(); pick(c); }}>{c}</button></li>)}</ul>}
        </div>
      </Fld>
      <div className="su-fld">
        <span className="su-label">How many students?</span>
        <div className="su-chips">{SIZES.map(([n, l]) => <button key={l} type="button" className={f.students === n ? 'on' : ''} onClick={() => set({ students: n })}>{l}</button>)}</div>
        <div className="su-exact"><span>Or the exact number</span><input className="su-in sm" inputMode="numeric" value={f.students || ''} onChange={(e) => set({ students: Number(digits(e.target.value).slice(0, 5)) || 0 })} aria-label="Exact number of students" /></div>
        {f.students > 0 && f.students < MIN_BILLED && <span className="su-hint">Billing starts at {MIN_BILLED} students, so small schools pay for {MIN_BILLED}.</span>}
      </div>
    </div>
  );
}

function Goals({ f, set, err }) {
  const toggle = (k) => set((x) => ({ goals: x.goals.includes(k) ? x.goals.filter((g) => g !== k) : [...x.goals, k], touchedPlan: false }));
  const all = f.goals.length === GOALS.length;
  return (
    <>
      <div className="su-goals">
        {GOALS.map((g, i) => {
          const on = f.goals.includes(g.key);
          return (
            <motion.button key={g.key} type="button" className={`su-goal ${on ? 'on' : ''}`} onClick={() => toggle(g.key)} aria-pressed={on}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, ease }} whileTap={{ scale: 0.98 }}>
              <span className="su-goal-ic"><Icon name={g.icon} size={18} /></span>
              <span className="su-goal-t"><b>{g.title}</b><em>{g.sub}</em></span>
              <span className="su-tick">{on && <Icon name="check" size={13} stroke={3} />}</span>
            </motion.button>
          );
        })}
      </div>
      <div className="su-goal-foot">
        <button type="button" className="su-textbtn" onClick={() => set({ goals: all ? [] : GOALS.map((g) => g.key), touchedPlan: false })}>{all ? 'Clear all' : 'I want everything'}</button>
        {err('goals') && <span className="su-hint err">{err('goals')}</span>}
      </div>
      <details className="su-included">
        <summary>Always included, whatever you pick <span>{INCLUDED.length} features</span></summary>
        <ul>{INCLUDED.map(([t]) => <li key={t}><Icon name="check" size={13} stroke={2.6} />{t}</li>)}</ul>
      </details>
    </>
  );
}

function Plan({ f, set, price, toggle }) {
  const [openG, setOpenG] = useState(null);
  const preset = (keys) => set({ on: Object.fromEntries(keys.map((k) => [k, true])), touchedPlan: true });
  return (
    <>
      <div className="su-plan-hero">
        <div className="su-plan-sum">
          <em>{f.school || 'Your school'} · {pk(price.billed)} students</em>
          <motion.b key={`${price.monthly}-${f.yearly}`} initial={{ opacity: 0.4, y: 6 }} animate={{ opacity: 1, y: 0 }}>Rs {pk(f.yearly ? price.yearly : price.monthly)}<small>/{f.yearly ? 'year' : 'month'}</small></motion.b>
          <span>Rs {(price.monthly / price.billed).toFixed(1)} per student a month{f.yearly ? ' before the 30% yearly discount' : ''}</span>
          {price.capped && <i className="su-cap"><Icon name="sparkle" size={12} />Elite price cap — you save Rs {pk(price.saved)} a month</i>}
        </div>
        <div className="su-seg" role="group" aria-label="Billing period">
          <button type="button" className={!f.yearly ? 'on' : ''} onClick={() => set({ yearly: false })} aria-pressed={!f.yearly}>Monthly</button>
          <button type="button" className={f.yearly ? 'on' : ''} onClick={() => set({ yearly: true })} aria-pressed={f.yearly}>Yearly −30%</button>
        </div>
      </div>
      <div className="su-presets">
        <span>Quick start:</span>
        <button type="button" onClick={() => preset(Object.keys(onFromGoals(f.goals)))}>My picks</button>
        <button type="button" onClick={() => preset(PRESETS.pro)}>Pro</button>
        <button type="button" onClick={() => preset(PRESETS.elite)}>Everything</button>
      </div>
      <div className="su-groups">
        <div className="su-group base"><div className="su-group-h"><span className="su-goal-ic sm"><Icon name="layers" size={15} /></span><div><b>Base plan</b><em>Students, fees, classes, ledger, basic reports</em></div><strong>Rs {pk(price.lines[0].amount)}</strong></div></div>
        {GROUPS.map((g) => {
          const n = g.items.filter((i) => f.on[i.key]).length;
          const sum = g.items.reduce((a, i) => a + (f.on[i.key] ? i.rate * price.billed : 0), 0);
          const open = openG === g.key;
          return (
            <div key={g.key} className={`su-group ${open ? 'open' : ''}`}>
              <button type="button" className="su-group-h" onClick={() => setOpenG(open ? null : g.key)} aria-expanded={open}>
                <span className={`su-count ${n ? 'on' : ''}`}>{n}/{g.items.length}</span>
                <div><b>{g.title}</b><em>{g.items.filter((i) => f.on[i.key]).map((i) => i.name).join(', ') || 'Nothing switched on'}</em></div>
                <strong>{sum ? `Rs ${pk(sum)}` : '—'}</strong>
                <Icon name="chevDown" size={16} className="su-chev" />
              </button>
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div className="su-group-b" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease }}>
                    {g.items.map((it) => {
                      const dep = it.needs && ALL_FEATURES.find((x) => x.key === it.needs);
                      return (
                        <label key={it.key} className={`su-feat ${f.on[it.key] ? 'on' : ''}`}>
                          <span className={`su-switch ${f.on[it.key] ? 'on' : ''}`}><input type="checkbox" checked={!!f.on[it.key]} onChange={() => toggle(it.key)} /><i /></span>
                          <span className="su-feat-t"><b>{it.name}</b><em>{it.desc}{dep ? ` Needs ${dep.name}.` : ''}</em></span>
                          <strong>{it.rate ? `Rs ${pk(it.rate * price.billed)}` : 'Free'}</strong>
                        </label>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
      <p className="su-fine"><Icon name="clock" size={14} />Your school goes live straight away. Use everything for 3 hours, then pay by bank transfer to keep it.</p>
    </>
  );
}

function SignIn({ f, set, err, price }) {
  const [show, setShow] = useState(false);
  const s = strength(f.password);
  return (
    <div className="su-fields">
      <Fld label="Email address" err={err('email')}>
        <input className="su-in" type="email" autoFocus value={f.email} onChange={(e) => set({ email: e.target.value })} placeholder="you@school.com" autoComplete="email" />
      </Fld>
      <Fld label="Choose a password" err={err('password')}>
        <div className="su-pass">
          <input className="su-in" type={show ? 'text' : 'password'} value={f.password} onChange={(e) => set({ password: e.target.value })} autoComplete="new-password" placeholder="At least 8 characters" />
          <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>{show ? 'Hide' : 'Show'}</button>
        </div>
        <span className={`su-meter s${f.password ? s : 0}`} aria-hidden="true">{[0, 1, 2, 3].map((i) => <i key={i} />)}<em>{f.password ? ['Too short', 'Weak', 'Okay', 'Good', 'Strong'][s] : ''}</em></span>
      </Fld>
      <div className="su-recap">
        <div><em>School</em><b>{f.school}</b><span>{f.kind} · {f.city}</span></div>
        <div><em>Plan</em><b>{ALL_FEATURES.filter((x) => f.on[x.key]).length} features</b><span>Rs {pk(f.yearly ? price.yearly : price.monthly)} {f.yearly ? 'a year' : 'a month'}</span></div>
        <div><em>WhatsApp</em><b>{fmtPhone(f.phone)}</b><span>{f.name}</span></div>
      </div>
      <p className="su-fine">By creating your school you agree to Schooliee’s terms. You can cancel within the 3-hour trial and pay nothing.</p>
    </div>
  );
}

function Done({ f, price }) {
  return (
    <div className="su-done">
      <motion.span className="su-done-ic" initial={{ scale: 0.5, rotate: -20, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }}><Icon name="check" size={30} stroke={2.6} /></motion.span>
      <h1>That’s everything{f.name ? `, ${f.name.split(' ')[0]}` : ''}.</h1>
      <p>We have what we need to build <b>{f.school}</b>. Next we’ll confirm <b>{f.email}</b> and share bank details for Rs {pk(f.yearly ? price.yearly : price.monthly)} {f.yearly ? 'a year' : 'a month'}.</p>
      <Link className="mk-btn line" to="/site">Back to home</Link>
    </div>
  );
}
