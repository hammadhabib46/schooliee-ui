import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import Icon from '../components/Icon.jsx';
import { FAQ, PROMO_VIDEO, QUOTES, TESTIMONIAL_VIDEOS, eliteRate, proRate, MIN_BILLED, YEARLY_OFF } from './data.js';
import { AttendanceScreen, DiaryScreen, FeeScreen, HeroChat, OwnerScreen, ParentAlertScreen } from './screens.jsx';
import { AppScreen, DeviceMorph, Laptop, Phone } from './devices.jsx';
import { useSeo } from './seo.js';
import './site.css';

export const WA = 'https://wa.me/923027987128?text=Hi%20Schooliee%2C%20I%27d%20like%20a%20demo%20for%20my%20school.';
const pk = (n) => Math.round(n).toLocaleString('en-PK');
const ease = [0.2, 0.75, 0.15, 1];

export function Logo() {
  return (
    <Link to="/site" className="mk-logo" aria-label="Schooliee home">
      <svg viewBox="0 0 48 48" width="30" height="30" aria-hidden="true"><rect width="48" height="48" rx="15" fill="#141414" /><path d="M14 25l7 7 13-15" fill="none" stroke="#C5F15C" strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
      <span>schooliee</span>
    </Link>
  );
}

// Rises in when scrolled into view.
function In({ as = 'div', delay = 0, y = 26, className, children, ...rest }) {
  const M = motion[as];
  return <M className={className} initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '0px 0px -10% 0px' }} transition={{ duration: 0.9, ease, delay }} {...rest}>{children}</M>;
}

// Headline: each word slides up from behind a mask.
function Words({ text, as = 'h2', className, delay = 0, italic = [], onLoad, ...rest }) {
  const M = motion[as];
  const words = text.split(' ');
  const anim = onLoad ? { animate: 'show' } : { whileInView: 'show', viewport: { once: true, margin: '0px 0px -10% 0px' } };
  return (
    <M className={className} {...rest} initial="hide" {...anim} transition={{ staggerChildren: 0.06, delayChildren: delay }} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} aria-hidden="true"><span className="wm"><motion.span className={italic.includes(i) ? 'wi serif' : 'wi'} variants={{ hide: { y: '110%' }, show: { y: '0%', transition: { duration: 0.9, ease } } }}>{w}</motion.span></span>{i < words.length - 1 ? ' ' : ''}</span>
      ))}
    </M>
  );
}

function Nav() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => { const on = () => setSolid(window.scrollY > 10); on(); window.addEventListener('scroll', on, { passive: true }); return () => window.removeEventListener('scroll', on); }, []);
  const links = [['How it works', '#day'], ['Why Schooliee', '#pakistan'], ['Stories', '#stories'], ['Pricing', '#pricing'], ['FAQ', '#faq']];
  return (
    <header className={`mk-nav ${solid ? 'solid' : ''} ${open ? 'open' : ''}`}>
      <div className="mk-wrap mk-nav-in">
        <Logo />
        <nav className="mk-nav-links" aria-label="Main">{links.map(([l, h]) => <a key={h} href={h} onClick={() => setOpen(false)}>{l}</a>)}</nav>
        <div className="mk-nav-cta">
          <a className="mk-link" href="https://www.schooliee.com/sign-in/">Sign in</a>
          <Link className="mk-btn ink sm" to="/sign-up">Build your school</Link>
          <button className="mk-burger" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)}><Icon name={open ? 'close' : 'menu'} size={18} /></button>
        </div>
      </div>
    </header>
  );
}

const HERO_VIEWS = [
  { route: '/', label: 'Today' },
  { route: '/finance/fees', label: 'Fees' },
  { route: '/academics/attendance', label: 'Attendance' },
  { route: '/finance/analytics', label: 'Analytics' },
  { route: '/students', label: 'Students' },
];

