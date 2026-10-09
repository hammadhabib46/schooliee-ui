// Phone screens shown inside the 3D phone (and the flat fallback phone).
// Each is a real Schooliee moment, sized for a 300×640 screen.
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const pop = { initial: { opacity: 0, y: 14, scale: 0.96 }, animate: { opacity: 1, y: 0, scale: 1 }, transition: { type: 'spring', stiffness: 380, damping: 30 } };

function StatusBar({ dark }) {
  return (
    <div className={`ps-status ${dark ? 'dark' : ''}`}>
      <b>9:41</b><span className="ps-island" /><i>●●●</i>
    </div>
  );
}

function WaHead({ title = 'Al-Noor Grammar School', sub = 'Official · Schooliee' }) {
  return (
    <div className="ps-wa-head">
      <span className="ps-wa-av">A</span>
      <div><b>{title}</b><em>{sub}</em></div>
    </div>
  );
}

// Hero: a parent's WhatsApp filling up through the day.
const HERO_MSGS = [
  { t: '7:58 AM', who: 'school', body: <>Assalam-o-Alaikum. <b>Daniyal (Class 2-A)</b> is marked <b className="red">absent</b> today. Reply if this is a mistake.</> },
  { t: '8:01 AM', who: 'me', body: <>He has fever today, will come tomorrow</> },
  { t: '11:20 AM', who: 'school', body: <>Received <b>Rs 6,000</b> for October fee. Receipt <b>#20261009</b>. JazakAllah!</>, card: 'receipt' },
  { t: '3:05 PM', who: 'school', body: <>📘 Today’s diary · Maths: p.42 Q1–5. English: learn spellings 1–10.</> },
  { t: '6:30 PM', who: 'school', body: <>🏆 Term result: <b>Hira Noor</b> stood <b>1st</b> in Class 5-A with 92%.</> },
];

export function HeroChat() {
  const [n, setN] = useState(1);
  useEffect(() => {
    const t = setInterval(() => setN((x) => (x >= HERO_MSGS.length ? 1 : x + 1)), 2100);
    return () => clearInterval(t);
  }, []);
  const shown = HERO_MSGS.slice(Math.max(0, n - 4), n);
  return (
    <div className="ps ps-wa">
      <StatusBar />
      <WaHead />
      <div className="ps-wa-body">
        <span className="ps-day">Today</span>
        <AnimatePresence initial={false} mode="popLayout">
          {shown.map((m) => (
            <motion.div key={m.t} layout {...pop} exit={{ opacity: 0, y: -20 }} className={`ps-bubble ${m.who === 'me' ? 'me' : ''}`}>
              {m.card === 'receipt' && <span className="ps-receipt"><i>✓</i><b>Rs 6,000</b><em>Paid · Cash</em></span>}
              <span>{m.body}</span>
              <em>{m.t} {m.who === 'school' ? '✓✓' : ''}</em>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div className="ps-wa-input"><span>Message</span><i>➤</i></div>
    </div>
  );
}

// ---- "A day at your school" screens ----
export function AttendanceScreen() {
  const kids = [['Ali Raza', 'P'], ['Daniyal Usman', 'A'], ['Hira Noor', 'P'], ['Maryam Khan', 'P'], ['Usman Tariq', 'L'], ['Zainab Ali', 'P'], ['Bilal Ahmed', 'P']];
  return (
    <div className="ps ps-light">
      <StatusBar dark />
      <div className="ps-app-head"><em>Teacher · Naima</em><b>Class 2 · A</b><span>31 of 33 present</span></div>
      <div className="ps-list">
        {kids.map(([name, s], i) => (
          <motion.div key={name} className="ps-att" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
            <i>{name[0]}</i><b>{name}</b>
            {['P', 'A', 'L'].map((x) => <span key={x} className={s === x ? `on ${x}` : ''}>{x}</span>)}
          </motion.div>
        ))}
      </div>
      <div className="ps-cta">Save attendance</div>
    </div>
  );
}

export function ParentAlertScreen() {
  return (
    <div className="ps ps-wa">
      <StatusBar />
      <WaHead />
      <div className="ps-wa-body">
        <span className="ps-day">Today</span>
        <motion.div {...pop} className="ps-bubble"><span>Assalam-o-Alaikum. <b>Daniyal (Class 2-A)</b> is marked <b className="red">absent</b> today. Reply if this is a mistake.</span><em>7:58 AM ✓✓</em></motion.div>
        <motion.div {...pop} transition={{ ...pop.transition, delay: 0.5 }} className="ps-bubble me"><span>He has fever, will come tomorrow</span><em>8:01 AM</em></motion.div>
      </div>
      <div className="ps-wa-input"><span>Message</span><i>➤</i></div>
    </div>
  );
}

export function FeeScreen() {
  const lines = [['Monthly fee', 'Oct', '6,000'], ['Bus', 'Oct', '3,500'], ['Paper fund', 'Sep', '100']];
  return (
    <div className="ps ps-light">
      <StatusBar dark />
      <div className="ps-app-head"><em>Front desk · Fee collection</em><b>Usman · F0111</b><span>2 children · owes Rs 9,600</span></div>
      <div className="ps-list">
        {lines.map(([a, m, v], i) => (
          <motion.div key={a} className="ps-fee" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <span className="ck" /><b>{a}</b><em>{m}</em><strong>{v}</strong>
          </motion.div>
        ))}
        <motion.div className="ps-paid" initial={{ opacity: 0, scale: 0.8, rotate: -8 }} animate={{ opacity: 1, scale: 1, rotate: -6 }} transition={{ delay: 0.6, type: 'spring', stiffness: 260, damping: 16 }}>PAID</motion.div>
      </div>
      <div className="ps-split"><span>Cash</span><span>Online</span></div>
      <div className="ps-cta lime">Collect Rs 9,600 · send receipt</div>
    </div>
  );
}

export function DiaryScreen() {
  return (
    <div className="ps ps-light">
      <StatusBar dark />
      <div className="ps-app-head"><em>Parent app · Daniyal</em><b>Today’s diary</b><span>Class 2-A · Thursday</span></div>
      <div className="ps-list">
        {[['Maths', 'Page 42, questions 1–5 in notebook.'], ['English', 'Learn spellings 1–10 for Friday’s test.'], ['Urdu', 'سبق نمبر ۴ پڑھ کر آئیں']].map(([s, t], i) => (
          <motion.div key={s} className="ps-diary" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}><b>{s}</b><span lang={s === 'Urdu' ? 'ur' : undefined}>{t}</span></motion.div>
        ))}
        <div className="ps-seen">Seen by parent · 3:12 PM</div>
      </div>
    </div>
  );
}

export function OwnerScreen() {
  return (
    <div className="ps ps-wa">
      <StatusBar />
      <WaHead title="Schooliee AI" sub="Your school’s data, on WhatsApp" />
      <div className="ps-wa-body">
        <span className="ps-day">Today</span>
        <motion.div {...pop} className="ps-bubble me"><span>How much fee did we collect today?</span><em>9:02 PM</em></motion.div>
        <motion.div {...pop} transition={{ ...pop.transition, delay: 0.6 }} className="ps-bubble"><span><b>Rs 1,02,500</b> from 23 families today — 18% more than last Thursday. 27 families still owe for October.</span><em>9:02 PM</em></motion.div>
        <motion.div {...pop} transition={{ ...pop.transition, delay: 1.2 }} className="ps-bubble me"><span>Remind them</span><em>9:03 PM</em></motion.div>
        <motion.div {...pop} transition={{ ...pop.transition, delay: 1.8 }} className="ps-bubble"><span>Done. 27 reminders queued for 9 AM tomorrow.</span><em>9:03 PM</em></motion.div>
      </div>
      <div className="ps-wa-input"><span>Ask anything about your school</span><i>➤</i></div>
    </div>
  );
}

// Onboarding preview: the parent app, branded with the school being built.
export function ParentAppPreview({ school, logo, city, features = [] }) {
  const name = school || 'Your school';
  const ini = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const has = (k) => features.includes(k);
  return (
    <div className="ps ps-light">
      <StatusBar dark />
      <div className="ps-brand">
        <span className="ps-brand-logo">{logo ? <img src={logo} alt="" /> : ini}</span>
        <div><b>{name}</b><em>{city || 'Parent app'}</em></div>
      </div>
      <div className="ps-kid"><i>D</i><div><b>Daniyal</b><em>Class 2 · A</em></div></div>
      <div className="ps-tiles">
        <motion.div layout className="ps-tile dues"><em>October fee</em><b>Rs 6,000</b><span>{has('challans') ? 'Pay with challan' : 'Pay at school desk'}</span></motion.div>
        {has('attendance') && <motion.div layout {...pop} className="ps-tile"><em>Today</em><b className="ok">Present</b></motion.div>}
        {has('diary') && <motion.div layout {...pop} className="ps-tile"><em>Diary</em><b>Maths p.42</b></motion.div>}
        {has('exams') && <motion.div layout {...pop} className="ps-tile"><em>Last result</em><b>88% · 3rd</b></motion.div>}
        {has('timetable') && <motion.div layout {...pop} className="ps-tile"><em>Next period</em><b>English</b></motion.div>}
      </div>
      {has('app') ? <div className="ps-cta">Chat with class teacher</div> : <div className="ps-note">Turn on the parent app to give every family this screen.</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sign-up tour: the parent app, branded with the school being built, playing
// through what parents actually do. Only features the school switched on appear.
function Brand({ school, logo, city }) {
  const name = school || 'Your school';
  const ini = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="ps-brand">
      <span className="ps-brand-logo">{logo ? <img src={logo} alt="" /> : ini}</span>
      <div><b>{name}</b><em>{city || 'Parent app'}</em></div>
    </div>
  );
}

// A finger-tap pulse that lands on a spot partway through the scene.
function Tap({ x, y, delay = 1.4 }) {
  return (
    <motion.span className="ps-tap" style={{ left: x, top: y }}
      initial={{ opacity: 0, scale: 1.6 }} animate={{ opacity: [0, 1, 1, 0], scale: [1.6, 1, 0.85, 1.3] }}
      transition={{ delay, duration: 0.9, times: [0, 0.35, 0.6, 1] }} />
  );
}

// Bottom tab bar of the parent app.
function Tabs({ on }) {
  const items = [['home', 'Home'], ['cash', 'Fees'], ['diary', 'Diary'], ['exam', 'Results'], ['engage', 'Chat']];
  return (
    <div className="ps-tabs">
      {items.map(([ic, l]) => <span key={l} className={on === l ? 'on' : ''}><TabIcon name={ic} />{l}</span>)}
    </div>
  );
}
const TAB_PATHS = {
  home: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
  cash: 'M3 6h18v12H3zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  diary: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11',
  exam: 'M9 4h6l1 2h3v15H5V6h3zM8 12l3 3 5-6',
  engage: 'M4 5h16v11H9l-5 4z',
};
function TabIcon({ name }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={TAB_PATHS[name]} /></svg>;
}

function TourHome(p) {
  const today = [
    p.has('attendance') && ['7:58', 'Marked present', 'Class 2 · A', 'ok'],
    p.has('diary') && ['3:05', 'Diary posted', 'Maths, English, Urdu', ''],
    ['10:30', 'Fee reminder', 'October fee due on the 10th', 'warn'],
    p.has('exams') && ['Fri', 'Mid-term results out', '88% · 3rd position', ''],
  ].filter(Boolean);
  return (
    <div className="ps ps-light">
      <StatusBar dark />
      <Brand {...p} />
      <div className="ps-kids">
        <span className="on"><i>D</i>Daniyal</span>
        <span><i>F</i>Fatima</span>
      </div>
      <div className="ps-tiles" style={{ flex: 'none' }}>
        <motion.div {...pop} className="ps-tile dues"><em>October fee · due 10 Oct</em><b>Rs 6,000</b><span>{p.has('challans') ? 'Pay online or with challan' : 'Pay at the school desk'}</span></motion.div>
        <motion.div {...pop} transition={{ ...pop.transition, delay: 0.08 }} className="ps-tile"><em>Attendance</em><b className="ok">96%</b></motion.div>
        <motion.div {...pop} transition={{ ...pop.transition, delay: 0.14 }} className="ps-tile"><em>Last result</em><b>88% · 3rd</b></motion.div>
      </div>
      <div className="ps-sec">Today</div>
      <div className="ps-timeline">
        {today.map(([t, a, b, tone], i) => (
          <motion.div key={a} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }}>
            <em>{t}</em><i className={tone} /><span><b>{a}</b>{b}</span>
          </motion.div>
        ))}
      </div>
      <Tabs on="Home" />
      <Tap x={150} y={186} />
    </div>
  );
}

function TourPay(p) {
  const online = p.has('online') || p.has('challans');
  const lines = [['Tuition fee', 'Oct', '5,000'], ['Bus', 'Oct', '1,000'], ['Paper fund', 'Term 2', '300'], ['Sibling discount', '', '−300']];
  return (
    <div className="ps ps-light">
      <StatusBar dark />
      <div className="ps-app-head"><em>{p.school || 'Your school'} · Daniyal</em><b>October fee</b><span>Due Friday, 10 October</span></div>
      <div className="ps-bill">
        {lines.map(([a, m, v], i) => <motion.div key={a} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}><span>{a}{m && <em> · {m}</em>}</span><b className={v.startsWith('−') ? 'ok' : ''}>{v}</b></motion.div>)}
        <div className="ps-bill-total"><span>Total</span><b>Rs 6,000</b></div>
        <motion.div className="ps-paid" initial={{ opacity: 0, scale: 0.6, rotate: -14 }} animate={{ opacity: 1, scale: 1, rotate: -6 }} transition={{ delay: 2.3, type: 'spring', stiffness: 260, damping: 14 }}>PAID</motion.div>
      </div>
      <div className="ps-methods"><span className="on">{online ? 'Online transfer' : 'Cash at desk'}</span><span>{online ? 'Cash at desk' : 'Bank challan'}</span></div>
      <div className="ps-cta lime" style={{ margin: '8px 12px 6px' }}>{online ? 'Pay Rs 6,000' : 'Show challan at the desk'}</div>
      <div className="ps-sec">Paid before</div>
      <div className="ps-history">
        {[['September', '12 Sep', 'Online'], ['August', '9 Aug', 'Cash']].map(([m, d, how]) => <div key={m}><i>✓</i><span><b>{m} fee</b>{d} · {how}</span><strong>6,000</strong></div>)}
      </div>
      <Tabs on="Fees" />
      <Tap x={150} y={318} delay={1.3} />
      <motion.div className="ps-notif" initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 2.6, type: 'spring', stiffness: 300, damping: 26 }}>
        <i>✓</i><span><b>Payment received · Rs 6,000</b>Receipt #20261009 · thank you!</span>
      </motion.div>
    </div>
  );
}

