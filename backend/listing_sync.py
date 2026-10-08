"""
Daily listing sync: keep the catalogue's for-sale, for-rent and sold listings in step
with Zillow for Culver Realty's agents.

Sources (all through licensed Apify actors; never a browser pointed at zillow.com):

  * Agent profiles (`providers.apify_agents`) for Tracie Culver and Alexis Strong. These
    give every active for-sale listing with its current price, any rentals filed under
    the agent, and recent past sales with the side the agent represented.
  * The detail actor (`providers.apify_fetch`) for anything that needs more than the
    profile summary: a listing we have never seen (photos, description, attribution),
    a managed listing that dropped off the profile (did it sell, go pending, or vanish?),
    and every live rental. Culver's rentals are posted under the company, not under an
    agent, so the agent profiles never list them; they are re-checked one by one.

Rules:

  * Only listings where Tracie Culver or Alexis Strong is the listing agent or co-agent.
    Past sales count only where the agent represented the seller, so a sale where Culver
    only brought the buyer does not appear as a Culver listing.
  * Photos are copied only for listings brokered by Culver (see backfill_zillow.is_ours).
  * Drafts are never touched: a draft is an admin's decision to hide something.
  * Rows the sync does not manage (other agents, legacy rows with no Zillow id) are left
    alone. Nothing is ever deleted; a listing that goes away becomes `off-market`, and
    only after it has been missing on two consecutive runs, so one flaky provider
    response cannot pull a live listing off the site.

Run by the scheduler in server.py once a day, by POST /api/admin/sync, or from the
command line:

    python listing_sync.py            # dry run against backend/data/db.json
    python listing_sync.py --apply    # write changes
"""
import asyncio
import logging
import os
import re
import uuid
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional
from zoneinfo import ZoneInfo

import media
import providers
from providers import ProviderError

log = logging.getLogger("listing_sync")

DEFAULT_PROFILES = (
    "https://www.zillow.com/profile/tracieculver",
    "https://www.zillow.com/profile/alexisstrong1",
)
DEFAULT_AGENT_NAMES = ("Tracie Culver", "Alexis Strong")
ZILLOW = "https://www.zillow.com"

# Fields an admin can edit (server.PropertyIn). New rows carry these plus bookkeeping.
PROPERTY_FIELDS = (
    "title", "address", "city", "state", "zip", "price", "status", "listing_type", "beds",
    "baths", "sqft", "lot", "year_built", "property_type", "description", "features",
    "photos", "lat", "lng", "featured", "zpid", "source_url", "source_provider",
    "mls_name", "mls_id", "mls_disclaimer", "listing_broker", "listing_agent",
)


# ---------------------------------------------------------------- config (read at call time)
def profiles() -> List[str]:
    raw = os.environ.get("SYNC_AGENT_PROFILES")
    return [u.strip() for u in raw.split(",") if u.strip()] if raw else list(DEFAULT_PROFILES)


def agent_names() -> set:
    raw = os.environ.get("SYNC_AGENT_NAMES")
    names = [n.strip() for n in raw.split(",")] if raw else list(DEFAULT_AGENT_NAMES)
    return {n.lower() for n in names if n}


def sold_window_days() -> int:
    return int(os.environ.get("SYNC_SOLD_WINDOW_DAYS", 730))


def miss_threshold() -> int:
    return int(os.environ.get("SYNC_MISS_THRESHOLD", 2))


def max_photos() -> int:
    return int(os.environ.get("SYNC_MAX_PHOTOS", 15))


def photo_variant() -> str:
    # 1152px wide, ~215KB. The 1536px originals are ~270KB and the container has no
    # ffmpeg to shrink them, so ask Zillow for the smaller rendition instead.
    return os.environ.get("SYNC_PHOTO_VARIANT", "cc_ft_1152")


def sync_enabled() -> bool:
    # On by default in Railway (which sets RAILWAY_ENVIRONMENT_NAME), off locally so a dev
    # server does not quietly spend provider credit or rewrite a local database.
    default = "1" if os.environ.get("RAILWAY_ENVIRONMENT_NAME") else "0"
    return os.environ.get("SYNC_ENABLED", default) == "1" and bool(providers.apify_token())


def sync_tz() -> ZoneInfo:
    return ZoneInfo(os.environ.get("SYNC_TZ", "America/New_York"))


def sync_hour() -> int:
    return int(os.environ.get("SYNC_HOUR", 6))


