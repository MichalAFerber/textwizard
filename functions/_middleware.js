// Host canonicalization for TextWizard.
//
// The canonical host is the apex: https://textwizard.us
// Every other host that Cloudflare serves this project on is a duplicate and
// must be consolidated or kept out of the index:
//
//   www.textwizard.us            -> 301 redirect to the apex (single hop),
//                                   preserving the path and query string.
//   *.pages.dev (prod + preview) -> still reachable for testing, but never
//                                   indexed: robots.txt returns "Disallow: /"
//                                   and every response carries an
//                                   X-Robots-Tag: noindex header.
//   textwizard.us                -> served unchanged.
//
// Static-asset behaviour (clean URLs, custom 404.html) is preserved because we
// delegate to next() for everything we do not explicitly rewrite.

const CANONICAL_HOST = 'textwizard.us';

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  const host = url.hostname;

  // 1) Redirect the www subdomain to the canonical apex host.
  if (host === `www.${CANONICAL_HOST}`) {
    url.hostname = CANONICAL_HOST;
    return Response.redirect(url.toString(), 301);
  }

  // 2) Cloudflare's *.pages.dev hosts (the project's default domain and every
  //    preview deployment) serve identical content. Keep them usable but make
  //    sure search engines never treat them as canonical/duplicate content.
  const isNonCanonicalHost = host.endsWith('.pages.dev');

  if (isNonCanonicalHost && url.pathname === '/robots.txt') {
    return new Response('User-agent: *\nDisallow: /\n', {
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }

  const response = await next();

  if (isNonCanonicalHost) {
    const res = new Response(response.body, response);
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return res;
  }

  return response;
}