function TourAttendance() {
  // October 2026 starts on a Thursday; Sundays are off.
  const marks = { 1: 'P', 2: 'P', 3: 'P', 5: 'P', 6: 'L', 7: 'P', 8: 'P', 9: 'A', 10: 'P', 12: 'P', 13: 'P', 14: 'V', 15: 'P', 16: 'P', 17: 'P', 19: 'P', 20: 'P', 21: 'P' };
  const cells = [null, null, null, ...Array.from({ length: 31 }, (_, i) => i + 1)];
  return (
    <div className="ps ps-light">
      <StatusBar dark />
      <div className="ps-app-head"><em>Daniyal · Class 2 A</em><b>Attendance</b><span>October 2026 · 94%</span></div>
      <div className="ps-att-sum">
        {[['16', 'Present', 'ok'], ['1', 'Late', 'warn'], ['1', 'Absent', 'bad'], ['1', 'Leave', 'info']].map(([n, l, t]) => <div key={l} className={t}><b>{n}</b><em>{l}</em></div>)}
      </div>
      <div className="ps-cal-head">{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i}>{d}</span>)}</div>
      <div className="ps-cal">
        {cells.map((d, i) => {
          if (!d) return <span key={i} className="blank" />;
          const sun = (i % 7) === 6;
          const m = marks[d];
          return <motion.span key={i} className={sun ? 'off' : m ? `c-${m}` : 'future'} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.015 * i }}>{d}</motion.span>;
        })}
      </div>
      <div className="ps-legend"><span className="c-P">Present</span><span className="c-L">Late</span><span className="c-A">Absent</span><span className="c-V">Leave</span></div>
      <Tabs on="Home" />
      <motion.div className="ps-notif" initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1.6, type: 'spring', stiffness: 300, damping: 26 }}>
        <i className="warn">!</i><span><b>Daniyal is absent today</b>Reply here if this is a mistake</span>
      </motion.div>
    </div>
  );
}

