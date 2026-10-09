# Schooliee: feature map (live demo → redesign)

Every feature found on the live demo (schooliee.com/school/demo), and where it lives in the redesign. Use it as the wiring checklist when connecting the real database: each store action in `src/lib/store.jsx` maps to one API call.

Legend: ✅ built in the redesign · ➕ new in the redesign (not in the live app)

## Students & families

| Live feature | Redesign |
|---|---|
| Student list: name/ID, family, class, section, status · class filter · status filter · search · row menu (Edit, Terminate) | ✅ Students: saved-view chips, class filter, search, bulk bar ➕, quick-view panel ➕ |
| Admission form: print N blank copies (1/5/10/20/50, max 100) | ✅ Students → Add ▾ → Print blank admission forms |
| ID cards: template, portrait/landscape, ZIP of front/back PNGs | ✅ Students → Print ▾ → ID cards dialog |
| Bulk upload CSV: families and students, sample downloads | ✅ Students → Add ▾ → Bulk upload dialog |
| Student settings: custom profile field keys, custom charge presets | ✅ Settings → Students |
| Add student: pick family → form (name, roll, class, section, DOB, religion, gender, fee starts from, B-Form, guardian, previous school/class/result, reference, note, admission fee, pending dues, custom charges paid/unpaid, discount type + amount, documents, custom fields) | ✅ 3-step wizard (student → family → fees & review), family matched by phone ➕ |
| Student detail: 12 tabs (info, fee timeline, custom charges, transactions, fines, recurring, attendance, timetable, exams, observations, activities, documents) · 11 actions | ✅ Bento detail page, icon tool row, Quick collect ➕, running-balance statement ➕ |
| Edit student (fee-starts-from locked once payments exist) | ✅ Edit modal with lock |
| Change family · change section · promote (class, section, promotion fee) · terminate · fine · recurring payment (name, amount, day 1–28, end date) · upload document · achievement (purpose, description, date, 2 signatories) · character certificate (prefilled, placeholders) · letter pad · observation | ✅ all as dialogs |
| Families list: phone, WhatsApp, CNIC, students · WhatsApp and app-status filters | ✅ Families |
| Add family: guardian, email, CNIC, phone, occupation, caste, mother name/CNIC/occupation, WhatsApp + verified, address, note, CNIC front/back | ✅ Add family |
| Family detail: verified/app badges, students with discount, paid/due, current balance (hide, add balance with reason + document), WhatsApp AI link, notes (active/archived), transactions, fee history by month, activities | ✅ Bento family page, Quick collect ➕ |
| Inquiries: list, type filter, statuses; add inquiry (type, name, gender, phone, email, contact method, DOB, B-Form, guardian, previous school, class, section, note) | ✅ Admissions pipeline (board + list) |
| Inquiry detail: full applicant, Approve / Decline / Edit, discussion comments | ✅ Inquiry drawer with comments, Approve → enroll pre-filled |

## Staff

| Live feature | Redesign |
|---|---|
| Staff list: tabs All/Teachers/Other, status, CNIC, phone, pay, role · ID cards ZIP · salary slips (whole school) · export CSV/PDF | ✅ Staff |
| Add/edit staff: photo, name, father, email, phone, pay, CNIC, start pay from, joining date, WhatsApp, role, subject, status, note, documents, address | ✅ Add staff |
| Staff detail: salary slip, experience letter (letter pad), ID card, edit, terminate · loan balance (issue: amount, reason, attachment; repay) · info · tabs: transactions, salary history (monthly, total paid, pending/paid, partial months), attendance (+remarks), timetable, documents, activities | ✅ Bento staff page |
| Pay staff: month, attendance chips, payment, reason, loan, show paid, payment date, method, note | ✅ Payroll |
| Staff attendance: mark holiday, all present/absent, per-row P/L/A/Leave, remarks | ✅ Staff attendance |

## Academics

