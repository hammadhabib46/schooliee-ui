// Payroll maths shared by the pay run, payslips and the staff profile.
// A payslip = earnings (basic + allowances + one-off additions)
//           − deductions (attendance cuts by policy, loan instalment,
//             salary-advance recovery, fixed deductions, one-off cuts).

export const DEFAULT_POLICY = { workingDays: 26, cutAbsent: true, latesPerAbsent: 3, paidLeaves: 1, payDay: 1 };

export const ADD_KINDS = ['Bonus', 'Overtime', 'Arrears', 'Extra classes', 'Other'];
export const CUT_KINDS = ['Fine', 'Tax', 'Damage', 'Other'];

export function salaryOf(s) {
  const allowances = s.allowances || [];
  const basic = s.basic ?? s.pay - allowances.reduce((a, x) => a + x.amount, 0);
  return { basic, allowances, deductions: s.deductions || [], gross: s.pay };
}

export function payslip(s, item = {}, policy = DEFAULT_POLICY) {
  const p = { ...DEFAULT_POLICY, ...policy };
  const sal = salaryOf(s);
  const perDay = Math.round(sal.gross / p.workingDays);
  const att = s.att || { P: 0, A: 0, L: 0, V: 0 };
  const waived = item.waived || {};
  const earnings = [
    { key: 'basic', label: sal.allowances.length ? 'Basic salary' : 'Monthly salary', amount: sal.basic, fixed: true },
    ...sal.allowances.map((a, i) => ({ key: `al${i}`, label: a.label, amount: a.amount, fixed: true, note: 'Allowance' })),
    ...(item.adds || []).map((a) => ({ ...a, key: a.id })),
  ];
  const lateDays = p.latesPerAbsent ? Math.floor((att.L || 0) / p.latesPerAbsent) : 0;
  const unpaidLeave = Math.max(0, (att.V || 0) - p.paidLeaves);
  const auto = [
    p.cutAbsent && att.A > 0 && { key: 'absent', label: `Absent · ${att.A} day${att.A > 1 ? 's' : ''}`, why: `${att.A} × ${perDay.toLocaleString('en-US')} per day`, amount: att.A * perDay, auto: true, waivable: true },
    lateDays > 0 && { key: 'late', label: `Late · ${att.L} times`, why: `Every ${p.latesPerAbsent} lates = 1 day`, amount: lateDays * perDay, auto: true, waivable: true },
    unpaidLeave > 0 && { key: 'leave', label: `Unpaid leave · ${unpaidLeave} day${unpaidLeave > 1 ? 's' : ''}`, why: `${att.V} leave, ${p.paidLeaves} paid`, amount: unpaidLeave * perDay, auto: true, waivable: true },
    // Once the month is (part) paid, loan and advance cuts are frozen at what was settled.
    ...(item.settled ? [
      item.settled.loan > 0 && { key: 'loan', label: 'Loan instalment', why: 'Settled with this salary', amount: item.settled.loan, auto: true },
      item.settled.advance > 0 && { key: 'advance', label: 'Salary advance recovery', why: `Taken ${item.settled.advanceDate || 'this month'}`, amount: item.settled.advance, auto: true },
    ] : [
      s.loan > 0 && s.loanDeduction > 0 && { key: 'loan', label: 'Loan instalment', why: `${s.loan.toLocaleString('en-US')} still owed`, amount: Math.min(s.loan, s.loanDeduction), auto: true, waivable: true },
      s.advance > 0 && { key: 'advance', label: 'Salary advance recovery', why: `Taken ${s.advanceDate || 'this month'}`, amount: s.advance, auto: true, waivable: true },
    ]),
  ].filter(Boolean).map((c) => ({ ...c, waived: !!waived[c.key] }));
  const cuts = [
    ...auto,
    ...sal.deductions.map((d, i) => ({ key: `fd${i}`, label: d.label, amount: d.amount, fixed: true, note: 'Every month' })),
    ...(item.cuts || []).map((c) => ({ ...c, key: c.id })),
  ];
  const gross = earnings.reduce((a, x) => a + x.amount, 0);
  const deductions = cuts.filter((c) => !c.waived).reduce((a, x) => a + x.amount, 0);
  const net = Math.max(0, gross - deductions);
  const paid = (item.payments || []).reduce((a, x) => a + x.amount, 0);
  return { perDay, earnings, cuts, gross, deductions, net, paid, remaining: Math.max(0, net - paid), hold: !!item.hold, status: item.hold ? 'held' : paid >= net && paid > 0 ? 'paid' : paid > 0 ? 'partial' : 'unpaid' };
}
