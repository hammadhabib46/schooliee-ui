// Content and pricing for the marketing site and the sign-up wizard.
// Feature list, per-student rates and the Elite cap mirror schooliee.com/sign-up.

// Drop real files in /public/videos and fill these in. Empty src → poster + "coming soon".
export const PROMO_VIDEO = { src: '', poster: '', length: '1:48' };
export const TESTIMONIAL_VIDEOS = [
  { src: '', name: 'Sarah Ahmed', role: 'Owner · City Grammar School', city: 'Lahore', quote: 'Three days of fee collection now takes two hours.', tint: '#2B3A1A' },
  { src: '', name: 'Muhammad Hassan', role: 'Principal · Al-Noor Academy', city: 'Faisalabad', quote: 'Attendance is marked in seconds. Parents know instantly.', tint: '#1A2B3A' },
  { src: '', name: 'Fatima Khan', role: 'Admin · Bright Future School', city: 'Karachi', quote: 'Exam week became an afternoon.', tint: '#3A2A1A' },
  { src: '', name: 'Ahmed Ali', role: 'Owner · Iqra Model School', city: 'Multan', quote: 'Front-desk calls dropped by 65% in a month.', tint: '#2A1A3A' },
  { src: '', name: 'Ayesha Malik', role: 'Director · The Learning Tree', city: 'Islamabad', quote: 'Eight years of records, any profile in ten seconds.', tint: '#1A3A33' },
];

export const QUOTES = [
  { tag: 'Fee management', name: 'Sarah Ahmed', since: '2 years', text: 'Three days of manual fee collection now takes two hours. Automated reminders cut our defaulters by 45%, and parents love paying online from their phones.' },
  { tag: 'Attendance', name: 'Muhammad Hassan', since: '2 years', text: 'Morning attendance used to drag on for 20 minutes per class. Now teachers mark it on their phones in seconds and parents are notified instantly.' },
  { tag: 'Exams', name: 'Fatima Khan', since: '2 years', text: 'Setting up term exams and printing admit cards used to consume a full week. Schooliee compressed that into an afternoon.' },
  { tag: 'Parent communication', name: 'Ahmed Ali', since: '2 years', text: 'Parents used to call the front desk for everything. Now they check the app. Our inbound calls dropped by 65% in the first month.' },
  { tag: 'Student records', name: 'Ayesha Malik', since: 'a year', text: 'Schooliee digitised eight years of history. I can pull a complete student profile — marks, guardians, fee history — in under 10 seconds.' },
  { tag: 'Financial reports', name: 'Zain Abbas', since: 'a year', text: 'The monthly close used to take our accountant three days. Now it is a two-hour job, accurate to the rupee.' },
];

export const FAQ = [
  ['How difficult is it to set up Schooliee?', 'We do it for you. Share your student lists, fee structures or registers — Excel sheets or even photos of paper records — and our team builds your school in 24 hours. Then a short training call gets your staff going.'],
  ['What if my staff stop using it after a few weeks?', 'Parents keep it alive. Absence alerts, fee receipts and results reach families automatically, so parents start expecting them — and your staff keep the system up to date.'],
  ['What makes Schooliee different?', 'It is built for how Pakistani schools actually run: cash at the desk, families with several children, WhatsApp as the main channel, and owners who want answers without opening a dashboard.'],
  ['Can it reduce fee collection time?', 'Every family gets one ledger across all their children. Reminders go out on their own, cash is collected in two clicks, and bank payments mark themselves paid. Schools cut collection time by up to 70%.'],
  ['Can we share report cards with parents?', 'Enter marks once. Result cards, ranks and mark sheets follow, in your own grading scale, and parents see them in the app the same day.'],
  ['What if our internet is unreliable?', 'Attendance, records and fee collection keep working offline and sync when you reconnect.'],
];

