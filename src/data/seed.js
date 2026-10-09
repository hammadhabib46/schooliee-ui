// Mock data mirrored from the live demo school (schooliee.com/school/demo) on 9 Oct 2026.
// UI-only: nothing here talks to a server.

export const TODAY = '2026-10-09';

export const school = {
  name: 'Demo School Schooliee Pakistan',
  short: 'Demo School',
  slug: 'demo',
  site: 'demo.schooliee.com',
  email: 'office@demoschool.pk',
  phone: '+92 41 2345678',
  whatsapp: '+92 300 1234567',
  address: 'Gojra Road, Samundri, Faisalabad',
  owner: 'Demo school',
  subscriptionOverdue: true,
};

export const classes = [
  { id: 'n1', name: 'Nursery-I', short: 'N1', sections: ['A', 'new A'], fee: 8000, teacher: 'naima', order: 1 },
  { id: 'n2', name: 'Nursery-II', short: 'N2', sections: ['A'], fee: 5000, teacher: null, order: 2 },
  { id: 'kg', name: 'K.G', short: 'KG', sections: ['A'], fee: 5000, teacher: null, order: 3 },
  { id: 'c1', name: 'Class One', short: 'C1', sections: ['A', 'new A'], fee: 6000, teacher: 'Hammad Habib Habib', order: 4 },
  { id: 'c2', name: 'Class Two', short: 'C2', sections: ['A', 'new A'], fee: 7000, teacher: 'naima', order: 5 },
  { id: 'c3', name: 'Class Three', short: 'C3', sections: ['a'], fee: 7000, teacher: 'Hammad Habib Habib', order: 6 },
  { id: 'c4', name: 'Class Four', short: 'C4', sections: ['A'], fee: 7500, teacher: null, order: 7 },
  { id: 'c5', name: 'Class Five', short: 'C5', sections: ['A'], fee: 6000, teacher: null, order: 8 },
  { id: 'c6', name: 'Class Six', short: 'C6', sections: ['A'], fee: 8000, teacher: null, order: 9 },
  { id: 'c9', name: 'Class Nine', short: 'C9', sections: ['A'], fee: 9000, teacher: null, order: 10 },
  { id: 'c10', name: 'Class Ten', short: '10', sections: ['A'], fee: 9500, teacher: null, order: 11 },
];

export const families = [
  { id: 'F0090', name: 'Ali Raza', phone: '+92 304 8934441', whatsapp: '+92 326 0426349', cnic: '3310536748927', email: 'sample@gmail.com', occupation: '', mother: '', motherCnic: '', motherOccupation: '', caste: '', address: '', note: '', waVerified: true, app: true, paidTotal: 31700, credit: 1000,
    notes: [{ id: 'N1', text: 'Father prefers calls after 5 pm. Mother collects the children on Fridays.', by: 'Demo school', at: '2026-10-02T11:20', pinned: true, archived: false }] },
  { id: 'F0005', name: 'Ikram', phone: '03214493931', whatsapp: '03214493931', cnic: '3410142160835', email: '', occupation: '', mother: '', motherCnic: '', motherOccupation: '', caste: '', address: '', note: 'Duplicate of F0006 — merge pending.', waVerified: true, app: false, paidTotal: 0, credit: 0, notes: [] },
  { id: 'F0006', name: 'Ikram', phone: '03214493931', whatsapp: '03214493931', cnic: '3410142160836', email: '', occupation: 'Driver', mother: 'Nasreen', motherCnic: '', motherOccupation: 'Housewife', caste: '', address: 'Mohallah Islamabad, Samundri', note: '', waVerified: true, app: false, paidTotal: 1000, credit: 0,
    notes: [{ id: 'N2', text: 'Promised to clear September dues by 15 October.', by: 'Adeel Chaudhry', at: '2026-10-07T12:10', pinned: false, archived: false }] },
  { id: 'F0004', name: 'Imran', phone: '03016158439', whatsapp: '', cnic: '33568647582648', email: '', occupation: '', mother: '', motherCnic: '', motherOccupation: '', caste: '', address: '', note: '', waVerified: false, app: false, paidTotal: 12000, credit: 0, notes: [] },
  { id: 'F0007', name: 'Muneer Ahmed', phone: '0315-3607165', whatsapp: '', cnic: '2144-0999', email: '', occupation: '', mother: '', motherCnic: '', motherOccupation: '', caste: '', address: '', note: '', waVerified: false, app: false, paidTotal: 0, credit: 0, notes: [] },
  { id: 'F0203', name: 'Numan Ali', phone: '+92 304 8934441', whatsapp: '03016156794', cnic: '3310563946593', email: '', occupation: 'Shopkeeper', mother: 'Sadia', motherCnic: '', motherOccupation: 'Teacher', caste: 'Arain', address: 'Main Bazar, Samundri', note: '', waVerified: true, app: true, paidTotal: 76200, credit: 0, notes: [] },
  { id: 'F0111', name: 'Usman', phone: '03014487788', whatsapp: '03014487788', cnic: '3308446473826', email: '', occupation: '', mother: '', motherCnic: '', motherOccupation: '', caste: '', address: '', note: '', waVerified: true, app: false, paidTotal: 85993, credit: 10000, email: 'sample@gmail.com', emailInvalidOn: '2026-10-06',
    notes: [
      { id: 'N3', text: 'Bus fee will be paid after the 15th — salary date.', by: 'Demo school', at: '2026-10-09T08:20', pinned: false, archived: false },
      { id: 'N4', text: 'Asked for sibling discount in August — declined.', by: 'Demo school', at: '2026-08-21T10:00', pinned: false, archived: true },
    ] },
];

