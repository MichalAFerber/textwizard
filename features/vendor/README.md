# Vendored third-party code

## qrcode.min.js

- **Library:** [node-qrcode](https://github.com/soldair/node-qrcode) (`qrcode`) v1.4.4 — the self-contained UMD browser build (`build/qrcode.min.js`), which exposes a global `QRCode` with `toCanvas`/`toDataURL`.
- **License:** MIT © Ryan Day and contributors.
- **Source:** fetched from jsDelivr (`https://cdn.jsdelivr.net/npm/qrcode@1.4.4/build/qrcode.min.js`).
- **Why vendored:** TextWizard has no build step, so the library is committed and served locally — no runtime requests to any external host. It is loaded lazily by `features/qr-code.js`, only when the QR Code tool is opened.
- **Why 1.4.4:** it is the last release that ships a dependency-free UMD bundle. 1.5.x only publishes CommonJS modules that require a bundler. When the site moves to a build pipeline (e.g. Astro), this can be replaced with a direct `import` of the current `qrcode` release.
