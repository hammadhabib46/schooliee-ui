// Build-time render of the marketing pages (see scripts/prerender.mjs).
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import Home from './Home.jsx';
import { headTags } from './seo.js';

export function render(path) {
  const html = renderToString(<StaticRouter location={path}><Home /></StaticRouter>);
  return { html, head: headTags(path) };
}
