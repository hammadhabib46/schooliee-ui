# Schooliee: UX rethink

This is how the redesign rethinks the product. It builds on the improvements in *Schooliee Dashboard Revamp.html* and goes further.

## 1. What's wrong with the live app

| Problem on the live demo | Where it shows |
|---|---|
| **20 flat sidebar links** with no grouping. Every module has the same weight. | Sidebar |
| **Every page opens with 4 decorative gradient stat cards** that aren't clickable and push the real work below the fold. | Students, Staff, Fees, Attendance, Exams, Diary, Inquiries… |
| **Entity-first, not task-first.** To collect a fee you have to know to go to Fees, find the family, click Pay and fill a bare modal. | Fees |
| **Action overload.** The student profile has 11 equal buttons and 12 tabs. | Student detail |
| **Dead ends and empty widgets.** "Nothing needs attention" cards, and an attendance list that never loads. | Overview, Attendance |
| **Duplicated money views.** Fees, Ledger, Accounting and Reports overlap. Fee settings exist in two places. | Finance, Settings |
| **Add Student** starts with a family-picker modal, then one long form with about 20 optional fields shown at once. | Add student |
| **Announcements mixes** manual messages with hundreds of automatic notifications in one table. | Announcements |
| **Inquiries is just a table.** There's no pipeline, and no way to turn an applicant into a student. | Inquiries |
| A date-range picker on almost every page, even where it's not needed. | Everywhere |

## 2. Principles

1. **Task first.** Home is a to-do list for today, not a wall of charts. Every number links to the action that changes it.
2. **8 workspaces, not 20 links.** Today · Students · Staff · Academics · Finance · Engage · Website · Reports, plus Settings. Sub-pages are pill tabs at the top of each workspace.
3. **One list pattern everywhere.** Saved views (as chips, with counts) → filter → search → bulk-action bar → row quick-view panel → full profile. Counts live in the view chips, so the decorative stat cards are gone.
4. **One flow per job, reachable from anywhere.** Collect fee, mark attendance, add student, send message and pay staff can each be opened from the page, from **New ▾**, from **⌘K**, or from the Today inbox, and they always open the same panel.
5. **Progressive disclosure.** Forms show only what's needed. Extras sit under "Add more details". Profiles have at most 3 primary actions, with the rest in a grouped "More" menu.
6. **Undo instead of "are you sure?"** for reversible actions, plus clear toasts.
7. **Consistent status language.** Clear / Due / Overdue, Present / Late / Absent / Leave, each with one colour everywhere.
8. **Works on a phone.** The rail becomes a bottom bar, panels become sheets, and tables become cards.

## 3. Information architecture

```
Today          Overview inbox · key money/attendance pulse
Students       Students · Families · Admissions      (+ profiles, add-student wizard)
Staff          All staff · Payroll · Staff attendance (+ staff profile, add staff)
Academics      Classes · Attendance · Timetable · Exams · Diary · Observations
Finance        Fees · Transactions · Accounts
Engage         Messages · Chat
Website        Site builder · Documents
Reports        25 reports grouped, searchable, pinned favourites
Settings       School · Fees & challans · ID cards · Sessions · Funds · Templates · WhatsApp AI · Activity log
```

- **No generic "People" tab.** A school thinks in **Students & families** (admissions, fees, parents) and **Staff** (payroll, staff attendance, loans, letters), two different jobs often done by different people, so each gets its own workspace.
- **Admissions sits in Students**, because an applicant becomes a student. **Payroll sits in Staff**, because it's an action on staff; the money it moves still shows in Finance → Transactions.

- **Ledger + Accounting become Finance → Transactions** (the cash book, where you record income and expenses) **and Finance → Accounts** (read-only statements: P&L, balance sheet, trial balance, receivables and so on).
- **Inquiries becomes Students → Admissions**, a pipeline (New → Contacted → Visit/Test → Approved → Enrolled). "Enroll" opens Add Student pre-filled.
- **Announcements becomes Messages**, with a composer (audience → channels → preview) and an **Automatic** tab that holds the system notifications separately.
- **Fee settings live only in Settings**, with a link from Fees.

## 4. Key flows

