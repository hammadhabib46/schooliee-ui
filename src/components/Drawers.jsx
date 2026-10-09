import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon.jsx';
import { Drawer } from './ui.jsx';
import { useSchool } from '../lib/store.jsx';
import { cx, fmt, relative } from '../lib/format.js';

export function useTodos() {
  const { unmarkedSections, defaulters, totalDue, db, staffUnpaid, payrollDue, open } = useSchool();
  const nav = useNavigate();
  const unpublished = db.exams.filter((e) => !e.published);
  const pendingInq = db.inquiries.filter((q) => q.stage === 'new' || q.stage === 'contacted');
  const unread = db.chats.reduce((a, c) => a + c.unread, 0);
  const list = [
    unmarkedSections.length && { key: 'att', tone: 'danger', icon: 'check', title: `Mark attendance for ${unmarkedSections.length} class${unmarkedSections.length > 1 ? 'es' : ''}`, sub: unmarkedSections.map((s) => s.label).slice(0, 3).join(', ') + (unmarkedSections.length > 3 ? '…' : ''), cta: 'Mark now', run: () => nav('/academics/attendance') },
    defaulters.length && { key: 'fees', tone: 'warn', icon: 'cash', title: `${defaulters.length} students owe ${fmt(totalDue)} PKR`, sub: 'Send a WhatsApp reminder with each family’s breakdown', cta: 'Remind all', run: () => open('compose', { preset: 'reminder' }) },
    staffUnpaid.length && { key: 'pay', tone: 'warn', icon: 'briefcase', title: `October payroll · ${fmt(payrollDue)} PKR`, sub: `${staffUnpaid.length} staff not paid yet`, cta: 'Pay staff', run: () => nav('/staff/payroll') },
    pendingInq.length && { key: 'inq', tone: 'info', icon: 'inbox', title: `${pendingInq.length} admission inquiries waiting`, sub: 'Call back or schedule a visit', cta: 'Review', run: () => nav('/students/admissions') },
    unpublished.length && { key: 'res', tone: 'muted', icon: 'exam', title: `${unpublished.length} exam results to enter`, sub: 'Hello exam — Class One, Two and Nursery', cta: 'Open exams', run: () => nav('/academics/exams') },
    unread && { key: 'chat', tone: 'muted', icon: 'engage', title: `${unread} unread parent messages`, sub: 'Usman, Numan Ali', cta: 'Reply', run: () => nav('/engage/chat') },
  ].filter(Boolean);
  return list;
}

const toneBg = { danger: 'var(--danger-soft)', warn: 'var(--warn-soft)', info: 'var(--info-soft)', muted: 'var(--surface-2)' };
const toneFg = { danger: 'var(--danger)', warn: 'var(--warn)', info: 'var(--info)', muted: 'var(--text)' };

export function TodoRow({ t, onDone }) {
  return (
    <div className="row todo-row" style={{ padding: '12px 12px', borderRadius: 18 }}>
      <span style={{ width: 40, height: 40, borderRadius: 14, background: toneBg[t.tone], color: toneFg[t.tone], display: 'grid', placeItems: 'center', flex: 'none' }}>
        <Icon name={t.icon} size={18} />
      </span>
      <span className="grow">
        <span className="medium" style={{ display: 'block' }}>{t.title}</span>
        <span className="small muted ellipsis" style={{ display: 'block' }}>{t.sub}</span>
      </span>
      <button className="btn sm" onClick={() => { onDone?.(); t.run(); }}>{t.cta}</button>
    </div>
  );
}