function TourDiary(p) {
  const entries = [
    ['Maths', 'Ms Naima', 'Page 42, Q1–5 in the notebook. Show working.'],
    ['English', 'Mr Hammad', 'Learn spellings 1–10 for Friday’s test.'],
    ['Science', 'Ms Sana', 'Draw the parts of a plant and label them.', true],
    ['Urdu', 'Ms Ayesha', 'سبق نمبر ۴ پڑھ کر آئیں'],
  ];
  return (
    <div className="ps ps-light">
      <StatusBar dark />
      <div className="ps-app-head"><em>{p.school || 'Your school'} · Class 2 A</em><b>Diary</b><span>4 subjects today</span></div>
      <div className="ps-days">{[['Mon', 5], ['Tue', 6], ['Wed', 7], ['Thu', 8], ['Fri', 9]].map(([d, n]) => <span key={n} className={n === 9 ? 'on' : ''}><em>{d}</em><b>{n}</b></span>)}</div>
      <div className="ps-list" style={{ gap: 6 }}>
        {entries.map(([s, t, body, att], i) => (
          <motion.div key={s} className="ps-diary" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 * i }}>
            <div className="row between"><b>{s}</b><em className="ps-by">{t}</em></div>
            <span lang={s === 'Urdu' ? 'ur' : undefined}>{body}</span>
            {att && <span className="ps-att-file">📎 plant-diagram.jpg</span>}
          </motion.div>
        ))}
      </div>
      <motion.div className="ps-seen" style={{ margin: '6px 0 6px' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}>✓ Seen by you · 3:12 PM</motion.div>
      <Tabs on="Diary" />
      <Tap x={150} y={260} delay={1.2} />
    </div>
  );
}

