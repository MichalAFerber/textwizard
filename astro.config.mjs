import { defineConfig } from 'astro/config';

// The canonical production host. Astro uses this to build absolute canonical
// URLs (see Base.astro) and it is the base for the hand-generated sitemap
// (src/pages/sitemap.xml.js), which lists only the public canonical URLs.
//
// build.format 'file' emits /tools/foo.html, which Cloudflare Pages serves at
// the clean URL /tools/foo (its default .html-stripping behaviour) with no
// trailing slash — matching the canonical URLs we advertise.
export default defineConfig({
  site: 'https://textwizard.us',
  trailingSlash: 'never',
  build: { format: 'file' },
});
