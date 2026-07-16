# TextWizard

Free online text & code tools — live at **[textwizard.us](https://textwizard.us)**.

Privacy-first: everything runs in your browser. No uploads, no accounts, no backend — your text never leaves your device.

Built with [Astro](https://astro.build). The landing page is a hero + tool-card grid, and each tool is its own page at `/tools/<id>`.

## Tools

- **Text Tools** — trim/collapse whitespace, sort & dedupe lines, wrap/de-wrap, strip HTML/ANSI, smart quotes, find & replace
- **Case Converter** — UPPER, lower, Title, Sentence, camelCase, snake_case, kebab-case
- **Fancy Text** — Unicode bold, italic, script, fraktur, monospace, circled, small caps, upside down, strikethrough, Zalgo
- **Code & Data** — Base64/URL/hex/binary, JSON format & convert, CSV ↔ JSON, XML pretty-print, regex tester, SHA hashes, timestamps, color
- **Translators** — NATO phonetic, "A as in Apple", Pig Latin, phone keypad
- **Analyzers** — character/word/line counts, character frequency
- **Diff** — line-by-line text comparison
- **Generators** — UUID, password, random number/letter/date, IP, hex color, Lorem ipsum, random pick
- **QR Code** — generate a QR from text/URL with an optional centered logo, download as PNG

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

## License

MIT.