// dues: outstanding line items (cat: monthly | recurring | onetime | fine | other).
// charges: one-time charges · fines: fines ever applied · recurring: monthly add-ons.
export const students = [
  {
    id: 'S0006', name: 'saim', familyId: 'F0090', classId: 'c3', section: 'a', roll: '12', gender: 'Male', religion: 'Islam', dob: '', bform: '', blood: '',
    admitted: '2026-09-30', discount: 1000, discountType: 'amount', discountReason: 'Sibling discount', prevSchool: 'Islamic public high school', prevClass: 'Two', prevResult: '90%', reference: '', note: '', status: 'active', isNew: true, photo: true,
    customFields: [['Previous monthly fee', '5,000 PKR']],
    charges: [
      { id: 'c1', label: 'Admission fee', month: 'Sep 2026', amount: 4000, paid: 4000 }, { id: 'c2', label: 'Books', month: 'Sep 2026', amount: 2000, paid: 2000 },
      { id: 'c3', label: 'Fund', month: 'Sep 2026', amount: 500, paid: 500 }, { id: 'c4', label: 'Security', month: 'Sep 2026', amount: 1000, paid: 1000 },
      { id: 'c5', label: 'Uniform', month: 'Sep 2026', amount: 5000, paid: 5000 }, { id: 'c6', label: 'Pending dues (previous school)', month: 'Sep 2026', amount: 1000, paid: 1000 },
    ],
    fines: [{ id: 'f1', label: 'Fund', amount: 200, date: '2026-10-01', by: 'Demo school', status: 'paid' }],
    recurring: [], paid: 0, dues: [],
  },
  {
    id: 'S0076', name: 'Fiza', familyId: 'F0090', classId: 'n1', section: 'A', roll: '3', gender: 'Female', religion: 'Islam', dob: '2021-03-14', bform: '', blood: 'B+',
    admitted: '2026-04-02', discount: 10, discountType: 'percent', discountReason: 'Sibling discount', prevSchool: '', reference: 'Ali Raza', note: '', status: 'active', isNew: false,
    customFields: [], charges: [{ id: 'c1', label: 'Admission fee', month: 'Apr 2026', amount: 3000, paid: 3000 }],
    fines: [], recurring: [{ id: 'r1', name: 'Tuition (evening)', amount: 2000, day: 6, from: '2026-10', end: '', status: 'active' }], paid: 0, dues: [],
  },
  {
    id: 'S0008', name: 'Abdullah', familyId: 'F0006', classId: 'c2', section: 'A', roll: '7', gender: 'Male', religion: 'Islam', dob: '2018-07-02', bform: '', blood: '',
    admitted: '2026-08-12', discount: 0, discountType: 'amount', prevSchool: 'Govt. Primary School No. 2', prevClass: 'One', prevResult: '72%', reference: '', note: 'Promoted from Class One new A on 7 Oct.', status: 'active', isNew: false, photo: true,
    customFields: [], charges: [{ id: 'c1', label: 'Admission fee', month: 'Aug 2026', amount: 1000, paid: 1000 }, { id: 'c2', label: 'Promotion fee', month: 'Oct 2026', amount: 1000, paid: 0 }],
    fines: [], recurring: [], paid: 0,
    dues: [
      { id: 'd1', label: 'Monthly fee', month: 'Sep 2026', amount: 3958, cat: 'monthly' },
      { id: 'd2', label: 'Monthly fee', month: 'Oct 2026', amount: 7000, cat: 'monthly' },
      { id: 'd3', label: 'Promotion fee', month: 'Oct 2026', amount: 1000, cat: 'onetime' },
    ],
  },
  {
    id: 'S0008E', code: 'S0008', name: 'esha', familyId: 'F0004', classId: 'c4', section: 'A', roll: '4', gender: 'Female', religion: 'Islam', dob: '2016-11-20', bform: '', blood: 'O+',
    admitted: '2026-05-04', discount: 0, discountType: 'amount', prevSchool: '', reference: '', note: '', status: 'active', isNew: false,
    customFields: [], charges: [{ id: 'c1', label: 'Admission fee', month: 'May 2026', amount: 2000, paid: 2000 }], fines: [], recurring: [], paid: 0, dues: [],
  },
  {
    id: 'S0009', name: 'Mairaj Ahmed', familyId: 'F0007', classId: 'c5', section: 'A', roll: '1', gender: 'Male', religion: 'Islam', dob: '', bform: '', blood: '',
    admitted: '2026-10-09', discount: 0, discountType: 'amount', firstMonthFee: 1500, prevSchool: '', reference: '', note: '', status: 'active', isNew: true,
    customFields: [], charges: [{ id: 'c1', label: 'Admission fee', month: 'Oct 2026', amount: 1998, paid: 0 }], fines: [], recurring: [], paid: 0,
    dues: [
      { id: 'd1', label: 'Admission fee', month: 'Oct 2026', amount: 1998, cat: 'onetime' },
      { id: 'd2', label: 'Monthly fee (from 9 Oct)', month: 'Oct 2026', amount: 1500, cat: 'monthly' },
    ],
  },
  {
    id: 'S0021', name: 'Daniyal', familyId: 'F0111', classId: 'c2', section: 'A', roll: '9', gender: 'Male', religion: 'Islam', dob: '2018-01-09', bform: '', blood: '',
    admitted: '2026-06-15', discount: 0, discountType: 'amount', prevSchool: '', reference: '', note: '', status: 'active', isNew: false,
    customFields: [], charges: [{ id: 'c1', label: 'Admission fee', month: 'Jun 2026', amount: 2000, paid: 2000 }],
    fines: [{ id: 'f1', label: 'Late fee fine', amount: 100, date: '2026-10-07', by: 'Admin', status: 'unpaid' }], recurring: [], paid: 0,
    dues: [{ id: 'f1', label: 'Late fee fine', month: 'Oct 2026', amount: 100, cat: 'fine' }],
  },
  {
    id: 'S-00010', name: 'Fatima Iqbal', familyId: 'F0111', classId: 'c1', section: 'new A', roll: '2', gender: 'Female', religion: 'Islam', dob: '2019-05-22', bform: '', blood: '',
    admitted: '2026-08-20', discount: 0, discountType: 'amount', prevSchool: '', reference: '', note: 'Uses school van — Route 2.', status: 'active', isNew: false,
    customFields: [['Van route', 'Route 2 · Gojra Road']], charges: [{ id: 'c1', label: 'Admission fee', month: 'Aug 2026', amount: 2000, paid: 2000 }],
    fines: [{ id: 'f1', label: 'Fine', amount: 500, date: '2026-10-06', by: 'Demo school', status: 'unpaid' }],
    recurring: [{ id: 'r1', name: 'Bus', amount: 10000, day: 6, from: '2026-09', end: '2027-03-31', status: 'active' }], paid: 0,
    dues: [
      { id: 'd1', label: 'Paper fund', month: 'Sep 2026', amount: 100, cat: 'other' },
      { id: 'd2', label: 'Monthly fee', month: 'Sep 2026', amount: 1000, orig: 6000, cat: 'monthly' },
      { id: 'd3', label: 'Bus', month: 'Sep 2026', amount: 10000, cat: 'recurring' },
      { id: 'd4', label: 'Student fund', month: 'Oct 2026', amount: 4343, cat: 'other' },
      { id: 'd5', label: 'Monthly fee', month: 'Oct 2026', amount: 6000, cat: 'monthly' },
      { id: 'f1', label: 'Fine', month: 'Oct 2026', amount: 500, cat: 'fine' },
      { id: 'd7', label: 'Bus', month: 'Oct 2026', amount: 10000, cat: 'recurring' },
    ],
  },
  {
    id: 'S0007', name: 'Ahsan', familyId: 'F0203', classId: 'c3', section: 'a', roll: '5', gender: 'Male', religion: 'Islam', dob: '2017-02-11', bform: '35202-1234567-1', blood: 'A+',
    admitted: '2026-04-10', discount: 0, discountType: 'amount', prevSchool: '', reference: '', note: '', status: 'active', isNew: false,
    customFields: [], charges: [{ id: 'c1', label: 'Admission fee', month: 'Apr 2026', amount: 2000, paid: 2000 }],
    fines: [{ id: 'f1', label: 'Late', amount: 200, date: '2026-10-03', by: 'Demo school', status: 'unpaid' }], recurring: [], paid: 0,
    dues: [{ id: 'f1', label: 'Late fine', month: 'Oct 2026', amount: 200, cat: 'fine' }],
  },
  {
    id: 'S0268', name: 'Abrar', familyId: 'F0203', classId: 'c2', section: 'A', roll: '6', gender: 'Male', religion: 'Islam', dob: '2018-09-30', bform: '', blood: '',
    admitted: '2026-04-10', discount: 0, discountType: 'amount', prevSchool: '', reference: '', note: '', status: 'active', isNew: false,
    customFields: [], charges: [{ id: 'c1', label: 'Admission fee', month: 'Apr 2026', amount: 2000, paid: 2000 }],
    fines: [{ id: 'f1', label: 'Late fee fine', amount: 100, date: '2026-10-07', by: 'Demo school', status: 'unpaid' }], recurring: [], paid: 0,
    dues: [{ id: 'f1', label: 'Late fee fine', month: 'Oct 2026', amount: 100, cat: 'fine' }],
  },
];

