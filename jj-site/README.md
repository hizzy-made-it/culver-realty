# JJ · @hopefully_jdj — personal site

Static one-pager (HTML/CSS/JS, no build step) plus one Vercel serverless function for the
newsletter form. Deploys anywhere static files are served; the `/api/subscribe` function
needs Vercel (or any Node host — it's a plain `(req, res)` handler).

```
jj-site/
├─ index.html          page markup
├─ styles.css          all styling (self-hosted fonts, responsive, reduced-motion aware)
├─ script.js           link wiring, mobile menu, reveal-on-scroll, newsletter form
├─ config.js           ← THE ONLY FILE YOU NEED TO EDIT: social links + handle
├─ api/subscribe.js    POST { email } → Resend audience (or any webhook)
├─ assets/             photos, decorative SVG art, fonts
├─ vercel.json         clean URLs, cache + security headers
└─ .env.example        newsletter env vars
```

## 1. Drop in the links

Open `config.js` and fill in the URLs. Instagram and TikTok are pre-filled from the
handle — confirm they're right. Empty values fall back sensibly (e.g. the
"Explore Adventure" button → blog → Instagram → the links row), so nothing breaks
while a link is still missing.

## 2. Replace the placeholder photos

`assets/hero.jpg`, `assets/adventure.jpg`, `assets/fitness.jpg` were cropped from the
mockup and are low-res. Swap them for the originals (same filenames; any size — they're
`object-fit: cover`). Keep the hero roughly portrait (≈ 5:4 or taller) and the other two
roughly 16:9.

## 3. Newsletter

The form POSTs to `/api/subscribe`. Set **one** of these in Vercel → Settings →
Environment Variables (see `.env.example`):

| Option | Vars | What happens |
| --- | --- | --- |
| Resend audience | `RESEND_API_KEY`, `RESEND_AUDIENCE_ID` | Address is added as a contact |
| Any webhook | `NEWSLETTER_WEBHOOK_URL` | JSON `{ email, source }` is POSTed there (Make, Zapier, Loops, n8n…) |

Until one is configured the form shows "The list isn't open yet". To use a hosted form
service instead (Formspree etc.), point `newsletterEndpoint` in `config.js` at its URL.

## Deploy

**Vercel (recommended):** import this repo, set *Root Directory* to `jj-site`, framework
"Other", no build command. Add the env vars above. Custom domain → Project → Domains.

Live now at https://hopefully-jdj.vercel.app (Vercel project `hopefully-jdj`, HD Connex team, root directory `jj-site`). After a custom domain is added, update `og:image` in `index.html` to that domain.

**Local preview:** `python3 -m http.server 8080` inside `jj-site/` (the form will 405
without the serverless runtime — use `npx vercel dev` for that).
