import { tools } from '../data/tools.js';

const SITE = 'https://textwizard.us';

// Public, canonical URLs only: the landing page, each tool page, and privacy.
export function GET() {
  const urls = [
    { loc: `${SITE}/`, changefreq: 'weekly', priority: '1.0' },
    ...tools.map((t) => ({ loc: `${SITE}/tools/${t.id}`, changefreq: 'monthly', priority: '0.8' })),
    { loc: `${SITE}/privacy`, changefreq: 'yearly', priority: '0.3' },
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
