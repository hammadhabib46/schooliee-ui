import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import { Avatar, Search } from '../../components/ui.jsx';
import { useSchool, code } from '../../lib/store.jsx';
import { fmt, relative, time } from '../../lib/format.js';
import { EngageTabs } from './Messages.jsx';

const QUICK = ['Noted, thank you.', 'Please visit the office between 9 and 12.', 'Payment received. JazakAllah!', 'Your child was absent today. Is everything okay?'];

export default function Chat() {
  const { db, familyById, kidsOf, familyDue, sendChat, readChat, open, classById } = useSchool();
  const [active, setActive] = useState(db.chats[0]?.id);
  const [thread, setThread] = useState(false); // phones: list ↔ conversation
  const [q, setQ] = useState('');
  const [text, setText] = useState('');
  const end = useRef(null);
  const chat = db.chats.find((c) => c.id === active);
  const fam = chat ? familyById[chat.familyId] : null;

  useEffect(() => { if (active) readChat(active); }, [active]); // eslint-disable-line
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [chat?.messages.length, active]);

  const list = db.chats.filter((c) => { const f = familyById[c.familyId]; const t = q.toLowerCase(); return !t || f.name.toLowerCase().includes(t) || kidsOf(f.id).some((k) => k.name.toLowerCase().includes(t)); });
  const send = (t) => { if (!t.trim()) return; sendChat(active, t.trim()); setText(''); };
  const due = fam ? familyDue(fam.id) : 0;

  return (
    <div className="page">
      <EngageTabs />
      <div className={`card flush chat-wrap ${thread ? 'thread-open' : ''}`} style={{ display: 'flex', minHeight: 620, overflow: 'hidden', borderRadius: 28 }}>
        <aside style={{ width: 320, flex: 'none', borderRight: '1px solid var(--line)', display: 'flex', flexDirection: 'column' }} className="chat-list">
          <div style={{ padding: 16 }}><Search value={q} onChange={setQ} placeholder="Search families or students" /></div>
          <div className="col" style={{ gap: 2, padding: '0 8px 8px', overflowY: 'auto' }}>
            {list.map((c) => {
              const f = familyById[c.familyId];
              const last = c.messages[c.messages.length - 1];
              return (
                <button key={c.id} onClick={() => { setActive(c.id); setThread(true); }} className="row" style={{ gap: 12, padding: 12, borderRadius: 18, border: 0, textAlign: 'left', background: active === c.id ? 'var(--surface-2)' : 'transparent' }}>
                  <Avatar name={f.name} id={f.id} />
                  <span className="grow" style={{ minWidth: 0 }}>
                    <span className="row between"><span className="medium">{f.name}</span><span className="xs muted">{relative(last.at)}</span></span>
                    <span className="row between gap-8"><span className="small muted ellipsis">{last.from === 'me' ? 'You: ' : ''}{last.text}</span>{c.unread > 0 && <span className="rail-badge" style={{ position: 'static', border: 0 }}>{c.unread}</span>}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {chat && fam ? (
          <section className="chat-thread" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <header className="row between" style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)', gap: 8 }}>
              <button className="icon-btn chat-back" aria-label="Back to conversations" onClick={() => setThread(false)}><Icon name="arrowLeft" size={15} /></button>
              <Link to={`/students/families/${fam.id}`} className="person"><Avatar name={fam.name} id={fam.id} /><span><span className="nm">{fam.name} family</span><span className="id">{kidsOf(fam.id).map((k) => k.name).join(', ')} · {fam.whatsapp || fam.phone}</span></span></Link>
              <div className="row gap-6">
                <a className="icon-btn" href={`tel:${fam.phone}`} aria-label="Call"><Icon name="phone" size={15} /></a>
                {due > 0 && <button className="btn sm" onClick={() => open('collect', { familyId: fam.id })}>Collect {fmt(due)}</button>}
              </div>
            </header>
            <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--surface-2)' }}>
              {chat.messages.map((m, i) => (
                <div key={i} style={{ alignSelf: m.from === 'me' ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                  <div style={{ padding: '10px 14px', borderRadius: m.from === 'me' ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: m.from === 'me' ? 'var(--sel)' : 'var(--surface)', color: m.from === 'me' ? 'var(--on-sel)' : 'var(--text)', border: m.from === 'me' ? 0 : '1px solid var(--border)', lineHeight: 1.45 }}>{m.text}</div>
                  <div className="xs faint mt-4" style={{ textAlign: m.from === 'me' ? 'right' : 'left' }}>{time(m.at)}</div>
                </div>
              ))}
              <div ref={end} />
            </div>
            <div style={{ padding: 14, borderTop: '1px solid var(--line)' }}>
              <div className="row wrap gap-6" style={{ marginBottom: 10 }}>{QUICK.map((t) => <button key={t} className="chip sm" style={{ height: 30 }} onClick={() => send(t)}>{t}</button>)}</div>
              <form className="row gap-8" onSubmit={(e) => { e.preventDefault(); send(text); }}>
                <button type="button" className="icon-btn lg" aria-label="Attach"><Icon name="paperclip" size={17} /></button>
                <input className="input grow" style={{ borderRadius: 999 }} placeholder="Write a message…" value={text} onChange={(e) => setText(e.target.value)} />
                <button className="btn primary" disabled={!text.trim()}><Icon name="send" size={15} />Send</button>
              </form>
            </div>
          </section>
        ) : <div className="empty grow">Choose a conversation</div>}

        {fam && (
          <aside style={{ width: 280, flex: 'none', borderLeft: '1px solid var(--line)', padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }} className="hide-sm">
            <div className="upper">Family</div>
            <div className="tile"><div className="k">Fees</div><div className="v" style={{ color: due ? 'var(--danger)' : 'var(--accent-text)' }}>{due ? `${fmt(due)} PKR due` : 'Clear'}</div></div>
            {kidsOf(fam.id).map((k) => (
              <Link key={k.id} to={`/students/${k.id}`} className="item-card"><Avatar name={k.name} id={k.id} size={30} /><span className="grow"><span className="small medium" style={{ display: 'block' }}>{k.name}</span><span className="xs muted">{code(k)} · {classById[k.classId]?.name}</span></span></Link>
            ))}
          </aside>
        )}
      </div>
    </div>
  );
}
