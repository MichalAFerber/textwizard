// Contact form handler (Cloudflare Pages Function, POST /api/contact).
//
// Relays a visitor's message to RECIPIENT via the ForwardEmail.net HTTP API
// (Workers can't open raw SMTP sockets, but ForwardEmail exposes an HTTPS API).
//
// The SMTP/API password is read from the FORWARDEMAIL_PASSWORD secret, set in
// Cloudflare Pages → Settings → Environment variables (Production + Preview).
// It is NEVER stored in the repo. Until the secret is set, the endpoint returns
// a graceful "not configured" response.

const SENDER = 'noreply@textwizard.us';
const RECIPIENT = 'support@textwizard.us';
const MAX = { name: 200, email: 320, subject: 300, message: 5000 };

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

// Collapse newlines (header-injection guard) and clamp length.
const clean = (v, max) => String(v ?? '').replace(/[\r\n]+/g, ' ').trim().slice(0, max);

export async function onRequestPost({ request, env }) {
  // Same-origin guard: only accept posts from our own hosts — production and
  // this project's *.pages.dev preview deployments (whose subdomains contain a
  // dot, e.g. <hash>.textwizard-ekg.pages.dev).
  const origin = request.headers.get('origin');
  if (origin) {
    let host = '';
    try { host = new URL(origin).host; } catch { /* malformed */ }
    const allowed =
      host === 'textwizard.us' ||
      host === 'www.textwizard.us' ||
      host === 'textwizard-ekg.pages.dev' ||
      host.endsWith('.textwizard-ekg.pages.dev');
    if (!allowed) return json({ ok: false, error: 'Request blocked.' }, 403);
  }

  if (!env.FORWARDEMAIL_PASSWORD) {
    return json({ ok: false, error: 'The contact form is not configured yet. Please reach us on GitHub.' }, 503);
  }

  let data;
  try {
    const ct = request.headers.get('content-type') || '';
    if (ct.includes('application/json')) data = await request.json();
    else data = Object.fromEntries(await request.formData());
  } catch {
    return json({ ok: false, error: 'Could not read the form.' }, 400);
  }

  // Honeypot: real users never fill the hidden "company" field.
  if (clean(data.company, 100)) return json({ ok: true });

  const name = clean(data.name, MAX.name);
  const email = clean(data.email, MAX.email);
  const subject = clean(data.subject, MAX.subject);
  const message = String(data.message ?? '').trim().slice(0, MAX.message);

  if (!name || !email || !message) {
    return json({ ok: false, error: 'Please fill in your name, email, and message.' }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ ok: false, error: 'Please enter a valid email address.' }, 400);
  }
  if (message.length < 5) {
    return json({ ok: false, error: 'Please add a little more detail to your message.' }, 400);
  }

  // Cloudflare Turnstile — anti-spam. Only enforced when TURNSTILE_SECRET_KEY
  // is set, so the form keeps working before the keys are configured.
  if (env.TURNSTILE_SECRET_KEY) {
    const token = String(data['cf-turnstile-response'] ?? '').trim().slice(0, 3000);
    if (!token) return json({ ok: false, error: 'Please complete the anti-spam challenge.' }, 400);
    const params = new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token });
    const ip = request.headers.get('cf-connecting-ip');
    if (ip) params.set('remoteip', ip);
    try {
      const vr = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: params,
      });
      const verdict = await vr.json();
      if (!verdict.success) return json({ ok: false, error: 'Anti-spam check failed. Please try again.' }, 400);
    } catch {
      return json({ ok: false, error: 'Could not verify the anti-spam challenge. Please try again.' }, 502);
    }
  }

  const text =
    `New TextWizard contact message\n\n` +
    `Name:    ${name}\n` +
    `Email:   ${email}\n` +
    `Subject: ${subject || '(none)'}\n\n` +
    `${message}\n`;

  const body = new URLSearchParams({
    from: `TextWizard Contact <${SENDER}>`,
    to: RECIPIENT,
    replyTo: SENDER,
    subject: `[TextWizard] ${subject || 'New contact message'}`,
    text,
  });

  let res;
  try {
    res = await fetch('https://api.forwardemail.net/v1/emails', {
      method: 'POST',
      headers: {
        authorization: 'Basic ' + btoa(`${SENDER}:${env.FORWARDEMAIL_PASSWORD}`),
        'content-type': 'application/x-www-form-urlencoded',
      },
      body,
    });
  } catch {
    return json({ ok: false, error: 'Could not reach the mail service. Please try again shortly.' }, 502);
  }

  if (!res.ok) {
    return json({ ok: false, error: 'Your message could not be sent. Please try GitHub instead.' }, 502);
  }
  return json({ ok: true });
}