// ---------- Sign-up wizard ----------
export const KINDS = ['School', 'Academy', 'College', 'Madrasa'];
export const CITIES = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Gujranwala', 'Sialkot', 'Hyderabad', 'Bahawalpur', 'Sargodha', 'Sukkur', 'Abbottabad', 'Mardan', 'Sahiwal', 'Okara', 'Jhang', 'Gujrat', 'Sheikhupura', 'Rahim Yar Khan', 'Kasur', 'Mirpur', 'Muzaffarabad', 'Dera Ghazi Khan', 'Larkana', 'Mansehra', 'Chiniot', 'Wah Cantt'];

export const INCLUDED = [
  ['Students & families', 'Admissions, profiles, siblings, documents and ID cards', 'family'],
  ['Classes & sections', 'Your class structure, promotion and alumni', 'layers'],
  ['Fee collection', 'Cash invoices, dues, receipts, discounts, fines and family credit', 'cash'],
  ['Ledger', 'Every rupee in and out, in one timeline', 'book'],
  ['Documents & certificates', 'Letterheads, character and leaving certificates', 'doc'],
  ['Funds & sessions', 'Class-wide charges and the academic year', 'fund'],
  ['Announcements & email', 'Broadcast to classes by email, with delivery tracking', 'send'],
  ['Basic reports', 'Defaulters, daily collection, enrollment and more', 'reports'],
  ['Activity log', 'See who changed what, and when', 'history'],
  ['School profile & settings', 'Your details, logo and preferences', 'settings'],
];