export const staff = [
  {
    id: 'STF-0012', name: 'Adeel Chaudhry', role: 'Accountant', type: 'other', father: 'Ali Chaudhry', whatsapp: '+923725060693', phone: '+923682827527',
    cnic: '13734-5360138-1', subject: 'Islamiat', joined: '2025-06-25', address: '9052 S 9th Street, Karachi', pay: 23540, loan: 0, status: 'active',
    att: { P: 2, A: 2, L: 0, V: 0 },
  },
  {
    id: 'T0022', name: 'Hammad Habib Habib', role: 'Teacher', type: 'teacher', father: 'Habib Ahmed', whatsapp: '3356226026', phone: '3356226026',
    cnic: '12344321432', subject: 'Science', joined: '2025-08-01', address: 'Samundri', pay: 40000, loan: 0, status: 'active',
    att: { P: 3, A: 1, L: 1, V: 0 },
  },
  {
    id: 'T0028', name: 'naima', role: 'Teacher', type: 'teacher', father: 'Muhammad Aslam', whatsapp: '32393874923', phone: '32393874923',
    cnic: '3310438493728', subject: 'English', joined: '2025-09-10', address: 'Faisalabad', pay: 49994, loan: 0, status: 'active',
    att: { P: 5, A: 0, L: 0, V: 0 },
  },
];

// Ledger (cash book). +amount income, type: in | out
export const ledger = [
  { id: 'L14', date: '2026-10-08T06:40', amount: 200, type: 'in', method: 'Cash', category: 'Fine', reason: 'Challan payment SN7-00000095', ref: 'F0090 · S0006', by: 'Demo school', doc: 'Challan' },
  { id: 'L13', date: '2026-10-08T06:40', amount: 2600, type: 'in', method: 'Cash', category: 'Recurring charge', reason: 'Challan payment SN7-00000095', ref: 'F0090 · S0076', by: 'Demo school', doc: 'Challan' },
  { id: 'L12', date: '2026-10-08T06:38', amount: 1000, type: 'in', method: 'Online', category: 'Family balance', reason: 'Painting', ref: 'F0090', by: 'Demo school', doc: 'Invoice' },
  { id: 'L11', date: '2026-10-07T12:06', amount: 0, type: 'in', method: 'Online', category: 'Promotion', reason: 'Promotion Class One-new A → Class Two-A', ref: 'F0006 · S0008', by: 'Demo school', doc: 'Invoice' },
  { id: 'L10', date: '2026-10-07T12:05', amount: 1000, type: 'in', method: 'Online', category: 'Admission fee', reason: 'Admission fee', ref: 'F0006 · S0008', by: 'Demo school', doc: 'Invoice' },
  { id: 'L9', date: '2026-10-06T07:46', amount: 4050, type: 'in', method: 'Cash', category: 'Monthly fee', reason: 'Fee payments', ref: 'F0004 · S0008', by: 'Demo school', doc: 'Invoice' },
  { id: 'L8', date: '2026-10-02T11:53', amount: 450, type: 'in', method: 'Cash', category: 'Monthly fee', reason: 'Fee payments', ref: 'F0004 · S0008', by: 'Demo school', doc: 'Invoice' },
  { id: 'L7', date: '2026-10-02T10:54', amount: 7500, type: 'in', method: 'Cash', category: 'Monthly fee', reason: 'Fee payments', ref: 'F0004 · S0008', by: 'Demo school', doc: 'Invoice' },
  { id: 'L6', date: '2026-10-01T22:32', amount: 28200, type: 'in', method: 'Cash', category: 'Monthly fee', reason: 'Fee payments', ref: 'F0111 · S0021', by: 'Demo school', doc: 'Invoice' },
  { id: 'L5', date: '2026-10-01T22:19', amount: 14000, type: 'in', method: 'Cash', category: 'Monthly fee', reason: 'Fee payments', ref: 'F0090 · S0076, S0006', by: 'Demo school', doc: 'Invoice' },
  { id: 'L4', date: '2026-10-01T16:02', amount: 15000, type: 'in', method: 'Cash', category: 'Monthly fee', reason: 'Fee payments', ref: 'F0090 · S0076, S0006', by: 'Demo school', doc: 'Invoice' },
  { id: 'L3', date: '2026-10-01T13:10', amount: 123, type: 'in', method: 'Cash', category: 'Other income', reason: 'TEST backdated entry', ref: '—', by: 'Admin', doc: null },
  { id: 'L2', date: '2026-10-01T11:49', amount: 14000, type: 'in', method: 'Cash', category: 'Monthly fee', reason: 'Fee payments', ref: 'F0203 · S0268, S0007', by: 'Demo school', doc: 'Invoice' },
  { id: 'L1', date: '2026-10-01T11:22', amount: 15500, type: 'in', method: 'Cash', category: 'Monthly fee', reason: 'Fee payments', ref: 'F0203 · S0268, S0007', by: 'Demo school', doc: 'Invoice' },
];