function Hero() {
  const [v, setV] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setV((x) => (x + 1) % HERO_VIEWS.length), 4200);
    return () => clearInterval(t);
  }, [paused]);
  return (
    <section className="mk-hero" aria-labelledby="hero-title">
      <div className="mk-wrap">
        <div className="mk-hero-copy">
          <In as="p" className="mk-overline" y={10}><span className="flag" aria-hidden="true" />School management system for Pakistan</In>
          <Words as="h1" id="hero-title" className="mk-h1" text="Run your school. Not your paperwork." italic={[3, 4]} onLoad delay={0.1} />
          <In as="p" className="mk-urdu" lang="ur" dir="rtl" delay={0.5} y={10}>اسکول آپ چلائیں، کاغذی کام ہم پر چھوڑ دیں</In>
          <In as="p" className="mk-lead" delay={0.6}>Schooliee collects fees, marks attendance and messages parents on WhatsApp — so your office stops chasing and starts running the school. We move your registers in for you, free.</In>
          <In className="mk-hero-cta" delay={0.72}>
            <Link className="mk-btn ink lg" to="/sign-up">Build your school <span className="mk-btn-note">10 min</span></Link>
            <a className="mk-btn line lg" href={WA} target="_blank" rel="noreferrer"><Icon name="whatsapp" size={17} />Get a demo on WhatsApp</a>
          </In>
          <In as="ul" className="mk-assure" delay={0.85} y={10}>
            <li><Icon name="check" size={14} stroke={2.4} />Free to build, 3 hours to try</li>
            <li><Icon name="check" size={14} stroke={2.4} />We import your data</li>
            <li><Icon name="check" size={14} stroke={2.4} />From Rs 5 per student</li>
          </In>
        </div>
        <motion.div className="mk-hero-devices" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.1, ease, delay: 0.35 }}
          onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          <div className="mk-hero-stage">
            <Laptop><AppScreen route={HERO_VIEWS[v].route} label="The Schooliee dashboard" /></Laptop>
            <Phone className="mk-hero-phone"><HeroChat /></Phone>
          </div>
          <div className="mk-hero-tabs" role="tablist" aria-label="Dashboard screens">
            {HERO_VIEWS.map((h, i) => (
              <button key={h.route} role="tab" aria-selected={v === i} className={v === i ? 'on' : ''} onClick={() => { setV(i); setPaused(true); }}>
                {h.label}{v === i && !paused && <motion.i key={v} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 4.2, ease: 'linear' }} />}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function PromoVideo() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start 0.2'] });
  const scale = useTransform(scrollYProgress, [0, 1], [0.88, 1]);
  const radius = useTransform(scrollYProgress, [0, 1], [48, 28]);
  const [play, setPlay] = useState(false);
  return (
    <section className="mk-video-sec" ref={ref} aria-label="Product film">
      <div className="mk-wrap">
        <motion.div className="mk-video" style={{ scale, borderRadius: radius }}>
          {play && PROMO_VIDEO.src ? (
            <video src={PROMO_VIDEO.src} poster={PROMO_VIDEO.poster || undefined} controls autoPlay playsInline />
          ) : (
            <button className="mk-video-cover" onClick={() => setPlay(true)} aria-label="Play the Schooliee film">
              {PROMO_VIDEO.poster ? <img src={PROMO_VIDEO.poster} alt="Schooliee dashboard" loading="lazy" /> : <span className="mk-video-poster" aria-hidden="true"><span>Fees</span><span>Attendance</span><span>Parents</span></span>}
              <span className="mk-play"><svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" fill="currentColor" /></svg></span>
              <span className="mk-video-cap"><b>See a real school day on Schooliee</b><i>{play && !PROMO_VIDEO.src ? 'The film is coming soon' : `Watch · ${PROMO_VIDEO.length}`}</i></span>
            </button>
          )}
        </motion.div>
      </div>
    </section>
  );
}

