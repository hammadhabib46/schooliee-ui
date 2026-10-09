import { useEffect, useMemo, useState } from 'react';
import { Avatar, Drawer, Search } from './ui.jsx';
import QuickPayPanel from './QuickPayPanel.jsx';
import { useSchool, code } from '../lib/store.jsx';
import { fmt } from '../lib/format.js';

// "Pay" anywhere → Quick pay side panel (amount, method, receipt), settling the
// oldest charges first. With no family yet, a picker comes first.
// Clicking a family's name elsewhere opens the full fee page instead.
export default function CollectDrawer({ state, onClose }) {
  const { db, kidsOf, familyDue } = useSchool();
  const [q, setQ] = useState('');
  const [target, setTarget] = useState(null); // { familyId, studentId? }

  useEffect(() => {
    if (!state) { setTarget(null); return; }
    setQ('');
    const fid = state.familyId || db.students.find((s) => s.id === state.studentId)?.familyId;
    setTarget(fid ? { familyId: fid, studentId: state.studentId } : null);
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  const families = useMemo(() => {
    const t = q.trim().toLowerCase();
    return db.families
      .map((f) => ({ ...f, due: familyDue(f.id), kids: kidsOf(f.id) }))
      .filter((f) => f.kids.length)
      .filter((f) => !t || f.name.toLowerCase().includes(t) || f.id.toLowerCase().includes(t) || f.phone.includes(t) || f.kids.some((k) => k.name.toLowerCase().includes(t) || code(k).toLowerCase().includes(t)))
      .sort((a, b) => b.due - a.due);
  }, [q, db.families, familyDue, kidsOf]);

  if (!state) return null;
  if (target) return <QuickPay familyId={target.familyId} studentId={target.studentId} onClose={onClose} />;
  return (
    <Drawer open onClose={onClose} title="Collect fee" sub="Pick the family">
      <Search value={q} onChange={setQ} placeholder="Family, student, ID or phone" lg autoFocus />
      <div className="col gap-6">
        {families.map((f) => (
          <button key={f.id} className="stack-card" style={{ marginTop: 0, cursor: 'pointer' }} onClick={() => setTarget({ familyId: f.id })}>
            <Avatar name={f.name} id={f.id} size={40} />
            <span className="grow" style={{ minWidth: 0 }}>
              <span className="medium" style={{ display: 'block' }}>{f.name} <span className="xs muted">· {f.id}</span></span>
              <span className="xs muted ellipsis" style={{ display: 'block' }}>{f.kids.map((k) => `${k.name} (${code(k)})`).join(', ')}</span>
            </span>
            <span className={`pill ${f.due ? 'danger' : 'ok'}`}>{f.due ? `${fmt(f.due)} due` : 'Clear'}</span>
          </button>
        ))}
        {!families.length && <div className="small muted" style={{ padding: 16 }}>No family matches “{q}”.</div>}
      </div>
    </Drawer>
  );
}

// Quick pay in a right-hand drawer, for pages without their own side panel.
function QuickPay({ familyId, studentId, onClose }) {
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-label="Collect payment">
        <div className="drawer-body" style={{ paddingTop: 22 }}>
          <QuickPayPanel key={`${familyId}-${studentId || ''}`} bare familyId={familyId} studentId={studentId} onClose={onClose} />
        </div>
      </aside>
    </>
  );
}