export const dailyCollection = [95, 6, 2, 1, 1, 2, 1, 2, 1]; // % of peak per day 1–9 Oct

export const monthly = [
  { m: 'Jan', billed: 4000, collected: 2000, balance: 0 },
  { m: 'Feb', billed: 4000, collected: 2000, balance: 0 },
  { m: 'Mar', billed: 4000, collected: 1000, balance: 0 },
  { m: 'Apr', billed: 5000, collected: 21644, balance: 0 },
  { m: 'May', billed: 16200, collected: 10200, balance: 0 },
  { m: 'Jun', billed: 12000, collected: 18000, balance: 0 },
  { m: 'Jul', billed: 90200, collected: 9000, balance: 0 },
  { m: 'Aug', billed: 83800, collected: 223200, balance: 0 },
  { m: 'Sep', billed: 159200, collected: 835849, balance: 11100 },
  { m: 'Oct', billed: 144399, collected: 102500, balance: 36699 },
];

export const attendanceTrend = [
  { m: 'Apr', v: 100 }, { m: 'May', v: 100 }, { m: 'Jun', v: 78 }, { m: 'Jul', v: 90 },
  { m: 'Aug', v: 86 }, { m: 'Sep', v: 70 }, { m: 'Oct', v: 63 },
];

export const exams = [
  { id: 'E10', name: 'Monthly exam', classId: 'c3', section: 'a', subjects: [['English', 100], ['Urdu', 100], ['Science', 100]], date: '2026-10-05', by: 'Demo school', created: '2026-10-03', published: true,
    results: { S0006: { English: 60, Urdu: 79, Science: 90 }, S0007: { English: 70, Urdu: 60, Science: 70 } } },
  { id: 'E1', name: 'Hello exam', classId: 'c2', section: 'A', subjects: [['English', 100], ['Urdu', 100], ['Science', 100]], date: '2026-10-12', by: 'Admin', created: '2026-10-06', published: true,
    results: { S0268: { English: 82, Urdu: 74, Science: 88 } } },
  { id: 'E2', name: 'Hello exam', classId: 'c2', section: 'new A', subjects: [['English', 100], ['Urdu', 100], ['Science', 100]], date: '2026-10-12', by: 'Admin', created: '2026-10-06', published: false, results: {} },
  { id: 'E3', name: 'Hello exam', classId: 'c1', section: 'A', subjects: [['English', 100], ['Urdu', 100], ['Science', 100]], date: '2026-10-12', by: 'Admin', created: '2026-10-06', published: false, results: {} },
  { id: 'E4', name: 'Hello exam', classId: 'c1', section: 'new A', subjects: [['English', 100], ['Urdu', 100], ['Science', 100]], date: '2026-10-12', by: 'Admin', created: '2026-10-06', published: false, results: {} },
  { id: 'E5', name: 'Hello exam', classId: 'n1', section: 'A', subjects: [['English', 100], ['Urdu', 100], ['Science', 100]], date: '2026-10-13', by: 'Admin', created: '2026-10-06', published: false, results: {} },
  { id: 'E6', name: 'Hello exam', classId: 'n1', section: 'new A', subjects: [['English', 100], ['Urdu', 100], ['Science', 100]], date: '2026-10-13', by: 'Admin', created: '2026-10-06', published: false, results: {} },
  { id: 'E7', name: 'new exam', classId: 'c3', section: 'a', subjects: [['English', 50], ['Urdu', 50]], date: '2026-10-01', by: 'Demo school', created: '2026-10-01', published: true,
    results: { S0006: { English: 50, Urdu: 50 }, S0007: { English: 35, Urdu: 38 } } },
];

export const announcements = [
  { id: 'A1', title: 'Welcome to School!', kind: 'auto', type: 'New admission', body: 'Admission confirmation — Mairaj Ahmed (S0009), Class Five A. Admission fee 1,998 PKR.', date: '2026-10-09', by: 'System', app: [1, 1], wa: [0, 1] },
  { id: 'A2', title: 'Fee challan generated', kind: 'auto', type: 'Fee challan', body: 'Fee challan SN7-00000097 for 300 PKR generated, due 08 Oct 2026.', date: '2026-10-08', by: 'System', app: [1, 1], wa: [1, 1] },
  { id: 'A3', title: 'Fee reminder — Usman', kind: 'manual', type: 'Fee reminder', body: 'Assalam o Alaikum, dear family of Fatima Iqbal and Daniyal. This is a friendly reminder regarding your pending fee dues. Total outstanding: 48,043 PKR.', date: '2026-10-08', by: 'Demo school', app: [1, 1], wa: [1, 1] },
  { id: 'A4', title: 'Student on leave', kind: 'auto', type: 'Attendance', body: 'Fatima Iqbal (S-00010) is on leave on Oct 08, 2026.', date: '2026-10-08', by: 'System', app: [1, 1], wa: [1, 1] },
  { id: 'A5', title: 'Student late', kind: 'auto', type: 'Attendance', body: 'Fiza (S0076) arrived late on Oct 08, 2026.', date: '2026-10-08', by: 'System', app: [1, 1], wa: [1, 1] },
  { id: 'A6', title: 'Exam result updated', kind: 'auto', type: 'Exam result', body: 'Results for saim (S0006) in "Monthly exam": 229/300 (76.33%).', date: '2026-10-03', by: 'System', app: [1, 1], wa: [1, 1] },
  { id: 'A7', title: 'Exam schedule — Class Three', kind: 'manual', type: 'Exam schedule', body: 'Monthly exam for Class Three a. English 05 Oct, Urdu 06 Oct, Science 07 Oct. Please ensure timely preparation.', date: '2026-10-03', by: 'Demo school', app: [2, 2], wa: [2, 2] },
  { id: 'A8', title: 'Student absent', kind: 'auto', type: 'Attendance', body: 'Ahsan (S0007) was marked absent on Oct 03, 2026.', date: '2026-10-03', by: 'System', app: [1, 1], wa: [1, 1] },
  { id: 'A9', title: 'English diary', kind: 'manual', type: 'Diary', body: 'A new diary entry has been posted for Class Two: Test full book.', date: '2026-10-02', by: 'Demo school', app: [2, 2], wa: [2, 2] },
  { id: 'A10', title: 'Fee payment received', kind: 'auto', type: 'Fee receipt', body: 'Fee payment of 15,000 PKR received via cash for challan SN7-00000056.', date: '2026-10-01', by: 'System', app: [1, 1], wa: [1, 1] },
  { id: 'A11', title: 'Parent–teacher meeting', kind: 'manual', type: 'Announcement', body: 'PTM will be held on Saturday 17 October from 9:00 to 12:00. Parents are requested to attend.', date: '2026-09-28', by: 'Demo school', app: [6, 7], wa: [5, 7] },
];

