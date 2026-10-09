# Schooliee — UI redesign (front-end only)

A clickable, fully connected React replica of the whole Schooliee school-management system in the new design from *Schooliee Dashboard Revamp.html*. There's no backend: everything runs on mock data copied from the live demo school, kept in memory and saved to `localStorage` so your clicks survive a refresh. (Account menu → **Reset demo data** restores the original data.)

The thinking behind the new structure and flows is in **[UX.md](UX.md)**.

## Run it

```bash
npm install
npm run dev
```

Then open the URL Vite prints (e.g. http://localhost:5173).

## Deploy to Vercel

```bash
npx vercel
```

`vercel.json` already rewrites every path to `index.html`, so deep links like `/students/S0006` work.

## What's inside

| Workspace | Pages |
|---|---|
| **Today** | To-do list ("Needs you today"), fee gauge, daily collection, income vs payroll, attendance trend, fees by class, defaulters, classes to mark, parent reach |
| **Students** | Students list (saved views, bulk actions, quick view) · student profile (6 tabs) · 3-step add-student wizard · Families + family profile · Admissions pipeline (drag-and-drop, one-click enroll) |
| **Staff** | Staff list · staff profile (loans, salary history) · add staff · Payroll (absence deductions, one-click pay) · Staff attendance |
| **Academics** | Attendance (mark exceptions first, "mark rest present", save & notify) · Classes · Timetable grid with clash detection · Exams + marks entry with grades and positions · Diary · Observations |
| **Finance** | Fees (family/student views, collect panel, challan wizard) · Transactions (cash book) · Accounts (P&L, balance sheet, trial balance, receivables, payables) |
| **Engage** | Messages (composer with audience, templates and WhatsApp preview; automatic messages separated) · Chat inbox with family context |
| **Website** | Public-site builder with live preview · Documents & templates |
| **Reports** | 25 reports, searchable, pin your favourites, printable report views |
| **Settings** | School, fees & challans, bank accounts, ID cards, sessions, funds, templates, team & access, WhatsApp AI, activity log, billing, support |

Everywhere: **⌘K or /** for search and actions, **New ▾** for quick creation, light/dark mode (account menu), and a mobile layout with a bottom tab bar.

## Stack

Vite + React 18 + React Router 6. Plain CSS with design tokens (`src/styles/tokens.css`), using Geist + Outfit from Google Fonts. No UI library.

```
src/
  data/seed.js        mock data mirrored from the live demo
  lib/store.jsx       in-memory store + actions (collect fee, mark attendance, pay staff…)
  lib/nav.js          workspaces and sub-tabs
  components/         shell, drawers, command palette, shared UI
  pages/              one folder per workspace
```

When you wire this to the real Node API, swap the actions in `lib/store.jsx` for API calls. The pages only use `useSchool()`.
