// §15 verification harness — headless Chromium exercising the built site under
// the REAL deployed CSP. It parses the `/*` header block out of public/_headers,
// serves dist/ locally with those exact headers, and loads every page while
// watching for console errors and CSP violations. Expected offline/analytics
// noise (the self-hosted Plausible host is unreachable in CI) is treated as pass;
// anything else fails the run.
//
// Usage:  npm run build && node test/csp-harness.mjs
// Browser: provided by `npx playwright install chromium` (CI) or a local install.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { join, extname, resolve as resolvePath } from 'node:path';

const ROOT = resolvePath(process.cwd(), 'dist');
const HEADERS_FILE = resolvePath(process.cwd(), 'public', '_headers');
const SHOTS = process.env.HARNESS_SHOTS ? resolvePath(process.cwd(), 'test', 'screenshots') : null;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

if (!existsSync(ROOT)) { console.error('dist/ not found — run `npm run build` first.'); process.exit(2); }

// --- Parse the global (/*) header block out of _headers ---
function parseGlobalHeaders(txt) {
  const headers = {};
  let inGlobal = false;
  for (const line of txt.split('\n')) {
    if (/^\S/.test(line)) inGlobal = line.trim() === '/*';
    else if (inGlobal && line.trim()) {
      const i = line.indexOf(':');
      if (i > 0) headers[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }
  }
  return headers;
}
const GLOBAL_HEADERS = parseGlobalHeaders(readFileSync(HEADERS_FILE, 'utf8'));
if (!GLOBAL_HEADERS['Content-Security-Policy']) { console.error('No CSP found in _headers /* block.'); process.exit(2); }
console.log('Serving dist/ under _headers:', Object.keys(GLOBAL_HEADERS).join(', '));

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json', '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8',
  '.woff2': 'font/woff2', '.woff': 'font/woff',
};

function resolveFile(urlPath) {
  let p = decodeURIComponent(urlPath.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const f = join(ROOT, p);
  if (existsSync(f) && statSync(f).isFile()) return f;
  if (existsSync(f + '.html')) return f + '.html';               // clean URL -> .html (CF Pages)
  if (existsSync(f) && statSync(f).isDirectory()) {
    const idx = join(f, 'index.html');
    if (existsSync(idx)) return idx;
  }
  return null;
}

const server = createServer((req, res) => {
  const f = resolveFile(req.url);
  for (const [k, v] of Object.entries(GLOBAL_HEADERS)) res.setHeader(k, v);
  if (!f) {
    res.statusCode = 404;
    const nf = join(ROOT, '404.html');
    if (existsSync(nf)) { res.setHeader('content-type', TYPES['.html']); res.end(readFileSync(nf)); } else res.end('404');
    return;
  }
  res.setHeader('content-type', TYPES[extname(f)] || 'application/octet-stream');
  res.end(readFileSync(f));
});

await new Promise((r) => server.listen(0, r));
const BASE = `http://localhost:${server.address().port}`;

// Tolerated offline/analytics noise (self-hosted Plausible is unreachable here).
const EXPECTED = [/plausible\.thompsonblack\.us/i, /ERR_NAME_NOT_RESOLVED/i, /ERR_CONNECTION/i, /net::ERR/i];
const isExpected = (s) => EXPECTED.some((re) => re.test(s));

// CHROMIUM_PATH lets a host with a pre-installed browser skip Playwright's
// download (CI uses `npx playwright install chromium` and leaves this unset).
const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox'],
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
});
const problems = [];
const cspViolations = [];

async function visit(path, { widths = [], interact = null, allow404 = false } = {}) {
  const page = await browser.newPage();
  const local = [];
  const ok404 = (t) => allow404 && /Failed to load resource.*status of 404/i.test(t);
  page.on('console', (m) => { if (m.type() === 'error') { const t = m.text(); if (!isExpected(t) && !ok404(t)) local.push(`[console] ${t}`); } });
  page.on('pageerror', (e) => { const t = String(e); if (!isExpected(t)) local.push(`[pageerror] ${t}`); });
  page.on('requestfailed', (r) => { const t = `${r.url()} ${r.failure()?.errorText || ''}`; if (!isExpected(t)) local.push(`[reqfail] ${t}`); });
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (e) => {
      (window.__csp = window.__csp || []).push(`${e.violatedDirective} blocked ${e.blockedURI}`);
    });
  });
  const resp = await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 20000 }).catch((e) => { local.push(`[nav] ${e.message}`); return null; });
  await page.waitForTimeout(300);
  (await page.evaluate(() => window.__csp || [])).forEach((v) => { if (!isExpected(v)) cspViolations.push(`${path}: ${v}`); });

  let extra = '';
  if (interact) extra = await interact(page).catch((e) => `interact-error: ${e.message}`);
  if (SHOTS) for (const w of widths) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.waitForTimeout(150);
    await page.screenshot({ path: join(SHOTS, `${(path.replace(/\//g, '_') || 'home')}-${w}.png`) });
  }
  const verdict = local.length ? 'FAIL' : 'ok';
  console.log(`${verdict.padEnd(4)} ${path.padEnd(22)} [${resp ? resp.status() : 'ERR'}] ${extra}`);
  local.forEach((l) => console.log('     ' + l));
  if (local.length) problems.push(...local.map((l) => `${path} ${l}`));
  await page.close();
}

await visit('/', {
  widths: [679, 979, 1400],
  interact: async (page) => {
    const before = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    await page.click('#theme-toggle');
    const after = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    const pressed = await page.getAttribute('#theme-toggle', 'aria-pressed');
    const cards = await page.locator('.tool-card').count();
    return `theme ${before}->${after}, aria-pressed=${pressed}, ${cards} cards`;
  },
});
await visit('/tools/text-tools', { interact: async (p) => { await p.waitForTimeout(400); return `feature mounted=${await p.evaluate(() => !!document.querySelector('#feature-root')?.children.length)}`; } });
await visit('/tools/qr-code', { interact: async (p) => { await p.waitForTimeout(500); return `feature mounted=${await p.evaluate(() => !!document.querySelector('#feature-root')?.children.length)}`; } });
await visit('/contact', { interact: async (p) => `contact form=${await p.locator('#contact-form').count()}` });
await visit('/docs');
await visit('/privacy');
await visit('/terms');
await visit('/nonexistent-page', { allow404: true, interact: async (p) => `branded404=${(await p.locator('a[href="/"], a[href="/#tools"]').count()) > 0}` });

await browser.close();
server.close();

console.log('\n========== HARNESS SUMMARY ==========');
console.log(`CSP violations (unexpected): ${cspViolations.length}`);
cspViolations.forEach((v) => console.log('  ✗ ' + v));
console.log(`Console/page problems (unexpected): ${problems.length}`);
if (!problems.length && !cspViolations.length) {
  console.log('✅ GREEN — no unexpected console errors or CSP violations under the real _headers CSP.');
} else {
  console.log('❌ RED');
  process.exit(1);
}
