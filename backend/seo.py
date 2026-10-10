"""
Server-side SEO / GEO / AEO layer.

The site is a client-rendered React app, so without this module every URL returns the
same empty <div id="root"> shell. Most AI crawlers (GPTBot, ClaudeBot, PerplexityBot)
never run JavaScript, and Google indexes the raw HTML first. This module:

  * injects per-route <title>, description, canonical, Open Graph / Twitter tags and
    JSON-LD into index.html at request time;
  * pre-renders a semantic HTML snapshot of each page inside #root (React's createRoot
    replaces it on mount, so users see the app; crawlers see real content);
  * returns real 404s for unknown routes and noindex for /admin;
  * serves robots.txt, sitemap.xml, llms.txt and llms-full.txt.

Copy is taken from the React pages so the snapshot matches what users see. FAQs come
from frontend/src/content/faqs.json — the same file the FAQ page renders.
"""
import html
import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

ROOT = Path(__file__).resolve().parent
SITE = os.environ.get("SITE_URL", "https://www.culverrealtygroup.com").rstrip("/")

BRAND = {
    "name": "Culver Realty & Property Management",
    "short": "Culver Realty",
    "phone": "386.414.3445",
    "tel": "+1-386-414-3445",
    "email": "tracie.culver@tculverrealty.com",
    "street": "2412 John Anderson Drive",
    "city": "Ormond Beach",
    "region": "FL",
    "zip": "32176",
}
ADDRESS = f'{BRAND["street"]}, {BRAND["city"]}, {BRAND["region"]} {BRAND["zip"]}'
OG_IMAGE = "/api/uploads/seed/video/home-intracoastal-poster.jpg"
ORG_ID = f"{SITE}/#organization"
SITE_ID = f"{SITE}/#website"

AREAS = [
    ("City", "Ormond Beach"),
    ("City", "Daytona Beach"),
    ("City", "Holly Hill"),
    ("City", "Palm Coast"),
    ("AdministrativeArea", "Volusia County"),
    ("AdministrativeArea", "Flagler County"),
]

TEAM = [
    {
        "name": "Tracie Culver",
        "role": "Broker / Owner / Realtor / GRI SRES Property Manager",
        "photo": "/api/uploads/seed/team-tracie.jpeg",
        "bio": "Broker and Owner of Culver Realty & Property Management. Brings decades of sales and leadership experience from Fortune 500 companies — negotiation, strategic planning, and relationship building — to a niche brokerage built on personalized service, integrity, and results in both sales and property management.",
        "sameAs": ["https://www.zillow.com/profile/tracieculver"],
    },
    {
        "name": "Alexis Strong",
        "role": "Realtor / Senior Property Manager",
        "photo": "/api/uploads/seed/team-alexis.jpg",
        "bio": "Realtor and Senior Property Manager known for integrity, discretion, and refined client service, with a deep understanding of the luxury real estate market and premier investment properties.",
        "sameAs": ["https://www.zillow.com/profile/alexisstrong1"],
    },
    {
        "name": "Tom Culver",
        "role": "Florida Certified Building Contractor (CBC) / Realtor",
        "photo": "/api/uploads/seed/team-tom.jpg",
        "bio": "Florida Certified Building Contractor and licensed Realtor with over 25 years of experience in construction, insurance restoration, and property management — a hands-on approach that keeps properties well maintained, compliant, and profitable.",
    },
    {
        "name": "Jana Tierney",
        "role": "Realtor",
        "photo": "/api/uploads/seed/team-jana.jpg",
        "bio": "Realtor supporting buyers, sellers, and investors with local market expertise, clear communication, and a results-driven approach.",
    },
    {
        "name": "Tyce Moore",
        "role": "Realtor",
        "photo": "/api/uploads/seed/team-tyce.jpg",
        "bio": "Palm Coast Realtor, U.S. Navy veteran, and Troy University graduate who brings a strategic yet personable approach to buying and selling homes.",
    },
]

