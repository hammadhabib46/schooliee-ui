import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as seed from '../data/seed.js';
import { demoIso, fmt } from './format.js';
import { payslip } from './payroll.js';
import { buildHistory } from './student.js';

const Ctx = createContext(null);

export const dueOf = (s) => (s?.dues || []).reduce((a, d) => a + d.amount, 0);
export const code = (s) => s.code || s.id;

let seq = 300; // eslint-disable-line prefer-const
const nextId = (p) => `${p}${String(++seq).padStart(4, '0')}`;
const nowIso = () => demoIso();

const STORAGE_KEY = 'schooliee-demo-v7';
// Drop copies saved by older versions of the demo so they don't pile up in the browser.
try { Object.keys(localStorage).filter((k) => k.startsWith('schooliee-demo-v') && k !== STORAGE_KEY).forEach((k) => localStorage.removeItem(k)); } catch { /* storage unavailable */ }

function fresh() {
  return {
    school: seed.school,
    classes: seed.classes,
    families: seed.families,
    students: seed.students.map((st) => {
      const cls = seed.classes.find((c) => c.id === st.classId);
      const { history, paidTotal } = buildHistory(st, cls);
      return { ...st, history, paid: paidTotal };
    }),
    staff: seed.staff.map((st) => ({ ...st, salaryHistory: (seed.salaryHistory[st.id] || []).map(([month, amount, date]) => ({ month, amount, date })) })),
    ledger: seed.ledger,
    exams: seed.exams,
    announcements: seed.announcements,
    inquiries: seed.inquiries.map((q) => ({ comments: [], ...(seed.inquiryExtra[q.id] || {}), ...q })),
    observations: seed.observations,
    diary: seed.diary,
    documents: seed.documents,
    timetable: seed.timetable,
    activity: seed.activity,
    chats: seed.chats,
    funds: seed.fundsFull,
    users: seed.users,
    todos: seed.todos,
    aiChats: seed.aiChats,
    grading: seed.gradingScheme,
    obsQuestions: seed.observationQuestions,
    tt: seed.timetableSettings,
    classFeeHistory: seed.classFeeHistory,
    settings: seed.schoolSettings,
    challans: seed.challans,
    lessons: {}, // { 'slotId@YYYY-MM-DD': { done, doneAt, notes, unavailable, sub, moved, cancelled } }
    payruns: {}, // { 'YYYY-MM': { [staffId]: { adds, cuts, waived, hold, payments } } }
    checkins: {},
    remarks: {},
    bankAccounts: seed.bankAccounts,
    attendance: {}, // { [date]: { [studentId]: 'P'|'L'|'A'|'V' } }
    attendanceSaved: {}, // { [date]: true }
    staffAttendance: {},
    payroll: {}, // { [staffId]: { amount, date, method } } for October 2026
    notifications: [
      { id: 'N1', icon: 'warn', text: 'Subscription payment is overdue. Settle to keep using all features.', when: '2026-10-09T08:00', tone: 'warn' },
      { id: 'N2', icon: 'userPlus', text: 'New admission inquiry from Website Verification Family.', when: '2026-10-08T20:47' },
      { id: 'N3', icon: 'cash', text: 'Ali Raza paid 2,800 PKR (challan SN7-00000095).', when: '2026-10-08T06:40' },
      { id: 'N4', icon: 'leave', text: 'Fatima Iqbal (S-00010) requested leave for 8 Oct.', when: '2026-10-07T19:02' },
    ],
    unreadNotifications: 2,
  };
}

