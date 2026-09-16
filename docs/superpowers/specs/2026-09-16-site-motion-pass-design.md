# Site-wide motion pass — design

Date: 2026-09-16. Scope: public site only (12 marketing pages, ListingDetail, NotFound). Admin untouched.
Intensity: refined luxury. Subtle, consistent, never distracting. Reduced-motion respected everywhere.

## Why

The site already has a motion system (`frontend/src/components/motion.jsx`: `Page`, `Reveal`, `StaggerGroup`,
`StaggerItem`; `PageHero`, `KineticHeading`, `HeroVideo`, `HeroAtmosphere`) but it is applied unevenly:
Home is choreographed, five pages hand-roll stagger delays, several sections are static, three different easing
curves coexist, ListingCard has no reduced-motion guard, and route changes smooth-scroll under a fading page.
This pass unifies the language and extends it to every public surface.

## 1. Motion tokens (`motion.jsx`)

- `EASE = [0.22, 1, 0.36, 1]` (rename of `EASE_OUT`; keep the old export as an alias).
- `DUR = { fast: 0.2, base: 0.4, slow: 0.7 }`.
- `SPRING = { type: "spring", stiffness: 380, damping: 32 }` (the nav underline's physics).
- Tailwind `transitionTimingFunction.luxe` = `cubic-bezier(0.22,1,0.36,1)`; `.btn-sheen` and all `transition-*`
  utilities in touched files use `ease-luxe`.
- Every framer `transition` in touched files references `EASE`/`DUR`/`SPRING`. No string `"easeOut"`, no bare
  transitions.
- Delete dead code: `staggerContainer`/`staggerItem` exports, `.pulse-ring` + `@keyframes pulsering`,
  `accordion-down/up` keyframes and the `tailwindcss-animate` plugin (verify zero references first).

## 2. Route transitions (`App.js`, `motion.jsx`)

- Public `<Routes>` wrapped in `<AnimatePresence mode="wait" initial={false}>` keyed on `location.pathname`.
  Admin routes stay outside it.
- `Page` gains `exit={{ opacity: 0 }}` with `transition={{ duration: DUR.fast }}`; enter stays fade + y 16→0 at
  `DUR.base`.
- `ScrollToTop` uses `window.scrollTo({ top: 0, behavior: "instant" })`, fired on pathname change.
- `App.css`: `html { scroll-behavior: smooth }` becomes `html:focus-within { scroll-behavior: smooth }` so in-page
  anchor links keep smooth scroll but programmatic jumps do not.
- `<MotionConfig reducedMotion="user">` wraps the app as a global safety net.

## 3. Section choreography

- Replace hand-rolled `<Reveal delay={i*0.06}>` loops with `<StaggerGroup>` + `<StaggerItem>` on Sellers,
  Management, Investors, HomeAway, Faq.
- Wrap currently static sections: About values grid, Buyers checklist, ListingDetail facts tiles and features
  list, Contact info cards, Footer columns, NotFound content.
- Defaults: `StaggerGroup` stagger 0.07, `StaggerItem` rise 20px over `DUR.base`, `viewport once, margin -60px`.
- `Reveal` keeps fade + rise 24px but switches to `EASE`/`DUR.base`.

## 4. Hover language

- One recipe, CSS-only, in `App.css`: `.card-hover { transition: transform .3s ease-luxe, box-shadow .3s ease-luxe }`
  and `@media (hover:hover) and (pointer:fine) { .card-hover:hover { transform: translateY(-4px); box-shadow: ... } }`.
  Reduced motion: no transform, shadow only.
- Applied to: service cards (Sellers/Management/Investors/HomeAway), Home pillar + testimonial cards, Contact cards,
  ListingDetail facts tiles.
- `ListingCard`: drop framer `whileHover` and `layout`; use `.card-hover`; image zoom stays but at `.5s ease-luxe`;
  entry becomes `whileInView` via `StaggerItem` semantics; add `useReducedMotion` guard.
- Buttons unchanged (`active:scale-[0.98]` + sheen).

## 5. Heroes

- `PageHero` passes `parallax` to `HeroVideo` on every page; `HeroVideo` parallax range reduced to y 0→80,
  scale 1→1.04.
- `HeroVideo`: subscribe to `useScroll` only when `parallax`; `mobile` state updates on `matchMedia` change.
- `HeroAtmosphere`: blobs get `will-change: transform`, blur reduced to 80px; grain layer unchanged.
- `KineticHeading` unchanged (mount-triggered is correct for heroes).

## 6. Interactive fixes

- `Gallery`: main image `AnimatePresence mode="popLayout"` crossfade at `DUR.fast`; lightbox image gets `exit`;
  `useReducedMotion` disables drag physics and scale.
- `Faq` accordion, `Nav` mobile menu, `Listings` filter panel: height animation skipped under reduced motion
  (render open/closed instantly); transitions use `EASE`/`DUR.fast`.
- `InquiryForm` error messages get `exit={{ opacity: 0, y: -4 }}`.
- Home final-CTA image: `animate-kenburns` applied via `whileInView` class toggle (starts when visible).
- Home marquee: `IntersectionObserver` toggles `animation-play-state` so it pauses off-screen; drop permanent
  `will-change`.
- `Listings` tab underline uses `SPRING`.
- `animate-spin` added to the `prefers-reduced-motion` block? No: spinner conveys state; leave it running.

## 7. Reduced motion

`MotionConfig reducedMotion="user"` plus existing `useReducedMotion` guards. Under reduced motion: opacity-only
reveals, no parallax, no hover transform, no height animations, no route rise. Videos already fall back to posters.

## 8. Verification

- `CI=false npm run build` clean.
- Local prod build on :8001. Browser pass at 1440 and 390 wide: every public route, scroll each to bottom, check
  console for framer warnings, screenshot each hero. Confirm route change jumps to top with no smooth scroll.
- Emulate `prefers-reduced-motion: reduce` on Home, Listings, Faq: no transforms, content visible.
- Commit; user runs `railway up --detach`; poll deploy; spot-check live Home, Listings, a detail page.

## Out of scope

Lenis/smooth-scroll library, counters, text splitting beyond existing KineticHeading, admin pages, new imagery.
