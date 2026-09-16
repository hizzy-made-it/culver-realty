# Site Motion Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify and extend the existing framer-motion system across every public page: one easing/duration token set, route crossfades, staggered reveals on every static section, one hover recipe, lighter heroes, and full reduced-motion coverage.

**Architecture:** All primitives live in `frontend/src/components/motion.jsx` and are consumed by pages. Route transitions wrap `<Outlet>` in `SiteLayout.jsx` only (admin untouched). Hover is a CSS class, not framer, so it composes with `layout`/`AnimatePresence` without fighting them. Every task ends with `npm run build` + a browser check on the local production build served by FastAPI at `http://localhost:8001`.

**Tech Stack:** React 18 (CRA + craco), framer-motion ^11.18, Tailwind 3, react-router 6. No new dependencies.

## Global Constraints

- Public site only. Never touch `frontend/src/pages/admin/**`.
- Easing token `EASE = [0.22, 1, 0.36, 1]`; CSS twin `cubic-bezier(0.22, 1, 0.36, 1)` as Tailwind `ease-luxe`. No string `"easeOut"` and no bare framer `transition` objects in touched files.
- Durations: `DUR.fast = 0.2`, `DUR.base = 0.4`, `DUR.slow = 0.7`.
- Under `prefers-reduced-motion: reduce`: opacity-only reveals, no transforms, no height animations, no parallax, no hover lift.
- Hover lift only under `@media (hover: hover) and (pointer: fine)`.
- Every task: `cd frontend && CI=false npm run build` must print `Compiled successfully.` Then restart the local backend so it serves the fresh build (command in Task 0).
- Commit after each task with the trailer `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- Do not run `railway up`. The user deploys.

## Existing code you will reuse

- `frontend/src/components/motion.jsx`: `Page`, `Reveal`, `StaggerGroup`, `StaggerItem`, `EASE_OUT`.
- `frontend/src/components/site/HeroVideo.jsx`: parallax via `useScroll`/`useTransform`, `mobile` matchMedia.
- `frontend/src/components/site/PageHero.jsx`: composes HeroVideo + HeroAtmosphere + KineticHeading.
- `frontend/src/App.css`: `.btn-sheen`, reduced-motion block.

---

### Task 0: Local verification loop (no code change)

**Files:** none

- [ ] **Step 1: Confirm the loop works**

```bash
cd C:/1projects/a_Websites/culver/culver-realty-code/culver-realty/frontend && CI=false npm run build 2>&1 | grep -E "Compiled|Failed"
```
Expected: `Compiled successfully.`

- [ ] **Step 2: (Re)start the backend serving the build**

```bash
cd C:/1projects/a_Websites/culver/culver-realty-code/culver-realty/backend
pid=$(netstat -ano | grep ":8001 .*LISTEN" | awk '{print $5}' | head -1); [ -n "$pid" ] && taskkill //PID $pid //F
(.venv/Scripts/python.exe -m uvicorn server:app --host 0.0.0.0 --port 8001 > /dev/null 2>&1 &)
sleep 3; curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8001/
```
Expected: `200`. Repeat Steps 1–2 at the end of every task below ("BUILD+SERVE").

---

### Task 1: Motion tokens and dead code

**Files:**
- Modify: `frontend/src/components/motion.jsx`
- Modify: `frontend/src/App.css:23-36` (delete `.pulse-ring`), `:62-67` (sheen curve), `:70-88` (reduced block)
- Modify: `frontend/tailwind.config.js:49-51, 82-83, 94` and add `transitionTimingFunction`
- Modify: `frontend/package.json` (remove `tailwindcss-animate`)

**Interfaces:**
- Produces: `EASE`, `DUR`, `SPRING` exports from `motion.jsx`; `EASE_OUT` kept as alias. Tailwind utility `ease-luxe`. CSS class `.card-hover` is added in Task 3, not here.

- [ ] **Step 1: Verify the dead code really is dead**

```bash
cd C:/1projects/a_Websites/culver/culver-realty-code/culver-realty/frontend
grep -rn "staggerContainer\|staggerItem\|pulse-ring\|accordion-down\|accordion-up\|animate-accordion" src | grep -v "components/motion.jsx\|App.css"
```
Expected: no output.

- [ ] **Step 2: Rewrite `motion.jsx` head and primitives**

Replace lines 1–42 of `frontend/src/components/motion.jsx` with:

```jsx
import { motion, useReducedMotion } from "framer-motion";

