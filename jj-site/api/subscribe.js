// POST /api/subscribe  { email }
//
// Adds the address to a Resend audience (https://resend.com/audiences).
//   RESEND_API_KEY      – API key with "contacts" write access
//   RESEND_AUDIENCE_ID  – the audience to add subscribers to
// Optional alternative: NEWSLETTER_WEBHOOK_URL – any URL that accepts
// a JSON POST of { email, source } (Make, Zapier, Loops, n8n…).
//
// Runs on Vercel's Node.js runtime; no dependencies.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const GENERIC_ERROR = 'Something went wrong on our end. Try again in a minute.';

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  // Honeypot: bots fill the hidden "website" field. Pretend it worked.
  if (body.website) return res.status(200).json({ ok: true });

  const email = String(body.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return res.status(400).json({ ok: false, error: 'Enter a valid email address.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  const webhook = process.env.NEWSLETTER_WEBHOOK_URL;

  try {
    if (apiKey && audienceId) {
      const r = await fetch(`https://api.resend.com/audiences/${encodeURIComponent(audienceId)}/contacts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, unsubscribed: false })
      });
      if (r.ok) return res.status(200).json({ ok: true });
      const text = await r.text();
      if (r.status === 409 || /already/i.test(text)) return res.status(200).json({ ok: true });
      console.error('Resend error', r.status, text);
      return res.status(502).json({ ok: false, error: GENERIC_ERROR });
    }

    if (webhook) {
      const r = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'hopefully_jdj site' })
      });
      if (r.ok) return res.status(200).json({ ok: true });
      console.error('Webhook error', r.status, await r.text());
      return res.status(502).json({ ok: false, error: GENERIC_ERROR });
    }

    return res.status(503).json({ ok: false, error: "The list isn't open yet — check back soon." });
  } catch (err) {
    console.error(err);
    return res.status(502).json({ ok: false, error: GENERIC_ERROR });
  }
};