# path -> page definition. Copy mirrors the React pages.
PAGES = {
    "/": {
        "title": "Culver Realty & Property Management | Ormond Beach Real Estate",
        "description": "Residential sales, rentals, and hands-on property management serving Volusia and Flagler Counties with a specialty in Ormond Beach. Call 386.414.3445.",
        "h1": "Ormond Beach real estate & property management",
        "intro": [
            "Culver Realty & Property Management is a full-service real estate brokerage and property management company in Ormond Beach, Florida, serving Daytona Beach and communities across Volusia and Flagler Counties.",
        ],
        "sections": [
            ("Buy & Sell", "From first homes to forever homes — strategic pricing, honest counsel, and seamless closings across the Halifax coast.", "/buyers"),
            ("Invest", "Build a portfolio with local insight. We source, negotiate, and manage investment properties under one roof.", "/investors"),
            ("Property Management", "Careful tenant screening, proactive maintenance, and transparent reporting — peace of mind for owners.", "/management"),
            ("Home Away home watch", "Home watch and inspection services for second homeowners, snowbirds, and travelers.", "/home-away"),
        ],
        "listings": [
            {"listing_type": "sale", "status": "live", "featured_first": True, "limit": 3, "heading": "Sale Listings"},
            {"listing_type": "rent", "status": "live", "featured_first": True, "limit": 3, "heading": "Rental Listings"},
        ],
        "priority": "1.0",
    },
    "/listings": {
        "title": "Homes for Sale in Ormond Beach, Daytona & Flagler | Culver Realty",
        "description": "Browse homes for sale and recently sold properties in Ormond Beach, Daytona Beach, Volusia and Flagler Counties with Culver Realty & Property Management.",
        "h1": "Properties on the Halifax coast",
        "crumb": "Sale Listings",
        "intro": ["Homes for sale and recently sold properties from Culver Realty & Property Management in Ormond Beach, Daytona Beach, and across Volusia and Flagler Counties."],
        "listings": {"all": True},
    },
    "/buyers": {
        "title": "Buy a Home in Ormond Beach & Volusia County | Culver Realty",
        "description": "First-home and move-up buyers on the Halifax coast trust Culver Realty & Property Management for local expertise and honest guidance. Call 386.414.3445.",
        "h1": "Find your place on the coast — with someone who lives here",
        "crumb": "Buyers",
        "intro": ["We like to consider ourselves experts in the areas we serve — because we live here, shop here, and have fun here. Whether it's your first home or your forever home, we understand the unique needs that come with what could be the largest purchase of your life."],
        "service": ("Home buyer representation", "Real estate buyer's agent"),
    },
    "/sellers": {
        "title": "Sell Your Home in Ormond Beach & Volusia County | Culver Realty",
        "description": "Pricing, marketing, negotiation, and seamless closings across Volusia and Flagler Counties. Request a home valuation from Culver Realty & Property Management.",
        "h1": "Selling well is a craft. We treat it that way.",
        "crumb": "Sellers",
        "intro": ["Selling a property can be long and complicated — regardless of how good the market is. Whether you're a first-time seller or an experienced pro, our team will help you through every step, from pricing to marketing to finding your next home."],
        "sections": [
            ("Strategic pricing", "A data-informed price backed by street-level knowledge of Ormond Beach, Daytona, and Flagler — not a generic algorithm."),
            ("Marketing that shows", "Professional presentation, photography, and exposure designed to protect your interests and maximize value."),
            ("Negotiation", "Experienced, steady negotiation from first offer through inspection and appraisal."),
            ("Seamless closing", "Clear communication at every step so closing day feels like a formality, not a hurdle."),
            ("Request a home valuation", "Tell us about your property and we'll follow up within one business day."),
        ],
        "service": ("Home selling & listing services", "Real estate listing agent"),
    },
    "/investors": {
        "title": "Investment Properties & Management in Volusia & Flagler | Culver Realty",
        "description": "Investment property acquisition and hands-on property management under one roof in Ormond Beach, Daytona Beach, and Flagler County.",
        "h1": "Investment properties and management, under one roof",
        "crumb": "Investors",
        "intro": ["Building a real estate portfolio takes more than listings — it takes local knowledge of what rents, what sells, and what to avoid. We help you acquire with confidence, then manage with care."],
        "sections": [
            ("Acquisition", "We source rentals and value-add properties with honest rent and renovation projections for the Ormond–Daytona–Flagler corridor."),
            ("Portfolio guidance", "From your first duplex to a dozen doors — local insight on neighborhoods, flood zones, insurance, and tenant demand."),
            ("Management under one roof", "Buy it, then hand us the keys. Screening, maintenance, and transparent reporting from the same team that helped you acquire it."),
        ],
        "service": ("Investment property acquisition", "Real estate investment services"),
    },
    "/management": {
        "title": "Property Management in Ormond Beach, Volusia & Flagler | Culver Realty",
        "description": "Hands-on property management: tenant screening, proactive maintenance, and transparent reporting for owners across Volusia and Flagler Counties. Call 386.414.3445.",
        "h1": "Your investment, managed like it's ours",
        "crumb": "Property Management",
        "intro": ["Our property management division offers hands-on, proactive management to ensure properties are well maintained, tenants are carefully screened, and owners enjoy peace of mind — all handled with transparency and professionalism."],
        "sections": [
            ("Tenant screening", "Careful, consistent screening — credit, background, rental history, and income verification — so the right tenants land in your home."),
            ("Proactive maintenance", "Hands-on, proactive management keeps properties well maintained and small issues from becoming expensive ones."),
            ("Transparent reporting", "Clear statements and honest communication. You'll always know how your property is performing."),
            ("Owner peace of mind", "We treat your investment home like our own — with professionalism, strong ethics, and a long-term view."),
        ],
        "service": ("Residential property management", "Property management"),
        "priority": "0.9",
    },
    "/rentals": {
        "title": "Exclusive Rentals in Ormond Beach & Volusia County | Culver Realty",
        "description": "Find your perfect rental home in Volusia and Flagler Counties. Exclusive rentals professionally managed by Culver Realty & Property Management.",
        "h1": "Find your perfect rental home today",
        "crumb": "Rental Listings",
        "intro": ["Culver Realty & Property Management specializes in helping you find rental homes in beautiful Volusia and Flagler Counties. Our dedicated team ensures a seamless rental process, with a variety of homes to suit your lifestyle and budget. Our rentals move quickly."],
        "listings": {"listing_type": "rent", "status": "live", "heading": "Available rentals"},
        "service": ("Residential rental leasing", "Rental housing"),
    },
    "/home-away": {
        "title": "Home Away — Home Watch & Care for 2nd Homeowners | Culver Realty, Ormond Beach",
        "description": "Home inspection and home watch services in Volusia & Flagler Counties for second homeowners, snowbirds, and travelers. Weekly inspections and customizable plans. Call 386.414.3445.",
        "h1": "Peace of mind while you're away",
        "crumb": "Home Away",
        "intro": ["Second homeowners, snowbirds, and travelers — discover peace of mind with Culver Realty's Home Away care. Our home inspection services ensure your property remains secure and well-maintained while you're away."],
        "sections": [
            ("Weekly inspections", "Scheduled walk-throughs of your property — inside and out — so small issues never become expensive surprises while you're away."),
            ("Security & storm readiness", "We check doors, windows, systems, and storm vulnerability, and coordinate the right professionals the moment something needs attention."),
            ("Customizable plans", "Every home and every owner is different. Plans are tailored to your property, your schedule, and how you use your home."),
            ("Volusia & Flagler focus", "A local team that knows the coast — the weather, the vendors, and the neighborhoods — caring for your home as if it were our own."),
        ],
        "service": ("Home watch & home inspection for second homes", "Home watch service"),
    },
    "/about": {
        "title": "About Culver Realty & Property Management | Ormond Beach, FL",
        "description": "A full-service brokerage and property management company with deep roots in Volusia and Flagler Counties. Relationships come first.",
        "h1": "Deep roots on the Halifax coast",
        "crumb": "About",
        "intro": ["Culver Realty & Property Management is a full-service brokerage and property management company with deep roots in Volusia and Flagler Counties, led by Broker/Owner Tracie Culver."],
        "sections": [
            ("Relationships first", "We are committed to clear communication, strong ethics, and long-term success for our clients."),
            ("Local expertise", "Deep roots in Volusia and Flagler Counties — we live here, shop here, and have fun here."),
            ("Integrity & results", "Exceptional service delivered with integrity, expertise, and results you can measure."),
        ],
        "page_type": "AboutPage",
    },
    "/team": {
        "title": "Meet the Team | Culver Realty & Property Management, Ormond Beach",
        "description": "Meet the experienced real estate and property management team at Culver Realty & Property Management in Ormond Beach, FL — serving Volusia and Flagler Counties.",
        "h1": "Introducing the experienced team at Culver Realty",
        "crumb": "Team",
        "intro": ["Our dedicated team of professionals is committed to helping you navigate the complexities of buying, selling, or managing properties with ease."],
        "team": True,
    },
    "/faq": {
        "title": "Frequently Asked Questions | Culver Realty & Property Management",
        "description": "Answers about service areas, property management, leasing, rent payments, maintenance, home valuations, and Home Away home watch from Culver Realty in Ormond Beach, FL.",
        "h1": "Frequently asked questions",
        "crumb": "FAQ",
        "intro": ["Straight answers for tenants, owners, buyers, and sellers. Anything else — we're one call away."],
        "faq": True,
        "page_type": "FAQPage",
    },
    "/contact": {
        "title": "Contact Culver Realty & Property Management | Ormond Beach, FL",
        "description": "Call 386.414.3445 or email tracie.culver@tculverrealty.com. Office: 2412 John Anderson Drive, Ormond Beach, FL 32176.",
        "h1": "Let's start the conversation",
        "crumb": "Contact",
        "intro": ["Buying, selling, investing, or looking for a rental or a manager you can trust — we're a phone call away. We reply within one business day — usually much sooner."],
        "page_type": "ContactPage",
    },
}

