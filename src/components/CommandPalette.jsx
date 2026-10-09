import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon.jsx';
import { Avatar } from './ui.jsx';
import { useSchool, dueOf, code } from '../lib/store.jsx';
import { cx, fmt } from '../lib/format.js';
import { workspaces } from '../lib/nav.js';

export default function CommandPalette({ open, onClose }) {
  const { db, classById, open: openUi, familyDue } = useSchool();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [i, setI] = useState(0);

  useEffect(() => { if (open) { setQ(''); setI(0); } }, [open]);

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    const go = (path) => () => { nav(path); onClose(); };
    const act = (fn) => () => { onClose(); fn(); };
    const actions = [
      { group: 'Actions', icon: 'cash', label: 'Collect fee', hint: 'Finance', run: act(() => openUi('collect', {})) },
      { group: 'Actions', icon: 'check', label: 'Mark today’s attendance', hint: 'Academics', run: go('/academics/attendance') },
      { group: 'Actions', icon: 'userPlus', label: 'Add a student', hint: 'Students', run: go('/students/new') },
      { group: 'Actions', icon: 'send', label: 'Send a message to parents', hint: 'Engage', run: act(() => openUi('compose', {})) },
      { group: 'Actions', icon: 'briefcase', label: 'Pay staff for October', hint: 'Staff', run: go('/staff/payroll') },
      { group: 'Actions', icon: 'receipt', label: 'Generate fee challans', hint: 'Finance', run: go('/finance/fees?challans=1') },
      { group: 'Actions', icon: 'wallet', label: 'Record an expense', hint: 'Finance', run: act(() => openUi('record', { type: 'out' })) },
      { group: 'Actions', icon: 'wallet', label: 'Record income', hint: 'Finance', run: act(() => openUi('record', { type: 'in' })) },
      { group: 'Actions', icon: 'family', label: 'Add a family', hint: 'Students', run: go('/students/families/new') },
      { group: 'Actions', icon: 'briefcase', label: 'Add a staff member', hint: 'Staff', run: go('/staff/new') },
      { group: 'Actions', icon: 'inbox', label: 'New admission inquiry', hint: 'Students', run: go('/students/admissions?new=1') },
      { group: 'Actions', icon: 'diary', label: 'Write a diary entry', hint: 'Academics', run: go('/academics/diary?new=1') },
      { group: 'Actions', icon: 'exam', label: 'Create an exam', hint: 'Academics', run: go('/academics/exams?new=1') },
      { group: 'Actions', icon: 'fine', label: 'Add a fine', hint: 'Finance', run: act(() => openUi('fine', {})) },
      { group: 'Actions', icon: 'moon', label: 'Toggle dark mode', hint: 'Appearance', run: act(() => { const d = document.documentElement; const n = d.dataset.theme === 'dark' ? 'light' : 'dark'; d.dataset.theme = n; try { localStorage.setItem('schooliee-theme', n); } catch (e) { /* ignore */ } }) },
    ];
    const pages = workspaces.flatMap((w) => (w.tabs.length ? w.tabs.map((tb) => ({ group: 'Go to', icon: w.icon, label: `${w.name} → ${tb.label}`, run: go(tb.to) })) : [{ group: 'Go to', icon: w.icon, label: w.name, run: go(w.base) }]))
      .concat([{ group: 'Go to', icon: 'sliders', label: 'Settings', run: go('/settings') }]);
    const students = db.students.map((s) => ({ group: 'Students', av: s, label: s.name, sub: `${code(s)} · ${classById[s.classId]?.name} ${s.section}`, right: dueOf(s) ? `${fmt(dueOf(s))} due` : null, run: go(`/students/${s.id}`), key: `${s.name} ${code(s)}` }));
    const families = db.families.map((f) => ({ group: 'Families', av: f, label: `${f.name} family`, sub: `${f.id} · ${f.phone}`, right: familyDue(f.id) ? `${fmt(familyDue(f.id))} due` : null, run: go(`/students/families/${f.id}`), key: `${f.name} ${f.id} ${f.phone}` }));
    const staff = db.staff.map((s) => ({ group: 'Staff', av: s, label: s.name, sub: `${s.id} · ${s.role}`, run: go(`/staff/${s.id}`), key: `${s.name} ${s.id} ${s.role}` }));
    // Classes and their sections open the class page (a section opens that section's tab).
    const classes = db.classes.flatMap((c) => {
      const n = db.students.filter((st) => st.status === 'active' && st.classId === c.id).length;
      return [
        { group: 'Classes', icon: 'layers', label: c.name, sub: `${c.sections.length} section${c.sections.length > 1 ? 's' : ''} · ${n} students`, run: go(`/academics/classes/${c.id}`), key: `${c.name} ${c.short}` },
        ...(c.sections.length > 1 ? c.sections.map((x) => ({ group: 'Classes', icon: 'layers', label: `${c.name} · ${x}`, sub: 'Section', run: go(`/academics/classes/${c.id}?section=${encodeURIComponent(x)}`), key: `${c.name} ${x} ${c.short}${x}` })) : []),
      ];
    });
    const match = (x) => !t || (x.key || x.label).toLowerCase().includes(t);
    if (!t) return [...actions.slice(0, 6), ...students.slice(0, 4)];
    return [...classes.filter(match), ...students.filter(match), ...families.filter(match), ...staff.filter(match), ...actions.filter(match), ...pages.filter(match)].slice(0, 14);
  }, [q, db, classById, nav, onClose, openUi, familyDue]);

  useEffect(() => { setI(0); }, [q]);
  if (!open) return null;

  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setI((x) => Math.min(results.length - 1, x + 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setI((x) => Math.max(0, x - 1)); }
    if (e.key === 'Enter') { if (results[i]) results[i].run(); else if (q.trim()) { onClose(); openUi('ai', { q }); } }
    if (e.key === 'Escape') onClose();
  };

  let lastGroup = null;
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="modal-wrap" style={{ alignItems: 'start' }}>
        <div className="modal cmdk" role="dialog" aria-label="Search">
          <div className="cmdk-input">
            <Icon name="search" size={20} />
            <input autoFocus placeholder="Search people, pages and actions — or ask AI…" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} />
            <span className="kbd">esc</span>
          </div>
          {q.trim().length > 2 && (
            <button className="cmdk-ai" style={{ border: 0, width: 'calc(100% - 16px)', textAlign: 'left' }} onClick={() => { onClose(); openUi('ai', { q }); }}>
              <Icon name="sparkle" size={18} fill="currentColor" />
              <span><strong>Ask AI:</strong> “{q}”<br /><span style={{ opacity: .8 }}>Get an answer from your school's fees, attendance and staff data.</span></span>
            </button>
          )}
          <div className="cmdk-list">
            {results.map((r, idx) => {
              const head = r.group !== lastGroup ? (lastGroup = r.group) : null;
              return (
                <div key={r.group + r.label + idx}>
                  {head && <div className="menu-label">{head}</div>}
                  <button className={cx('menu-item', idx === i && 'active')} style={{ height: r.sub ? 52 : 42 }} onMouseEnter={() => setI(idx)} onClick={r.run}>
                    {r.av ? <Avatar name={r.av.name} id={r.av.id} size={30} /> : <span className="icon-btn xs plain"><Icon name={r.icon} size={16} /></span>}
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: 'block' }} className="ellipsis">{r.label}</span>
                      {r.sub && <span className="xs muted">{r.sub}</span>}
                    </span>
                    {r.right && <span className="pill danger" style={{ marginLeft: 'auto' }}>{r.right}</span>}
                    {r.hint && <span className="hint">{r.hint}</span>}
                  </button>
                </div>
              );
            })}
            {!results.length && <div className="empty">No matches. Press Enter to ask AI.</div>}
          </div>
          <div className="row gap-12 xs muted" style={{ padding: '10px 18px', borderTop: '1px solid var(--line)' }}>
            <span><span className="kbd">↑</span> <span className="kbd">↓</span> move</span>
            <span><span className="kbd">↵</span> open</span>
            <span style={{ marginLeft: 'auto' }}>Tip: press <span className="kbd">/</span> anywhere</span>
          </div>
        </div>
      </div>
    </>
  );
}
