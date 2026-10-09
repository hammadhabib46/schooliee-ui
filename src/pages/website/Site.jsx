import { useState } from 'react';
import Icon from '../../components/Icon.jsx';
import { PageHead } from '../../components/Shell.jsx';
import { Field, SubNav, Switch } from '../../components/ui.jsx';
import { useSchool } from '../../lib/store.jsx';
import { cx } from '../../lib/format.js';
import { workspaces } from '../../lib/nav.js';

export function WebsiteTabs() {
  return <SubNav tabs={workspaces.find((w) => w.key === 'website').tabs} />;
}

const SECTIONS = [['address', 'Address', 'globe'], ['hero', 'Hero banner', 'image'], ['timings', 'School timings', 'clock'], ['features', 'Feature cards', 'grid'], ['gallery', 'Gallery', 'image'], ['reports', 'Parent report lookup', 'search'], ['contact', 'Map & contact', 'pin']];
const FEATURES = ['Parents mobile app', 'Online exam results', 'Daily diary on app', 'Smart fee reminders', 'Attendance notifications', 'Student observation report'];

export default function Site() {
  const { db, toast } = useSchool();
  const [sec, setSec] = useState('hero');
  const [dirty, setDirty] = useState(false);
  const [s, setS] = useState({
    slug: db.school.slug, title: 'Where every child shines', subtitle: 'Admissions open for 2026–27 · Nursery to Class Ten', cta: 'Apply for admission',
    timings: [['Mon – Thu', '08:00', '13:30'], ['Friday', '08:00', '12:00'], ['Saturday', '08:00', '12:30']],
    features: Object.fromEntries(FEATURES.map((f, i) => [f, i !== 5])), reports: true,
    location: 'Demo School Campus', locSub: 'Gojra Road, Samundri', phones: ['+92 41 2345678', '+92 300 1234567'],
  });
  const up = (patch) => { setS({ ...s, ...patch }); setDirty(true); };

  return (
    <div className="page">
      <WebsiteTabs />
      <PageHead title="Public site" sub={<span>Live at <a className="link" href={`https://${s.slug}.schooliee.com`} target="_blank" rel="noreferrer">{s.slug}.schooliee.com</a> · edits show in the preview before you publish</span>}
        actions={<>
          <a className="btn" href={`https://${s.slug}.schooliee.com`} target="_blank" rel="noreferrer"><Icon name="external" size={16} />Open site</a>
          <button className="btn primary" disabled={!dirty} onClick={() => { setDirty(false); toast('Site published'); }}>{dirty ? 'Publish changes' : 'Published'}</button>
        </>} />
      <div className="split">
        <section className="card" style={{ flex: '1.2 1 520px', minWidth: 0, display: 'flex', gap: 18, flexWrap: 'wrap', padding: 18, alignItems: 'flex-start' }}>
          <nav className="col" style={{ gap: 2, flex: '0 0 200px' }}>
            {SECTIONS.map(([k, l, i]) => (
              <button key={k} onClick={() => setSec(k)} className={cx('menu-item', sec === k && 'active')} style={{ height: 42 }}><Icon name={i} size={16} />{l}</button>
            ))}
          </nav>
          <div className="col gap-16" style={{ flex: '1 1 280px', minWidth: 0 }}>
            {sec === 'address' && (<>
              <h2 className="h2">Web address</h2>
              <Field label="Subdomain" hint="Lowercase letters, numbers and hyphens · at least 3 characters"><div className="row gap-8"><input className="input" value={s.slug} onChange={(e) => up({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} /><span className="muted nowrap">.schooliee.com</span></div></Field>
              <div className="banner info small"><Icon name="link" size={16} />Want your own domain like www.demoschool.pk? Contact support to connect it.</div>
            </>)}
            {sec === 'hero' && (<>
              <h2 className="h2">Hero banner</h2>
              <Field label="Headline"><input className="input" value={s.title} onChange={(e) => up({ title: e.target.value })} /></Field>
              <Field label="Subtitle"><input className="input" value={s.subtitle} onChange={(e) => up({ subtitle: e.target.value })} /></Field>
              <Field label="Button text"><input className="input" value={s.cta} onChange={(e) => up({ cta: e.target.value })} /></Field>
              <div className="dropzone"><Icon name="upload" size={20} />Upload banner images<span className="xs faint">1600 × 900 recommended · up to 5</span></div>
            </>)}
            {sec === 'timings' && (<>
              <h2 className="h2">School timings</h2>
              {s.timings.map((t, i) => (
                <div key={i} className="row gap-8">
                  <input className="input grow" value={t[0]} onChange={(e) => up({ timings: s.timings.map((x, j) => (j === i ? [e.target.value, x[1], x[2]] : x)) })} />
                  <input className="input" type="time" style={{ width: 130 }} value={t[1]} onChange={(e) => up({ timings: s.timings.map((x, j) => (j === i ? [x[0], e.target.value, x[2]] : x)) })} />
                  <input className="input" type="time" style={{ width: 130 }} value={t[2]} onChange={(e) => up({ timings: s.timings.map((x, j) => (j === i ? [x[0], x[1], e.target.value] : x)) })} />
                  <button className="icon-btn" aria-label="Remove" onClick={() => up({ timings: s.timings.filter((_, j) => j !== i) })}><Icon name="close" size={13} /></button>
                </div>
              ))}
              <button className="btn sm" style={{ alignSelf: 'flex-start' }} onClick={() => up({ timings: [...s.timings, ['Day', '08:00', '13:00']] })}><Icon name="plus" size={14} />Add row</button>
            </>)}
            {sec === 'features' && (<>
              <h2 className="h2">Feature cards</h2>
              {FEATURES.map((f) => <div key={f} className="row between" style={{ padding: '10px 0', borderTop: '1px solid var(--line)' }}><span className="medium">{f}</span><Switch on={s.features[f]} onChange={(v) => up({ features: { ...s.features, [f]: v } })} label={f} /></div>)}
            </>)}
            {sec === 'gallery' && (<>
              <h2 className="h2">Gallery</h2>
              <div className="grid g3">{['Sports day', 'Science fair', 'Prize distribution'].map((g) => <div key={g} className="tile" style={{ aspectRatio: '4/3', display: 'grid', placeItems: 'center', textAlign: 'center' }}><Icon name="image" size={22} /><span className="xs muted">{g}</span></div>)}</div>
              <div className="dropzone"><Icon name="upload" size={20} />Add photos</div>
            </>)}
            {sec === 'reports' && (<>
              <h2 className="h2">Parent report lookup</h2>
              <p className="muted small">Parents enter their CNIC to see fee, exam, attendance and diary reports — without logging in.</p>
              <div className="row between" style={{ padding: '12px 0' }}><span className="medium">Show on public site</span><Switch on={s.reports} onChange={(v) => up({ reports: v })} label="Show reports" /></div>
            </>)}
            {sec === 'contact' && (<>
              <h2 className="h2">Map & contact</h2>
              <Field label="Location title"><input className="input" value={s.location} onChange={(e) => up({ location: e.target.value })} /></Field>
              <Field label="Location subtitle"><input className="input" value={s.locSub} onChange={(e) => up({ locSub: e.target.value })} /></Field>
              <Field label="Google Maps embed URL" optional><input className="input" placeholder="https://www.google.com/maps/embed?…" /></Field>
              <Field label="Phone numbers"><div className="row wrap gap-6">{s.phones.map((p) => <span key={p} className="tag">{p}</span>)}</div></Field>
            </>)}
          </div>
        </section>

        <aside style={{ flex: '1 1 380px', minWidth: 0, position: 'sticky', top: 16 }}>
          <div className="label" style={{ marginBottom: 8 }}>Preview</div>
          <div className="card flush" style={{ overflow: 'hidden', borderRadius: 22 }}>
            <div className="row gap-6" style={{ padding: '10px 14px', borderBottom: '1px solid var(--line)' }}>
              <span className="dot" style={{ color: '#E2A79C' }} /><span className="dot" style={{ color: '#E9C063' }} /><span className="dot" style={{ color: '#9BC23A' }} />
              <span className="xs muted" style={{ marginLeft: 8 }}>{s.slug}.schooliee.com</span>
            </div>
            <div style={{ padding: 24, background: 'linear-gradient(160deg, #141414, #2D2F2A)', color: '#fff' }}>
              <div className="row gap-8 small"><span className="av s30 lime">DS</span>{db.school.short}</div>
              <div className="display" style={{ fontSize: 30, marginTop: 28, lineHeight: 1.05 }}>{s.title}</div>
              <div className="small mt-8" style={{ opacity: .7 }}>{s.subtitle}</div>
              <span className="btn accent sm mt-16">{s.cta}</span>
            </div>
            <div style={{ padding: 18 }} className="col gap-12">
              <div className="grid g2" style={{ gap: 6 }}>{FEATURES.filter((f) => s.features[f]).map((f) => <div key={f} className="tile xs" style={{ padding: 10 }}>{f}</div>)}</div>
              <div className="col gap-4">{s.timings.map((t) => <div key={t[0]} className="row between xs"><span className="muted">{t[0]}</span><span>{t[1]} – {t[2]}</span></div>)}</div>
              {s.reports && <div className="tile row gap-8 xs"><Icon name="search" size={14} />Check your child’s reports — enter CNIC</div>}
              <div className="xs muted"><Icon name="pin" size={12} /> {s.location} · {s.locSub}</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