NAV = [("/listings", "Sale Listings"), ("/rentals", "Rental Listings"), ("/buyers", "Buy"), ("/sellers", "Sell"),
       ("/investors", "Invest"), ("/management", "Property Management"), ("/home-away", "Home Away"),
       ("/team", "Team"), ("/about", "About"), ("/faq", "FAQ"), ("/contact", "Contact")]


# ---------------------------------------------------------------- helpers
def e(s) -> str:
    return html.escape(str(s if s is not None else ""), quote=True)


def absu(path: str) -> str:
    if not path:
        return ""
    if path.startswith("http"):
        return path
    return SITE + (path if path.startswith("/") else "/" + path)


def load_faqs() -> list:
    for p in (ROOT.parent / "frontend" / "src" / "content" / "faqs.json", ROOT / "content" / "faqs.json"):
        if p.is_file():
            return json.loads(p.read_text(encoding="utf-8"))
    return []


FAQS = load_faqs()


def fmt_price(p: dict) -> str:
    price = p.get("price")
    if not price or float(price) <= 0:
        return ""
    s = f"${float(price):,.0f}"
    return s + "/mo" if p.get("listing_type") == "rent" else s


def num(v) -> str:
    if v is None:
        return ""
    f = float(v)
    return str(int(f)) if f.is_integer() else str(f)


def status_label(p: dict) -> str:
    st = p.get("status")
    if st == "sold":
        return "Sold"
    if st == "pending":
        return "Pending"
    if st == "off-market":
        return "Off Market"
    return "For Rent" if p.get("listing_type") == "rent" else "For Sale"