const DAY = [
  { time: '7:50', ampm: 'AM', who: 'Class teacher', device: 'phone', title: 'Attendance in under a minute.', body: 'Teachers tap present, absent or late on their phone. No register to carry to the office, no tallying at the end of the month.', Screen: AttendanceScreen },
  { time: '7:58', ampm: 'AM', who: 'Parents', device: 'phone', title: 'Parents know before you pick up the phone.', body: 'The moment a class is saved, parents of absent children get a WhatsApp from your school’s own number. They reply right there.', Screen: ParentAlertScreen },
  { time: '11:20', ampm: 'AM', who: 'Front desk', device: 'laptop', route: '/finance/fees/F0111', title: 'Fee in two clicks. Receipt on WhatsApp.', body: 'One ledger per family, all siblings together. Oldest dues settle first, cash or online, and the receipt reaches the parent before they leave the desk.', Screen: FeeScreen },
  { time: '3:05', ampm: 'PM', who: 'Parent app', device: 'phone', title: 'Homework actually reaches home.', body: 'The class diary lands in the parent app the same afternoon — in English or Urdu — and you can see who opened it.', Screen: DiaryScreen },
  { time: '5:30', ampm: 'PM', who: 'Office', device: 'laptop', route: '/finance/analytics', title: 'Close the day in one look.', body: 'Collected today, still outstanding, who paid and who didn’t — the whole month’s report is one click from a PDF for the owner.', Screen: FeeScreen },
  { time: '9:02', ampm: 'PM', who: 'Owner', device: 'phone', title: 'Ask your school anything, from anywhere.', body: '“How much did we collect today?” Text it on WhatsApp and get the answer in numbers — then send reminders with one reply.', Screen: OwnerScreen },
];

// Wide screens get the sticky morphing device; small screens get a device per step.
function useWide(min) {
  const [w, setW] = useState(false);
  useEffect(() => { const on = () => setW(window.innerWidth >= min); on(); window.addEventListener('resize', on); return () => window.removeEventListener('resize', on); }, [min]);
  return w;
}

