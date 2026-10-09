// Client-side files for the demo: real CSV downloads and print-to-PDF.
// With the backend connected, swap these for server-generated files.

const esc = (v) => {
  const s = String(v ?? '').replace(/\s+/g, ' ').trim();
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function downloadCsv(name, rows) {
  const text = '﻿' + rows.map((r) => r.map(esc).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  const clean = name.replace(/\b(exported|export|ready|downloading|downloaded|to excel|as csv|as pdf|pdf)\b/gi, '').replace(/·.*$/, '');
  a.download = `schooliee-${clean.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'export'}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

const cellText = (c) => { const k = c.cloneNode(true); k.querySelectorAll('.av, .sr-only, button.icon-btn, .circle').forEach((x) => x.remove()); const w = document.createTreeWalker(k, NodeFilter.SHOW_TEXT); const out = []; while (w.nextNode()) out.push(w.currentNode.nodeValue); return out.join(' '); };

// Exports what the user is looking at: every table on the open dialog or page,
// or the visible cards when the page has no table.
export function exportCsv(name) {
  const root = document.querySelector('.modal, .drawer') || document.querySelector('.page') || document.body;
  const tables = [...root.querySelectorAll('table')];
  let rows = [];
  if (tables.length) {
    tables.forEach((t, i) => {
      if (i) rows.push([]);
      t.querySelectorAll('tr').forEach((tr) => rows.push([...tr.querySelectorAll('th,td')].map(cellText)));
    });
  } else {
    root.querySelectorAll('article, .stack-card, .widget .tile').forEach((el) => rows.push(el.innerText.split('\n').filter(Boolean)));
  }
  downloadCsv(name, rows.length ? rows : [['No rows']]);
}

// Opens the browser print dialog (Save as PDF) for the current view; print CSS hides the app chrome.
export function printView() {
  setTimeout(() => window.print(), 150);
}

// Prints generated pages (ID cards, slips, forms) through a hidden frame.
export function printHtml(title, pages) {
  const f = document.createElement('iframe');
  f.style.cssText = 'position:fixed;width:0;height:0;border:0;right:0;bottom:0';
  document.body.appendChild(f);
  const d = f.contentDocument;
  d.open();
  d.write(`<!doctype html><title>${title}</title><style>body{font:13px system-ui,sans-serif;color:#141414;margin:24px}.pg{break-after:page;border:1px solid #ddd;border-radius:12px;padding:18px;margin-bottom:16px}.pg h2{margin:0 0 8px;font-size:16px}.row{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #eee}</style>${pages.join('')}`);
  d.close();
  setTimeout(() => { f.contentWindow.print(); setTimeout(() => f.remove(), 1000); }, 200);
}

// ---------- ID cards as a ZIP of PNGs (front + back), like the live app ----------
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (b) => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };

// Minimal ZIP writer (stored, no compression): enough for PNGs, which are already compressed.
export function makeZip(files) {
  const enc = new TextEncoder();
  const parts = []; const central = []; let offset = 0;
  files.forEach(({ name, data }) => {
    const nm = enc.encode(name); const crc = crc32(data);
    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint32(14, crc, true);
    h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, nm.length, true);
    parts.push(new Uint8Array(h.buffer), nm, data);
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint32(16, crc, true);
    c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, nm.length, true); c.setUint32(42, offset, true);
    central.push(new Uint8Array(c.buffer), nm);
    offset += 30 + nm.length + data.length;
  });
  const size = central.reduce((a, p) => a + p.length, 0);
  const e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true);
  e.setUint32(12, size, true); e.setUint32(16, offset, true);
  return new Blob([...parts, ...central, new Uint8Array(e.buffer)], { type: 'application/zip' });
}

async function cardPng({ school, title, name, lines, side, landscape }) {
  const [w, h] = landscape ? [1012, 638] : [638, 1012];
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const g = cv.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#141414'; g.fillRect(0, 0, w, 120);
  g.fillStyle = '#C6EC5B'; g.font = '600 34px system-ui, sans-serif'; g.fillText(school, 36, 72);
  g.fillStyle = '#141414';
  if (side === 'front') {
    g.fillStyle = '#E9E9E3'; g.beginPath(); g.arc(w / 2, 280, 110, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#141414'; g.font = '600 72px system-ui, sans-serif'; g.textAlign = 'center';
    g.fillText(name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase(), w / 2, 305);
    g.font = '600 44px system-ui, sans-serif'; g.fillText(name, w / 2, 460);
    g.font = '28px system-ui, sans-serif'; g.fillStyle = '#555';
    lines.forEach((l, i) => g.fillText(l, w / 2, 520 + i * 44));
    g.font = '600 22px system-ui, sans-serif'; g.fillStyle = '#141414'; g.fillText(title.toUpperCase(), w / 2, h - 40);
  } else {
    g.textAlign = 'left'; g.font = '26px system-ui, sans-serif'; g.fillStyle = '#333';
    ['If found, please return to:', school, 'This card is property of the school.', 'Valid for session 2026 – 27'].forEach((l, i) => g.fillText(l, 36, 200 + i * 48));
    for (let i = 0; i < 40; i++) { g.fillStyle = i % 3 ? '#141414' : '#fff'; g.fillRect(36 + i * 9, h - 160, 6, 100); }
  }
  const blob = await new Promise((r) => cv.toBlob(r, 'image/png'));
  return new Uint8Array(await blob.arrayBuffer());
}

export async function downloadIdCardsZip({ school, title, people, sides = 'both', landscape = false }) {
  const files = [];
  for (const p of people) {
    const safe = `${p.code}-${p.name}`.replace(/[^\w-]+/g, '_');
    files.push({ name: `${safe}-front.png`, data: await cardPng({ school, title, name: p.name, lines: p.lines, side: 'front', landscape }) });
    if (sides === 'both') files.push({ name: `${safe}-back.png`, data: await cardPng({ school, title, name: p.name, lines: p.lines, side: 'back', landscape }) });
  }
  const url = URL.createObjectURL(makeZip(files));
  const a = document.createElement('a'); a.href = url; a.download = `schooliee-${title.toLowerCase().replace(/\W+/g, '-')}.zip`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
  return files.length;
}