def cover(p: dict) -> str:
    photos = [x for x in (p.get("photos") or []) if not x.get("hidden")]
    c = next((x for x in photos if x.get("cover")), photos[0] if photos else None)
    return (c or {}).get("url", "")


def full_address(p: dict) -> str:
    return f'{p.get("address","")}, {p.get("city","")}, {p.get("state") or "FL"} {p.get("zip") or ""}'.strip()


def public_listing(p: dict) -> bool:
    return p.get("status") in ("live", "pending", "sold")


# ---------------------------------------------------------------- JSON-LD
def org_ld() -> dict:
    return {
        "@type": ["RealEstateAgent", "LocalBusiness"],
        "@id": ORG_ID,
        "name": BRAND["name"],
        "alternateName": [BRAND["short"], "Culver Realty Group", "Culver Realty and Property Management"],
        "url": SITE + "/",
        "image": absu(OG_IMAGE),
        "logo": absu("/api/uploads/seed/culver-logo.png"),
        "telephone": BRAND["tel"],
        "email": BRAND["email"],
        "priceRange": "$$",
        "address": {
            "@type": "PostalAddress",
            "streetAddress": BRAND["street"],
            "addressLocality": BRAND["city"],
            "addressRegion": BRAND["region"],
            "postalCode": BRAND["zip"],
            "addressCountry": "US",
        },
        "areaServed": [{"@type": t, "name": n + ("" if "County" in n else ", FL")} for t, n in AREAS],
        "founder": {"@id": f"{SITE}/team#tracie-culver"},
        "employee": [{"@id": f"{SITE}/team#{slug(m['name'])}"} for m in TEAM],
        "knowsAbout": [
            "Residential real estate sales", "Home buyer representation", "Home valuation",
            "Residential property management", "Tenant screening", "Rental leasing",
            "Investment property acquisition", "Home watch services", "Ormond Beach real estate",
            "Daytona Beach real estate", "Volusia County real estate", "Flagler County real estate",
        ],
        "makesOffer": [
            {"@type": "Offer", "itemOffered": {"@type": "Service", "name": d["service"][0], "url": absu(path)}}
            for path, d in PAGES.items() if d.get("service")
        ],
        "contactPoint": {
            "@type": "ContactPoint", "telephone": BRAND["tel"], "email": BRAND["email"],
            "contactType": "customer service", "areaServed": "US-FL", "availableLanguage": "English",
        },
    }


def slug(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def website_ld() -> dict:
    return {"@type": "WebSite", "@id": SITE_ID, "url": SITE + "/", "name": BRAND["name"],
            "publisher": {"@id": ORG_ID}, "inLanguage": "en-US"}


def breadcrumb_ld(trail: list) -> dict:
    items = [("Home", "/")] + trail
    return {"@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": i + 1, "name": n, "item": absu(u)} for i, (n, u) in enumerate(items)]}


def faq_ld() -> dict:
    return {"@type": "FAQPage", "@id": absu("/faq") + "#faq", "mainEntity": [
        {"@type": "Question", "name": f["q"], "acceptedAnswer": {"@type": "Answer", "text": f["a"]}} for f in FAQS]}


def person_ld(m: dict) -> dict:
    d = {"@type": "Person", "@id": f"{SITE}/team#{slug(m['name'])}", "name": m["name"], "jobTitle": m["role"],
         "description": m["bio"], "image": absu(m["photo"]), "worksFor": {"@id": ORG_ID}, "url": absu("/team")}
    if m.get("sameAs"):
        d["sameAs"] = m["sameAs"]
    return d


def listing_ld(p: dict, url: str) -> list:
    rent = p.get("listing_type") == "rent"
    ptype = (p.get("property_type") or "").lower()
    kind = "Apartment" if ("condo" in ptype or "apart" in ptype or "apt" in (p.get("address") or "").lower()) \
        else ("SingleFamilyResidence" if "single" in ptype or not ptype else "House")
    home = {
        "@type": kind,
        "@id": url + "#home",
        "name": full_address(p),
        "address": {"@type": "PostalAddress", "streetAddress": p.get("address"), "addressLocality": p.get("city"),
                    "addressRegion": p.get("state") or "FL", "postalCode": p.get("zip") or None, "addressCountry": "US"},
    }
    if p.get("beds") is not None:
        home["numberOfBedrooms"] = p["beds"]
        home["numberOfRooms"] = p["beds"]
    if p.get("baths") is not None:
        home["numberOfBathroomsTotal"] = p["baths"]
    if p.get("sqft"):
        home["floorSize"] = {"@type": "QuantitativeValue", "value": p["sqft"], "unitCode": "FTK"}
    if p.get("year_built"):
        home["yearBuilt"] = p["year_built"]
    if p.get("lat") and p.get("lng"):
        home["geo"] = {"@type": "GeoCoordinates", "latitude": p["lat"], "longitude": p["lng"]}
    listing = {
        "@type": "RealEstateListing",
        "@id": url + "#listing",
        "url": url,
        "name": p.get("title") or full_address(p),
        "description": (p.get("description") or "")[:500] or None,
        "datePosted": (p.get("created_at") or "")[:10] or None,
        "image": [absu(x["url"]) for x in (p.get("photos") or []) if not x.get("hidden")][:10] or None,
        "about": {"@id": url + "#home"},
        "provider": {"@id": ORG_ID},
    }
    if p.get("price") and p.get("status") != "sold":
        listing["offers"] = {
            "@type": "Offer",
            "price": p["price"],
            "priceCurrency": "USD",
            "businessFunction": "http://purl.org/goodrelations/v1#LeaseOut" if rent else "http://purl.org/goodrelations/v1#Sell",
            "availability": "https://schema.org/LimitedAvailability" if p.get("status") == "pending" else "https://schema.org/InStock",
            "seller": {"@id": ORG_ID},
        }
        if rent:
            listing["offers"]["priceSpecification"] = {"@type": "UnitPriceSpecification", "price": p["price"],
                                                       "priceCurrency": "USD", "unitCode": "MON"}
    listing = {k: v for k, v in listing.items() if v is not None}
    home["address"] = {k: v for k, v in home["address"].items() if v}
    return [listing, home]


