import { Fragment, useState } from 'react';
import Icon from '../../components/Icon.jsx';
import { Circle, OnOff, PillGroup, Widget } from '../../components/Bento.jsx';
import { PageHead } from '../../components/Shell.jsx';
import { Field, Modal } from '../../components/ui.jsx';
import { useSchool } from '../../lib/store.jsx';
import { cx, dateShort } from '../../lib/format.js';
import { periods } from '../../data/seed.js';
import { AcademicsTabs } from './Attendance.jsx';
import { exportCsv, printView } from '../../lib/exporter.js';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const periodOf = (n) => periods.find((p) => p.n === n);
const TONE = { English: 'c2', Science: 'c1', Urdu: 'c3', Islamiat: 'c4', Maths: 'c2' };

export default function Timetable() {
  const { db, classById, addSlot, removeSlot, updateSlot, updateLesson, toast, updateTT } = useSchool();
  const [lesson, setLesson] = useState(null); // { slot, date }
  const [view, setView] = useState('Week');
  const [by, setBy] = useState('class');
  const [target, setTarget] = useState('all');
  const [tFrom, setTFrom] = useState('');
  const [tTo, setTTo] = useState('');
  const [rFrom, setRFrom] = useState('2026-10-01');
  const [rTo, setRTo] = useState('2026-10-31');
  const [timingEdit, setTimingEdit] = useState(null);
  const [pause, setPause] = useState({ from: '2026-10-09', to: '2026-10-09', reason: '' });
  const [slot, setSlot] = useState(null);
  const [gridDay, setGridDay] = useState(5);
  const tt = db.tt;
  const teachers = db.staff.filter((s) => s.status === 'active');
  const dateOf = (day) => `2026-10-${String(4 + day).padStart(2, '0')}`; // week of 5–11 Oct
  const evOf = (t, day) => (db.lessons || {})[`${t.id}@${dateOf(day)}`] || {};
  const absentTeachers = teachers.filter((t) => db.staffAttendance['2026-10-09']?.[t.id] === 'A' || db.staffAttendance['2026-10-09']?.[t.id] === 'V').map((t) => t.name);
  const shown = db.timetable.filter((t) => (target === 'all' || (by === 'class' ? `${t.classId}|${t.section}` === target : t.teacher === target))
    && (!tFrom || periodOf(t.period)?.start >= tFrom) && (!tTo || periodOf(t.period)?.end <= tTo));
  const clash = (t) => db.timetable.some((o) => o.id !== t.id && o.day === t.day && o.period === t.period && (o.teacher === t.teacher || (o.room && o.room === t.room)));
  const days = tt.workingDays.map((d) => [d, DAYS[d - 1]]);
  const [agendaDay, setAgendaDay] = useState(tt.workingDays.includes(5) ? 5 : tt.workingDays[0]);
  // A lesson needs cover when its teacher is reported unavailable (or absent today) and no substitute is set.
  const needsCover = (t, day) => { const e = evOf(t, day); if (e.cancelled || e.sub) return false; return !!e.unavailable || (day === 5 && tt.flagCover && absentTeachers.includes(t.teacher)); };
  const coverList = db.timetable.flatMap((t) => [1, 2, 3, 4, 5, 6].filter((d) => t.day === d && needsCover(t, d) && d >= 5).map((d) => ({ t, d })));
  const timing = gridDay === 5 ? tt.timings.find((x) => x.days === 'Fri') || tt.timings[0] : tt.timings.find((x) => x.isDefault) || tt.timings[0];

  return (
    <div className="page">
      <AcademicsTabs />
      <PageHead title="Timetable" sub={`${db.timetable.length} periods a week · ${tt.workingDays.length} working days · ${tt.timings.length} timing sets${absentTeachers.length ? ` · ${absentTeachers.length} teacher absent today` : ''}`}
        actions={<>
          <div className="toolrow">
            <Circle icon="print" label="Print timetable" onClick={() => (printView(), toast('Timetable PDF ready', { icon: 'print' }))} />
            <Circle icon="download" label="Export CSV" onClick={() => (exportCsv('Timetable exported'), toast('Timetable exported', { icon: 'download' }))} />
          </div>
          <button className="btn primary" onClick={() => setSlot({ day: 1, period: 1 })}><Icon name="plus" size={16} stroke={2} />New slot</button>
        </>} />

      {coverList.length > 0 && (
        <div className="cover-banner">
          <div className="row gap-8"><Icon name="warn" size={16} /><span className="medium">{coverList.length} class{coverList.length > 1 ? 'es need' : ' needs'} a substitute</span></div>
          {coverList.map(({ t, d }) => (
            <button key={t.id + d} className="cover-row" onClick={() => setLesson({ slot: t, day: d })}>
              <span className="grow"><span className="small medium">{t.subject} · {classById[t.classId]?.name} {t.section}</span><span className="xs muted" style={{ display: 'block' }}>{t.teacher}{evOf(t, d).unavailable?.reason ? `: ${evOf(t, d).unavailable.reason}` : ' is absent today'}</span></span>
              <span className="xs" style={{ color: 'var(--danger)' }}>{DAYS[d - 1]} {Number(dateOf(d).slice(8))} Oct · {periodOf(t.period)?.start}</span>
            </button>
          ))}
        </div>
      )}

      <section className="widget" style={{ padding: 12 }}>
        <div className="panel-bar" style={{ padding: 2 }}>
          <PillGroup value={view} onChange={setView} items={['Week', 'Month', 'Period grid', 'Reports', 'Settings']} />
          <div className="grow" />
          {(view === 'Week' || view === 'Month') && <>
            <div className="onoff"><button className={cx(by === 'class' && 'on')} onClick={() => { setBy('class'); setTarget('all'); }}>By class</button><button className={cx(by === 'teacher' && 'on')} onClick={() => { setBy('teacher'); setTarget('all'); }}>By teacher</button></div>
            <select aria-label="Show timetable for" className="select" value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="all">{by === 'class' ? 'All classes' : 'All teachers'}</option>
              {by === 'class' ? db.classes.flatMap((c) => c.sections.map((s) => <option key={c.id + s} value={`${c.id}|${s}`}>{c.name} · {s}</option>)) : teachers.map((t) => <option key={t.id}>{t.name}</option>)}
            </select>
          </>}
          {(view === 'Week' || view === 'Month') && <>
            <select className="select" value={tFrom} onChange={(e) => setTFrom(e.target.value)} aria-label="From time"><option value="">From any time</option>{periods.map((p) => <option key={p.n} value={p.start}>From {p.start}</option>)}</select>
            <select className="select" value={tTo} onChange={(e) => setTTo(e.target.value)} aria-label="To time"><option value="">To any time</option>{periods.map((p) => <option key={p.n} value={p.end}>To {p.end}</option>)}</select>
            <span className="xs muted nowrap">{shown.length} slot{shown.length === 1 ? '' : 's'} in view</span>
          </>}
          {view === 'Reports' && <>
            <input className="input" type="date" style={{ height: 40, width: 150 }} value={rFrom} onChange={(e) => setRFrom(e.target.value)} aria-label="Report from" />
            <input className="input" type="date" style={{ height: 40, width: 150 }} value={rTo} onChange={(e) => setRTo(e.target.value)} aria-label="Report to" />
            <Circle icon="download" size="sm" label="Export CSV" onClick={() => { exportCsv('Timetable report'); toast('Timetable report exported', { icon: 'download' }); }} />
          </>}
          {view === 'Period grid' && <div className="onoff">{days.map(([d, n]) => <button key={d} className={cx(gridDay === d && 'on')} onClick={() => setGridDay(d)}>{n}</button>)}</div>}
        </div>

        <div style={{ padding: '14px 4px 4px', overflowX: 'auto' }}>
          {view === 'Week' && (
            /* Phones: one day at a time, as an agenda */
            <div className="tt-agenda">
              <div className="row gap-6" style={{ overflowX: 'auto', paddingBottom: 6 }}>
                {days.map(([d, n]) => <button key={d} className={cx('chip sm', agendaDay === d && 'on')} onClick={() => setAgendaDay(d)}>{n}{d === 5 ? ' · today' : ''}</button>)}
              </div>
              {periods.map((p) => {
                const items = shown.filter((t) => t.day === agendaDay && t.period === p.n);
                return (
                  <div key={p.n} className="tt-agenda-row">
                    <div className="tt-agenda-time"><b>P{p.n}</b><span>{p.start}</span></div>
                    <div className="col gap-4 grow" style={{ minWidth: 0 }}>
                      {items.map((t) => {
                        const ev = evOf(t, agendaDay);
                        return (
                          <button key={t.id} onClick={() => setLesson({ slot: t, day: agendaDay })} className={`av ${TONE[t.subject] || 'c1'}`} style={{ width: '100%', height: 'auto', border: 0, borderRadius: 12, padding: '10px 12px', display: 'block', textAlign: 'left' }}>
                            <div className="strong" style={{ fontSize: 13 }}>{t.subject}{t.group ? ` · ${t.group}` : ''}</div>
                            <div style={{ fontSize: 12, opacity: .8 }}>{classById[t.classId]?.name} {t.section} · {ev.cancelled ? 'Cancelled' : needsCover(t, agendaDay) ? '⚠ needs cover' : ev.sub || t.teacher}</div>
                          </button>
                        );
                      })}
                      {!items.length && <button className="tt-agenda-free" onClick={() => setSlot({ day: agendaDay, period: p.n })}>Free · add a lesson</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {view === 'Week' && (
            <div className="tt-week" style={{ display: 'grid', gridTemplateColumns: `90px repeat(${days.length}, minmax(120px, 1fr))`, gap: 6, minWidth: 860 }}>
              <div />
              {days.map(([d, n]) => <div key={d} className="medium small" style={{ padding: '10px 8px', textAlign: 'center', background: d === 5 ? 'var(--surface-2)' : 'transparent', borderRadius: 12 }}>{n}{d === 5 && <span className="muted"> · today</span>}</div>)}
              {periods.map((p) => (
                <Fragment key={p.n}>
                  <div style={{ padding: '10px 8px' }}><div className="medium small">Period {p.n}</div><div className="xs muted">{p.start} – {p.end}</div></div>
                  {days.map(([d]) => {
                    const items = shown.filter((t) => t.day === d && t.period === p.n);
                    return (
                      <div key={d} style={{ minHeight: 72, borderRadius: 14, background: 'var(--surface-2)', padding: 4, display: 'flex', flexDirection: 'column', gap: 4 }} onClick={(e) => { if (e.target === e.currentTarget) setSlot({ day: d, period: p.n }); }}>
                        {items.map((t) => {
                          const needCover = needsCover(t, d);
                          const ev = evOf(t, d);
                          return (
                            <button key={t.id} onClick={() => setLesson({ slot: t, day: d })} className={`av ${TONE[t.subject] || 'c1'}`} style={{ width: '100%', height: 'auto', border: 0, borderRadius: 10, padding: '8px 10px', display: 'block', textAlign: 'left', boxShadow: clash(t) || needCover ? 'inset 0 0 0 1.5px var(--danger)' : 'none', fontWeight: 400 }}>
                              <div className="strong" style={{ fontSize: 12 }}>{t.subject}{t.group ? ` · ${t.group}` : ''}</div>
                              <div style={{ fontSize: 11, opacity: .8 }}>{classById[t.classId]?.name} {t.section}{t.room ? ` · ${t.room}` : ''}</div>
                              <div style={{ fontSize: 11, opacity: .8, textDecoration: ev.cancelled ? 'line-through' : 'none' }} className="ellipsis">{ev.cancelled ? `Cancelled · ${ev.cancelled.reason || ''}` : needCover ? '⚠ needs cover' : ev.sub ? `Sub: ${ev.sub}` : t.teacher}{ev.done ? ' · ✓' : ''}</div>
                            </button>
                          );
                        })}
                        {!items.length && <button className="xs faint tt-add" style={{ flex: 1, border: 0, background: 'transparent' }} onClick={() => setSlot({ day: d, period: p.n })} aria-label="Add period">+</button>}
                      </div>
                    );
                  })}
                </Fragment>
              ))}
            </div>
          )}

          {view === 'Month' && (
            <div className="col gap-8" style={{ minWidth: 700 }}>
              <div className="row between"><span className="medium">October 2026</span><span className="xs muted">Click a day to open that week</span></div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
                {DAYS.map((n) => <div key={n} className="xs muted" style={{ padding: '0 6px' }}>{n}</div>)}
                {Array.from({ length: 3 }, (_, i) => <div key={'b' + i} />)}
                {Array.from({ length: 31 }, (_, i) => {
                  const date = `2026-10-${String(i + 1).padStart(2, '0')}`;
                  const wd = ((i + 3) % 7) + 1;
                  const paused = tt.pauses.find((p) => date >= p.from && date <= p.to);
                  const n = tt.workingDays.includes(wd) && !paused ? shown.filter((t) => t.day === wd).length : 0;
                  return (
                    <button key={date} onClick={() => setView('Week')} className="tile" style={{ minHeight: 74, textAlign: 'left', padding: 8, cursor: 'pointer', boxShadow: i === 8 ? 'inset 0 0 0 1.5px var(--text)' : 'none', opacity: tt.workingDays.includes(wd) ? 1 : 0.45 }}>
                      <div className="small medium">{i + 1}</div>
                      {paused ? <div className="xs" style={{ color: 'var(--warn)', marginTop: 6 }}>{paused.reason}</div> : n > 0 && <div className="xs muted" style={{ marginTop: 6 }}>{n} period{n > 1 ? 's' : ''}</div>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {view === 'Period grid' && (
            <div className="col gap-8" style={{ minWidth: 760 }}>
              <div className="small muted">Using “{timing.name}”. Click an empty cell to add a class.</div>
              <div style={{ display: 'grid', gridTemplateColumns: `150px repeat(${timing.periods.length}, minmax(90px, 1fr))`, gap: 6 }}>
                <div />
                {timing.periods.map((p, i) => <div key={i} className="xs medium" style={{ padding: 6, textAlign: 'center', background: p[0] === 'break' ? 'var(--warn-soft)' : 'transparent', borderRadius: 10 }}>{p[0] === 'break' ? 'Break' : `P${timing.periods.slice(0, i + 1).filter((x) => x[0] !== 'break').length}`}<div className="faint">{p[0] === 'break' ? `${p[1]}–${p[2]}` : `${p[0]}–${p[1]}`}</div></div>)}
                {db.classes.flatMap((c) => c.sections.map((sec) => [
                  <div key={c.id + sec} className="small medium" style={{ padding: '10px 6px' }}>{c.name} · {sec}</div>,
                  ...timing.periods.map((p, i) => {
                    if (p[0] === 'break') return <div key={c.id + sec + i} style={{ borderRadius: 10, background: 'var(--warn-soft)' }} />;
                    const pn = timing.periods.slice(0, i + 1).filter((x) => x[0] !== 'break').length;
                    const t = db.timetable.find((x) => x.day === gridDay && x.period === pn && x.classId === c.id && x.section === sec);
                    return <button key={c.id + sec + i} onClick={() => setSlot(t || { day: gridDay, period: pn, classId: c.id, section: sec })} className="tile" style={{ border: 0, padding: 6, minHeight: 44, textAlign: 'left', background: t ? 'var(--accent-soft)' : 'var(--surface-2)', fontSize: 11 }}>{t ? <><strong>{t.subject}</strong><div className="faint ellipsis">{t.teacher}</div></> : ''}</button>;
                  }),
                ]))}
              </div>
            </div>
          )}

          {view === 'Reports' && (() => {
            // Weeks in the range × weekly slots; pauses remove days; today's absences need cover.
            const weeks = Math.max(1, Math.round((new Date(rTo) - new Date(rFrom)) / 6048e5));
            const rows = teachers.map((t) => {
              const mine = db.timetable.filter((x) => x.teacher === t.name);
              const planned = mine.length * weeks;
              const evs = Object.entries(db.lessons || {}).map(([k, e]) => ({ slot: db.timetable.find((x) => x.id === k.split('@')[0]), date: k.split('@')[1], ...e })).filter((e) => e.slot && e.date >= rFrom && e.date <= rTo);
              const myEv = evs.filter((e) => e.slot.teacher === t.name);
              const waiting = mine.filter((x) => x.day >= 5 && needsCover(x, x.day)).length;
              const mins = mine.reduce((a, x) => { const p = periodOf(x.period); if (!p) return a; const [h1, m1] = p.start.split(':').map(Number); const [h2, m2] = p.end.split(':').map(Number); return a + (h2 * 60 + m2) - (h1 * 60 + m1); }, 0);
              return { t, planned, done: myEv.filter((e) => e.done).length, cancelled: myEv.filter((e) => e.cancelled).length, hours: (mins / 60).toFixed(1), unavailable: myEv.filter((e) => e.unavailable).length + (absentTeachers.includes(t.name) ? 1 : 0), covers: evs.filter((e) => e.sub === t.name).length, waiting };
            });
            const sum = (k) => rows.reduce((a, r) => a + r[k], 0);
            return (
              <div className="col gap-12">
                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
                  {[['Classes planned', sum('planned')], ['Marked done', sum('done')], ['Cancelled', sum('cancelled')], ['Covered by substitutes', sum('covers')], ['Still need cover', sum('waiting')]].map(([k, v]) => <div key={k} className="tile"><div className="k">{k}</div><div className="v" style={k === 'Still need cover' && v ? { color: 'var(--danger)' } : undefined}>{v}</div></div>)}
                </div>
                <div className="table-wrap"><table className="table"><thead><tr><th>Teacher</th><th className="num">Planned</th><th className="num">Marked done</th><th className="num">Cancelled</th><th className="num">Hours / week</th><th className="num">Unavailable</th><th className="num">Covers taken</th><th className="num">Waiting for cover</th></tr></thead>
                  <tbody>{rows.map((r) => <tr key={r.t.id}><td className="medium">{r.t.name}</td><td className="num">{r.planned}</td><td className="num">{r.done}</td><td className="num">{r.cancelled}</td><td className="num">{r.hours}</td><td className="num">{r.unavailable}</td><td className="num">{r.covers}</td><td className="num">{r.waiting ? <span className="pill danger">{r.waiting}</span> : 0}</td></tr>)}</tbody></table></div>
              </div>
            );
          })()}

          {view === 'Settings' && (
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
              <Widget icon="calendar" title="School week">
                <div className="row wrap gap-6">{DAYS.map((n, i) => { const d = i + 1; const on = tt.workingDays.includes(d); return <button key={n} className={cx('chip sm', on && 'on')} onClick={() => updateTT({ workingDays: on ? tt.workingDays.filter((x) => x !== d) : [...tt.workingDays, d].sort() })}>{n}</button>; })}</div>
                <div className="row between small"><span>Week starts on</span><select aria-label="Week starts on" className="select" value={tt.weekStart} onChange={(e) => updateTT({ weekStart: e.target.value })}><option>Monday</option><option>Sunday</option><option>Saturday</option></select></div>
                <div className="row between small"><span>School time zone</span><select aria-label="School time zone" className="select" value={tt.timezone} onChange={(e) => updateTT({ timezone: e.target.value })}>{['Asia/Karachi (PKT)', 'Asia/Dubai (GST)', 'Asia/Riyadh (AST)', 'Europe/London (GMT)', 'America/New_York (ET)'].map((z) => <option key={z}>{z}</option>)}</select></div>
                <div className="row between small"><span>Flag cover when a teacher is absent</span><OnOff value={tt.flagCover} onChange={(v) => updateTT({ flagCover: v })} /></div>
                <div className="row between small"><span>Cycle</span><div className="onoff"><button className={cx(tt.cycle === 'weekly' && 'on')} onClick={() => updateTT({ cycle: 'weekly' })}>Weekly</button><button className={cx(tt.cycle === 'days' && 'on')} onClick={() => updateTT({ cycle: 'days' })}>Day 1, Day 2…</button></div></div>
              </Widget>
              <Widget icon="clock" title="Timing sets" action={<Circle icon="plus" size="sm" label="Add timings" onClick={() => setTimingEdit({ name: '', days: 'Every day', isDefault: false, periods: [['08:00', '08:40'], ['08:40', '09:20'], ['break', '09:20', '09:40'], ['09:40', '10:20']] })} />}>
                {tt.timings.map((x) => {
                  const ps = x.periods.filter((p) => p[0] !== 'break');
                  return <div key={x.id} className="stack-card" style={{ marginTop: 0, cursor: 'pointer' }} onClick={() => setTimingEdit(x)}><span className="circle sm"><Icon name="clock" size={15} /></span><span className="grow"><span className="medium" style={{ display: 'block' }}>{x.name}{x.isDefault && <span className="pill ok" style={{ marginLeft: 6, height: 20, fontSize: 10 }}>Default</span>}</span><span className="xs muted">{x.days} · {ps.length} periods · {ps[0][0]} – {ps[ps.length - 1][1]}</span></span></div>;
                })}
              </Widget>
              <Widget icon="leave" title="Pauses" action={null}>
                <div className="xs muted">Regular classes don’t run on these dates (exams, events, holidays).</div>
                <form className="row wrap gap-6" onSubmit={(e) => { e.preventDefault(); if (!pause.reason.trim() || pause.to < pause.from) return; updateTT({ pauses: [...tt.pauses, { id: `P${Date.now()}`, ...pause }] }); toast(`Paused ${dateShort(pause.from)} – ${dateShort(pause.to)}`); setPause({ ...pause, reason: '' }); }}>
                  <input className="input" type="date" style={{ height: 40, flex: '1 1 130px' }} value={pause.from} onChange={(e) => setPause({ ...pause, from: e.target.value })} aria-label="Pause from" />
                  <input className="input" type="date" style={{ height: 40, flex: '1 1 130px' }} value={pause.to} onChange={(e) => setPause({ ...pause, to: e.target.value })} aria-label="Pause to" />
                  <input className="input" style={{ height: 40, flex: '2 1 160px' }} placeholder="Reason, e.g. Final exams" value={pause.reason} onChange={(e) => setPause({ ...pause, reason: e.target.value })} />
                  <Circle icon="plus" size="sm" label="Add pause" type="submit" />
                </form>
                {tt.pauses.map((p) => <div key={p.id} className="row between small" style={{ padding: '8px 0', borderTop: '1px solid var(--line)' }}><span>{p.reason}</span><span className="row gap-6 muted">{dateShort(p.from)} – {dateShort(p.to)}<Circle icon="close" size="xs" iconSize={11} label="Remove" onClick={() => updateTT({ pauses: tt.pauses.filter((x) => x.id !== p.id) })} /></span></div>)}
              </Widget>
              <Widget icon="pin" title="Rooms & labs">
                <div className="xs muted">A room can’t be booked twice at the same time.</div>
                <div className="row wrap gap-6">{tt.rooms.map((r) => <span key={r} className="tag" style={{ paddingRight: 4 }}>{r}<button className="icon-btn xs plain" aria-label={`Remove ${r}`} onClick={() => updateTT({ rooms: tt.rooms.filter((x) => x !== r) })}><Icon name="close" size={11} /></button></span>)}</div>
                <form className="row gap-6" onSubmit={(e) => { e.preventDefault(); const v = e.target.room.value.trim(); if (v) { updateTT({ rooms: [...tt.rooms, v] }); e.target.reset(); } }}><input name="room" className="input" style={{ height: 40, borderRadius: 999 }} placeholder="New room" /><Circle icon="plus" size="sm" label="Add room" type="submit" /></form>
              </Widget>
            </div>
          )}
        </div>
      </section>
      {timingEdit && <TimingModal value={timingEdit} onClose={() => setTimingEdit(null)} onSave={(v) => {
        const list = v.id ? tt.timings.map((x) => (x.id === v.id ? v : v.isDefault ? { ...x, isDefault: false } : x)) : [...tt.timings.map((x) => (v.isDefault ? { ...x, isDefault: false } : x)), { ...v, id: `TM${Date.now()}` }];
        updateTT({ timings: list }); toast(v.id ? 'Timings updated' : `${v.name} added`); setTimingEdit(null);
      }} onRemove={timingEdit.id && !timingEdit.isDefault ? () => { updateTT({ timings: tt.timings.filter((x) => x.id !== timingEdit.id) }); toast('Timings removed'); setTimingEdit(null); } : null} />}
      {lesson && <LessonModal slot={lesson.slot} date={dateOf(lesson.day)} day={lesson.day} ev={evOf(lesson.slot, lesson.day)} needCover={needsCover(lesson.slot, lesson.day)} teachers={teachers} classById={classById} timetable={db.timetable} lessons={db.lessons || {}}
        onUpdate={(patch) => updateLesson(`${lesson.slot.id}@${dateOf(lesson.day)}`, patch)}
        onUpdateOther={(slotId, d, patch) => updateLesson(`${slotId}@${d}`, patch)}
        onEdit={() => { setSlot(lesson.slot); setLesson(null); }}
        onDelete={() => { removeSlot(lesson.slot.id); toast('Slot deleted'); setLesson(null); }}
        onClose={() => setLesson(null)} />}
      {slot && <SlotModal slot={slot} onClose={() => setSlot(null)} onSave={(v) => { const secs = v.section === '*' ? db.classes.find((c) => c.id === v.classId).sections : [v.section]; secs.forEach((sec) => v.days.forEach((d) => addSlot({ ...v, section: sec, day: d }))); toast(`${v.days.length * secs.length} weekly period${v.days.length * secs.length > 1 ? 's' : ''} added`); setSlot(null); }} onRemove={(id) => { removeSlot(id); toast('Slot deleted'); setSlot(null); }} onUpdate={(id, patch) => { updateSlot(id, patch); toast('Slot updated'); setSlot(null); }} teachers={teachers} classes={db.classes} rooms={tt.rooms} />}
    </div>
  );
}

// How many lessons a slot creates between the two dates on the chosen weekdays.
function occurrences(v) {
  if (!v.from || !v.to || v.to < v.from) return 0;
  let n = 0;
  for (let d = new Date(v.from); d <= new Date(v.to); d.setDate(d.getDate() + 1)) { const wd = ((d.getDay() + 6) % 7) + 1; if (v.days.includes(wd)) n += 1; }
  return n;
}

function SlotModal({ slot, onClose, onSave, onRemove, onUpdate, teachers, classes, rooms }) {
  const existing = !!slot.id;
  const c0 = classes.find((c) => c.id === slot.classId) || classes[3];
  const [v, setV] = useState({ day: slot.day, period: slot.period, classId: c0.id, section: slot.section || c0.sections[0], subject: slot.subject || 'English', teacher: slot.teacher || teachers[0]?.name, room: slot.room || '', group: slot.group || '', coteachers: slot.coteachers || '', from: '2026-10-09', to: '2027-03-31', custom: false, start: '08:00', end: '08:40', days: [slot.day] });
  const cls = classes.find((c) => c.id === v.classId);
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  return (
    <Modal open onClose={onClose} wide title={existing ? `${slot.subject} · ${cls?.name} ${slot.section}` : 'New timetable slot'} sub={existing ? `${DAYS[slot.day - 1]} · Period ${slot.period} · ${slot.teacher}` : 'Repeat on several days at once'}
      footer={existing ? <><button className="btn danger" onClick={() => onRemove(slot.id)}><Icon name="trash" size={15} />Delete slot</button><div className="grow" /><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" onClick={() => onUpdate(slot.id, { subject: v.subject, teacher: v.teacher, classId: v.classId, section: v.section, period: v.period, room: v.room, group: v.group, coteachers: v.coteachers })}>Save changes</button></> : <><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" disabled={!v.days.length} onClick={() => onSave(v)}>Create {v.days.length} slot{v.days.length > 1 ? 's' : ''}</button></>}>
      <fieldset style={{ border: 0, padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="form-grid">
          <Field label="Subject / task"><input className="input" value={v.subject} onChange={set('subject')} /></Field>
          <Field label="Teacher"><select className="select" value={v.teacher} onChange={set('teacher')}>{teachers.map((t) => <option key={t.id}>{t.name}</option>)}</select></Field>
          <Field label="Class"><select className="select" value={v.classId} onChange={(e) => { const c = classes.find((x) => x.id === e.target.value); setV({ ...v, classId: c.id, section: c.sections[0] }); }}>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
          <Field label="Section"><select className="select" value={v.section} onChange={set('section')}>{!existing && <option value="*">All sections</option>}{cls?.sections.map((s) => <option key={s}>{s}</option>)}</select></Field>
          <Field label="From"><input className="input" type="date" value={v.from} onChange={set('from')} /></Field>
          <Field label="To"><input className="input" type="date" value={v.to} onChange={set('to')} /></Field>
          <Field label="Period"><select className="select" value={v.custom ? 'custom' : v.period} onChange={(e) => (e.target.value === 'custom' ? setV({ ...v, custom: true }) : setV({ ...v, custom: false, period: Number(e.target.value) }))}>{periods.map((p) => <option key={p.n} value={p.n}>Period {p.n} · {p.start}</option>)}<option value="custom">Custom time</option></select></Field>
          {v.custom && <Field label="Time"><div className="row gap-6"><input className="input" type="time" value={v.start} onChange={set('start')} /><input className="input" type="time" value={v.end} onChange={set('end')} /></div></Field>}
          <Field label="Room" optional><select className="select" value={v.room} onChange={set('room')}><option value="">No specific room</option>{rooms.map((r) => <option key={r}>{r}</option>)}</select></Field>
          <Field label="Group" optional hint="Groups of one class can run at the same time"><input className="input" value={v.group} onChange={set('group')} placeholder="e.g. Biology group" /></Field>
          <Field label="Co-teachers" optional span><input className="input" value={v.coteachers} onChange={set('coteachers')} placeholder="Names, comma separated" /></Field>
        </div>
        {!existing && (
          <div className="col gap-8"><span className="label">Repeat on</span>
            <div className="row wrap gap-6">{DAYS.map((n, i) => { const d = i + 1; const on = v.days.includes(d); return <button type="button" key={n} className={cx('chip sm', on && 'on')} onClick={() => setV({ ...v, days: on ? v.days.filter((x) => x !== d) : [...v.days, d] })}>{n}</button>; })}</div>
            <div className="xs muted">{occurrences(v)} occurrence{occurrences(v) === 1 ? '' : 's'} · {v.custom ? `${v.start} – ${v.end}` : `${periods.find((p) => p.n === v.period)?.start} – ${periods.find((p) => p.n === v.period)?.end}`}{v.section === '*' ? ` · all ${cls?.sections.length} sections` : ''}</div>
          </div>
        )}
      </fieldset>
    </Modal>
  );
}

function TimingModal({ value, onClose, onSave, onRemove }) {
  const [v, setV] = useState(value);
  const setP = (i, j, val) => setV({ ...v, periods: v.periods.map((p, k) => (k === i ? p.map((x, m) => (m === j ? val : x)) : p)) });
  const last = v.periods[v.periods.length - 1];
  const end = last ? last[last.length - 1] : '08:00';
  const plus = (t, m) => { const [h, mm] = t.split(':').map(Number); const x = h * 60 + mm + m; return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`; };
  return (
    <Modal open wide onClose={onClose} title={value.id ? value.name : 'New timings'} sub="Classes follow these times automatically on the chosen days"
      footer={<>{onRemove && <button className="btn danger" onClick={onRemove}><Icon name="trash" size={15} />Remove</button>}<div className="grow" /><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" disabled={!v.name.trim() || !v.periods.length} onClick={() => onSave(v)}>Save timings</button></>}>
      <div className="form-grid">
        <Field label="Name"><input className="input" autoFocus value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} placeholder="e.g. Ramadan timings" /></Field>
        <Field label="Used on"><select className="select" value={v.days} onChange={(e) => setV({ ...v, days: e.target.value })}>{['Every day', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Ramadan', 'Summer', 'Winter'].map((d) => <option key={d}>{d}</option>)}</select></Field>
      </div>
      <div className="row between" style={{ padding: '10px 14px', borderRadius: 16, background: 'var(--surface-2)' }}><span className="small">Default timings</span><OnOff value={v.isDefault} onChange={(x) => setV({ ...v, isDefault: x })} /></div>
      <div className="col gap-6">
        {v.periods.map((p, i) => {
          const brk = p[0] === 'break';
          const n = v.periods.slice(0, i + 1).filter((x) => x[0] !== 'break').length;
          return (
            <div key={i} className="row gap-8" style={{ padding: '6px 10px', borderRadius: 14, background: brk ? 'var(--warn-soft)' : 'var(--surface-2)' }}>
              <span className="small medium" style={{ width: 72 }}>{brk ? 'Break' : `Period ${n}`}</span>
              <input className="input" type="time" style={{ height: 36 }} value={brk ? p[1] : p[0]} onChange={(e) => setP(i, brk ? 1 : 0, e.target.value)} />
              <span className="muted">–</span>
              <input className="input" type="time" style={{ height: 36 }} value={brk ? p[2] : p[1]} onChange={(e) => setP(i, brk ? 2 : 1, e.target.value)} />
              <div className="grow" />
              <Circle icon="close" size="xs" iconSize={11} label="Remove row" onClick={() => setV({ ...v, periods: v.periods.filter((_, k) => k !== i) })} />
            </div>
          );
        })}
        <div className="row gap-8">
          <button className="btn sm ghost" onClick={() => setV({ ...v, periods: [...v.periods, [end, plus(end, 40)]] })}><Icon name="plus" size={14} />Period</button>
          <button className="btn sm ghost" onClick={() => setV({ ...v, periods: [...v.periods, ['break', end, plus(end, 20)]] })}><Icon name="plus" size={14} />Break</button>
        </div>
      </div>
    </Modal>
  );
}

// A single lesson (a slot on one date), with the actions the live app has:
// held/done + notes, teacher unavailable → pick a substitute, move, cancel, edit, delete.
function LessonModal({ slot, date, day, ev, needCover, teachers, classById, timetable, lessons, onUpdate, onUpdateOther, onEdit, onDelete, onClose }) {
  const { toast } = useSchool();
  const [mode, setMode] = useState(null); // 'move' | 'cancel' | 'unavailable'
  const [notes, setNotes] = useState(ev.notes || '');
  const [done, setDone] = useState(!!ev.done);
  const [reason, setReason] = useState('');
  const [scope, setScope] = useState('one');
  const [move, setMove] = useState({ date, teacher: slot.teacher, start: periodOf(slot.period)?.start || '08:00', end: periodOf(slot.period)?.end || '08:40', note: '' });
  const p = periodOf(slot.period);
  const teacherNow = ev.sub || slot.teacher;
  // Free teachers first, then subject match, then fewest covers this month.
  const covers = (name) => Object.values(lessons).filter((e) => e.sub === name).length;
  const ranked = teachers.filter((t) => t.name !== slot.teacher && t.type === 'teacher').map((t) => {
    const that = timetable.filter((x) => x.teacher === t.name && x.day === day);
    return { t, free: !that.some((x) => x.period === slot.period), classes: that.length, covers: covers(t.name), match: t.subject === slot.subject };
  }).sort((a, b) => (b.free - a.free) || (b.match - a.match) || (a.covers - b.covers));
  const tags = [ev.sub && ['Substitute', 'info'], needCover && ['Needs cover', 'danger'], ev.done && ['Done', 'ok'], ev.cancelled && ['Cancelled', 'outline'], ev.moved && ['Moved', 'warn']].filter(Boolean);
  return (
    <Modal open onClose={onClose} title={`${slot.subject}${slot.group ? ` · ${slot.group}` : ''}`} sub={`${DAYS[day - 1]}, ${dateShort(date)} · ${p?.start} – ${p?.end}`}
      footer={<><button className="btn danger" onClick={onDelete}><Icon name="trash" size={15} />Delete slot</button><div className="grow" /><button className="btn ghost" onClick={onEdit}>Edit slot</button><button className="btn primary" onClick={() => { onUpdate({ notes, done, doneAt: done && !ev.done ? new Date().toISOString() : ev.doneAt }); toast(done && !ev.done ? 'Marked as done' : 'Lesson saved'); onClose(); }}>Save</button></>}>
      {tags.length > 0 && <div className="row wrap gap-6">{tags.map(([l, t]) => <span key={l} className={`pill ${t}`}>{l}</span>)}</div>}
      <dl className="student-dl">
        <div><dt>Class</dt><dd>{classById[slot.classId]?.name} · {slot.section}{slot.room ? ` · ${slot.room}` : ''}</dd></div>
        <div><dt>Teacher</dt><dd>{teacherNow}{ev.sub ? ` (covering for ${slot.teacher})` : ''}</dd></div>
        {ev.moved && <div><dt>Moved to</dt><dd>{dateShort(ev.moved.date)} · {ev.moved.start}–{ev.moved.end}{ev.moved.teacher !== slot.teacher ? ` · ${ev.moved.teacher}` : ''}</dd></div>}
        {ev.cancelled && <div><dt>Cancelled</dt><dd>{ev.cancelled.reason || 'No reason'}</dd></div>}
      </dl>
      {ev.cancelled && <button className="btn sm" style={{ alignSelf: 'flex-start' }} onClick={() => { onUpdate({ cancelled: null }); toast('Class restored'); }}><Icon name="refresh" size={14} />Restore class</button>}

      {!ev.cancelled && !mode && (
        <div className="row wrap gap-6">
          <button className="btn sm ghost" onClick={() => setMode('move')}><Icon name="calendar" size={14} />Move this class</button>
          <button className="btn sm ghost" onClick={() => setMode('cancel')}><Icon name="close" size={14} />Cancel this class</button>
          {!ev.unavailable && <button className="btn sm ghost" onClick={() => setMode('unavailable')}><Icon name="leave" size={14} />Mark teacher unavailable</button>}
        </div>
      )}
      {mode === 'move' && (
        <div className="lesson-panel">
          <div className="form-grid">
            <Field label="New date"><input className="input" type="date" value={move.date} onChange={(e) => setMove({ ...move, date: e.target.value })} /></Field>
            <Field label="Teacher"><select className="select" value={move.teacher} onChange={(e) => setMove({ ...move, teacher: e.target.value })}>{teachers.map((t) => <option key={t.id}>{t.name}</option>)}</select></Field>
            <Field label="Start"><input className="input" type="time" value={move.start} onChange={(e) => setMove({ ...move, start: e.target.value })} /></Field>
            <Field label="End"><input className="input" type="time" value={move.end} onChange={(e) => setMove({ ...move, end: e.target.value })} /></Field>
            <Field label="Note" optional span><input className="input" value={move.note} onChange={(e) => setMove({ ...move, note: e.target.value })} /></Field>
          </div>
          <div className="row gap-6"><button className="btn sm ghost" onClick={() => setMode(null)}>Back</button><button className="btn sm" onClick={() => { onUpdate({ moved: move }); toast('Class moved'); setMode(null); }}>Move class</button></div>
        </div>
      )}
      {mode === 'cancel' && (
        <div className="lesson-panel">
          <Field label="Reason for cancelling"><input className="input" autoFocus value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Sports day, school trip…" /></Field>
          <div className="row gap-6"><button className="btn sm ghost" onClick={() => setMode(null)}>Back</button><button className="btn sm" disabled={!reason.trim()} onClick={() => { onUpdate({ cancelled: { reason, at: new Date().toISOString() } }); toast('Class cancelled'); onClose(); }}>Cancel class</button></div>
        </div>
      )}
      {mode === 'unavailable' && (
        <div className="lesson-panel">
          <Field label="Reason"><input className="input" autoFocus value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Sick leave, attending a workshop…" /></Field>
          <div className="onoff" style={{ alignSelf: 'flex-start' }}><button className={cx(scope === 'one' && 'on')} onClick={() => setScope('one')}>Only this class</button><button className={cx(scope === 'all' && 'on')} onClick={() => setScope('all')}>All {slot.teacher}'s classes that day</button></div>
          <div className="row gap-6"><button className="btn sm ghost" onClick={() => setMode(null)}>Cancel</button><button className="btn sm" disabled={!reason.trim()} onClick={() => {
            const info = { reason, at: new Date().toISOString(), scope };
            if (scope === 'all') timetable.filter((x) => x.teacher === slot.teacher && x.day === day).forEach((x) => onUpdateOther(x.id, date, { unavailable: info }));
            else onUpdate({ unavailable: info });
            toast('Reported · timetable managers notified'); setMode(null);
          }}>Report unavailable</button></div>
        </div>
      )}
      {ev.unavailable && !ev.cancelled && (
        <div className="lesson-panel">
          <div className="small">{ev.sub ? <>Covered by <b>{ev.sub}</b>. </> : null}{slot.teacher} can’t take this class. Reason: {ev.unavailable.reason}</div>
          <div className="xs muted">{ev.sub ? 'Change substitute' : 'Pick a substitute'} — free teachers first, then subject match and fewest covers this month.</div>
          {ranked.map(({ t, free, classes, covers: c, match }) => (
            <button key={t.id} className={cx('stack-card', ev.sub === t.name && 'sel-tile')} style={{ marginTop: 0, cursor: 'pointer' }} onClick={() => { onUpdate({ sub: t.name }); toast(`${t.name} assigned`); }}>
              <span className="grow"><span className="medium small" style={{ display: 'block' }}>{t.name}{match ? ' · same subject' : ''}</span><span className="xs muted">{classes} class{classes === 1 ? '' : 'es'} that day · {c} cover{c === 1 ? '' : 's'} this month</span></span>
              <span className={`pill ${free ? 'ok' : 'warn'}`}>{free ? 'Free' : 'Busy'}</span>
            </button>
          ))}
          {!ev.sub && <button className="link xs" style={{ alignSelf: 'flex-start' }} onClick={() => { onUpdate({ unavailable: null }); toast('Unavailability cancelled'); }}>Cancel unavailability</button>}
        </div>
      )}
      <div className="row between" style={{ padding: '10px 14px', borderRadius: 16, background: 'var(--surface-2)' }}><span className="small">This slot was held / task done</span><OnOff value={done} onChange={setDone} /></div>
      <Field label="Notes" optional><textarea className="textarea" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
      {ev.doneAt && <div className="xs muted">Marked done {new Date(ev.doneAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>}
    </Modal>
  );
}