function Day() {
  const wide = useWide(1000);
  const [active, setActive] = useState(0);
  const refs = useRef([]);
  const wrap = useRef(null);
  const { scrollYProgress } = useScroll({ target: wrap, offset: ['start 0.6', 'end 0.6'] });
  const bar = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) setActive(Number(e.target.dataset.i)); }), { rootMargin: '-45% 0px -45% 0px' });
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [wide]);
  const d = DAY[active];
  const lastLaptop = [...DAY.slice(0, active + 1)].reverse().find((x) => x.device === 'laptop') || DAY.find((x) => x.device === 'laptop');
  const lastPhone = [...DAY.slice(0, active + 1)].reverse().find((x) => x.device === 'phone') || DAY[0];
  const P = lastPhone.Screen;
  return (
    <section className="mk-sec mk-day" id="day" aria-labelledby="day-title">
      <div className="mk-wrap">
        <div className="mk-head">
          <In as="p" className="mk-overline">How it works</In>
          <Words id="day-title" className="mk-h2" text="One school day, without the chasing." italic={[4, 5]} />
        </div>
        <div className="mk-day-grid" ref={wrap}>
          <div className="mk-day-steps">
            <div className="mk-day-rail" aria-hidden="true"><motion.i style={{ scaleY: bar }} /></div>
            {DAY.map((x, i) => (
              <article key={x.time} ref={(el) => { refs.current[i] = el; }} data-i={i} className={`mk-day-step ${active === i ? 'on' : ''}`}>
                <div className="mk-day-time"><b>{x.time}</b><span>{x.ampm}</span><em>{x.who}</em><small>{x.device === 'laptop' ? 'On the laptop' : 'On the phone'}</small></div>
                <h3>{x.title}</h3>
                <p>{x.body}</p>
                {!wide && <div className="mk-day-inline">{x.device === 'laptop' ? <Laptop><AppScreen route={x.route} /></Laptop> : <Phone><x.Screen /></Phone>}</div>}
              </article>
            ))}
          </div>
          {wide && (
            <div className="mk-day-stage" aria-hidden="true">
              <div className="mk-day-sticky">
                <motion.div key={active} className="mk-day-clock" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>{d.time} <small>{d.ampm}</small> · {d.who}</motion.div>
                <DeviceMorph kind={d.device} route={lastLaptop.route} phone={<P key={lastPhone.time} />} />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

const PK = [
  ['Cash at the desk is normal.', 'Collect cash in two clicks and print a receipt. Turn on bank challans and online payments only when you want them.', 'cash'],
  ['One family, one ledger.', 'Brothers and sisters share one account, one balance and one receipt — no more adding up three fee cards.', 'family'],
  ['WhatsApp from your own number.', 'Alerts come from the number parents already have saved, not a shortcode they ignore.', 'whatsapp'],
  ['English and اردو.', 'Messages, diary and result cards in the language each family reads.', 'globe'],
  ['Load-shedding proof.', 'Attendance and fee collection keep working offline and sync when the internet is back.', 'bolt'],
  ['Built for the owner too.', 'A weekly summary on WhatsApp every Monday, and answers whenever you ask.', 'sparkle'],
];

function Pakistan() {
  return (
    <section className="mk-sec mk-pk" id="pakistan" aria-labelledby="pk-title">
      <div className="mk-wrap">
        <div className="mk-head split">
          <div>
            <In as="p" className="mk-overline">Why Schooliee</In>
            <Words id="pk-title" className="mk-h2" text="Made for how schools here actually work." italic={[6]} />
          </div>
          <In as="p" className="mk-sub" delay={0.15}>Most school software is built for somewhere else and then translated. Schooliee started in Pakistani school offices — with cash counters, siblings, challans and WhatsApp groups.</In>
        </div>
        <ol className="mk-pk-list">
          {PK.map(([t, d, ic], i) => (
            <In as="li" key={t} delay={(i % 3) * 0.08}>
              <span className="mk-pk-n">{String(i + 1).padStart(2, '0')}</span>
              <span className="mk-pk-ic"><Icon name={ic} size={18} /></span>
              <h3>{t}</h3>
              <p>{d}</p>
            </In>
          ))}
        </ol>
      </div>
    </section>
  );
}

const MESSY = [['Ali Raza s/o Raza', 'cls 5', '0300-12..'], ['HIRA NOOR', '5-A', '03214..'], ['maryam', 'Five', '—'], ['Usman Tariq', '2a', '0333 4..']];
const CLEAN = [['Ali Raza', 'Class 5 · A', 'F0102'], ['Hira Noor', 'Class 5 · A', 'F0187'], ['Maryam Khan', 'Class 5 · B', 'F0033'], ['Usman Tariq', 'Class 2 · A', 'F0111']];

function Switching() {
  return (
    <section className="mk-sec mk-switch" aria-labelledby="sw-title">
      <div className="mk-wrap mk-switch-in">
        <div>
          <In as="p" className="mk-overline">Switching</In>
          <Words id="sw-title" className="mk-h2" text="Send us your registers. Get back a school." italic={[5, 6]} />
          <In as="p" className="mk-sub">Excel sheets, old software, even photos of paper registers. Our team cleans and imports students, families, classes, fee structures and staff within 24 hours — free on every plan.</In>
          <In as="ol" className="mk-switch-steps">
            <li><b>Today</b><span>Share your files on WhatsApp</span></li>
            <li><b>Tomorrow</b><span>Your school is ready to use</span></li>
            <li><b>Day 2</b><span>A short training call for your staff</span></li>
          </In>
        </div>
        <motion.div className="mk-switch-art" initial="a" whileInView="b" viewport={{ once: true, margin: '0px 0px -20% 0px' }} aria-hidden="true">
          <div className="mk-register">
            <span className="mk-register-cap">Admission register · 2019–2026</span>
            {MESSY.map((r, i) => (
              <motion.div key={i} className="mk-register-row" variants={{ a: { opacity: 1, x: 0 }, b: { opacity: 0.25, x: -8, transition: { delay: 0.6 + i * 0.15 } } }}>
                {r.map((c, k) => <span key={k}>{c}</span>)}
              </motion.div>
            ))}
          </div>
          <motion.div className="mk-switch-arrow" variants={{ a: { scale: 0.6, opacity: 0 }, b: { scale: 1, opacity: 1, transition: { delay: 0.4, type: 'spring' } } }}><Icon name="arrowRight" size={18} stroke={2.4} /></motion.div>
          <div className="mk-records">
            {CLEAN.map(([n, c, f], i) => (
              <motion.div key={f} className="mk-record" variants={{ a: { opacity: 0, y: 18, scale: 0.96 }, b: { opacity: 1, y: 0, scale: 1, transition: { delay: 0.75 + i * 0.15, type: 'spring', stiffness: 260, damping: 22 } } }}>
                <i>{n[0]}</i><div><b>{n}</b><em>{c}</em></div><span>{f}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function VideoCard({ v, i, onOpen }) {
  const ref = useRef(null);
  const ini = v.name.split(' ').map((w) => w[0]).join('');
  return (
    <In as="button" delay={i * 0.06} className="vcard" style={{ '--tint': v.tint }} onClick={() => onOpen(i)} aria-label={`Play ${v.name}'s story`}
      onMouseEnter={() => ref.current?.play().catch(() => {})} onMouseLeave={() => { if (ref.current) { ref.current.pause(); ref.current.currentTime = 0; } }}>
      {v.src ? <video ref={ref} src={v.src} muted loop playsInline preload="metadata" /> : <span className="vcard-ph"><span>{ini}</span></span>}
      <span className="vcard-shade" />
      <span className="vcard-play"><svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" fill="currentColor" /></svg></span>
      <span className="vcard-quote">“{v.quote}”</span>
      <span className="vcard-who"><b>{v.name}</b><em>{v.role} · {v.city}</em></span>
    </In>
  );
}

function Stories() {
  const rail = useRef(null);
  const [open, setOpen] = useState(null);
  const scroll = (d) => rail.current?.scrollBy({ left: d * rail.current.clientWidth * 0.7, behavior: 'smooth' });
  useEffect(() => { if (open === null) return; const k = (e) => e.key === 'Escape' && setOpen(null); document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k); }, [open]);
  const v = open !== null ? TESTIMONIAL_VIDEOS[open] : null;
  return (
    <section className="mk-sec mk-stories" id="stories" aria-labelledby="st-title">
      <div className="mk-wrap">
        <div className="mk-head split">
          <div>
            <In as="p" className="mk-overline">School stories</In>
            <Words id="st-title" className="mk-h2" text="Hear it from the people who run schools." italic={[6]} />
          </div>
          <div className="mk-rail-ctl">
            <button aria-label="Previous stories" onClick={() => scroll(-1)}><Icon name="arrowLeft" size={16} /></button>
            <button aria-label="Next stories" onClick={() => scroll(1)}><Icon name="arrowRight" size={16} /></button>
          </div>
        </div>
      </div>
      <div className="mk-rail" ref={rail}>{TESTIMONIAL_VIDEOS.map((t, i) => <VideoCard key={t.name} v={t} i={i} onOpen={setOpen} />)}</div>
      <div className="mk-wrap">
        <div className="mk-quotes">
          {QUOTES.slice(0, 3).map((q, i) => (
            <In as="figure" key={q.name} className="mk-quote" delay={i * 0.08}>
              <blockquote>“{q.text}”</blockquote>
              <figcaption><b>{q.name}</b><em>{q.tag} · on Schooliee for {q.since}</em></figcaption>
            </In>
          ))}
        </div>
      </div>
      {v && (
        <div className="mk-lightbox" onClick={() => setOpen(null)} role="dialog" aria-modal="true" aria-label={`${v.name}'s story`}>
          <div className="mk-lightbox-in" onClick={(e) => e.stopPropagation()}>
            {v.src ? <video src={v.src} controls autoPlay playsInline /> : <div className="vcard-ph big" style={{ '--tint': v.tint }}><span>{v.name.split(' ').map((w) => w[0]).join('')}</span><em>Video coming soon</em></div>}
            <div className="mk-lightbox-cap"><b>{v.name}</b><em>{v.role} · {v.city}</em></div>
          </div>
          <button className="mk-lightbox-x" aria-label="Close" onClick={() => setOpen(null)}><Icon name="close" size={18} /></button>
        </div>
      )}
    </section>
  );
}

function Pricing() {
  const [n, setN] = useState(400);
  const [yearly, setYearly] = useState(true);
  const [fee, setFee] = useState(3000);
  const billed = Math.max(MIN_BILLED, n);
  const per = (r) => (yearly ? r * (1 - YEARLY_OFF) : r);
  const fmtRate = (r) => (r % 1 ? r.toFixed(1) : String(r));
  const plans = [
    { name: 'Pro', rate: proRate(billed), blurb: 'Everything for the office and the money.', pts: ['Students, families & admissions', '2-click fee collection & receipts', 'Custom funds & double-entry ledger', 'Staff, salaries, loans & deductions', 'Roles, permissions & audit trail', 'WhatsApp AI for the owner'] },
    { name: 'Elite', rate: eliteRate(billed), hot: true, blurb: 'The whole school, parents included.', pts: ['Everything in Pro', 'Attendance, diary & exams', 'Parent app & parent–teacher chat', 'WhatsApp alerts & announcements', 'Admissions form & school website', 'Multi-branch & priority training'] },
  ];
  const share = ((per(eliteRate(billed)) / fee) * 100);
  return (
    <section className="mk-sec mk-pricing" id="pricing" aria-labelledby="pr-title">
      <div className="mk-wrap">
        <div className="mk-head center">
          <In as="p" className="mk-overline">Pricing</In>
          <Words id="pr-title" className="mk-h2" text="Priced per student. Never per surprise." italic={[3, 4]} />
          <In as="p" className="mk-sub">You pay for active students only, from a {MIN_BILLED}-student minimum. Setup, data import and training are free.</In>
        </div>
        <In className="mk-calc">
          <label className="mk-calc-f">
            <span>Active students <b>{n >= 2000 ? '2,000+' : pk(n)}</b></span>
            <input type="range" min="50" max="2000" step="50" value={n} onChange={(e) => setN(Number(e.target.value))} style={{ '--p': `${((n - 50) / 1950) * 100}%` }} />
          </label>
          <label className="mk-calc-f">
            <span>Your monthly fee <b>Rs {pk(fee)}</b></span>
            <input type="range" min="500" max="15000" step="250" value={fee} onChange={(e) => setFee(Number(e.target.value))} style={{ '--p': `${((fee - 500) / 14500) * 100}%` }} />
          </label>
          <div className="mk-seg" role="group" aria-label="Billing period">
            <button className={!yearly ? 'on' : ''} onClick={() => setYearly(false)} aria-pressed={!yearly}>Monthly</button>
            <button className={yearly ? 'on' : ''} onClick={() => setYearly(true)} aria-pressed={yearly}>Yearly <i>−30%</i></button>
          </div>
        </In>
        <In as="p" className="mk-calc-line">Even on Elite, Schooliee costs <b>{share < 1 ? share.toFixed(2) : share.toFixed(1)}%</b> of the fee you collect from each student.</In>
        <div className="mk-plans">
          {plans.map((p, i) => (
            <In key={p.name} className={`mk-plan ${p.hot ? 'hot' : ''}`} delay={i * 0.08}>
              <div className="mk-plan-top"><h3>{p.name}</h3>{p.hot && <span>Complete</span>}</div>
              <p className="mk-plan-blurb">{p.blurb}</p>
              <div className="mk-plan-price"><small>Rs</small><b>{fmtRate(per(p.rate))}</b><em>per student<br />per month</em></div>
              <p className="mk-plan-total">{yearly ? `Rs ${pk(per(p.rate) * billed * 12)} a year` : `Rs ${pk(p.rate * billed)} a month`} for {pk(billed)} students</p>
              <Link className={`mk-btn ${p.hot ? 'lime' : 'ink'} block`} to={`/sign-up?plan=${p.name.toLowerCase()}`}>Start with {p.name}</Link>
              <ul>{p.pts.map((t) => <li key={t}><Icon name="check" size={14} stroke={2.4} />{t}</li>)}</ul>
            </In>
          ))}
          <In className="mk-plan build" delay={0.16}>
            <div className="mk-plan-top"><h3>Your own mix</h3></div>
            <p className="mk-plan-blurb">Start from the base plan and switch on only what you need. The price never goes above Elite.</p>
            <div className="mk-plan-price"><small>from Rs</small><b>5</b><em>per student<br />per month</em></div>
            <p className="mk-plan-total">Base plan: students, fees, classes, ledger and basic reports.</p>
            <Link className="mk-btn line block" to="/sign-up?plan=custom">Build my plan</Link>
          </In>
        </div>
      </div>
    </section>
  );
}

function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section className="mk-sec mk-faq-sec" id="faq" aria-labelledby="faq-title">
      <div className="mk-wrap mk-faq-in">
        <div className="mk-faq-side">
          <In as="p" className="mk-overline">Questions</In>
          <Words id="faq-title" className="mk-h2" text="Fair questions, straight answers." italic={[2, 3]} />
          <In as="p" className="mk-sub">Something else on your mind? A real person replies on WhatsApp, usually within the hour.</In>
          <In><a className="mk-btn line" href={WA} target="_blank" rel="noreferrer"><Icon name="whatsapp" size={16} />Ask us on WhatsApp</a></In>
        </div>
        <div className="mk-faq">
          {FAQ.map(([q, a], i) => (
            <div key={q} className={`mk-faq-item ${open === i ? 'open' : ''}`}>
              <h3><button onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i} aria-controls={`faq-${i}`}><span>{q}</span><i aria-hidden="true"><Icon name="plus" size={16} /></i></button></h3>
              <div className="mk-faq-a" id={`faq-${i}`} role="region"><div><p>{a}</p></div></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Cta() {
  return (
    <section className="mk-cta" aria-labelledby="cta-title">
      <div className="mk-wrap">
        <div className="mk-cta-box">
          <Words id="cta-title" className="mk-h2 xl" text="Your school could be running on Schooliee by tonight." italic={[7]} />
          <In as="ol" className="mk-cta-steps">
            <li><b>10 minutes</b> to build it</li>
            <li><b>3 hours</b> to try everything</li>
            <li><b>Then</b> pay by bank transfer to keep it</li>
          </In>
          <In className="mk-hero-cta center">
            <Link className="mk-btn lime lg" to="/sign-up">Build your school</Link>
            <a className="mk-btn line-light lg" href={WA} target="_blank" rel="noreferrer"><Icon name="whatsapp" size={17} />Talk to us first</a>
          </In>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const cities = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Gujranwala', 'Sialkot'];
  return (
    <footer className="mk-foot">
      <div className="mk-wrap">
        <div className="mk-foot-in">
          <div className="mk-foot-brand"><Logo /><p>School management software for Pakistan — fees, attendance, exams, payroll and parent communication in one place.</p></div>
          <nav className="mk-foot-cols" aria-label="Footer">
            <div><b>Product</b><a href="#day">How it works</a><a href="#pricing">Pricing</a><Link to="/sign-up">Build your school</Link><a href="https://www.schooliee.com/sign-in/">Sign in</a></div>
            <div><b>Company</b><a href="https://www.schooliee.com/about/">About</a><a href="https://www.schooliee.com/blogs/">Blog</a><a href="https://www.schooliee.com/contact/">Contact</a></div>
            <div><b>Talk to us</b><a href={WA} target="_blank" rel="noreferrer">WhatsApp · 0302 7987128</a></div>
          </nav>
        </div>
        <p className="mk-foot-cities">School management system in {cities.join(', ')} and across Pakistan.</p>
        <div className="mk-foot-base"><span>© 2026 Schooliee</span><span>Made in Pakistan</span></div>
      </div>
    </footer>
  );
}

export default function Home() {
  useSeo('/site');
  useEffect(() => { if (!window.location.hash) window.scrollTo(0, 0); }, []);
  return (
    <div className="mk">
      <a className="mk-skip" href="#main">Skip to content</a>
      <Nav />
      <main id="main">
        <Hero />
        <PromoVideo />
        <Day />
        <Pakistan />
        <Switching />
        <Stories />
        <Pricing />
        <Faq />
        <Cta />
      </main>
      <Footer />
      <a className="mk-wa-fab" href={WA} target="_blank" rel="noreferrer" aria-label="Chat with Schooliee on WhatsApp"><Icon name="whatsapp" size={24} /></a>
    </div>
  );
}