| Flow | New design |
|---|---|
| **Collect fee** | One side panel. Search family → per-child dues with checkboxes → amount pre-filled → method chips (Cash / Bank / JazzCash / Easypaisa) → WhatsApp receipt toggle → Collect → receipt screen (Print / Share / Collect another). |
| **Mark attendance** | Exceptions-first. Each class shows a progress ring, everyone starts unmarked, you tap the few Absent / Late / Leave, then "Mark rest present" → "Save & notify parents of absentees". Staff attendance is a toggle on the same page. |
| **Add student** | 3-step wizard: Student → Family (pick existing; matches by phone/CNIC as you type; or create inline) → Fees & review (class fee auto-filled, discount, admission fee paid now?). Optional fields are collapsed. |
| **Pay staff** | Staff → Payroll: everyone is selected by default, with attendance chips, loan deductions and a running total, then one Pay button. |
| **Send message** | Audience chips (Whole school / Class / Families with dues / Staff) → channels (App, WhatsApp) → templates → live phone preview. |
| **Find anything** | ⌘K command palette: people, pages and actions ("Collect fee from Usman", "Mark Class Two") plus "Ask AI". |
| **Today inbox** | Things to do, ranked: attendance not marked, defaulters to remind, inquiries waiting, results to publish, payroll due. Each has a one-click action. |

## 5. Colour system

Learned from the reference trading dashboard, and applied to both themes.

| Rule | Light | Dark |
|---|---|---|
| **Layered greys.** 4 close steps; depth comes from value, not borders or glow. | page `#EFEFEB` · cards `#FFF` · raised `#F4F4F0` | "Deep ink": page `#0E0F0D` · cards `#161714` with a hairline edge · raised `#1E1F1B` · wells `#0A0B09`; an olive undertone, off-white text `#E6E7E0` |
| **One focal block per screen.** The single most important number gets the accent as its surface, with the opposite colour inside it. | black block with lime inside | deep-olive block with lime figures (tinted, never a neon slab) |
| **Accent tint for secondary data.** Regular bars, "present" days, progress fills and badges use lime at low opacity (`--accent-dim`, `--accent-soft`); full lime only marks the highlight (peak, today, the focal block). | olive | olive |
| **Selection and primary actions are neutral.** Active tabs, chips, toggles and main buttons are an ink pill (light) or white pill (dark). Never lime. | ink pill | white pill |
| **Other semantics are quiet.** Red, amber and blue appear as text or a thin outline, not as filled blocks. | soft fill | outline only |
| **Numbers are big, light weight and neutral; labels are small and grey.** Colour on a number only when it's the focal block. | | |

Focal blocks right now: Today → Fee collection · Fees → Collection rate · Student → Balance · Family → Family balance · Transactions → Balance.

## 6. Visual hierarchy: one thing to look at

- **One solid black element per screen: the page's main action** (Add staff, Generate challans, Collect, Save). It's ink in light mode and a white pill in dark mode.
- **One lime pill per screen: the active sidebar item** (and the active tab on the mobile bottom bar). It answers "where am I" and is the only lime UI control.
- **All other selection is quiet.** Active sub-tabs, filter chips, segmented controls and selected list items use a soft grey (`--quiet`), never a solid fill.
- **Repeated row actions are outlined**, e.g. Collect on each fee row, Mark now and Review on to-dos, Enroll on admission cards. A list of ten black buttons is ten focal points.
- **The global "New" button is neutral**, because the page's own primary action matters more on that page.
- **One focal colour block per screen**, as in the colour system: everything else is a plain card.

## 7. Detail pages: bento layout (student & family)

Patterns taken from the trading reference:

- **Header:** a big name, a meta line, a **row of round icon-only tool buttons** with hover labels (edit, family, section, promote, discount, fine, document, certificate, print, WhatsApp, terminate in red), plus **one primary pill** (Collect). No "More actions" dropdown for everyday actions.
- **Three-column bento:**
  - **Left (act):** Quick collect (pay inline: amount, method, WhatsApp receipt On/Off, outlined "Collect full" or "This month only"), Outstanding, Paid to date with monthly bars. On the family page: Quick collect and Notes.
  - **Top strip (focus):** the lime stats strip, with a dark identity segment on the left, big numbers, and proportional black pill bars underneath.
  - **Insight card:** a dismissible card with a close circle for the one thing that needs attention (WhatsApp not verified, missing details).
  - **Main panel:** a pill-group toolbar (Fees · Attendance · Academics · Documents · Activity) with context controls on the right.
  - **Right (context):** Family, Siblings as stacked cards, Profile, Coming up. On the family page: Guardians, Contact, WhatsApp AI.
- **Every widget header is the same:** an icon circle, then the title, then a count, then one action circle.
