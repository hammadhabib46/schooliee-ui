import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import Icon from './Icon.jsx';
import { Menu } from './ui.jsx';
import { SETTINGS_SECTIONS, anchors, workspaces } from '../lib/nav.js';
import { useSchool } from '../lib/store.jsx';
import { cx } from '../lib/format.js';
import CommandPalette from './CommandPalette.jsx';
import CollectDrawer from './CollectDrawer.jsx';
import { TodosDrawer, NotificationsDrawer, AiDrawer } from './Drawers.jsx';
import Toasts from './Toasts.jsx';
import ComposeDrawer from './ComposeDrawer.jsx';
import { FineModal, RecordModal } from './QuickModals.jsx';

export function useTheme() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'light');
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('schooliee-theme', theme); } catch (e) { /* storage unavailable */ }
  }, [theme]);
  return [theme, setTheme];
}

function useBadges() {
  const { db, unmarkedSections, familiesWithDue, staffUnpaid } = useSchool();
  const newInq = db.inquiries.filter((q) => q.stage === 'new').length;
  const unread = db.chats.reduce((a, c) => a + c.unread, 0);
  const drafts = db.exams.filter((e) => !e.published).length;
  // Workspace badges (top capsule) and page badges (left rail) — things that need attention.
  return {
    ws: { students: newInq || '', staff: staffUnpaid.length || '', academics: unmarkedSections.length || '', finance: familiesWithDue.length || '', engage: unread || '' },
    page: {
      '/students/admissions': newInq, '/staff/payroll': staffUnpaid.length, '/academics/attendance': unmarkedSections.length,
      '/academics/exams': drafts, '/finance/fees': familiesWithDue.length, '/engage/chat': unread,
    },
  };
}

const isOn = (w, pathname) => (w.base === '/' ? pathname === '/' : pathname.startsWith(w.base));