/** Shared motion tokens. CSS twin: Tailwind `ease-luxe`. */
export const EASE = [0.22, 1, 0.36, 1];
export const EASE_OUT = EASE; // legacy alias
export const DUR = { fast: 0.2, base: 0.4, slow: 0.7 };
export const SPRING = { type: "spring", stiffness: 380, damping: 32 };

/** Page wrapper: fade + rise on mount, fade on exit (route transitions in SiteLayout). */
export function Page({ children, className = "" }) {
    const reduce = useReducedMotion();
    return (
        <motion.main
            className={className}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: DUR.fast, ease: EASE } }}
            transition={{ duration: DUR.base, ease: EASE }}
        >
            {children}
        </motion.main>
    );
}

export function Reveal({ children, className = "", delay = 0 }) {
    const reduce = useReducedMotion();
    return (
        <motion.div
            className={className}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: DUR.base, ease: EASE, delay }}
        >
            {children}
        </motion.div>
    );
}
```

Then in the remaining `StaggerGroup`/`StaggerItem`: change `stagger = 0.08` to `stagger = 0.07`; change `StaggerItem` variants to `initial: reduce ? { opacity: 0 } : { opacity: 0, y: 20 }` and `animate: { opacity: 1, y: 0, transition: { duration: DUR.base, ease: EASE } }`.

- [ ] **Step 3: Tailwind easing token, drop accordion + plugin**

In `frontend/tailwind.config.js`: delete the two `"accordion-down"`/`"accordion-up"` keyframe entries and the two matching `animation` entries. Change `plugins: [require("tailwindcss-animate")],` to `plugins: [],`. Inside `extend: {` add:

```js
      transitionTimingFunction: {
        luxe: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
```

- [ ] **Step 4: App.css cleanup**

Delete the `.pulse-ring` rule and `@keyframes pulsering` block (lines 23–36). In `.btn-sheen:hover::after` change `cubic-bezier(0.23, 1, 0.32, 1)` to `cubic-bezier(0.22, 1, 0.36, 1)`. In the reduced-motion block remove the `.pulse-ring,` line.

- [ ] **Step 5: Remove the dependency**

```bash
cd C:/1projects/a_Websites/culver/culver-realty-code/culver-realty/frontend && npm uninstall tailwindcss-animate 2>&1 | tail -1
```

- [ ] **Step 6: BUILD+SERVE, check Home renders**

Open `http://localhost:8001/` in the browser. Hero text still rises in, pillars still stagger. No console errors.

- [ ] **Step 7: Commit**

```bash
cd C:/1projects/a_Websites/culver/culver-realty-code/culver-realty
git add frontend/src/components/motion.jsx frontend/src/App.css frontend/tailwind.config.js frontend/package.json frontend/package-lock.json
git commit -m "refactor(motion): single EASE/DUR/SPRING token set, drop dead animations

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Route transitions, instant scroll reset, MotionConfig

**Files:**
- Modify: `frontend/src/components/site/SiteLayout.jsx`
- Modify: `frontend/src/App.js:29-35, 51-57`
- Modify: `frontend/src/App.css:1-3, 70-73`

**Interfaces:**
- Consumes: `Page` exit from Task 1.

- [ ] **Step 1: SiteLayout wraps the outlet in AnimatePresence**

Replace `frontend/src/components/site/SiteLayout.jsx` with:

```jsx
import { cloneElement } from "react";
import { useLocation, useOutlet } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Nav from "./Nav";
import Footer from "./Footer";
import MobileCallBar from "./MobileCallBar";

/** Public layout. Route changes crossfade via each page's <Page> enter/exit. */
export default function SiteLayout() {
    const { pathname } = useLocation();
    const outlet = useOutlet();
    return (
        <div className="min-h-screen flex flex-col">
            <Nav />
            <div className="flex-1 pb-[68px] md:pb-0">
                <AnimatePresence mode="wait" initial={false} onExitComplete={() => window.scrollTo({ top: 0, behavior: "instant" })}>
                    {outlet && cloneElement(outlet, { key: pathname })}
                </AnimatePresence>
            </div>
            <Footer />
            <MobileCallBar />
        </div>
    );
}
```

- [ ] **Step 2: App.js — admin-only ScrollToTop, MotionConfig**

Replace `ScrollToTop` (lines 29–35) with:

```jsx
function ScrollToTop() {
    const { pathname } = useLocation();
    useEffect(() => {
        // Public routes reset in SiteLayout after the exit fade; admin has no transition.
        if (pathname.startsWith("/admin")) window.scrollTo({ top: 0, behavior: "instant" });
    }, [pathname]);
    return null;
}
```

Add `import { MotionConfig } from "framer-motion";` after line 4. Wrap the tree: change `<AuthProvider>` … `</AuthProvider>` to sit inside `<MotionConfig reducedMotion="user">` … `</MotionConfig>` (MotionConfig directly inside `BrowserRouter`).

- [ ] **Step 3: Scope smooth scroll to anchor navigation**

In `frontend/src/App.css` change line 1–3 to:

```css
/* Smooth only for in-page anchor jumps; programmatic resets stay instant. */
html:focus-within {
    scroll-behavior: smooth;
}
```
and in the reduced-motion block change `html {` to `html:focus-within {`.

- [ ] **Step 4: BUILD+SERVE, check transitions**

Browser: from `/` scroll to the bottom, click a footer link. Expected: page fades out, viewport jumps to top with no visible smooth scroll, new page fades in. Click between `/listings` and a detail page; no white flash, no duplicate Nav. Visit `/admin/login` to confirm it still renders.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/site/SiteLayout.jsx frontend/src/App.js frontend/src/App.css
git commit -m "feat(motion): crossfade route transitions, instant scroll reset, MotionConfig

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: Hover recipe and ListingCard

**Files:**
- Modify: `frontend/src/App.css` (append `.card-hover`)
- Modify: `frontend/src/components/site/ListingCard.jsx`

**Interfaces:**
- Produces: CSS class `card-hover` used by Tasks 4–5.

- [ ] **Step 1: Add the recipe to App.css** (append before the reduced-motion block)

```css
/* One hover language for cards: 4px lift + soft shadow, fine pointers only. */
.card-hover {
    transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.3s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.3s ease;
}
@media (hover: hover) and (pointer: fine) {
    .card-hover:hover {
        transform: translateY(-4px);
        box-shadow: 0 18px 40px -18px rgba(6, 14, 26, 0.35);
    }
}
```
Inside the existing `@media (prefers-reduced-motion: reduce)` block add:
```css
    .card-hover:hover {
        transform: none;
    }
```

- [ ] **Step 2: Rewrite ListingCard motion**

Replace lines 1–22 of `frontend/src/components/site/ListingCard.jsx` with:

```jsx
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { BedDouble, Bath, Ruler } from "lucide-react";
import { fmtPrice, fmtSqft, coverPhoto, statusLabel } from "../../lib/site";
import { EASE, DUR } from "../motion";

export default function ListingCard({ property, index = 0 }) {
    const cover = coverPhoto(property);
    const isSold = property.status === "sold";
    const reduce = useReducedMotion();
    return (
        <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            exit={{ opacity: 0, scale: 0.98, transition: { duration: DUR.fast, ease: EASE } }}
            transition={{ duration: DUR.base, ease: EASE, delay: Math.min(index % 3, 2) * 0.07 }}
            className="h-full"
        >
            <Link
                to={`/listings/${property.slug}`}
                className="card-hover group relative border border-navy/10 bg-white shadow-sm overflow-hidden flex flex-col h-full"
                data-testid={`listing-card-${property.slug}`}
            >
```
Change the image class `transition-transform duration-700 ease-out group-hover:scale-105` to `transition-transform duration-500 ease-luxe group-hover:scale-[1.04]`.

- [ ] **Step 3: BUILD+SERVE, check `/listings`**

Cards fade up as they scroll into view (not all at once on load). Hover lifts 4px with a shadow; image zooms slightly. Toggle a filter while hovering: no jump. Empty the filters so cards leave: they scale down and fade.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/App.css frontend/src/components/site/ListingCard.jsx
git commit -m "feat(motion): card-hover recipe; ListingCard reveals in view, no layout/hover contention

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: StaggerGroup on the five hand-rolled pages

**Files:**
- Modify: `frontend/src/pages/Sellers.jsx:2, 32-41`
- Modify: `frontend/src/pages/Management.jsx:2, 32-45`
- Modify: `frontend/src/pages/Investors.jsx:3, 40-51`
- Modify: `frontend/src/pages/HomeAway.jsx:2, 60-74`
- Modify: `frontend/src/pages/Faq.jsx:4, 55-91`

**Interfaces:**
- Consumes: `StaggerGroup`, `StaggerItem` from `motion.jsx`; `card-hover` from Task 3.

The pattern is identical on every page. For each: extend the import to `import { Page, Reveal, StaggerGroup, StaggerItem } from "../components/motion";`, then change the grid.

- [ ] **Step 1: Sellers.jsx**

Replace the `STEPS.map` block with:

```jsx
                <StaggerGroup className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {STEPS.map((s, i) => (
                        <StaggerItem key={s.title} className="h-full">
                            <div className="card-hover bg-white border border-navy/10 p-8 h-full" data-testid={`seller-step-${i}`}>
                                <p className="font-serif text-5xl text-gold/60 font-semibold">{String(i + 1).padStart(2, "0")}</p>
                                <h3 className="font-serif text-2xl font-semibold text-navy mt-4">{s.title}</h3>
                                <p className="text-sm text-slate-600 leading-relaxed mt-3">{s.copy}</p>
                            </div>
                        </StaggerItem>
                    ))}
                </StaggerGroup>
```
(The outer `<div className="grid …">` is replaced by `StaggerGroup` carrying the same classes.)

- [ ] **Step 2: Management.jsx** — same shape: `StaggerGroup className="grid grid-cols-1 md:grid-cols-2 gap-8"`, each `<Reveal key delay>` becomes `<StaggerItem key className="h-full">`, and the inner card div gets `card-hover ` prepended to its className.

- [ ] **Step 3: Investors.jsx** — `StaggerGroup className="grid grid-cols-1 md:grid-cols-3 gap-8"`, same substitutions, `card-hover` on the card div.

- [ ] **Step 4: HomeAway.jsx** — `StaggerGroup className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12"`, same substitutions, `card-hover` on the card div.

- [ ] **Step 5: Faq.jsx** — wrap the list: `<StaggerGroup className="border-t border-navy/10" stagger={0.05}>` replacing the `<div className="border-t border-navy/10">`; each `<Reveal key={faq.q} delay={i * 0.05}>` becomes `<StaggerItem key={faq.q}>`. No hover class on FAQ rows.

- [ ] **Step 6: BUILD+SERVE, check all five**

Visit `/sellers`, `/management`, `/investors`, `/home-away`, `/faq`. Cards cascade in as the grid enters view; hover lifts. FAQ rows cascade; accordion still opens.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/Sellers.jsx frontend/src/pages/Management.jsx frontend/src/pages/Investors.jsx frontend/src/pages/HomeAway.jsx frontend/src/pages/Faq.jsx
git commit -m "feat(motion): orchestrated stagger + hover on service grids and FAQ

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: Static sections get choreography

**Files:**
- Modify: `frontend/src/pages/About.jsx:3, 46-53`
- Modify: `frontend/src/pages/Buyers.jsx:3, 44-52`
- Modify: `frontend/src/pages/Contact.jsx:2, 26-56`
- Modify: `frontend/src/pages/ListingDetail.jsx:6, 113-121, 131-135`
- Modify: `frontend/src/components/site/Footer.jsx`
- Modify: `frontend/src/pages/NotFound.jsx`
- Modify: `frontend/src/pages/Home.jsx:252-270, 331-339` (hover class only)

- [ ] **Step 1: About values grid**

Import `StaggerGroup, StaggerItem`. Replace the `<div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12">` … `</div>` around `VALUES.map` with `<StaggerGroup className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12">` and each value `<div key …>` wrapped: `<StaggerItem key={v.title}><div className="border-t-2 border-gold pt-5" data-testid=…>…</div></StaggerItem>`.

- [ ] **Step 2: Buyers checklist**

Import `StaggerGroup, StaggerItem`. Replace `<ul className="mt-7 space-y-4">` with `<StaggerGroup className="mt-7 space-y-4" stagger={0.06}>` and close with `</StaggerGroup>`; each `<li key={point} className="flex …">` becomes `<StaggerItem key={point}><li className="flex items-start gap-3 text-sm text-slate-700">…</li></StaggerItem>`. Because `StaggerItem` renders a `div`, change the `li` to a `div` with `role="listitem"` and the group gets `role="list"`.

- [ ] **Step 3: Contact cards**

Import `StaggerGroup, StaggerItem`. Replace `<div className="space-y-2" data-testid="contact-info">` with `<StaggerGroup className="space-y-2" data-testid="contact-info">` (add `...rest` passthrough: change `StaggerGroup` signature in `motion.jsx` to `({ children, className = "", stagger = 0.07, margin = "-60px", ...rest })` and spread `{...rest}` on the `motion.div`). Wrap each of the three cards in `<StaggerItem>`. Add `card-hover ` to the className of the phone and email `<a>` cards and the address `<div>`.

- [ ] **Step 4: ListingDetail facts + features**

Import `StaggerGroup, StaggerItem`. Facts: replace the grid `div` with `<StaggerGroup className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-navy/10 border border-navy/10 mt-8" data-testid="detail-facts" stagger={0.05}>`; each fact `<div key={f.label} className="bg-white p-5">` becomes `<StaggerItem key={f.label} className="bg-white p-5">…</StaggerItem>` (move the classes onto the item; drop the inner div). Features: inside the existing `<Reveal className="mt-12">`, replace `<ul …>` with `<StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 mt-6" data-testid="detail-features" stagger={0.04} role="list">` and each `<li>` with `<StaggerItem key={f} className="flex items-center gap-3 text-sm text-slate-700 border-b border-navy/5 pb-3" role="listitem">`.

- [ ] **Step 5: Footer columns**

Add `import { StaggerGroup, StaggerItem } from "../motion";`. Replace the top grid `<div className="max-w-7xl … grid grid-cols-1 md:grid-cols-3 gap-10">` with `<StaggerGroup className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-14 grid grid-cols-1 md:grid-cols-3 gap-10" margin="0px">` and wrap each of the three column `div`s in `<StaggerItem>`. Footer is at the page bottom, so `margin="0px"` ensures it triggers.

- [ ] **Step 6: NotFound**

```jsx
import { Link } from "react-router-dom";
import { Page, StaggerGroup, StaggerItem } from "../components/motion";

export default function NotFound() {
    return (
        <Page>
            <StaggerGroup className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-32 text-center" data-testid="not-found-page">
                <StaggerItem><p className="font-serif text-5xl text-navy">404</p></StaggerItem>
                <StaggerItem><p className="text-sm text-slate-500 mt-3">This page drifted out with the tide.</p></StaggerItem>
                <StaggerItem>
                    <Link to="/" data-testid="not-found-home-link" className="inline-flex items-center justify-center mt-8 px-7 py-3.5 bg-navy text-bone text-sm font-semibold tracking-wider uppercase hover:bg-navy-surface active:scale-[0.98] transition-all duration-200 min-h-[44px]">
                        Back home
                    </Link>
                </StaggerItem>
            </StaggerGroup>
        </Page>
    );
}
```

- [ ] **Step 7: Home hover states**

In `Home.jsx` pillar `Link` (`className="group block h-full"`) add `card-hover`. In the testimonial `<figure className="bg-bone p-8 h-full border border-navy/5">` add `card-hover`.

- [ ] **Step 8: BUILD+SERVE, check**

`/about`, `/buyers`, `/contact`, a listing detail, `/nope` (404), and the footer on any page: each section cascades in. Contact cards, Home pillars and testimonials lift on hover.

- [ ] **Step 9: Commit**

```bash
git add frontend/src/components/motion.jsx frontend/src/pages/About.jsx frontend/src/pages/Buyers.jsx frontend/src/pages/Contact.jsx frontend/src/pages/ListingDetail.jsx frontend/src/components/site/Footer.jsx frontend/src/pages/NotFound.jsx frontend/src/pages/Home.jsx
git commit -m "feat(motion): reveal choreography on About, Buyers, Contact, detail, Footer, 404; hover on Home cards

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: Heroes — parallax everywhere, lighter atmosphere

**Files:**
- Modify: `frontend/src/components/site/HeroVideo.jsx`
- Modify: `frontend/src/components/site/PageHero.jsx:2, 49`
- Modify: `frontend/src/components/site/HeroAtmosphere.jsx:29-30`

- [ ] **Step 1: HeroVideo — conditional scroll, resize-aware mobile, gentler range**

Replace `frontend/src/components/site/HeroVideo.jsx` with:

```jsx
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

const MOBILE_MQ = "(max-width: 767px)";

/**
 * Ambient background video for hero sections.
 * - `src` is a path WITHOUT extension; `${src}.mp4` and `${src}-mobile.mp4` are expected.
 *   Omit it for a still-image hero: only the poster renders.
 * - Poster paints instantly; the video cross-fades in once it can play.
 * - Reduced-motion users (and browsers that refuse autoplay) simply keep the poster.
 * - `parallax` shifts the layer down as the page scrolls for a little depth.
 */
export default function HeroVideo({ src, poster, alt = "", parallax = false, className = "" }) {
    const reduce = useReducedMotion();
    const videoRef = useRef(null);
    const [ready, setReady] = useState(false);
    const [mobile, setMobile] = useState(() =>
        typeof window !== "undefined" ? window.matchMedia(MOBILE_MQ).matches : false
    );

    useEffect(() => {
        const mq = window.matchMedia(MOBILE_MQ);
        const onChange = (e) => setMobile(e.matches);
        mq.addEventListener("change", onChange);
        return () => mq.removeEventListener("change", onChange);
    }, []);

    const active = parallax && !reduce;
    const { scrollY } = useScroll();
    const y = useTransform(scrollY, [0, 900], [0, active ? 80 : 0]);
    const scale = useTransform(scrollY, [0, 900], [1, active ? 1.04 : 1]);

    useEffect(() => {
        const v = videoRef.current;
        if (!v || reduce) return;
        if (v.readyState >= 3) setReady(true);
        const p = v.play();
        if (p && typeof p.catch === "function") p.catch(() => {});
    }, [reduce, mobile]);

    return (
        <motion.div
            style={active ? { y, scale } : undefined}
            className={`absolute inset-0 ${active ? "will-change-transform" : ""} ${className}`}
            aria-hidden={alt ? undefined : true}
        >
            <img src={poster} alt={alt} className="absolute inset-0 w-full h-full object-cover" />
            {!reduce && src && (
                <video
                    key={mobile ? "m" : "d"}
                    ref={videoRef}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    poster={poster}
                    onCanPlay={() => setReady(true)}
                    onPlaying={() => setReady(true)}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[1200ms] ease-out ${
                        ready ? "opacity-100" : "opacity-0"
                    }`}
                    data-testid="hero-video"
                >
                    <source src={mobile ? `${src}-mobile.mp4` : `${src}.mp4`} type="video/mp4" />
                </video>
            )}
        </motion.div>
    );
}
```
(`useScroll` is still called unconditionally to satisfy hook rules; the transforms map to identity and `style` is omitted when inactive, so no per-frame work happens.)

- [ ] **Step 2: PageHero passes parallax**

Line 2: `import { EASE, DUR } from "../motion";` and replace every `EASE_OUT` in the file with `EASE`, `duration: 0.7` with `duration: DUR.slow`, `duration: 0.8` with `duration: DUR.slow`. Line 49: `<HeroVideo src={video} poster={poster || image} alt={alt} parallax />`.

- [ ] **Step 3: HeroAtmosphere blobs**

Lines 29–30: change `blur-[110px]` to `blur-[80px]` and `blur-[120px]` to `blur-[90px]`; add `will-change-transform` to both blob classNames.

- [ ] **Step 4: BUILD+SERVE, check**

`/buyers` and `/about`: hero footage drifts down slightly on scroll. Rotate the browser window narrower than 768px then wider: the video `<source>` switches (check `document.querySelector('[data-testid=hero-video] source').src`). Home hero unchanged in feel.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/site/HeroVideo.jsx frontend/src/components/site/PageHero.jsx frontend/src/components/site/HeroAtmosphere.jsx
git commit -m "feat(motion): parallax on every page hero, resize-aware source, lighter atmosphere blur

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: Interactive fixes

**Files:**
- Modify: `frontend/src/components/site/Gallery.jsx`
- Modify: `frontend/src/pages/Faq.jsx` (accordion transition + reduce)
- Modify: `frontend/src/components/site/Nav.jsx:253-259`
- Modify: `frontend/src/pages/Listings.jsx:115, 134-139`
- Modify: `frontend/src/components/site/InquiryForm.jsx:73, 78, 91`
- Modify: `frontend/src/pages/Home.jsx:196, 347-348`

- [ ] **Step 1: Gallery**

Add `useReducedMotion` to the framer import and `import { EASE, DUR } from "../motion";`. Inside the component add `const reduce = useReducedMotion();`. Main image: change `<AnimatePresence mode="wait">` to `<AnimatePresence mode="popLayout" initial={false}>`; set `initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.02 }}`, `transition={{ duration: DUR.fast, ease: EASE }}`, `drag={!reduce && visible.length > 1 ? "x" : false}`. Lightbox image: add `exit={{ opacity: 0 }}` and `transition={{ duration: DUR.fast, ease: EASE }}`; `initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}`. Lightbox overlay: `transition={{ duration: DUR.fast }}`.

- [ ] **Step 2: Faq accordion**

Import `useReducedMotion` from framer and `EASE, DUR` from `../components/motion`. `const reduce = useReducedMotion();` in the component. Chevron: `transition={{ duration: DUR.fast, ease: EASE }}`. Answer panel: `initial={reduce ? false : { height: 0, opacity: 0 }}`, `exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}`, `transition={{ duration: reduce ? DUR.fast : 0.3, ease: EASE }}`.

- [ ] **Step 3: Nav mobile menu**

`import { EASE, DUR } from "../motion";`. `motion.nav`: `initial={reduce ? false : { opacity: 0, height: 0 }}`, `exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}`, `transition={{ duration: reduce ? DUR.fast : 0.25, ease: EASE }}`.

- [ ] **Step 4: Listings**

Import `useReducedMotion` from framer and `SPRING, EASE, DUR` from `../components/motion`. Tab underline: `<motion.span layoutId="tab-underline" transition={SPRING} … />`. Filter panel: `const reduce = useReducedMotion();` then `initial={reduce ? false : { height: 0, opacity: 0 }}`, `exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}`, `transition={{ duration: reduce ? DUR.fast : 0.25, ease: EASE }}`.

- [ ] **Step 5: InquiryForm error exits**

`import { EASE, DUR } from "../motion";`. On each of the three error `motion.p`: `initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: DUR.fast, ease: EASE }}`.

- [ ] **Step 6: Home marquee + kenburns**

Marquee (line 196): remove `will-change-transform`; add `ref={marqueeRef}`. Add at top of component:

```jsx
    // Pause the market strip while it is off-screen.
    const marqueeRef = useRef(null);
    useEffect(() => {
        const el = marqueeRef.current;
        if (!el) return;
        const io = new IntersectionObserver(([e]) => {
            el.style.animationPlayState = e.isIntersecting ? "running" : "paused";
        });
        io.observe(el);
        return () => io.disconnect();
    }, []);
```
Kenburns (line 348): replace `className="w-full h-full object-cover animate-kenburns"` with `className="w-full h-full object-cover"` and wrap the `<img>` in `<motion.div className="w-full h-full" initial={reduce ? false : { scale: 1 }} whileInView={reduce ? {} : { scale: 1.1 }} viewport={{ once: true }} transition={{ duration: 24, ease: "linear" }}>` … `</motion.div>`. Remove `will-change-transform` from the parallax wrapper on line 347 and instead add `style={{ y: ctaImageY, willChange: reduce ? "auto" : "transform" }}`.

- [ ] **Step 7: BUILD+SERVE, check**

Listing detail gallery: arrow keys step photos quickly with a crossfade; lightbox closes with a fade. `/faq` open/close. Mobile menu at 390px. `/listings` tab underline springs like the nav underline; filter panel opens. Contact form: submit empty, errors appear; type into a field, its error fades out. Home: scroll to the final CTA, the image starts zooming only once visible.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/components/site/Gallery.jsx frontend/src/pages/Faq.jsx frontend/src/components/site/Nav.jsx frontend/src/pages/Listings.jsx frontend/src/components/site/InquiryForm.jsx frontend/src/pages/Home.jsx
git commit -m "fix(motion): gallery crossfade, reduced-motion guards on height panels, error exits, lazy kenburns, paused marquee

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 8: Full verification, push, hand off deploy

**Files:** none

- [ ] **Step 1: Token sweep**

```bash
cd C:/1projects/a_Websites/culver/culver-realty-code/culver-realty/frontend
grep -rn '"easeOut"\|EASE_OUT\|cubic-bezier(0.23' src --include=*.jsx --include=*.js --include=*.css | grep -v "components/motion.jsx"
```
Expected: no output (the alias definition in motion.jsx is the only allowed hit).

- [ ] **Step 2: BUILD+SERVE, full browser pass**

At 1440 wide and 390 wide, visit `/`, `/listings`, one `/listings/<slug>`, `/rentals`, `/buyers`, `/sellers`, `/investors`, `/management`, `/home-away`, `/about`, `/team`, `/faq`, `/contact`, `/nope`. On each: scroll to the bottom, confirm every section became visible (no stuck `opacity:0` blocks), console has no framer warnings. Screenshot each hero at 1440.

- [ ] **Step 3: Reduced-motion pass**

Chrome DevTools → Rendering → Emulate `prefers-reduced-motion: reduce`. Reload `/`, `/listings`, `/faq`. Content visible with opacity-only reveals, no parallax, hovering a card shows shadow only, FAQ opens instantly.

- [ ] **Step 4: Push**

```bash
cd C:/1projects/a_Websites/culver/culver-realty-code/culver-realty && git push origin master && git status -sb | head -1
```

- [ ] **Step 5: Ask the user to deploy**

Tell the user to run `railway up --detach`, then poll `railway deployment list --json` until SUCCESS and spot-check live `/`, `/listings`, a detail page, `/faq` at `https://culver.up.railway.app`.