def graph(*nodes) -> str:
    flat = []
    for n in nodes:
        if isinstance(n, list):
            flat.extend(n)
        elif n:
            flat.append(n)
    data = {"@context": "https://schema.org", "@graph": flat}
    return json.dumps(data, ensure_ascii=False).replace("</", "<\\/")


# ---------------------------------------------------------------- snapshot HTML
SSR_CSS = """<style id="ssr-css">.ssr{font-family:Outfit,system-ui,sans-serif;color:#0A192F;background:#F8F6F0;min-height:100vh}
.ssr a{color:#0A192F}.ssr header{background:#0A192F;color:#F8F6F0;padding:18px 24px}.ssr header a{color:#F8F6F0;text-decoration:none;margin-right:16px;font-size:13px;letter-spacing:.06em;text-transform:uppercase}
.ssr .brand{font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;display:block;margin-bottom:8px}.ssr main{max-width:1100px;margin:0 auto;padding:40px 24px}
.ssr h1,.ssr h2,.ssr h3{font-family:'Cormorant Garamond',Georgia,serif;font-weight:600}.ssr h1{font-size:40px;margin:0 0 16px}.ssr p,.ssr li,.ssr dd{line-height:1.7;color:#334155}
.ssr ul.cards{list-style:none;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:20px}.ssr img{max-width:100%;height:auto}.ssr footer{padding:32px 24px;background:#0A192F;color:#F8F6F0}.ssr footer a{color:#C5A059}</style>"""


def header_html() -> str:
    links = "".join(f'<a href="{u}">{e(n)}</a>' for u, n in NAV)
    return f'<header><a class="brand" href="/">{e(BRAND["name"])}</a><nav aria-label="Primary">{links}</nav></header>'


def footer_html() -> str:
    return (
        '<footer itemscope itemtype="https://schema.org/RealEstateAgent">'
        f'<p><strong itemprop="name">{e(BRAND["name"])}</strong></p>'
        f'<p itemprop="address">{e(ADDRESS)}</p>'
        f'<p>Call <a itemprop="telephone" href="tel:{BRAND["tel"]}">{e(BRAND["phone"])}</a> · '
        f'<a itemprop="email" href="mailto:{BRAND["email"]}">{e(BRAND["email"])}</a></p>'
        "<p>Serving Ormond Beach, Daytona Beach, Holly Hill, Palm Coast, and all of Volusia and Flagler Counties, Florida.</p>"
        "</footer>"
    )


def crumbs_html(trail: list) -> str:
    items = [("Home", "/")] + trail
    parts = [f'<a href="{u}">{e(n)}</a>' if i < len(items) - 1 else f"<span>{e(n)}</span>" for i, (n, u) in enumerate(items)]
    return f'<nav aria-label="Breadcrumb"><p>{" › ".join(parts)}</p></nav>'


def card_html(p: dict) -> str:
    url = f'/listings/{p.get("slug")}'
    facts = " · ".join(x for x in [
        f'{num(p.get("beds"))} bd' if p.get("beds") is not None else "",
        f'{num(p.get("baths"))} ba' if p.get("baths") is not None else "",
        f'{float(p["sqft"]):,.0f} sqft' if p.get("sqft") else "",
    ] if x)
    img = cover(p)
    img_html = f'<img src="{e(img)}" alt="{e(full_address(p))}" width="400" height="267" loading="lazy">' if img else ""
    return (f'<li><article>{img_html}<h3><a href="{e(url)}">{e(full_address(p))}</a></h3>'
            f'<p>{e(status_label(p))}{" · " + e(fmt_price(p)) if fmt_price(p) else ""}{" · " + e(facts) if facts else ""}</p></article></li>')


def listings_html(rows: list, heading: str) -> str:
    if not rows:
        return ""
    return f'<section><h2>{e(heading)}</h2><ul class="cards">{"".join(card_html(p) for p in rows)}</ul></section>'