| Live feature | Redesign |
|---|---|
| Classes list: sections, students · row menu Edit · add class (name, fee, sections — no class teacher) · reorganize order · export | ✅ Classes: list view (default) or cards, filters (dues, attendance pending, empty), sort, per-section counts, today's attendance and dues per class |
| Class detail: fee, created, latest session, created by, section cards; section page = student table (name, father, CNIC, DOB) + Edit section (rename); merge sections, manage sections, change fee (**retroactive** vs **new version from date**), edit class, fee timeline | ✅ Class page `/academics/classes/:id`: section tabs (rename), student list or cards with search, filters, sortable columns, bulk move section / promote / message parents / export, fee timeline |
| Attendance: date, class/section/status filters, per-row P/L/A/Leave, **Check in now** (time), remarks, mark holiday / all present / all absent, QR scan, attendance sheet PDF (weekly), export, leave requests | ✅ Attendance |
| Attendance settings: school start/end, late threshold (QR check-ins after it become Late) | ✅ Settings → Attendance |
| Exams list: class/section/subject/tag filters, date range · row menu (mark sheet, duplicate, edit, delete) | ✅ Exams |
| Create exam **in bulk** (many classes + sections at once), subjects, tags | ✅ Create exam |
| Exam detail: info, subject totals + schedule (date/time), **grading scheme** (A+ ≥90 … D ≥33, F), marks entry with pass/fail + rank, results summary (appeared, average, highest, lowest, passed, failed, grade distribution, subject performance, top performers), send exam details, export | ✅ Exam detail |
| Exam settings: roll-number slip instructions | ✅ Settings → Exams |
| Diary: class + sections, title, date, image, rich text, publish | ✅ Diary |
| Timetable: month/week calendar, filters (class, section, teacher, dates, times), new slot (subject, teacher, class, section, date range, period/custom time, room, group, co-teachers, repeat days) | ✅ Timetable |
| Period grid by day using the active timing set; breaks | ✅ Timetable → Period grid |
| Timetable reports: planned, done, cancelled, covered, needing cover per teacher | ✅ Timetable → Reports |
| Timetable settings: working days, week start, time zone, flag cover when a teacher is absent, rotating day cycle, pauses (exams/events), multiple timing sets (Friday, Ramadan…), rooms | ✅ Timetable → Settings |
| Observations list · add (class/section/student, date, staff or custom reviewer, questions) · **question bank** (order, Yes/No, rating 1–5, free text, active/inactive) | ✅ Observations + Questions tab |

## Finance

| Live feature | Redesign |
|---|---|
| Fees: family/student views, status tabs, class filter, search, per-family Pay, print challan, reminder, expand children | ✅ Fees + Quick collect / collect drawer |
| Generate challans wizard (scope → fee range → selection → confirm → download) | ✅ Challan wizard |
| Get challan by ID | ✅ Fees → Get challan |
| Bulk reminders wizard (range: current or +1…6 months / 1 year; families: all/unpaid/partial; platforms & preview; confirm) | ✅ Reminder wizard |
| Fee settings: collection day, challan style, late fee type/amount, per-student late fee, expiry days, note, online prefix, school copy, track admission fees, bank accounts | ✅ Settings → Fees & challans |
| Ledger: balance, income/expenses, profit chart, filters (user, category, payment), smart options, record income/expense (amount, category, description, date, file), **mark as problematic** | ✅ Transactions |
| Accounting: overview, chart of accounts (codes), **journal** (balanced entries), general ledger, trial balance, income statement, balance sheet, cash & bank book, receivables, liabilities, **data checks** | ✅ Accounts (all tabs) |
| Funds: name, classes, amount per class | ✅ Settings → Funds |
| Reports: 25 reports in 6 groups | ✅ Reports |

## Engage & website

| Live feature | Redesign |
|---|---|
| Announcements: list, types, platform delivery counts · send (title, description, class, channels: app always, WhatsApp, SMS, email, publish to site) | ✅ Messages + composer |
| Alert automation: 11 events × WhatsApp / SMS / Email | ✅ Messages → Automatic matrix |
| Chat with families | ✅ Chat |
| Site content: subdomain, hero, timings, feature cards, gallery, reports lookup, map & contact | ✅ Public site builder with preview ➕ |
| Documents: all / by class / by entity, category filter, letter pad (title + rich text) | ✅ Documents |

## Platform