export const inquiries = [
  { id: 'A0007', name: 'Website Verification Child Two', guardian: 'Website Verification Family', phone: '03000000000', gender: 'Male', classWanted: 'Class One', source: 'Website', stage: 'new', date: '2026-10-08T20:47' },
  { id: 'A0006', name: 'Website Verification Child One', guardian: 'Website Verification Family', phone: '03000000000', gender: 'Female', classWanted: 'Nursery-I', source: 'Website', stage: 'new', date: '2026-10-08T20:46' },
  { id: 'A0005', name: 'Codex Contact Method Check', guardian: '—', phone: '', gender: 'Male', classWanted: 'Class Two', source: 'Admin', stage: 'contacted', date: '2026-10-08T02:26' },
  { id: 'A0017', name: 'Hassan', guardian: 'Kashif', phone: '30034567584', gender: 'Male', classWanted: 'Class Three', source: 'Walk-in', stage: 'visit', date: '2026-09-10T10:33' },
  { id: 'A0013', name: 'Ali', guardian: 'Rashid', phone: '03219998877', gender: 'Female', classWanted: 'K.G', source: 'Website', stage: 'contacted', date: '2026-09-08T14:29' },
  { id: 'A0016', name: 'asma', guardian: 'Tariq', phone: '03012364728', gender: 'Female', classWanted: 'Class Four', source: 'Walk-in', stage: 'approved', date: '2026-09-10T10:12' },
  { id: 'A0008', name: 'fatima', guardian: 'Akram', phone: '03026739152', gender: 'Female', classWanted: 'Nursery-II', source: 'Website', stage: 'approved', date: '2026-06-15T13:14' },
];

export const observations = [
  { id: 'O2', studentId: 'S0076', reviewer: 'Adeel Chaudhry', date: '2026-10-02', by: 'Demo school', scores: { Behaviour: 4, Participation: 5, Homework: 4, Neatness: 3, Punctuality: 4, Reading: 5 }, note: 'Very keen in class; handwriting needs practice.' },
  { id: 'O1', studentId: 'S0268', reviewer: 'naima', date: '2026-10-02', by: 'Demo school', scores: { Behaviour: 3, Participation: 3, Homework: 2, Neatness: 4, Punctuality: 3, Reading: 3 }, note: 'Homework often incomplete — informed parent.' },
];

export const diary = [
  { id: 'D3', title: 'English', classId: 'c2', section: 'A', date: '2026-10-02', body: 'Test full book — revise chapters 1 to 6.', by: 'Demo school' },
  { id: 'D2', title: 'English', classId: 'c2', section: 'A', date: '2026-10-02', body: 'Learn the spellings on page 24.', by: 'Demo school' },
  { id: 'D1', title: 'Science', classId: 'c3', section: 'a', date: '2026-10-01', body: 'Draw and label the parts of a plant.', by: 'Hammad Habib Habib' },
];

export const documents = [
  { id: 'DOC19', title: 'Result', type: 'Student upload', owner: 'Abdullah (S0008)', date: '2026-10-07T12:05' },
  { id: 'DOC18', title: 'Character certificate', type: 'Character certificate', owner: 'saim (S0006)', date: '2026-10-06T18:41' },
  { id: 'DOC17', title: 'Admission notice', type: 'Letter pad', owner: 'School', date: '2026-09-23T13:52' },
  { id: 'DOC16', title: 'Experience letter', type: 'Letter pad', owner: 'School', date: '2026-09-11T16:39' },
  { id: 'DOC15', title: 'Fee reminder letter', type: 'Letter pad', owner: 'Fiza (S0076)', date: '2026-09-11T11:16' },
  { id: 'DOC14', title: 'Character certificate', type: 'Character certificate', owner: 'Fiza (S0076)', date: '2026-09-11T11:12' },
  { id: 'DOC13', title: 'Best performance award', type: 'Certificate', owner: 'Fiza (S0076)', date: '2026-09-11T11:10' },
  { id: 'DOC12', title: 'TEST', type: 'Letter pad', owner: 'School', date: '2026-09-10T00:02' },
  { id: 'DOC11', title: 'Experience letter', type: 'Letter pad', owner: 'Adeel Chaudhry (STF-0012)', date: '2026-09-05T11:16' },
  { id: 'DOC10', title: 'Achievement certificate', type: 'Certificate', owner: 'Abrar (S0268)', date: '2026-09-01T13:04' },
  { id: 'DOC9', title: 'hemmmad', type: 'Letter pad', owner: 'School', date: '2026-08-01T13:30' },
  { id: 'DOC8', title: 'Admission', type: 'Letter pad', owner: 'School', date: '2026-07-23T14:42' },
  { id: 'DOC7', title: 'Rich text rendering test', type: 'Letter pad', owner: 'School', date: '2026-07-21T16:50' },
  { id: 'DOC6', title: 'Letter of recommendation', type: 'Letter pad', owner: 'School', date: '2026-07-21T15:39' },
  { id: 'DOC5', title: 'Track student achievement', type: 'Certificate', owner: 'Fiza (S0076)', date: '2026-07-11T12:07' },
  { id: 'DOC4', title: 'form', type: 'Student upload', owner: 'Fiza (S0076)', date: '2026-07-11T11:50' },
  { id: 'DOC3', title: 'Form', type: 'Student upload', owner: 'Fiza (S0076)', date: '2026-07-11T11:50' },
  { id: 'DOC2', title: 'Character certificate', type: 'Character certificate', owner: 'Abrar (S0268)', date: '2026-07-04T09:38' },
  { id: 'DOC1', title: 'testing', type: 'Custom document', owner: 'School', date: '2026-05-23T23:35' },
];