def page_body(path: str, page: dict, props: list) -> str:
    out = [f'<h1>{e(page["h1"])}</h1>']
    for para in page.get("intro", []):
        out.append(f"<p>{e(para)}</p>")
    for sec in page.get("sections", []):
        h, txt = sec[0], sec[1]
        link = f' <a href="{sec[2]}">Learn more about {e(h.lower())}</a>' if len(sec) > 2 else ""
        out.append(f"<section><h2>{e(h)}</h2><p>{e(txt)}{link}</p></section>")
    specs = page.get("listings")
    pub = [p for p in props if public_listing(p)]
    for lst in (specs if isinstance(specs, list) else [specs] if specs else []):
        if lst.get("all"):  # /listings: sale listings only; rentals live on /rentals
            out.append(listings_html([p for p in pub if p["status"] != "sold" and p.get("listing_type") == "sale"], "Homes for sale"))
            out.append(listings_html([p for p in pub if p["status"] == "sold"], "Recently sold"))
        else:
            rows = [p for p in pub if p.get("status") == lst.get("status", p.get("status"))
                    and (not lst.get("listing_type") or p.get("listing_type") == lst["listing_type"])
                    and (not lst.get("featured") or p.get("featured"))]
            if lst.get("featured_first"):
                rows = [p for p in rows if p.get("featured")] + [p for p in rows if not p.get("featured")]
            out.append(listings_html(rows[: lst.get("limit", 100)], lst["heading"]))
    if page.get("team"):
        for m in TEAM:
            out.append(f'<section id="{slug(m["name"])}"><h2>{e(m["name"])}</h2><p><strong>{e(m["role"])}</strong></p><p>{e(m["bio"])}</p></section>')
    if page.get("faq"):
        out.append("<section><dl>" + "".join(f"<dt><h2>{e(f['q'])}</h2></dt><dd><p>{e(f['a'])}</p></dd>" for f in FAQS) + "</dl></section>")
    if path in ("/contact", "/about"):
        out.append(f'<section><h2>Office</h2><p>{e(ADDRESS)}</p><p>Phone: <a href="tel:{BRAND["tel"]}">{e(BRAND["phone"])}</a><br>Email: <a href="mailto:{BRAND["email"]}">{e(BRAND["email"])}</a></p></section>')
    return "".join(out)


def detail_body(p: dict, similar: list) -> str:
    facts = [("Status", status_label(p)), ("Price", fmt_price(p)), ("Bedrooms", num(p.get("beds"))),
             ("Bathrooms", num(p.get("baths"))), ("Square feet", f'{float(p["sqft"]):,.0f}' if p.get("sqft") else ""),
             ("Lot", p.get("lot")), ("Year built", p.get("year_built")), ("Property type", p.get("property_type"))]
    dl = "".join(f"<dt>{e(k)}</dt><dd>{e(v)}</dd>" for k, v in facts if v)
    imgs = [x["url"] for x in (p.get("photos") or []) if not x.get("hidden")][:6]
    gal = "".join(f'<img src="{e(u)}" alt="{e(full_address(p))} photo {i + 1}" width="400" height="267" loading="lazy">' for i, u in enumerate(imgs))
    feats = "".join(f"<li>{e(f)}</li>" for f in (p.get("features") or []))
    desc = "".join(f"<p>{e(x)}</p>" for x in (p.get("description") or "").split("\n") if x.strip())
    attrib = ""
    if p.get("listing_broker") or p.get("mls_disclaimer"):
        attrib = f'<p><small>{e("Listing courtesy of " + p["listing_broker"] + ". ") if p.get("listing_broker") else ""}{e(p.get("mls_disclaimer") or "")}</small></p>'
    return (f'<h1>{e(full_address(p))}</h1><p>{e(p.get("title") or "")}</p><dl>{dl}</dl>{gal}'
            f'{"<h2>About this property</h2>" + desc if desc else ""}{"<h2>Features</h2><ul>" + feats + "</ul>" if feats else ""}'
            f'<p>Interested? Call <a href="tel:{BRAND["tel"]}">{e(BRAND["phone"])}</a> or <a href="/contact">contact Culver Realty</a>.</p>'
            f'{attrib}{listings_html(similar, "Similar properties")}')


# ---------------------------------------------------------------- head + render
def head_tags(*, title, description, canonical, image, ld_json, robots="index, follow, max-image-preview:large, max-snippet:-1", og_type="website", path="") -> str:
    img = absu(image or OG_IMAGE)
    tags = [
        f'<link rel="canonical" href="{e(canonical)}">' if canonical else "",
        f'<meta name="robots" content="{robots}">',
        f'<meta property="og:site_name" content="{e(BRAND["name"])}">',
        f'<meta property="og:type" content="{og_type}">',
        f'<meta property="og:title" content="{e(title)}">',
        f'<meta property="og:description" content="{e(description)}">',
        f'<meta property="og:url" content="{e(canonical)}">' if canonical else "",
        f'<meta property="og:image" content="{e(img)}">',
        '<meta property="og:locale" content="en_US">',
        '<meta name="twitter:card" content="summary_large_image">',
        f'<meta name="twitter:title" content="{e(title)}">',
        f'<meta name="twitter:description" content="{e(description)}">',
        f'<meta name="twitter:image" content="{e(img)}">',
        '<meta name="geo.region" content="US-FL"><meta name="geo.placename" content="Ormond Beach">',
        f'<script type="application/ld+json" data-ssr-path="{e(path)}">{ld_json}</script>' if ld_json else "",
        SSR_CSS,
    ]
    return "".join(t for t in tags if t)


