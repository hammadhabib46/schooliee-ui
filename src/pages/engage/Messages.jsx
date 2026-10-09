import { useState } from 'react';
import Icon from '../../components/Icon.jsx';
import { PageHead } from '../../components/Shell.jsx';
import { Chips, Empty, Search, SubNav } from '../../components/ui.jsx';
import { useSchool } from '../../lib/store.jsx';
import { dateShort } from '../../lib/format.js';
import { workspaces } from '../../lib/nav.js';
import { Circle } from '../../components/Bento.jsx';
import { exportCsv } from '../../lib/exporter.js';

export function EngageTabs() {
  const { db } = useSchool();
  const ws = workspaces.find((w) => w.key === 'engage');
  const unread = db.chats.reduce((a, c) => a + c.unread, 0);
  return <SubNav tabs={ws.tabs} counts={{ '/engage/chat': unread || undefined }} />;
}

const CHANNELS = [['whatsapp', 'WhatsApp'], ['send', 'SMS'], ['mail', 'Email']];

export default function Messages() {
  const { db, open, updateSettings, toast } = useSchool();
  const [kind, setKind] = useState('manual');
  const [type, setType] = useState('all');
  const [q, setQ] = useState('');
  const [platform, setPlatform] = useState('all');
  const alerts = db.settings.alerts;
  const setAlert = (k, i, v) => { const row = [...alerts[k]]; row[i] = v; updateSettings({ alerts: { ...alerts, [k]: row } }); toast(`${k} · ${CHANNELS[i][1]} ${v ? 'on' : 'off'}`); };
  const list = db.announcements.filter((a) => a.kind === kind);
  const types = [...new Set(list.map((a) => a.type))];
  const rows = list.filter((a) => type === 'all' || a.type === type).filter((a) => platform === 'all' || (platform === 'wa' ? a.wa[1] > 0 : platform === 'failed' ? a.wa[0] < a.wa[1] : a.app[1] > 0)).filter((a) => { const t = q.toLowerCase(); return !t || `${a.title} ${a.body}`.toLowerCase().includes(t); });
  const sentWa = db.announcements.reduce((a, x) => a + x.wa[0], 0);
  const totalWa = db.announcements.reduce((a, x) => a + x.wa[1], 0);
  const families = db.families.length;
  const failed = db.announcements.filter((x) => x.status === 'failed').length;
  const skipped = db.announcements.reduce((a, x) => a + Math.max(0, x.wa[1] - x.wa[0]), 0);

  return (
    <div className="page">
      <EngageTabs />
      <PageHead title="Messages" sub={`${db.announcements.length} messages this month · ${Math.round((sentWa / totalWa) * 100)}% WhatsApp delivery · ${failed} failed · ${skipped} skipped`}
        actions={<><div className="toolrow"><Circle icon="download" label="Export" onClick={() => { exportCsv('Messages'); toast('Messages exported', { icon: 'download' }); }} /></div><button className="btn primary" onClick={() => open('compose', {})}><Icon name="send" size={16} />New message</button></>} />

      <div className="grid g4">
        {[['Families reachable', `${db.families.filter((f) => f.waVerified || f.app).length}/${families}`, 'App or WhatsApp'], ['WhatsApp delivered', `${sentWa}/${totalWa}`, 'This month'], ['App installs', `${db.families.filter((f) => f.app).length}/${families}`, 'Invite the rest'], ['Failed deliveries', String(failed), `${skipped} skipped · no verified WhatsApp`]].map(([l, v, s]) => (
          <section key={l} className="card" style={{ padding: 18 }}><div className="small muted">{l}</div><div className="kpi mt-8">{v}</div><div className="xs muted mt-8">{s}</div></section>
        ))}
      </div>

      <div className="split">
        <section className="card pad-s wide" style={{ borderRadius: 28 }}>
          <div className="toolbar">
            <div className="seg ink lg">
              <button className={kind === 'manual' ? 'on' : ''} onClick={() => { setKind('manual'); setType('all'); }}>Sent by you</button>
              <button className={kind === 'auto' ? 'on' : ''} onClick={() => { setKind('auto'); setType('all'); }}>Automatic</button>
            </div>
            <Chips value={type} onChange={setType} items={[{ key: 'all', label: 'All' }, ...types.map((t) => ({ key: t, label: t }))]} />
            <div className="grow" />
            <select className="select" value={platform} onChange={(e) => setPlatform(e.target.value)} aria-label="Platform"><option value="all">All platforms</option><option value="app">App</option><option value="wa">WhatsApp</option><option value="failed">Skipped on WhatsApp</option></select>
            <Search value={q} onChange={setQ} placeholder="Search messages" />
          </div>
          <div className="col gap-4" style={{ padding: '0 8px 8px' }}>
            {rows.map((a) => (
              <article key={a.id} className="list-row hover" style={{ alignItems: 'flex-start' }}>
                <span className="icon-btn" style={{ background: 'var(--surface-2)', borderColor: 'transparent' }}><Icon name={a.type.includes('Fee') ? 'cash' : a.type === 'Attendance' ? 'check' : a.type.includes('Exam') ? 'exam' : a.type === 'Diary' ? 'diary' : a.type === 'New admission' ? 'userPlus' : 'send'} size={16} /></span>
                <div className="grow">
                  <div className="row wrap gap-8"><span className="medium">{a.title}</span><span className="pill outline" style={{ height: 22 }}>{a.type}</span></div>
                  <p className="small muted clamp-2 mt-4">{a.body}</p>
                  <div className="row wrap gap-6 mt-8">
                    <span className="pill info" style={{ height: 22 }}>App {a.app[0]}/{a.app[1]}</span>
                    {a.wa[1] > 0 ? <span className={`pill ${a.wa[0] === a.wa[1] ? 'ok' : 'outline'}`} style={{ height: 22 }}>WhatsApp {a.wa[0]}/{a.wa[1]}</span> : <span className="pill outline" style={{ height: 22 }}>WhatsApp off</span>}
                    {a.sms && <span className="pill outline" style={{ height: 22 }}>SMS {a.sms[0]}/{a.sms[1]}</span>}
                    {a.email && <span className="pill outline" style={{ height: 22 }}>Email {a.email[0]}/{a.email[1]}</span>}
                    {a.status === 'sending' && <span className="xs muted">Delivering…</span>}
                    {a.status !== 'sending' && a.wa[0] < a.wa[1] && <span className="xs muted">{a.wa[1] - a.wa[0]} skipped — no verified WhatsApp</span>}
                  </div>
                </div>
                <div className="right xs muted nowrap">{dateShort(a.date)}<div>{a.by}</div></div>
              </article>
            ))}
            {!rows.length && <Empty icon="send" title="No messages" />}
          </div>
        </section>
        <aside className="widget panel col gap-8" style={{ padding: 20 }}>
          <div className="widget-head" style={{ padding: 0 }}><span className="circle sm"><Icon name="bolt" size={15} /></span><span className="grow"><span className="medium" style={{ display: 'block' }}>Automations</span><span className="xs muted">Sent for you when something happens · the parent app always gets them</span></span></div>
          <div className="row xs muted" style={{ paddingTop: 6 }}><span className="grow">Event</span>{CHANNELS.map(([i, l]) => <span key={l} title={l} style={{ width: 38, display: 'grid', placeItems: 'center' }}><Icon name={i} size={14} /></span>)}</div>
          {Object.entries(alerts).map(([k, row]) => (
            <div key={k} className="row" style={{ padding: '6px 0', borderTop: '1px solid var(--line)' }}>
              <span className="grow small">{k}</span>
              {row.map((on, i) => (
                <span key={i} style={{ width: 38, display: 'grid', placeItems: 'center' }}>
                  <button role="switch" aria-checked={on} aria-label={`${k} by ${CHANNELS[i][1]}`} onClick={() => setAlert(k, i, !on)} style={{ width: 22, height: 22, borderRadius: 7, border: on ? 0 : '1.5px solid var(--border)', background: on ? 'var(--sel)' : 'transparent', color: 'var(--on-sel, var(--surface))', display: 'grid', placeItems: 'center', cursor: 'pointer', padding: 0 }}>{on && <Icon name="check" size={12} stroke={3} />}</button>
                </span>
              ))}
            </div>
          ))}
          <div className="xs muted">SMS is charged per message on your plan.</div>
        </aside>
      </div>
    </div>
  );
}
