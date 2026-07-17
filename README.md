# TextWizard

Free online text & code tools — live at **[textwizard.us](https://textwizard.us)**.

Privacy-first: everything runs in your browser. No uploads, no accounts, no backend — your text never leaves your device.

Built with [Astro](https://astro.build). The landing page is a hero + tool-card grid, and each tool is its own page at `/tools/<id>`.

**Stack note:** styling is hand-authored, token-driven vanilla CSS (`src/styles/global.css`) instead of Tailwind — the design system is small and ships less CSS this way, so a utility framework doesn't earn its keep at this size.

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
public/                  — favicons, og.png, _headers (CSP), site.webmanifest, llms.txt,
                           robots.txt, ads.txt, humans.txt, .well-known/, vendored QR lib
functions/_middleware.js — Cloudflare Pages host canonicalization (www→apex; *.pages.dev noindex)
functions/api/contact.js — Contact form handler (ForwardEmail relay + Turnstile verify)
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
(`functions/api/contact.js`) that relays the message to `michal@textwizard.us`
via the [ForwardEmail.net](https://forwardemail.net) HTTP API (Workers can't open
raw SMTP sockets).

The sending password is read from a secret and is **never** committed:

```bash
npx wrangler pages secret put FORWARDEMAIL_PASSWORD --project-name textwizard
```

Setup:

- `noreply@textwizard.us` — a ForwardEmail alias with outbound sending enabled; its
  password is the `FORWARDEMAIL_PASSWORD` secret.
- `michal@textwizard.us` — receives the mail (the system/notification recipient).
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

## Credits

| Component | Version | License | Use |
|-----------|---------|---------|-----|
| [Astro](https://astro.build) | 4.16.19 | MIT | Static site framework |
| [node-qrcode](https://github.com/soldair/node-qrcode) | 1.4.4 | MIT | QR code generation (vendored UMD, `public/vendor/`) |
| [unicode-emoji-json](https://github.com/muan/unicode-emoji-json) | 0.9.0 | MIT | Emoji dataset for Emoji Copy |
| [JetBrains Mono](https://github.com/JetBrains/JetBrainsMono) via [@fontsource](https://fontsource.org/fonts/jetbrains-mono) | 5.2.8 | OFL-1.1 | Self-hosted display font for headings |
| [GitHub mark](https://github.com/logos) | — | © GitHub, Inc. | Inlined SVG linking to the repo |

The brand mark, favicon, and OG image are original work generated for TextWizard.
Full third-party notices are in [`LICENSE`](LICENSE).

## License

[MIT](LICENSE) — with bundled third-party component notices in the `LICENSE` file
(see Credits above).