def inject(template: str, *, title, description, head, body) -> str:
    out = re.sub(r"<title>.*?</title>", f"<title>{e(title)}</title>", template, count=1, flags=re.S)
    out = re.sub(r'<meta name="description" content="[^"]*"\s*/?>', f'<meta name="description" content="{e(description)}"/>', out, count=1)
    out = out.replace("</head>", head + "</head>", 1)
    shell = f'<div class="ssr" id="ssr">{header_html()}<main>{body}</main>{footer_html()}</div>'
    return out.replace('<div id="root"></div>', f'<div id="root">{shell}</div>', 1)


async def render(path: str, template: str, db) -> tuple[str, int, dict]:
    """Return (html, status, headers) for a front-end route."""
    path = "/" + path.strip("/") if path.strip("/") else "/"
    headers = {}

    if path == "/admin" or path.startswith("/admin/"):
        title = f'Admin | {BRAND["short"]}'
        head = '<meta name="robots" content="noindex, nofollow">'
        headers["X-Robots-Tag"] = "noindex, nofollow"
        out = re.sub(r"<title>.*?</title>", f"<title>{e(title)}</title>", template, count=1, flags=re.S).replace("</head>", head + "</head>", 1)
        return out, 200, headers

    props = await db.list("properties", {"status": {"$ne": "draft"}}, sort=("created_at", -1))

    if path in PAGES:
        page = PAGES[path]
        canonical = absu(path) if path != "/" else SITE + "/"
        nodes = [org_ld(), website_ld()]
        wp = {"@type": page.get("page_type", "WebPage"), "@id": canonical + "#webpage", "url": canonical,
              "name": page["title"], "description": page["description"], "isPartOf": {"@id": SITE_ID},
              "about": {"@id": ORG_ID}, "inLanguage": "en-US"}
        if page.get("crumb"):
            nodes.append(breadcrumb_ld([(page["crumb"], path)]))
        if page.get("service"):
            name, stype = page["service"]
            nodes.append({"@type": "Service", "@id": canonical + "#service", "name": name, "serviceType": stype,
                          "description": page["description"], "provider": {"@id": ORG_ID}, "url": canonical,
                          "areaServed": [{"@type": t, "name": n} for t, n in AREAS]})
        if page.get("faq"):
            faq = faq_ld()
            faq.update({"url": canonical, "name": page["title"], "isPartOf": {"@id": SITE_ID}})
            wp = None
            nodes.append(faq)
        if page.get("team"):
            nodes.extend(person_ld(m) for m in TEAM)
        if wp:
            nodes.append(wp)
        body = (crumbs_html([(page["crumb"], path)]) if page.get("crumb") else "") + page_body(path, page, props)
        head = head_tags(title=page["title"], description=page["description"], canonical=canonical,
                         image=None, ld_json=graph(*nodes), path=path)
        return inject(template, title=page["title"], description=page["description"], head=head, body=body), 200, headers

    m = re.fullmatch(r"/listings/([a-z0-9-]+)", path)
    if m:
        p = next((x for x in props if x.get("slug") == m.group(1)), None)
        if p and public_listing(p):
            canonical = absu(path)
            price = fmt_price(p)
            title = f'{p["address"]}, {p["city"]} FL{" — " + price if price else ""} | {BRAND["short"]}'
            bits = [f'{num(p.get("beds"))} bed' if p.get("beds") is not None else "",
                    f'{num(p.get("baths"))} bath' if p.get("baths") is not None else "",
                    f'{float(p["sqft"]):,.0f} sqft' if p.get("sqft") else ""]
            description = (f'{status_label(p)}: {full_address(p)}. {" / ".join(b for b in bits if b)}. '
                           f'{(p.get("title") or "").rstrip(".")}. Culver Realty & Property Management, Ormond Beach.').replace(" . ", " ").replace("..", ".")
            similar = [x for x in props if x.get("status") == "live" and x.get("listing_type") == p.get("listing_type") and x["id"] != p["id"]][:3]
            parent = ("Rental Listings", "/rentals") if p.get("listing_type") == "rent" else ("Sale Listings", "/listings")
            nodes = [org_ld(), website_ld(),
                     breadcrumb_ld([parent, (full_address(p), path)]),
                     {"@type": "WebPage", "@id": canonical + "#webpage", "url": canonical, "name": title,
                      "isPartOf": {"@id": SITE_ID}, "mainEntity": {"@id": canonical + "#listing"}},
                     listing_ld(p, canonical)]
            body = crumbs_html([parent, (full_address(p), path)]) + detail_body(p, similar)
            head = head_tags(title=title, description=description, canonical=canonical, image=cover(p),
                             ld_json=graph(*nodes), path=path)
            return inject(template, title=title, description=description, head=head, body=body), 200, headers

    title = f'Page not found | {BRAND["short"]}'
    description = "The page you're looking for doesn't exist. Browse listings or contact Culver Realty & Property Management in Ormond Beach, FL."
    head = head_tags(title=title, description=description, canonical="", image=None, ld_json="", robots="noindex, follow", path=path)
    body = '<h1>Page not found</h1><p>That page doesn\'t exist. Try <a href="/listings">our listings</a> or <a href="/contact">contact us</a>.</p>'
    return inject(template, title=title, description=description, head=head, body=body), 404, headers


