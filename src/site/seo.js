// SEO for the marketing pages. Used at runtime (useSeo) and at build time
// (scripts/prerender.mjs writes the same tags into static HTML).
import { useEffect } from 'react';
import { FAQ } from './data.js';

export const SITE = 'https://www.schooliee.com';

export const PAGES = {
  '/site': {
    title: 'Schooliee — School Management System in Pakistan | Fees, Attendance & WhatsApp',
    description: 'Collect fees, mark attendance and message parents on WhatsApp from one system built for Pakistani schools. We move your registers in for free. From Rs 5 per student a month.',
    canonical: `${SITE}/`,
  },
  '/sign-up': {
    title: 'Build your school — Schooliee',
    description: 'Set up your school on Schooliee in about 10 minutes. Pick the features you need and see the price before you commit.',
    canonical: `${SITE}/sign-up/`,
  },
};

export function jsonLd() {
  return [
    {
      '@context': 'https://schema.org', '@type': 'Organization', name: 'Schooliee', url: SITE, logo: `${SITE}/logo/logo-single.webp`,
      contactPoint: { '@type': 'ContactPoint', telephone: '+92-302-7987128', contactType: 'sales', areaServed: 'PK', availableLanguage: ['English', 'Urdu'] },
    },
    {
      '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Schooliee', applicationCategory: 'BusinessApplication', operatingSystem: 'Web, Android, Windows',
      description: PAGES['/site'].description,
      offers: { '@type': 'AggregateOffer', priceCurrency: 'PKR', lowPrice: '5', highPrice: '20', offerCount: '3', description: 'Per active student per month' },
    },
    {
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    },
  ];
}

// Plain HTML <head> tags for a page.
export function headTags(path) {
  const p = PAGES[path];
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  return [
    `<title>${esc(p.title)}</title>`,
    `<meta name="description" content="${esc(p.description)}" />`,
    `<link rel="canonical" href="${p.canonical}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="Schooliee" />`,
    `<meta property="og:title" content="${esc(p.title)}" />`,
    `<meta property="og:description" content="${esc(p.description)}" />`,
    `<meta property="og:url" content="${p.canonical}" />`,
    `<meta property="og:locale" content="en_PK" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="theme-color" content="#F3F2EC" />`,
    path === '/site' ? `<script type="application/ld+json">${JSON.stringify(jsonLd())}</script>` : '',
  ].join('\n    ');
}

// Keeps <head> right when navigating inside the app.
export function useSeo(path) {
  useEffect(() => {
    const p = PAGES[path]; if (!p) return;
    document.title = p.title;
    const meta = (sel, attr, val) => {
      let el = document.head.querySelector(sel);
      if (!el) { el = document.createElement(sel.startsWith('link') ? 'link' : 'meta'); document.head.appendChild(el); }
      Object.entries(attr).forEach(([k, v]) => el.setAttribute(k, v));
      if (val !== undefined) el.setAttribute('content', val);
    };
    meta('meta[name="description"]', { name: 'description' }, p.description);
    meta('link[rel="canonical"]', { rel: 'canonical', href: p.canonical });
    meta('meta[property="og:title"]', { property: 'og:title' }, p.title);
    meta('meta[property="og:description"]', { property: 'og:description' }, p.description);
    if (path === '/site' && !document.getElementById('ld-site')) {
      const s = document.createElement('script'); s.type = 'application/ld+json'; s.id = 'ld-site'; s.textContent = JSON.stringify(jsonLd()); document.head.appendChild(s);
    }
  }, [path]);
}