| Live feature | Redesign |
|---|---|
| Employees (login users): link to staff, role, status, **section access restrictions**, **permission matrix** (21 modules × actions) | ✅ Settings → Team & access |
| Activity log: totals, role filter, date range, export | ✅ Settings → Activity log |
| Sessions, template library, school info, ID card settings, WhatsApp AI | ✅ Settings |
| To-dos: tasks, assignee, reminder, My tasks / Delegated, pending / completed | ✅ To-dos drawer |
| AI chat: threads, WhatsApp tab, new chat | ✅ AI drawer (⌘K → Ask AI) |
| Global search ⌘K, notifications, support, site link | ✅ |

## Permission matrix (from Settings → Employees)

Students: view, create, update, terminate, export · Staff: view, view pay, pay, create, update, export · Classes: view, create, update, promote, export · Attendance: view, print, mark, edit, mark staff, export, scan QR · Fees: view, collect, stats, send reminders, export, manage recurring, manage challans · Ledger: view, create income, create expense, mark problem, export · Accounting: view, export · Exams: view, create, update, export · Reports: view, export · Diary: view, create, update, export · Timetable: view, create, update · Chat: view, create, send · Announcements: view, create, export · Inquiries: view, create, update, approve, decline, comment, export · Observations: view, create, update, export · Site content: view, update · Documents: view, create, update, delete · School info: view, update, manage questions · Employees: view, create, update, export · Activity logs: view, export · Sessions: view, create, update, export · Funds: view, create, export · AI: view. Every module also has "Full control".

## Checked against the live demo (9 Oct 2026)

Every main page was re-read on the live demo and compared with the redesign: Students, Fees, Ledger → Transactions, Staff, Pay staff → Payroll, Attendance, Exams, Classes, Inquiries → Admissions, Diary, Observations, Announcements → Messages, Documents, Timetable (calendar, reports, settings), Accounting, Site content, Chat, Reports, and Settings (school info, employees, funds, sessions, activity log). Gaps found and closed in that pass: payroll loan/reason/note columns, exam section/subject/date filters, diary export/edit/delete, inquiry type filter and export, announcement platform filter and export, employee and fund totals and export, per-class sessions, ID-card colour, monthly income/expense chart, ledger "System" tab, timetable time filters, report columns and settings editors, activity log totals and table.

Needs the backend (UI and flows are done; the store action is the hook): sending WhatsApp/SMS/email and live delivery counts, AI answers (currently computed from demo data), uploads to storage.

## Run end to end on the live demo with test records (9 Oct 2026)

Flows actually submitted on live with clearly-labelled test data (ZZ Test Family F0008, ZZ Test Student S0010, ZZ Test Teacher T0029), and what the redesign now does to match:

| Flow | Live behaviour | Redesign |
|---|---|---|
| Add family | Guardian, phone, CNIC and **email required**; then jumps to Add student with the family picked | Same required fields; "Save & add a child" |
| Add student | Full month billed (no part month); admission fee with "Already paid" tick; discount None/Amount/Percentage | Same |
| Promote | Class, section, promotion fee — the fee is **received on the spot** (income "Promotion"), not added to dues | Fixed to match (was adding a due) |
| Add fine | Amount + optional reason | Same, plus reason presets |
| Collect on fee page | Per-line pay amounts; admission fee can't be part-paid; additional discount per line; opens an **invoice** numbered by date-time (e.g. 20261009083858) showing "3000 / 7,000" for part payments | Same, invoice shown after collecting |
| Terminate student / staff | Confirmation + termination date only; dues stay; student gets **Leaving certificate** and **Activate** | Same (removed reason/note fields) |
| Pay staff | Per-staff payment + reason; a part payment marks the month paid ("20,000 / 26,000") | Same fields; redesign can also pay the rest later — needs the DB to accept a second payment for the month |
| Export | CSV or PDF | CSV or PDF |

Live talks to its server through tRPC endpoints (e.g. `staff.create`), which is where the redesign's store actions should connect.
| Timetable lesson | Held/done + notes; teacher unavailable (this class / all classes until a date) → "needs a substitute" banner → ranked substitute picker; move (date, teacher, time, note); cancel (reason) → **Restore class**; edit slot; delete slot | Same |
| Record expense | Amount, free-text category (suggests past ones), description, date, file; method defaults to Cash | Same, category is free text with suggestions |
| Mark as problematic | Confirm + optional reason; hides the entry everywhere and reverses credit it used | Same; restorable from the Flagged view |
| Inquiries | Types: Student Admission / Teacher Hiring / Staff Hiring. Contact: Not specified / Physical visit / Phone call / WhatsApp. **Approve & Admit** creates the student at once with admission fee, student fund and security fee | Same (redesign also reuses an existing family with the same phone; live creates a new one) |
| Add fund | Name + at least one class with an amount; students in those classes are billed | Same rule |