// rate = PKR per student per month
export const GROUPS = [
  {
    key: 'money', title: 'Fees & money', sub: 'Get paid on time and see where every rupee goes.',
    note: 'Cash invoicing is always included: collect fees at your desk and print receipts. To let families pay through a bank or online, turn on Fee challans.',
    items: [
      { key: 'challans', name: 'Fee challans', icon: 'receipt', rate: 1, desc: 'Bank fee vouchers for every family. Needed for bank and online payments.', points: ['Challans for the whole school in one click', 'Late fees and several bank accounts'] },
      { key: 'online', name: 'Online payments', icon: 'bolt', rate: 0, needs: 'challans', desc: 'Fees mark themselves paid from any bank app.', points: ['Payments recorded with no typing', 'A “fee received” message goes out automatically'], foot: 'No extra charge from us — your bank deducts its own small fee on every payment.' },
      { key: 'staff', name: 'Staff & teachers', icon: 'people', rate: 1.5, desc: 'Everyone you employ, in one place.', points: ['Profiles with CNIC, phone and joining date', 'Staff attendance and ID cards'] },
      { key: 'payroll', name: 'Payroll & salary slips', icon: 'cash', rate: 1, needs: 'staff', desc: 'Pay salaries, track loans and print slips.', points: ['Monthly payroll with attendance and loan recovery', 'Salary slips and receipts'] },
    ],
  },
  {
    key: 'class', title: 'Classroom', sub: 'Attendance, exams and the daily rhythm of school.',
    items: [
      { key: 'attendance', name: 'Attendance', icon: 'check', rate: 1.5, desc: 'Mark a class in seconds; parents hear about absences.', points: ['One-tap present, absent, late and leave', 'Printable mark sheets and holidays'], foot: 'QR gate scanning is included at no extra charge.' },
      { key: 'exams', name: 'Exams & results', icon: 'exam', rate: 1.5, desc: 'Enter marks once. Result cards and ranks follow.', points: ['Result cards, mark sheets and roll slips', 'Your own grading scale'] },
      { key: 'timetable', name: 'Timetable', icon: 'calendar', rate: 1, needs: 'staff', desc: 'Weekly schedules, with cover when a teacher is away.', points: ['Periods and working days that fit your school', 'Each teacher sees their own timetable'] },
      { key: 'diary', name: 'Class diary', icon: 'diary', rate: 0.5, desc: 'Homework and notes that reach parents the same day.', points: ['Daily diary per class and section', 'See when parents viewed it'] },
      { key: 'observation', name: 'Observation', icon: 'observe', rate: 0.5, desc: 'Structured feedback on each student.', points: ['Your own questions: text, yes/no or rating', 'Shared with parents when you choose'] },
    ],
  },
  {
    key: 'parents', title: 'Parents & messaging', sub: 'Keep every family in the loop without lifting a phone.',
    items: [
      { key: 'app', name: 'Parent app', icon: 'phone', rate: 1, desc: 'Fees, attendance, diary and results in every parent’s pocket.', points: ['Android app and web portal, no password needed', 'Dues, attendance, results and timetable'], foot: 'Parent chat is included at no extra charge.' },
      { key: 'whatsapp', name: 'WhatsApp messages', icon: 'whatsapp', rate: 1, desc: 'Alerts sent from your own WhatsApp number.', points: ['Absence, fee and result alerts on WhatsApp', 'Runs from a small Windows app'] },
      { key: 'sms', name: 'SMS messages', icon: 'mail', rate: 0.5, desc: 'Texts sent from an Android phone in your office.', points: ['Uses the phone’s own SIM and package', 'Adjustable sending speed'] },
      { key: 'reminders', name: 'Fee reminders', icon: 'bell', rate: 0.5, desc: 'Nudge families about dues in a few taps.', points: ['Remind one family or the whole school', 'See who was reminded and when'] },
    ],
  },
  {
    key: 'growth', title: 'Growth', sub: 'Bring new families in and put your school online.',
    items: [
      { key: 'admissions', name: 'Admissions & inquiries', icon: 'userPlus', rate: 1, desc: 'Take applications online and approve in a click.', points: ['A public registration form', 'Approve to create the student instantly'] },
      { key: 'website', name: 'School website', icon: 'globe', rate: 1, desc: 'A website built from the details you give us.', points: ['yourschool.schooliee.com with your name and photos', 'Gallery, results check and admission form'] },
    ],
  },
  {
    key: 'insight', title: 'Insight & control', sub: 'Know your numbers and decide who can do what.',
    items: [
      { key: 'advanced', name: 'Advanced reports', icon: 'reports', rate: 0.5, desc: 'Deeper analytics for owners who love numbers.', points: ['School KPI dashboard', 'Subject heatmaps and position holders'], foot: 'Basic reports are included for everyone.' },
      { key: 'ai', name: 'AI assistant', icon: 'sparkle', rate: 2.5, desc: 'Ask your school’s data a question, in the app or on WhatsApp.', points: ['“Who has the highest dues?” — answered with numbers', 'Text it on WhatsApp from anywhere'] },
      { key: 'logins', name: 'Employee logins', icon: 'key', rate: 0.5, desc: 'Give your accountant or receptionist their own login.', points: ['Role presets: Accountant, Receptionist, Principal', 'Limit a person to certain sections'] },
    ],
  },
];
export const ALL_FEATURES = GROUPS.flatMap((g) => g.items);
export const BASE_RATE = 5;
export const MIN_BILLED = 200;
export const YEARLY_OFF = 0.3;
// Elite (everything on) rate per student, by size.
export const eliteRate = (n) => (n > 1000 ? 12 : n > 500 ? 15 : 20);
export const proRate = (n) => (n > 1000 ? 6 : n > 500 ? 8 : 10);

export function priceOf(students, on) {
  const billed = Math.max(MIN_BILLED, Number(students) || 0);
  const lines = [{ key: 'base', name: 'Base plan', amount: BASE_RATE * billed }];
  ALL_FEATURES.forEach((f) => { if (on[f.key]) lines.push({ key: f.key, name: f.name, amount: f.rate * billed }); });
  const raw = lines.reduce((a, l) => a + l.amount, 0);
  const cap = eliteRate(billed) * billed;
  const monthly = Math.min(raw, cap);
  return { billed, lines, raw, cap, monthly, capped: raw > cap, saved: Math.max(0, raw - cap), yearly: Math.round(monthly * 12 * (1 - YEARLY_OFF)) };
}

export const BANK = { bank: 'Meezan Bank', title: 'Schooliee (Pvt) Ltd', account: '0123 0104 5678 90', iban: 'PK36 MEZN 0001 2301 0456 7890' };
