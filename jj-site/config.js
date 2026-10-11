// ─────────────────────────────────────────────────────────────
//  JJ — site links. Paste the real URLs here; nothing else to edit.
//  Leave a value as '' and the site falls back sensibly
//  (e.g. "Explore Adventure" → blog → Instagram → the links row).
// ─────────────────────────────────────────────────────────────
window.JJ_CONFIG = {
  handle: '@hopefully_jdj',

  links: {
    instagram: 'https://www.instagram.com/hopefully_jdj/',
    tiktok:    'https://www.tiktok.com/@hopefully_jdj',
    onlyfans:  '',                 // e.g. 'https://onlyfans.com/…'
    blog:      '',                 // "My Blog" card + "Journal" nav link
    adventure: '',                 // "Explore Adventure" button (falls back to blog, then Instagram)
    fitness:   '',                 // "Explore Fitness" button  (falls back to blog, then Instagram)
    connect:   ''                  // "Let's connect" button — e.g. 'mailto:hello@example.com'
                                   // (falls back to the newsletter section)
  },

  // Where the "Join the list" form POSTs { email }. The bundled Vercel function
  // at /api/subscribe adds the address to a Resend audience (see README).
  // Any JSON endpoint works here too (Formspree, Make, Zapier, Loops…).
  newsletterEndpoint: '/api/subscribe'
};
