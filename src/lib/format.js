export const fmt = (n) => Math.round(Number(n) || 0).toLocaleString('en-US');
export const pkr = (n) => `${fmt(n)} PKR`;
export const compact = (n) => {
  const v = Math.abs(n);
  if (v >= 100000) return `${(n / 100000).toFixed(v >= 1000000 ? 1 : 2).replace(/\.0+$/, '')} Lac`;
  if (v >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(n);
};

export const initials = (name = '') => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const avClass = (key = '') => {
  let h = 0;
  for (const c of key) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return `c${(h % 4) + 1}`;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const parse = (d) => (d instanceof Date ? d : new Date(d.length === 10 ? d + 'T00:00' : d));
export const dateShort = (d) => { if (!d) return '—'; const x = parse(d); return `${String(x.getDate()).padStart(2, '0')} ${MONTHS[x.getMonth()]} ${x.getFullYear()}`; };
export const dayMonth = (d) => { const x = parse(d); return `${x.getDate()} ${MONTHS[x.getMonth()]}`; };
export const time = (d) => { const x = parse(d); let h = x.getHours(); const m = String(x.getMinutes()).padStart(2, '0'); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return `${h}:${m} ${ap}`; };
export const dateLong = (d) => { const x = parse(d); return `${DAYS[x.getDay()]}, ${x.getDate()} ${MONTHS_LONG[x.getMonth()]} ${x.getFullYear()}`; };
export const monthName = (i) => MONTHS_LONG[i];
export const monthShort = (i) => MONTHS[i];
export const weekday = (d) => DAYS[parse(d).getDay()].slice(0, 3);

// Demo clock: the demo is frozen on Fri 9 Oct 2026, 09:30, and moves forward in real time from page load.
const LOADED = Date.now();
export const demoNow = () => new Date(new Date('2026-10-09T09:30').getTime() + (Date.now() - LOADED));
export const demoIso = () => { const d = demoNow(); const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; };

export const relative = (d, now = demoNow()) => {
  const x = parse(d);
  const mins = Math.round((now - x) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return dateShort(x);
};

export const pct = (a, b) => (b ? (a / b) * 100 : 0);
export const cx = (...a) => a.filter(Boolean).join(' ');
