"""
One-off backfill: pull each property's full photo set and listing metadata from its
Zillow listing, copy the photos onto our own storage, and update the catalogue.

Runs in two stages so the expensive/irreversible parts are separated:

    python backfill_zillow.py fetch     # provider lookup only, writes backfill_data.json
    python backfill_zillow.py apply     # download photos + rewrite seed/properties.json
    python backfill_zillow.py push      # PUT the updated rows to a running site

`fetch` costs about $0.0036 per listing on the Apify account. `apply` and `push` are
free and re-runnable.
"""
import asyncio
import io
import json
import os
import subprocess
import sys
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent
load_dotenv(ROOT / ".env")

import media  # noqa: E402
import providers  # noqa: E402

SEED = ROOT / "seed" / "properties.json"
DATA = ROOT / "backfill_data.json"
MAX_PHOTOS = int(os.environ.get("BACKFILL_MAX_PHOTOS", 20))
TARGET_WIDTH = 1600
JPEG_QUALITY = 4  # ffmpeg -q:v scale, 2 best .. 31 worst


def load_seed():
    raw = json.load(io.open(SEED, encoding="utf-8"))
    return raw["properties"] if isinstance(raw, dict) else raw, raw


def status_for(p):
    if p.get("status") == "sold":
        return providers.STATUS_SOLD
    if p.get("listing_type") == "rent":
        return providers.STATUS_FOR_RENT
    return providers.STATUS_FOR_SALE


def address_of(p):
    return f"{p['address']}, {p['city']}, {p.get('state') or 'FL'}"


async def stage_fetch():
    rows, _ = load_seed()
    buckets = {}
    for p in rows:
        buckets.setdefault(status_for(p), []).append(p)

    results = {}
    for status, group in buckets.items():
        addresses = [address_of(p) for p in group]
        print(f"[fetch] {status}: {len(addresses)} addresses")
        try:
            items = await providers.apify_fetch(addresses=addresses, property_status=status)
        except providers.ProviderError as exc:
            print(f"  provider error: {exc.message}")
            continue
        print(f"  got {len(items)} items")
        for it in items:
            key = (it.get("addressOrUrlFromInput") or "").strip().lower()
            if key:
                results[key] = it

    matched = {}
    for p in rows:
        key = address_of(p).strip().lower()
        it = results.get(key)
        if it is None:
            for k, v in results.items():
                if k.startswith(p["address"].strip().lower()):
                    it = v
                    break
        if it is not None:
            matched[p["slug"]] = it

    json.dump(matched, io.open(DATA, "w", encoding="utf-8"), indent=1)
    print(f"\n[fetch] matched {len(matched)}/{len(rows)} -> {DATA.name}")
    report(rows, matched)


def report(rows, matched):
    print()
    print(f"{'address':<42} {'status':<6} {'was':>4} {'avail':>6}  broker")
    print("-" * 118)
    for p in rows:
        it = matched.get(p["slug"])
        if not it:
            print(f"{p['address'][:42]:<42} {p['status']:<6} {len(p.get('photos') or []):>4} {'-':>6}  NO MATCH")
            continue
        broker = (it.get("broker") or {}).get("name") or "(none)"
        n = len(it.get("listingPhotos") or [])
        flag = "" if "culver" in broker.lower() else "   <-- NOT CULVER"
        print(f"{p['address'][:42]:<42} {p['status']:<6} {len(p.get('photos') or []):>4} {n:>6}  {broker[:44]}{flag}")


def is_ours(item: dict) -> bool:
    """
    Only import photos for listings Culver Realty actually listed. Listing photos belong
    to the listing brokerage, photographer or MLS, so copying another firm's photos onto
    this site is not ours to do. Pass --all to override deliberately.
    """
    broker = (item.get("broker") or {}).get("name") or ""
    agent = (item.get("agent") or {}).get("name") or ""
    return "culver" in broker.lower() or "culver" in agent.lower()


def shrink(path: Path):
    """Recompress in place to TARGET_WIDTH. Zillow serves 1536px originals ~240KB."""
    tmp = path.with_suffix(".tmp.jpg")
    r = subprocess.run(
        ["ffmpeg", "-y", "-v", "error", "-i", str(path),
         "-vf", f"scale='min({TARGET_WIDTH},iw)':-2", "-q:v", str(JPEG_QUALITY), str(tmp)],
        capture_output=True,
    )
    if r.returncode == 0 and tmp.exists() and tmp.stat().st_size > 0:
        if tmp.stat().st_size < path.stat().st_size:
            path.unlink()
            tmp.rename(path.with_suffix(".jpg"))
        else:
            tmp.unlink()
    elif tmp.exists():
        tmp.unlink()


