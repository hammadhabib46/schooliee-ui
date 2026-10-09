// Fee model helpers for a student. The statement (history) is generated once from
// seed data so its closing balance equals the student's outstanding dues; runtime
// actions (payments, fines, waivers…) append to it.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const discountAmount = (s, cls) => {
  if (!s.discount) return 0;
  return s.discountType === 'percent' ? Math.round(((cls?.fee || 0) * s.discount) / 100) : s.discount;
};
export const discountLabel = (s) => (!s.discount ? 'None' : s.discountType === 'percent' ? `${s.discount}%` : `${Math.round(s.discount).toLocaleString('en-US')} PKR`);
export const netFee = (s, cls) => Math.max(0, (cls?.fee || 0) - discountAmount(s, cls));
export const recurringTotal = (s) => (s.recurring || []).filter((r) => r.status === 'active').reduce((a, r) => a + r.amount, 0);
export const monthlyBill = (s, cls) => netFee(s, cls) + recurringTotal(s);

const monthKey = (iso) => iso.slice(0, 7);
const monthLabel = (key) => `${MONTHS[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}`;

function monthsFrom(startIso, endKey = '2026-10') {
  const out = [];
  let [y, m] = startIso.slice(0, 7).split('-').map(Number);
  const [ey, em] = endKey.split('-').map(Number);
  while (y < ey || (y === ey && m <= em)) {
    out.push(`${y}-${String(m).padStart(2, '0')}`);
    m += 1; if (m > 12) { m = 1; y += 1; }
  }
  return out;
}

export function buildHistory(s, cls) {
  const charges = [];
  const fee = netFee(s, cls);
  const disc = discountAmount(s, cls);
  monthsFrom(s.admitted).forEach((key, i) => {
    const amount = i === 0 && s.firstMonthFee ? s.firstMonthFee : fee;
    charges.push({ id: `mf-${key}`, date: i === 0 ? s.admitted : `${key}-01`, kind: 'charge', cat: 'monthly', label: `Monthly fee — ${monthLabel(key)}`, month: monthLabel(key), amount, discount: disc, note: disc ? `Class fee ${cls.fee.toLocaleString('en-US')} − discount ${disc.toLocaleString('en-US')}` : '' });
  });
  (s.recurring || []).forEach((r) => {
    monthsFrom(`${r.from}-01`).forEach((key) => charges.push({ id: `rc-${r.id}-${key}`, date: `${key}-${String(r.day).padStart(2, '0')}`, kind: 'charge', cat: 'recurring', label: `${r.name} — ${monthLabel(key)}`, month: monthLabel(key), amount: r.amount }));
  });
  (s.charges || []).forEach((c) => charges.push({ id: `oc-${c.id}`, date: s.admitted, kind: 'charge', cat: 'onetime', label: c.label, month: c.month, amount: c.amount }));
  (s.fines || []).forEach((f) => charges.push({ id: `fn-${f.id}`, date: f.date, kind: 'charge', cat: 'fine', label: /fine/i.test(f.label) ? f.label : `Fine — ${f.label}`, month: monthLabel(monthKey(f.date)), amount: f.amount }));
  (s.dues || []).filter((d) => d.cat === 'other').forEach((d) => charges.push({ id: `ot-${d.id}`, date: `2026-${String(MONTHS.indexOf(d.month.slice(0, 3)) + 1).padStart(2, '0')}-02`, kind: 'charge', cat: 'other', label: d.label, month: d.month, amount: d.amount }));
  charges.sort((a, b) => a.date.localeCompare(b.date));

  const total = charges.reduce((a, c) => a + c.amount, 0);
  const due = (s.dues || []).reduce((a, d) => a + d.amount, 0);
  let left = Math.max(0, total - due);
  const paidTotal = left;

  // Payments: settle each month's charges, oldest first, a few days after billing.
  const byMonth = {};
  charges.forEach((c) => { const k = monthKey(c.date); byMonth[k] = (byMonth[k] || 0) + c.amount; });
  const payments = [];
  const methods = ['Cash', 'Cash', 'Online transfer', 'Cash'];
  Object.keys(byMonth).sort().forEach((k, i) => {
    if (left <= 0) return;
    const amt = Math.min(left, byMonth[k]);
    left -= amt;
    const day = k === s.admitted.slice(0, 7) ? Math.min(28, Number(s.admitted.slice(8, 10)) + 1) : 4 + (i % 3);
    payments.push({ id: `py-${k}`, date: `${k}-${String(day).padStart(2, '0')}`, kind: 'payment', label: 'Fee payment', method: methods[i % methods.length], amount: amt, receipt: `RCP-${(10231 + i * 37 + s.id.length * 11)}` });
  });
  const history = [...charges, ...payments].sort((a, b) => a.date.localeCompare(b.date) || (a.kind === 'payment' ? 1 : -1));
  return { history, paidTotal };
}

// Running-balance statement rows (oldest first)
export function statement(history) {
  let bal = 0;
  return [...history]
    .sort((a, b) => a.date.localeCompare(b.date) || (a.kind === 'charge' ? -1 : 1))
    .map((e) => {
      bal += e.kind === 'charge' ? e.amount : -e.amount;
      return { ...e, balance: bal };
    });
}

export const REMARKS = { A: ['Fever', 'No reason given', 'Family event', 'Stomach ache'], V: ['Sick leave (parent app)', 'Out of city', 'Wedding in family'], L: ['Van late', 'Arrived 8:25', 'Overslept'] };
export const remarkFor = (id, day, mark) => {
  const list = REMARKS[mark];
  if (!list) return '';
  let h = day * 7; for (const c of id) h += c.charCodeAt(0);
  return list[h % list.length];
};

export const monthKeyOf = monthKey;
export const monthLabelOf = monthLabel;