// Weekly period grid. day: 1=Mon … 6=Sat
export const periods = [
  { n: 1, start: '08:00', end: '08:40' }, { n: 2, start: '08:40', end: '09:20' }, { n: 3, start: '09:20', end: '10:00' },
  { n: 4, start: '10:20', end: '11:00' }, { n: 5, start: '11:00', end: '11:40' }, { n: 6, start: '11:40', end: '12:20' },
];
export const timetable = [
  { id: 'T1', day: 3, period: 5, classId: 'c1', section: 'new A', subject: 'Science', teacher: 'Hammad Habib Habib' },
  { id: 'T2', day: 1, period: 1, classId: 'c2', section: 'A', subject: 'English', teacher: 'naima' },
  { id: 'T3', day: 1, period: 2, classId: 'c3', section: 'a', subject: 'Science', teacher: 'Hammad Habib Habib' },
  { id: 'T4', day: 2, period: 1, classId: 'n1', section: 'A', subject: 'English', teacher: 'naima' },
  { id: 'T5', day: 2, period: 3, classId: 'c1', section: 'A', subject: 'Science', teacher: 'Hammad Habib Habib' },
  { id: 'T6', day: 4, period: 2, classId: 'c2', section: 'A', subject: 'English', teacher: 'naima' },
  { id: 'T7', day: 5, period: 1, classId: 'c3', section: 'a', subject: 'Science', teacher: 'Hammad Habib Habib' },
  { id: 'T8', day: 5, period: 4, classId: 'c2', section: 'A', subject: 'English', teacher: 'naima' },
  { id: 'T9', day: 6, period: 2, classId: 'c1', section: 'new A', subject: 'Islamiat', teacher: 'Adeel Chaudhry' },
];

export const activity = [
  { id: 'AC1', who: 'Demo school', what: 'signed in', when: '2026-10-09T09:12' },
  { id: 'AC2', who: 'Admin', what: 'signed out', when: '2026-10-09T09:11' },
  { id: 'AC3', who: 'Demo school', what: 'moved Mairaj Ahmed (S0009) to family Muneer Ahmed (F0007)', when: '2026-10-09T07:30' },
  { id: 'AC4', who: 'Demo school', what: 'created family Muneer Ahmed (F0007)', when: '2026-10-09T07:28' },
  { id: 'AC5', who: 'Demo school', what: 'queued announcement "Welcome to School!" on WhatsApp', when: '2026-10-09T06:40' },
  { id: 'AC6', who: 'Demo school', what: 'created student Mairaj Ahmed (S0009)', when: '2026-10-09T06:38' },
  { id: 'AC7', who: 'Demo school', what: 'collected 2,800 PKR from Ali Raza (F0090)', when: '2026-10-08T06:40' },
  { id: 'AC8', who: 'Demo school', what: 'promoted Abdullah (S0008) to Class Two A', when: '2026-10-07T12:06' },
];

export const chats = [
  { id: 'CH1', familyId: 'F0111', unread: 2, messages: [
    { from: 'them', text: 'Assalam o Alaikum, Fatima will be on leave tomorrow.', at: '2026-10-07T19:02' },
    { from: 'me', text: 'Wa Alaikum Assalam. Noted, thank you.', at: '2026-10-07T19:10' },
    { from: 'them', text: 'Can we pay the bus fee next week?', at: '2026-10-09T08:15' },
    { from: 'them', text: 'Salary comes on the 15th.', at: '2026-10-09T08:16' },
  ] },
  { id: 'CH2', familyId: 'F0090', unread: 0, messages: [
    { from: 'me', text: 'Payment of 2,800 PKR received. Thank you!', at: '2026-10-08T06:41' },
    { from: 'them', text: 'JazakAllah', at: '2026-10-08T07:02' },
  ] },
  { id: 'CH3', familyId: 'F0203', unread: 1, messages: [
    { from: 'them', text: 'When is the PTM?', at: '2026-10-06T16:20' },
  ] },
  { id: 'CH4', familyId: 'F0006', unread: 0, messages: [
    { from: 'me', text: 'Abdullah has been promoted to Class Two A.', at: '2026-10-07T12:08' },
  ] },
];

export const funds = [
  { id: 'FU1', name: 'Student fund', collected: 9686, target: 20000 },
  { id: 'FU2', name: 'Paper fund', collected: 900, target: 2000 },
  { id: 'FU3', name: 'Building fund', collected: 0, target: 100000 },
];

export const bankAccounts = [
  { id: 'B1', bank: 'Faysal Bank', account: '4546565656565666', code: '0000', branch: 'Central-II IBB Samundri, Gojra Road' },
];

export const reportGroups = [
  { group: 'Finance', items: [
    ['daily-collection', 'Daily collection', 'Fees and income collected today.'],
    ['income-expense', 'Income vs expense', 'Compare all revenue against costs.'],
    ['monthly-revenue', 'Monthly revenue', 'Month-by-month billed, collected and outstanding.'],
    ['student-arrears', 'Student arrears', 'Students with outstanding balances.'],
    ['family-arrears', 'Family arrears', 'Dues grouped by family.'],
    ['family-balances', 'Family balances', 'Payments vs total family liability.'],
    ['staff-arrears', 'Staff arrears', 'Unpaid salaries and loan deductions.'],
    ['collection-by-class', 'Collection rate by class', 'Ranks classes by how much billed fee is collected.'],
    ['section-income', 'Section-wise income', 'Billed, collected and outstanding per section.'],
  ] },
  { group: 'Students', items: [
    ['enrollment', 'Enrollment summary', 'Strength by class, section and gender.'],
    ['defaulters', 'Fee defaulters', 'High-priority list of overdue students.'],
    ['new-admissions', 'New admissions', 'Recently admitted students.'],
    ['terminated', 'Terminated students', 'Students who have left or been removed.'],
  ] },
  { group: 'Attendance', items: [
    ['daily-attendance', 'Daily attendance', 'Check-in status for a date.'],
    ['monthly-attendance', 'Monthly attendance', 'Presence percentage for the month.'],
    ['chronic-absentees', 'Chronic absentees', 'Students frequently missing class.'],
  ] },
  { group: 'Staff & families', items: [
    ['staff-directory', 'Staff directory', 'All active and inactive employees.'],
    ['staff-pay', 'Staff pay history', 'Every salary disbursement.'],
    ['family-directory', 'Family directory', 'Contact details for all parents.'],
  ] },
  { group: 'Academics', items: [
    ['class-results', 'Class results', 'Performance breakdown from recent exams.'],
    ['class-strength', 'Class strength', 'Capacity and occupancy by classroom.'],
    ['subject-heatmap', 'Subject performance heatmap', 'Weak subjects across classes for one term.'],
    ['position-holders', 'Position holders', 'Top 3 students in every class.'],
  ] },
  { group: 'Management', items: [
    ['kpi', 'School KPI dashboard', 'High-level business and operational metrics.'],
    ['activity-log', 'Activity log', 'Audit trail of administrative actions.'],
  ] },
];

