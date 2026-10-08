"""
Culver Realty & Property Management — API

Implements the exact contract consumed by frontend/src (see lib/api.js and the
admin pages). Every route lives under /api so the frontend's
REACT_APP_BACKEND_URL + "/api" base works unchanged.

Run:  uvicorn server:app --host 0.0.0.0 --port 8001 --reload
"""
import os
import re
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import List, Optional

import jwt
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, HTTPException, Request, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr, Field

import asyncio

import media
import providers
from listing_sync import ListingSync, sync_enabled
from media import MediaError
from providers import ProviderError
from seed import seed_if_empty
from store import make_store

ROOT = Path(__file__).resolve().parent
load_dotenv(ROOT / ".env")

JWT_SECRET = os.environ.get("JWT_SECRET", "change-me-in-production")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@tculverrealty.com")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "culver2026")
ADMIN_NAME = os.environ.get("ADMIN_NAME", "Site Admin")
CORS_ORIGINS = [o.strip() for o in os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(",") if o.strip()]
PROVIDER_CONFIGURED = bool(os.environ.get("RAPIDAPI_KEY") or os.environ.get("APIFY_TOKEN"))

app = FastAPI(title="Culver Realty & Property Management API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db = make_store()
sync = ListingSync(db)
UPLOADS = ROOT / "uploads"


@app.api_route("/api/uploads/{path:path}", methods=["GET", "HEAD"], include_in_schema=False)
async def uploaded_file(path: str):
    """
    Serve stored images. Runtime writes (imports, the daily sync, admin uploads) live
    under media.media_root() on the persistent volume; images committed to the repo live
    in backend/uploads inside the image. Check the volume first, then the image.
    """
    from fastapi.responses import FileResponse

    for base in (media.media_root(), UPLOADS):
        base = base.resolve()
        f = (base / path).resolve()
        if f.is_relative_to(base) and f.is_file():
            return FileResponse(f)
    raise HTTPException(404, "Not found")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def slugify(text: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return s or uuid.uuid4().hex[:8]


# ---------------------------------------------------------------- models
class Photo(BaseModel):
    url: str
    cover: bool = False
    hidden: bool = False


class PropertyIn(BaseModel):
    title: str = ""
    address: str
    city: str
    state: str = "FL"
    zip: str = ""
    price: Optional[float] = None  # sold listings often have no public price
    status: str = "draft"  # draft | live | pending | sold | off-market
    listing_type: str = "sale"  # sale | rent
    beds: Optional[float] = None
    baths: Optional[float] = None
    sqft: Optional[float] = None
    lot: Optional[str] = None
    year_built: Optional[int] = None
    property_type: Optional[str] = None
    description: str = ""
    features: List[str] = Field(default_factory=list)
    photos: List[Photo] = Field(default_factory=list)
    lat: Optional[float] = None
    lng: Optional[float] = None
    featured: bool = False
    zpid: Optional[str] = None
    source_url: Optional[str] = None
    source_provider: Optional[str] = None
    # Attribution for listing data sourced from an MLS via a provider. Displaying
    # third-party listing content means carrying its source and IDX disclaimer.
    mls_name: Optional[str] = None
    mls_id: Optional[str] = None
    mls_disclaimer: Optional[str] = None
    listing_broker: Optional[str] = None
    listing_agent: Optional[str] = None


class LeadIn(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = ""
    message: Optional[str] = ""
    type: str = "contact"  # listing_inquiry | valuation | management | tenant | home_away | contact
    listing_id: Optional[str] = None
    listing_address: Optional[str] = None


class LeadPatch(BaseModel):
    status: str  # new | contacted | closed


class LoginIn(BaseModel):
    email: str
    password: str


class IngestPreviewIn(BaseModel):
    url: str


# ---------------------------------------------------------------- auth
def make_token(user: dict) -> str:
    payload = {"sub": user["email"], "name": user["name"], "exp": datetime.now(timezone.utc) + timedelta(days=7)}
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def current_user(request: Request) -> dict:
    token = None
    auth = request.headers.get("authorization", "")
    if auth.lower().startswith("bearer "):
        token = auth[7:]
    if not token:
        token = request.cookies.get("culver_token")
    if not token:
        raise HTTPException(401, "Not authenticated")
    try:
        data = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(401, "Session expired")
    return {"email": data["sub"], "name": data.get("name", "")}


@app.post("/api/auth/login")
async def login(body: LoginIn, response: Response):
    if body.email.strip().lower() != ADMIN_EMAIL.lower() or body.password != ADMIN_PASSWORD:
        raise HTTPException(401, "Invalid email or password")
    user = {"email": ADMIN_EMAIL, "name": ADMIN_NAME}
    token = make_token(user)
    response.set_cookie("culver_token", token, httponly=True, samesite="lax", max_age=7 * 24 * 3600)
    return {"token": token, "user": user}


@app.get("/api/auth/me")
async def me(user=Depends(current_user)):
    return user


@app.post("/api/auth/logout")
async def logout(response: Response):
    response.delete_cookie("culver_token")
    return {"ok": True}


# ---------------------------------------------------------------- public
@app.get("/api/")
async def root():
    return {"message": "Culver Realty & Property Management API"}


@app.get("/api/properties")
async def list_properties(
    status: Optional[str] = None,
    listing_type: Optional[str] = None,
    featured: Optional[bool] = None,
    city: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    beds: Optional[float] = None,
    baths: Optional[float] = None,
):
    flt: dict = {"status": {"$ne": "draft"}}
    if status:
        flt["status"] = status
    if listing_type:
        flt["listing_type"] = listing_type
    if featured is not None:
        flt["featured"] = featured
    if city:
        flt["city"] = city
    if min_price is not None or max_price is not None:
        pr = {}
        if min_price is not None:
            pr["$gte"] = min_price
        if max_price is not None:
            pr["$lte"] = max_price
        flt["price"] = pr
    if beds is not None:
        flt["beds"] = {"$gte": beds}
    if baths is not None:
        flt["baths"] = {"$gte": baths}
    rows = await db.list("properties", flt, sort=("created_at", -1))
    return {"properties": rows, "count": len(rows)}


@app.get("/api/properties/cities")
async def cities():
    rows = await db.list("properties", {"status": {"$ne": "draft"}})
    return {"cities": sorted({r["city"] for r in rows if r.get("city")})}


@app.get("/api/properties/{slug}")
async def property_detail(slug: str):
    p = await db.find_one("properties", {"slug": slug})
    if not p or p.get("status") == "draft":
        raise HTTPException(404, "Listing not found")
    similar = await db.list(
        "properties",
        {"listing_type": p["listing_type"], "status": "live", "id": {"$ne": p["id"]}},
        sort=("created_at", -1),
        limit=3,
    )
    return {"property": p, "similar": similar}


@app.post("/api/leads", status_code=201)
async def create_lead(body: LeadIn):
    lead = {"id": str(uuid.uuid4()), **body.model_dump(), "status": "new", "created_at": now_iso()}
    await db.insert("leads", lead)
    return lead


# ---------------------------------------------------------------- admin
@app.get("/api/admin/stats")
async def admin_stats(user=Depends(current_user)):
    return {
        "live": await db.count("properties", {"status": "live"}),
        "drafts": await db.count("properties", {"status": "draft"}),
        "new_leads": await db.count("leads", {"status": "new"}),
        "failed_imports": await db.count("imports", {"status": "failed"}),
        "provider_configured": PROVIDER_CONFIGURED,
        "recent_imports": await db.list("imports", sort=("created_at", -1), limit=5),
        "recent_leads": await db.list("leads", sort=("created_at", -1), limit=5),
    }


@app.get("/api/admin/properties")
async def admin_properties(user=Depends(current_user)):
    rows = await db.list("properties", sort=("updated_at", -1))
    return {"properties": rows, "count": len(rows)}


@app.get("/api/admin/properties/{id}")
async def admin_property(id: str, user=Depends(current_user)):
    p = await db.get("properties", id)
    if not p:
        raise HTTPException(404, "Property not found")
    return {"property": p}


async def unique_slug(base: str, exclude_id: Optional[str] = None) -> str:
    slug, n = base, 2
    while True:
        existing = await db.find_one("properties", {"slug": slug})
        if not existing or existing.get("id") == exclude_id:
            return slug
        slug = f"{base}-{n}"
        n += 1


@app.put("/api/admin/properties/{id}")
async def admin_update_property(id: str, body: PropertyIn, user=Depends(current_user)):
    p = await db.get("properties", id)
    if not p:
        raise HTTPException(404, "Property not found")
    patch = body.model_dump()
    patch["slug"] = await unique_slug(slugify(f"{body.address} {body.city}"), exclude_id=id)
    patch["updated_at"] = now_iso()
    updated = await db.update("properties", id, patch)
    return {"property": updated}


@app.delete("/api/admin/properties/{id}")
async def admin_delete_property(id: str, user=Depends(current_user)):
    if not await db.delete("properties", id):
        raise HTTPException(404, "Property not found")
    return {"ok": True}


@app.get("/api/admin/leads")
async def admin_leads(user=Depends(current_user)):
    rows = await db.list("leads", sort=("created_at", -1))
    return {"leads": rows, "count": len(rows)}


@app.patch("/api/admin/leads/{id}")
async def admin_patch_lead(id: str, body: LeadPatch, user=Depends(current_user)):
    if body.status not in ("new", "contacted", "closed"):
        raise HTTPException(422, "Invalid status")
    lead = await db.update("leads", id, {"status": body.status})
    if not lead:
        raise HTTPException(404, "Lead not found")
    return lead


# ---------------------------------------------------------------- uploads
@app.post("/api/admin/uploads", status_code=201)
async def upload_image(file: UploadFile = File(...), user=Depends(current_user)):
    """Store an admin-uploaded image and hand back the URL to put in Photo.url."""
    try:
        url = await media.save_upload(file.filename, file.content_type, lambda: file.read(64 * 1024))
    except MediaError as exc:
        raise HTTPException(422, str(exc))
    finally:
        await file.close()
    return {"url": url}


# ---------------------------------------------------------------- ingest (Zillow import)
ZPID_RE = re.compile(r"(\d{6,})_zpid")


def extract_zpid(url: str) -> Optional[str]:
    m = ZPID_RE.search(url)
    return m.group(1) if m else None


def mock_extract(url: str, zpid: str) -> dict:
    """Demo extractor used when no ingest provider key is configured."""
    n = int(zpid[-3:]) if zpid.isdigit() else 0
    return {
        "title": "Coastal home with updated kitchen and screened lanai",
        "address": f"{100 + n} Ocean Shore Blvd",
        "city": "Ormond Beach",
        "state": "FL",
        "zip": "32176",
        "price": 425000 + (n * 1000),
        "listing_type": "sale",
        "beds": 3,
        "baths": 2,
        "sqft": 1780,
        "lot": "0.21 acres",
        "year_built": 1994,
        "property_type": "Single Family",
        "description": "Sample listing generated by the demo extractor. Add a RapidAPI or Apify key to the server environment to pull live Zillow data.",
        "features": ["Updated kitchen", "Screened lanai", "Fenced yard", "Two-car garage"],
        "photos": ["/api/uploads/seed/extra-home-1.jpg", "/api/uploads/seed/extra-interior-1.jpg", "/api/uploads/seed/extra-interior-2.jpg"],
        "lat": 29.29,
        "lng": -81.05,
    }


async def provider_extract(url: str, zpid: str) -> dict:
    """Real listing lookup. Runs when RAPIDAPI_KEY or APIFY_TOKEN is present."""
    try:
        return await providers.zillow_extract(url, zpid)
    except ProviderError as exc:
        raise HTTPException(exc.status_code, exc.message)


@app.post("/api/admin/ingest/preview")
async def ingest_preview(body: IngestPreviewIn, user=Depends(current_user)):
    url = body.url.strip()
    if "zillow.com" not in url:
        raise HTTPException(422, "Please paste a Zillow listing URL")
    zpid = extract_zpid(url)
    if not zpid:
        raise HTTPException(422, "Could not find a Zillow property ID (zpid) in that link")
    imp = {"id": str(uuid.uuid4()), "url": url, "zpid": zpid, "status": "previewed", "created_at": now_iso()}
    try:
        data = await provider_extract(url, zpid) if PROVIDER_CONFIGURED else mock_extract(url, zpid)
    except HTTPException:
        imp["status"] = "failed"
        await db.insert("imports", imp)
        raise
    await db.insert("imports", imp)
    duplicate = await db.find_one("properties", {"zpid": zpid})
    return {
        "data": data,
        "mock": not PROVIDER_CONFIGURED,
        "zpid": zpid,
        "duplicate": {"id": duplicate["id"], "slug": duplicate["slug"], "address": duplicate["address"]} if duplicate else None,
    }


@app.post("/api/admin/ingest/publish", status_code=201)
async def ingest_publish(body: PropertyIn, user=Depends(current_user)):
    ts = now_iso()
    slug = await unique_slug(slugify(f"{body.address} {body.city}"))
    doc = {
        **body.model_dump(),
        "id": str(uuid.uuid4()),
        "slug": slug,
        "created_at": ts,
        "updated_at": ts,
        "imported_at": ts,
    }
    # Copy provider photos onto our own storage so the listing does not depend on a
    # third-party CDN URL that can rotate. This is what the import screen promises.
    photos = doc.get("photos") or []
    if photos:
        result = await media.fetch_remote_images([p["url"] for p in photos], slug)
        if result["paths"]:
            doc["photos"] = [
                {"url": u, "cover": i == 0, "hidden": False}
                for i, u in enumerate(result["paths"])
            ]
        doc["photo_import_errors"] = result["errors"] or None
    await db.insert("properties", doc)
    if body.zpid:
        for imp in await db.list("imports", {"zpid": body.zpid}):
            await db.update("imports", imp["id"], {"status": "published"})
    return {"property": doc}


# ---------------------------------------------------------------- daily listing sync
@app.get("/api/admin/sync")
async def sync_status(user=Depends(current_user)):
    return {
        "enabled": sync_enabled(),
        "running": sync.running,
        "next_run": sync.next_run.isoformat() if sync.next_run else None,
        "runs": await db.list("sync_runs", sort=("started_at", -1), limit=10),
    }


@app.post("/api/admin/sync", status_code=202)
async def sync_now(dry_run: bool = False, user=Depends(current_user)):
    if not providers.apify_token():
        raise HTTPException(503, "APIFY_TOKEN is not set on the server")
    if sync.running:
        raise HTTPException(409, "A sync is already running")
    asyncio.create_task(sync.run("manual", dry_run=dry_run))
    return {"started": True, "dry_run": dry_run}


# ---------------------------------------------------------------- startup
@app.on_event("startup")
async def _startup():
    await seed_if_empty(db, ROOT / "seed" / "properties.json")
    if sync_enabled():
        app.state.sync_task = asyncio.create_task(sync.scheduler())


BUILD_DIR = ROOT.parent / "frontend" / "build"


# ---------------------------------------------------------------- crawler files (SEO / GEO / AEO)
from fastapi.responses import HTMLResponse, PlainTextResponse  # noqa: E402

import seo  # noqa: E402

CRAWL_CACHE = {"Cache-Control": "public, max-age=3600"}


@app.api_route("/robots.txt", methods=["GET", "HEAD"], include_in_schema=False)
async def robots_txt():
    return PlainTextResponse(seo.robots_txt(), headers=CRAWL_CACHE)


@app.api_route("/sitemap.xml", methods=["GET", "HEAD"], include_in_schema=False)
async def sitemap_xml():
    return Response(await seo.sitemap_xml(db), media_type="application/xml", headers=CRAWL_CACHE)


@app.api_route("/llms.txt", methods=["GET", "HEAD"], include_in_schema=False)
async def llms_txt():
    return PlainTextResponse(seo.llms_txt(), headers=CRAWL_CACHE)


@app.api_route("/llms-full.txt", methods=["GET", "HEAD"], include_in_schema=False)
async def llms_full_txt():
    return PlainTextResponse(await seo.llms_full_txt(db), headers=CRAWL_CACHE)


# ---------------------------------------------------------------- production: serve the React build
# If frontend/build exists (npm run build), serve it from this process so the site and
# /api share one origin — same topology as the live host. Dev mode uses CRA's proxy instead.
# Front-end routes get per-route meta, JSON-LD and a pre-rendered snapshot from seo.render().
if BUILD_DIR.exists():
    from fastapi.responses import FileResponse

    app.mount("/static", StaticFiles(directory=str(BUILD_DIR / "static")), name="static")
    INDEX_HTML = (BUILD_DIR / "index.html").read_text(encoding="utf-8")

    @app.api_route("/{full_path:path}", methods=["GET", "HEAD"], include_in_schema=False)
    async def spa(full_path: str):
        if full_path == "api" or full_path.startswith("api/"):
            raise HTTPException(404, "Not found")
        candidate = (BUILD_DIR / full_path).resolve()
        if full_path and candidate.is_relative_to(BUILD_DIR.resolve()) and candidate.is_file():
            return FileResponse(candidate)
        body, status, headers = await seo.render(full_path, INDEX_HTML, db)
        headers.setdefault("Cache-Control", "no-cache")
        return HTMLResponse(body, status_code=status, headers=headers)
