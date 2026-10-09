import { useEffect, useMemo, useState } from 'react';
import Icon from './Icon.jsx';
import { Drawer, Field, Modal } from './ui.jsx';
import { useSchool } from '../lib/store.jsx';
import { cx, fmt } from '../lib/format.js';

const TEMPLATES = {
  reminder: { title: 'Fee reminder', type: 'Fee reminder', body: 'Assalam o Alaikum, dear parent of {student}. This is a friendly reminder that {due} PKR is pending. Kindly clear the dues at your earliest convenience. JazakAllah!' },
  holiday: { title: 'School holiday', type: 'Announcement', body: 'Dear parents, the school will remain closed on {date} on account of a public holiday. Classes resume the next working day.' },
  ptm: { title: 'Parent–teacher meeting', type: 'Announcement', body: 'Dear parents, a parent–teacher meeting will be held on Saturday from 9:00 to 12:00. Your presence is requested.' },
  exam: { title: 'Exam schedule', type: 'Exam schedule', body: 'Dear parents, monthly exams for {class} start next week. Please ensure your child prepares on time.' },
  custom: { title: '', type: 'Announcement', body: '' },
};

export default function ComposeDrawer({ state, onClose }) {
  const { db, defaulters, familiesWithDue, active, classById, sendAnnouncement, toast } = useSchool();
  const [audience, setAudience] = useState('school');
  const [classIds, setClassIds] = useState(['c2']);
  const classId = classIds[0];
  const [tpl, setTpl] = useState('custom');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
    const [wa, setWa] = useState(true);
  const [sms, setSms] = useState(false);
  const [email, setEmail] = useState(false);
  const [site, setSite] = useState(false);

  useEffect(() => {
    if (!state) return;
    const preset = state.preset || 'custom';
    setTpl(preset);
    setTitle(TEMPLATES[preset].title);
    setBody(TEMPLATES[preset].body);
    setAudience(preset === 'reminder' ? 'dues' : state.familyIds ? 'picked' : state.familyId ? 'family' : state.classId ? 'class' : 'school');
    if (state.classId) setClassIds([state.classId]);
    setWa(true); setSms(false); setEmail(false); setSite(false);
  }, [state]);

  // Families this message reaches, for the live-style "reach breakdown" before sending.
  const reachFams = useMemo(() => {
    const act = (fid) => active.some((x) => x.familyId === fid);
    if (audience === 'school') return db.families.filter((f) => act(f.id));
    if (audience === 'dues') return familiesWithDue;
    if (audience === 'class') return db.families.filter((f) => active.some((x) => x.familyId === f.id && classIds.includes(x.classId)));
    if (audience === 'family') return db.families.filter((f) => f.id === state?.familyId);
    if (audience === 'picked') return db.families.filter((f) => state?.familyIds?.includes(f.id));
    return [];
  }, [audience, classIds, db, active, familiesWithDue, state]);
  const [confirm, setConfirm] = useState(false);
  const recipients = useMemo(() => {
    if (audience === 'school') return db.families.filter((f) => active.some((s) => s.familyId === f.id)).length;
    if (audience === 'dues') return familiesWithDue.length;
    if (audience === 'class') return new Set(active.filter((s) => classIds.includes(s.classId)).map((s) => s.familyId)).size;
    if (audience === 'staff') return db.staff.length;
    if (audience === 'family') return 1;
    if (audience === 'picked') return state?.familyIds?.length || 0;
    return 0;
  }, [audience, classIds, db, active, familiesWithDue, state]);

  if (!state) return null;
  const pickTpl = (k) => { setTpl(k); setTitle(TEMPLATES[k].title); setBody(TEMPLATES[k].body); };
  const sample = audience === 'dues' && defaulters[0] ? defaulters[0] : active[0];
  const preview = body
    .replace('{student}', sample?.name || 'Ahmed')
    .replace('{due}', fmt(sample?.dues?.reduce((a, d) => a + d.amount, 0) || 0))
    .replace('{class}', classById[classId]?.name || 'your class')
    .replace('{date}', 'Monday 12 October');
  const audiences = [
    ['school', 'Whole school'], ['class', 'Classes'], ['dues', 'Families with dues'], ['staff', 'Staff'],
    ...(state.familyId ? [['family', 'This family']] : []),
    ...(state.familyIds ? [['picked', `Selected (${state.familyIds.length} families)`]] : []),
  ];

  const send = () => {
    sendAnnouncement({ title: title || 'Message', type: TEMPLATES[tpl].type, body: preview, app: [recipients, recipients], wa: wa ? [recipients, recipients] : [0, 0], sms: sms ? recipients : 0, email: email ? recipients : 0, site });
    toast(`Sent to ${recipients} ${audience === 'staff' ? 'staff' : 'families'}${site ? ' · published on your website' : ''}`);
    onClose();
  };

  return (
    <Drawer open onClose={onClose} title="New message" sub="Engage · parents & staff" wide
      footer={<>
        <span className="small muted grow">{recipients} recipient{recipients === 1 ? '' : 's'} · {['App', wa && 'WhatsApp', sms && 'SMS', email && 'Email'].filter(Boolean).join(' + ')}{site ? ' · website' : ''}</span>
        <button className="btn ghost" onClick={() => { toast('Saved as draft'); onClose(); }}>Save draft</button>
        <button className="btn primary" disabled={!body.trim() || recipients === 0} onClick={() => (audience === 'staff' ? send() : setConfirm(true))}><Icon name="send" size={15} />Review & send</button>
      </>}>
      <div className="split" style={{ gap: 20 }}>
        <div className="col gap-16" style={{ flex: '1 1 300px', minWidth: 0 }}>
          <div className="col gap-8">
            <span className="label">To</span>
            <div className="row wrap gap-8">
              {audiences.map(([k, l]) => <button key={k} className={cx('chip sm', audience === k && 'on')} onClick={() => setAudience(k)}>{l}</button>)}
            </div>
            {audience === 'class' && (
              <div className="row wrap gap-6" style={{ padding: 10, borderRadius: 16, background: 'var(--surface-2)' }}>
                {db.classes.map((c) => { const on = classIds.includes(c.id); return <button key={c.id} className={cx('chip sm', on && 'on')} style={{ height: 28 }} onClick={() => setClassIds(on ? classIds.filter((x) => x !== c.id) : [...classIds, c.id])}>{c.name}</button>; })}
              </div>
            )}
          </div>
          <div className="col gap-8">
            <span className="label">Start from</span>
            <div className="row wrap gap-8">
              {[['custom', 'Blank'], ['reminder', 'Fee reminder'], ['ptm', 'PTM'], ['holiday', 'Holiday'], ['exam', 'Exam schedule']].map(([k, l]) => (
                <button key={k} className={cx('chip sm', tpl === k && 'on')} onClick={() => pickTpl(k)}>{l}</button>
              ))}
            </div>
          </div>
          <Field label="Title"><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. School closed on Monday" /></Field>
          <Field label="Message" hint="Use {student}, {due}, {class} — filled in for each family.">
            <textarea className="textarea" rows={6} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your message…" />
          </Field>
          <div className="col gap-8">
            <span className="label">Send through</span>
            <div className="row wrap gap-8">
              <span className="chip sm on" title="Every message goes to the parent app" style={{ cursor: 'default' }}><Icon name="phone" size={14} />App · always</span>
              {[['whatsapp', 'WhatsApp', wa, setWa], ['send', 'SMS', sms, setSms], ['mail', 'Email', email, setEmail]].map(([i, l, on, set]) => (
                <button key={l} className={cx('chip sm', on && 'on')} role="switch" aria-checked={on} onClick={() => set(!on)}><Icon name={i} size={14} />{l}</button>
              ))}
            </div>
          </div>
          {audience !== 'staff' && audience !== 'family' && <button className="switch-row" onClick={() => setSite(!site)} role="switch" aria-checked={site}>
            <span><span className="row gap-8 medium"><Icon name="globe" size={16} />Also publish on school website</span><span className="xs muted">Shows under News on {db.school.site}</span></span><span className={cx('switch', site && 'on')} />
          </button>}
        </div>
        <div style={{ flex: '0 1 240px', minWidth: 220 }}>
          <div className="label" style={{ marginBottom: 8 }}>Preview</div>
          <div style={{ borderRadius: 28, background: '#0B141A', padding: 14, minHeight: 320 }}>
            <div className="row gap-8" style={{ color: '#E9EDEF', padding: '2px 4px 12px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
              <span className="av s30 lime">DS</span><span className="small medium">{db.school.short}</span>
            </div>
            <div style={{ marginTop: 14, background: '#005C4B', color: '#E9EDEF', padding: '10px 12px', borderRadius: '14px 14px 4px 14px', fontSize: 13, lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>
              {title && <strong style={{ display: 'block', marginBottom: 4 }}>{title}</strong>}
              {preview || <span style={{ opacity: .6 }}>Your message will appear here.</span>}
              <div style={{ textAlign: 'right', fontSize: 10, opacity: .6, marginTop: 4 }}>9:41 ✓✓</div>
            </div>
          </div>
        </div>
      </div>
      {confirm && (
        <Modal open onClose={() => setConfirm(false)} title="Confirm message" sub="Here is who it will reach"
          footer={<><button className="btn ghost" onClick={() => setConfirm(false)}>Cancel</button><button className="btn primary" onClick={() => { setConfirm(false); send(); }}><Icon name="send" size={15} />Send now</button></>}>
          <div className="col gap-6">
            {[['Families', reachFams.length], ['With the parent app', reachFams.filter((f) => f.app).length], ['With verified WhatsApp', reachFams.filter((f) => f.waVerified).length], ['With email', reachFams.filter((f) => f.email).length], ['With a phone (SMS)', reachFams.filter((f) => f.phone).length]].map(([k, v]) => <div key={k} className="row between small" style={{ padding: '6px 0', borderTop: '1px solid var(--line)' }}><span className="muted">{k}</span><span className="strong">{v}</span></div>)}
          </div>
          <div className="xs muted">The app always gets it. WhatsApp, SMS and email go only to families with that contact — the rest are listed as skipped.</div>
        </Modal>
      )}
    </Drawer>
  );
}
