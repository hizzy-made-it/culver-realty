# Culver Realty & Property Management — site + admin

Local project for **culverrealtygroup.com** (Ormond Beach, FL). Recovered 1:1 from the
Emergent preview (`halifax-listings.preview.emergentagent.com`) — every page, the admin
dashboard, the theme, and all seed images/listings.

## Stack

| Layer    | Tech                                                                        |
| -------- | --------------------------------------------------------------------------- |
| Frontend | React 19 · CRA 5 + craco (`@/` alias) · Tailwind 3 + tailwindcss-animate · react-router 7 · framer-motion · TanStack Query · sonner · lucide |
| Backend  | FastAPI · PyJWT auth · JSON file store by default (MongoDB optional via `MONGO_URL`) |
| Assets   | `backend/uploads/seed/*` served at `/api/uploads/seed/*` (same URLs the frontend already uses) |

```
culver-realty/
├─ frontend/                # React app (public site + /admin)
│  ├─ public/index.html     # exact head/meta/fonts from live (Emergent analytics scripts removed)
│  ├─ src/                  # verbatim source recovered from the live bundle's source map
│  │  ├─ App.js             # routes (public via SiteLayout, /admin/* behind RequireAuth)
│  │  ├─ components/site/   # Nav, Footer, Gallery, InquiryForm, ListingCard, MobileCallBar, Seo, SiteLayout
│  │  ├─ pages/             # Home, Listings, ListingDetail, Buyers, Sellers, Investors, Management,
│  │  │                     # Rentals, About, Contact, Team, HomeAway, Faq, NotFound
│  │  ├─ pages/admin/       # AdminLogin, AdminLayout, AdminDashboard, AdminImport, AdminProperties,
│  │  │                     # AdminPropertyEdit, AdminLeads
│  │  ├─ context/AuthContext.jsx
│  │  ├─ lib/api.js · lib/site.js (BRAND constants, formatters)
│  │  ├─ index.css          # Tailwind directives + shadcn-style CSS vars (original)
│  │  └─ App.css            # shimmer / pulse-ring / no-scrollbar
│  ├─ tailwind.config.js    # navy / bone / gold / sand / seaglass palette + fonts (matches live CSS)
│  └─ craco.config.js · jsconfig.json · postcss.config.js
├─ backend/
│  ├─ server.py             # all /api routes (public, leads, auth, admin, Zillow ingest)
│  ├─ store.py              # JSON-file or Mongo persistence
│  ├─ seed.py + seed/properties.json   # 28 listings captured from live (14 live, 14 sold)
│  └─ uploads/seed/         # 36 images captured from live
├─ reference/               # raw captures: live index.html, compiled Tailwind CSS, API responses
└─ dev.sh                   # one-command local run
```

## Run

```bash
./dev.sh          # backend :8001 + frontend :3000
```

or separately:

```bash
cd backend && python3 -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt && uvicorn server:app --port 8001 --reload

cd frontend && npm install && npm start
```

`REACT_APP_BACKEND_URL` is empty by default so the app calls `/api` same-origin — in dev CRA proxies that to :8001 (`"proxy"` in package.json); in production run `npm run build` and FastAPI serves `frontend/build` + `/api` from one process (`uvicorn server:app --port 8001` → open http://localhost:8001). Set a full URL only for a split deployment.

## Admin

`/admin/login` → credentials from `backend/.env` (`ADMIN_EMAIL` / `ADMIN_PASSWORD`). Copy
`backend/.env.example` and set your own before exposing this anywhere — the checked-in
example values are placeholders, not credentials, and the deployed site does not use them.
Set a long random `JWT_SECRET` too.

Zillow import runs the **demo extractor** unless `APIFY_TOKEN` is set. With a token,
`provider_extract()` calls Apify's Zillow detail actor (see `backend/providers.py`) and
`backend/media.py` copies the returned photos onto local storage under
`backend/uploads/listings/<slug>/`. `RAPIDAPI_KEY` is recognised but not implemented.

## API contract (as consumed by the frontend)

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/properties` | filters: `status, listing_type, featured, city, min_price, max_price, beds, baths` → `{properties, count}` |
| GET | `/api/properties/cities` | `{cities}` |
| GET | `/api/properties/{slug}` | `{property, similar[3]}` |
| POST | `/api/leads` | `{name, email, phone, message, type, listing_id, listing_address}` |
| POST/GET/POST | `/api/auth/login` · `/api/auth/me` · `/api/auth/logout` | JWT via Bearer or cookie |
| GET | `/api/admin/stats` | `live, drafts, new_leads, failed_imports, provider_configured, recent_imports, recent_leads` |
| GET/GET/PUT/DELETE | `/api/admin/properties[/{id}]` | |
| GET/PATCH | `/api/admin/leads[/{id}]` | status: new / contacted / closed |
| POST | `/api/admin/ingest/preview` | `{url}` → `{data, mock, zpid, duplicate}` |
| POST | `/api/admin/ingest/publish` | property payload → `{property}` |

## What was intentionally left out

Only Emergent platform instrumentation: PostHog session recording, `emergent-main.js`,
the iframe visual-edit overlay, and the Cloudflare beacon. Nothing from the site itself.
