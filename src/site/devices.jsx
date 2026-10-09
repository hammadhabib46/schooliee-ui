// Still device frames whose screens move. The laptop shows the real Schooliee
// dashboard (this app, in an iframe) and switches pages without reloading.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const APP_W = 1440, APP_H = 900;
const ease = [0.2, 0.75, 0.15, 1];

function useWidth(ref) {
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const on = () => setW(el.clientWidth);
    on();
    const ro = new ResizeObserver(on); ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

// The live dashboard, scaled to fit its box. Route changes are pushed into the
// iframe's own history so the app re-renders instantly instead of reloading.
export function AppScreen({ route = '/', label = 'Schooliee dashboard' }) {
  const box = useRef(null);
  const frame = useRef(null);
  const first = useRef(route);
  const [ready, setReady] = useState(false);
  const w = useWidth(box);
  useEffect(() => {
    const win = frame.current?.contentWindow;
    if (!ready || !win) return;
    try {
      if (win.location.pathname === route) return;
      win.history.pushState({}, '', route);
      win.dispatchEvent(new PopStateEvent('popstate'));
      win.scrollTo(0, 0);
    } catch { /* cross-origin in some previews — ignore */ }
  }, [route, ready]);
  const s = w ? w / APP_W : 0;
  return (
    <div ref={box} className="app-screen" style={{ height: w ? APP_H * s : undefined }}>
      <iframe
        ref={frame} src={first.current} title={label} tabIndex={-1} aria-hidden="true" scrolling="no" loading="eager"
        onLoad={() => setReady(true)}
        style={{ width: APP_W, height: APP_H, transform: `scale(${s})`, opacity: ready ? 1 : 0 }}
      />
      {!ready && <span className="app-screen-wait" />}
    </div>
  );
}

export function Laptop({ children, className = '' }) {
  return (
    <div className={`dev-laptop ${className}`}>
      <div className="dev-laptop-lid"><span className="dev-cam" /><div className="dev-laptop-screen">{children}</div></div>
      <div className="dev-laptop-base"><span /></div>
    </div>
  );
}

// Static phone; children is a 300×640 .ps screen. Bezel and corner radius are
// derived from the measured width so the frame looks the same at any size.
export function Phone({ children, className = '', style }) {
  const box = useRef(null);
  const w = useWidth(box);
  const bezel = Math.max(5, Math.round(w * 0.035));
  const r = Math.round(w * 0.135);
  return (
    <div className={`dev-phone ${className}`} style={{ ...style, padding: bezel, borderRadius: r + bezel }}>
      <div ref={box} className="dev-phone-screen" style={{ borderRadius: r, height: w ? (w * 640) / 300 : undefined }}>
        <div style={{ transform: `scale(${w ? w / 300 : 0.001})`, transformOrigin: '0 0', width: 300, height: 640 }}>{children}</div>
      </div>
    </div>
  );
}

// One frame that morphs between a laptop and a phone. Both screens stay mounted
// so the dashboard never reloads; only the frame and the visible layer change.
export function DeviceMorph({ kind, route, phone }) {
  const stage = useRef(null);
  const [size, setSize] = useState({ w: 560, h: 640 });
  useLayoutEffect(() => {
    const el = stage.current; if (!el) return;
    const on = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    on(); const ro = new ResizeObserver(on); ro.observe(el); return () => ro.disconnect();
  }, []);
  const lw = Math.min(size.w - 60, (size.h - 90) * 1.6);
  const lh = lw / 1.6;
  const ph = Math.min(size.h - 40, 640);
  const pw = ph * 300 / 640;
  const laptop = kind === 'laptop';
  const t = { duration: 0.75, ease };
  return (
    <div ref={stage} className="dev-morph">
      <motion.div className="dev-morph-frame" initial={false}
        animate={laptop ? { width: lw + 20, height: lh + 20, borderRadius: 18, y: -20 } : { width: pw + 20, height: ph + 20, borderRadius: 46, y: 0 }} transition={t}>
        <div className="dev-morph-screen" style={{ borderRadius: laptop ? 8 : 36 }}>
          <motion.div className="dev-morph-layer" initial={false} animate={{ opacity: laptop ? 1 : 0, scale: laptop ? 1 : 0.92 }} transition={t} style={{ width: lw }}>
            <AppScreen route={route} />
          </motion.div>
          <motion.div className="dev-morph-layer phone" initial={false} animate={{ opacity: laptop ? 0 : 1, scale: laptop ? 1.08 : 1 }} transition={t} style={{ width: pw, height: ph }}>
            <div style={{ transform: `scale(${pw / 300})`, transformOrigin: '0 0', width: 300, height: 640 }}>{phone}</div>
          </motion.div>
        </div>
        <motion.span className="dev-morph-island" initial={false} animate={{ opacity: laptop ? 0 : 1 }} transition={t} />
      </motion.div>
      <motion.div className="dev-morph-base" initial={false} animate={{ opacity: laptop ? 1 : 0, width: laptop ? lw + 70 : pw, x: '-50%', y: laptop ? lh / 2 - 10 : ph / 2 }} transition={t} />
    </div>
  );
}