export function TodosDrawer({ open, onClose }) {
  const todos = useTodos();
  const { db, addTodo, updateTodo, removeTodo, restoreItem, toast } = useSchool();
  const [tab, setTab] = useState('needs');
  const [showDone, setShowDone] = useState(false);
  const [draft, setDraft] = useState({ text: '', assignee: 'Myself', remind: '' });
  const mine = db.todos.filter((t) => t.assignee === 'Myself');
  const delegated = db.todos.filter((t) => t.assignee !== 'Myself');
  const list = (tab === 'mine' ? mine : delegated).filter((t) => showDone || !t.done);
  const pending = (l) => l.filter((t) => !t.done).length;
  const people = ['Myself', ...db.users.filter((u) => u.status === 'active' && u.id !== 'U1').map((u) => u.name)];
  const add = (e) => {
    e.preventDefault();
    if (!draft.text.trim()) return;
    addTodo(draft);
    toast(draft.assignee === 'Myself' ? 'Task added' : `Task sent to ${draft.assignee}`);
    setTab(draft.assignee === 'Myself' ? 'mine' : 'delegated');
    setDraft({ text: '', assignee: 'Myself', remind: '' });
  };
  return (
    <Drawer open={open} onClose={onClose} title="To-dos" sub={`${todos.length} things need you · ${pending(mine)} of your tasks open`}>
      <div className="onoff" style={{ alignSelf: 'flex-start' }}>
        {[['needs', `Needs you · ${todos.length}`], ['mine', `My tasks · ${pending(mine)}`], ['delegated', `Delegated · ${pending(delegated)}`]].map(([k, l]) => <button key={k} className={cx(tab === k && 'on')} onClick={() => setTab(k)}>{l}</button>)}
      </div>
      {tab === 'needs' && <>
        {todos.map((t) => <TodoRow key={t.key} t={t} onDone={onClose} />)}
        {!todos.length && <div className="empty"><span className="ico"><Icon name="check" /></span><div className="t">All caught up</div></div>}
      </>}
      {tab !== 'needs' && <>
        <form onSubmit={add} className="col gap-8" style={{ padding: 12, borderRadius: 18, background: 'var(--surface-2)' }}>
          <input className="input" style={{ background: 'var(--surface)' }} placeholder="Add a task…" value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} />
          <div className="row gap-8 wrap">
            <select className="select" style={{ flex: '1 1 140px' }} value={draft.assignee} onChange={(e) => setDraft({ ...draft, assignee: e.target.value })} aria-label="Assign to">{people.map((p) => <option key={p}>{p}</option>)}</select>
            <input className="input" type="datetime-local" style={{ flex: '1 1 180px' }} value={draft.remind} onChange={(e) => setDraft({ ...draft, remind: e.target.value })} aria-label="Remind me" />
            <button className="btn primary" disabled={!draft.text.trim()}>Add</button>
          </div>
        </form>
        <div className="row between xs muted"><span>{list.length} task{list.length === 1 ? '' : 's'}</span><button className="btn xs ghost" onClick={() => setShowDone(!showDone)}>{showDone ? 'Hide completed' : 'Show completed'}</button></div>
        {list.map((t) => (
          <div key={t.id} className="row gap-12" style={{ padding: '10px 12px', borderRadius: 18, border: '1px solid var(--border)' }}>
            <button className={cx('circle sm', t.done && 'solid')} aria-label={t.done ? 'Mark as not done' : 'Mark as done'} onClick={() => updateTodo(t.id, { done: !t.done })}>{t.done && <Icon name="check" size={14} stroke={2.4} />}</button>
            <span className="grow" style={{ minWidth: 0 }}>
              <span className="medium" style={{ display: 'block', textDecoration: t.done ? 'line-through' : 'none', opacity: t.done ? 0.55 : 1 }}>{t.text}</span>
              <span className="xs muted">{t.assignee === 'Myself' ? `Added ${t.added}` : `${t.assignee} · from ${t.by}`}{t.remind && ` · ⏰ ${t.remind.replace('T', ' ')}`}</span>
            </span>
            <button className="icon-btn xs plain" aria-label="Delete task" onClick={() => { const i = db.todos.findIndex((x) => x.id === t.id); removeTodo(t.id); toast('Task deleted', { undo: () => restoreItem('todos', t, i) }); }}><Icon name="trash" size={14} /></button>
          </div>
        ))}
        {!list.length && <div className="empty"><span className="ico"><Icon name="todo" /></span><div className="t">No tasks here</div></div>}
      </>}
    </Drawer>
  );
}