function TourResult() {
  const subs = [['English', 92, 'A+'], ['Maths', 88, 'A'], ['Science', 84, 'A'], ['Urdu', 90, 'A+'], ['Islamiat', 86, 'A']];
  return (
    <div className="ps ps-light">
      <StatusBar dark />
      <div className="ps-app-head"><em>Mid-term 2026 · Class 2 A</em><b>Result card</b><span>Published Friday, 9 October</span></div>
      <div className="ps-result-top">
        <motion.div className="ps-grade" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring' }}><b>88%</b><span>Grade A</span></motion.div>
        <div className="ps-result-stats"><div><em>Position</em><b>3rd of 33</b></div><div><em>Total</em><b>440 / 500</b></div><div><em>Class average</em><b>71%</b></div></div>
      </div>
      <div className="ps-list" style={{ gap: 5, flex: 'none' }}>
        {subs.map(([s, m, g], i) => (
          <div key={s} className="ps-mark"><em>{s}</em><span><motion.i initial={{ width: 0 }} animate={{ width: `${m}%` }} transition={{ delay: 0.2 + i * 0.12, duration: 0.8 }} /></span><b>{m}<small> {g}</small></b></div>
        ))}
      </div>
      <motion.div className="ps-remark" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}>“Daniyal works hard and helps others. Keep reading every day.” <em>— Ms Naima, class teacher</em></motion.div>
      <div className="ps-cta" style={{ margin: '6px 12px' }}>Download result card</div>
      <Tabs on="Results" />
      <Tap x={150} y={550} delay={2} />
    </div>
  );
}