async def stage_apply():
    rows, raw = load_seed()
    matched = json.load(io.open(DATA, encoding="utf-8"))
    force_all = "--all" in sys.argv
    skipped = []
    total_before = total_after = 0

    for p in rows:
        it = matched.get(p["slug"])
        total_before += len(p.get("photos") or [])
        if not it:
            total_after += len(p.get("photos") or [])
            continue
        if not force_all and not is_ours(it):
            skipped.append((p["address"], (it.get("broker") or {}).get("name") or "no broker listed"))
            total_after += len(p.get("photos") or [])
            continue

        urls = [x["url"] for x in (it.get("listingPhotos") or []) if x.get("url")][:MAX_PHOTOS]
        if not urls:
            total_after += len(p.get("photos") or [])
            continue

        res = await media.fetch_remote_images(urls, p["slug"], max_count=MAX_PHOTOS)
        for rel in res["paths"]:
            f = ROOT / rel.lstrip("/").replace("api/uploads", "uploads", 1)
            if f.exists():
                shrink(f)
        if res["errors"]:
            print(f"  {p['slug']}: {len(res['errors'])} photo errors; first: {res['errors'][0][:90]}")
        if not res["paths"]:
            total_after += len(p.get("photos") or [])
            continue

        p["photos"] = [{"url": u, "cover": i == 0, "hidden": False} for i, u in enumerate(res["paths"])]
        addr = it.get("listingAddress") or {}
        mls = it.get("mls") or {}
        p["zpid"] = str(it["zpid"]) if it.get("zpid") else p.get("zpid")
        p["source_url"] = it.get("propertyUrl") or p.get("source_url")
        p["source_provider"] = "zillow"
        p["mls_name"] = mls.get("name")
        p["mls_id"] = mls.get("id")
        p["mls_disclaimer"] = mls.get("disclaimer")
        p["listing_broker"] = (it.get("broker") or {}).get("name")
        p["listing_agent"] = (it.get("agent") or {}).get("name")
        if addr.get("zipCode") and not p.get("zip"):
            p["zip"] = addr["zipCode"]
        total_after += len(p["photos"])
        print(f"  {p['slug']}: {len(p['photos'])} photos")

    json.dump(raw, io.open(SEED, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    size = subprocess.run(["du", "-sh", str(ROOT / "uploads" / "listings")],
                          capture_output=True, text=True).stdout.split()
    print(f"\n[apply] photos {total_before} -> {total_after}; listings dir {size[0] if size else '?'}")
    if skipped:
        print(f"\n[apply] skipped {len(skipped)} listing(s) not brokered by Culver Realty:")
        for addr, broker in skipped:
            print(f"    {addr:<38} {broker}")
        print("    Re-run with --all only if you hold the rights to those photos.")


async def stage_push():
    import httpx
    base = os.environ.get("SITE_URL", "https://culver.up.railway.app").rstrip("/")
    rows, _ = load_seed()
    async with httpx.AsyncClient(timeout=60) as c:
        r = await c.post(f"{base}/api/auth/login", json={
            "email": os.environ["ADMIN_EMAIL"], "password": os.environ["ADMIN_PASSWORD"]})
        r.raise_for_status()
        token = r.json().get("token") or r.json().get("access_token")
        head = {"Authorization": f"Bearer {token}"}

        live = (await c.get(f"{base}/api/admin/properties", headers=head)).json()
        by_slug = {p["slug"]: p for p in (live.get("properties") or live)}

        ok = fail = 0
        for p in rows:
            target = by_slug.get(p["slug"])
            if not target:
                print(f"  no live row for {p['slug']}")
                fail += 1
                continue
            payload = {k: v for k, v in p.items()
                       if k not in ("id", "slug", "created_at", "updated_at", "imported_at")}
            resp = await c.put(f"{base}/api/admin/properties/{target['id']}", json=payload, headers=head)
            if resp.status_code < 300:
                ok += 1
            else:
                fail += 1
                print(f"  {p['slug']}: {resp.status_code} {resp.text[:160]}")
        print(f"\n[push] updated {ok}, failed {fail}")


if __name__ == "__main__":
    stage = sys.argv[1] if len(sys.argv) > 1 else "fetch"
    asyncio.run({"fetch": stage_fetch, "apply": stage_apply, "push": stage_push}[stage]())
