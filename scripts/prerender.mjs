// Writes dist/site/index.html with the home page already rendered and its
// SEO tags in <head>, so crawlers and link previews see real content.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const dist = path.resolve('dist');
const { render } = await import(pathToFileURL(path.resolve('dist-ssr/entry-server.js')).href);
const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');

for (const route of ['/site']) {
  const { html, head } = render(route);
  const page = template
    .replace(/<title>.*?<\/title>/, head)
    .replace('<html lang="en">', '<html lang="en-PK">')
    .replace('<div id="root"></div>', `<div id="root">${html}</div>`);
  const out = path.join(dist, route.slice(1), 'index.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, page);
  console.log(`prerendered ${route} → ${path.relative(process.cwd(), out)} (${(page.length / 1024).toFixed(0)} KB)`);
}
fs.rmSync(path.resolve('dist-ssr'), { recursive: true, force: true });
