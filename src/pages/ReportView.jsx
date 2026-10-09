import { useParams } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { BackBar } from '../components/Profile.jsx';
import { useSchool, dueOf, code } from '../lib/store.jsx';
import { dateShort, fmt, relative, time } from '../lib/format.js';
import { monthly, reportGroups } from '../data/seed.js';
import NotFound from './NotFound.jsx';
import { exportCsv, printView } from '../lib/exporter.js';

function Table({ head, rows, foot }) {
  return (
    <div className="table-wrap report-wrap"><table className="table report-table">
      <thead><tr>{head.map((h, i) => <th key={h} className={i === head.length - 1 && typeof rows[0]?.[i] === 'number' ? 'num' : ''}>{h}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className={typeof c === 'number' ? 'num' : ''}>{typeof c === 'number' ? fmt(c) : c}</td>)}</tr>)}</tbody>
      {foot && <tfoot><tr>{foot.map((c, j) => <td key={j} className={typeof c === 'number' ? 'num strong' : 'strong'} style={{ borderTop: '2px solid var(--text)' }}>{typeof c === 'number' ? fmt(c) : c}</td>)}</tr></tfoot>}
    </table></div>
  );
}

export default function ReportView() {
  const { id } = useParams();
  const { db, active, classById, familyById, kidsOf, familyDue, defaulters, totalDue, toast } = useSchool();
  const meta = reportGroups.flatMap((g) => g.items.map(([i, t, d]) => ({ id: i, t, d, group: g.group }))).find((r) => r.id === id);
  if (!meta) return <NotFound />;

  let body;
  const maxCol = Math.max(...monthly.map((m) => Math.max(m.collected, m.billed)));
  switch (id) {
    case 'monthly-revenue':
      body = (<>
        <section className="card">
          <div className="row between"><h2 className="h2 sm">2026 · billed vs collected</h2><span className="row gap-12"><span className="legend"><i style={{ background: 'var(--accent)' }} />Collected</span><span className="legend"><i style={{ background: 'var(--hatch)' }} />Billed</span></span></div>
          <div className="bars mt-16" style={{ height: 200 }}>
            {monthly.map((m) => (
              <div key={m.m} className="bar-col">
                <div className="row grow" style={{ width: '100%', gap: 3, alignItems: 'flex-end' }}>
                  <span title={`Collected ${fmt(m.collected)}`} style={{ flex: 1, height: `${Math.max(2, Math.sqrt(m.collected / maxCol) * 100)}%`, borderRadius: 8, background: 'var(--accent)' }} />
                  <span title={`Billed ${fmt(m.billed)}`} style={{ flex: 1, height: `${Math.max(2, Math.sqrt(m.billed / maxCol) * 100)}%`, borderRadius: 8, background: 'var(--hatch)' }} />
                </div>
                <span className="xs muted">{m.m}</span>
              </div>
            ))}
          </div>
          <div className="xs faint mt-8">Square-root scale so smaller months stay visible.</div>
        </section>
        <section className="card pad-s"><Table head={['Month', 'Fees billed', 'Cash collected', 'Balance', 'Paid']} rows={monthly.map((m) => [m.m + ' 2026', m.billed, m.collected, m.balance, `${m.balance ? Math.round((1 - m.balance / m.billed) * 10000) / 100 : 100}%`])} foot={['Total', monthly.reduce((a, m) => a + m.billed, 0), monthly.reduce((a, m) => a + m.collected, 0), monthly.reduce((a, m) => a + m.balance, 0), '90.86%']} /></section>
      </>);
      break;
    case 'defaulters':
    case 'student-arrears':
      body = <section className="card pad-s"><Table head={['Student', 'Class', 'Family', 'Phone', 'Items', 'Due']} rows={defaulters.map((s) => [`${s.name} (${code(s)})`, `${classById[s.classId]?.name} ${s.section}`, familyById[s.familyId]?.name, familyById[s.familyId]?.phone, s.dues.length, dueOf(s)])} foot={['Total', '', '', '', '', totalDue]} /></section>;
      break;
    case 'family-arrears':
    case 'family-balances':
      body = <section className="card pad-s"><Table head={['Family', 'Children', 'Paid to date', 'Credit', 'Due']} rows={db.families.filter((f) => kidsOf(f.id).length).map((f) => [`${f.name} (${f.id})`, kidsOf(f.id).map((k) => k.name).join(', '), f.paidTotal, f.credit, familyDue(f.id)])} /></section>;
      break;
    case 'collection-by-class':
    case 'section-income':
    case 'class-strength':
    case 'enrollment':
      body = <section className="card pad-s"><Table head={['Class', 'Sections', 'Students', 'Boys', 'Girls', 'Monthly billed', 'Fees due']} rows={db.classes.map((c) => { const k = active.filter((s) => s.classId === c.id); return [c.name, c.sections.join(', '), k.length, k.filter((s) => s.gender === 'Male').length, k.filter((s) => s.gender === 'Female').length, k.length * c.fee, k.reduce((a, s) => a + dueOf(s), 0)]; })} foot={['Total', '', active.length, active.filter((s) => s.gender === 'Male').length, active.filter((s) => s.gender === 'Female').length, active.reduce((a, s) => a + (classById[s.classId]?.fee || 0), 0), totalDue]} /></section>;
      break;
    case 'staff-directory':
    case 'staff-pay':
    case 'staff-arrears':
      body = <section className="card pad-s"><Table head={['Name', 'Role', 'Phone', 'CNIC', 'Joined', 'October', 'Pay']} rows={db.staff.map((s) => [`${s.name} (${s.id})`, s.role, s.phone, s.cnic, dateShort(s.joined), db.payroll[s.id] ? 'Paid' : 'Unpaid', s.pay])} /></section>;
      break;
    case 'family-directory':
      body = <section className="card pad-s"><Table head={['Family', 'Phone', 'WhatsApp', 'CNIC', 'Children']} rows={db.families.map((f) => [`${f.name} (${f.id})`, f.phone, f.whatsapp || '—', f.cnic, kidsOf(f.id).length])} /></section>;
      break;
    case 'daily-collection':
    case 'income-expense':
      body = <section className="card pad-s"><Table head={['Date', 'Time', 'From', 'Category', 'Method', 'Amount']} rows={db.ledger.map((l) => [dateShort(l.date), time(l.date), l.ref, l.category, l.method, l.type === 'in' ? l.amount : -l.amount])} foot={['Total', '', '', '', '', db.ledger.reduce((a, l) => a + (l.type === 'in' ? l.amount : -l.amount), 0)]} /></section>;
      break;
    case 'new-admissions':
      body = <section className="card pad-s"><Table head={['Student', 'Class', 'Family', 'Admitted']} rows={active.filter((s) => s.isNew).map((s) => [`${s.name} (${code(s)})`, `${classById[s.classId]?.name} ${s.section}`, familyById[s.familyId]?.name, dateShort(s.admitted)])} /></section>;
      break;
    case 'class-results':
    case 'position-holders':
    case 'subject-heatmap':
      body = <section className="card pad-s"><Table head={['Exam', 'Class', 'Student', 'Total', '%']} rows={db.exams.flatMap((e) => Object.entries(e.results).map(([sid, r]) => { const t = Object.values(r).reduce((a, v) => a + v, 0); const m = e.subjects.reduce((a, [, x]) => a + x, 0); const s = db.students.find((x) => x.id === sid); return [e.name, `${classById[e.classId]?.name} ${e.section}`, s?.name, `${t}/${m}`, `${Math.round((t / m) * 100)}%`]; }))} /></section>;
      break;
    case 'activity-log':
      body = <section className="card">{db.activity.map((a) => <div key={a.id} className="row between" style={{ padding: '12px 0', borderTop: '1px solid var(--line)' }}><span><strong>{a.who}</strong> {a.what}</span><span className="small muted">{relative(a.when)}</span></div>)}</section>;
      break;
    case 'kpi':
      body = (
        <div className="grid g4">
          {[['Students', active.length], ['Collection rate', '96.25%'], ['Fees due', `${fmt(totalDue)} PKR`], ['Staff', db.staff.length], ['Student : teacher', `${Math.round(active.length / db.staff.filter((s) => s.type === 'teacher').length)} : 1`], ['Avg fee / student', `${fmt(active.reduce((a, s) => a + (classById[s.classId]?.fee || 0), 0) / active.length)} PKR`], ['Parent app adoption', `${db.families.filter((f) => f.app).length}/${db.families.length}`], ['Admissions pipeline', db.inquiries.filter((q) => q.stage !== 'enrolled').length]].map(([k, v]) => (
            <section key={k} className="card" style={{ padding: 18 }}><div className="small muted">{k}</div><div className="kpi mt-8">{v}</div></section>
          ))}
        </div>
      );
      break;
    default:
      body = <section className="card"><div className="empty"><span className="ico"><Icon name="reports" /></span><div className="t">No data for this period</div>Try a wider date range or a different class.</div></section>;
  }

  return (
    <div className="page">
      <BackBar to="/reports" label="Reports" />
      <div className="page-head">
        <div><div className="eyebrow">{meta.group}</div><h1 className="h1 sm" style={{ marginTop: 4 }}>{meta.t}</h1><p className="page-sub">{meta.d}</p></div>
        <div className="head-actions">
          <select aria-label="Report period" className="select" style={{ height: 46 }}><option>01 – 09 Oct 2026</option><option>September 2026</option><option>This session</option></select>
          <select aria-label="Class" className="select" style={{ height: 46 }}><option>All classes</option>{db.classes.map((c) => <option key={c.id}>{c.name}</option>)}</select>
          <button className="btn" onClick={() => (exportCsv('Exported to Excel'), toast('Exported to Excel', { icon: 'download' }))}><Icon name="download" size={16} />Excel</button>
          <button className="btn primary" onClick={() => (printView(), toast('PDF ready to print', { icon: 'print' }))}><Icon name="print" size={16} />Print</button>
        </div>
      </div>
      {body}
    </div>
  );
}