// Canned answers from live demo data — the real app calls the AI backend.
export function useAiAnswer() {
  const s = useSchool();
  return (q) => {
    const t = q.toLowerCase();
    const { db, totalDue, defaulters, income, expense, payrollDue, todayAtt, active, classById } = s;
    const st = active.find((x) => t.includes(x.name.toLowerCase()));
    if (st) { const due = (st.dues || []).reduce((a, d) => a + d.amount, 0); return `**${st.name}** (${classById[st.classId]?.name} ${st.section}) owes **${fmt(due)} PKR**${due ? ` — ${(st.dues || []).map((d) => `${d.label} ${fmt(d.amount)}`).join(', ')}` : '. Nothing pending'}. Today: ${todayAtt[st.id] === 'A' ? 'absent' : todayAtt[st.id] ? 'present' : 'attendance not marked yet'}.`; }
    if (/absent|attendance|hazri|ghair/.test(t)) { const ab = active.filter((x) => todayAtt[x.id] === 'A'); return `Today **${Object.keys(todayAtt).length} of ${active.length}** students are marked. **${ab.length} absent**${ab.length ? `: ${ab.map((x) => x.name).join(', ')}` : ''}.`; }
    if (/profit|munafa|income|expense|kharch/.test(t)) return `This month: income **${fmt(income)} PKR**, expenses **${fmt(expense)} PKR**. Payroll still due: **${fmt(payrollDue)} PKR** — net after payroll **${fmt(income - expense - payrollDue)} PKR**.`;
    if (/teacher|staff|ustad/.test(t)) { const a = db.staff.filter((x) => x.status === 'active'); return `You have **${a.length} active staff**: ${a.map((x) => `${x.name} (${x.role})`).join(', ')}.`; }
    if (/fee|due|pending|baqaya|defaulter/.test(t)) return `**${fmt(totalDue)} PKR** is pending from **${defaulters.length} students**. Top: ${defaulters.slice(0, 3).map((x) => `${x.name} ${fmt((x.dues || []).reduce((a, d) => a + d.amount, 0))}`).join(', ')}.`;
    if (/student|bachay|admission/.test(t)) return `**${active.length} active students** in ${db.classes.length} classes. ${db.inquiries.filter((x) => x.stage === 'new').length} new admission inquiries are waiting.`;
    return 'I can answer about fees & dues, attendance, income and expenses, staff, and individual students. Try “Who is absent today?” or “How much fee is pending?”';
  };
}

const rich = (text) => text.split(/(\*\*[^*]+\*\*)/).map((p, i) => (p.startsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : p));