// Top centre: every workspace in one black capsule; the current one is the lime pill.
function WorkspaceCapsule() {
  const { pathname } = useLocation();
  const { ws } = useBadges();
  return (
    <LayoutGroup id="capsule">
      <nav className="capsule" aria-label="Workspaces">
        {workspaces.map((w) => {
          const on = isOn(w, pathname);
          return (
            <Link key={w.key} to={w.tabs[0]?.to || w.base} className={cx('cap-item', on && 'on')} aria-label={w.name} aria-current={on ? 'page' : undefined}>
              {on && <motion.span layoutId="cap-pill" className="cap-pill" transition={PILL} />}
              <Icon name={w.icon} size={19} stroke={1.8} />
              <AnimatePresence initial={false}>
                {on && (
                  <motion.span key="l" className="cap-label" initial={{ width: 0, opacity: 0 }} animate={{ width: 'auto', opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}>
                    <span>{w.name}</span>
                  </motion.span>
                )}
              </AnimatePresence>
              {!on && ws[w.key] ? <span key={ws[w.key]} className="cap-badge">{ws[w.key] > 99 ? '99+' : ws[w.key]}</span> : null}
              {!on && <span className="cap-tip">{w.name}</span>}
            </Link>
          );
        })}
      </nav>
    </LayoutGroup>
  );
}

const PILL = { type: 'spring', stiffness: 460, damping: 36, mass: 0.8 };

// Highlights the in-page section currently on screen.
function useSpy(ids) {
  const [on, setOn] = useState(ids[0]);
  const lock = useRef(0);
  useEffect(() => {
    if (!ids.length) return undefined;
    const pick = () => {
      if (Date.now() < lock.current) return; // a jump link was just clicked — keep its highlight
      const y = 120;
      // The block whose top is nearest above the line wins (works across two columns).
      let cur = ids[0]; let best = -Infinity;
      ids.forEach((id) => { const el = document.getElementById(id); const t = el?.getBoundingClientRect().top; if (t != null && t <= y && t > best) { best = t; cur = id; } });
      // At the very bottom, the lowest block that's on screen can't reach the line — pick it.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        ids.forEach((id) => { const t = document.getElementById(id)?.getBoundingClientRect().top; if (t != null && t < window.innerHeight * 0.6 && t > best) { best = t; cur = id; } });
      }
      setOn(cur);
    };
    pick();
    window.addEventListener('scroll', pick, { passive: true });
    return () => window.removeEventListener('scroll', pick);
  }, [ids.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps
  // Clicking a jump link highlights it straight away and holds it while the page scrolls there.
  const choose = (id) => { lock.current = Date.now() + 1200; setOn(id); };
  return [on, choose];
}

function Rail() {
  const { pathname } = useLocation();
  const { page } = useBadges();
  const todoCount = useTodoCount();
  const w = workspaces.find((x) => isOn(x, pathname));
  const inSettings = pathname.startsWith('/settings');
  const tabs = inSettings ? SETTINGS_SECTIONS.map(([k, label, icon]) => ({ to: `/settings/${k}`, label, icon })) : w?.tabs || [];
  // Detail pages (a student, a family's fees, a class) light up the page they belong to.
  const activeTab = inSettings && pathname.replace(/\/$/, '') === '/settings' ? '/settings/school'
    : [...tabs].sort((a, b) => b.to.length - a.to.length).find((t) => pathname === t.to || pathname.startsWith(`${t.to}/`))?.to;
  const jumps = !tabs.length && pathname === (w?.base || '/') ? anchors[w?.key] || [] : [];
  const [spy, choose] = useSpy(jumps.map((j) => j.id));
  const jump = (id) => { choose(id); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  return (
    <nav className="rail" aria-label={w ? `${w.name} pages` : 'Pages'}>
      {jumps.length > 0 && (
        <div className="rail-group">
          {jumps.map((j) => (
            <button key={j.id} className={cx('rail-item', spy === j.id && 'active')} aria-label={`Jump to ${j.label}`} onClick={() => jump(j.id)}>
              {spy === j.id && <motion.span layoutId="rail-pill" className="rail-pill" transition={PILL} />}
              <Icon name={j.icon} size={20} stroke={1.7} />
              {j.id === 'needs' && todoCount ? <span className="rail-badge">{todoCount > 99 ? '99+' : todoCount}</span> : null}
              <span className="rail-tip">{j.label}</span>
            </button>
          ))}
        </div>
      )}
      {tabs.length > 0 && (
        <div className={cx('rail-group', tabs.length > 8 && 'rail-scroll')}>
          {tabs.map((t) => (
            <Link key={t.to} to={t.to} className={cx('rail-item', t.to === activeTab && 'active')} aria-label={t.label} title={tabs.length > 8 ? t.label : undefined} aria-current={t.to === activeTab ? 'page' : undefined}>
              {((isActive) => (<>
                {isActive && <motion.span layoutId="rail-pill" className="rail-pill" transition={PILL} />}
                <Icon name={t.icon} size={20} stroke={1.7} />
                {page[t.to] ? <span key={page[t.to]} className="rail-badge">{page[t.to] > 99 ? '99+' : page[t.to]}</span> : null}
                <span className="rail-tip">{t.label}</span>
              </>))(t.to === activeTab)}
            </Link>
          ))}
        </div>
      )}
      <div className="rail-spacer" />
      <div className="rail-foot">
        <Link to="/settings/billing" className="rail-item rail-warn" aria-label="Subscription payment overdue">
          <Icon name="warn" size={20} />
          <span className="rail-tip">Subscription overdue</span>
        </Link>
        <div className={cx('rail-group', inSettings && 'hide-in-settings')}>
          <Link to="/settings/support" className={cx('rail-item', pathname.startsWith('/settings/support') && 'active')} aria-label="Support">
            <Icon name="headset" size={20} stroke={1.7} />
            <span className="rail-tip">Support</span>
          </Link>
          <Link to="/settings" className={cx('rail-item', pathname.startsWith('/settings') && !pathname.startsWith('/settings/support') && 'active')} aria-label="Settings">
            <Icon name="sliders" size={20} stroke={1.7} />
            <span className="rail-tip">Settings</span>
          </Link>
        </div>
        <ProfileMenu />
      </div>
    </nav>
  );
}

// Account menu, bottom of the rail: theme, school site, activity, billing, sign out.
function ProfileMenu() {
  const { db, resetDemo, toast } = useSchool();
  const nav = useNavigate();
  const [theme, setTheme] = useTheme();
  return (
    <Menu
      align="left"
      up
      width={250}
      trigger={({ toggle }) => (
        <button className="avatar-btn" aria-label="Account" onClick={toggle}>
          <span>{db.school.short.split(' ').map((w) => w[0]).join('').slice(0, 2)}</span>
        </button>
      )}
      groups={[
        { label: 'Demo school · Owner', items: [
          { label: theme === 'dark' ? 'Light mode' : 'Dark mode', icon: theme === 'dark' ? 'sun' : 'moon', onClick: () => setTheme(theme === 'dark' ? 'light' : 'dark') },
          { label: 'Visit school site', icon: 'external', onClick: () => window.open(`https://${db.school.site}`, '_blank', 'noopener') },
          { label: 'Activity log', icon: 'history', onClick: () => nav('/settings/activity') },
          { label: 'Billing & plan', icon: 'wallet', onClick: () => nav('/settings/billing') },
        ] },
        { items: [{ label: 'Reset demo data', icon: 'refresh', onClick: () => { resetDemo(); toast('Demo data reset'); } }, { label: 'Sign out', icon: 'logout' }] },
      ]}
    />
  );
}

function MobileNav() {
  const { pathname } = useLocation();
  const nav = useNavigate();
  const [theme, setTheme] = useTheme();
  const items = workspaces.filter((w) => ['today', 'students', 'academics', 'finance', 'staff'].includes(w.key));
  return (
    <nav className="mobile-nav" aria-label="Workspaces">
      {items.map((w) => {
        const on = w.base === '/' ? pathname === '/' : pathname.startsWith(w.base);
        return (
          <Link key={w.key} to={w.tabs[0]?.to || w.base} className={cx(on && 'active')} aria-label={w.name}>
            <Icon name={w.icon} size={20} />
          </Link>
        );
      })}
      <Menu
        align="right"
        trigger={({ toggle }) => <a href="#more" onClick={(e) => { e.preventDefault(); toggle(); }} aria-label="More"><Icon name="menu" size={20} /></a>}
        groups={[{ items: [
          { label: 'Engage', icon: 'engage', onClick: () => nav('/engage/messages') },
          { label: 'Website', icon: 'globe', onClick: () => nav('/website/site') },
          { label: 'Reports', icon: 'reports', onClick: () => nav('/reports') },
          { label: 'Settings', icon: 'sliders', onClick: () => nav('/settings') },
          { label: 'Support', icon: 'headset', onClick: () => nav('/settings/support') },
          { label: theme === 'dark' ? 'Light mode' : 'Dark mode', icon: theme === 'dark' ? 'sun' : 'moon', onClick: () => setTheme(theme === 'dark' ? 'light' : 'dark') },
          { label: 'Billing & plan', icon: 'wallet', onClick: () => nav('/settings/billing') },
        ] }]}
      />
    </nav>
  );
}

function Topbar() {
  const { db, open, readNotifications } = useSchool();
  const nav = useNavigate();
  const todoCount = useTodoCount();
  return (
    <header className="topbar">
      <Menu
        align="left"
        width={300}
        trigger={({ toggle }) => (
          <button className="school-switch" onClick={toggle}>
            <span className="mark"><Icon name="shield" size={18} stroke={1.9} /></span>
            <span className="school-nm">
              <b>{db.school.short}</b>
              <span className="hide-sm">{db.school.name.replace(db.school.short, '').trim() || 'Switch school'}<Icon name="chevDown" size={12} stroke={2.2} /></span>
            </span>
          </button>
        )}
        groups={[
          { label: 'Switch school', items: [{ label: db.school.name, icon: 'check', hint: 'Current' }, { label: 'City Campus (demo)', icon: 'school' }] },
          { items: [{ label: 'Owner dashboard', icon: 'grid' }, { label: 'School settings', icon: 'sliders', onClick: () => nav('/settings') }] },
        ]}
      />
      <WorkspaceCapsule />
      <div className="topbar-right">
        <div className="topbar-tools">
          <button className="tool-btn" aria-label="Search or run an action (⌘K)" title="Search · ⌘K" onClick={() => open('cmdk')}>
            <Icon name="search" size={18} stroke={1.8} />
          </button>
          <button className="tool-btn" aria-label="Quick fee payment" title="Quick fee payment" onClick={() => open('collect', {})}>
            <Icon name="cash" size={18} stroke={1.8} />
          </button>
          <button className="tool-btn" aria-label="To-dos" title="To-dos" onClick={() => open('todos')}>
            <Icon name="todo" size={18} stroke={1.7} />
            {todoCount > 0 && <span className="tool-dot" style={{ background: 'var(--accent-edge)' }} />}
          </button>
          <button className="tool-btn" aria-label="Notifications" title="Notifications" onClick={() => { open('notifications'); readNotifications(); }}>
            <Icon name="bell" size={18} stroke={1.7} />
            {db.unreadNotifications > 0 && <span className="tool-dot" />}
          </button>
        </div>
        <button className="ai-btn" aria-label="Ask AI" title="Ask AI" onClick={() => open('ai', {})}>
          <Icon name="sparkle" size={19} stroke={1.8} />
        </button>
      </div>
    </header>
  );
}

export function useTodoCount() {
  const { unmarkedSections, defaulters, db, staffUnpaid } = useSchool();
  const unpublished = db.exams.filter((e) => !e.published).length;
  const pendingInq = db.inquiries.filter((q) => q.stage === 'new' || q.stage === 'contacted').length;
  return [unmarkedSections.length, defaulters.length, unpublished, pendingInq, staffUnpaid.length].filter(Boolean).length;
}

export default function Shell() {
  const { ui, open, close, toast } = useSchool();
  const nav = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  // Name each browser tab after the page (its heading), e.g. "Fees · Schooliee".
  useEffect(() => {
    const t = setTimeout(() => {
      const sec = pathname.startsWith('/settings') && SETTINGS_SECTIONS.find(([k]) => pathname.startsWith(`/settings/${k}`));
      const h = pathname === '/' ? 'Today' : sec ? `${sec[1]} · Settings` : document.querySelector('.shell-main h1')?.textContent?.trim();
      document.title = h ? `${h} · Schooliee` : 'Schooliee';
    }, 60);
    return () => clearTimeout(t);
  }, [pathname]);

  // A greyed-out main button explains itself: clicking it outlines the empty required
  // fields of its form and names them. (Disabled buttons ignore the pointer, so the
  // click lands on what's underneath and we look up what was under the cursor.)
  useEffect(() => {
    const explain = (e) => {
      const btn = [...document.querySelectorAll('button.btn.primary:disabled')].find((b) => { const r = b.getBoundingClientRect(); return r.width && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; });
      if (!btn) return;
      const scope = btn.closest('.modal, .drawer, .page') || document;
      const missing = [...scope.querySelectorAll('label.field')].filter((l) => {
        if (l.querySelector('.opt') || /optional/i.test(l.textContent)) return false;
        const c = l.querySelector('input:not([type=checkbox]):not([type=radio]):not([type=file]), select, textarea');
        return c && !String(c.value || '').trim();
      });
      document.querySelectorAll('.field-missing').forEach((x) => x.classList.remove('field-missing'));
      missing.forEach((l) => l.classList.add('field-missing'));
      setTimeout(() => missing.forEach((l) => l.classList.remove('field-missing')), 2600);
      const names = missing.map((l) => l.querySelector('span')?.textContent.trim()).filter(Boolean);
      toast(names.length ? `Still needed: ${names.slice(0, 4).join(', ')}` : 'Complete the details above first', { icon: 'warn' });
      if (missing[0]) missing[0].querySelector('input, select, textarea')?.focus();
    };
    document.addEventListener('click', explain);
    return () => document.removeEventListener('click', explain);
  }, [toast]);

  // Clickable rows are reachable and openable from the keyboard (Tab, then Enter).
  useEffect(() => {
    const tag = () => document.querySelectorAll('tr.click:not([tabindex]), .cls-card:not([tabindex])').forEach((r) => r.setAttribute('tabindex', '0'));
    tag();
    const mo = new MutationObserver(tag);
    mo.observe(document.body, { childList: true, subtree: true });
    const enter = (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('tr.click')) { e.preventDefault(); e.target.click(); } };
    document.addEventListener('keydown', enter);
    return () => { mo.disconnect(); document.removeEventListener('keydown', enter); };
  }, []);

  useEffect(() => {
    const k = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); open('cmdk'); return; }
      const tag = (e.target.tagName || '').toLowerCase();
      if (['input', 'textarea', 'select'].includes(tag) || e.metaKey || e.ctrlKey || e.altKey || document.querySelector('.scrim')) return;
      if (e.key === '/') { e.preventDefault(); open('cmdk'); }
    };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [open]);

  return (
    <div className="shell">
      <Topbar />
      <div className="shell-body">
        <Rail />
        <div className="shell-main">
          <PageMotion key={pathname}><Outlet /></PageMotion>
        </div>
      </div>
      <MobileNav />
      <CommandPalette open={ui.cmdk} onClose={() => close('cmdk')} />
      <CollectDrawer state={ui.collect} onClose={() => close('collect')} />
      <TodosDrawer open={ui.todos} onClose={() => close('todos')} />
      <NotificationsDrawer open={ui.notifications} onClose={() => close('notifications')} />
      <AiDrawer state={ui.ai} onClose={() => close('ai')} />
      <ComposeDrawer state={ui.compose} onClose={() => close('compose')} />
      <FineModal state={ui.fine} onClose={() => close('fine')} />
      <RecordModal state={ui.record} onClose={() => close('record')} />
      <Toasts />
    </div>
  );
}

