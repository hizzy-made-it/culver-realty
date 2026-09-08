"""
Listing data providers.

`server.provider_extract()` calls into here when APIFY_TOKEN is set. Everything is
normalised to the same dict shape the demo extractor returns, so the admin import screen
parses provider data and demo data identically.

Apify's zillow-detail-scraper takes either a listing URL or a plain street address, which
matters for backfilling a catalogue that has no stored Zillow links.
"""
import os
from typing import List, Optional

import httpx

APIFY_ACTOR = "maxcopell~zillow-detail-scraper"
APIFY_ENDPOINT = f"https://api.apify.com/v2/acts/{APIFY_ACTOR}/run-sync-get-dataset-items"


# Read at call time, not import time: server.py imports this module before it calls
# load_dotenv(), so anything captured at import would miss the .env file entirely.
def apify_token() -> str:
    return os.environ.get("APIFY_TOKEN", "")


def rapidapi_key() -> str:
    return os.environ.get("RAPIDAPI_KEY", "")


def apify_timeout() -> float:
    # The actor cold-starts and then crawls, so this is deliberately generous.
    return float(os.environ.get("APIFY_TIMEOUT", 180))

STATUS_FOR_SALE = "FOR_SALE"
STATUS_FOR_RENT = "FOR_RENT"
STATUS_SOLD = "RECENTLY_SOLD"


class ProviderError(Exception):
    """Provider failure with a message worth showing an admin."""

    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def _features_from(props: dict) -> List[str]:
    """Flatten the interesting propertyFeatures lists into the flat list the app shows."""
    if not isinstance(props, dict):
        return []
    out: List[str] = []
    for key in ("interiorFeatures", "exteriorFeatures", "appliances", "view", "flooring", "cooling", "heating"):
        for v in props.get(key) or []:
            if isinstance(v, str) and v.strip() and v not in out:
                out.append(v.strip())
    for key in ("architecturalStyle", "roofType"):
        v = props.get(key)
        if isinstance(v, str) and v.strip() and v not in out:
            out.append(v.strip())
    return out[:14]


def _listing_type(item: dict) -> str:
    status = (item.get("listingStatus") or "").upper()
    return "rent" if "RENT" in status else "sale"


def _price(item: dict) -> float:
    price = (item.get("listingPrice") or {}).get("amount")
    if not price:
        price = item.get("lastSoldPrice") or item.get("zestimate") or 0
    try:
        return float(price or 0)
    except (TypeError, ValueError):
        return 0.0


def normalise(item: dict) -> dict:
    """Map one Apify result onto the shape the admin import screen already consumes."""
    addr = item.get("listingAddress") or {}
    coords = item.get("coordinates") or {}
    lot = item.get("lotArea") or {}
    mls = item.get("mls") or {}
    broker = item.get("broker") or {}
    agent = item.get("agent") or {}
    home_type = item.get("homeType") or ""
    city = addr.get("city") or ""

    title = " ".join(w.capitalize() for w in home_type.replace("_", " ").split()) if home_type else ""
    title = f"{title} in {city}".strip() if city and title else (title or city)

    return {
        "title": title,
        "address": addr.get("street") or "",
        "city": city,
        "state": addr.get("state") or "FL",
        "zip": addr.get("zipCode") or "",
        "price": _price(item),
        "listing_type": _listing_type(item),
        "beds": item.get("bedrooms"),
        "baths": item.get("bathrooms"),
        "sqft": item.get("livingArea"),
        "lot": lot.get("formatted"),
        "year_built": item.get("yearBuilt"),
        "property_type": home_type or None,
        "description": item.get("description") or "",
        "features": _features_from(item.get("propertyFeatures")),
        # Remote URLs at this point. server.ingest_publish copies them to our own storage.
        "photos": [p.get("url") for p in (item.get("listingPhotos") or []) if isinstance(p, dict) and p.get("url")],
        "lat": coords.get("latitude"),
        "lng": coords.get("longitude"),
        "zpid": str(item["zpid"]) if item.get("zpid") else None,
        "source_url": item.get("propertyUrl"),
        "source_provider": "zillow",
        # Attribution. Displaying third-party listing data means naming its source.
        "mls_name": mls.get("name"),
        "mls_id": mls.get("id"),
        "mls_disclaimer": mls.get("disclaimer"),
        "listing_broker": broker.get("name"),
        "listing_agent": agent.get("name"),
        "listing_status": item.get("listingStatus"),
        "photo_count": item.get("photoCount"),
        "matched_input": item.get("addressOrUrlFromInput"),
    }


async def apify_fetch(
    urls: Optional[List[str]] = None,
    addresses: Optional[List[str]] = None,
    property_status: str = STATUS_FOR_SALE,
) -> List[dict]:
    """Run the actor and return the raw dataset items. Raises ProviderError on failure."""
    token = apify_token()
    if not token:
        raise ProviderError("APIFY_TOKEN is not set on the server", 503)

    payload: dict = {"propertyStatus": property_status}
    if urls:
        payload["startUrls"] = [{"url": u} for u in urls]
    if addresses:
        payload["addresses"] = list(addresses)
    if not urls and not addresses:
        raise ProviderError("Nothing to look up: no URL or address given", 422)

    try:
        async with httpx.AsyncClient(timeout=apify_timeout()) as client:
            resp = await client.post(
                APIFY_ENDPOINT,
                params={"token": token},
                json=payload,
            )
    except httpx.TimeoutException:
        raise ProviderError("The listing provider timed out. Try again in a moment.", 504)
    except httpx.HTTPError as exc:
        raise ProviderError(f"Could not reach the listing provider ({exc.__class__.__name__})", 502)

    if resp.status_code == 401:
        raise ProviderError("The listing provider rejected our API token", 502)
    if resp.status_code == 402:
        raise ProviderError("The listing provider account is out of credit", 502)
    if resp.status_code >= 400:
        raise ProviderError(f"The listing provider returned {resp.status_code}", 502)

    try:
        items = resp.json()
    except ValueError:
        raise ProviderError("The listing provider returned a response we could not read", 502)

    return items if isinstance(items, list) else []


async def zillow_extract(url: str, zpid: str) -> dict:
    """Single-listing lookup used by the admin import screen."""
    if not apify_token() and rapidapi_key():
        raise ProviderError(
            "RAPIDAPI_KEY is set but the RapidAPI provider is not implemented. Set APIFY_TOKEN instead.",
            501,
        )

    items = await apify_fetch(urls=[url], property_status=STATUS_FOR_SALE)
    if not items:
        raise ProviderError("The provider found no listing at that URL", 404)

    item = items[0]
    if item.get("isValid") is False:
        reason = item.get("invalidReason") or "the listing is unavailable"
        raise ProviderError(f"Could not import that listing: {reason}", 422)

    data = normalise(item)
    if not data.get("address"):
        raise ProviderError("The provider returned a listing with no address", 502)

    # The actor will fall back to a nearby match rather than fail on an unknown zpid, so
    # a mistyped URL can quietly return somebody else's house. Refuse the mismatch.
    returned = data.get("zpid")
    if zpid and returned and str(returned) != str(zpid):
        raise ProviderError(
            f"That link points at property {zpid} but the provider returned {returned} "
            f"({data['address']}). Check the URL.",
            422,
        )

    if not returned:
        data["zpid"] = zpid
    if not data.get("source_url"):
        data["source_url"] = url
    return data