# ---------------------------------------------------------------- helpers
SUFFIXES = {
    "drive": "dr", "street": "st", "road": "rd", "lane": "ln", "circle": "cir",
    "boulevard": "blvd", "avenue": "ave", "court": "ct", "trail": "trl", "place": "pl",
    "terrace": "ter", "parkway": "pkwy", "highway": "hwy", "north": "n", "south": "s",
    "east": "e", "west": "w", "apartment": "apt", "unit": "apt", "suite": "apt",
}


def norm_addr(street: str, city: str) -> str:
    """'708 CRESTWOOD DRIVE', 'Saint Augustine' and '708 Crestwood Dr' compare equal."""
    s = re.sub(r"[^a-z0-9 ]+", " ", f"{street or ''} {city or ''}".lower().replace("#", " apt "))
    return " ".join(SUFFIXES.get(w, w) for w in s.split())


def money(value) -> Optional[float]:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value) or None
    digits = re.sub(r"[^\d.]", "", str(value))
    try:
        return float(digits) or None
    except ValueError:
        return None


def zurl(path_or_url: Optional[str], zpid: Optional[str] = None) -> Optional[str]:
    if path_or_url:
        return path_or_url if path_or_url.startswith("http") else ZILLOW + path_or_url
    return f"{ZILLOW}/homedetails/{zpid}_zpid/" if zpid else None


def resized(url: str) -> str:
    return re.sub(
        r"-(?:uncropped_scaled_within_\d+_\d+|cc_ft_\d+|p_[a-z])\.(?:jpg|jpeg|webp|png)$",
        f"-{photo_variant()}.jpg",
        url,
    )


