# TextWizard

Free online text & code tools — live at **[textwizard.us](https://textwizard.us)**.

Privacy-first: everything runs in your browser. No uploads, no accounts, no backend — your text never leaves your device.

Built with [Astro](https://astro.build). The landing page is a hero + tool-card grid, and each tool is its own page at `/tools/<id>`.

## Tools

Each tool is its own page at `/tools/<id>`, and its source is a single file. Click a card's GitHub icon on the site, or use the table below.

| Tool | What it does | Source |
|------|--------------|--------|
| [Text Tools](https://textwizard.us/tools/text-tools) | Trim/sort/dedupe lines, wrap, strip HTML/ANSI, find & replace | [`src/features/text-tools.js`](src/features/text-tools.js) |
| [Case Converter](https://textwizard.us/tools/case-converter) | UPPER, lower, Title, camelCase, snake_case, kebab-case | [`src/features/case-converter.js`](src/features/case-converter.js) |
| [Fancy Text](https://textwizard.us/tools/fancy-text) | Unicode bold, script, fraktur, circled, upside down, Zalgo | [`src/features/fancy-text.js`](src/features/fancy-text.js) |
| [Code & Data](https://textwizard.us/tools/code-data) | Base64/URL/hex, JSON & CSV, regex, SHA hashes, timestamps, color | [`src/features/code-data.js`](src/features/code-data.js) |
| [Translators](https://textwizard.us/tools/translators) | NATO phonetic, "A as in Apple", Pig Latin, phone keypad | [`src/features/translators.js`](src/features/translators.js) |
| [Analyzers](https://textwizard.us/tools/analyzers) | Character/word/line counts, character frequency | [`src/features/analyzers.js`](src/features/analyzers.js) |
| [Diff](https://textwizard.us/tools/diff) | Line-by-line text comparison | [`src/features/diff.js`](src/features/diff.js) |
| [Generators](https://textwizard.us/tools/generators) | UUID, password, random number/date, IP, hex color, Lorem ipsum | [`src/features/generators.js`](src/features/generators.js) |
| [QR Code](https://textwizard.us/tools/qr-code) | QR from text/URL with a centered logo, download PNG | [`src/features/qr-code.js`](src/features/qr-code.js) |
| [Emoji Copy](https://textwizard.us/tools/emoji) | Browse & click-to-copy every Unicode emoji | [`src/pages/tools/emoji.astro`](src/pages/tools/emoji.astro) |

## Project layout

```
astro.config.mjs         — Astro config (canonical site host)
src/
  data/tools.js          — tool catalog (drives cards, tool pages, sitemap)
  layouts/Base.astro     — shared head / nav / footer + SEO + Plausible
  pages/
    index.astro          — hero + tool-card grid
    tools/[id].astro     — one page per tool
    privacy.astro, 404.astro, sitemap.xml.js
  features/              — framework-agnostic tool modules (mounted client-side)
  scripts/               — tool-mount + shared browser globals
  styles/global.css      — design system
public/                  — favicon, robots.txt, ads.txt, humans.txt, vendored QR lib
functions/_middleware.js — Cloudflare Pages host canonicalization (www→apex; *.pages.dev noindex)
```

## Develop

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # -> dist/
npm run preview
```

## Deploy (Cloudflare Pages)

Deployed from this repo via Cloudflare Pages. Set the project's build settings to:

- **Build command:** `npm run build`
- **Build output directory:** `dist`

## Contact form

The Contact page (`/contact`) posts to a Cloudflare Pages Function
(`functions/api/contact.js`) that relays the message to `support@textwizard.us`
via the [ForwardEmail.net](https://forwardemail.net) HTTP API (Workers can't open
raw SMTP sockets).

The sending password is read from a secret and is **never** committed:

```bash
npx wrangler pages secret put FORWARDEMAIL_PASSWORD --project-name textwizard
```

Setup:

- `noreply@textwizard.us` — a ForwardEmail alias with outbound sending enabled; its
  password is the `FORWARDEMAIL_PASSWORD` secret.
- `support@textwizard.us` — receives the mail.
- Set the secret for **Production** and **Preview**, then redeploy.

Until the secret is set, the endpoint returns a graceful "not configured" message
and the page points people to GitHub. Bots are filtered with a honeypot field, and
the endpoint validates input and enforces a same-origin check.

### Turnstile (anti-spam)

The form also supports [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/).
Create a Turnstile widget for `textwizard.us`, then set two variables (Production
**and** Preview) and redeploy:

- `PUBLIC_TURNSTILE_SITE_KEY` — the public site key, a **build** variable (Astro
  reads it at build time to render the widget).
- `TURNSTILE_SECRET_KEY` — the secret key, a **secret**
  (`npx wrangler pages secret put TURNSTILE_SECRET_KEY --project-name textwizard`).

Both must be set together. When they're absent the widget is omitted and the form
still works (honeypot + validation only); when present, the Function verifies the
token server-side before sending.

## License

MIT.