// Every page enters the way Today does: cards rise in turn, rows fade in,
// bars grow and headline numbers count up. Runs once per page visit.
function PageMotion({ children }) {
  const ref = useRef(null);
  useEffect(() => {
    const root = ref.current;
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    root.classList.add('page-in');
    root.querySelectorAll('.card, .card-accent, .card-hero, .widget, .cls-stats > div, .stack-card').forEach((el, i) => el.style.setProperty('--i', Math.min(i, 12)));
    root.querySelectorAll('tbody tr').forEach((el, i) => el.style.setProperty('--r', Math.min(i, 16)));
    const stops = [];
    const numbers = [...root.querySelectorAll('.display, .cls-stats b, .stat-v, .hero-v, .tile .v')]
      .filter((el) => el.childNodes.length && el.childNodes[0].nodeType === 3 && /^[−+-]?\s*\d[\d,]*(\.\d+)?$/.test(el.childNodes[0].nodeValue.trim()))
      .slice(0, 14);
    numbers.forEach((el, k) => {
      const node = el.childNodes[0];
      const raw = node.nodeValue;
      const m = raw.trim().match(/^([−+-]?\s*)([\d,]+)(\.\d+)?$/);
      if (!m) return;
      const target = Number((m[2] + (m[3] || '')).replace(/,/g, ''));
      if (!target) return;
      const dec = m[3] ? m[3].length - 1 : 0;
      const t0 = performance.now() + 120 + k * 40;
      let last = raw; let raf;
      const fmtN = (v) => m[1] + v.toLocaleString('en-PK', { minimumFractionDigits: dec, maximumFractionDigits: dec });
      const tick = (t) => {
        if (node.nodeValue !== last) return; // React changed it — stop
        const p = Math.max(0, Math.min(1, (t - t0) / 900));
        last = p < 1 ? fmtN(target * (1 - Math.pow(1 - p, 3))) : raw;
        node.nodeValue = last;
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      stops.push(() => { cancelAnimationFrame(raf); if (node.nodeValue === last) node.nodeValue = raw; });
    });
    const off = setTimeout(() => root.classList.remove('page-in'), 1800);
    return () => { clearTimeout(off); stops.forEach((f) => f()); };
  }, []);
  return <div ref={ref} className="page-motion">{children}</div>;
}

export function PageHead({ eyebrow, title, sub, actions, sm }) {
  return (
    <div className="page-head">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1 className={cx('h1', sm && 'sm')} style={eyebrow ? { marginTop: 4 } : undefined}>{title}</h1>
        {sub && <p className="page-sub">{sub}</p>}
      </div>
      {actions && <div className="head-actions">{actions}</div>}
    </div>
  );
}

export { NavLink };
