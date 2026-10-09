import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';

export default function NotFound() {
  return (
    <div className="page" style={{ alignItems: 'center', textAlign: 'center', paddingTop: 80 }}>
      <span className="rail-logo" style={{ width: 72, height: 72, borderRadius: 24 }}><Icon name="search" size={30} /></span>
      <h1 className="h1 sm" style={{ marginTop: 16 }}>Nothing here</h1>
      <p className="page-sub">This page moved or never existed. Try search — press <span className="kbd">/</span></p>
      <Link to="/" className="btn primary mt-16">Back to Today</Link>
    </div>
  );
}