export function StoreProvider({ children }) {
  const [db, setDb] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved && saved.students) {
        // keep generated ids unique across reloads
        const used = Array.from(JSON.stringify(saved).matchAll(/"[A-Za-z-]+(\d{4})"/g), (m) => Number(m[1])).filter((n) => n < 5000);
        seq = Math.max(seq, ...used);
        return { ...fresh(), ...saved };
      }
    } catch (e) { /* storage unavailable */ }
    return fresh();
  });
  useEffect(() => {
    const t = setTimeout(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); } catch (e) { /* storage unavailable */ } }, 300);
    return () => clearTimeout(t);
  }, [db]);

  // UI state
  const [ui, setUi] = useState({ collect: null, cmdk: false, todos: false, notifications: false, compose: null, fine: null, record: null, ai: null });
  const [toasts, setToasts] = useState([]);
  const tid = useRef(0);

  const toast = useCallback((text, opts = {}) => {
    const id = ++tid.current;
    setToasts((t) => [...t, { id, text, ...opts }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), opts.duration || 4200);
  }, []);
  const dismissToast = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const open = useCallback((k, v = true) => setUi((u) => ({ ...u, [k]: v })), []);
  const close = useCallback((k) => setUi((u) => ({ ...u, [k]: k === 'cmdk' || k === 'todos' || k === 'notifications' ? false : null })), []);

  const dateShortOf = (iso) => { const m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']; return `${Number(iso.slice(8, 10))} ${m[Number(iso.slice(5, 7)) - 1]}`; };
  // Automatic parent messages, as on live: the app always gets them; WhatsApp only when the
  // event's WhatsApp switch is on (Messages → Automations) and the family's number is verified,
  // otherwise it's counted as "skipped".
  const autoMsg = (d, { event, type, title, body, familyIds }) => {
    const fams = d.families.filter((f) => familyIds.includes(f.id));
    if (!fams.length) return d;
    const waOn = event ? !!(d.settings.alerts?.[event] || [])[0] : false;
    const waOk = waOn ? fams.filter((f) => f.waVerified).length : 0;
    const a = { id: nextId('A'), kind: 'auto', type, title, body, date: nowIso().slice(0, 10), by: 'System', app: [fams.length, fams.length], wa: [waOk, waOn ? fams.length : 0], waSkipped: waOn ? fams.length - waOk : 0, status: 'delivered' };
    return { ...d, announcements: [a, ...d.announcements] };
  };
  const famOf = (d, studentId) => d.students.find((x) => x.id === studentId)?.familyId;
  const log = (d, what) => ({ ...d, activity: [{ id: nextId('AC'), who: 'Demo school', what, when: nowIso() }, ...d.activity] });

  const actions = useMemo(() => ({
    collectPayment({ familyId, items, amount, method, note, receipt }) {
      // items: [{ studentId, dueId }] in priority order; amount allocated in that order
      setDb((d) => {
        let left = amount;
        const touched = new Set();
        const students = d.students.map((s) => {
          const mine = items.filter((i) => i.studentId === s.id).map((i) => i.dueId);
          if (!mine.length) return s;
          let paidHere = 0;
          const dues = [];
          for (const due of s.dues) {
            if (!mine.includes(due.id) || left <= 0) { dues.push(due); continue; }
            const pay = Math.min(left, due.amount);
            left -= pay; paidHere += pay;
            if (due.amount - pay > 0) dues.push({ ...due, amount: due.amount - pay });
          }
          if (!paidHere) return s;
          touched.add(s.id);
          const cleared = s.dues.filter((x) => mine.includes(x.id) && !dues.some((y) => y.id === x.id)).map((x) => x.id);
          const fines = (s.fines || []).map((f) => (cleared.includes(f.id) ? { ...f, status: 'paid' } : f));
          const charges = (s.charges || []).map((c) => (s.dues.some((x) => cleared.includes(x.id) && x.cat === 'onetime' && x.label === c.label) ? { ...c, paid: c.amount } : c));
          const pay = { id: nextId('py'), date: nowIso(), kind: 'payment', label: 'Fee payment', method, amount: paidHere, receipt: receipt || `RCP-${seq}`, note };
          return { ...s, dues, fines, charges, paid: s.paid + paidHere, history: [...(s.history || []), pay] };
        });
        const fam = d.families.find((f) => f.id === familyId);
        const ids = [...touched].map((id) => d.students.find((s) => s.id === id)).map(code).join(', ');
        const entry = { id: nextId('L'), date: nowIso(), amount, type: 'in', method, category: 'Monthly fee', reason: note || 'Fee payment', ref: `${familyId}${ids ? ' · ' + ids : ''}`, by: 'Demo school', doc: 'Invoice' };
        const families = d.families.map((f) => (f.id === familyId ? { ...f, paidTotal: f.paidTotal + amount } : f));
        return log({ ...d, students, families, ledger: [entry, ...d.ledger] }, `collected ${fmt(amount)} PKR from ${fam?.name} (${familyId})`);
      });
    },
    // ---- Payroll: one pay run per month, one item per staff member ----
    payrunUpdate(month, staffId, patch) {
      setDb((d) => {
        const run = { ...(d.payruns?.[month] || {}) };
        const cur = run[staffId] || {};
        run[staffId] = { ...cur, ...(typeof patch === 'function' ? patch(cur) : patch) };
        return { ...d, payruns: { ...(d.payruns || {}), [month]: run } };
      });
    },
    payrunAddLine(month, staffIds, kind, line) {
      setDb((d) => {
        const run = { ...(d.payruns?.[month] || {}) };
        staffIds.forEach((sid) => {
          const cur = run[sid] || {};
          const st = d.staff.find((x) => x.id === sid);
          const amount = line.percent ? Math.round(((st?.pay || 0) * line.percent) / 100) : line.amount;
          const entry = { id: nextId('pl'), label: line.label, amount, note: line.note || '', kind: line.kind };
          run[sid] = { ...cur, [kind]: [...(cur[kind] || []), entry] };
        });
        return log({ ...d, payruns: { ...(d.payruns || {}), [month]: run } }, `added ${line.label} to ${staffIds.length} staff payslip${staffIds.length > 1 ? 's' : ''}`);
      });
    },
    // entries: [{ staffId, amount, slip }] — slip is the computed payslip at the time of paying
    payrunPay(month, entries, method, date, note) {
      const when = `${date}T${nowIso().slice(11)}`;
      setDb((d) => {
        const run = { ...(d.payruns?.[month] || {}) };
        const payroll = { ...d.payroll };
        let total = 0;
        let staff = d.staff;
        entries.forEach(({ staffId, amount, slip }) => {
          const cur = run[staffId] || {};
          const payments = [...(cur.payments || []), { amount, method, date, note }];
          const paidSoFar = payments.reduce((a, x) => a + x.amount, 0);
          const first = !(cur.payments || []).length;
          // Live stores one Payment amount and one Reason per staff member per month;
          // the payslip lines are folded into that reason, so no new DB fields are needed.
          const reason = [...slip.earnings.filter((l) => !l.fixed), ...slip.cuts.filter((l) => !l.waived)].map((l) => `${slip.cuts.includes(l) ? '−' : '+'}${l.amount} ${l.label}`).join(', ');
          run[staffId] = { ...cur, payments, slip };
          payroll[staffId] = { amount: paidSoFar, date, method, net: slip.net, reason, note };
          total += amount;
          // Loan instalment and advance recovery are settled once, on the first payment of the month.
          if (first) {
            const loanCut = slip.cuts.find((c) => c.key === 'loan' && !c.waived)?.amount || 0;
            const advCut = slip.cuts.find((c) => c.key === 'advance' && !c.waived)?.amount || 0;
            run[staffId] = { ...run[staffId], settled: { loan: loanCut, advance: advCut, advanceDate: d.staff.find((x) => x.id === staffId)?.advanceDate } };
            staff = staff.map((x) => (x.id === staffId ? { ...x, loan: Math.max(0, (x.loan || 0) - loanCut), advance: Math.max(0, (x.advance || 0) - advCut), loanLog: loanCut ? [...(x.loanLog || []), { date: when, amount: loanCut, kind: 'deducted from salary' }] : x.loanLog } : x));
          }
          staff = staff.map((x) => (x.id === staffId ? { ...x, salaryHistory: [{ month, amount: paidSoFar, date, net: slip.net }, ...(x.salaryHistory || []).filter((h) => h.month !== month)] } : x));
        });
        const entry = { id: nextId('L'), date: when, amount: total, type: 'out', method, category: 'Salary', reason: `Salaries ${month} (${entries.length} staff)${note ? ` · ${note}` : ''}`, ref: entries.map((e) => e.staffId).join(', '), by: 'Demo school', doc: 'Slip' };
        return log({ ...d, staff, payroll, payruns: { ...(d.payruns || {}), [month]: run }, ledger: [entry, ...d.ledger] }, `paid ${fmt(total)} PKR salary to ${entries.length} staff`);
      });
    },
    giveAdvance(staffId, { amount, method, date, reason }) {
      const amt = Number(amount);
      setDb((d) => {
        const st = d.staff.find((x) => x.id === staffId);
        const entry = { id: nextId('L'), date: `${date}T${nowIso().slice(11)}`, amount: amt, type: 'out', method, category: 'Salary advance', reason: reason || 'Salary advance', ref: staffId, by: 'Demo school', doc: 'Slip' };
        return log({ ...d, ledger: [entry, ...d.ledger], staff: d.staff.map((x) => (x.id === staffId ? { ...x, advance: (x.advance || 0) + amt, advanceDate: dateShortOf(date) } : x)) }, `gave ${fmt(amt)} PKR salary advance to ${st?.name}`);
      });
    },
    updateSalary(staffId, { basic, allowances, deductions }) {
      setDb((d) => log({ ...d, staff: d.staff.map((x) => (x.id === staffId ? { ...x, allowances, deductions, basic: undefined, pay: basic + allowances.reduce((a, y) => a + y.amount, 0) } : x)) }, `changed salary structure of ${d.staff.find((x) => x.id === staffId)?.name}`));
    },
    // Fee collection workspace. lines: [{ studentId, dueId, pay, discount, advance? }]
    // advance = { label, month, amount, cat } for a month billed ahead and paid now.
    collectFees({ familyId, lines, creditUsed = 0, method, date, note, receipt, sendReceipt }) {
      const rcp = receipt || nowIso().replace(/\D/g, '').slice(0, 12).padEnd(14, String(seq % 100).padStart(2, '0'));
      const when = date ? `${date}T${nowIso().slice(11)}` : nowIso();
      let total = 0;
      setDb((d) => {
        const students = d.students.map((s) => {
          const mine = lines.filter((l) => l.studentId === s.id);
          if (!mine.length) return s;
          let dues = [...s.dues];
          const history = [...(s.history || [])];
          let paidHere = 0;
          mine.forEach((l) => {
            if (l.advance) {
              const id = nextId('adv');
              history.push({ id, date: when.slice(0, 10), kind: 'charge', cat: l.advance.cat, label: `${l.advance.label} — ${l.advance.month} (advance)`, month: l.advance.month, amount: l.advance.amount });
              const disc = Math.min(l.discount || 0, l.advance.amount);
              if (disc) history.push({ id: nextId('wv'), date: when.slice(0, 10), kind: 'waiver', label: `Discount — ${l.advance.label} ${l.advance.month}`, amount: disc });
              const pay = Math.min(l.pay, l.advance.amount - disc);
              paidHere += pay;
              const left = l.advance.amount - disc - pay;
              if (left > 0) dues.push({ id, label: l.advance.label, month: l.advance.month, amount: left, orig: l.advance.amount, cat: l.advance.cat });
              return;
            }
            const due = dues.find((x) => x.id === l.dueId);
            if (!due) return;
            const disc = Math.min(l.discount || 0, due.amount);
            if (disc) history.push({ id: nextId('wv'), date: when.slice(0, 10), kind: 'waiver', label: `Discount — ${due.label} ${due.month}`, amount: disc });
            const pay = Math.min(l.pay || 0, due.amount - disc);
            paidHere += pay;
            const left = due.amount - disc - pay;
            dues = left > 0 ? dues.map((x) => (x.id === due.id ? { ...x, amount: left, orig: x.orig || due.amount } : x)) : dues.filter((x) => x.id !== due.id);
          });
          total += paidHere;
          const cleared = s.dues.filter((x) => !dues.some((y) => y.id === x.id)).map((x) => x.id);
          const fines = (s.fines || []).map((f) => (cleared.includes(f.id) ? { ...f, status: 'paid' } : f));
          if (paidHere) history.push({ id: nextId('py'), date: when, kind: 'payment', label: creditUsed ? 'Fee payment (incl. family credit)' : 'Fee payment', method, amount: paidHere, receipt: rcp, note });
          return { ...s, dues, fines, history, paid: s.paid + paidHere };
        });
        const cash = Math.max(0, total - creditUsed);
        const fam = d.families.find((f) => f.id === familyId);
        const ledger = cash ? [{ id: nextId('L'), date: when, amount: cash, type: 'in', method, category: 'Monthly fee', reason: note || 'Fee payment', ref: familyId, by: 'Demo school', doc: 'Invoice', receipt: rcp }, ...d.ledger] : d.ledger;
        const left = students.filter((s) => s.familyId === familyId).reduce((a, s) => a + s.dues.reduce((b, x) => b + x.amount, 0), 0);
        const challans = (d.challans || []).map((c) => (c.familyId === familyId && c.status === 'unpaid' ? { ...c, status: left === 0 ? 'paid' : 'partly paid', paidOn: when.slice(0, 10) } : c));
        const families = d.families.map((f) => (f.id === familyId ? { ...f, paidTotal: f.paidTotal + cash, credit: Math.max(0, f.credit - creditUsed) } : f));
        return autoMsg(log({ ...d, students, families, ledger, challans }, `collected ${fmt(total)} PKR from ${fam?.name} (${familyId})${sendReceipt ? ' · receipt sent on WhatsApp' : ''}`), { event: sendReceipt ? 'Fee payment confirmation' : null, type: 'Fee submission', title: 'Fee payment received', body: `Fee payment of ${fmt(total)} PKR received via ${method}. Receipt ${rcp}. Thank you!`, familyIds: [familyId] });
      });
      return rcp;
    },
    recordDue({ studentId, type, label, amount, date, day, end }) {
      const amt = Number(amount) || 0;
      const id = nextId('rd');
      const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = `${MON[Number(date.slice(5, 7)) - 1]} ${date.slice(0, 4)}`;
      const cat = type === 'fine' ? 'fine' : type === 'recurring' ? 'recurring' : type === 'fund' ? 'other' : 'onetime';
      setDb((d) => log({ ...d, students: d.students.map((s) => {
        if (s.id !== studentId) return s;
        const extra = type === 'fine' ? { fines: [...(s.fines || []), { id, label, amount: amt, date, by: 'Demo school', status: 'unpaid' }] }
          : type === 'recurring' ? { recurring: [...(s.recurring || []), { id, name: label, amount: amt, day: Number(day) || 6, from: date.slice(0, 7), end: end || '', status: 'active' }] }
            : type === 'custom' ? { charges: [...(s.charges || []), { id, label, month, amount: amt, paid: 0 }] } : {};
        return { ...s, ...extra, dues: [...s.dues, { id, label, month, amount: amt, cat, added: nowIso(), by: 'Demo school' }], history: [...(s.history || []), { id, date, kind: 'charge', cat, label: `${label} — ${month}`, month, amount: amt }] };
      }) }, `recorded ${type} "${label}" of ${fmt(amt)} PKR`));
    },
    createChallan({ familyId, scope, amount, due, advance = 0 }) {
      const id = `SN7-${String(97 + (seq % 900)).padStart(8, '0')}`;
      setDb((d) => log({ ...d, challans: [{ id, familyId, scope, issued: '2026-10-09', due, amount, status: 'unpaid', advance }, ...(d.challans || []).map((c) => (c.familyId === familyId && c.status === 'unpaid' ? { ...c, status: 'superseded' } : c))] }, `generated challan ${id} for ${fmt(amount)} PKR`));
      return id;
    },
    addFine({ studentId, label, amount }) {
      const fid = nextId('f');
      setDb((d) => log({
        ...d,
        students: d.students.map((s) => (s.id === studentId ? {
          ...s,
          fines: [...(s.fines || []), { id: fid, label, amount: Number(amount), date: '2026-10-09', by: 'Demo school', status: 'unpaid' }],
          dues: [...s.dues, { id: fid, label, month: 'Oct 2026', amount: Number(amount), cat: 'fine' }],
          history: [...(s.history || []), { id: 'h' + fid, date: nowIso(), kind: 'charge', cat: 'fine', label: /fine/i.test(label) ? label : `Fine — ${label}`, month: 'Oct 2026', amount: Number(amount) }],
        } : s)),
      }, `added a ${fmt(amount)} PKR fine (${label}) to ${studentId}`));
    },
    waiveFine(studentId, fineId) {
      setDb((d) => log({
        ...d,
        students: d.students.map((s) => {
          if (s.id !== studentId) return s;
          const f = s.fines.find((x) => x.id === fineId);
          const due = s.dues.find((x) => x.id === fineId);
          return { ...s, fines: s.fines.map((x) => (x.id === fineId ? { ...x, status: 'waived' } : x)), dues: s.dues.filter((x) => x.id !== fineId),
            history: due ? [...s.history, { id: nextId('w'), date: nowIso(), kind: 'waiver', label: `Fine waived — ${f.label}`, amount: due.amount }] : s.history };
        }),
      }, `waived a fine for ${studentId}`));
    },
    addCharge(studentId, { label, amount, paidNow, method }) {
      const cid = nextId('c');
      setDb((d) => {
        const amt = Number(amount);
        const students = d.students.map((s) => {
          if (s.id !== studentId) return s;
          const history = [...(s.history || []), { id: 'h' + cid, date: nowIso(), kind: 'charge', cat: 'onetime', label, month: 'Oct 2026', amount: amt }];
          if (paidNow) history.push({ id: 'p' + cid, date: nowIso(), kind: 'payment', label: 'Fee payment', method: method || 'Cash', amount: amt, receipt: `RCP-${seq}` });
          return { ...s, charges: [...(s.charges || []), { id: cid, label, month: 'Oct 2026', amount: amt, paid: paidNow ? amt : 0 }],
            dues: paidNow ? s.dues : [...s.dues, { id: cid, label, month: 'Oct 2026', amount: amt, cat: 'onetime' }], paid: s.paid + (paidNow ? amt : 0), history };
        });
        const st = d.students.find((x) => x.id === studentId);
        const ledger = paidNow ? [{ id: nextId('L'), date: nowIso(), amount: amt, type: 'in', method: method || 'Cash', category: 'Custom charge', reason: label, ref: `${st.familyId} · ${code(st)}`, by: 'Demo school', doc: 'Invoice' }, ...d.ledger] : d.ledger;
        return log({ ...d, students, ledger }, `added charge "${label}" (${fmt(amt)} PKR) to ${st.name}`);
      });
    },
    addRecurring(studentId, r) {
      setDb((d) => log({ ...d, students: d.students.map((s) => (s.id === studentId ? { ...s, recurring: [...(s.recurring || []), { id: nextId('r'), status: 'active', from: '2026-11', ...r, amount: Number(r.amount), day: Number(r.day) }] } : s)) }, `added recurring charge "${r.name}" to ${studentId}`));
    },
    setRecurring(studentId, rid, status) {
      setDb((d) => ({ ...d, students: d.students.map((s) => (s.id === studentId ? { ...s, recurring: s.recurring.map((r) => (r.id === rid ? { ...r, status } : r)) } : s)) }));
    },
    promote(studentId, { classId, section, fee }) {
      setDb((d) => {
        const cls = d.classes.find((c) => c.id === classId);
        const amt = Number(fee) || 0;
        const fid = nextId('c');
        return autoMsg(log({ ...d, students: d.students.map((s) => (s.id !== studentId ? s : {
          ...s, classId, section,
          // As on live: the promotion fee is received on the spot (an income entry), not added to dues.
          charges: amt ? [...(s.charges || []), { id: fid, label: 'Promotion fee', month: 'Oct 2026', amount: amt, paid: amt }] : s.charges,
          paid: s.paid + amt,
          history: amt ? [...s.history, { id: 'h' + fid, date: nowIso(), kind: 'charge', cat: 'onetime', label: 'Promotion fee', month: 'Oct 2026', amount: amt }, { id: 'p' + fid, date: nowIso(), kind: 'payment', label: 'Promotion fee', method: 'Online transfer', amount: amt }] : s.history,
        })), ledger: amt ? [{ id: nextId('L'), date: nowIso(), amount: amt, type: 'in', method: 'Online transfer', category: 'Promotion', reason: `Promotion to ${cls.name}-${section}`, ref: `${d.students.find((x) => x.id === studentId)?.familyId}, ${studentId}`, by: 'Demo school', doc: 'Invoice' }, ...d.ledger] : d.ledger }, `promoted ${studentId} to ${cls.name} ${section}`), { type: 'Student promotion', title: 'Congratulations! Student promoted', body: `${d.students.find((x) => x.id === studentId)?.name} has been promoted to ${cls.name} ${section}.`, familyIds: [famOf(d, studentId)].filter(Boolean) });
      });
    },
    terminate(studentId, { date }) {
      setDb((d) => autoMsg(log({ ...d, students: d.students.map((s) => (s.id === studentId ? { ...s, status: 'terminated', terminatedOn: date } : s)) }, `terminated ${studentId}`), { type: 'Student status', title: 'Student status updated', body: `The enrolment status for ${d.students.find((x) => x.id === studentId)?.name} has changed to inactive.`, familyIds: [famOf(d, studentId)].filter(Boolean) }));
    },
    readmit(studentId) {
      setDb((d) => autoMsg(log({ ...d, students: d.students.map((s) => (s.id === studentId ? { ...s, status: 'active', terminatedOn: null } : s)) }, `re-admitted ${studentId}`), { type: 'Student status', title: 'Student status updated', body: `${d.students.find((x) => x.id === studentId)?.name} is active again.`, familyIds: [famOf(d, studentId)].filter(Boolean) }));
    },
    addNote(familyId, text) {
      setDb((d) => ({ ...d, families: d.families.map((f) => (f.id === familyId ? { ...f, notes: [{ id: nextId('N'), text, by: 'Demo school', at: nowIso(), pinned: false, archived: false }, ...(f.notes || [])] } : f)) }));
    },
    updateNote(familyId, noteId, patch) {
      setDb((d) => ({ ...d, families: d.families.map((f) => (f.id === familyId ? { ...f, notes: f.notes.map((n) => (n.id === noteId ? { ...n, ...patch } : n)) } : f)) }));
    },
    addCredit(familyId, { amount, reason, method }) {
      setDb((d) => {
        const amt = Number(amount);
        const fam = d.families.find((f) => f.id === familyId);
        const entry = { id: nextId('L'), date: nowIso(), amount: amt, type: 'in', method: method || 'Cash', category: 'Family balance', reason: reason || 'Advance', ref: familyId, by: 'Demo school', doc: 'Invoice' };
        return log({ ...d, ledger: [entry, ...d.ledger], families: d.families.map((f) => (f.id === familyId ? { ...f, credit: f.credit + amt, paidTotal: f.paidTotal + amt } : f)) }, `added ${fmt(amt)} PKR to ${fam.name} balance`);
      });
    },
    addStudent(student, newFamily) {
      const id = nextId('S');
      setDb((d) => {
        let families = d.families;
        let familyId = student.familyId;
        if (newFamily) {
          familyId = nextId('F');
          families = [...families, { id: familyId, paidTotal: 0, credit: 0, waVerified: false, app: false, email: '', occupation: '', mother: '', address: '', ...newFamily }];
        }
        const base = { religion: 'Islam', status: 'active', isNew: true, paid: 0, dues: [], admitted: '2026-10-09', discount: 0, discountType: 'amount', charges: [], fines: [], recurring: [], customFields: [], ...student, id, familyId };
        const dues = base.dues.map((x) => ({ ...x, cat: x.cat || (x.label === 'Monthly fee' ? 'monthly' : 'onetime') }));
        const charges = dues.filter((x) => x.cat === 'onetime').map((x) => ({ id: x.id, label: x.label, month: x.month, amount: x.amount, paid: 0 }));
        if (base.paid) charges.push({ id: 'adm', label: 'Admission fee', month: 'Oct 2026', amount: base.paid, paid: base.paid });
        const cls = d.classes.find((c) => c.id === base.classId);
        const { history } = buildHistory({ ...base, dues, charges }, cls);
        const s = { ...base, dues, charges, history };
        const ledger = s.paid ? [{ id: nextId('L'), date: nowIso(), amount: s.paid, type: 'in', method: 'Cash', category: 'Admission fee', reason: 'Admission fee', ref: `${familyId} · ${id}`, by: 'Demo school', doc: 'Invoice' }, ...d.ledger] : d.ledger;
        return autoMsg(log({ ...d, families, ledger, students: [...d.students, s] }, `created student ${s.name} (${id})`), { event: 'New admission welcome', type: 'New admission', title: 'Welcome to school!', body: `Admission confirmation — ${s.name} (${id}), ${d.classes.find((c) => c.id === s.classId)?.name} ${s.section}.`, familyIds: [familyId] });
      });
      return id;
    },
    addFamily(family) {
      const id = nextId('F');
      setDb((d) => log({ ...d, families: [...d.families, { id, paidTotal: 0, credit: 0, waVerified: false, app: false, ...family }] }, `created family ${family.name} (${id})`));
      return id;
    },
    updateStudent(id, patch) {
      setDb((d) => autoMsg({ ...d, students: d.students.map((s) => (s.id === id ? { ...s, ...patch } : s)) }, { event: 'Student profile changes', type: 'General', title: 'Student profile updated', body: `The profile for ${d.students.find((x) => x.id === id)?.name} has been updated.`, familyIds: [famOf(d, id)].filter(Boolean) }));
    },
    updateFamily(id, patch) {
      setDb((d) => ({ ...d, families: d.families.map((f) => (f.id === id ? { ...f, ...patch } : f)) }));
    },
    addStaff(member) {
      const id = nextId(member.type === 'teacher' ? 'T' : 'STF-');
      setDb((d) => log({ ...d, staff: [...d.staff, { loan: 0, status: 'active', att: { P: 0, A: 0, L: 0, V: 0 }, ...member, id }] }, `added staff ${member.name}`));
      return id;
    },
    updateStaff(id, patch) {
      setDb((d) => ({ ...d, staff: d.staff.map((s) => (s.id === id ? { ...s, ...patch } : s)) }));
    },
    mark(date, studentId, status) {
      setDb((d) => {
        const day = { ...(d.attendance[date] || {}) };
        if (status) day[studentId] = status; else delete day[studentId];
        return { ...d, attendance: { ...d.attendance, [date]: day } };
      });
    },
    seedDay(date, marks) {
      setDb((d) => (d.attendance[date] ? d : { ...d, attendance: { ...d.attendance, [date]: { ...marks } } }));
    },
    markMany(date, ids, status) {
      setDb((d) => {
        const day = { ...(d.attendance[date] || {}) };
        ids.forEach((id) => { if (!day[id]) day[id] = status; });
        return { ...d, attendance: { ...d.attendance, [date]: day } };
      });
    },
    saveAttendance(date) {
      setDb((d) => log({ ...d, attendanceSaved: { ...d.attendanceSaved, [date]: true } }, `saved attendance for ${date}`));
    },
    markStaff(date, staffId, status) {
      setDb((d) => {
        const day = { ...(d.staffAttendance[date] || {}) };
        if (status) day[staffId] = status; else delete day[staffId];
        return { ...d, staffAttendance: { ...d.staffAttendance, [date]: day } };
      });
    },
    payStaff(entries, method, date, note = '') {
      setDb((d) => {
        const payroll = { ...d.payroll };
        let total = 0;
        entries.forEach((e) => { payroll[e.id] = { amount: e.amount, date, method, reason: e.reason || '', loan: e.loan || 0, note, by: 'Demo school' }; total += e.amount; });
        // Loan cut from salary reduces the loan balance.
        const staff = d.staff.map((x) => { const e = entries.find((y) => y.id === x.id); return e?.loan ? { ...x, loan: Math.max(0, (x.loan || 0) - e.loan), loanLog: [...(x.loanLog || []), { date: nowIso(), amount: e.loan, kind: 'deducted from salary' }] } : x; });
        d = { ...d, staff };
        const entry = { id: nextId('L'), date: nowIso(), amount: total, type: 'out', method, category: 'Salary', reason: `Salaries October 2026 (${entries.length} staff)`, ref: entries.map((e) => e.id).join(', '), by: 'Demo school', doc: 'Slip' };
        return log({ ...d, payroll, ledger: [entry, ...d.ledger] }, `paid ${fmt(total)} PKR salary to ${entries.length} staff`);
      });
    },
    recordLedger(entry) {
      setDb((d) => log({ ...d, ledger: [{ id: nextId('L'), date: nowIso(), by: 'Demo school', doc: null, ref: '—', ...entry }, ...d.ledger] }, `recorded ${entry.type === 'in' ? 'income' : 'expense'} of ${fmt(entry.amount)} PKR`));
    },
    // Demo delivery: counts start at 0 and fill in as each channel reports back.
    // Families without a verified WhatsApp fail on WhatsApp and can be retried.
    // With the backend, replace the timers with the provider's delivery webhooks.
    sendAnnouncement(a) {
      const id = nextId('A');
      const n = a.app?.[1] || 0;
      const waTarget = a.wa?.[1] || 0;
      setDb((d) => {
        const unverified = d.families.filter((f) => !f.waVerified).length;
        const waFail = waTarget ? Math.min(waTarget, Math.max(0, Math.round(unverified * (waTarget / Math.max(1, d.families.length))))) : 0;
        const entry = { id, kind: 'manual', date: '2026-10-09', by: 'Demo school', ...a, app: [0, n], wa: [0, waTarget], waFail, sms: a.sms ? [0, a.sms] : undefined, email: a.email ? [0, a.email] : undefined, status: 'sending' };
        return log({ ...d, announcements: [entry, ...d.announcements] }, `sent "${a.title}"`);
      });
      const step = (fn, ms) => setTimeout(() => setDb((d) => ({ ...d, announcements: d.announcements.map((x) => (x.id === id ? fn(x) : x)) })), ms);
      step((x) => ({ ...x, app: [x.app[1], x.app[1]] }), 900);
      // Families without a usable WhatsApp are skipped (as live reports them), not failed.
      step((x) => ({ ...x, wa: [Math.max(0, x.wa[1] - (x.waFail || 0)), x.wa[1]], waSkipped: x.waFail || 0, waFail: 0, sms: x.sms && [x.sms[1], x.sms[1]], email: x.email && [x.email[1], x.email[1]], status: 'delivered' }), 2200);
      return id;
    },
    retryDelivery(id) {
      setDb((d) => ({ ...d, announcements: d.announcements.map((x) => (x.id === id ? { ...x, status: 'sending' } : x)) }));
      setTimeout(() => setDb((d) => ({ ...d, announcements: d.announcements.map((x) => (x.id === id ? { ...x, wa: [x.wa[1], x.wa[1]], waFail: 0, status: 'delivered' } : x)) })), 1500);
    },
    moveInquiry(id, stage) {
      setDb((d) => ({ ...d, inquiries: d.inquiries.map((q) => (q.id === id ? { ...q, stage } : q)) }));
    },
    addInquiry(q) {
      setDb((d) => ({ ...d, inquiries: [{ id: nextId('A'), stage: 'new', date: nowIso(), source: 'Walk-in', ...q }, ...d.inquiries] }));
    },
    // Each class runs its own session; ending one archives it and starts the next.
    endClassSession(classId) { setDb((d) => log({ ...d, sessionLog: [...(d.sessionLog || []), { classId, ended: nowIso() }] }, `ended session for ${d.classes.find((c) => c.id === classId)?.name}`)); },
    updateDiary(id, patch) { setDb((d) => ({ ...d, diary: d.diary.map((x) => (x.id === id ? { ...x, ...patch, editedBy: 'Demo school' } : x)) })); },
    removeDiary(id) { setDb((d) => ({ ...d, diary: d.diary.filter((x) => x.id !== id) })); },
    addDiary(entry) {
      setDb((d) => autoMsg(log({ ...d, diary: [{ id: nextId('D'), date: '2026-10-09', by: 'Demo school', ...entry }, ...d.diary] }, `posted diary "${entry.title}"`), { event: 'Daily diary / homework', type: 'Diary', title: entry.title, body: `A new diary entry has been posted for ${d.classes.find((c) => c.id === entry.classId)?.name} ${entry.section}. ${entry.body || ''}`, familyIds: d.students.filter((x) => x.status === 'active' && x.classId === entry.classId && x.section === entry.section).map((x) => x.familyId) }));
    },
    addExam(exam) {
      const id = nextId('E');
      setDb((d) => log({ ...d, exams: [{ id, results: {}, published: false, by: 'Demo school', created: '2026-10-09', ...exam }, ...d.exams] }, `created exam ${exam.name}`));
      return id;
    },
    saveResults(examId, results, publish) {
      setDb((d) => {
        const e0 = d.exams.find((e) => e.id === examId);
        const next = { ...d, exams: d.exams.map((e) => (e.id === examId ? { ...e, results, published: publish ?? e.published } : e)) };
        if (!publish || !e0) return next;
        return autoMsg(next, { event: 'Exam result publishing', type: 'Exam result', title: 'Exam result updated', body: `Results for "${e0.name}" are out. Open the parent app to see marks and grades.`, familyIds: Object.keys(results).map((sid) => famOf(d, sid)).filter(Boolean) });
      });
    },
    addObservation(o) {
      setDb((d) => autoMsg({ ...d, observations: [{ id: nextId('O'), date: '2026-10-09', by: 'Demo school', ...o }, ...d.observations] }, { event: 'Observations', type: 'Observation', title: 'New observation', body: `An observation has been recorded for ${d.students.find((x) => x.id === o.studentId)?.name}. Reviewer: ${o.reviewer}.`, familyIds: [famOf(d, o.studentId)].filter(Boolean) }));
    },
    addSlot(slot) {
      setDb((d) => ({ ...d, timetable: [...d.timetable, { id: nextId('T'), ...slot }] }));
    },
    removeSlot(id) {
      setDb((d) => ({ ...d, timetable: d.timetable.filter((t) => t.id !== id) }));
    },
    updateSlot(id, patch) { setDb((d) => ({ ...d, timetable: d.timetable.map((t) => (t.id === id ? { ...t, ...patch } : t)) })); },
    // One lesson = a slot on a date: done / notes / unavailable / substitute / moved / cancelled.
    updateLesson(key, patch) {
      setDb((d) => ({ ...d, lessons: { ...(d.lessons || {}), [key]: { ...((d.lessons || {})[key] || {}), ...patch } } }));
    },
    addClass(c) {
      setDb((d) => log({ ...d, classes: [...d.classes, { id: nextId('c'), teacher: null, order: d.classes.length + 1, ...c }] }, `added class ${c.name}`));
    },
    updateClass(id, patch) {
      setDb((d) => ({ ...d, classes: d.classes.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
    },
    addDocument(doc) {
      setDb((d) => ({ ...d, documents: [{ id: nextId('DOC'), date: nowIso(), ...doc }, ...d.documents] }));
    },
    sendChat(chatId, text) {
      setDb((d) => ({ ...d, chats: d.chats.map((c) => (c.id === chatId ? { ...c, unread: 0, messages: [...c.messages, { from: 'me', text, at: nowIso() }] } : c)) }));
    },
    readChat(chatId) {
      setDb((d) => ({ ...d, chats: d.chats.map((c) => (c.id === chatId ? { ...c, unread: 0 } : c)) }));
    },
    updateSettings(patch) { setDb((d) => ({ ...d, settings: { ...d.settings, ...patch } })); },
    updateTT(patch) { setDb((d) => ({ ...d, tt: { ...d.tt, ...patch } })); },
    addUser(u) { setDb((d) => log({ ...d, users: [...d.users, { id: nextId('U'), status: 'active', sections: [], perms: {}, ...u }] }, `added employee ${u.name}`)); },
    updateUser(id, patch) { setDb((d) => ({ ...d, users: d.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) })); },
    addFund(f) { setDb((d) => log({ ...d, funds: [{ id: nextId('FU'), by: 'Demo school', created: '2026-10-09', amounts: {}, ...f }, ...d.funds] }, `created fund ${f.name}`)); },
    updateFund(id, patch) { setDb((d) => ({ ...d, funds: d.funds.map((f) => (f.id === id ? { ...f, ...patch } : f)) })); },
    addTodo(t) { setDb((d) => ({ ...d, todos: [{ id: nextId('TD'), done: false, by: 'Demo school', added: '2026-10-09', assignee: 'Myself', remind: '', ...t }, ...d.todos] })); },
    updateTodo(id, patch) { setDb((d) => ({ ...d, todos: d.todos.map((t) => (t.id === id ? { ...t, ...patch } : t)) })); },
    // Undo for deletes: put the item back where it was.
    restoreItem(key, item, index = 0) { setDb((d) => { const list = [...(d[key] || [])]; if (list.some((x) => x.id === item.id)) return d; list.splice(Math.min(index, list.length), 0, item); return { ...d, [key]: list }; }); },
    removeTodo(id) { setDb((d) => ({ ...d, todos: d.todos.filter((t) => t.id !== id) })); },
    aiAsk(chatId, text, answer) {
      const cid = chatId || nextId('AI');
      setDb((d) => {
        const exists = d.aiChats.some((c) => c.id === cid);
        const chats = exists ? d.aiChats.map((c) => (c.id === cid ? { ...c, messages: [...c.messages, ['me', text], ['ai', answer]] } : c)) : [{ id: cid, title: text.slice(0, 40), messages: [['me', text], ['ai', answer]] }, ...d.aiChats];
        return { ...d, aiChats: chats };
      });
      return cid;
    },
    setGrading(g) { setDb((d) => ({ ...d, grading: g })); },
    updateExam(id, patch) { setDb((d) => ({ ...d, exams: d.exams.map((e) => (e.id === id ? { ...e, ...patch } : e)) })); },
    duplicateExam(id) { const nid = nextId('E'); setDb((d) => { const e = d.exams.find((x) => x.id === id); return log({ ...d, exams: [{ ...e, id: nid, name: `${e.name} (copy)`, results: {}, published: false, created: '2026-10-09' }, ...d.exams] }, `duplicated exam ${e.name}`); }); return nid; },
    deleteExam(id) { setDb((d) => ({ ...d, exams: d.exams.filter((e) => e.id !== id) })); },
    addExams(list) { setDb((d) => log({ ...d, exams: [...list.map((e) => ({ id: nextId('E'), results: {}, published: false, by: 'Demo school', created: '2026-10-09', ...e })), ...d.exams] }, `created ${list.length} exam${list.length > 1 ? 's' : ''}`)); },
    addObsQuestion(q) { setDb((d) => ({ ...d, obsQuestions: [...d.obsQuestions, { id: nextId('Q'), active: true, ...q }] })); },
    updateObsQuestion(id, patch) { setDb((d) => ({ ...d, obsQuestions: d.obsQuestions.map((q) => (q.id === id ? { ...q, ...patch } : q)) })); },
    moveObsQuestion(id, dir) { setDb((d) => { const a = [...d.obsQuestions]; const i = a.findIndex((q) => q.id === id); const j = i + dir; if (j < 0 || j >= a.length) return d; [a[i], a[j]] = [a[j], a[i]]; return { ...d, obsQuestions: a }; }); },
    changeClassFee(classId, { mode, amount, from }) {
      setDb((d) => {
        const c = d.classes.find((x) => x.id === classId);
        const hist = [...(d.classFeeHistory[classId] || [{ date: '2026-04-01', fee: c.fee, kind: 'created', by: 'Demo school' }]), { date: mode === 'retro' ? '2026-10-09' : from, fee: Number(amount), kind: mode === 'retro' ? 'corrected' : 'changed', by: 'Demo school' }];
        return log({ ...d, classes: d.classes.map((x) => (x.id === classId ? { ...x, fee: Number(amount) } : x)), classFeeHistory: { ...d.classFeeHistory, [classId]: hist } }, `${mode === 'retro' ? 'corrected' : 'changed'} ${c.name} fee to ${fmt(amount)} PKR`);
      });
    },
    mergeSections(classId, sections, name) {
      setDb((d) => log({
        ...d,
        classes: d.classes.map((c) => (c.id === classId ? { ...c, sections: [...c.sections.filter((x) => !sections.includes(x)), name] } : c)),
        students: d.students.map((st) => (st.classId === classId && sections.includes(st.section) ? { ...st, section: name } : st)),
      }, `merged sections ${sections.join(', ')} into ${name}`));
    },
    renameSection(classId, from, to) {
      setDb((d) => log({
        ...d,
        classes: d.classes.map((c) => (c.id === classId ? { ...c, sections: c.sections.map((x) => (x === from ? to : x)) } : c)),
        students: d.students.map((st) => (st.classId === classId && st.section === from ? { ...st, section: to } : st)),
      }, `renamed section ${from} to ${to}`));
    },
    reorderClasses(ids) { setDb((d) => ({ ...d, classes: d.classes.map((c) => ({ ...c, order: ids.indexOf(c.id) + 1 })) })); },
    addComment(inqId, text) { setDb((d) => ({ ...d, inquiries: d.inquiries.map((q) => (q.id === inqId ? { ...q, comments: [...(q.comments || []), { by: 'Demo school', at: nowIso(), text }] } : q)) })); },
    updateInquiry(inqId, patch) { setDb((d) => ({ ...d, inquiries: d.inquiries.map((q) => (q.id === inqId ? { ...q, ...patch } : q)) })); },
    issueLoan(staffId, { amount, reason, months }) {
      setDb((d) => {
        const amt = Number(amount);
        const s0 = d.staff.find((x) => x.id === staffId);
        const entry = { id: nextId('L'), date: nowIso(), amount: amt, type: 'out', method: 'Cash', category: 'Staff loan', reason: reason || 'Loan', ref: staffId, by: 'Demo school', doc: null };
        return log({ ...d, ledger: [entry, ...d.ledger], staff: d.staff.map((x) => (x.id === staffId ? { ...x, loan: x.loan + amt, loanDeduction: Math.ceil((x.loan + amt) / (Number(months) || 1)), loanLog: [...(x.loanLog || []), { date: nowIso(), amount: amt, kind: 'issued', reason }] } : x)) }, `issued a ${fmt(amt)} PKR loan to ${s0.name}`);
      });
    },
    repayLoan(staffId, amount) {
      setDb((d) => {
        const amt = Number(amount);
        const entry = { id: nextId('L'), date: nowIso(), amount: amt, type: 'in', method: 'Cash', category: 'Loan repayment', reason: 'Staff loan repayment', ref: staffId, by: 'Demo school', doc: null };
        return { ...d, ledger: [entry, ...d.ledger], staff: d.staff.map((x) => (x.id === staffId ? { ...x, loan: Math.max(0, x.loan - amt), loanDeduction: x.loan - amt > 0 ? x.loanDeduction : 0, loanLog: [...(x.loanLog || []), { date: nowIso(), amount: amt, kind: 'repaid' }] } : x)) };
      });
    },
    flagLedger(id, flagged, why = '') { setDb((d) => { const e = d.ledger.find((l) => l.id === id); const credit = e && e.category === 'Family balance' ? (flagged ? -e.amount : e.amount) : 0; return log({ ...d, families: credit ? d.families.map((f) => (f.id === e.ref ? { ...f, credit: Math.max(0, f.credit + credit) } : f)) : d.families, ledger: d.ledger.map((l) => (l.id === id ? { ...l, flagged, problemReason: flagged ? why : '' } : l)) }, `${flagged ? 'marked' : 'restored'} transaction ${id}${why ? ` (${why})` : ''}`); }); },
    checkIn(date, studentId, late) {
      setDb((d) => ({ ...d, checkins: { ...d.checkins, [date]: { ...(d.checkins[date] || {}), [studentId]: nowIso().slice(11) } }, attendance: { ...d.attendance, [date]: { ...(d.attendance[date] || {}), [studentId]: late ? 'L' : 'P' } } }));
    },
    setRemark(date, id, text) { setDb((d) => ({ ...d, remarks: { ...d.remarks, [date]: { ...(d.remarks[date] || {}), [id]: text } } })); },
    resetDemo() {
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
      setDb(fresh());
    },
    readNotifications() {
      setDb((d) => ({ ...d, unreadNotifications: 0 }));
    },
  }), []);

  const value = useMemo(() => ({ db, ui, open, close, toast, toasts, dismissToast, ...actions }), [db, ui, open, close, toast, toasts, dismissToast, actions]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useStore = () => useContext(Ctx);

// ---- Selectors ----
export function useSchool() {
  const store = useStore();
  const { db } = store;
  const sel = useMemo(() => {
    const classById = Object.fromEntries(db.classes.map((c) => [c.id, c]));
    const familyById = Object.fromEntries(db.families.map((f) => [f.id, f]));
    const studentById = Object.fromEntries(db.students.map((s) => [s.id, s]));
    const active = db.students.filter((s) => s.status === 'active');
    const kidsOf = (fid) => active.filter((s) => s.familyId === fid);
    const familyDue = (fid) => kidsOf(fid).reduce((a, s) => a + dueOf(s), 0);
    const className = (s) => `${classById[s.classId]?.name || '—'} · ${s.section}`;
    const totalDue = active.reduce((a, s) => a + dueOf(s), 0);
    const defaulters = active.filter((s) => dueOf(s) > 0).sort((a, b) => dueOf(b) - dueOf(a));
    const familiesWithDue = db.families.filter((f) => familyDue(f.id) > 0);
    const income = db.ledger.filter((l) => l.type === 'in').reduce((a, l) => a + l.amount, 0);
    const expense = db.ledger.filter((l) => l.type === 'out').reduce((a, l) => a + l.amount, 0);
    const slips = Object.fromEntries(db.staff.filter((s) => s.status === 'active').map((s) => [s.id, payslip(s, db.payruns?.['2026-10']?.[s.id], db.settings.payroll)]));
    const staffUnpaid = db.staff.filter((s) => slips[s.id] && slips[s.id].status !== 'paid' && slips[s.id].status !== 'held');
    const payrollDue = staffUnpaid.reduce((a, s) => a + slips[s.id].remaining, 0);
    const sections = [];
    db.classes.forEach((c) => c.sections.forEach((sec) => {
      const list = active.filter((s) => s.classId === c.id && s.section === sec);
      if (list.length) sections.push({ key: `${c.id}|${sec}`, classId: c.id, section: sec, label: `${c.name} · ${sec}`, students: list });
    }));
    const today = seed.TODAY;
    const todayAtt = db.attendance[today] || {};
    const unmarkedSections = sections.filter((x) => x.students.some((s) => !todayAtt[s.id]));
    return { classById, familyById, studentById, active, kidsOf, familyDue, className, totalDue, defaulters, familiesWithDue, income, expense, payrollDue, staffUnpaid, sections, today, todayAtt, unmarkedSections };
  }, [db]);
  return { ...store, ...sel };
}