Test records added on live in this pass: ZZ Test lesson (cancelled), ZZ test expense (marked problematic), inquiry A0008 → student ZZ Test Applicant S0011 / family F0009 (terminated), ZZ Test Fund (Class Six, no students).

New in the redesign (not on live): Finance → Analytics (fee charts) and the one-month whole-school report (PDF/CSV); quick-view side panels on Students and Families.

### Parent-messaging flows, run on live against a test-only class (Class Six, one test student)

| Flow | Live behaviour | Redesign |
|---|---|---|
| Diary | One class, several sections, optional title, date, image, rich text; posting sends an automatic "Diary entry" message | Same, plus posting to several classes at once; automatic message per section |
| Exam | Bulk create (classes × sections, subjects with start/end time); total marks per subject; marks entry with Save all / Discard; grade, pass/fail and rank; entering marks sends "Exam result updated" | Same; redesign won't accept marks before a total is set |
| Observation | Class/section filter → student, date, staff or custom reviewer, question bank answers, additional notes; sends "New observation" | Same (filter and notes added this round) |
| Announcement | Title, description, class; app always + Email / WhatsApp / SMS / publish to site; **Review & Send** shows reach (families, with app, email, verified WhatsApp, phone) then Send Now — run on live | Same, with the reach breakdown before sending |
| Automatic messages | Promotion, status change, profile update, fee payment, challan, admission and the above all create announcements; WhatsApp shows **skipped** for families without a usable number | Same events, gated by Messages → Automations; "skipped" instead of "failed" |
| Attendance marking | Live attendance page throws React error #418 (hydration mismatch) on load and never requests the student list, so marking cannot be done on live right now | Redesign's marking flow works; worth fixing on live |

Test-only records from this round: ZZ test diary (Class Six A), ZZ Test exam (Class Six A, result 78/100), one observation for ZZ Test Student; the student is terminated again.

## Full system test (redesign, 9 Oct 2026)

- **Every route** (79, incl. detail pages, all reports and settings sections, site and sign-up) loaded at 1280px and 375px: no blank pages, no console errors. Fixed in this pass: hidden hover labels widening three pages; ID-cards settings form squeezed on phones; settings chip strip scrolling the page sideways; rail not highlighting the parent page on detail routes.
- **Flows clicked through:** quick fee payment (top bar → family → collect → receipt); Fees → Pay (side panel, amount pre-filled); command search actions; compose → review → send; attendance mark-rest-present → save; payroll pay run; class page move section and promote; exam marks → publish; record expense; inquiry → approve & admit; add staff; add family → add child; add-student 3-step wizard; diary post; chat send; timetable new slot; student promote; team member invite; site publish; challan generation; analytics monthly report.

## UX pass (9 Oct 2026) — interface only, no data or API changes

- Accounts: "Cash & bank" shows its make-up (opening + this period); Transactions' hero is "Net cash flow" (it was labelled "Balance").
- Fee page keeps the checkout beside the lines down to 960px. Admissions board columns fit and snap; names wrap; phones open the list.
- Attendance: opens on the next class to mark; one compact line per student (P/L/A/Lv); class dropdown on phones; save bar pinned; bulk marks undoable; save button says what's missing.
- Student profile: two columns down to 960px; one main action (Collect / Edit / Activate) + Message + grouped More menu instead of 13 buttons.
- Exams created for several sections show as one expandable row with combined progress.
- Settings sections live in the left rail. Students, Families, Staff, Transactions have sortable columns and "Showing X of Y".
- Timetable "+" only on hover. Section moves on a class page are undoable. Browser tabs are named after the page.
- Second pass (phones): payroll rows show net under the name; Admissions list becomes cards; chat is list → conversation with a back button; class pages use student cards; timetable shows a one-day agenda with day chips; report tables scroll sideways instead of squeezing; staff attendance bulk marks are undoable; long amounts on Accounts no longer wrap. Re-swept every page at 1280px and 375px: no errors, no blank pages, no overflow.
- Readability check (automated, both themes, every page plus quick pay / compose / add class / search / to-dos / AI): flagged text below 3:1 contrast. Fixed: disabled buttons (now readable — they can carry messages), dark-mode "Fees by class" bar labels, marketing video cards (quote text was dark on dark), mock-chat timestamps. Re-run: no flags left.
- Layout & interaction check (automated, every page at 1280px and 375px): no overlapping text (only the intentional pinned action bars on phone attendance and the fee page), every button named, every field labelled. Fixed in this pass: 22 dropdowns given spoken names; decorative round icons no longer pose as buttons; class page subtitle spacing; clickable table rows reachable with Tab and opened with Enter. Measured the active navigation pills: 12.8:1 (light) and 13.6:1 (dark) contrast.