// ---------- Added after the full live-demo audit (see FEATURES.md) ----------

export const salaryHistory = {
  'STF-0012': [['2026-09', 23540, '2026-09-23'], ['2026-08', 23540, '2026-08-16'], ['2026-07', 20000, '2026-07-27'], ['2026-06', 23540, '2026-06-03'], ['2026-05', 23540, '2026-05-01'], ['2026-04', 23540, '2026-04-15'], ['2026-03', 23540, '2026-04-23'], ['2026-02', 23540, '2026-02-15'], ['2026-01', 23540, '2026-01-20']],
  T0022: [['2026-09', 40000, '2026-09-30'], ['2026-08', 40000, '2026-08-31'], ['2026-07', 40000, '2026-07-31'], ['2026-06', 38000, '2026-07-02']],
  T0028: [['2026-09', 49994, '2026-09-30'], ['2026-08', 49994, '2026-09-01']],
};

export const users = [
  { id: 'U1', name: 'Demo school', email: 'owner@demoschool.pk', phone: '03001234567', role: 'Owner', status: 'active', staffId: null, sections: [], perms: 'all' },
  { id: 'U2', name: 'Admin', email: 'admin@demoschool.pk', phone: '03007654321', role: 'Administrator', status: 'active', staffId: null, sections: [], perms: 'all' },
  { id: 'U3', name: 'ahmad', email: 'ahmad277@gmial.com', phone: '03291140352', role: 'Accountant', status: 'active', staffId: 'STF-0012', sections: [], perms: { Fees: ['view', 'collect', 'stats', 'send reminders', 'export'], Ledger: ['view', 'create income', 'create expense', 'export'], Accounting: ['view', 'export'], Reports: ['view'] } },
  { id: 'U4', name: 'Hammad', email: 'sample@gmail.com', phone: '03033746593', role: 'Teacher', status: 'active', staffId: 'T0022', sections: ['c1|new A', 'c3|a'], perms: { Attendance: ['view', 'mark'], Diary: ['view', 'create', 'update'], Exams: ['view', 'update'], Observations: ['view', 'create'] } },
  { id: 'U5', name: 'Naima fatima', email: 'naima234@gmail.com', phone: '03023458392', role: 'Teacher', status: 'active', staffId: 'T0028', sections: ['c2|A', 'n1|A'], perms: { Attendance: ['view', 'mark'], Diary: ['view', 'create'], Exams: ['view', 'update'] } },
  { id: 'U6', name: 'umair', email: 'umairali225vu@gmail.com', phone: '03462579746', role: 'Computer operator', status: 'active', staffId: null, sections: [], perms: { Students: ['view', 'create', 'update'], Attendance: ['view', 'mark', 'scan qr'] } },
  { id: 'U7', name: 'Ahsan imran', email: 'ahsanimran2222@gmail.com', phone: '03016156794', role: 'Teacher', status: 'terminated', staffId: null, sections: [], perms: {} },
];

export const PERMISSIONS = [
  ['Students', ['view', 'create', 'update', 'terminate', 'export']],
  ['Staff', ['view', 'view pay', 'pay', 'create', 'update', 'export']],
  ['Classes', ['view', 'create', 'update', 'promote', 'export']],
  ['Attendance', ['view', 'print', 'mark', 'edit', 'mark staff', 'export', 'scan qr']],
  ['Fees', ['view', 'collect', 'stats', 'send reminders', 'export', 'manage recurring', 'manage challans']],
  ['Ledger', ['view', 'create income', 'create expense', 'mark problem', 'export']],
  ['Accounting', ['view', 'export']],
  ['Exams', ['view', 'create', 'update', 'export']],
  ['Reports', ['view', 'export']],
  ['Diary', ['view', 'create', 'update', 'export']],
  ['Timetable', ['view', 'create', 'update']],
  ['Chat', ['view', 'create', 'send message']],
  ['Announcements', ['view', 'create', 'export']],
  ['Inquiries', ['view', 'create', 'update', 'approve', 'decline', 'comment', 'export']],
  ['Observations', ['view', 'create', 'update', 'export']],
  ['Site content', ['view', 'update']],
  ['Documents', ['view', 'create', 'update', 'delete']],
  ['School info', ['view', 'update', 'manage questions']],
  ['Employees', ['view', 'create', 'update', 'export']],
  ['Activity logs', ['view', 'export']],
  ['Sessions', ['view', 'create', 'update', 'export']],
  ['Funds', ['view', 'create', 'export']],
  ['AI', ['view']],
];

export const fundsFull = [
  { id: 'FU1', name: 'Paper fund', amounts: { c1: 100, c2: 100 }, by: 'Demo school', created: '2026-09-26' },
  { id: 'FU2', name: 'Annual fund', amounts: { n1: 1500 }, by: 'Demo school', created: '2026-08-27' },
  { id: 'FU3', name: 'Water fund', amounts: { c2: 200 }, by: 'Demo school', created: '2026-06-01' },
  { id: 'FU4', name: 'Student fund', amounts: { c1: 4343 }, by: 'Demo school', created: '2026-10-01' },
  { id: 'FU5', name: 'Sports fund', amounts: {}, by: 'Admin', created: '2026-04-08' },
];

export const todos = [
  { id: 'TD1', text: 'Call Usman about bus fee (after the 15th)', assignee: 'Myself', by: 'Demo school', remind: '2026-10-15T10:00', done: false, added: '2026-10-09' },
  { id: 'TD2', text: 'Saturday staff meeting — agenda for PTM', assignee: 'Myself', by: 'Demo school', remind: '2026-10-10T11:40', done: false, added: '2026-09-26' },
  { id: 'TD3', text: 'Verify WhatsApp numbers of Imran and Muneer families', assignee: 'umair', by: 'Demo school', remind: '', done: false, added: '2026-10-08' },
  { id: 'TD4', text: 'Order exam papers for Hello exam', assignee: 'Myself', by: 'Demo school', remind: '2026-09-12T09:20', done: true, added: '2026-09-12' },
];

