import Icon from './Icon.jsx';
import { useStore } from '../lib/store.jsx';

export default function Toasts() {
  const { toasts, dismissToast } = useStore();
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="toast">
          <span className="tick"><Icon name={t.icon || 'check'} size={14} stroke={2.6} /></span>
          {t.text}
          {t.undo ? (
            <button onClick={() => { t.undo(); dismissToast(t.id); }}>Undo</button>
          ) : (
            <button onClick={() => dismissToast(t.id)} aria-label="Dismiss"><Icon name="close" size={12} stroke={2.4} /></button>
          )}
        </div>
      ))}
    </div>
  );
}
