import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { PageHead } from '../components/Shell.jsx';
import { Search } from '../components/ui.jsx';
import { reportGroups } from '../data/seed.js';
import { GROUP_ICON, groupId } from '../lib/nav.js';


export default function Reports() {
  const [q, setQ] = useState('');
  const [pins, setPins] = useState(['monthly-revenue', 'defaulters', 'daily-collection', 'collection-by-class']);
  const all = reportGroups.flatMap((g) => g.items.map(([id, t, d]) => ({ id, t, d, group: g.group })));
  const match = (r) => { const s = q.toLowerCase(); return !s || `${r.t} ${r.d} ${r.group}`.toLowerCase().includes(s); };
  const toggle = (id) => setPins(pins.includes(id) ? pins.filter((p) => p !== id) : [...pins, id]);

  const Card = ({ r, pinned }) => (
    <Link to={`/reports/${r.id}`} className="card" style={{ background: pinned ? 'var(--quiet)' : undefined, borderColor: pinned ? 'transparent' : undefined, padding: 18, borderRadius: 22, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 130 }}>
      <div className="row between top">
        <span className="icon-btn sm" style={{ background: pinned ? 'var(--surface)' : 'var(--surface-2)', borderColor: 'transparent' }}><Icon name={GROUP_ICON[r.group]} size={15} /></span>
        <button className="icon-btn xs plain" aria-label={pinned ? 'Unpin' : 'Pin'} onClick={(e) => { e.preventDefault(); toggle(r.id); }} style={{ color: pins.includes(r.id) ? 'var(--warn)' : 'var(--faint)' }}>
          <Icon name="star" size={14} fill={pins.includes(r.id) ? 'currentColor' : 'none'} />
        </button>
      </div>
      <span className="medium">{r.t}</span>
      <span className="small" style={{ opacity: .7 }}>{r.d}</span>
    </Link>
  );

  const pinned = all.filter((r) => pins.includes(r.id) && match(r));
  return (
    <div className="page">
      <PageHead title="Reports" sub={`${all.length} reports · star the ones you use most`} actions={<Search value={q} onChange={setQ} placeholder="Find a report" lg />} />
      {pinned.length > 0 && (
        <section className="col gap-12">
          <div className="upper">Pinned</div>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>{pinned.map((r) => <Card key={r.id} r={r} pinned />)}</div>
        </section>
      )}
      {reportGroups.map((g) => {
        const items = all.filter((r) => r.group === g.group && match(r));
        if (!items.length) return null;
        return (
          <section key={g.group} id={groupId(g.group)} className="col gap-12">
            <div className="row gap-8"><h2 className="h2">{g.group}</h2><span className="count">{items.length}</span></div>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>{items.map((r) => <Card key={r.id} r={r} />)}</div>
          </section>
        );
      })}
    </div>
  );
}
