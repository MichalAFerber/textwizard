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
  // Same-origin guard: only accept posts from our own hosts.
  const origin = request.headers.get('origin');
  if (origin && !/^https:\/\/(www\.)?textwizard\.us$/.test(origin) && !/^https:\/\/[a-z0-9-]+\.pages\.dev$/.test(origin)) {
    return json({ ok: false, error: 'Request blocked.' }, 403);
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

  const text =
    `New TextWizard contact message\n\n` +
    `Name:    ${name}\n` +
    `Email:   ${email}\n` +
    `Subject: ${subject || '(none)'}\n\n` +
    `${message}\n`;

  const body = new URLSearchParams({
    from: `TextWizard Contact <${SENDER}>`,
    to: RECIPIENT,
    replyTo: `${name} <${email}>`,
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
