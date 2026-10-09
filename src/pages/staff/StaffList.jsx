import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import { PageHead } from '../../components/Shell.jsx';
import { Circle } from '../../components/Bento.jsx';
import { BatchPrintModal } from '../../components/ListDialogs.jsx';
import { Avatar, Chips, Empty, ListCount, Menu, Search, SubNav, useSort } from '../../components/ui.jsx';
import { useSchool } from '../../lib/store.jsx';
import { fmt } from '../../lib/format.js';
import { workspaces } from '../../lib/nav.js';
import { exportCsv, printView } from '../../lib/exporter.js';

export function StaffTabs() {
  const { db, staffUnpaid } = useSchool();
  const ws = workspaces.find((w) => w.key === 'staff');
  return <SubNav tabs={ws.tabs} counts={{ '/staff': db.staff.length, '/staff/payroll': staffUnpaid.length || undefined }} />;
}

export default function StaffList() {
  const { db, toast } = useSchool();
  const nav = useNavigate();
  const [view, setView] = useState('all');
  const [q, setQ] = useState('');
  const [dialog, setDialog] = useState(null);
  const rows = db.staff
    .filter((s) => (view === 'teacher' ? s.type === 'teacher' : view === 'other' ? s.type !== 'teacher' : view === 'inactive' ? s.status !== 'active' : s.status === 'active'))
    .filter((s) => { const t = q.trim().toLowerCase(); return !t || s.name.toLowerCase().includes(t) || s.id.toLowerCase().includes(t) || s.phone.includes(t) || s.father.toLowerCase().includes(t); });
  const { sorted, th } = useSort(rows, { name: (s) => s.name.toLowerCase(), role: (s) => s.role, pay: (s) => -s.pay }, 'name');
  const monthly = db.staff.filter((s) => s.status === 'active').reduce((a, s) => a + s.pay, 0);

  return (
    <div className="page">
      <StaffTabs />
      {dialog && <BatchPrintModal kind={dialog} onClose={() => setDialog(null)} />}
      <PageHead
        title="Staff"
        sub={`${db.staff.length} active · ${db.staff.filter((s) => s.type === 'teacher').length} teachers · ${fmt(monthly)} PKR monthly payroll`}
        actions={<>
          <div className="toolrow">
            <Circle icon="idcard" label="ID cards (ZIP)" onClick={() => setDialog('staffIds')} />
            <Menu trigger={({ toggle }) => <Circle icon="download" label="Export" onClick={toggle} />}
              groups={[{ label: 'Export staff', items: [{ label: 'Excel (CSV)', icon: 'sheet', onClick: () => (exportCsv('Staff exported as CSV'), toast('Staff exported as CSV', { icon: 'download' })) }, { label: 'PDF', icon: 'doc', onClick: () => (exportCsv('Staff exported as PDF'), toast('Staff exported as PDF', { icon: 'download' })) }, { label: 'Staff directory report', icon: 'list', onClick: () => nav('/reports/staff-directory') }] }]} />
          </div>
          <button className="btn primary" onClick={() => nav('/staff/new')}><Icon name="plus" size={16} stroke={2} />Add staff</button>
        </>}
      />
      <section className="card pad-s" style={{ borderRadius: 28 }}>
        <div className="toolbar">
          <Chips value={view} onChange={setView} items={[
            { key: 'all', label: 'All', count: db.staff.filter((s) => s.status === 'active').length },
            { key: 'teacher', label: 'Teachers', count: db.staff.filter((s) => s.type === 'teacher').length },
            { key: 'other', label: 'Other staff', count: db.staff.filter((s) => s.type !== 'teacher').length },
            { key: 'inactive', label: 'Terminated', count: db.staff.filter((s) => s.status !== 'active').length },
          ]} />
          <div className="grow" />
          <Search value={q} onChange={setQ} placeholder="Name, ID, father name or phone" />
        </div>
        {rows.length ? (<>
          <div className="table-wrap"><table className="table resp" style={{ minWidth: 820 }}>
            <thead><tr>{th('name', 'Name')}{th('role', 'Role', 'hide-sm')}<th className="hide-sm">Phone</th><th className="hide-sm">This month</th>{th('pay', 'Pay', 'hide-sm')}<th>October</th><th style={{ width: 40 }} /></tr></thead>
            <tbody>{sorted.map((s) => (
              <tr key={s.id} className="click" onClick={() => nav(`/staff/${s.id}`)}>
                <td><span className="person"><Avatar name={s.name} id={s.id} /><span><span className="nm">{s.name}</span><span className="id">{s.id}</span></span></span></td>
                <td className="hide-sm">{s.role}<div className="xs muted mt-4">{s.subject}</div></td>
                <td className="hide-sm">{s.phone}</td>
                <td className="hide-sm"><span className="row gap-4">{s.att.P > 0 && <span className="pill ok">{s.att.P}P</span>}{s.att.L > 0 && <span className="pill warn">{s.att.L}L</span>}{s.att.A > 0 && <span className="pill danger">{s.att.A}A</span>}</span></td>
                <td className="medium hide-sm">{fmt(s.pay)} PKR</td>
                <td>{db.payroll[s.id] ? <span className="pill ok">Paid</span> : <span className="pill warn">Unpaid</span>}</td>
                <td><Link to={`/staff/${s.id}`} className="icon-btn sm" onClick={(e) => e.stopPropagation()} aria-label={`Open ${s.name}`}><Icon name="chevRight" size={14} stroke={2} /></Link></td>
              </tr>
            ))}</tbody>
          </table></div>
          <ListCount shown={rows.length} total={db.staff.length} what="staff" />
        </>) : <Empty icon="briefcase" title="No staff here" />}
      </section>
    </div>
  );
}