function TourChat(p) {
  const msgs = [
    ['me', 'Assalam-o-Alaikum, is there a test on Friday?', '4:02 PM'],
    ['t', 'Wa Alaikum Assalam! Yes — English spellings 1 to 10. 📘', '4:05 PM'],
    ['me', 'Daniyal was absent on Thursday, can he get the worksheet?', '4:06 PM'],
    ['t', 'Of course, I’ll send it with him tomorrow.', '4:08 PM'],
    ['me', 'JazakAllah 🙏', '4:08 PM'],
  ];
  return (
    <div className="ps ps-wa">
      <StatusBar />
      <div className="ps-wa-head"><span className="ps-wa-av">N</span><div><b>Ms Naima</b><em>Class teacher · {p.school || 'Your school'}</em></div></div>
      <div className="ps-wa-body">
        <span className="ps-day">Today</span>
        {msgs.map(([who, t, at], i) => (
          <motion.div key={i} {...pop} transition={{ ...pop.transition, delay: i * 0.55 }} className={`ps-bubble ${who === 'me' ? 'me' : ''}`}><span>{t}</span><em>{at}{who === 't' ? ' ✓✓' : ''}</em></motion.div>
        ))}
      </div>
      <div className="ps-wa-input"><span>Message Ms Naima</span><i>➤</i></div>
    </div>
  );
}