# ---------------------------------------------------------------- crawler files
AI_BOTS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "Claude-User",
           "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended", "Bingbot",
           "CCBot", "Amazonbot", "meta-externalagent", "DuckAssistBot", "MistralAI-User"]


def robots_txt() -> str:
    rules = "Allow: /\nAllow: /api/uploads/\nDisallow: /admin\nDisallow: /api/\n"
    groups = ["User-agent: *\n" + rules]
    groups.append("".join(f"User-agent: {b}\n" for b in AI_BOTS) + rules)
    return "# Culver Realty & Property Management\n# AI assistants and search engines are welcome.\n\n" + "\n".join(groups) + f"\nSitemap: {SITE}/sitemap.xml\n"


def _lastmod(s: Optional[str]) -> str:
    return (s or datetime.now(timezone.utc).isoformat())[:10]


async def sitemap_xml(db) -> str:
    props = await db.list("properties", {"status": {"$ne": "draft"}}, sort=("created_at", -1))
    pub = [p for p in props if public_listing(p)]
    newest = max((p.get("updated_at") or p.get("created_at") or "" for p in pub), default="")
    urls = []
    for path in PAGES:
        lm = _lastmod(newest) if path in ("/", "/listings", "/rentals") else _lastmod(None)
        urls.append(f"<url><loc>{e(SITE + path if path != '/' else SITE + '/')}</loc><lastmod>{lm}</lastmod></url>")
    for p in pub:
        imgs = [x["url"] for x in (p.get("photos") or []) if not x.get("hidden")][:5]
        img_xml = "".join(f"<image:image><image:loc>{e(absu(u))}</image:loc></image:image>" for u in imgs)
        urls.append(f'<url><loc>{e(absu("/listings/" + p["slug"]))}</loc><lastmod>{_lastmod(p.get("updated_at") or p.get("created_at"))}</lastmod>{img_xml}</url>')
    return ('<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n'
            + "\n".join(urls) + "\n</urlset>\n")


def _facts_md() -> str:
    areas = ", ".join(n for _, n in AREAS)
    return (f"- Business: {BRAND['name']} (also known as {BRAND['short']})\n"
            f"- Type: Real estate brokerage and residential property management company\n"
            f"- Office: {ADDRESS}\n- Phone: {BRAND['phone']}\n- Email: {BRAND['email']}\n- Website: {SITE}/\n"
            f"- Broker/Owner: Tracie Culver\n- Service area: {areas}, Florida\n"
            "- Services: home buying, home selling and valuations, investment property acquisition, residential property management, exclusive rentals, Home Away home watch for second homes\n")


def llms_txt() -> str:
    lines = [f"# {BRAND['name']}", "",
             f"> {BRAND['name']} is a full-service real estate brokerage and property management company in Ormond Beach, Florida, serving Daytona Beach, Holly Hill, Palm Coast, and all of Volusia and Flagler Counties. Broker/Owner: Tracie Culver. Phone {BRAND['phone']}.",
             "", "## Key facts", "", _facts_md().rstrip(), "", "## Pages", ""]
    for path, p in PAGES.items():
        lines.append(f"- [{p.get('crumb') or 'Home'}]({SITE}{path if path != '/' else '/'}): {p['description']}")
    lines += ["", "## Optional", "", f"- [Full content for AI assistants]({SITE}/llms-full.txt): every page, FAQ, team bio, and current listings in plain text",
              f"- [Sitemap]({SITE}/sitemap.xml)", ""]
    return "\n".join(lines)


async def llms_full_txt(db) -> str:
    props = await db.list("properties", {"status": {"$ne": "draft"}}, sort=("created_at", -1))
    pub = [p for p in props if public_listing(p)]
    out = [f"# {BRAND['name']} — full site content", "", _facts_md(), ""]
    for path, p in PAGES.items():
        out += [f"## {p['h1']}", f"URL: {SITE}{path}", ""] + p.get("intro", [])
        for sec in p.get("sections", []):
            out += ["", f"### {sec[0]}", sec[1]]
        out.append("")
    out += ["## Team", ""]
    for m in TEAM:
        out += [f"### {m['name']} — {m['role']}", m["bio"], ""]
    out += ["## Frequently asked questions", ""]
    for f in FAQS:
        out += [f"### {f['q']}", f["a"], ""]
    out += ["## Current listings", ""]
    for p in pub:
        bits = [status_label(p), fmt_price(p), f"{num(p.get('beds'))} bed" if p.get("beds") is not None else "",
                f"{num(p.get('baths'))} bath" if p.get("baths") is not None else "",
                f"{float(p['sqft']):,.0f} sqft" if p.get("sqft") else ""]
        out.append(f"- {full_address(p)} — {', '.join(b for b in bits if b)} — {SITE}/listings/{p['slug']}")
    out.append("")
    return "\n".join(out)
