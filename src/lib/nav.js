export const workspaces = [
  { key: 'today', name: 'Today', icon: 'home', base: '/', tabs: [] },
  { key: 'students', name: 'Students', icon: 'people', base: '/students', tabs: [
    { to: '/students', label: 'Students', icon: 'academics', end: true },
    { to: '/students/families', label: 'Families', icon: 'family' },
    { to: '/students/admissions', label: 'Admissions', icon: 'userPlus' },
  ] },
  { key: 'staff', name: 'Staff', icon: 'briefcase', base: '/staff', tabs: [
    { to: '/staff', label: 'All staff', icon: 'people', end: true },
    { to: '/staff/payroll', label: 'Payroll', icon: 'cash' },
  ] },
  { key: 'academics', name: 'Academics', icon: 'academics', base: '/academics', tabs: [
    { to: '/academics/attendance', label: 'Attendance', icon: 'check' },
    { to: '/academics/classes', label: 'Classes', icon: 'layers' },
    { to: '/academics/timetable', label: 'Timetable', icon: 'calendar' },
    { to: '/academics/exams', label: 'Exams', icon: 'exam' },
    { to: '/academics/diary', label: 'Diary', icon: 'diary' },
    { to: '/academics/observations', label: 'Observations', icon: 'observe' },
  ] },
  { key: 'finance', name: 'Finance', icon: 'finance', base: '/finance', tabs: [
    { to: '/finance/fees', label: 'Fees', icon: 'receipt' },
    { to: '/finance/transactions', label: 'Transactions', icon: 'list' },
    { to: '/finance/accounts', label: 'Accounts', icon: 'book' },
    { to: '/finance/analytics', label: 'Analytics', icon: 'reports' },
  ] },
  { key: 'engage', name: 'Engage', icon: 'engage', base: '/engage', tabs: [
    { to: '/engage/messages', label: 'Messages', icon: 'send' },
    { to: '/engage/chat', label: 'Chat', icon: 'engage' },
  ] },
  { key: 'website', name: 'Website', icon: 'globe', base: '/website', tabs: [
    { to: '/website/site', label: 'Public site', icon: 'globe' },
    { to: '/website/documents', label: 'Documents', icon: 'doc' },
  ] },
  { key: 'reports', name: 'Reports', icon: 'reports', base: '/reports', tabs: [] },
];

import { reportGroups } from '../data/seed.js';

// Workspaces without sub-pages get in-page jump links in the left rail.
export const GROUP_ICON = { Finance: 'finance', Students: 'people', Attendance: 'check', 'Staff & families': 'briefcase', Academics: 'academics', Management: 'reports' };
export const groupId = (g) => `rg-${g.toLowerCase().replace(/[^a-z]+/g, '-')}`;
export const anchors = {
  today: [
    { id: 'needs', label: 'Needs you today', icon: 'todo' },
    { id: 'fees', label: 'Fee collection', icon: 'cash' },
    { id: 'money', label: 'Income vs expenses', icon: 'wallet' },
    { id: 'attendance', label: 'Attendance', icon: 'check' },
    { id: 'classfees', label: 'Fees by class', icon: 'layers' },
    { id: 'payroll', label: 'Staff payroll', icon: 'briefcase' },
  ],
  reports: reportGroups.map((g) => ({ id: groupId(g.group), label: g.group, icon: GROUP_ICON[g.group] || 'reports' })),
};

// Settings sections — shown in the left rail on desktop.
export const SETTINGS_SECTIONS = [
  ['school', 'School profile', 'home'],
  ['fees', 'Fees & challans', 'receipt'],
  ['idcards', 'ID cards', 'idcard'],
  ['students', 'Students & charges', 'people'],
  ['attendance', 'Attendance', 'check'],
  ['exams', 'Exams & roll slips', 'book'],
  ['sessions', 'Sessions', 'calendar'],
  ['funds', 'Funds', 'fund'],
  ['templates', 'Print templates', 'template'],
  ['team', 'Team & access', 'shield'],
  ['whatsapp', 'WhatsApp AI', 'sparkle'],
  ['activity', 'Activity log', 'history'],
  ['billing', 'Billing & plan', 'wallet'],
  ['support', 'Help & support', 'headset'],
];

export const workspaceFor = (path) => {
  if (path === '/' || path === '') return workspaces[0];
  return workspaces.find((w) => w.base !== '/' && path.startsWith(w.base)) || (path.startsWith('/settings') ? { key: 'settings', name: 'Settings', tabs: [] } : workspaces[0]);
};
