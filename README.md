# TextWizard

Free online text & code tools — live at **[textwizard.us](https://textwizard.us)**.

A single-page static site with zero backend. Everything runs in your browser; no data leaves your device.

## Features

- **Case converter** — UPPER, lower, Title Case, sentence case, camelCase, snake_case, kebab-case
- **Diff** — side-by-side text comparison
- **Analyzers** — character/word/line counters, frequency analysis
- **Translators** — Base64, URL encode/decode, ROT13, Morse, more
- **Code-data tools** — JSON ↔ YAML, JSON formatter, CSV ↔ JSON
- **Text editor** — utility scratch pad with the tools wired in

## Layout

```
index.html          — single-page UI
app.js              — boot + routing
styles.css          — design system
features/           — one .js file per tool family
  _editor.js, analyzers.js, case-converter.js, code-data.js,
  diff.js, text-tools.js, translators.js
favicon.svg, robots.txt, sitemap.xml, ads.txt, humans.txt
```

## Develop

```bash
# Any static-file server works
python3 -m http.server 8000
# Then open http://localhost:8000
```

## Deploy

The live site at [textwizard.us](https://textwizard.us) is deployed from this repo via Cloudflare Pages.

## License

MIT.