export const aiChats = [
  { id: 'AI1', title: 'Daniyal (S0021) fine', messages: [['me', 'Daniyal ka fine kitna hai?'], ['ai', 'Daniyal (S0021) has one unpaid fine: **Late fee fine — 100 PKR** (added 7 Oct by Admin). Total due for Daniyal: 100 PKR.']] },
  { id: 'AI2', title: 'Profit this month', messages: [['me', 'Is mahine ka munafa kitna hai?'], ['ai', 'October so far: income **103,623 PKR**, expenses **0 PKR**. Payroll of **113,534 PKR** is still due — after paying it you would be **−9,911 PKR** for the month.']] },
  { id: 'AI3', title: 'Teacher count', messages: [['me', 'How many teachers do we have?'], ['ai', 'You have **2 active teachers** (Hammad Habib Habib, naima) and **1 other staff** (Adeel Chaudhry, Accountant).']] },
];

export const gradingScheme = [['A+', 90], ['A', 80], ['B+', 70], ['B', 60], ['C+', 50], ['C', 40], ['D', 33], ['F', 0]];

export const observationQuestions = [
  { id: 'Q1', text: 'Was the student neat?', type: 'yesno', active: true },
  { id: 'Q2', text: 'Was the student punctual?', type: 'yesno', active: true },
  { id: 'Q3', text: 'Is the student neat and tidy?', type: 'rating', active: true },
  { id: 'Q4', text: 'Does the student complete homework?', type: 'yesno', active: true },
  { id: 'Q5', text: 'Is the student regular?', type: 'yesno', active: true },
  { id: 'Q6', text: 'How is the student’s behaviour?', type: 'text', active: true },
  { id: 'Q7', text: 'Was the student obedient?', type: 'rating', active: false },
];

export const timetableSettings = {
  workingDays: [1, 2, 3, 4, 5, 6], weekStart: 'Monday', timezone: 'Asia/Karachi (PKT)', flagCover: true, cycle: 'weekly',
  pauses: [{ id: 'P1', from: '2026-09-28', to: '2026-09-29', reason: 'Mid-term exams' }],
  timings: [
    { id: 'TM1', name: 'Regular timings', days: 'Every day', isDefault: true, periods: [['08:00', '08:40'], ['08:40', '09:20'], ['09:20', '10:00'], ['break', '10:00', '10:20'], ['10:20', '11:00'], ['11:00', '11:40'], ['11:40', '12:20']] },
    { id: 'TM2', name: 'Friday timings', days: 'Fri', isDefault: false, periods: [['08:00', '08:30'], ['08:30', '09:00'], ['09:00', '09:30'], ['break', '09:30', '09:45'], ['09:45', '10:15'], ['10:15', '10:45']] },
  ],
  rooms: ['Science lab', 'Computer lab', 'Hall'],
};

export const classFeeHistory = {
  c2: [{ date: '2026-05-23', fee: 7000, kind: 'created', by: 'Demo school' }, { date: '2026-05-23', fee: 7000, kind: 'session', by: 'Demo school' }],
  c1: [{ date: '2026-04-01', fee: 5500, kind: 'created', by: 'Admin' }, { date: '2026-08-01', fee: 6000, kind: 'changed', by: 'Demo school' }],
};

export const schoolSettings = {
  customFieldKeys: ['Van route', 'Previous monthly fee'],
  chargePresets: [{ label: 'Admission fee', amount: 2000 }, { label: 'Books', amount: 2000 }, { label: 'Uniform', amount: 3500 }, { label: 'Security', amount: 1000 }],
  schoolStart: '08:00', schoolEnd: '13:30', lateAfter: '08:15',
  payroll: { workingDays: 26, cutAbsent: true, latesPerAbsent: 3, paidLeaves: 1, payDay: 1 },
  slipInstructions: ['Bring this slip to every paper.', 'Arrive 15 minutes before the paper starts.', 'Mobile phones are not allowed in the exam hall.'],
  alerts: {
    'Attendance alerts': [true, false, false], 'Fee payment confirmation': [true, true, false], 'Exam result publishing': [true, false, true], 'Exam schedule updates': [true, false, false],
    'Student fine alerts': [true, false, false], 'New admission welcome': [true, true, true], 'Certificate issuance': [true, false, false], 'Daily diary / homework': [true, false, false],
    Observations: [true, false, false], 'Student birthday wishes': [true, false, false], 'Student profile changes': [false, false, false],
  },
};

export const inquiryExtra = {
  A0007: { dob: '2017-06-15', bform: '9000000000008', email: 'portal-verification@example.com', whatsapp: '03000000000', address: 'Demo verification address', mother: 'Demo Verification Parent', prevSchool: '', contact: 'Website form', comments: [] },
  A0017: { dob: '2017-01-20', bform: '', email: '', whatsapp: '30034567584', address: 'Samundri', mother: '', prevSchool: 'City Grammar School', contact: 'Walk-in', comments: [{ by: 'Demo school', at: '2026-09-11T10:00', text: 'Entry test on Saturday 9am.' }] },
};

// Challans per family. A new challan supersedes the family's earlier unpaid ones.
export const challans = [
  { id: 'SN7-00000096', familyId: 'F0111', scope: 'Family', issued: '2026-10-08', due: '2026-10-08', amount: 32043, status: 'unpaid', advance: 0 },
  { id: 'SN7-00000087', familyId: 'F0111', scope: 'Family', issued: '2026-10-06', due: '2026-10-06', amount: 31543, status: 'superseded', advance: 0 },
  { id: 'SN7-00000084', familyId: 'F0111', scope: 'Daniyal (S0021)', custom: true, issued: '2026-10-05', due: '', amount: 100, status: 'superseded', advance: 0 },
  { id: 'SN7-00000080', familyId: 'F0111', scope: 'Family', issued: '2026-10-03', due: '2026-10-03', amount: 47443, status: 'superseded', advance: 1 },
  { id: 'SN7-00000065', familyId: 'F0111', scope: 'Daniyal (S0021)', issued: '2026-10-01', due: '2026-10-01', paidOn: '2026-10-01', amount: 28200, status: 'paid', advance: 1 },
  { id: 'SN7-00000095', familyId: 'F0090', scope: 'Family', issued: '2026-10-08', due: '2026-10-08', paidOn: '2026-10-08', amount: 2800, status: 'paid', advance: 0 },
  { id: 'SN7-00000094', familyId: 'F0006', scope: 'Family', issued: '2026-10-07', due: '2026-10-15', amount: 11958, status: 'unpaid', advance: 0 },
  { id: 'SN7-00000090', familyId: 'F0203', scope: 'Family', issued: '2026-10-01', due: '2026-10-05', paidOn: '2026-10-01', amount: 14000, status: 'paid', advance: 0 },
];
