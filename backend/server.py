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
from fastapi import Depends, FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr, Field

from seed import seed_if_empty
from store import make_store

ROOT = Path(__file__).resolve().parent
load_dotenv(ROOT / ".env")

JWT_SECRET = os.environ.get("JWT_SECRET", "change-me-in-production")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@tculverrealty.com")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "culver2026")
ADMIN_NAME = os.environ.get("ADMIN_NAME", "Tracie Culver")
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
UPLOADS = ROOT / "uploads"
UPLOADS.mkdir(exist_ok=True)
app.mount("/api/uploads", StaticFiles(directory=str(UPLOADS)), name="uploads")


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
    price: float = 0
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
    """Hook for a real provider (RapidAPI Zillow / Apify). Wire in when keys are present."""
    raise HTTPException(502, "Ingest provider request failed")


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
    doc = {
        **body.model_dump(),
        "id": str(uuid.uuid4()),
        "slug": await unique_slug(slugify(f"{body.address} {body.city}")),
        "created_at": ts,
        "updated_at": ts,
        "imported_at": ts,
    }
    await db.insert("properties", doc)
    if body.zpid:
        for imp in await db.list("imports", {"zpid": body.zpid}):
            await db.update("imports", imp["id"], {"status": "published"})
    return {"property": doc}


# ---------------------------------------------------------------- startup
@app.on_event("startup")
async def _startup():
    await seed_if_empty(db, ROOT / "seed" / "properties.json")


# ---------------------------------------------------------------- production: serve the React build
# If frontend/build exists (npm run build), serve it from this process so the site and
# /api share one origin — same topology as the live host. Dev mode uses CRA's proxy instead.
BUILD_DIR = ROOT.parent / "frontend" / "build"
if BUILD_DIR.exists():
    from fastapi.responses import FileResponse

    app.mount("/static", StaticFiles(directory=str(BUILD_DIR / "static")), name="static")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa(full_path: str):
        candidate = BUILD_DIR / full_path
        if full_path and candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(BUILD_DIR / "index.html")