## System concept — who does what, and where (verified 9 Oct 2026)

**Shape of the app.** Top capsule = the eight areas (Today, Students, Staff, Academics, Finance, Engage, Website, Reports). Left rail = the pages inside the current area (or jump links on Today/Reports, or Settings sections). Search (⌘K or /) finds any student, family, staff member, class or section and runs every common action. Today's "Needs you today" is the single place for pending work; everything else on Today is status.

**Words used everywhere.** *Due* = money a family still has to pay (*owes* only when talking about a person). *Pay* on a fee row opens quick payment; inside it the action is *Collect*. *Pay staff* = payroll. A student or staff member who leaves is *Terminated*; bringing them back is *Activate*. *Inquiry* for admissions.

**Safety.** Nothing destructive happens silently: terminating, merging sections, changing fees and promoting go through a confirmation; deleting a diary entry, exam or task, bulk attendance marks, staff attendance marks and moving students between sections can be undone from the toast.

| Role | Most common task | Path | Steps |
|---|---|---|---|
| Front desk | Take a fee payment | Top bar ₨ icon → pick family → Collect | 3 |
| Front desk | Find a family by phone | ⌘K → type digits → Enter | 2 |
| Front desk | Admit from an inquiry | Today → Review → card → Approve & admit | 4 |
| Teacher | Mark today's attendance | Academics (opens the next class to mark) → exceptions → Mark rest present → Save | 3 + exceptions |
| Accountant | Record an expense | ⌘K "expense" → amount, category → Save | 3 |
| Accountant | Month report for the owner | Finance → Analytics → Monthly report → Export as PDF | 4 |
| Owner | Know today's money | Today (fee collection, income vs expenses) | 0 |
| Owner | Remind everyone who owes | Today → Remind all → Review & send → Send | 3 |
| Admin | Pay salaries | Today → Pay staff (or Staff → Payroll) → Pay N staff | 2 |
| Admin | Open a class / section | ⌘K "class two" → Enter (section tabs inside) | 2 |
- Forms explain themselves: clicking a greyed-out main button (Add staff, Add family, Add student, Add class, Record expense, Add inquiry, Create exam, Add employee…) outlines the empty required fields in red, names them in a toast ("Still needed: Full name, Phone…") and puts the cursor in the first one. Optional fields are never flagged. Final sweep after this change: every page at 1280px and 375px — no errors, no blank pages, no overflow.
- Scale test (local only, then restored): 451 students / 189 families, 40 per class, long Pakistani names. Every main page loaded in 180–360 ms at 1280px and 375px with no errors or overflow. Fixed for big schools: badges cap at "99+"; Students and Families show 50 at a time and Fees 40 families at a time, each with "Show more" and "Showing X of Y" (reports stay complete for printing); outdated copies of the demo data are removed from the browser on load.
- Staff attendance lives inside Academics → Attendance (Students | Staff switch, /academics/attendance/staff); removed from the Staff section; the old /staff/attendance address redirects.
- Sign-up preview: the phone plays a tour of the parent app branded with the school being built — home, paying the fee (PAID + receipt alert), absence alert on the attendance calendar, today's diary, result card, chat with the class teacher — with a moving tap, a caption per screen and dots to jump; only screens for features the school switched on; pauses on hover.

- Sign-up tour screens filled with realistic data: kid switcher, fee bill with discount and payment history, monthly attendance calendar, diary day strip with teachers and attachment, full result card with position and remarks, teacher chat; app-style bottom tab bar on every screen.