const TOUR = [
  { key: 'home', caption: 'Everything about their child, at a glance', Screen: TourHome },
  { key: 'pay', caption: 'Fees paid in two taps — receipt arrives instantly', Screen: TourPay },
  { key: 'att', caption: 'Absence alerts the moment a class is marked', Screen: TourAttendance, needs: 'attendance' },
  { key: 'diary', caption: 'Homework reaches home the same afternoon', Screen: TourDiary, needs: 'diary' },
  { key: 'result', caption: 'Result cards the day marks are entered', Screen: TourResult, needs: 'exams' },
  { key: 'chat', caption: 'A direct line to the class teacher', Screen: TourChat, needs: 'app' },
];

export function useParentTour(features = [], every = 4200) {
  const steps = TOUR.filter((s) => !s.needs || features.includes(s.needs));
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const t = setInterval(() => setI((x) => (x + 1) % steps.length), every);
    return () => clearInterval(t);
  }, [steps.length, every, paused]);
  const at = i % steps.length;
  return { steps, at, setAt: (n) => { setI(n); setPaused(true); }, setPaused };
}

export function ParentAppTour({ school, logo, city, features = [], step }) {
  const has = (k) => features.includes(k);
  const S = step.Screen;
  return (
    <AnimatePresence mode="wait">
      <motion.div key={step.key} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }} style={{ width: 300, height: 640 }}>
        <S school={school} logo={logo} city={city} has={has} />
      </motion.div>
    </AnimatePresence>
  );
}