export function AiDrawer({ state, onClose }) {
  const { db, aiAsk } = useSchool();
  const answer = useAiAnswer();
  const [chatId, setChatId] = useState(null);
  const [q, setQ] = useState('');
  const [thinking, setThinking] = useState(false);
  const [tab, setTab] = useState('chat');
  const endRef = useRef(null);
  const ask = (text, fresh) => {
    if (!text.trim()) return;
    setQ(''); setThinking(true);
    setTimeout(() => { const id = aiAsk(fresh ? null : chatId, text, answer(text)); setChatId(id); setThinking(false); }, 500);
  };
  useEffect(() => { if (state) { setTab('chat'); if (state.q) { setChatId(null); ask(state.q, true); } } }, [state]); // eslint-disable-line
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end', inline: 'nearest' }); }, [db.aiChats, thinking, chatId]);
  const chat = db.aiChats.find((c) => c.id === chatId);
  return (
    <Drawer open={!!state} onClose={onClose} wide title="Ask Schooliee AI" sub="Answers from your fees, attendance, staff and student data">
      <div className="row between gap-8 wrap">
        <div className="onoff"><button className={cx(tab === 'chat' && 'on')} onClick={() => setTab('chat')}>Chat</button><button className={cx(tab === 'history' && 'on')} onClick={() => setTab('history')}>History · {db.aiChats.length}</button><button className={cx(tab === 'whatsapp' && 'on')} onClick={() => setTab('whatsapp')}>On WhatsApp</button></div>
        <button className="btn sm ghost" onClick={() => { setChatId(null); setTab('chat'); }}><Icon name="plus" size={14} />New chat</button>
      </div>
      {tab === 'history' && db.aiChats.map((c) => (
        <button key={c.id} className="stack-card" style={{ marginTop: 0, textAlign: 'left', font: 'inherit', color: 'inherit', cursor: 'pointer' }} onClick={() => { setChatId(c.id); setTab('chat'); }}>
          <span className="circle sm"><Icon name="sparkle" size={14} /></span><span className="grow"><span className="medium" style={{ display: 'block' }}>{c.title}</span><span className="xs muted">{c.messages.length / 2} question{c.messages.length > 2 ? 's' : ''}</span></span><Icon name="chevRight" size={15} />
        </button>
      ))}
      {tab === 'whatsapp' && (
        <div className="col gap-12">
          <div className="insight"><span className="circle sm lime"><Icon name="whatsapp" size={15} /></span><div className="grow"><h3>Ask from WhatsApp</h3><p className="small muted mt-4">Message the Schooliee number from your registered phone — in English or Urdu. Same answers, no app needed.</p></div></div>
          <a className="btn" href="/settings/whatsapp" onClick={onClose}>Set up WhatsApp AI</a>
        </div>
      )}
      {tab === 'chat' && <>
        <div className="col gap-10" style={{ flex: 1 }}>
          {!chat && !thinking && (
            <div className="col gap-8">
              <div className="small muted">Try asking</div>
              {['Who is absent today?', 'How much fee is pending?', 'Is mahine ka munafa kitna hai?', 'How many teachers do we have?'].map((x) => <button key={x} className="chip" style={{ alignSelf: 'flex-start' }} onClick={() => ask(x)}><Icon name="sparkle" size={12} />{x}</button>)}
            </div>
          )}
          {chat?.messages.map(([who, text], i) => (
            <div key={i} style={{ alignSelf: who === 'me' ? 'flex-end' : 'flex-start', maxWidth: '85%', padding: '10px 14px', borderRadius: 18, background: who === 'me' ? 'var(--quiet)' : 'var(--surface-2)', color: who === 'me' ? 'var(--on-quiet)' : 'inherit', lineHeight: 1.5 }} className="small">{who === 'ai' ? rich(text) : text}</div>
          ))}
          {thinking && <div className="small muted" style={{ alignSelf: 'flex-start' }}>Thinking…</div>}
          <div ref={endRef} />
        </div>
        <form className="row gap-8" style={{ position: 'sticky', bottom: 0, paddingTop: 8, background: 'var(--surface)' }} onSubmit={(e) => { e.preventDefault(); ask(q); }}>
          <input className="input" autoFocus placeholder="Ask about fees, attendance, staff…" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="circle solid" aria-label="Ask" disabled={!q.trim() || thinking}><Icon name="arrowUp" size={16} stroke={2.2} /></button>
        </form>
      </>}
    </Drawer>
  );
}

export function NotificationsDrawer({ open, onClose }) {
  const { db } = useSchool();
  return (
    <Drawer open={open} onClose={onClose} title="Notifications">
      {db.notifications.map((n) => (
        <div key={n.id} className="row top" style={{ padding: '4px 0' }}>
          <span className="icon-btn" style={n.tone === 'warn' ? { background: 'var(--warn-soft)', color: 'var(--warn)', borderColor: 'transparent' } : undefined}><Icon name={n.icon} size={16} /></span>
          <span className="grow">
            <span style={{ display: 'block' }}>{n.text}</span>
            <span className="xs muted">{relative(n.when)}</span>
          </span>
        </div>
      ))}
    </Drawer>
  );
}
