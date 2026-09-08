"""
Media storage.

Two ways an image gets into `backend/uploads/`:
  * `fetch_remote_images()` — pull provider-supplied photo URLs onto our own disk, so a
    published listing never depends on a third-party CDN URL that can rotate or start
    refusing hotlinks.
  * `save_upload()` — an admin uploading a file through the dashboard.

Both return `/api/uploads/...` paths, which is what `Photo.url` stores.

These take URLs and files that arrive over the network, so every fetch is fenced:
https only, a host allowlist, a byte ceiling, a timeout, a content-type check, and
filenames we generate ourselves. Without the allowlist in particular this is a
server-side request forgery hole — an authenticated caller could otherwise point it at
cloud metadata endpoints or hosts inside the deployment's network.
"""
import os
import uuid
from pathlib import Path
from typing import List, Optional
from urllib.parse import urlparse

import httpx

ROOT = Path(__file__).resolve().parent
UPLOADS = ROOT / "uploads"
LISTINGS_DIR = UPLOADS / "listings"

# Hosts we will pull images from. Suffix match on the registered domain.
# Zillow serves listing photos from *.zillowstatic.com.
DEFAULT_ALLOWED_HOSTS = ("zillowstatic.com",)
# Read at call time: this module is imported before server.py loads the .env file.
def allowed_hosts() -> tuple:
    raw = os.environ.get("IMAGE_HOST_ALLOWLIST", ",".join(DEFAULT_ALLOWED_HOSTS))
    return tuple(h.strip().lower() for h in raw.split(",") if h.strip())


def max_image_bytes() -> int:
    return int(os.environ.get("MAX_IMAGE_BYTES", 12 * 1024 * 1024))


def max_photos_per_listing() -> int:
    return int(os.environ.get("MAX_PHOTOS_PER_LISTING", 24))


def fetch_timeout() -> float:
    return float(os.environ.get("IMAGE_FETCH_TIMEOUT", 20))

CONTENT_TYPE_EXT = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}


class MediaError(Exception):
    """Raised when an image cannot be stored. Carries a message safe to show an admin."""


def _host_allowed(host: str) -> bool:
    host = (host or "").lower()
    return any(host == h or host.endswith("." + h) for h in allowed_hosts())


def _safe_segment(value: str) -> str:
    """A directory name we control — never a caller-supplied path fragment."""
    cleaned = "".join(c for c in (value or "") if c.isalnum() or c in "-_").strip("-_")
    return cleaned[:80] or uuid.uuid4().hex[:12]


def _ext_for(content_type: str) -> Optional[str]:
    return CONTENT_TYPE_EXT.get((content_type or "").split(";")[0].strip().lower())


async def _download_one(client: httpx.AsyncClient, url: str, dest_dir: Path, index: int) -> str:
    parsed = urlparse(url)
    if parsed.scheme != "https":
        raise MediaError(f"Refusing non-https image URL: {parsed.scheme or 'no scheme'}")
    if not _host_allowed(parsed.hostname or ""):
        raise MediaError(f"Image host not allowed: {parsed.hostname}")

    async with client.stream("GET", url) as resp:
        if resp.status_code != 200:
            raise MediaError(f"Image request returned {resp.status_code}")
        ext = _ext_for(resp.headers.get("content-type", ""))
        if not ext:
            raise MediaError(f"Not an image: content-type {resp.headers.get('content-type')!r}")

        cap = max_image_bytes()
        declared = resp.headers.get("content-length")
        if declared and int(declared) > cap:
            raise MediaError(f"Image is {int(declared)} bytes, over the {cap} limit")

        dest_dir.mkdir(parents=True, exist_ok=True)
        dest = dest_dir / f"{index:02d}{ext}"
        size = 0
        with dest.open("wb") as fh:
            async for chunk in resp.aiter_bytes():
                size += len(chunk)
                if size > cap:
                    fh.close()
                    dest.unlink(missing_ok=True)
                    raise MediaError(f"Image exceeded the {cap} byte limit while downloading")
                fh.write(chunk)

    return f"/api/uploads/listings/{dest_dir.name}/{dest.name}"


async def fetch_remote_images(urls: List[str], slug: str, max_count: Optional[int] = None) -> dict:
    """
    Copy remote images into backend/uploads/listings/<slug>/.

    Returns {"paths": [...local urls...], "errors": [...strings...]}. A single bad image
    never fails the whole listing — the caller decides what to do with a partial set.
    Anything already pointing at /api/uploads is passed through untouched, so re-running
    over an already-imported listing is a no-op rather than a re-download.
    """
    dest_dir = LISTINGS_DIR / _safe_segment(slug)
    limit = max_count or max_photos_per_listing()
    paths: List[str] = []
    errors: List[str] = []

    remote = []
    for u in urls:
        if not u:
            continue
        if u.startswith("/api/uploads/"):
            paths.append(u)
        else:
            remote.append(u)

    remote = remote[:limit]
    if not remote:
        return {"paths": paths, "errors": errors}

    async with httpx.AsyncClient(
        timeout=fetch_timeout(),
        follow_redirects=True,
        headers={"User-Agent": "culver-realty-site/1.0"},
    ) as client:
        for i, url in enumerate(remote, start=len(paths) + 1):
            try:
                paths.append(await _download_one(client, url, dest_dir, i))
            except MediaError as exc:
                errors.append(f"{url}: {exc}")
            except httpx.HTTPError as exc:
                errors.append(f"{url}: request failed ({exc.__class__.__name__})")

    return {"paths": paths, "errors": errors}


async def save_upload(filename: str, content_type: str, read_chunk) -> str:
    """
    Store an admin upload. `read_chunk` is an async callable returning bytes (b"" at EOF),
    so this works with FastAPI's UploadFile without importing it here.

    The stored name is generated. The client's filename is only consulted for its
    extension, and only when the content type is ambiguous, so a caller cannot steer
    the write path.
    """
    ext = _ext_for(content_type)
    if not ext:
        suffix = Path(filename or "").suffix.lower()
        ext = suffix if suffix in {".jpg", ".jpeg", ".png", ".webp", ".gif"} else None
        if ext == ".jpeg":
            ext = ".jpg"
    if not ext:
        raise MediaError("Only JPEG, PNG, WebP and GIF images can be uploaded")

    dest_dir = UPLOADS / "admin"
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / f"{uuid.uuid4().hex}{ext}"

    cap = max_image_bytes()
    size = 0
    with dest.open("wb") as fh:
        while True:
            chunk = await read_chunk()
            if not chunk:
                break
            size += len(chunk)
            if size > cap:
                fh.close()
                dest.unlink(missing_ok=True)
                raise MediaError(f"File is larger than the {cap // (1024 * 1024)}MB limit")
            fh.write(chunk)

    if size == 0:
        dest.unlink(missing_ok=True)
        raise MediaError("That file was empty")

    return f"/api/uploads/admin/{dest.name}"