def slugify(text: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return s or uuid.uuid4().hex[:8]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def fmt_price(p) -> str:
    return f"${p:,.0f}" if isinstance(p, (int, float)) else "none"


def item_agents(item: dict) -> set:
    agent = item.get("agent") or {}
    return {(agent.get(k) or "").strip().lower() for k in ("name", "coAgentName")} - {""}


def is_our_agent(item: dict) -> bool:
    return bool(item_agents(item) & agent_names())


def is_culver_brokered(item: dict) -> bool:
    broker = ((item.get("broker") or {}).get("name") or "").lower()
    return "culver" in broker or "culver" in " ".join(item_agents(item))


class SyncAbort(Exception):
    """Source data is incomplete; apply nothing rather than act on half a picture."""


# ---------------------------------------------------------------- the run
class ListingSync:
    def __init__(self, db):
        self.db = db
        self.lock = asyncio.Lock()
        self.next_run: Optional[datetime] = None

    @property
    def running(self) -> bool:
        return self.lock.locked()

    async def run(self, trigger: str = "manual", dry_run: bool = False) -> dict:
        if self.lock.locked():
            raise RuntimeError("A sync is already running")
        async with self.lock:
            report = {
                "id": str(uuid.uuid4()),
                "trigger": trigger,
                "dry_run": dry_run,
                "started_at": now_iso(),
                "status": "running",
                "changes": [],
                "skipped": [],
                "errors": [],
                "counts": {},
            }
            try:
                await self._run(report, dry_run)
                report["status"] = "ok" if not report["errors"] else "partial"
            except (SyncAbort, ProviderError) as exc:
                report["status"] = "failed"
                report["errors"].append(getattr(exc, "message", None) or str(exc))
            except Exception as exc:  # never let the scheduler die on a bug
                log.exception("listing sync crashed")
                report["status"] = "failed"
                report["errors"].append(f"{exc.__class__.__name__}: {exc}")
            report["finished_at"] = now_iso()
            if not dry_run:
                await self._save_report(report)
            log.info("listing sync %s: %d changes, %d errors", report["status"],
                     len(report["changes"]), len(report["errors"]))
            return report

    async def _save_report(self, report: dict):
        await self.db.insert("sync_runs", report)
        runs = await self.db.list("sync_runs", sort=("started_at", -1))
        for old in runs[30:]:
            await self.db.delete("sync_runs", old["id"])

    # ------------------------------------------------------------ core
    async def _run(self, report: dict, dry_run: bool):
        changes, skipped = report["changes"], report["skipped"]
        names = agent_names()

        # 1. Agent profiles. All of them or nothing.
        wanted = profiles()
        agents = await providers.apify_agents(wanted)
        got = [a for a in agents if a.get("name")]
        if len(got) < len(wanted):
            raise SyncAbort(f"Only {len(got)} of {len(wanted)} agent profiles came back; nothing changed")

        active: Dict[str, dict] = {}
        agent_rentals: Dict[str, dict] = {}
        sold: Dict[str, dict] = {}
        cutoff = (datetime.now(timezone.utc) - timedelta(days=sold_window_days())).date().isoformat()
        for a in got:
            for e in a.get("activeListingsHistory") or (a.get("forSaleListings") or {}).get("listings") or []:
                if e.get("zpid"):
                    active.setdefault(str(e["zpid"]), e)
            for e in a.get("rentalListingsHistory") or (a.get("forRentListings") or {}).get("listings") or []:
                if e.get("zpid"):
                    agent_rentals.setdefault(str(e["zpid"]), e)
            for s in a.get("pastSalesHistory") or []:
                if not s.get("zpid") or "Seller" not in (s.get("representedList") or []):
                    continue
                if (s.get("transaction_date") or "") < cutoff:
                    continue
                sold.setdefault(str(s["zpid"]), s)
        for z in active:
            sold.pop(z, None)  # sold earlier, relisted now: the active listing wins
        report["counts"] = {"active": len(active), "agent_rentals": len(agent_rentals), "sold": len(sold)}

        rows = await self.db.list("properties")
        by_zpid = {str(r["zpid"]): r for r in rows if r.get("zpid")}
        by_addr = {norm_addr(r.get("address"), r.get("city")): r for r in rows}

        def find(zpid, street, city):
            return by_zpid.get(zpid) or by_addr.get(norm_addr(street, city))

        patches: Dict[str, dict] = {}  # row id -> patch
        labels: Dict[str, str] = {}

        def patch(row, **fields):
            p = patches.setdefault(row["id"], {})
            p.update(fields)
            labels[row["id"]] = row.get("address") or row["id"]

        detail_wanted: Dict[str, dict] = {}  # zpid -> {"url", "why", "row", "entry"}
        touched = set()

        # 2. Active for-sale listings from the profiles.
        for z, e in active.items():
            addr = e.get("address") or {}
            row = find(z, addr.get("line1"), addr.get("city"))
            if row is None:
                detail_wanted[z] = {"url": zurl(e.get("listing_url"), z), "why": "new_sale", "entry": e}
                continue
            touched.add(row["id"])
            if row.get("status") == "draft":
                continue
            if not row.get("zpid"):
                patch(row, zpid=z)
            price = money(e.get("price"))
            if price and price != row.get("price"):
                patch(row, price=price)
                changes.append(f"{row['address']}: price {fmt_price(row.get('price'))} -> {fmt_price(price)}")
            if row.get("status") != "live" or row.get("listing_type") != "sale":
                patch(row, status="live", listing_type="sale")
                changes.append(f"{row['address']}: {row.get('status')} -> live (for sale)")
            if row.get("sync_misses"):
                patch(row, sync_misses=0)

        # 3. Recent sales where our agent represented the seller.
        for z, s in sold.items():
            row = find(z, s.get("street_address"), s.get("city"))
            if row is None:
                detail_wanted[z] = {"url": zurl(s.get("home_details_url"), z), "why": "new_sold", "entry": s}
                continue
            if row.get("listing_type") == "rent":
                # Sold by us once, managed as a rental now (160 Roberta Rd). The old sale
                # must not overwrite the live rental; the rental re-check handles it.
                continue
            touched.add(row["id"])
            if row.get("status") == "draft":
                continue
            if not row.get("zpid"):
                patch(row, zpid=z)
            price = money(s.get("price"))
            if row.get("status") != "sold":
                patch(row, status="sold", listing_type="sale")
                changes.append(f"{row['address']}: {row.get('status')} -> sold {fmt_price(price)}")
            elif price and price != row.get("price"):
                changes.append(f"{row['address']}: sold price {fmt_price(row.get('price'))} -> {fmt_price(price)}")
            if price and price != row.get("price"):
                patch(row, price=price)
            if s.get("transaction_date") and s["transaction_date"] != row.get("sold_date"):
                patch(row, sold_date=s["transaction_date"])

        # 4. Rentals filed under an agent (usually none; Culver files rentals under the company).
        for z, e in agent_rentals.items():
            addr = e.get("address") or {}
            row = find(z, addr.get("line1"), addr.get("city"))
            if row is None:
                detail_wanted[z] = {"url": zurl(e.get("listing_url"), z), "why": "new_rent", "entry": e}
            else:
                touched.add(row["id"])

        # 5. Managed listings that dropped off the profiles, and every live rental.
        for row in rows:
            z = str(row.get("zpid") or "")
            if not z or row["id"] in touched or z in detail_wanted or row.get("status") == "draft":
                continue
            ours = (row.get("listing_agent") or "").lower() in names
            if row.get("listing_type") == "sale" and row.get("status") in ("live", "pending") and ours:
                detail_wanted[z] = {"url": zurl(row.get("source_url"), z), "why": "recheck_sale", "row": row}
            elif row.get("listing_type") == "rent" and row.get("status") == "live":
                detail_wanted[z] = {"url": zurl(row.get("source_url"), z), "why": "recheck_rent", "row": row}

        # 6. One detail call for everything above.
        details: Dict[str, dict] = {}
        detail_failed = False
        if detail_wanted:
            urls = [w["url"] for w in detail_wanted.values() if w["url"]]
            report["counts"]["detail_lookups"] = len(urls)
            try:
                items = await providers.apify_fetch(urls=urls)
            except ProviderError as exc:
                report["errors"].append(f"Detail lookups failed, nothing re-checked: {exc.message}")
                items, detail_failed = [], True
            for it in items:
                if it.get("zpid") and it.get("isValid") is not False:
                    details[str(it["zpid"])] = it

        new_docs: List[dict] = []
        for z, w in detail_wanted.items():
            it = details.get(z)
            why = w["why"]
            if detail_failed:
                break
            if why.startswith("new_"):
                if it is None:
                    skipped.append(f"zpid {z}: provider returned no detail")
                    continue
                if not is_our_agent(it):
                    who = ", ".join(sorted(item_agents(it))) or (it.get("broker") or {}).get("name") or "unknown"
                    skipped.append(f"{(it.get('listingAddress') or {}).get('street') or z}: listed by {who}")
                    continue
                new_docs.append(self._new_doc(it, why, w.get("entry") or {}))
                continue

            row = w["row"]
            status = (it or {}).get("listingStatus") or ""
            if why == "recheck_rent":
                if status == "forRent":
                    price = money((it.get("listingPrice") or {}).get("amount"))
                    if price and price != row.get("price"):
                        patch(row, price=price)
                        changes.append(f"{row['address']}: rent {fmt_price(row.get('price'))} -> {fmt_price(price)}")
                    if row.get("sync_misses"):
                        patch(row, sync_misses=0)
                else:
                    self._miss(row, patch, changes, f"no longer for rent ({status or 'no data'})")
                continue

            # recheck_sale
            if status == "sold" or status == "recentlySold":
                price = money(it.get("lastSoldPrice"))
                patch(row, status="sold", sync_misses=0, **({"price": price} if price else {}))
                changes.append(f"{row['address']}: {row.get('status')} -> sold {fmt_price(price)}")
            elif status == "pending":
                if row.get("status") != "pending":
                    patch(row, status="pending", sync_misses=0)
                    changes.append(f"{row['address']}: {row.get('status')} -> pending")
            elif status == "forSale" and is_our_agent(it):
                price = money((it.get("listingPrice") or {}).get("amount"))
                if price and price != row.get("price"):
                    patch(row, price=price)
                    changes.append(f"{row['address']}: price {fmt_price(row.get('price'))} -> {fmt_price(price)}")
                if row.get("sync_misses"):
                    patch(row, sync_misses=0)
            else:
                reason = f"no longer listed by our agents ({status or 'no data'})"
                self._miss(row, patch, changes, reason)

        report["counts"]["new"] = len(new_docs)
        report["counts"]["updated"] = len(patches)
        if dry_run:
            for d in new_docs:
                changes.append(f"{d['address']}: new {d['status']} {d['listing_type']} listing {fmt_price(d.get('price'))}")
            return

        # 7. Write.
        stamp = now_iso()
        for row_id, p in patches.items():
            p["last_synced_at"] = stamp
            p["updated_at"] = stamp
            await self.db.update("properties", row_id, p)
        for doc in new_docs:
            await self._insert_new(doc, report)

    def _miss(self, row, patch, changes, reason):
        misses = int(row.get("sync_misses") or 0) + 1
        if misses >= miss_threshold():
            patch(row, status="off-market", sync_misses=misses)
            changes.append(f"{row['address']}: {row.get('status')} -> off-market, {reason}")
        else:
            patch(row, sync_misses=misses)
            changes.append(f"{row['address']}: {reason}; will retire it if still missing next run")

    def _new_doc(self, item: dict, why: str, entry: dict) -> dict:
        data = providers.normalise(item)
        doc = {k: data.get(k) for k in PROPERTY_FIELDS if k in data}
        doc["featured"] = False
        for k in ("address", "city"):
            if doc.get(k) and doc[k].isupper():  # '708 CRESTWOOD DRIVE' from some MLS feeds
                doc[k] = " ".join(w if any(c.isdigit() for c in w) else w.capitalize() for w in doc[k].split())
        if why == "new_sold":
            doc["status"] = "sold"
            doc["listing_type"] = "sale"
            doc["price"] = money(entry.get("price")) or money(item.get("lastSoldPrice")) or doc.get("price")
            doc["sold_date"] = entry.get("transaction_date")
        else:
            doc["status"] = "live"
            doc["listing_type"] = "rent" if why == "new_rent" else "sale"
            if entry.get("price"):
                doc["price"] = money(entry.get("price"))
        doc["features"] = doc.get("features") or []
        # Listing photos belong to the listing brokerage. Only copy Culver's own.
        doc["_photo_urls"] = [resized(u) for u in (data.get("photos") or [])][: max_photos()] \
            if is_culver_brokered(item) else []
        doc["photos"] = []
        return doc

    async def _insert_new(self, doc: dict, report: dict):
        urls = doc.pop("_photo_urls", [])
        base = slugify(f"{doc['address']} {doc['city']}")
        slug, n = base, 2
        while await self.db.find_one("properties", {"slug": slug}):
            slug, n = f"{base}-{n}", n + 1
        if urls:
            res = await media.fetch_remote_images(urls, slug, max_count=max_photos())
            doc["photos"] = [{"url": u, "cover": i == 0, "hidden": False} for i, u in enumerate(res["paths"])]
            if res["errors"]:
                report["errors"].append(f"{doc['address']}: {len(res['errors'])} photo(s) failed; first: {res['errors'][0][:120]}")
        ts = now_iso()
        doc.update({
            "id": str(uuid.uuid4()), "slug": slug, "created_at": ts, "updated_at": ts,
            "imported_at": ts, "last_synced_at": ts, "sync_misses": 0, "source": "daily-sync",
        })
        await self.db.insert("properties", doc)
        report["changes"].append(
            f"{doc['address']}: new {doc['status']} {doc['listing_type']} listing {fmt_price(doc.get('price'))}, "
            f"{len(doc['photos'])} photos"
        )

    # ------------------------------------------------------------ scheduling
    async def last_success(self) -> Optional[datetime]:
        runs = await self.db.list("sync_runs", {"status": {"$in": ["ok", "partial"]}}, sort=("started_at", -1), limit=1)
        return datetime.fromisoformat(runs[0]["started_at"]) if runs else None

    def _next_slot(self, after: datetime) -> datetime:
        local = after.astimezone(sync_tz())
        slot = local.replace(hour=sync_hour(), minute=0, second=0, microsecond=0)
        if slot <= local:
            slot += timedelta(days=1)
        return slot

    async def scheduler(self):
        """Run once a day at SYNC_HOUR local time. Catch up after a missed day."""
        await asyncio.sleep(60)  # let the server finish starting
        last = await self.last_success()
        if last is None or datetime.now(timezone.utc) - last > timedelta(hours=26):
            await self._scheduled_run("catch-up")
        while True:
            self.next_run = self._next_slot(datetime.now(timezone.utc))
            await asyncio.sleep(max(1.0, (self.next_run - datetime.now(timezone.utc)).total_seconds()))
            await self._scheduled_run("schedule")

    async def _scheduled_run(self, trigger: str):
        try:
            await self.run(trigger)
        except RuntimeError:
            pass  # a manual run is already in progress
        except Exception:
            log.exception("scheduled listing sync failed")


# ---------------------------------------------------------------- CLI
if __name__ == "__main__":
    import json
    import sys
    from pathlib import Path

    from dotenv import load_dotenv

    load_dotenv(Path(__file__).resolve().parent / ".env")
    logging.basicConfig(level=logging.INFO)
    from store import make_store

    result = asyncio.run(ListingSync(make_store()).run("cli", dry_run="--apply" not in sys.argv))
    print(json.dumps(result, indent=1))
